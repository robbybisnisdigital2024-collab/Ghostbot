const ZONA = [
  ["WIB", "Asia/Jakarta"],
  ["WITA", "Asia/Makassar"],
  ["WIT", "Asia/Jayapura"]
];

export default {
  name: "time",
  aliases: ["waktu"],
  category: "general",
  description: "Lihat tanggal dan jam sekarang (WIB/WITA/WIT)",

  async run(ctx) {
    const sekarang = new Date();

    const tanggal = sekarang.toLocaleDateString("id-ID", {
      timeZone: ctx.config.timezone,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const jam = ZONA.map(([nama, zona]) => {
      const waktu = sekarang
        .toLocaleTimeString("id-ID", { timeZone: zona, hour12: false })
        .replace(/\./g, ":");
      return `• ${nama.padEnd(4)}: ${waktu}`;
    });

    await ctx.reply(`🕒 *Waktu Sekarang*\n\n📅 ${tanggal}\n\n${jam.join("\n")}`);
  }
};
