const { getDb } = require("./_lib/db");
const { requireAuth, readBody, hashPassword, verifyPassword } = require("./_lib/auth");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const session = requireAuth(req, res);
    if (!session) return;
    const body = readBody(req);
    const oldPassword = String(body.oldPassword || "");
    const newPassword = String(body.newPassword || "");
    if (newPassword.length < 8) return res.status(400).json({ error: "Password baru minimal 8 karakter" });

    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne({ username: session.u });
    if (!user || !(await verifyPassword(oldPassword, user.pass))) {
      return res.status(400).json({ error: "Password lama salah" });
    }
    await users.updateOne({ username: session.u }, { $set: { pass: await hashPassword(newPassword) } });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[password]", e);
    return res.status(500).json({ error: "Server bermasalah: " + e.message });
  }
};
