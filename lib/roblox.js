// Pembungkus API publik Roblox (tanpa API key) untuk .rbprofil dan .rbavatar

const TIMEOUT_MS = 10_000;
const MAKS_GAMBAR = 2 * 1024 * 1024; // gambar maksimal 2 MB

// Aturan username Roblox: 3-20 karakter, huruf/angka/underscore
export const USERNAME_VALID = /^\w{3,20}$/;

async function ambilJson(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Teks galat yang aman ditampilkan ke pengguna. */
export function pesanGalat(err) {
  return err?.message === "RATE_LIMIT"
    ? "⏳ Roblox sedang membatasi permintaan, coba lagi beberapa saat."
    : "❌ Gagal menghubungi server Roblox, coba lagi nanti.";
}

/** Cari user dari username. Mengembalikan null kalau tidak ada. */
export async function cariUser(username) {
  const data = await ambilJson("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
  });
  const user = data?.data?.[0];
  return user ? { id: user.id, name: user.name, displayName: user.displayName } : null;
}

/** Info profil + jumlah teman, pengikut, dan mengikuti. */
export async function ambilProfil(id) {
  const [info, teman, pengikut, mengikuti] = await Promise.allSettled([
    ambilJson(`https://users.roblox.com/v1/users/${id}`),
    ambilJson(`https://friends.roblox.com/v1/users/${id}/friends/count`),
    ambilJson(`https://friends.roblox.com/v1/users/${id}/followers/count`),
    ambilJson(`https://friends.roblox.com/v1/users/${id}/followings/count`)
  ]);
  if (info.status === "rejected") throw info.reason;

  const hitung = r => (r.status === "fulfilled" ? r.value.count : null);
  return {
    ...info.value,
    teman: hitung(teman),
    pengikut: hitung(pengikut),
    mengikuti: hitung(mengikuti)
  };
}

/** Tipe avatar (R6/R15) dan daftar item yang sedang dipakai. */
export async function ambilItemAvatar(id) {
  const data = await ambilJson(`https://avatar.roblox.com/v1/users/${id}/avatar`);
  return {
    tipe: data.playerAvatarType ?? "-",
    items: (data.assets ?? []).map(a => ({ nama: a.name, jenis: a.assetType?.name ?? "Item" }))
  };
}

/**
 * Unduh gambar avatar sebagai Buffer, atau null kalau belum tersedia.
 * jenis: "avatar" (seluruh badan) atau "avatar-headshot" (wajah saja).
 */
export async function ambilGambar(id, jenis = "avatar") {
  const data = await ambilJson(
    `https://thumbnails.roblox.com/v1/users/${jenis}?userIds=${id}&size=420x420&format=Png&isCircular=false`
  );
  const thumb = data?.data?.[0];
  if (thumb?.state !== "Completed" || !thumb.imageUrl) return null;

  // Hanya mau mengunduh dari CDN Roblox
  const url = new URL(thumb.imageUrl);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".rbxcdn.com")) return null;

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return null;

  const potongan = [];
  let total = 0;
  for await (const chunk of res.body) {
    total += chunk.length;
    if (total > MAKS_GAMBAR) return null;
    potongan.push(chunk);
  }
  return Buffer.concat(potongan);
}
