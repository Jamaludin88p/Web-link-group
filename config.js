/* ==========================================================
   CONFIG — edit file ini saja untuk mengatur web.
   Setiap kali kamu menambah grup di bagian `grup`,
   grup itu otomatis muncul di daftar setelah di-deploy.
   ========================================================== */

window.CONFIG = {
  // Tampilan umum
  namaSitus: "Kumpulan Link Grup",
  namaBot: "Lich MD",
  favicon: "https://u.pone.rs/raqbrzjd.jpg",// tampil di pojok kiri atas
  judul: "Temukan grup, langsung gabung.",
  deskripsi: "Daftar grup resmi yang dikelola bot kami. Klik Gabung untuk masuk, atau salin link untuk dibagikan.",

  // Tombol kontak di pojok kanan atas (kosongkan url untuk menyembunyikan)
  kontak: {
    label: "Hubungi admin",
    url: "https://wa.me/6285134116039"
  },

  // Pengaturan daftar
  urutanTerbaru: true,     // true = grup terbaru (paling bawah di bawah) tampil paling atas
  jumlahBadgeBaru: 3,      // berapa grup terakhir yang diberi label "Baru" (0 = matikan)

  footer: "Dikelola oleh admin Skyline",

  /* ------------------------------------------------------
     DAFTAR GRUP
     Tambah baris baru di bawah dengan format:
       { namagc: "Nama Grup", linkgc: "https://chat.whatsapp.com/xxxx" },
     `deskripsi` boleh diisi, boleh dihapus.
     Link Telegram / Discord / Saluran WhatsApp juga bisa.
     ------------------------------------------------------ */
  grup: [
    {
      namagc: "LICH - MD || Fast Respon",
      linkgc: "https://chat.whatsapp.com/CKThNoXDDJt3zW6A1vH9Td?s=cl&p=a&mlu=4&iam=2",
      imgprofile: "https://u.pone.rs/jsfpqage.jpg",
      deskripsi: "Tempat ngobrol santai dan info terbaru dari bot."
    }
    // { namagc: "Grup Baru", linkgc: "https://chat.whatsapp.com/xxxx" },
  ]
};
