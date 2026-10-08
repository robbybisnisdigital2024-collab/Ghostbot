import { USERNAME_VALID, ambilGambar, ambilItemAvatar, cariUser, pesanGalat } from "../../lib/roblox.js";

const MAKS_ITEM = 20; // jumlah item yang ditampilkan di caption

export default {
  name: "rbavatar",
  aliases: ["robloxavatar"],
  category: "tools",
  description: "cek avatar di Roblox beserta item yang dipakai",
  usage: "<username>",
  example: "rbavatar Roblox",
  cooldown: 10, // detik per pengguna

  async run(ctx) {
    const username = ctx.args[0];
    if (!username) {
      return ctx.reply(`⚠️ Harap masukkan username!\nContoh: *${ctx.prefix}rbavatar Roblox*`);
    }
    if (!USERNAME_VALID.test(username)) {
      return ctx.reply("❌ Username tidak valid (3-20 karakter: huruf, angka, atau _).");
    }

    try {
      const user = await cariUser(username);
      if (!user) return ctx.reply(`❌ Username *${username}* tidak ditemukan.`);

      const [gambar, avatar] = await Promise.all([
        ambilGambar(user.id, "avatar").catch(() => null),
        ambilItemAvatar(user.id)
      ]);

      const tampil = avatar.items.slice(0, MAKS_ITEM);
      const sisa = avatar.items.length - tampil.length;

      const caption = [
        `🧍 *AVATAR ROBLOX*`,
        "",
        `Username : ${user.name}`,
        `Display  : ${user.displayName}`,
        `Tipe     : ${avatar.tipe}`,
        `Item     : ${avatar.items.length}`,
        ...(tampil.length
          ? ["", "*Item dipakai:*", ...tampil.map(i => `• ${i.nama} _(${i.jenis})_`)]
          : []),
        ...(sisa > 0 ? [`_...dan ${sisa} item lainnya_`] : []),
        "",
        `🔗 https://www.roblox.com/users/${user.id}/profile`
      ].join("\n");

      if (!gambar) return await ctx.reply(caption);
      await ctx.sock.sendMessage(ctx.jid, { image: gambar, caption }, { quoted: ctx.msg });
    } catch (err) {
      await ctx.reply(pesanGalat(err));
    }
  }
};
