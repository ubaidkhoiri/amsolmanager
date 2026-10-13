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

## Backup dan restore (Neon, teruji 2026-10-13)

Project `amsolmanager` paket free. Retensi point-in-time 6 jam. Branch tetap: `production` (default) dan `staging` (salinan untuk tes dan coba migrasi).

1. Sebelum tiap perubahan besar (migrasi berisiko, impor massal), buat branch snapshot manual: `npx neonctl branches create --project-id restless-recipe-46829563 --name pra-rilis-TANGGAL --parent production`.
2. Tes integrasi selalu lawan staging. `.env` wajib ada `TEST_DATABASE_URL` (connection string branch staging). Tanpa itu tes fallback ke produksi, jangan jalankan.
3. Migrasi ke staging dulu: `MIGRATE_URL=<staging-cs> node scripts/db-migrate.mjs`. Script idempoten, sudah teruji skip 7 file di staging.
4. Uji restore yang sudah terbukti jalan: sisip marker di staging, catat T0, `branches restore restore-test staging@T0`, marker hilang di branch restore (0) dan tetap ada di staging (1). Bersihkan marker dan hapus branch uji.
5. Bila restore produksi diperlukan: `branches restore production production@<ISO-dalam-6-jam>` atau dari dashboard, lalu redeploy worker dan cek `/api/health`. Jangan restore tanpa snapshot branch dulu.

Penanggung jawab restore: MOD teknis yang memegang akses Neon dan Cloudflare. Login CLI: `npx neonctl auth`.

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
