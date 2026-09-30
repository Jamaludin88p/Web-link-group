# Web Kumpulan Link Grup

Situs statis, tanpa build. Semua pengaturan ada di `config.js`.

## Tambah grup baru
Buka `config.js`, lalu tambahkan satu baris di dalam `grup: [ ... ]`:

    { namagc: "Nama Grup", linkgc: "https://chat.whatsapp.com/xxxx", deskripsi: "opsional" },

Simpan, commit, push. Vercel akan deploy ulang dan grup baru otomatis tampil.

## Deploy ke Vercel
1. Upload folder ini ke repo GitHub.
2. Di vercel.com pilih Add New > Project > import repo.
3. Framework Preset: Other. Build Command dan Output Directory dikosongkan. Klik Deploy.

Atau lewat CLI: `npm i -g vercel` lalu jalankan `vercel --prod` di folder ini.
