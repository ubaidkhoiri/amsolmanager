# GenAwards: Cook Edition

## Product Requirements Document (PRD) + Software Design Document (SDD)

**Dokumen:** PRD/SDD v1.0
**Status:** Draft siap diturunkan menjadi implementasi
**Produk:** Internal Event Management & Coordination Webapp
**Event:** Pengajian Akhir Tahun (PAT) — GenAwards: Cook Edition
**Target pengguna:** ±30 panitia, 7 divisi, dan pengurus inti

---

# PART I — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Product Overview

### 1.1 Visi produk

GenAwards: Cook Edition adalah webapp internal untuk menjadi pusat informasi dan koordinasi kepanitiaan PAT, dari persiapan musyawarah hingga pelaksanaan dan evaluasi acara.

Aplikasi menghubungkan hasil musyawarah, keputusan, tugas, kebutuhan lintas-divisi, timeline, publikasi PDD IT, dan keuangan dalam satu sistem yang mudah diakses melalui HP.

### 1.2 Masalah yang diselesaikan

1. Hasil musyawarah tersebar dan sulit ditemukan kembali.
2. Keputusan belum tentu ditindaklanjuti menjadi tugas yang jelas.
3. Kebutuhan antar-divisi berpotensi tidak terrespons.
4. Timeline persiapan dan publikasi tidak terlihat oleh semua pihak yang membutuhkan.
5. Status pekerjaan dan penggunaan anggaran sulit dipantau bersama.
6. Pengurus inti harus mengumpulkan informasi manual dari banyak divisi.

### 1.3 Product goals

- Menjadikan keputusan dan notulen sebagai sumber informasi resmi.
- Memastikan pekerjaan mempunyai penanggung jawab dan tenggat yang jelas.
- Memudahkan koordinasi lintas-divisi.
- Memberikan visibilitas terhadap progres persiapan dan publikasi.
- Menyediakan transparansi keuangan dengan akses pencatatan yang terkontrol.
- Mengurangi ketergantungan pada pencarian chat dan laporan manual.

### 1.4 Non-goals

Tidak termasuk dalam MVP:

- Chat realtime seperti WhatsApp atau Slack.
- Video conference.
- Otomatisasi publikasi media sosial.
- Aplikasi mobile native.
- Akuntansi double-entry atau pembukuan profesional.
- Approval workflow yang kompleks untuk setiap perubahan.
- Multi-tenant SaaS dengan billing.
- Integrasi Google Drive atau penyimpanan file khusus yang kompleks.
- AI assistant di dalam aplikasi.
- Push notification kompleks.

---

## 2. Target users & organization

### 2.1 Struktur kepanitiaan

**Pengurus inti**

- Ketua
- Wakil Ketua
- Sekretaris
- Bendahara

**Divisi**

1. PDD IT
2. Acara
3. Konsumsi
4. Perkab
5. P3K
6. Lighting
7. Tempat

MOD merupakan role administratif sistem, bukan jabatan organisasi baru. Seseorang dapat memiliki jabatan organisasi sekaligus role akses sistem.

### 2.2 Role sistem

**MOD — Admin utama**

- Mengelola seluruh data dan konfigurasi event.
- Mendaftarkan, mengaktifkan, dan menonaktifkan anggota.
- Mengelola divisi, kode akses, dan izin.
- Mengelola seluruh musyawarah, tugas, permintaan bantuan, timeline, publikasi, dan keuangan.
- Memiliki akses koreksi administratif dengan audit log.

**Admin divisi**

- Mengelola pekerjaan dalam divisinya.
- Mencatat hasil diskusi dan mengirim ringkasan divisi.
- Mengelola tugas divisi sesuai izin.
- Menanggapi permintaan bantuan yang diterima.
- Mengelola item timeline dan publikasi yang ditugaskan kepada divisinya.
- Mengajukan koreksi keputusan dan data terkait.

**Panitia**

- Melihat pengumuman dan hasil musyawarah yang dibagikan.
- Melihat tugas dan timeline.
- Memperbarui progres tugas yang ditugaskan kepadanya.
- Mengajukan permintaan bantuan.
- Berkontribusi pada pekerjaan yang diizinkan.
- Melihat ledger dan anggaran sesuai kebijakan transparansi.

---

## 3. Product scope

### P0 — Fondasi aplikasi

- Akses berbasis kode.
- Registrasi anggota oleh MOD.
- Manajemen role dan divisi.
- Dashboard.
- Pengumuman.
- Musyawarah, agenda, notulen, dan keputusan.
- Tugas, PIC, deadline, dan status.
- Validasi dan otorisasi server.
- Database migration dan deployment.

### P1 — Koordinasi operasional

- Ruang kerja tujuh divisi.
- Permintaan bantuan lintas-divisi.
- Timeline event.
- Kalender dan workflow publikasi PDD IT.
- Ledger keuangan.
- Anggaran per divisi.
- Perbandingan rencana vs realisasi.
- Audit log untuk perubahan sensitif.

### P2 — Penyempurnaan

- Pencarian global.
- Ekspor CSV untuk laporan yang sesuai.
- Ringkasan progres pengurus.
- Pengingat deadline.
- Arsip event.
- Peningkatan aksesibilitas dan optimasi performa.

P2 tidak boleh menunda rilis P0 dan P1 jika kriteria penerimaan keduanya sudah terpenuhi.

---

## 4. Functional requirements

### FR-01 — Event & dashboard

Sistem menyediakan satu event aktif bernama GenAwards: Cook Edition.

Dashboard menampilkan:

- Agenda atau deadline terdekat.
- Tugas yang ditugaskan kepada pengguna.
- Keputusan terbaru.
- Permintaan bantuan yang menunggu respons.
- Ringkasan progres lintas-divisi.
- Ringkasan keuangan.
- Aktivitas yang memerlukan perhatian.

Data dashboard harus berasal dari data tersimpan, bukan angka statis.

MOD dapat memperbarui identitas event, periode pelaksanaan, dan status event.

### FR-02 — Akses dan anggota

