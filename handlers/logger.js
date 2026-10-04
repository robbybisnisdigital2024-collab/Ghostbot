import { logger } from "../lib/logger.js";

/** Catat perintah yang masuk, mis: ".ping ← Robby (grup)" */
export function logCommand(ctx) {
  const tempat = ctx.isGroup ? "grup" : "privat";
  const isi = ctx.text ? `: ${ctx.text.slice(0, 50).replace(/\s+/g, " ")}` : "";
  logger.info(
    `${ctx.prefix}${ctx.command.name} ← ${ctx.pushName || ctx.senderNumber || "?"} (${tempat})${isi}`
  );
}

export function logCommandError(ctx, err) {
  logger.error(`Perintah "${ctx.command.name}" gagal:`, err);
}
