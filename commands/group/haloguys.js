export default {
  name: "Haloguys",
  aliases: ["hidetag"],
  category: "group",
  description: "Kirim pesan ke semua anggota grup )",
  usage: "<pesan>",
  example: "haloguys apa kabar",
  adminOnly: true, // khusus admin supaya tidak disalahgunakan untuk spam notifikasi
  cooldown: 30, // detik per pengguna (owner dibebaskan)

  async run(ctx) {
    if (!ctx.text) {
      return ctx.reply(`⚠️ Harap masukkan pesan!\nContoh: *${ctx.prefix}haloguys apa kabar*`);
    }

    const { metadata } = await ctx.getGroup();
    const anggota = metadata.participants.map(p => p.id);

    // Semua anggota di-mention, tapi teksnya hanya berisi pesan (tanpa daftar @nomor)
    await ctx.sock.sendMessage(ctx.jid, { text: ctx.text, mentions: anggota });
  }
};
