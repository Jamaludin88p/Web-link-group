const { getDb } = require("./_lib/db");
const { hashPassword, setSession, readBody, clientIp } = require("./_lib/auth");

const MAX_SIGNUPS_PER_HOUR = 5; // per IP

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

    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Username 3-20 karakter: huruf, angka, titik, atau garis bawah" });
    }
    if (password.length < 8) return res.status(400).json({ error: "Password minimal 8 karakter" });
    if (password.length > 100) return res.status(400).json({ error: "Password maksimal 100 karakter" });

    const db = await getDb();
    const ip = clientIp(req);
    const signups = db.collection("signups");
    const recent = await signups.countDocuments({ ip, at: { $gte: new Date(Date.now() - 3600 * 1000) } });
    if (recent >= MAX_SIGNUPS_PER_HOUR) {
      return res.status(429).json({ error: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti." });
    }

    try {
      await db.collection("users").insertOne({
        username,
        pass: await hashPassword(password),
        createdAt: new Date()
      });
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: "Username sudah dipakai" });
      throw e;
    }
    await signups.insertOne({ ip, at: new Date() });

    setSession(res, username);
    return res.status(201).json({ ok: true, username });
  } catch (e) {
    console.error("[register]", e);
    return res.status(500).json({ error: "Server bermasalah: " + e.message });
  }
};
