import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger.js";

// Database sederhana berbentuk file JSON di folder /data
const FILE = fileURLToPath(new URL("../data/database.json", import.meta.url));

const bawaan = () => ({ users: {}, stats: { commands: 0 } });

function muat() {
  try {
    return { ...bawaan(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch (err) {
    if (err.code !== "ENOENT") logger.warn("Database rusak, dibuat ulang:", err.message);
    return bawaan();
  }
}

const data = muat();

function simpan() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE + ".tmp", JSON.stringify(data, null, 2));
    fs.renameSync(FILE + ".tmp", FILE);
  } catch (err) {
    logger.error("Gagal menyimpan database:", err.message);
  }
}

export const db = {
  data,

  /** Catat bahwa seorang user memakai sebuah perintah. */
  trackCommand(id, nama = "") {
    if (!id) return;
    const sekarang = Date.now();
    const user = (data.users[id] ??= { name: nama, commands: 0, firstSeen: sekarang });
    if (nama) user.name = nama;
    user.commands++;
    user.lastSeen = sekarang;
    data.stats.commands++;
    simpan();
  },

  totalUsers: () => Object.keys(data.users).length
};
