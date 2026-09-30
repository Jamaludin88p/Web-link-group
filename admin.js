(() => {
  const $ = (id) => document.getElementById(id);
  const C = window.CONFIG || {};
  const AVATAR_COLORS = ["#FFD84D", "#9EE6C1", "#FFB4A2", "#B9D7FF", "#E3C2FF", "#FFC6E0"];

  document.title = "Admin - " + (C.namaSitus || "Kumpulan Link Grup");
  $("brand").textContent = "Admin " + (C.namaBot || "");
  if (C.favicon) $("favicon").href = C.favicon;

  let groups = [];
  let editingId = null;

  // ---- helper
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
      headers: { "Content-Type": "application/json", "X-Requested-With": "admin", ...(opts.headers || {}) }
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
  function showLogin() {
    $("panelView").hidden = true;
    $("logout").hidden = true;
    $("loginView").hidden = false;
    $("u").focus();
  }
  async function showPanel(username) {
    $("loginView").hidden = true;
    $("panelView").hidden = false;
    $("logout").hidden = false;
    $("who").textContent = "Masuk sebagai " + username;
    await loadGroups();
  }
  function handleAuthError(e) {
    if (e.status === 401) { showLogin(); return true; }
    return false;
  }

  // ---- daftar grup
  async function loadGroups() {
    try {
      const d = await api("/api/groups?fresh=1");
      groups = d.groups || [];
      renderRows();
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

  function renderRows() {
    const list = groups.slice().reverse(); // terbaru di atas
    $("rows").replaceChildren(...list.map(row));
    $("rowsEmpty").hidden = list.length > 0;
    $("count").textContent = list.length ? list.length + " grup" : "";
  }

  // ---- form tambah / ubah
  function resetForm() {
    editingId = null;
    $("groupForm").reset();
    $("formTitle").textContent = "Tambah grup";
    $("saveBtn").textContent = "Tambah grup";
    $("cancelBtn").hidden = true;
    $("formErr").textContent = "";
  }
  function startEdit(g) {
    editingId = g.id;
    $("f-nama").value = g.namagc;
    $("f-link").value = g.linkgc;
    $("f-img").value = g.imgprofile || "";
    $("f-desc").value = g.deskripsi || "";
    $("formTitle").textContent = "Ubah grup";
    $("saveBtn").textContent = "Simpan perubahan";
    $("cancelBtn").hidden = false;
    $("formErr").textContent = "";
    $("groupForm").scrollIntoView({ behavior: "smooth", block: "start" });
    $("f-nama").focus();
  }
  $("cancelBtn").addEventListener("click", resetForm);

  $("groupForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const payload = {
      namagc: $("f-nama").value,
      linkgc: $("f-link").value,
      imgprofile: $("f-img").value,
      deskripsi: $("f-desc").value
    };
    const wasEditing = !!editingId;
    $("saveBtn").disabled = true;
    $("formErr").textContent = "";
    try {
      if (wasEditing) {
        await api("/api/groups?id=" + encodeURIComponent(editingId), { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/api/groups", { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      await loadGroups();
      toast(wasEditing ? "Perubahan disimpan" : "Grup ditambahkan");
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
      await loadGroups();
      toast("Grup dihapus");
    } catch (e) {
      if (!handleAuthError(e)) toast(e.message);
    }
  }

  // ---- login / logout
  $("loginForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    $("loginErr").textContent = "";
    $("loginBtn").disabled = true;
    try {
      const d = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username: $("u").value, password: $("p").value })
      });
      $("p").value = "";
      await showPanel(d.username);
    } catch (e) {
      $("loginErr").textContent = e.message;
    } finally {
      $("loginBtn").disabled = false;
    }
  });

  $("logout").addEventListener("click", async () => {
    try { await api("/api/session", { method: "DELETE" }); } catch {}
    groups = [];
    resetForm();
    showLogin();
  });

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
      await showPanel(s.username);
    } catch {
      showLogin();
    }
  })();
})();
