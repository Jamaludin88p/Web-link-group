# Web Kumpulan Link Grup (dengan admin + MongoDB)

Situs statis + serverless API di Vercel. Grup bisa ditambah dua cara:
1. Lewat halaman **/admin** (disimpan di MongoDB, langsung tampil tanpa deploy ulang).
2. Lewat `config.js` (cara lama, tetap jalan). Set `pakaiDatabase: false` untuk mematikan database.

## 1. Siapkan MongoDB Atlas (gratis)
1. Buat cluster gratis di mongodb.com/atlas, lalu buat Database User (username + password).
2. Network Access > Add IP Address > **Allow access from anywhere (0.0.0.0/0)**. Vercel memakai IP yang berubah-ubah.
3. Connect > Drivers > salin connection string, ganti `<password>` dengan password user tadi.

## 2. Isi Environment Variables di Vercel
Project > Settings > Environment Variables (lalu Redeploy):

| Nama | Isi |
|---|---|
| MONGODB_URI | connection string dari Atlas |
| MONGODB_DB | linkgc (boleh diubah) |
| AUTH_SECRET | teks acak panjang, minimal 16 karakter |
| ADMIN_USER | username admin pertama |
| ADMIN_PASS | password admin pertama, minimal 8 karakter |

Akun admin dibuat otomatis saat login pertama, lalu passwordnya bisa diganti dari halaman admin. Setelah itu ADMIN_PASS tidak dipakai lagi.

## 3. Pakai
Buka `https://domainmu/admin`, masuk, lalu tambah / ubah / hapus grup.

## Struktur
- `index.html`, `app.js`, `style.css`, `config.js` : halaman publik
- `admin.html`, `admin.js`, `admin.css` : halaman admin
- `api/` : login, session, groups, password (serverless, Node.js)
- `package.json` : satu dependensi (`mongodb`)

## Keamanan yang sudah ada
- Password disimpan sebagai hash scrypt, tidak pernah plain text.
- Sesi memakai cookie HttpOnly + Secure + SameSite=Strict, berlaku 7 hari.
- Maksimal 8 kali salah password per IP dalam 15 menit.
- Semua perubahan data wajib login. Daftar grup untuk publik di-cache singkat di CDN agar database tidak dibebani.

Jangan commit file `.env`. Untuk tes lokal: salin `.env.example` ke `.env.local`, lalu jalankan `npm i` dan `vercel dev`.
