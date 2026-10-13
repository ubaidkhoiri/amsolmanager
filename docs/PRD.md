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
