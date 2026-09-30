(() => {
  const $ = (id) => document.getElementById(id);
  const C = window.CONFIG || {};
  const AVATAR_COLORS = ["#FFD84D", "#9EE6C1", "#FFB4A2", "#B9D7FF", "#E3C2FF", "#FFC6E0"];
  const WA_RE = /^\s*(?:https?:\/\/)?(?:www\.)?chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{20,26})(?:[/?#]\S*)?\s*$/i;

  document.title = "Upload link grup - " + (C.namaSitus || "Kumpulan Link Grup");
  $("brand").textContent = C.namaBot || C.namaSitus || "Kumpulan Link Grup";
  if (C.favicon) $("favicon").href = C.favicon;

  let groups = [];
  let editingId = null;
  let mode = "login"; // "login" | "register"

  // ---- helper
  function parseWa(v) {
    const m = String(v || "").match(WA_RE);
    return m ? "https://chat.whatsapp.com/" + m[1] : null;
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function initials(nama) {
    const w = nama.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
    return ((w[0] || "?")[0] + (w[1] ? w[1][0] : "")).toUpperCase();
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
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: "same-origin",
      ...opts,
      headers: { "Content-Type": "application/json", "X-Requested-With": "web", ...(opts.headers || {}) }
    });
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error((data && data.error) || "Terjadi kesalahan (" + res.status + ")");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ---- tampilan
  function showAuth() {
    $("appView").hidden = true;
    $("logout").hidden = true;
    $("authView").hidden = false;
  }
  async function showApp(username) {
    $("authView").hidden = true;
    $("appView").hidden = false;
    $("logout").hidden = false;
    $("who").textContent = "Masuk sebagai @" + username + ". Hanya link grup WhatsApp yang diterima.";
    await loadMine();
  }
  function handleAuthError(e) {
    if (e.status === 401) { showAuth(); return true; }
    return false;
  }

  // ---- masuk / daftar
  function setMode(m) {
    mode = m;
    $("tabLogin").setAttribute("aria-pressed", String(m === "login"));
    $("tabRegister").setAttribute("aria-pressed", String(m === "register"));
    $("authBtn").textContent = m === "login" ? "Masuk" : "Daftar";
    $("p").autocomplete = m === "login" ? "current-password" : "new-password";
    $("authHint").hidden = m !== "register";
    $("authErr").textContent = "";
  }
  $("tabLogin").addEventListener("click", () => setMode("login"));
  $("tabRegister").addEventListener("click", () => setMode("register"));

  $("authForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    $("authErr").textContent = "";
    $("authBtn").disabled = true;
    try {
      const d = await api(mode === "login" ? "/api/login" : "/api/register", {
        method: "POST",
        body: JSON.stringify({ username: $("u").value, password: $("p").value })
      });
      $("p").value = "";
      await showApp(d.username);
    } catch (e) {
      $("authErr").textContent = e.message;
    } finally {
      $("authBtn").disabled = false;
    }
  });

  $("logout").addEventListener("click", async () => {
    try { await api("/api/session", { method: "DELETE" }); } catch {}
    groups = [];
    resetForm();
    setMode("login");
    showAuth();
  });

  // ---- deteksi link WhatsApp saat mengetik
  function updateLinkHint() {
    const v = $("f-link").value.trim();
    const hint = $("linkHint");
    if (!v) { hint.className = "hint"; hint.textContent = ""; return null; }
    const ok = parseWa(v);
    if (ok) {
      hint.className = "hint ok";
      hint.textContent = "Link grup WhatsApp terdeteksi";
    } else {
      hint.className = "hint err";
      hint.textContent = "Bukan link grup WhatsApp. Contoh: https://chat.whatsapp.com/AbCdEf...";
    }
    return ok;
  }
  $("f-link").addEventListener("input", updateLinkHint);
  $("f-link").addEventListener("blur", () => {
    const ok = updateLinkHint();
    if (ok) $("f-link").value = ok;   // rapikan jadi bentuk baku
  });

  // ---- grup saya
  async function loadMine() {
    try {
      const d = await api("/api/groups?mine=1");
      groups = d.groups || [];
      renderRows(d.max);
    } catch (e) {
      if (!handleAuthError(e)) {
        $("count").textContent = "";
        $("rows").replaceChildren(el("p", "form-msg err", e.message));
      }
    }
  }

  function row(g) {
    const r = el("div", "row");
    const av = el("div", "avatar");
    const initial = () => {
      av.replaceChildren(document.createTextNode(initials(g.namagc)));
      av.style.background = colorOf(g.namagc);
    };
    if (g.imgprofile) {
      const im = document.createElement("img");
      im.alt = ""; im.referrerPolicy = "no-referrer"; im.loading = "lazy";
      im.src = g.imgprofile;
      im.addEventListener("error", initial);
      av.append(im);
    } else initial();

    const info = el("div", "row-info");
    info.append(el("strong", null, g.namagc), el("small", null, g.linkgc));

    const acts = el("div", "row-actions");
    const edit = el("button", "btn btn-ghost btn-sm", "Ubah");
    edit.type = "button";
    edit.addEventListener("click", () => startEdit(g));
    const del = el("button", "btn btn-danger btn-sm", "Hapus");
    del.type = "button";
    del.addEventListener("click", () => removeGroup(g));
    acts.append(edit, del);

    r.append(av, info, acts);
    return r;
  }

  function renderRows(max) {
    const list = groups.slice().reverse(); // terbaru di atas
    $("rows").replaceChildren(...list.map(row));
    $("rowsEmpty").hidden = list.length > 0;
    $("count").textContent = list.length ? list.length + (max ? " dari " + max : "") + " grup" : "";
  }

  // ---- form upload / ubah
  function resetForm() {
    editingId = null;
    $("groupForm").reset();
    $("formTitle").textContent = "Grup baru";
    $("saveBtn").textContent = "Upload grup";
    $("cancelBtn").hidden = true;
    $("formErr").textContent = "";
    $("linkHint").className = "hint";
    $("linkHint").textContent = "";
  }
  function startEdit(g) {
    editingId = g.id;
    $("f-link").value = g.linkgc;
    $("f-nama").value = g.namagc;
    $("f-img").value = g.imgprofile || "";
    $("f-desc").value = g.deskripsi || "";
    $("formTitle").textContent = "Ubah grup";
    $("saveBtn").textContent = "Simpan perubahan";
    $("cancelBtn").hidden = false;
    $("formErr").textContent = "";
    updateLinkHint();
    $("groupForm").scrollIntoView({ behavior: "smooth", block: "start" });
    $("f-nama").focus();
  }
  $("cancelBtn").addEventListener("click", resetForm);

  $("groupForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    $("formErr").textContent = "";
    if (!parseWa($("f-link").value)) {
      updateLinkHint();
      $("formErr").textContent = "Hanya link grup WhatsApp yang diterima.";
      $("f-link").focus();
      return;
    }
    const payload = {
      namagc: $("f-nama").value,
      linkgc: $("f-link").value,
      imgprofile: $("f-img").value,
      deskripsi: $("f-desc").value
    };
    const wasEditing = !!editingId;
    $("saveBtn").disabled = true;
    try {
      if (wasEditing) {
        await api("/api/groups?id=" + encodeURIComponent(editingId), { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/api/groups", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      await loadMine();
      toast(wasEditing ? "Perubahan disimpan" : "Grup diunggah");
    } catch (e) {
      if (!handleAuthError(e)) $("formErr").textContent = e.message;
    } finally {
      $("saveBtn").disabled = false;
    }
  });

  async function removeGroup(g) {
    if (!confirm('Hapus grup "' + g.namagc + '"?')) return;
    try {
      await api("/api/groups?id=" + encodeURIComponent(g.id), { method: "DELETE" });
      if (editingId === g.id) resetForm();
      await loadMine();
      toast("Grup dihapus");
    } catch (e) {
      if (!handleAuthError(e)) toast(e.message);
    }
  }

  // ---- ganti password
  $("pwForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const msg = $("pwMsg");
    msg.className = "form-msg";
    msg.textContent = "";
    try {
      await api("/api/password", {
        method: "POST",
        body: JSON.stringify({ oldPassword: $("pw-old").value, newPassword: $("pw-new").value })
      });
      $("pwForm").reset();
      msg.textContent = "Password diganti";
    } catch (e) {
      if (!handleAuthError(e)) { msg.className = "form-msg err"; msg.textContent = e.message; }
    }
  });

  // ---- mulai: cek sesi
  (async () => {
    try {
      const s = await api("/api/session");
      await showApp(s.username);
    } catch {
      showAuth();
    }
  })();
})();
