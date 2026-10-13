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
