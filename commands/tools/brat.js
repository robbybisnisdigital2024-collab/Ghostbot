import { buatStiker } from "./sticker.js";

// Server pihak ketiga. Teks yang diketik pengguna dikirim ke sini, jadi urutan = prioritas.
const SERVER = [
  teks => `https://api.siputzx.my.id/api/m/brat?text=${teks}`,
  teks => `https://aemt.me/brat?text=${teks}`,
  teks => `https://api.restapis.my.id/api/brat?text=${teks}`
];

const TIMEOUT_MS = 10_000;
const MAKS_BYTE = 2 * 1024 * 1024; // gambar dari server maksimal 2 MB
const MAKS_TEKS = 200;

/** Baca isi respons sambil dibatasi ukurannya (tidak percaya header content-length saja). */
async function bacaDenganBatas(res, batas) {
  const potongan = [];
  let total = 0;
  for await (const chunk of res.body) {
    total += chunk.length;
    if (total > batas) throw new Error("Respons terlalu besar");
    potongan.push(chunk);
  }
  return Buffer.concat(potongan);
}

async function buatBrat(teks) {
  const kode = encodeURIComponent(teks);

  for (const buatUrl of SERVER) {
    try {
      const res = await fetch(buatUrl(kode), { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) continue;

      const gambar = await bacaDenganBatas(res, MAKS_BYTE);

      // Kalau isinya bukan gambar valid, sharp melempar error -> coba server berikutnya
      return await buatStiker(gambar, { pack: "Ghost Bot", author: "Robby", fit: "contain" });
    } catch {
      // timeout / server mati / gambar rusak: lanjut ke server berikutnya
    }
  }
  return null;
}

export default {
  name: "brat",
  aliases: ["bratgen", "brats", "bratsticker"],
  category: "tools",
  description: "Membuat stiker dengan gaya font/cover album Brat",
  usage: "<teks>",
  example: "brat ghost bot",
  cooldown: 10, // detik per pengguna

  async run(ctx) {
    if (!ctx.text) {
      return ctx.reply(`⚠️ Harap masukkan teks!\nContoh: *${ctx.prefix}brat ghost bot*`);
    }
    if (ctx.text.length > MAKS_TEKS) {
      return ctx.reply(`❌ Teks terlalu panjang (maksimal ${MAKS_TEKS} karakter).`);
    }

    const stiker = await buatBrat(ctx.text);
    if (!stiker) {
      return ctx.reply("❌ Semua server API Brat sedang offline/bermasalah. Silakan coba lagi nanti.");
    }

    await ctx.sock.sendMessage(ctx.jid, { sticker: stiker }, { quoted: ctx.msg });
  }
};
