export default {
  name: "ping",
  category: "general",
  description: "Cek kecepatan respon bot",

  async run(ctx) {
    const mulai = Date.now();
    const terkirim = await ctx.reply("🏓 Mengukur...");
    const ms = Date.now() - mulai;

    await ctx.sock.sendMessage(ctx.jid, { text: `🏓 Pong! ${ms} ms`, edit: terkirim.key });
  }
};