- MOD mendaftarkan anggota.
- Setiap anggota memiliki ID internal, nama, jabatan opsional, divisi, dan status aktif.
- Kode akses dibedakan menurut role.
- Kode tidak boleh disimpan dalam bentuk plaintext.
- Server memvalidasi akses sebelum memproses permintaan terlindungi.
- Sesi dapat dicabut.
- Kode dapat dirotasi.
- Anggota nonaktif tidak dapat membuat sesi baru.
- Data anggota dan role hanya dapat dikelola pihak berwenang.

**Batas keamanan:** pemilihan nama anggota dan penggunaan kode bersama tidak membuktikan identitas orang yang sebenarnya. Jika menggunakan model ini, audit log hanya mengidentifikasi anggota yang dipilih pada sesi tersebut.

### FR-03 — Musyawarah

Setiap musyawarah memiliki:

- Judul.
- Jenis musyawarah.
- Waktu dan lokasi opsional.
- Agenda.
- Status.
- Divisi terkait.
- Notulen.
- Ringkasan hasil.
- Keputusan.
- Tindak lanjut.

Jenis musyawarah minimal:

- Musyawarah besar.
- Diskusi divisi.

Status musyawarah:

`Draft → Scheduled → In Progress → Completed → Archived`

Pembatalan dapat menggunakan status tersendiri.

Admin divisi mencatat hasil pembahasan dalam ruang lingkup divisinya. Sekretaris merangkum musyawarah besar. MOD dapat melakukan koreksi administratif dengan jejak perubahan.

### FR-04 — Notulen dan keputusan

Notulen dibagi menjadi item pembahasan, bukan satu teks panjang saja.

Setiap item dapat memiliki:

- Topik.
- Ringkasan pembahasan.
- Usulan.
- Kendala.
- Hasil.
- Status penyelesaian.

Keputusan memiliki status:

- Draft.
- Needs Discussion.
- Final.
- Superseded.

Keputusan final harus mencatat waktu penetapan dan aktor yang menetapkan.

Keputusan final tidak boleh diubah secara diam-diam. Revisi harus mempertahankan riwayat sebelumnya dan alasan perubahan.

Keputusan dapat dikonversi menjadi satu atau beberapa tugas.

### FR-05 — Tugas

Setiap tugas memiliki:

- Judul dan deskripsi.
- Divisi pemilik.
- PIC opsional pada tahap perencanaan.
- Deadline.
- Prioritas.
- Status.
- Sumber keputusan atau musyawarah.
- Catatan progres.
- Waktu pembuatan dan pembaruan.

Status tugas:

`Backlog → Todo → In Progress → Blocked → Done`

Status tambahan `Cancelled` dapat digunakan dengan alasan pembatalan.

Tugas aktif wajib memiliki divisi pemilik. Tugas yang siap dieksekusi harus memiliki PIC dan deadline. Tugas perencanaan dapat belum memiliki PIC atau deadline.

Sistem tidak boleh menganggap tugas selesai hanya karena deadline telah lewat. Keterlambatan merupakan kondisi turunan berdasarkan tanggal dan status.

### FR-06 — Permintaan bantuan lintas-divisi

Setiap permintaan memiliki:

- Divisi peminta.
- Divisi tujuan.
- Deskripsi kebutuhan.
- Alasan atau konteks.
- Deadline kebutuhan.
- Prioritas.
- PIC peminta.
- PIC penerima opsional.
- Status.
- Respons dan riwayat aktivitas.

Status:

`Submitted → Under Review → Accepted → In Progress → Completed`

Status alternatif:

`Needs Information`, `Rejected`, `Cancelled`.

Permintaan hanya menjadi komitmen kerja setelah diterima oleh divisi tujuan.

Divisi penerima dapat meminta informasi tambahan atau menolak permintaan dengan alasan.

Permintaan yang diterima dapat dihubungkan dengan tugas yang akan dikerjakan.

### FR-07 — Timeline event

Timeline mencakup seluruh aktivitas persiapan hingga pascaacara.

Setiap item memiliki:

- Judul.
- Kategori.
- Tanggal atau rentang waktu.
- Divisi pemilik.
- PIC opsional.
- Status.
- Deskripsi.
- Relasi dengan tugas atau publikasi.

Kategori awal:

- Persiapan.
- Musyawarah.
- Acara.
- Logistik.
- Publikasi.
- Hari-H.
- Pascaacara.

Tampilan utama:

- Daftar kronologis.
- Tampilan kalender sederhana.

Filter minimal: divisi, kategori, status, dan rentang waktu.

### FR-08 — Publikasi PDD IT

Setiap publikasi memiliki:

- Judul konten.
- Kanal.
- Format konten.
- Target publikasi.
- PIC desain.
- PIC copywriting atau publikasi.
- Caption.
- Referensi atau tautan aset.
- Status approval.
- Tautan publikasi akhir.

Status:

`Idea → Draft → Review → Approved → Published`

Konten dapat dibatalkan atau dijadwalkan ulang dengan alasan.

Workflow awal:

1. Menentukan ide konten.
2. Membuat draft desain dan caption.
3. Mengirim untuk review.
4. Meminta approval dari pihak berwenang.
5. Menandai publikasi selesai.
6. Menyimpan tautan posting.

Milestone awal yang dapat dibuat oleh MOD atau admin PDD:

- Coming Soon.
- Perkenalan event.
- Perkenalan panitia.
- Informasi teknis.
- Pengingat acara.
- Live event.
- Recap acara.

Milestone tersebut merupakan template awal, bukan daftar konten yang wajib semuanya dibuat.

### FR-09 — Keuangan

Modul keuangan menggunakan ledger sederhana dengan anggaran per divisi.

Jenis transaksi:

- Pemasukan.
- Pengeluaran.

Data transaksi:

- Tanggal.
- Jenis.
- Nominal.
- Kategori.
- Divisi terkait opsional.
- Deskripsi.
- Referensi bukti atau tautan.
- Pencatat.
- Waktu pencatatan.
- Status pembatalan atau koreksi.

Aturan:

- Semua panitia aktif dapat membaca transaksi dan ringkasan keuangan.
- Bendahara dan MOD dapat membuat serta mengoreksi transaksi.
- Koreksi dan pembatalan tidak menghapus riwayat transaksi sebelumnya.
- Nilai nominal harus positif.
- Penyimpanan nominal menggunakan tipe numerik yang sesuai, bukan floating-point.
- Saldo dihitung dari transaksi yang valid dan tidak dibatalkan.
- Transaksi yang dibatalkan tidak dihitung dalam saldo.

