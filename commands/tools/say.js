export default {
  name: "say",
  category: "tools",
  description: "Bot mengulangi teks yang kamu tulis",
  usage: "<teks>",
  example: "say Halo semuanya!",

  async run(ctx) {
    // Boleh juga me-reply sebuah pesan lalu ketik .say tanpa teks
    const teks = ctx.text || ctx.quoted?.text;

    if (!teks) {
      return ctx.reply(`💬 Contoh: *${ctx.prefix}say Halo semuanya!*`);
    }

    await ctx.sock.sendMessage(ctx.jid, { text: teks });
  }
};
