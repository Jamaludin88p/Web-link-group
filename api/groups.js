const { ObjectId } = require("mongodb");
const { getDb } = require("./_lib/db");
const { requireAuth, readBody } = require("./_lib/auth");

function clean(body) {
  const namagc = String(body.namagc || "").trim();
  const linkgc = String(body.linkgc || "").trim();
  const imgprofile = String(body.imgprofile || "").trim();
  const deskripsi = String(body.deskripsi || "").trim();

  if (!namagc) return { error: "Nama grup wajib diisi" };
  if (namagc.length > 100) return { error: "Nama grup maksimal 100 karakter" };
  if (linkgc.length > 500 || !/^https?:\/\/\S+$/i.test(linkgc)) {
    return { error: "Link grup harus diawali http:// atau https://" };
  }
  if (imgprofile && (imgprofile.length > 500 || !/^(https?:\/\/\S+|[\w\-./]+)$/i.test(imgprofile))) {
    return { error: "Link gambar harus berupa URL http(s) atau path file, misalnya img/logo.jpg" };
  }
  if (deskripsi.length > 300) return { error: "Deskripsi maksimal 300 karakter" };
  return { doc: { namagc, linkgc, imgprofile, deskripsi } };
}

const view = (d) => ({
  id: String(d._id),
  namagc: d.namagc,
  linkgc: d.linkgc,
  imgprofile: d.imgprofile || "",
  deskripsi: d.deskripsi || ""
});

module.exports = async (req, res) => {
  try {
    const col = (await getDb()).collection("groups");

    // Publik: daftar grup. Di-cache singkat di CDN Vercel supaya database tidak dibebani.
    if (req.method === "GET") {
      const fresh = req.query && req.query.fresh;
      res.setHeader(
        "Cache-Control",
        fresh ? "no-store" : "public, s-maxage=15, stale-while-revalidate=60"
      );
      const docs = await col.find({}).sort({ createdAt: 1 }).limit(1000).toArray();
      return res.status(200).json({ groups: docs.map(view) });
    }

    res.setHeader("Cache-Control", "no-store");
    if (!requireAuth(req, res)) return;

    if (req.method === "POST") {
      const { doc, error } = clean(readBody(req));
      if (error) return res.status(400).json({ error });
      try {
        const r = await col.insertOne({ ...doc, createdAt: new Date() });
        return res.status(201).json({ group: view({ ...doc, _id: r.insertedId }) });
      } catch (e) {
        if (e.code === 11000) return res.status(409).json({ error: "Link grup ini sudah ada" });
        throw e;
      }
    }

    const id = String((req.query && req.query.id) || "");
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID tidak valid" });

    if (req.method === "PUT") {
      const { doc, error } = clean(readBody(req));
      if (error) return res.status(400).json({ error });
      try {
        const r = await col.updateOne({ _id: new ObjectId(id) }, { $set: doc });
        if (!r.matchedCount) return res.status(404).json({ error: "Grup tidak ditemukan" });
        return res.status(200).json({ group: view({ ...doc, _id: id }) });
      } catch (e) {
        if (e.code === 11000) return res.status(409).json({ error: "Link grup ini sudah ada" });
        throw e;
      }
    }

    if (req.method === "DELETE") {
      const r = await col.deleteOne({ _id: new ObjectId(id) });
      if (!r.deletedCount) return res.status(404).json({ error: "Grup tidak ditemukan" });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("[groups]", e);
    return res.status(500).json({ error: "Server bermasalah: " + e.message });
  }
};