Anggaran per divisi memiliki:

- Periode atau cakupan event.
- Divisi.
- Kategori.
- Nilai anggaran.
- Catatan.
- Pembuat dan waktu perubahan.

Sistem menampilkan:

- Anggaran yang direncanakan.
- Realisasi pengeluaran.
- Sisa anggaran.
- Persentase penggunaan.
- Selisih rencana vs realisasi.

Rumus:

`Sisa anggaran = Anggaran − Realisasi pengeluaran`

`Selisih realisasi = Realisasi pengeluaran − Anggaran`

Nilai positif pada selisih menunjukkan pengeluaran melebihi anggaran. Pemasukan dan pengeluaran harus ditampilkan terpisah agar interpretasi keuangan tidak rancu.

Anggaran tidak boleh dihitung dari transaksi yang tidak terkait dengan divisi atau kategori yang relevan.

### FR-10 — Audit log

Audit log mencatat aktivitas sensitif, minimal:

- Perubahan role dan status anggota.
- Rotasi kode akses.
- Perubahan keputusan final.
- Perubahan transaksi keuangan.
- Pembatalan transaksi.
- Perubahan konfigurasi event.

Setiap log mencatat:

- ID aktor yang terkait dengan sesi.
- Jenis aksi.
- Jenis dan ID objek.
- Waktu.
- Ringkasan perubahan.
- Alasan untuk tindakan koreksi jika diperlukan.

Jangan menyimpan kode rahasia, token sesi, atau kredensial dalam log.

---

## 5. Non-functional requirements

### NFR-01 — Mobile-first

- Mendukung layar mulai sekitar 320 px.
- Tidak ada horizontal overflow pada halaman utama.
- Navigasi dan tindakan utama mudah dijangkau dengan satu tangan.
- Form panjang dipecah menjadi bagian logis.
- Tabel desktop diadaptasi menjadi daftar atau kartu pada HP.
- Status tidak dibedakan hanya dengan warna.
- Target sentuh ideal minimal 44 × 44 CSS px.

### NFR-02 — Performance

Target awal untuk perangkat mobile dan jaringan yang wajar:

- Konten utama dapat dibaca tanpa menunggu seluruh interaksi client-side.
- Hindari memuat semua data event sekaligus.
- Gunakan pagination atau batas jumlah data untuk daftar panjang.
- Hindari query berulang yang tidak diperlukan.
- Target p95 respons server untuk operasi CRUD sederhana maksimal 500 ms pada kondisi pengujian yang ditentukan, tidak termasuk cold start dan latensi eksternal.

Target performa harus divalidasi di lingkungan deployment; bukan klaim bahwa angka tersebut otomatis tercapai.

### NFR-03 — Security

- Validasi input di server.
- Otorisasi server-side pada setiap operasi terlindungi.
- Proteksi CSRF untuk mekanisme cookie/session yang relevan.
- Cookie sesi menggunakan `HttpOnly`, `Secure` pada produksi, dan kebijakan `SameSite` yang sesuai.
- Rate limiting untuk percobaan kode akses.
- Rahasia disimpan melalui environment secrets.
- Tidak ada kredensial database pada client bundle.
- Kesalahan produksi tidak mengekspos stack trace atau rahasia.
- Data sensitif tidak di-cache secara publik.
- Dependency dan konfigurasi deployment diperiksa sebelum rilis.

### NFR-04 — Reliability

- Migrasi database terdokumentasi dan tersimpan di Git.
- Backup database memiliki prosedur pemulihan yang diketahui.
- Operasi keuangan yang saling bergantung dijalankan secara konsisten.
- Error operasional dicatat tanpa membocorkan data sensitif.
- Perubahan schema diuji sebelum deployment produksi.

### NFR-05 — Maintainability

- TypeScript strict mode.
- Struktur modul berdasarkan domain.
- Business logic terpisah dari komponen UI.
- Satu sumber kebenaran untuk permission.
- Penamaan dan format kode konsisten.
- Unit test untuk logika bisnis dan integration test untuk akses database serta izin.

---

## 6. Acceptance criteria produk

MVP dapat dinyatakan siap apabila skenario berikut lulus.

### Akses

- Anggota aktif dengan kode valid dapat masuk.
- Kode invalid ditolak.
- Anggota nonaktif tidak dapat membuka sesi baru.
- Admin divisi tidak dapat mengakses operasi MOD melalui URL atau request langsung.
- Rotasi kode membuat kode lama tidak berlaku untuk sesi baru.
- Sesi yang dicabut tidak lagi dapat digunakan.

### Musyawarah

- Admin divisi dapat menyimpan notulen divisinya.
- Sekretaris dapat merangkum musyawarah besar.
- Keputusan final tidak dapat diedit tanpa jalur koreksi yang berizin.
- Revisi keputusan meninggalkan riwayat.
- Keputusan dapat menghasilkan tugas yang memiliki referensi sumber.

### Tugas dan koordinasi

- Tugas memiliki divisi pemilik.
- Tugas siap eksekusi memiliki PIC dan deadline.
- Panitia tidak dapat mengubah tugas milik orang lain di luar izin yang diberikan.
- Permintaan bantuan dapat diterima, ditolak, atau meminta informasi tambahan.
- Status tugas dan permintaan bantuan tersimpan secara konsisten.

### Timeline dan publikasi

- Timeline dapat difilter berdasarkan divisi dan status.
- Konten yang belum disetujui tidak dapat ditandai approved oleh pihak tanpa izin.
- Publikasi selesai dapat menyimpan tautan posting.
- Perubahan jadwal terlihat pada data terbaru.

### Keuangan

- Seluruh panitia dapat membaca ledger.
- Hanya role berizin yang dapat menulis transaksi.
- Nominal dan saldo dihitung secara konsisten.
- Koreksi transaksi meninggalkan riwayat.
- Anggaran per divisi menunjukkan realisasi dan sisa anggaran yang benar.

### Operasional

