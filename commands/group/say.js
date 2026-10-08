export default {
  name: "say",
  category: "group",
  description: "Bot mengulangi teks yang kamu tulis (di grup khusus admin)",
  usage: "<teks>",
  example: "say Halo semuanya!",
  adminInGroup: true, // hapus baris ini kalau .say mau dibuka untuk semua anggota

  async run(ctx) {
    // Boleh juga me-reply sebuah pesan lalu ketik .say tanpa teks
    const teks = ctx.text || ctx.quoted?.text;

    if (!teks) {
      return ctx.reply(`💬 Contoh: *${ctx.prefix}say Halo semuanya!*`);
    }

    await ctx.sock.sendMessage(ctx.jid, { text: teks });
  }
};
