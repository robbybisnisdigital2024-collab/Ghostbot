import { DisconnectReason } from "@whiskeysockets/baileys";
import { logger } from "../lib/logger.js";
import { handleMessage } from "./message.js";

/**
 * Pasang semua "pendengar" kejadian dari WhatsApp.
 * restart = fungsi untuk menyambung ulang bot (dipanggil kalau koneksi putus).
 */
export function registerEvents(sock, { saveCreds, restart }) {
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("");
      console.log("╭──────────────────────╮");
      console.log("│ ✅ ROBBY BOT ONLINE   │");
      console.log("╰──────────────────────╯");
      console.log("");
    }

    if (connection === "close") {
      const status = lastDisconnect?.error?.output?.statusCode;

      if (status === DisconnectReason.loggedOut) {
        console.log("❌ Session logout. Hapus folder 'session' lalu jalankan ulang bot.");
        return process.exit(1);
      }

      if (status === DisconnectReason.connectionReplaced) {
        console.log("❌ Akun ini dipakai di tempat lain. Pastikan bot hanya jalan satu kali.");
        return process.exit(1);
      }

      console.log("🔄 Reconnecting...");
      setTimeout(() => {
        restart().catch(err => logger.error("Gagal menyambung ulang:", err));
      }, 3000);
    }
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;

    // Tiap pesan diproses sendiri-sendiri supaya perintah yang lambat
    // (mis. bikin stiker) tidak menahan pesan orang lain.
    for (const message of messages) {
      handleMessage(sock, message).catch(error => {
        logger.error("Message error:", error);
      });
    }
  });
}