- Halaman utama dapat digunakan di layar HP tanpa horizontal overflow.
- Build produksi berhasil.
- Migrasi database dapat dijalankan pada database target.
- Tes permission negatif lulus.
- Backup dan pemulihan telah diuji sebelum aplikasi dipakai untuk pencatatan penting.

---

# PART II — SOFTWARE DESIGN DOCUMENT (SDD)

## 7. Architecture

### 7.1 Stack

| Layer              | Teknologi                                    |
| ------------------ | -------------------------------------------- |
| Web framework      | SvelteKit                                    |
| Language           | TypeScript                                   |
| UI styling         | Tailwind CSS                                 |
| Database           | Neon PostgreSQL                              |
| ORM                | Drizzle ORM                                  |
| Runtime/deployment | Cloudflare Workers                           |
| Repository         | GitHub                                       |
| CI/CD              | GitHub integration atau workflow yang sesuai |

Versi dependency harus dipatok pada implementasi dan diverifikasi kompatibilitasnya sebelum digunakan.

### 7.2 Architecture principles

1. Server-first: data dan business rules diproses di server.
2. Domain-oriented: modul mengikuti domain bisnis.
3. Database-first integrity: relasi dan constraint penting ditegakkan pada database.
4. Explicit permissions: setiap operasi memiliki izin yang terdefinisi.
5. Small deployable increments: setiap fase dapat diuji dan di-deploy.
6. No premature infrastructure: tidak menggunakan microservices atau realtime infrastructure tanpa kebutuhan nyata.

### 7.3 Request flow

Browser → SvelteKit server handler/action → validasi input → pemeriksaan sesi dan izin → service/domain logic → Drizzle → Neon PostgreSQL → response.

Client tidak pernah memegang kredensial database.

### 7.4 Deployment flow

GitHub repository → pemeriksaan otomatis → build dan test → deployment Cloudflare → smoke test → monitoring.

Deployment produksi tidak boleh berjalan jika build atau test wajib gagal.

---

## 8. Suggested project structure

```text
src/
├── app.html
├── hooks.server.ts
├── lib/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   ├── server/
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   ├── access-code.ts
│   │   │   └── permissions.ts
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   └── schema/
│   │   ├── domains/
│   │   │   ├── members/
│   │   │   ├── meetings/
│   │   │   ├── decisions/
│   │   │   ├── tasks/
│   │   │   ├── support-requests/
│   │   │   ├── timeline/
│   │   │   ├── publications/
│   │   │   ├── finance/
│   │   │   └── audit/
│   │   ├── validation/
│   │   └── utils/
│   └── types/
├── routes/
│   ├── access/
│   ├── app/
│   │   ├── +layout.server.ts
│   │   ├── +layout.svelte
│   │   ├── +page.server.ts
│   │   ├── meetings/
│   │   ├── tasks/
│   │   ├── divisions/
│   │   ├── support/
│   │   ├── timeline/
│   │   ├── publications/
│   │   ├── finance/
│   │   └── settings/
│   └── api/
├── app.css
└── ...
drizzle/
tests/
├── unit/
├── integration/
└── e2e/
```

Struktur di atas adalah panduan, bukan kewajiban membuat seluruh folder kosong sejak awal. Buat modul ketika fase implementasinya dimulai.

---

## 9. Data model

Semua tabel domain utama menggunakan UUID sebagai primary key, kecuali ada alasan teknis yang jelas untuk pilihan lain.

Tabel utama menggunakan `created_at` dan `updated_at` jika relevan.

### 9.1 `events`

- `id`
- `name`
- `slug`
- `description`
- `starts_at`
- `ends_at`
- `status`
- `created_at`
- `updated_at`

Constraint: slug unik.

MVP dapat mengoperasikan satu event aktif. Model tetap memiliki `event_id` untuk memudahkan pengarsipan dan kemungkinan penggunaan ulang.

### 9.2 `divisions`

- `id`
- `event_id`
- `name`
- `slug`
- `description`
- `is_active`
- `created_at`
- `updated_at`

Seed awal: tujuh divisi yang telah disepakati.

Constraint: nama atau slug unik dalam event.

### 9.3 `members`

- `id`
- `event_id`
- `division_id`, nullable untuk pengurus yang tidak terikat pada satu divisi
- `name`
- `organizational_position`, nullable
- `system_role`
- `status`
- `created_at`
- `updated_at`

Role awal: `MOD`, `DIVISION_ADMIN`, `COMMITTEE`.

Status: `ACTIVE`, `INACTIVE`.

### 9.4 `access_codes`

- `id`
- `event_id`
- `role`
- `code_hash`
- `version`
- `is_active`
- `created_at`
- `expires_at`, nullable
- `rotated_at`, nullable

Kode disimpan dalam bentuk hash menggunakan pendekatan yang sesuai untuk secret berentropi tinggi. Jangan menggunakan hash cepat tanpa pertimbangan jika kode yang digunakan berentropi rendah.

Rate limiting tetap wajib karena hash tidak mencegah brute-force.

### 9.5 `sessions`

- `id`
- `member_id`
- `session_token_hash`
- `created_at`
- `expires_at`
- `revoked_at`
- `last_seen_at`

Token mentah hanya dikirim kepada browser melalui mekanisme sesi yang aman; database menyimpan representasi hash.

### 9.6 `meetings`

- `id`
- `event_id`
- `title`
- `meeting_type`
- `division_id`, nullable
- `starts_at`
- `location`, nullable
- `agenda`
- `status`
- `created_by`
- `created_at`
- `updated_at`

`meeting_type`: `PLENARY`, `DIVISION`.

### 9.7 `minute_items`

- `id`
- `meeting_id`
- `division_id`, nullable
- `topic`
- `discussion_summary`
- `proposal`
- `outcome`
- `status`
- `created_by`
- `created_at`
- `updated_at`

Item notulen menyimpan pembahasan secara terstruktur.

### 9.8 `decisions`

- `id`
- `event_id`
- `meeting_id`
- `division_id`, nullable
- `title`
- `content`
- `status`
- `version`
- `decided_by`, nullable sebelum final
- `decided_at`, nullable
- `supersedes_decision_id`, nullable
- `created_by`
- `created_at`
- `updated_at`

