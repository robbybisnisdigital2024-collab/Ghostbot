import {
  getContentType,
  jidDecode,
  normalizeMessageContent
} from "@whiskeysockets/baileys";
import { config } from "../config.js";

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Nomor owner yang sudah dibersihkan (hanya angka). */
export const OWNER_NUMBER = String(config.ownerNumber).replace(/\D/g, "");

/** "628123:5@s.whatsapp.net" -> "628123" */
export const numberFromJid = jid => jidDecode(jid)?.user ?? "";

// ───────────────────────── Isi pesan ─────────────────────────

/** Buka pembungkus pesan (ephemeral, view once, dll) supaya isinya mudah dibaca. */
export const getContent = msg => normalizeMessageContent(msg.message) ?? null;

export function getText(content) {
  if (!content) return "";
  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    ""
  );
}

/** Ambil pesan yang di-reply (kalau ada). */
export function getQuoted(content) {
  const type = getContentType(content);
  const info = content?.[type]?.contextInfo;
  if (!info?.quotedMessage) return null;

  const message = normalizeMessageContent(info.quotedMessage);
  return {
    id: info.stanzaId,
    sender: info.participant,
    message,
    text: getText(message)
  };
}

/** messageTimestamp bisa berupa angka atau objek Long -> jadikan detik biasa. */
export function toSeconds(ts) {
  if (typeof ts === "number") return ts;
  return ts?.toNumber?.() ?? Number(ts);
}

// ───────────────────────── Pengirim ─────────────────────────

/**
 * Ubah JID/LID pengirim menjadi nomor telepon (angka saja).
 * WhatsApp kini sering memakai LID (xxx@lid) sebagai ganti nomor,
 * jadi kita cari pasangan nomornya. Hasil "" berarti tidak ketemu.
 */
export async function resolveNumber(sock, ...jids) {
  for (const jid of jids) {
    if (jid?.endsWith("@s.whatsapp.net")) return numberFromJid(jid);
  }
  for (const jid of jids) {
    if (!jid?.endsWith("@lid")) continue;
    try {
      const pn = await sock.signalRepository?.lidMapping?.getPNForLID(jid);
      if (pn) return numberFromJid(pn);
    } catch {
      // abaikan, coba JID berikutnya
    }
  }
  return "";
}

// ───────────────────────── Grup ─────────────────────────

const cacheGrup = new Map();
const CACHE_MS = 30_000;

/** Ambil metadata grup (di-cache 30 detik) dan cek apakah pengirim admin. */
export async function getGroupInfo(sock, groupJid, senderJids) {
  let cache = cacheGrup.get(groupJid);
  if (!cache || Date.now() - cache.at > CACHE_MS) {
    cache = { at: Date.now(), metadata: await sock.groupMetadata(groupJid) };
    cacheGrup.set(groupJid, cache);
  }
  const { metadata } = cache;

  const ids = new Set(senderJids.filter(Boolean).map(numberFromJid));
  const isAdmin = metadata.participants.some(
    p =>
      p.admin &&
      [p.id, p.lid, p.phoneNumber].some(j => j && ids.has(numberFromJid(j)))
  );

  return { metadata, isAdmin };
}

// ───────────────────────── Format ─────────────────────────

export function formatUptime(detik) {
  const d = Math.floor(detik / 86400);
  const h = Math.floor((detik % 86400) / 3600);
  const m = Math.floor((detik % 3600) / 60);
  const s = Math.floor(detik % 60);
  return [d && `${d} hari`, h && `${h} jam`, m && `${m} menit`, `${s} detik`]
    .filter(Boolean)
    .join(" ");
}
