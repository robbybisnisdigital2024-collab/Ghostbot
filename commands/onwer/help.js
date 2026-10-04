export default {
  name: "help",
  aliases: ["bantuan"],
  category: "general",
  description: "Lihat cara pakai sebuah perintah",
  usage: "<perintah>",
  example: "help calc",

  async run(ctx) {
    const { prefix } = ctx;
    const cari = ctx.args[0]?.toLowerCase().replace(prefix, "");

    if (!cari) {
      return ctx.reply(
        `Ketik *${prefix}menu* untuk melihat semua perintah.\n` +
          `Ketik *${prefix}help <perintah>* untuk detail, mis. *${prefix}help calc*`
      );
    }

    const cmd = ctx.commands.find(c => c.name === cari || c.aliases?.includes(cari));
    if (!cmd) {
      return ctx.reply(`❓ Perintah "${cari}" tidak ditemukan. Ketik *${prefix}menu* untuk daftar perintah.`);
    }

    const syarat = [
      cmd.ownerOnly && "khusus owner",
      cmd.adminOnly && "khusus admin grup",
      cmd.groupOnly && "hanya di grup"
    ].filter(Boolean);

    const teks = [
      `📖 *${prefix}${cmd.name}*`,
      cmd.description ?? "",
      "",
      `Cara pakai: ${prefix}${cmd.name}${cmd.usage ? " " + cmd.usage : ""}`
    ];
    if (cmd.example) teks.push(`Contoh: ${prefix}${cmd.example}`);
    if (cmd.aliases?.length) teks.push(`Nama lain: ${cmd.aliases.map(a => prefix + a).join(", ")}`);
    if (syarat.length) teks.push(`Syarat: ${syarat.join(", ")}`);

    await ctx.reply(teks.join("\n"));
  }
};