Keputusan final yang direvisi harus menghasilkan riwayat versi atau keputusan pengganti. Jangan mengandalkan perubahan kolom `content` tanpa jejak.

### 9.9 `tasks`

- `id`
- `event_id`
- `division_id`
- `title`
- `description`
- `assigned_to`, nullable selama perencanaan
- `status`
- `priority`
- `due_at`, nullable selama perencanaan
- `source_decision_id`, nullable
- `created_by`
- `created_at`
- `updated_at`
- `completed_at`, nullable

Task yang siap dikerjakan harus memiliki PIC dan deadline.

### 9.10 `support_requests`

- `id`
- `event_id`
- `requesting_division_id`
- `target_division_id`
- `title`
- `description`
- `priority`
- `needed_by`, nullable
- `status`
- `requested_by`
- `accepted_by`, nullable
- `created_at`
- `updated_at`
- `completed_at`, nullable

Jika permintaan diterima dan membutuhkan pekerjaan terpisah, hubungkan dengan `tasks` melalui tabel relasi atau foreign key yang sesuai.

### 9.11 `timeline_items`

- `id`
- `event_id`
- `division_id`, nullable
- `title`
- `description`
- `category`
- `starts_at`
- `ends_at`, nullable
- `status`
- `owner_member_id`, nullable
- `created_by`
- `created_at`
- `updated_at`

### 9.12 `publications`

- `id`
- `event_id`
- `division_id`
- `title`
- `channel`
- `format`
- `caption`
- `scheduled_at`
- `status`
- `design_owner_id`, nullable
- `copy_owner_id`, nullable
- `asset_url`, nullable
- `published_url`, nullable
- `approved_by`, nullable
- `approved_at`, nullable
- `created_by`
- `created_at`
- `updated_at`

### 9.13 `budgets`

- `id`
- `event_id`
- `division_id`
- `category`
- `planned_amount`
- `notes`
- `created_by`
- `created_at`
- `updated_at`

Nominal menggunakan tipe PostgreSQL `numeric` dengan presisi yang ditentukan untuk kebutuhan Rupiah.

### 9.14 `transactions`

- `id`
- `event_id`
- `division_id`, nullable
- `budget_id`, nullable
- `type`
- `amount`
- `category`
- `description`
- `transaction_date`
- `evidence_url`, nullable
- `recorded_by`
- `status`
- `created_at`
- `updated_at`

`type`: `INCOME`, `EXPENSE`.

`status`: `ACTIVE`, `VOIDED`.

Koreksi dan pembatalan transaksi wajib menghasilkan audit record. Nominal transaksi yang telah dibatalkan tidak masuk perhitungan saldo.

### 9.15 `audit_logs`

- `id`
- `event_id`
- `actor_member_id`, nullable jika sesi tidak lagi terhubung dengan anggota aktif
- `action`
- `entity_type`
- `entity_id`
- `before_data`, nullable
- `after_data`, nullable
- `reason`, nullable
- `created_at`

Jangan menyimpan password, kode akses, token sesi, atau data rahasia lain di kolom audit.

Audit log harus diperlakukan sebagai append-only pada level aplikasi. Hak koreksi administratif tidak boleh berarti bebas menghapus riwayat.

### 9.16 Relasi dan constraint

- Semua entitas operasional terhubung dengan event.
- Foreign key digunakan untuk relasi anggota, divisi, musyawarah, keputusan, tugas, dan transaksi.
- Foreign key dan unique constraint ditegakkan di database.
- Nominal transaksi harus lebih besar dari nol.
- `starts_at` tidak boleh lebih besar daripada `ends_at` jika keduanya tersedia.
- Tugas yang berstatus siap eksekusi harus memiliki PIC dan deadline.
- Status dan tipe menggunakan enum atau constraint yang konsisten.
- Index dibuat untuk foreign key dan query filter yang benar-benar digunakan.
- Hindari cascade delete untuk keputusan final, transaksi, dan audit log.

---

## 10. Authorization design

Implementasikan permission sebagai service terpusat, bukan kondisi yang tersebar di setiap komponen.

Contoh fungsi konseptual:

```ts
requireSession(event);
requireRole(event, ['MOD']);
requireDivisionAccess(event, divisionId);
canEditTask(actor, task);
canFinalizeDecision(actor, decision);
canManageTransaction(actor);
```

Nama fungsi tersebut adalah rancangan; implementasi harus menyesuaikan API SvelteKit dan pola session yang dipilih.

### Authorization matrix

| Resource/action    | MOD             | Division admin                    | Committee                  |
| ------------------ | --------------- | --------------------------------- | -------------------------- |
| Event settings     | Full            | Read                              | Read                       |
| Member management  | Full            | Read limited                      | Self/read limited          |
| Division settings  | Full            | Own division                      | Read                       |
| Meeting management | Full            | Own division / assigned           | Read                       |
| Division minutes   | Full            | Own division                      | Read/comment where allowed |
| Final decisions    | Full with audit | Propose correction                | Read                       |
| Tasks              | All             | Own division                      | Assigned tasks             |
| Support requests   | All             | Manage receiving/requesting scope | Create/read own request    |
| Timeline           | All             | Own division                      | Read                       |
| Publications       | All             | PDD/assigned scope                | Assigned contribution      |
| Financial ledger   | Read/write      | Read                              | Read                       |
| Budgets            | Full            | Read                              | Read                       |
| Audit logs         | Read            | No direct access                  | No direct access           |
| Access codes       | Full            | No access                         | No access                  |

Implementasi final harus memisahkan hak membaca dan menulis, bukan hanya memeriksa role secara umum.

Untuk data lintas-divisi, tentukan cakupan per operasi. Admin divisi dapat membuat permintaan ke divisi lain, tetapi tidak dapat langsung mengubah tugas internal divisi tujuan.

---

## 11. Authentication & session security

### 11.1 Access flow

1. MOD membuat data anggota.
2. MOD mendistribusikan kode sesuai role dan prosedur yang disepakati.
3. Anggota memilih identitasnya dan memasukkan kode akses.
4. Server memvalidasi kode, role, status anggota, dan aturan akses.
5. Server membuat sesi dengan token acak berentropi tinggi.
6. Browser menerima cookie sesi dengan atribut keamanan yang sesuai.
7. Setiap request terlindungi memvalidasi sesi dan izin di server.

