/* ==========================================================
   CONFIG — edit file ini saja untuk mengatur web.
   Setiap kali kamu menambah grup di bagian `grup`,
   grup itu otomatis muncul di daftar setelah di-deploy.
   ========================================================== */

window.CONFIG = {
  // Tampilan umum
  namaSitus: "Kumpulan Link Grup",
  namaBot: "NamaBotKamu",                 // tampil di pojok kiri atas
  favicon: "https://u.pone.rs/raqbrzjd.jpg",   // ikon di tab browser / samping URL (bisa link atau path file, mis. "img/logo.jpg")
  judul: "Temukan grup, langsung gabung.",
  deskripsi: "Daftar grup resmi yang dikelola bot kami. Klik Gabung untuk masuk, atau salin link untuk dibagikan.",

  // Tombol kontak di pojok kanan atas (kosongkan url untuk menyembunyikan)
  kontak: {
    label: "Hubungi admin",
    url: "https://wa.me/6281234567890"
  },

  // Pengaturan daftar
  urutanTerbaru: true,     // true = grup terbaru (paling bawah di bawah) tampil paling atas
  jumlahBadgeBaru: 3,      // berapa grup terakhir yang diberi label "Baru" (0 = matikan)
  pakaiDatabase: true,     // true = ikut menampilkan grup dari MongoDB (yang ditambah lewat /admin)

  footer: "Dikelola oleh admin NamaBotKamu",

  /* ------------------------------------------------------
     DAFTAR GRUP
     Tambah baris baru di bawah dengan format:
       { namagc: "Nama Grup", linkgc: "https://chat.whatsapp.com/xxxx" },
     `deskripsi` dan `imgprofile` (foto profil grup) boleh diisi, boleh dihapus.
     Contoh: imgprofile: "https://contoh.com/foto.jpg"
     Kalau kosong atau gambar gagal dimuat, otomatis pakai inisial nama grup.
     Link Telegram / Discord / Saluran WhatsApp juga bisa.
     ------------------------------------------------------ */
  grup: [
    {
      namagc: "Grup Utama Komunitas",
      linkgc: "https://chat.whatsapp.com/GANTI_LINK_1",
      imgprofile: "https://GANTI-DENGAN-URL-GAMBAR.jpg",
      deskripsi: "Tempat ngobrol santai dan info terbaru dari bot."
    },
    {
      namagc: "Info & Update Bot",
      linkgc: "https://chat.whatsapp.com/GANTI_LINK_2",
      deskripsi: "Pengumuman fitur baru dan perbaikan."
    },
    {
      namagc: "Diskusi Bebas",
      linkgc: "https://chat.whatsapp.com/GANTI_LINK_3"
    },
    {
      namagc: "Jual Beli & Promosi",
      linkgc: "https://chat.whatsapp.com/GANTI_LINK_4",
      deskripsi: "Khusus lapak dan promosi, patuhi aturan grup."
    },
    {
      namagc: "Channel Telegram",
      linkgc: "https://t.me/GANTI_USERNAME",
      deskripsi: "Cadangan kalau grup WhatsApp penuh."
    }
    // { namagc: "Grup Baru", linkgc: "https://chat.whatsapp.com/xxxx" },
  ]
};
