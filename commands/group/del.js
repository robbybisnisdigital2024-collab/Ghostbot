export default {
  name: "del",
  aliases: ["delete", "hapus"],
  category: "group",
  description: "Hapus pesan yang di-reply (khusus admin grup)",
  usage: "(reply pesan lalu ketik .del)",
  adminOnly: true,

  async run(ctx) {
    if (!ctx.quoted) {
      return ctx.reply(`🗑️ Reply pesan yang mau dihapus, lalu ketik *${ctx.prefix}del*`);
    }

    const key = {
      remoteJid: ctx.jid,
      fromMe: false,
      id: ctx.quoted.id,
      participant: ctx.quoted.sender
    };

    try {
      await ctx.sock.sendMessage(ctx.jid, { delete: key });
    } catch {
      await ctx.reply(
        "❌ Gagal hapus pesan. Bot cuma bisa hapus pesan orang lain kalau jadi admin grup."
      );
    }
  }
};
