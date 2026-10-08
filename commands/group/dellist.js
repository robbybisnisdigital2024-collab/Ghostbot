import { hapus } from "../../lib/listdb.js";

export default {
  name: "dellist",
  aliases: [],
  category: "group",
  description: "Hapus list (khusus admin grup)",
  usage: "<nama_list>",
  example: "dellist hai",
  adminOnly: true,

  async run(ctx) {
    const nama = ctx.text.trim().toLowerCase();

    if (!nama) {
      return ctx.reply(
        `⚠️ Masukkan nama list yang ingin dihapus.\nContoh: *${ctx.prefix}dellist hai*`
      );
    }

    if (!hapus(ctx.jid, nama)) {
      return ctx.reply(`❌ List *${nama}* tidak ditemukan.`);
    }

    await ctx.reply(`🗑️ List *${nama}* berhasil dihapus.`);
  }
};
