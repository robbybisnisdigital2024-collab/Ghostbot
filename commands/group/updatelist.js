import { tulis } from "../../lib/listdb.js";

export default {
  name: "updatelist",
  aliases: [group],
  description: "Tambah atau perbarui list (khusus admin grup)",
  usage: "<nama_list>@<isi>",
  example: "updatelist hai@Halo semuanya!",
  adminOnly: true,

  async run(ctx) {
    const input = ctx.text.trim();
    const at = input.indexOf("@");

    if (at === -1) {
      return ctx.reply(
        `⚠️ Format salah.\nGunakan: *${ctx.prefix}updatelist nama_list@isi*\nContoh: *${ctx.prefix}updatelist hai@Halo semuanya!*`
      );
    }

    const nama = input.slice(0, at).trim().toLowerCase();
    const isi = input.slice(at + 1).trim();

    if (!nama || !isi) {
      return ctx.reply("⚠️ Nama list dan isi tidak boleh kosong.");
    }

    const alasan = tulis(ctx.jid, nama, isi);
    if (alasan) return ctx.reply(`❌ ${alasan}`);

    await ctx.reply(`✅ List *${nama}* berhasil ditambah/diperbarui.`);
  }
};
