# SinjiYi — siap untuk Vercel

Website katalog anime dengan tampilan gelap, aksen merah lembut, dan tanpa neon. Paket ini menggunakan Next.js App Router, React, TypeScript, dan Tailwind CSS, dengan API Kitsu publik. Tidak memerlukan API key atau database.

## Deploy lewat GitHub dan Vercel

1. Ekstrak `SinjiYi_Vercel.zip` di komputer.
2. Buat repository baru di GitHub, misalnya `sinjiyi`.
3. Upload **isi folder `SinjiYi_Vercel`** ke repository. Pastikan `package.json`, `package-lock.json`, `app`, dan `public` berada di tingkat paling atas repository.
4. Buka [Vercel New Project](https://vercel.com/new), hubungkan GitHub, lalu import repository tersebut.
5. Gunakan pengaturan berikut, kemudian klik **Deploy**.

| Pengaturan | Nilai |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `./` — folder yang berisi `package.json` |
| Build Command | `npm run build` (default) |
| Install Command | `npm ci` |
| Output Directory | Biarkan default Next.js |
| Environment Variables | Tidak diperlukan |

Jika kamu meng-upload folder `SinjiYi_Vercel` utuh sehingga `package.json` berada di dalam subfolder, pilih subfolder tersebut sebagai **Root Directory**.

Setelah build berhasil, buka URL `.vercel.app` yang diberikan Vercel. Perubahan berikutnya dapat dikirim ke repository GitHub untuk memicu deployment baru.

## Jalankan di komputer

Gunakan Node.js 22.13 atau lebih baru dan npm.

```sh
npm ci
npm run dev
```

Buka `http://localhost:3000`.

Untuk menjalankan build produksi:

```sh
npm run build
npm start
```

Alternatif deploy dari terminal, jalankan dari folder yang berisi `package.json`:

```sh
npx vercel --prod
```

Ikuti login dan pemilihan project yang ditampilkan Vercel CLI.

## Fitur dan cara kerja

- Pencarian anime, filter genre, serial TV, film, dan anime yang sedang tayang.
- Detail anime, rating, sinopsis, daftar episode, dan pagination.
- Favorit disimpan di browser perangkat yang digunakan.
- Trailer diputar melalui embed YouTube jika tersedia.
- Tombol layanan streaming membuka provider yang terdaftar di Kitsu.
- Data katalog awal dan gambar pilihan tersedia secara lokal agar halaman awal tetap tampil saat API mengalami gangguan.

**Episode penuh tidak di-host atau diputar oleh SinjiYi.** API Kitsu menyediakan metadata dan tautan layanan streaming, bukan file video episode. Akses episode penuh mengikuti ketersediaan wilayah dan ketentuan provider.

Browser mengambil data langsung dari API Kitsu, dengan route API Next.js sebagai cadangan. Jika API tidak tersedia, sebagian halaman dapat menampilkan data katalog tersimpan disertai pemberitahuan; detail atau filter tertentu bisa sementara tidak tersedia.

## File utama

| File/folder | Kegunaan |
| --- | --- |
| `app/sinjiyi.tsx` | Antarmuka, pencarian, detail, trailer, dan favorit |
| `app/globals.css` | Warna, tipografi, dan layout responsif |
| `app/layout.tsx` | Judul situs dan metadata |
| `app/api/` | Route API untuk Vercel Functions |
| `lib/public-api.ts` | Permintaan API dari browser |
| `lib/catalog.ts` | Permintaan API dari server dan katalog cadangan |
| `data/` | Snapshot katalog dan pemetaan gambar |
| `public/assets/` | Gambar lokal |
| `vercel.json` | Deteksi framework Next.js |

Untuk mengganti nama situs, edit `app/layout.tsx` dan teks di `app/sinjiyi.tsx`. Untuk mengganti warna, edit variabel dan aturan CSS di `app/globals.css`.

## Jika deploy bermasalah

- **Framework terdeteksi sebagai Other:** pastikan Root Directory menunjuk folder yang berisi `package.json`, kemudian pilih Next.js.
- **Module tidak ditemukan:** pastikan seluruh isi paket sudah di-upload, termasuk folder `lib`, `components`, `data`, dan `vendor`.
- **Halaman awal tampil, tetapi data baru tidak muncul:** coba lagi setelah beberapa saat; API Kitsu adalah layanan eksternal dan bisa mengalami pembatasan atau gangguan.
- **Favorit berbeda di perangkat lain:** favorit disimpan lokal di browser, tanpa akun atau sinkronisasi cloud.

## Referensi

- [Dokumentasi API Kitsu di GitHub](https://github.com/hummingbird-me/api-docs)
- [API Kitsu](https://kitsu.io/api/edge)
- [Deploy Next.js di Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel dengan GitHub](https://vercel.com/docs/git/vercel-for-github)

Metadata dan gambar anime berasal dari Kitsu; hak atas anime dan artwork tetap dimiliki pemegang hak masing-masing. SinjiYi tidak berafiliasi dengan Kitsu atau provider streaming yang ditampilkan.
