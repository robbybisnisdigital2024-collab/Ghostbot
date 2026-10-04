import { startBot } from "./main.js";

console.log("================================");
console.log("🤖 Ghost x Robby v3");
console.log("================================");

process.on("unhandledRejection", err => {
  console.error("Unhandled rejection:", err);
});

startBot().catch(err => {
  console.error("❌ Gagal menjalankan bot:", err);
  process.exit(1);
});
