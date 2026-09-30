const { getSession, clearSession } = require("./_lib/auth");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const s = getSession(req);
      if (!s) return res.status(401).json({ error: "Belum login" });
      return res.status(200).json({ username: s.u });
    }
    if (req.method === "DELETE") {
      clearSession(res);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("[session]", e);
    return res.status(500).json({ error: "Server bermasalah: " + e.message });
  }
};
