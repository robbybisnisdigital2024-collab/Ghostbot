import { ambil, daftarKey } from "../../lib/listdb.js";

export default {
  name: "list",
  aliases: [],
  category: "group",
  description: "Lihat daftar nama list atau isi list tertentu",
  usage: "[nama_list]",
  example: "list / list hai",

  async run(ctx) {
    const nama = ctx.text.trim().toLowerCase();

    if (nama) {
      const isi = ambil(ctx.jid, nama);
      if (isi === null) {
        return ctx.reply(
          `❌ List *${nama}* tidak ditemukan.\nKetik *${ctx.prefix}list* untuk melihat daftar.`
        );
      }

      return ctx.reply(isi);
    }

    const keys = daftarKey(ctx.jid);
    if (keys.length === 0) return ctx.reply("📜 Belum ada list tersimpan.");

    const pushname = ctx.pushName || "User";

    const teks = [
      `「${ctx.config.botName}」`,
      `_Halo ${pushname}, welcome!_`,
      "",
      "── ⋆⋅☆⋅⋆ ──",
      "*List menu:*",
      ...keys.map(k => `☆+ ⊹ ${k} ˖໒꒱`),
      "── ⋆⋅☆⋅⋆ ──"
    ].join("\n");

    await ctx.reply(teks, { mentions: [ctx.sender] });
  }
};
