const { getDb } = require("./_lib/db");
const { hashPassword, verifyPassword, setSession, readBody, clientIp } = require("./_lib/auth");

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

// Akun admin pertama dibuat dari ADMIN_USER + ADMIN_PASS kalau koleksi users masih kosong.
async function ensureAdmin(db) {
  const users = db.collection("users");
  if ((await users.countDocuments({}, { limit: 1 })) > 0) return;
  const username = String(process.env.ADMIN_USER || "").trim().toLowerCase();
  const pass = String(process.env.ADMIN_PASS || "");
  if (!username || pass.length < 8) return;
  try {
    await users.insertOne({ username, pass: await hashPassword(pass), createdAt: new Date() });
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const body = readBody(req);
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!username || !password) return res.status(400).json({ error: "Username dan password wajib diisi" });

    const db = await getDb();
    const ip = clientIp(req);
    const attempts = db.collection("attempts");
    const fails = await attempts.countDocuments({ ip, at: { $gte: new Date(Date.now() - WINDOW_MS) } });
    if (fails >= MAX_FAILS) {
      return res.status(429).json({ error: "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit." });
    }

    await ensureAdmin(db);
    const user = await db.collection("users").findOne({ username });
    // Tetap hitung hash walau user tidak ada, supaya waktu respons tidak membocorkan username.
    const ok = user
      ? await verifyPassword(password, user.pass)
      : (await verifyPassword(password, "scrypt$00$00"), false);

    if (!ok) {
      await attempts.insertOne({ ip, at: new Date() });
      return res.status(401).json({ error: "Username atau password salah" });
    }
    setSession(res, username);
    return res.status(200).json({ ok: true, username });
  } catch (e) {
    console.error("[login]", e);
    return res.status(500).json({ error: "Server bermasalah: " + e.message });
  }
};
