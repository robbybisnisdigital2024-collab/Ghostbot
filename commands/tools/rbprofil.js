import { USERNAME_VALID, ambilGambar, ambilProfil, cariUser, pesanGalat } from "../../lib/roblox.js";

const MAKS_BIO = 300;

export default {
  name: "rbprofil",
  aliases: ["robloxprofil", "robloxprofile"],
  category: "tools",
  description: "Cek profil akun Roblox dari username",
  usage: "<username>",
  example: "rbprofil Roblox",
  cooldown: 10, // detik per pengguna

  async run(ctx) {
    const username = ctx.args[0];
    if (!username) {
      return ctx.reply(`⚠️ Harap masukkan username!\nContoh: *${ctx.prefix}rbprofil Roblox*`);
    }
    if (!USERNAME_VALID.test(username)) {
      return ctx.reply("❌ Username tidak valid (3-20 karakter: huruf, angka, atau _).");
    }

    try {
      const user = await cariUser(username);
      if (!user) return ctx.reply(`❌ Username *${username}* tidak ditemukan.`);

      const [profil, foto] = await Promise.all([
        ambilProfil(user.id),
        ambilGambar(user.id, "avatar-headshot").catch(() => null)
      ]);

      const dibuat = new Date(profil.created);
      const tanggal = dibuat.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: ctx.config.timezone
      });
      const tahun = Math.floor((Date.now() - dibuat) / (365.25 * 24 * 3600 * 1000));
      const angka = n => (n === null ? "-" : n.toLocaleString("id-ID"));
      const bio = (profil.description ?? "").trim().slice(0, MAKS_BIO);

      const caption = [
        "👤 *PROFIL ROBLOX*",
        "",
        `Username  : ${profil.name}${profil.hasVerifiedBadge ? " ✔️" : ""}`,
        `Display   : ${profil.displayName}`,
        `ID        : ${profil.id}`,
        `Dibuat    : ${tanggal} (${tahun} tahun)`,
        `Teman     : ${angka(profil.teman)}`,
        `Pengikut  : ${angka(profil.pengikut)}`,
        `Mengikuti : ${angka(profil.mengikuti)}`,
        ...(profil.isBanned ? ["Status    : 🚫 Banned"] : []),
        ...(bio ? ["", `*Bio:*\n${bio}`] : []),
        "",
        `🔗 https://www.roblox.com/users/${profil.id}/profile`
      ].join("\n");

      if (!foto) return await ctx.reply(caption);
      await ctx.sock.sendMessage(ctx.jid, { image: foto, caption }, { quoted: ctx.msg });
    } catch (err) {
      await ctx.reply(pesanGalat(err));
    }
  }
};
