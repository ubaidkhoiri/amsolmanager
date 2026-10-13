# Operasional amsolmanager

## Environment

Tiga lapis: lokal (.env), preview (branch Neon terpisah bila ada), produksi (secret Cloudflare Workers). Database staging belum ada, jadi tes integrasi menembak database produksi. Jangan jalankan `test:integration` setelah data asli masuk.

## Secret produksi

Satu secret wajib: `DATABASE_URL` tanpa tanda kutip. Cara set:

```
npx wrangler secret put DATABASE_URL
```

Tempel connection string mentah lalu Enter. Cek daftar tanpa nilai: `npx wrangler secret list`. Verifikasi lewat `https://<worker>/api/health`, kolom `dbConfigured` harus true.

## Migrasi

Urutan baku: ubah schema di `src/lib/server/db/schema`, `npx drizzle-kit generate`, review SQL di `drizzle/`, jalankan lokal bila ada DB dev, lalu produksi:

```
node scripts/db-migrate.mjs
```

Script membaca journal `drizzle/meta/_journal.json` dan mencatat di tabel `schema_migrations`, idempoten. Jangan ubah schema produksi manual tanpa file migrasi.

## Backup dan restore (Neon)

1. Di dashboard Neon pilih project, buka tab Backups atau Branches.
2. Pastikan Point-in-Time Recovery aktif sesuai paket. Catat retensi yang berlaku.
3. Sebelum tiap perubahan besar (migrasi berisiko, impor massal), buat branch dari titik saat itu sebagai snapshot manual.
4. Uji restore: buat branch dari backup, arahkan DATABASE_URL lokal ke branch itu, jalankan smoke. Jangan uji restore di database produksi.
5. Bila restore produksi diperlukan, lakukan dari dashboard Neon (restore ke titik waktu atau promosikan branch), lalu redeploy worker dan cek `/api/health`.

Penanggung jawab restore: MOD teknis yang memegang akses Neon dan Cloudflare.

## Deploy

```
npm run build
npx wrangler deploy
```

Smoke pascadeploy:

```
curl https://<worker>/api/health
curl -I https://<worker>/access
curl -I https://<worker>/app
```

Harapan: health 200 dengan `dbConfigured: true`, `/access` 200, `/app` 303 ke `/access` tanpa sesi.

## Batas yang diketahui

Driver neon-http tak dukung transaksi multi-statement. Tulis keuangan dan audit jalan berurutan lewat helper `writeAudit` di finance server. Audit gagal hanya masuk log server, tulis utama tetap sah. Bila butuh atomicity penuh, pindah ke driver Pool.

Sesi cookie `amsol_session`, TTL 7 hari, httpOnly, SameSite lax, secure bila https. Rate limit login 10 percobaan per 10 menit per kombinasi IP dan member.

Kode akses bersama bukan bukti identitas individu. Audit log mencatat member sesi, bukan orang yang sebenarnya. Rotasi kode dari halaman Anggota membuat kode lama tak berlaku untuk sesi baru.
