import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const execFileAsync = promisify(execFile);

const UKURAN = 512; // stiker WhatsApp selalu 512x512
const BATAS_BYTE = 100 * 1024; // stiker statis maksimal ~100 KB

// Batas media yang diterima dari pengguna (mencegah bot dibuat berat)
const MAKS_GAMBAR = 5 * 1024 * 1024; // 5 MB
const MAKS_VIDEO = 10 * 1024 * 1024; // 10 MB
const MAKS_DETIK_VIDEO = 20;
const MAKS_PIXEL = 40_000_000; // ~6300 x 6300

/** fileLength dari WhatsApp bisa berupa angka, string, atau objek Long. */
const keAngka = n => Number(n?.toNumber?.() ?? n ?? 0);

/**
 * Tanam nama pack & author ke dalam file WebP (chunk EXIF), supaya
 * WhatsApp menampilkannya di info stiker.
 */
function tanamExif(webp, pack, author) {
  const json = Buffer.from(
    JSON.stringify({
      "sticker-pack-id": crypto.randomUUID(),
      "sticker-pack-name": pack,
      "sticker-pack-publisher": author,
      emojis: [""]
    })
  );
  const kepala = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);
  const exif = Buffer.concat([kepala, json]);
  exif.writeUInt32LE(json.length, 14);

  const chunkExif = Buffer.alloc(8 + exif.length + (exif.length % 2));
  chunkExif.write("EXIF", 0);
  chunkExif.writeUInt32LE(exif.length, 4);
  exif.copy(chunkExif, 8);

  // File WebP = "RIFF" + ukuran + "WEBP" + deretan chunk. Kita butuh chunk "VP8X"
  // di depan (penanda ada metadata), lalu EXIF ditaruh di paling akhir.
  let chunk = webp.subarray(12);
  let vp8x;
  if (chunk.toString("ascii", 0, 4) === "VP8X") {
    vp8x = Buffer.from(chunk.subarray(0, 18));
    chunk = chunk.subarray(18);
  } else {
    vp8x = Buffer.alloc(18);
    vp8x.write("VP8X", 0);
    vp8x.writeUInt32LE(10, 4);
    vp8x.writeUIntLE(UKURAN - 1, 12, 3);
    vp8x.writeUIntLE(UKURAN - 1, 15, 3);
  }
  vp8x[8] |= 0x08; // tandai "ada EXIF"

  const isi = Buffer.concat([Buffer.from("WEBP"), vp8x, chunk, chunkExif]);
  const riff = Buffer.alloc(8);
  riff.write("RIFF", 0);
  riff.writeUInt32LE(isi.length, 4);
  return Buffer.concat([riff, isi]);
}

/** Ubah gambar (Buffer) menjadi stiker WebP 512x512. fit: "contain" (utuh) atau "cover" (dipotong). */
export async function buatStiker(gambar, { pack, author, fit = "contain" }) {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new Error("Modul 'sharp' belum terpasang. Jalankan: npm install sharp");
  }

  // Turunkan kualitas bertahap sampai ukuran file muat
  let webp;
  for (const quality of [80, 60, 40, 20]) {
    webp = await sharp(gambar, { limitInputPixels: MAKS_PIXEL })
      .resize(UKURAN, UKURAN, { fit, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality })
      .toBuffer();
    if (webp.length <= BATAS_BYTE) break;
  }

  return tanamExif(webp, pack, author);
}

/**
 * Ubah video (Buffer) jadi stiker WebP animasi lewat ffmpeg.
 * Catatan: stiker video tidak dikasih EXIF pack/author (beda dari stiker gambar).
 */
async function buatStikerVideo(buffer) {
  const id = crypto.randomUUID();
  const inPath = path.join(os.tmpdir(), `sticker_in_${id}.mp4`);
  const outPath = path.join(os.tmpdir(), `sticker_out_${id}.webp`);
  fs.writeFileSync(inPath, buffer);

  const filter =
    "fps=fps=10,scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease," +
    "pad=512:512:-1:-1:color=0x00000000";

  // execFile = tanpa shell, jadi tidak ada celah injeksi perintah. Timeout menghentikan ffmpeg yang menggantung.
  const args = [
    "-nostdin", "-loglevel", "error",
    "-i", inPath,
    "-vcodec", "libwebp",
    "-filter:v", filter,
    "-lossless", "0", "-q:v", "50", "-loop", "0", "-an",
    "-t", "00:00:06",
    "-y", outPath
  ];

  try {
    await execFileAsync("ffmpeg", args, { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 });
    if (!fs.existsSync(outPath)) throw new Error("File stiker video tidak terbentuk.");
    return fs.readFileSync(outPath);
  } finally {
    if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}

export default {
  name: "sticker",
  aliases: ["s", "stiker"],
  category: "tools",
  description: "Ubah gambar/video menjadi stiker",
  usage: "[crop]",
  example: "sticker crop",
  cooldown: 10, // detik per pengguna

  async run(ctx) {
    // Gambar/video bisa dikirim dengan caption .sticker, atau di-reply dengan .sticker
    let target = null;
    let info = null; // isi imageMessage / videoMessage yang dipakai
    let video = false;

    const langsung = ctx.content?.imageMessage || ctx.content?.videoMessage;
    const kutipan = ctx.quoted?.message?.imageMessage || ctx.quoted?.message?.videoMessage;

    if (langsung) {
      target = ctx.msg;
      info = langsung;
      video = Boolean(ctx.content.videoMessage);
    } else if (kutipan) {
      target = {
        key: { remoteJid: ctx.jid, id: ctx.quoted.id, participant: ctx.quoted.sender },
        message: ctx.quoted.message
      };
      info = kutipan;
      video = Boolean(ctx.quoted.message.videoMessage);
    }

    if (!target) {
      return ctx.reply(
        `🖼️ Kirim gambar/video dengan caption *${ctx.prefix}sticker*, atau reply dengan *${ctx.prefix}sticker*.\n` +
          `Tambah *crop* kalau mau gambar dipotong memenuhi stiker.`
      );
    }

    // Cek ukuran SEBELUM diunduh (data ini dari pengirim, jadi dicek lagi setelah diunduh)
    const batas = video ? MAKS_VIDEO : MAKS_GAMBAR;
    const batasMB = batas / 1024 / 1024;
    if (keAngka(info.fileLength) > batas) {
      return ctx.reply(`❌ File terlalu besar (maksimal ${batasMB} MB).`);
    }
    if (video && Number(info.seconds) > MAKS_DETIK_VIDEO) {
      return ctx.reply(`❌ Video terlalu panjang (maksimal ${MAKS_DETIK_VIDEO} detik).`);
    }

    const media = await downloadMediaMessage(
      target,
      "buffer",
      {},
      { logger: ctx.sock.logger, reuploadRequest: ctx.sock.updateMediaMessage }
    );

    if (media.length > batas) {
      return ctx.reply(`❌ File terlalu besar (maksimal ${batasMB} MB).`);
    }

    let stiker;
    if (video) {
      try {
        stiker = await buatStikerVideo(media);
      } catch {
        return ctx.reply("❌ Gagal bikin stiker video. Pastikan *ffmpeg* sudah terpasang di server bot.");
      }
    } else {
      stiker = await buatStiker(media, {
        pack: ctx.config.stickerPack,
        author: ctx.config.stickerAuthor,
        fit: ctx.args[0]?.toLowerCase() === "crop" ? "cover" : "contain"
      });
    }

    await ctx.sock.sendMessage(ctx.jid, { sticker: stiker }, { quoted: ctx.msg });
  }
};
