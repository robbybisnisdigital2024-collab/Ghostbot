import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { config } from "../config.js";
import { db } from "../lib/database.js";
import { logger } from "../lib/logger.js";
import {
  OWNER_NUMBER,
  getContent,
  getGroupInfo,
  getQuoted,
  getText,
  numberFromJid,
  resolveNumber,
  toSeconds
} from "../lib/utils.js";
import { logCommand, logCommandError } from "./logger.js";

const COMMANDS_DIR = fileURLToPath(new URL("../commands/", import.meta.url));
const MAX_UMUR_PESAN = 60; // detik. Pesan yang lebih lama (mis. saat bot offline) diabaikan.

const registry = new Map(); // nama / alias -> command
let daftar = []; // daftar command unik

// ───────────────────────── Memuat command ─────────────────────────

function* cariFile(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* cariFile(full);
    else if (entry.name.endsWith(".js")) yield full;
  }
}

/**
 * Baca semua file di folder /commands (termasuk subfolder).
 * Setiap file harus punya `export default { name, run, ... }`.
 * Mau tambah fitur? Cukup buat file baru di sana, tanpa mengubah kode lain.
 */
export async function loadCommands() {
  if (daftar.length) return daftar;

  for (const file of cariFile(COMMANDS_DIR)) {
    const nama = path.relative(COMMANDS_DIR, file);
    try {
      const cmd = (await import(pathToFileURL(file).href)).default;

      if (!cmd?.name || typeof cmd.run !== "function") {
        logger.warn(`Dilewati (isi file belum benar): commands/${nama}`);
        continue;
      }

      for (const alias of [cmd.name, ...(cmd.aliases ?? [])]) {
        const kunci = alias.toLowerCase();
        if (registry.has(kunci)) logger.warn(`Nama command bentrok: "${kunci}" (${nama})`);
        else registry.set(kunci, cmd);
      }
      daftar.push(cmd);
    } catch (err) {
      logger.error(`Gagal memuat commands/${nama}:`, err);
    }
  }

  daftar.sort((a, b) => a.name.localeCompare(b.name));
  logger.success(`${daftar.length} command dimuat`);
  return daftar;
}

// ───────────────────────── Memproses pesan ─────────────────────────

export async function handleMessage(sock, msg) {
  const { key } = msg;
  const jid = key.remoteJid;

  if (!msg.message || !jid) return;
  if (jid === "status@broadcast" || jid.endsWith("@newsletter")) return;
  if (Date.now() / 1000 - toSeconds(msg.messageTimestamp) > MAX_UMUR_PESAN) return;

  // 1. Baca teks & cari perintahnya
  const content = getContent(msg);
  const body = getText(content).trim();
  if (!body.startsWith(config.prefix)) return;

  const bagian = body.slice(config.prefix.length).trim().match(/^(\S+)\s*([\s\S]*)$/);
  if (!bagian) return;

  const commandName = bagian[1].toLowerCase();
  const text = bagian[2].trim(); // teks setelah nama perintah (baris baru tetap utuh)
  const command = registry.get(commandName);
  if (!command) return;

  // 2. Siapa pengirimnya?
  const isGroup = jid.endsWith("@g.us");
  const sender = key.fromMe ? sock.user?.id : isGroup ? key.participant : jid;
  const senderAlt = key.fromMe
    ? sock.user?.lid
    : isGroup
      ? key.participantAlt
      : key.remoteJidAlt;

  const senderNumber = await resolveNumber(sock, sender, senderAlt);
  const isOwner = Boolean(key.fromMe) || (senderNumber !== "" && senderNumber === OWNER_NUMBER);

  // 3. Siapkan "ctx": semua info yang dibutuhkan sebuah command
  let infoGrup;
  const ctx = {
    sock,
    msg,
    config,
    prefix: config.prefix,
    jid,
    isGroup,
    sender,
    senderNumber,
    pushName: msg.pushName ?? "",
    isOwner,
    body,
    text,
    args: text.split(/\s+/).filter(Boolean),
    commandName,
    command,
    commands: daftar,
    content,
    quoted: getQuoted(content),
    reply: (teks, extra = {}) => sock.sendMessage(jid, { text: teks, ...extra }, { quoted: msg }),
    getGroup: () => (infoGrup ??= getGroupInfo(sock, jid, [sender, senderAlt]))
  };

  // 4. Cek izin lalu jalankan
  logCommand(ctx);
  db.trackCommand(senderNumber || numberFromJid(sender), ctx.pushName);

  try {
    if (command.ownerOnly && !isOwner) {
      return await ctx.reply("⛔ Perintah ini khusus owner bot.");
    }
    if ((command.groupOnly || command.adminOnly) && !isGroup) {
      return await ctx.reply("⛔ Perintah ini hanya bisa dipakai di dalam grup.");
    }
    if (command.adminOnly && !isOwner) {
      const { isAdmin } = await ctx.getGroup();
      if (!isAdmin) return await ctx.reply("⛔ Perintah ini khusus admin grup.");
    }

    await command.run(ctx);
  } catch (err) {
    logCommandError(ctx, err);
    await ctx.reply("❌ Terjadi kesalahan saat menjalankan perintah.").catch(() => {});
  }
}
