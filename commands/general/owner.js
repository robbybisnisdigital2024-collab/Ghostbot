import { OWNER_NUMBER } from "../../lib/utils.js";

export default {
  name: "owner",
  aliases: ["creator"],
  category: "general",
  description: "Kirim kontak owner bot",

  async run(ctx) {
    const { ownerName, botName } = ctx.config;

    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${ownerName}`,
      `ORG:${botName};`,
      `TEL;type=CELL;type=VOICE;waid=${OWNER_NUMBER}:+${OWNER_NUMBER}`,
      "END:VCARD"
    ].join("\n");

    await ctx.sock.sendMessage(
      ctx.jid,
      { contacts: { displayName: ownerName, contacts: [{ vcard }] } },
      { quoted: ctx.msg }
    );
  }
};
