import { config } from "../config.js";

const WARNA = {
  reset: "\x1b[0m",
  abu: "\x1b[90m",
  merah: "\x1b[31m",
  hijau: "\x1b[32m",
  kuning: "\x1b[33m",
  biru: "\x1b[36m"
};

function jam() {
  return new Date()
    .toLocaleTimeString("id-ID", { hour12: false, timeZone: config.timezone })
    .replace(/\./g, ":");
}

function cetak(warna, label, args) {
  console.log(`${WARNA.abu}${jam()}${WARNA.reset} ${warna}${label}${WARNA.reset}`, ...args);
}

export const logger = {
  info: (...a) => cetak(WARNA.biru, "INFO ", a),
  success: (...a) => cetak(WARNA.hijau, "OK   ", a),
  warn: (...a) => cetak(WARNA.kuning, "WARN ", a),
  error: (...a) => cetak(WARNA.merah, "ERROR", a)
};
