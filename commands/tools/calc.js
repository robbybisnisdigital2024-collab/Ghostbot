/**
 * Kalkulator aman: membaca ekspresi dengan parser sendiri (TIDAK memakai eval),
 * jadi orang tidak bisa menyisipkan kode berbahaya lewat chat.
 * Mendukung: + - * / % ^ ( ) dan desimal dengan titik.
 */
export function evaluate(ekspresi) {
  const token =
    ekspresi
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/x/gi, "*")
      .match(/\d*\.?\d+|\*\*|[-+*/%^()]|\S/g) ?? []; // spasi dilewati, tapi "2 3" tetap dua angka

  let i = 0;
  const lihat = () => token[i];
  const ambil = () => token[i++];

  // ekspresi = suku (+|- suku)*
  function ekspr() {
    let nilai = suku();
    while (lihat() === "+" || lihat() === "-") {
      const op = ambil();
      const kanan = suku();
      nilai = op === "+" ? nilai + kanan : nilai - kanan;
    }
    return nilai;
  }

  // suku = unary (*|/|% unary)*
  function suku() {
    let nilai = unary();
    while (lihat() === "*" || lihat() === "/" || lihat() === "%") {
      const op = ambil();
      const kanan = unary();
      if ((op === "/" || op === "%") && kanan === 0) throw new Error("Tidak bisa dibagi nol");
      nilai = op === "*" ? nilai * kanan : op === "/" ? nilai / kanan : nilai % kanan;
    }
    return nilai;
  }

  // unary = (-|+) unary | pangkat
  function unary() {
    if (lihat() === "-") {
      ambil();
      return -unary();
    }
    if (lihat() === "+") {
      ambil();
      return unary();
    }
    return pangkat();
  }

  // pangkat = dasar (^ unary)?   (-2^2 = -4 dan 2^3^2 = 512, sesuai aturan matematika)
  function pangkat() {
    const dasar = dasarnya();
    if (lihat() === "^" || lihat() === "**") {
      ambil();
      return dasar ** unary();
    }
    return dasar;
  }

  // dasar = angka | ( ekspresi )
  function dasarnya() {
    const t = ambil();
    if (t === "(") {
      const nilai = ekspr();
      if (ambil() !== ")") throw new Error("Kurung belum ditutup");
      return nilai;
    }
    if (t === undefined) throw new Error("Ekspresi belum lengkap");
    if (/^[\d.]/.test(t)) return parseFloat(t);
    throw new Error(`Karakter tidak valid: ${t}`);
  }

  const hasil = ekspr();
  if (i < token.length) throw new Error("Ekspresi tidak valid");
  if (!Number.isFinite(hasil)) throw new Error("Hasil terlalu besar atau tidak valid");

  return Number(hasil.toPrecision(12)); // buang sisa pembulatan, 0.1+0.2 jadi 0.3
}

export default {
  name: "calc",
  aliases: ["hitung"],
  category: "tools",
  description: "Kalkulator",
  usage: "<hitungan>",
  example: "calc (12 + 8) * 3 / 4",

  async run(ctx) {
    if (!ctx.text) {
      return ctx.reply(`🧮 Contoh: *${ctx.prefix}calc (12 + 8) * 3 / 4*\nOperator: + - * / % ^ ( )`);
    }
    if (ctx.text.length > 200) return ctx.reply("❌ Hitungan terlalu panjang.");

    try {
      await ctx.reply(`🧮 ${ctx.text}\n= *${evaluate(ctx.text)}*`);
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`);
    }
  }
};
