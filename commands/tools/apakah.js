const JAWABAN = ["Iya", "Tidak", "Mungkin", "Nggak kok", "Yakin, iya", "Kemungkinan besar nggak"];

export default {
  name: "apakah",
  category: "tools",
  description: "Tanya jawaban ya/tidak random",
  usage: "<pertanyaan>",
  example: "apakah besok ujian",

  async run(ctx) {
    if (!ctx.text) return ctx.reply(`🔮 Contoh: *${ctx.prefix}apakah besok hujan*`);

    const jawaban = JAWABAN[Math.floor(Math.random() * JAWABAN.length)];
    await ctx.reply(`*Pertanyaan:* Apakah ${ctx.text}?\n*Jawaban:* ${jawaban}`);
  }
};