### 11.2 Session rules

- Gunakan token sesi yang tidak dapat ditebak.
- Simpan hash token di database.
- Tetapkan masa berlaku sesi.
- Sediakan logout dan pencabutan sesi.
- Jangan menyimpan token sesi di localStorage.
- Rotasi kode harus menolak penggunaan kode lama untuk sesi baru.
- Jika kebijakan rotasi mengharuskan semua sesi role dicabut, implementasikan invalidasi sesi tersebut secara eksplisit.
- Jangan mengandalkan validasi UI sebagai pengganti otorisasi server.

### 11.3 Rate limiting

Rate limit percobaan kode akses berdasarkan kombinasi yang layak, misalnya alamat IP, sesi percobaan, dan kode role yang dicoba, tanpa menyimpan rahasia dalam log.

Jangan mengunci seluruh tim secara permanen akibat satu pengguna salah memasukkan kode.

### 11.4 Batas keamanan

Kode bersama memiliki keterbatasan mendasar:

- Kode dapat dibagikan ke orang lain.
- Nama anggota yang dipilih dapat dipalsukan.
- Audit log tidak membuktikan identitas manusia.
- Kode role yang bocor dapat membuka akses role tersebut.

Untuk menurunkan risiko, gunakan kode yang kuat, distribusi terbatas, rotasi, masa berlaku sesi, pencabutan akses, dan audit log. Jika nanti dibutuhkan atribusi individual yang dapat dipercaya, migrasikan ke login individual.

---

## 12. Financial calculation rules

Semua perhitungan dilakukan di server atau query database dengan tipe numerik yang konsisten.

### Saldo event

`Saldo = Total pemasukan aktif − Total pengeluaran aktif`

### Realisasi per divisi

`Realisasi = Total pengeluaran aktif yang terkait dengan anggaran/divisi tersebut`

### Sisa anggaran

`Sisa = Anggaran − Realisasi`

### Persentase penggunaan

`Persentase = Realisasi / Anggaran × 100`

Jika anggaran nol, persentase ditampilkan sebagai tidak tersedia atau indikator khusus, bukan Infinity atau NaN.

### Konsistensi transaksi

- Transaksi dibuat dan audit record ditulis dalam satu transaksi database jika keduanya harus konsisten.
- Koreksi nominal harus mencatat nilai lama, nilai baru, dan alasan.
- Jangan menghapus transaksi yang telah digunakan dalam laporan.
- Transaksi yang belum memiliki divisi dapat masuk ke ringkasan event, tetapi tidak boleh diam-diam dibebankan ke anggaran divisi tertentu.
- Jika satu transaksi perlu dialokasikan ke beberapa divisi, desain alokasi eksplisit sebelum menambahkan fitur tersebut.

---

## 13. UI/UX design requirements

### 13.1 Design direction

- Mobile-first, responsif hingga desktop.
- Light mode sebagai default.
- Visual bersih, tenang, dan operasional.
- Hierarki tipografi jelas.
- Informasi penting didahulukan daripada dekorasi.
- Warna status konsisten dan selalu didukung label teks.
- Form pendek dengan validasi inline.
- Tidak ada horizontal scrolling pada halaman utama.

### 13.2 Navigation

Bottom navigation:

1. Beranda.
2. Musyawarah.
3. Tugas.
4. Timeline.
5. Lainnya.

Menu Lainnya berisi Divisi, Bantuan, Publikasi, Keuangan, Arsip, dan Pengaturan sesuai izin.

### 13.3 Responsive behavior

- Dashboard menggunakan kartu ringkas.
- Tabel transaksi desktop menjadi daftar transaksi pada HP.
- Filter panjang dibuka melalui panel atau drawer.
- Form pembuatan data menggunakan field yang relevan dengan konteks.
- Tombol aksi utama mudah dijangkau.
- Konfirmasi diwajibkan untuk pembatalan atau tindakan sensitif.
- Status loading, empty state, error state, dan success state harus tersedia.

### 13.4 Accessibility

- Semantic HTML.
- Label form eksplisit.
- Navigasi keyboard.
- Fokus yang terlihat.
- Kontras teks memadai.
- Error tidak hanya ditandai dengan warna.
- Tombol memiliki nama aksesibel.
- Hindari interaksi yang hanya bekerja melalui hover.

---

## 14. Error handling

Gunakan error yang terstruktur dan tidak membocorkan detail internal.

Kategori:

- `UNAUTHENTICATED`: sesi tidak valid.
- `FORBIDDEN`: tidak memiliki izin.
- `NOT_FOUND`: objek tidak ditemukan atau tidak boleh diungkapkan.
- `VALIDATION_ERROR`: input tidak valid.
- `CONFLICT`: perubahan bertentangan dengan status atau versi data.
- `RATE_LIMITED`: percobaan terlalu banyak.
- `INTERNAL_ERROR`: kesalahan yang tidak diharapkan.

UI menampilkan pesan yang bisa ditindaklanjuti. Stack trace, query database, dan rahasia hanya tersedia pada log server yang terkontrol.

---

## 15. Testing strategy

### Unit tests

- Permission helpers.
- Status transition.
- Perhitungan saldo.
- Perhitungan anggaran.
- Validasi deadline dan waktu.
- Validasi nominal.
- Logika keputusan final dan revisi.

### Integration tests

- Database CRUD.
- Foreign key dan constraint.
- Pembuatan serta pencabutan sesi.
- Penolakan akses lintas-divisi.
- Pencatatan transaksi dan audit log secara konsisten.
- Perubahan keputusan dan riwayatnya.

### End-to-end tests

1. MOD mendaftarkan anggota.
2. Anggota masuk dengan kode valid.
3. Admin divisi mencatat hasil musyawarah.
4. Sekretaris merangkum musyawarah besar.
5. Keputusan menghasilkan tugas.
6. Divisi membuat dan menerima permintaan bantuan.
7. PDD mengelola publikasi.
8. Bendahara membuat transaksi.
9. Panitia melihat transaksi dan ringkasan anggaran.
10. Role tidak berwenang gagal mengakses operasi terlindungi.

