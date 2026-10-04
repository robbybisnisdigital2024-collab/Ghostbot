import { numberFromJid } from "../../lib/utils.js";

export default {
  name: "tagall",
  aliases: ["everyone"],
  category: "group",
  description: "Mention semua anggota grup",
  usage: "[pesan]",
  example: "tagall Rapat jam 8 malam",
  adminOnly: true,

  async run(ctx) {
    const { metadata } = await ctx.getGroup();
    const anggota = metadata.participants.map(p => p.id);

    const teks = [
      "📢 *TAG ALL*",
      ctx.text ? `💬 ${ctx.text}` : "",
      "",
      ...anggota.map(id => `• @${numberFromJid(id)}`)
    ].join("\n");

    await ctx.sock.sendMessage(
      ctx.jid,
      { text: teks, mentions: anggota },
      { quoted: ctx.msg }
    );
  }
};
