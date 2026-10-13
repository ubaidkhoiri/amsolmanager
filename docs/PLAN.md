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
