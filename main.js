import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import P from "pino";
import { registerEvents } from "./handlers/events.js";
import { loadCommands } from "./handlers/message.js";
import { logger } from "./lib/logger.js";
import { OWNER_NUMBER, sleep } from "./lib/utils.js";

export async function startBot() {
  await loadCommands();

  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" })
  });

  registerEvents(sock, { saveCreds, restart: startBot });

  if (!state.creds.registered) {
    await mintaPairingCode(sock);
  }

  return sock;
}

async function mintaPairingCode(sock) {
  if (!/^[1-9]\d{7,14}$/.test(OWNER_NUMBER)) {
    logger.error("ownerNumber di config.js belum diisi dengan benar.");
    logger.error('Contoh: ownerNumber: "6281234567890" (kode negara + nomor, tanpa "+" dan tanpa 0 di depan)');
    process.exit(1);
  }

  await sleep(3000);
  console.log("📱 Meminta pairing code...");

  let code;
  try {
    code = await sock.requestPairingCode(OWNER_NUMBER);
  } catch (err) {
    logger.error("Gagal meminta pairing code:", err.message);
    logger.error("Cek koneksi internet lalu jalankan ulang bot.");
    process.exit(1);
  }
  code = code?.match(/.{1,4}/g)?.join("-") ?? code;

  console.log("");
  console.log("╭────────────────────╮");
  console.log("│ 🔑 PAIRING CODE    │");
  console.log("├────────────────────┤");
  const kiri = Math.floor((20 - code.length) / 2);
  console.log(`│${" ".repeat(kiri)}${code}${" ".repeat(20 - code.length - kiri)}│`);
  console.log("╰────────────────────╯");
  console.log("Buka WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon,");
  console.log("lalu masukkan kode di atas.");
  console.log("");
}
