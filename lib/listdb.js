import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger.js";

const FILE = fileURLToPath(new URL("../data/list.json", import.meta.url));

export const MAKS_KEY = 30;
export const MAKS_ISI = 2000;
export const MAKS_ENTRI = 100;

const punya = (obj, key) => Object.hasOwn(obj, key);

function baca() {
  let mentah;

  try {
    mentah = fs.readFileSync(FILE, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") logger.warn("Gagal membaca list.json:", err.message);
    return {};
  }

  try {
    const data = JSON.parse(mentah);
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
    throw new Error("isi bukan objek");
  } catch (err) {
    logger.warn(`list.json rusak (${err.message}), disalin ke list.json.rusak`);
    try {
      fs.writeFileSync(`${FILE}.rusak`, mentah);
    } catch {
      // Abaikan kegagalan backup.
    }
    return {};
  }
}

function simpan(data) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const temp = `${FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(temp, FILE);
}

export function daftarKey(jid) {
  const data = baca();
  return punya(data, jid) && data[jid] && typeof data[jid] === "object"
    ? Object.keys(data[jid])
    : [];
}

export function ambil(jid, key) {
  const data = baca();
  if (!punya(data, jid) || !data[jid] || !punya(data[jid], key)) return null;
  return data[jid][key];
}

export function tulis(jid, key, isi) {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(key)) {
    return "Nama list hanya boleh berisi huruf, angka, underscore, atau tanda hubung.";
  }
  if (key.length > MAKS_KEY) return `Nama list maksimal ${MAKS_KEY} karakter.`;
  if (isi.length > MAKS_ISI) return `Isi pesan maksimal ${MAKS_ISI} karakter.`;

  const data = baca();
  const grup = punya(data, jid) && data[jid] && typeof data[jid] === "object"
    ? data[jid]
    : (data[jid] = {});

  if (!punya(grup, key) && Object.keys(grup).length >= MAKS_ENTRI) {
    return `Maksimal ${MAKS_ENTRI} list per chat. Hapus yang tidak terpakai dulu.`;
  }

  grup[key] = isi;
  simpan(data);
  return null;
}

export function hapus(jid, key) {
  const data = baca();
  if (!punya(data, jid) || !data[jid] || !punya(data[jid], key)) return false;

  delete data[jid][key];
  if (Object.keys(data[jid]).length === 0) delete data[jid];
  simpan(data);
  return true;
}