### Negative security tests

- Request tanpa sesi.
- Sesi dicabut.
- Kode salah.
- Role tidak sesuai.
- Akses ID objek milik divisi lain.
- Manipulasi `member_id` atau `division_id` pada request.
- Percobaan mengubah keputusan final tanpa izin.
- Percobaan mengubah atau menghapus transaksi tanpa izin.
- Akses langsung ke route administratif.

---

## 16. Deployment & operations

### Environment

Pisahkan minimal:

- Local development.
- Preview/staging.
- Production.

Gunakan database terpisah untuk staging dan production bila memungkinkan.

### Secrets

- Neon connection string.
- Session secret atau konfigurasi kriptografi yang diperlukan.
- Kunci atau secret terkait mekanisme kode akses jika dibutuhkan.

Simpan melalui environment variables dan secret management yang tersedia pada runtime target. Jangan commit file rahasia ke Git.

### Migration workflow

1. Ubah schema Drizzle.
2. Generate migration.
3. Review SQL migration.
4. Jalankan di database development.
5. Jalankan test.
6. Terapkan pada staging.
7. Verifikasi smoke test.
8. Terapkan pada production melalui prosedur deployment yang disetujui.

Hindari perubahan schema produksi secara manual tanpa migration yang tercatat.

### Backup & recovery

- Tentukan kebijakan backup sesuai kemampuan dan retensi paket Neon yang digunakan.
- Dokumentasikan prosedur pemulihan.
- Lakukan uji restore sebelum event.
- Tetapkan penanggung jawab pemulihan.
- Jangan menganggap keberadaan database hosted otomatis berarti backup sudah memadai.

### Monitoring

Minimal pantau:

- Error server.
- Error koneksi database.
- Kegagalan autentikasi berulang.
- Kegagalan deployment.
- Kegagalan migration.
- Performa endpoint penting.

---

# PART III — IMPLEMENTATION PLAN FOR OPENCODE

## 17. Engineering workflow

Gunakan alur berikut untuk setiap task:

`Understand → Plan → Reuse → Implement → Verify → Review → Report`

OpenCode tidak boleh mengimplementasikan seluruh aplikasi dari satu prompt besar. Setiap task harus memiliki scope, file yang relevan, kriteria penerimaan, dan cara verifikasi.

### Aturan implementasi

- Baca `AGENTS.md` dan dokumentasi terkait sebelum mengubah kode.
- Gunakan komponen, schema, helper, dan pola yang sudah ada jika sesuai.
- Jangan membuat abstraksi generik tanpa kebutuhan konkret.
- Jangan menambahkan dependency tanpa alasan.
- Jangan mengubah scope task tanpa persetujuan.
- Jalankan lint, type check, test, dan build yang relevan.
- Perbaiki error yang disebabkan oleh perubahan sebelum menyelesaikan task.
- Jangan mengklaim test berhasil jika belum dijalankan.
- Laporkan file yang berubah, hasil verifikasi, risiko, dan pekerjaan tersisa.

## 18. Sprint plan

### Sprint 0 — Repository & deployment foundation

**Tujuan:** memastikan aplikasi dapat dibangun dan di-deploy.

Task:

- Inisialisasi SvelteKit + TypeScript.
- Konfigurasi Tailwind.
- Konfigurasi adapter Cloudflare yang kompatibel.
- Konfigurasi Drizzle dan koneksi Neon.
- Siapkan environment variables.
- Siapkan lint, type checking, test runner, dan build.
- Buat halaman health atau smoke test minimal.

Definition of done:

- Build berhasil.
- Aplikasi berjalan lokal.
- Preview deployment berhasil.
- Koneksi database teruji.
- Tidak ada secret dalam repository.

### Sprint 1 — Data model & access control

**Tujuan:** fondasi data dan izin dapat dipercaya.

Task:

- Schema event, divisi, anggota, kode akses, dan sesi.
- Seed tujuh divisi.
- Implementasi session lifecycle.
- Implementasi role dan permission helpers.
- Implementasi route access.
- Implementasi manajemen anggota MOD.
- Test akses valid, invalid, dan lintas-role.

Definition of done:

- Anggota dapat didaftarkan.
- Kode akses diverifikasi di server.
- Sesi dapat dicabut.
- Akses administratif tidak dapat dilewati melalui request langsung.
- Migration dapat dijalankan ulang pada database kosong sesuai prosedur.

### Sprint 2 — Dashboard, musyawarah & keputusan

**Tujuan:** hasil musyawarah dapat dicatat dan ditindaklanjuti.

Task:

- Dashboard berbasis data nyata.
- CRUD musyawarah.
- Agenda.
- Notulen terstruktur.
- Pengiriman ringkasan divisi.
- Ringkasan sekretaris.
- Keputusan dan status final.
- Riwayat revisi.
- Pembuatan tugas dari keputusan.

Definition of done:

- Seluruh alur musyawarah dapat diuji dari UI.
- Hak edit sesuai role.
- Keputusan dan tugas saling terhubung.
- Revisi keputusan tidak menghilangkan riwayat.

### Sprint 3 — Tasks & division coordination

**Tujuan:** pekerjaan dan permintaan bantuan bisa dikelola.

Task:

- Daftar tugas.
- Detail tugas.
- PIC dan deadline.
- Status serta prioritas.
- Filter berdasarkan divisi.
- Permintaan bantuan.
- Workflow penerimaan dan penyelesaian.
- Riwayat aktivitas.

Definition of done:

- Tugas dapat dilacak sampai selesai.
- Divisi tujuan dapat menerima atau menolak permintaan.
- Admin divisi tidak dapat mengedit data di luar cakupannya.
- Status dan relasi data konsisten.

### Sprint 4 — Timeline & PDD publications

**Tujuan:** persiapan dan publikasi dapat dipantau.

Task:

- Timeline kronologis.
- Kalender sederhana.
- Kategori dan filter.
- CRUD publikasi.
- Workflow review dan approval.
- Penjadwalan target publikasi.
- Tautan hasil publikasi.

Definition of done:

