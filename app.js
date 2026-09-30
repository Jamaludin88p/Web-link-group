(() => {
  const C = Object.assign({
    namaSitus: "Kumpulan Link Grup",
    namaBot: "",
    judul: "Kumpulan Link Grup",
    deskripsi: "",
    kontak: { label: "", url: "" },
    urutanTerbaru: true,
    jumlahBadgeBaru: 0,
    pakaiDatabase: true,
    footer: "",
    favicon: "",
    grup: []
  }, window.CONFIG || {});

  const $ = (id) => document.getElementById(id);
  const AVATAR_COLORS = ["#FFD84D", "#9EE6C1", "#FFB4A2", "#B9D7FF", "#E3C2FF", "#FFC6E0"];
  const COPY_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

  // ---- header & teks umum
  document.title = C.namaSitus;
  if (C.favicon) {
    $("favicon").href = C.favicon;
    $("touchicon").href = C.favicon;
    $("ogimage").content = C.favicon;
  }
  const ogt = document.querySelector('meta[property="og:title"]');
  if (ogt) ogt.content = C.namaSitus;
  $("brand").textContent = C.namaBot || C.namaSitus;
  $("title").textContent = C.judul;
  $("desc").textContent = C.deskripsi;
  $("footer").textContent = C.footer;
  if (C.kontak && C.kontak.url) {
    const a = $("contact");
    a.href = C.kontak.url;
    a.textContent = C.kontak.label || "Kontak";
    a.hidden = false;
  }

  // ---- data: gabungan config.js (lama) + database (baru)
  let items = [];
  let loading = !!C.pakaiDatabase;

  // Wajib ada nama + link http(s). Link ganda dilewati (yang pertama menang).
  function clean(list, seen, sumber) {
    const out = [];
    (list || []).forEach((g, i) => {
      const nama = String(g.namagc || "").trim();
      const link = String(g.linkgc || "").trim();
      if (!nama || !/^https?:\/\//i.test(link)) {
        console.warn(`[${sumber}] grup ke-${i + 1} dilewati: namagc/linkgc tidak valid`, g);
        return;
      }
      if (seen.has(link)) {
        console.warn(`[${sumber}] link ganda dilewati: ${link}`);
        return;
      }
      seen.add(link);
      const img = String(g.imgprofile || g.imgProfile || g.Imgprofile || "").trim();
      out.push({ nama, link, img, deskripsi: String(g.deskripsi || "").trim() });
    });
    return out;
  }

  function compose(dbList) {
    const seen = new Set();
    const merged = clean(C.grup, seen, "config.js").concat(clean(dbList, seen, "database"));
    const n = Math.max(0, Number(C.jumlahBadgeBaru) || 0);
    merged.forEach((it, idx) => { it.baru = n > 0 && idx >= merged.length - n; });
    if (C.urutanTerbaru) merged.reverse();
    items = merged;
    $("total").textContent = items.length;
  }

  // ---- helper
  function platformOf(url) {
    const u = url.toLowerCase();
    if (u.includes("chat.whatsapp.com")) return "Grup WhatsApp";
    if (u.includes("whatsapp.com/channel")) return "Saluran WhatsApp";
    if (u.includes("t.me") || u.includes("telegram.")) return "Telegram";
    if (u.includes("discord.")) return "Discord";
    return "Tautan grup";
  }
  function initials(nama) {
    const words = nama.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
    return ((words[0] || "?")[0] + (words[1] ? words[1][0] : "")).toUpperCase();
  }
  function colorOf(nama) {
    let h = 0;
    for (const ch of nama) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }
  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    toast("Link disalin");
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---- render
  function card(it, i) {
    const c = el("article", "card");
    c.style.setProperty("--i", Math.min(i, 12));

    const head = el("div", "card-head");
    const av = el("div", "avatar");
    av.setAttribute("aria-hidden", "true");
    const showInitials = () => {
      av.replaceChildren(document.createTextNode(initials(it.nama)));
      av.style.background = colorOf(it.nama);
    };
    if (it.img) {
      const im = document.createElement("img");
      im.alt = "";
      im.loading = "lazy";
      im.decoding = "async";
      im.referrerPolicy = "no-referrer";
      im.src = it.img;
      im.addEventListener("error", showInitials);   // gambar gagal dimuat -> pakai inisial
      av.append(im);
    } else {
      showInitials();
    }
    head.append(av, el("span", "platform", platformOf(it.link)));
    if (it.baru) head.append(el("span", "badge", "Baru"));

    const actions = el("div", "actions");
    const join = el("a", "join", "Gabung");
    join.href = it.link; join.target = "_blank"; join.rel = "noopener noreferrer";
    join.setAttribute("aria-label", "Gabung ke " + it.nama);
    const btn = el("button", "copy");
    btn.type = "button";
    btn.innerHTML = COPY_ICON;
    btn.setAttribute("aria-label", "Salin link " + it.nama);
    btn.addEventListener("click", () => copy(it.link));
    actions.append(join, btn);

    c.append(head, el("h2", null, it.nama));
    c.append(it.deskripsi ? el("p", null, it.deskripsi) : el("p"));
    c.append(actions);
    return c;
  }

  function render(query) {
    const q = (query || "").trim().toLowerCase();
    const empty = $("empty");

    if (loading) {
      $("list").replaceChildren();
      empty.hidden = true;
      $("status").textContent = "Memuat daftar grup...";
      return;
    }

    const list = q
      ? items.filter((it) => (it.nama + " " + it.deskripsi).toLowerCase().includes(q))
      : items;

    $("list").replaceChildren(...list.map(card));

    if (!list.length) {
      empty.hidden = false;
      empty.replaceChildren();
      if (!items.length) {
        empty.append(el("strong", null, "Belum ada grup"), document.createTextNode("Admin belum menambahkan grup."));
      } else {
        empty.append(el("strong", null, "Grup tidak ditemukan"), document.createTextNode("Coba kata kunci lain."));
      }
    } else {
      empty.hidden = true;
    }
    $("status").textContent = q ? `Menampilkan ${list.length} dari ${items.length} grup` : "";
  }

  $("q").addEventListener("input", (e) => render(e.target.value));

  // ---- mulai
  compose([]);
  render("");

  if (C.pakaiDatabase) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    fetch("/api/groups", { headers: { Accept: "application/json" }, signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((d) => compose(Array.isArray(d.groups) ? d.groups : []))
      .catch((e) => console.info("[database] tidak tersedia, memakai config.js saja:", e.message))
      .finally(() => {
        clearTimeout(timer);
        loading = false;
        render($("q").value);
      });
  }
})();
