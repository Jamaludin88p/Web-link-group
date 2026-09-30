# Web Kumpulan Link Grup WhatsApp (login + MongoDB)

- Semua orang bisa **melihat** daftar grup di halaman utama.
- Untuk **upload** link grup, pengunjung harus daftar / masuk dulu di `/upload`.
- Hanya link grup WhatsApp (`chat.whatsapp.com/...`) yang diterima. Link lain ditolak.
- Setiap orang hanya bisa mengubah / menghapus grup miliknya sendiri.
- Grup yang ditulis di `config.js` tetap tampil (cara lama). Set `pakaiDatabase: false` untuk mematikan database.

## Environment Variables di Vercel (hanya 3, dua wajib)
| Nama | Isi |
|---|---|
| MONGODB_URI | connection string dari MongoDB Atlas (wajib) |
| AUTH_SECRET | teks acak, minimal 16 karakter (wajib) |
| MONGODB_DB | nama database, default `linkgc` (opsional) |

Setelah mengisi atau mengubah variabel, lakukan **Redeploy**.
MongoDB Atlas: Network Access harus mengizinkan `0.0.0.0/0` karena IP Vercel berubah-ubah.

## Perlindungan bawaan
- Password disimpan sebagai hash scrypt.
- Sesi memakai cookie HttpOnly + Secure + SameSite=Strict (7 hari).
- Maksimal 8 salah password per IP per 15 menit.
- Maksimal 5 pendaftaran per IP per jam.
- Maksimal 5 upload per akun per jam, dan 20 grup per akun.
- Link grup unik: link yang sama tidak bisa diupload dua kali.

## Menghapus grup / akun bermasalah
Buka MongoDB Atlas > Browse Collections > database `linkgc` > koleksi `groups` (atau `users`), lalu hapus dokumennya.

## Struktur
- `index.html`, `app.js`, `style.css`, `config.js` : halaman daftar (publik)
- `upload.html`, `upload.js`, `upload.css` : masuk / daftar dan upload
- `api/` : register, login, session, groups, password (serverless Node.js)
- `package.json` : satu dependensi (`mongodb`)