- Timeline menampilkan data tersimpan.
- Perubahan jadwal tercermin secara konsisten.
- Konten belum approved tidak dapat ditandai published melalui jalur normal tanpa otorisasi yang sesuai.
- Alur PDD dapat digunakan tanpa integrasi media sosial eksternal.

### Sprint 5 — Finance & budget

**Tujuan:** keuangan transparan dan dapat diaudit.

Task:

- Ledger pemasukan/pengeluaran.
- Kategori transaksi.
- Anggaran per divisi.
- Relasi transaksi dan anggaran.
- Perhitungan realisasi.
- Ringkasan sisa anggaran.
- Koreksi dan pembatalan dengan audit log.
- Test konsistensi saldo.

Definition of done:

- Panitia dapat membaca ledger.
- Hanya role yang diizinkan dapat mencatat transaksi.
- Perhitungan saldo dan anggaran lolos test.
- Koreksi tidak menghilangkan jejak transaksi.

### Sprint 6 — Hardening & release

**Tujuan:** memastikan sistem siap digunakan saat persiapan event.

Task:

- Negative security tests.
- E2E critical flows.
- Uji responsif HP.
- Aksesibilitas dasar.
- Penanganan error.
- Verifikasi environment produksi.
- Uji backup dan restore.
- Smoke test pascadeployment.
- Dokumentasi penggunaan panitia dan MOD.

Definition of done:

- Semua acceptance criteria P0 dan P1 lulus.
- Tidak ada blocker security yang diketahui.
- Backup dan prosedur pemulihan telah diuji.
- MOD dapat mengelola anggota, kode, dan data operasional.
- Panitia dapat menggunakan aplikasi di HP.

Sprint dapat disesuaikan dengan kecepatan tim. Urutan dependensi lebih penting daripada durasi kalender.

---

## 19. Suggested GitHub milestones

1. `M0 — Foundation`
2. `M1 — Access & Organization`
3. `M2 — Meetings & Decisions`
4. `M3 — Tasks & Support`
5. `M4 — Timeline & Publications`
6. `M5 — Finance & Budgets`
7. `M6 — Production Readiness`

Setiap issue harus mencakup:

- Context.
- Scope.
- Acceptance criteria.
- Files atau domain terkait.
- Test requirements.
- Out of scope.

Selesaikan issue secara vertikal: schema → server logic → permission → UI → test. Jangan membuat semua schema terlebih dahulu lalu membangun seluruh UI tanpa verifikasi alur.

---

## 20. Suggested `AGENTS.md`

```md
# GenAwards: Cook Edition — Engineering Rules

## Product Context

Internal event coordination webapp for PAT GenAwards: Cook Edition.
Prioritize meeting outcomes, decisions, tasks, cross-division requests,
event timeline, publications, and transparent finance.

## Stack

- SvelteKit
- TypeScript
- Tailwind CSS
- Neon PostgreSQL
- Drizzle ORM
- Cloudflare Workers
- GitHub

Verify compatibility against the repository's installed versions.

## Workflow

Understand -> Plan -> Reuse -> Implement -> Verify -> Review -> Report.

## Architecture

- Server-first.
- Validate all untrusted input on the server.
- Enforce authorization on every protected operation.
- Keep permission logic centralized.
- Never access Neon directly from browser code.
- Keep migrations in version control.
- Use database constraints for important invariants.
- Avoid unnecessary dependencies and abstractions.

## Security

- Never commit secrets.
- Never log access codes or session tokens.
- Shared role codes do not prove individual identity.
- Enforce session validity and role/division scope server-side.
- Preserve audit history for financial corrections and final decisions.
- Treat all client-provided IDs and role claims as untrusted.

## UX

- Mobile-first.
- No horizontal overflow at 320px.
- Use semantic HTML and accessible controls.
- Include loading, empty, error, and success states.
- Prefer concise forms and contextual actions.

## Testing

- Test permission boundaries.
- Test business rules and database constraints.
- Run lint, type checking, relevant tests, and production build.
- Never claim a check passed unless it was executed.

## Scope Discipline

- Implement one bounded task at a time.
- Reuse existing patterns.
- Do not add unrequested features.
- Do not silently change business rules.
- Report files changed, checks run, results, risks, and next steps.
```

---

## 21. Release checklist

### Product

- [ ] Semua role dan divisi terkonfigurasi.
- [ ] Alur musyawarah sampai tugas berfungsi.
- [ ] Permintaan bantuan dapat ditindaklanjuti.
- [ ] Timeline dan publikasi tersedia.
- [ ] Ledger dan anggaran terhitung benar.

### Security

- [ ] Kode akses tidak disimpan plaintext.
- [ ] Session lifecycle diuji.
- [ ] Otorisasi server diuji untuk setiap domain.
- [ ] Rotasi kode dan pencabutan sesi diuji.
- [ ] Tidak ada secret pada GitHub atau client bundle.
- [ ] Audit log tidak berisi kredensial.

### Data

- [ ] Migration teruji.
- [ ] Constraint penting aktif.
- [ ] Backup tersedia sesuai kebijakan.
- [ ] Restore telah diuji.
- [ ] Tidak ada penghapusan permanen yang tidak disengaja.

### UX & operations

- [ ] HP 320 px dan perangkat umum telah diuji.
- [ ] Empty/error/loading states tersedia.
- [ ] Build dan deployment berhasil.
- [ ] Smoke test produksi berhasil.
- [ ] MOD dan panitia menerima panduan penggunaan.

---

# FINAL PRODUCT DECISION

GenAwards: Cook Edition akan dibangun sebagai **single-event operations webapp dengan tujuh divisi, tiga role akses, notulen terstruktur, workflow keputusan-ke-tugas, permintaan bantuan lintas-divisi, timeline publikasi, dan keuangan transparan berbasis anggaran**.

Prioritas implementasi bukan banyaknya fitur, melainkan keutuhan alur kerja dan ketepatan batas akses.

Urutan pengerjaan yang disetujui:

`Foundation → Access → Meetings → Tasks → Coordination → Timeline → Finance → Hardening`

Dokumen ini menjadi acuan implementasi. Perubahan kebutuhan bisnis harus diperbarui terlebih dahulu pada PRD, lalu diterjemahkan ke SDD, migration, test, dan task implementasi terkait.
