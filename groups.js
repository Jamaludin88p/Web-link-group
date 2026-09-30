const { ObjectId } = require("mongodb");
const { getDb } = require("./_lib/db");
const { requireAuth, readBody } = require("./_lib/auth");
const { parseWaLink } = require("./_lib/wa");

const MAX_GROUPS_PER_USER = 20;
const MAX_UPLOADS_PER_HOUR = 5;

function clean(body) {
  const namagc = String(body.namagc || "").trim();
  const link = parseWaLink(body.linkgc);
  const imgprofile = String(body.imgprofile || "").trim();
  const deskripsi = String(body.deskripsi || "").trim();

  if (!link) {
    return { error: "Hanya link grup WhatsApp yang diterima, contoh: https://chat.whatsapp.com/AbCdEf123..." };
  }
  if (!namagc) return { error: "Nama grup wajib diisi" };
  if (namagc.length > 100) return { error: "Nama grup maksimal 100 karakter" };
  if (imgprofile && (imgprofile.length > 500 || !/^https:\/\/\S+$/i.test(imgprofile))) {
    return { error: "Link gambar harus berupa URL yang diawali https://" };
  }
  if (deskripsi.length > 300) return { error: "Deskripsi maksimal 300 karakter" };
  return { doc: { namagc, linkgc: link, imgprofile, deskripsi } };
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
    const db = await getDb();
    const col = db.collection("groups");

    if (req.method === "GET") {
      // Grup milik akun yang sedang login
      if (req.query && req.query.mine) {
        res.setHeader("Cache-Control", "no-store");
        const s = requireAuth(req, res);
        if (!s) return;
        const docs = await col.find({ owner: s.u }).sort({ createdAt: 1 }).limit(200).toArray();
        return res.status(200).json({ groups: docs.map(view), max: MAX_GROUPS_PER_USER });
      }
      // Publik: semua grup. Di-cache singkat di CDN supaya database tidak dibebani.
      res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=60");
      const docs = await col.find({}).sort({ createdAt: 1 }).limit(1000).toArray();
      return res.status(200).json({ groups: docs.map(view) });
    }

    res.setHeader("Cache-Control", "no-store");
    const s = requireAuth(req, res);
    if (!s) return;

    if (req.method === "POST") {
      const { doc, error } = clean(readBody(req));
      if (error) return res.status(400).json({ error });

      if ((await col.countDocuments({ owner: s.u })) >= MAX_GROUPS_PER_USER) {
        return res.status(403).json({ error: `Batas ${MAX_GROUPS_PER_USER} grup per akun sudah tercapai. Hapus grup lama dulu.` });
      }
      const uploads = db.collection("uploads");
      const recent = await uploads.countDocuments({ owner: s.u, at: { $gte: new Date(Date.now() - 3600 * 1000) } });
      if (recent >= MAX_UPLOADS_PER_HOUR) {
        return res.status(429).json({ error: "Kamu terlalu cepat menambah grup. Coba lagi dalam 1 jam." });
      }

      try {
        const r = await col.insertOne({ ...doc, owner: s.u, createdAt: new Date() });
        await uploads.insertOne({ owner: s.u, at: new Date() });
        return res.status(201).json({ group: view({ ...doc, _id: r.insertedId }) });
      } catch (e) {
        if (e.code === 11000) return res.status(409).json({ error: "Link grup ini sudah ada di daftar" });
        throw e;
      }
    }

    const id = String((req.query && req.query.id) || "");
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID tidak valid" });
    const filter = { _id: new ObjectId(id), owner: s.u }; // hanya pemilik yang boleh ubah/hapus

    if (req.method === "PUT") {
      const { doc, error } = clean(readBody(req));
      if (error) return res.status(400).json({ error });
      try {
        const r = await col.updateOne(filter, { $set: doc });
        if (!r.matchedCount) return res.status(404).json({ error: "Grup tidak ditemukan atau bukan milikmu" });
        return res.status(200).json({ group: view({ ...doc, _id: id }) });
      } catch (e) {
        if (e.code === 11000) return res.status(409).json({ error: "Link grup ini sudah ada di daftar" });
        throw e;
      }
    }

    if (req.method === "DELETE") {
      const r = await col.deleteOne(filter);
      if (!r.deletedCount) return res.status(404).json({ error: "Grup tidak ditemukan atau bukan milikmu" });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("[groups]", e);
    return res.status(500).json({ error: "Server bermasalah: " + e.message });
  }
};
