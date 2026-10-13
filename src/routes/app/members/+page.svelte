<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Anggota dan kode</h1>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">{form.success}</p>
	{/if}
	{#if form?.newCode}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">
			Kode baru {form.newCodeRole}: <code>{form.newCode}</code>. Simpan sekarang, tidak tampil lagi.
		</p>
	{/if}

	<section class="mt-6">
		<h2 class="font-semibold">Daftar anggota</h2>
		<ul class="mt-2 flex flex-col gap-2">
			{#each data.members as m (m.id)}
				<li class="flex items-center justify-between gap-2 border px-3 py-2 text-sm">
					<span>{m.name} ({m.systemRole}{m.division ? `, ${m.division}` : ''}) [{m.status}]</span>
					<form method="post" action="?/setStatus">
						<input type="hidden" name="memberId" value={m.id} />
						<input
							type="hidden"
							name="status"
							value={m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
						/>
						<button type="submit" class="min-h-11 border px-3 py-2 text-xs">
							{m.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
						</button>
					</form>
				</li>
			{/each}
		</ul>
	</section>

	<section class="mt-8">
		<h2 class="font-semibold">Daftarkan anggota</h2>
		<form method="post" action="?/register" class="mt-2 flex flex-col gap-3">
			<label class="flex flex-col gap-1 text-sm">
				Nama
				<input
					name="name"
					required
					minlength="2"
					maxlength="80"
					class="min-h-11 border px-3 py-2"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Role sistem
				<select name="systemRole" required class="min-h-11 border px-3 py-2">
					{#each data.roles as r (r)}
						<option value={r}>{r}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Divisi (wajib untuk admin divisi)
				<select name="divisionId" class="min-h-11 border px-3 py-2">
					<option value="">Tanpa divisi</option>
					{#each data.divisions as d (d.id)}
						<option value={d.id}>{d.name}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Jabatan organisasi (opsional)
				<input name="position" maxlength="80" class="min-h-11 border px-3 py-2" />
			</label>
			<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Daftarkan</button>
		</form>
	</section>

	<section class="mt-8">
		<h2 class="font-semibold">Rotasi kode akses</h2>
		<p class="mt-1 text-sm">Kode lama langsung mati untuk sesi baru.</p>
		<div class="mt-2 flex flex-col gap-2">
			{#each data.roles as r (r)}
				<form
					method="post"
					action="?/rotateCode"
					class="flex items-center justify-between gap-2 border px-3 py-2 text-sm"
				>
					<span>{r}</span>
					<input type="hidden" name="role" value={r} />
					<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Buat kode baru</button>
				</form>
			{/each}
		</div>
	</section>
</main>
