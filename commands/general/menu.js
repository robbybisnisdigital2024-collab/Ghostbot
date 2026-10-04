// Urutan & nama tampilan tiap kategori. Kategori baru otomatis ikut muncul di bawah.
const KATEGORI = {
  general: "📌 UMUM",
  group: "👥 GRUP",
  tools: "🛠️ TOOLS",
  owner: "👑 OWNER"
};

export default {
  name: "menu",
  aliases: ["allmenu"],
  category: "general",
  description: "Tampilkan daftar semua perintah",

  async run(ctx) {
    const { config, prefix } = ctx;

    // Kelompokkan perintah per kategori (perintah owner disembunyikan dari non-owner)
    const kelompok = new Map();
    for (const cmd of ctx.commands) {
      if (cmd.ownerOnly && !ctx.isOwner) continue;
      const kat = cmd.category ?? "lainnya";
      if (!kelompok.has(kat)) kelompok.set(kat, []);
      kelompok.get(kat).push(cmd);
    }

    const urutan = [...kelompok.keys()].sort((a, b) => {
      const ia = Object.keys(KATEGORI).indexOf(a);
      const ib = Object.keys(KATEGORI).indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const teks = [
      `╭─「 *${config.botName}* 」`,
      `│ Hai, ${ctx.pushName || "datang disini"}! 👋`,
      `│ Prefix : ${prefix}`,
      "╰────────────"
    ];

    for (const kat of urutan) {
      teks.push("", `╭─「 ${KATEGORI[kat] ?? kat.toUpperCase()} 」`);
      for (const cmd of kelompok.get(kat)) {
        teks.push(`│ • ${prefix}${cmd.name} — ${cmd.description ?? ""}`);
      }
      teks.push("╰────────────");
    }

    teks.push("", `Ketik *${prefix}help <perintah>* untuk detail, mis. *${prefix}help calc*`);

    await ctx.reply(teks.join("\n"));
  }
};
