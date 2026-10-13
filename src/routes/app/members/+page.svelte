<script lang="ts">
	import StatusBadge from '../../../lib/components/StatusBadge.svelte';
	import { MEMBER_ROLE, MEMBER_STATUS } from '../../../lib/status-labels';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Anggota dan kode</h1>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="meta mt-4">{form.success}</p>
	{/if}
	{#if form?.newCode}
		<p role="status" class="form-error mt-4">
			Kode baru {form.newCodeRole}: <code class="numeral">{form.newCode}</code>. Simpan sekarang,
			tidak tampil lagi.
		</p>
	{/if}

	<section aria-labelledby="daftar">
		<h2 id="daftar" class="section-title">Daftar anggota</h2>
		<ul class="list-plain">
			{#each data.members as m (m.id)}
				<li class="card">
					<p class="font-semibold">{m.name}</p>
					<p class="meta mt-1">
						{MEMBER_ROLE[m.systemRole] ?? m.systemRole}{m.division ? `, ${m.division}` : ''}
					</p>
					<p class="mt-1 flex flex-wrap items-center gap-2">
						<StatusBadge map={MEMBER_STATUS} code={m.status} />
					</p>
					<form method="post" action="?/setStatus" class="btn-row mt-2">
						<input type="hidden" name="memberId" value={m.id} />
						<input
							type="hidden"
							name="status"
							value={m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
						/>
						<button
							type="submit"
							class={m.status === 'ACTIVE' ? 'btn btn-tertiary' : 'btn btn-secondary'}
						>
							{m.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
						</button>
					</form>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="daftar-baru">
		<h2 id="daftar-baru" class="section-title">Daftarkan anggota</h2>
		<form method="post" action="?/register" class="flex flex-col gap-3">
			<p class="hint">Tanda * berarti wajib diisi.</p>
			<label class="field">
				Nama <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
				<input name="name" required minlength="2" maxlength="80" class="input" />
			</label>
			<label class="field">
				Role sistem <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
				<select name="systemRole" required class="input">
					{#each data.roles as r (r)}
						<option value={r}>{MEMBER_ROLE[r] ?? r}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				Divisi (wajib untuk admin divisi, opsional untuk lainnya)
				<select name="divisionId" class="input">
					<option value="">Tanpa divisi</option>
					{#each data.divisions as d (d.id)}
						<option value={d.id}>{d.name}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				Jabatan organisasi (opsional)
				<input name="position" maxlength="80" class="input" />
			</label>
			<div class="btn-row">
				<button type="submit" class="btn btn-primary">Daftarkan anggota</button>
			</div>
		</form>
	</section>

	<section aria-labelledby="rotasi">
		<h2 id="rotasi" class="section-title">Rotasi kode akses</h2>
		<p class="meta">Kode lama langsung mati untuk sesi baru.</p>
		<div class="list-plain mt-2">
			{#each data.roles as r (r)}
				<form method="post" action="?/rotateCode" class="card">
					<p class="font-semibold">{MEMBER_ROLE[r] ?? r}</p>
					<input type="hidden" name="role" value={r} />
					<div class="btn-row mt-2">
						<button type="submit" class="btn btn-secondary">Buat kode baru</button>
					</div>
				</form>
			{/each}
		</div>
	</section>
</main>
