import { db } from "../../lib/database.js";
import { formatUptime } from "../../lib/utils.js";

export default {
  name: "info",
  aliases: ["botinfo"],
  category: "general",
  description: "Informasi tentang bot",

  async run(ctx) {
    const { config } = ctx;
    const memori = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

    await ctx.reply(
      [
        `🤖 *${config.botName}*`,
        "",
        `👑 Owner: ${config.ownerName}`,
        `🔣 Prefix: ${config.prefix}`,
        `📦 Jumlah perintah: ${ctx.commands.length}`,
        `⏱️ Aktif selama: ${formatUptime(process.uptime())}`,
        `💾 Memori: ${memori} MB`,
        `🟢 Node.js: ${process.version}`,
        `👥 Pengguna: ${db.totalUsers()}`,
        `⚡ Perintah dijalankan: ${db.data.stats.commands}x`
      ].join("\n")
    );
  }
};
