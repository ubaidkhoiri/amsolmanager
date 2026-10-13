## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, tailwindcss, sveltekit-adapter

---

# GenAwards Cook Edition: engineering rules

Sumber kebenaran: `amsolmanager.md`, `docs/PRD.md`, `docs/SDD.md`, `docs/PLAN.md`. Ubah kebutuhan di PRD dulu, lalu SDD, migrasi, tes, task.

## Product context

Webapp koordinasi internal PAT GenAwards Cook Edition. Prioritas: hasil musyawarah, keputusan, tugas, permintaan lintas divisi, timeline, publikasi, keuangan transparan.

Urutan kerja: Foundation, Access, Meetings, Tasks, Coordination, Timeline, Finance, Hardening.

## Stack

SvelteKit, TypeScript strict, Tailwind CSS, Neon PostgreSQL, Drizzle ORM, Cloudflare Workers, GitHub. Cek kompatibilitas versi di repo sebelum tambah dependency.

## Workflow

Understand, Plan, Reuse, Implement, Verify, Review, Report. Satu task bounded per langkah. Baca AGENTS.md dan docs terkait sebelum ubah kode.

## Architecture

Server first. Validasi input di server. Otorisasi tiap operasi proteksi. Permission terpusat di `src/lib/server/auth/permissions.ts`. Jangan akses Neon dari browser. Migrasi di Git. Constraint penting di database. Tanpa abstraksi dan dependency baru tanpa alasan konkret.

## Security

Jangan commit secret. Jangan log access code atau session token. Kode role bersama tidak buktikan identitas individu. Validasi sesi dan scope role per divisi di server. Koreksi finansial dan keputusan final wajib audit log. Anggap semua ID dan klaim role dari client tidak tepercaya.

## UX

Mobile first. Tanpa horizontal overflow di 320px. HTML semantik dan kontrol aksesibel. Tiap halaman: loading, empty, error, success state. Form ringkas dan aksi kontekstual.

## Testing

Uji batas permission. Uji business rule dan constraint DB. Jalankan lint, typecheck, tes relevan, build produksi. Jangan klaim lolos tanpa eksekusi.

## Scope discipline

Reuse pola ada. Tanpa fitur luar task. Tanpa ubah business rule diam diam. Lapor file ubah, check jalan, hasil, risiko, next step.
