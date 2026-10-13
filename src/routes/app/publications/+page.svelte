<script lang="ts">
	import { resolve } from '$app/paths';
	import StatusBadge from '../../../lib/components/StatusBadge.svelte';
	import { lookup, PUBLICATION_STATUS } from '../../../lib/status-labels';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Publikasi</h1>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="meta mt-4">{form.success}</p>
	{/if}

	<form method="get" class="mt-4 flex flex-col gap-3">
		<label class="field">
			Status
			<select name="status" class="input">
				<option value="">Semua</option>
				{#each data.statuses as s (s)}
					<option value={s} selected={s === data.selectedStatus}>
						{lookup(PUBLICATION_STATUS, s).label}
					</option>
				{/each}
			</select>
		</label>
		<div class="btn-row">
			<button type="submit" class="btn btn-secondary">Filter</button>
		</div>
	</form>

	<section aria-labelledby="konten">
		<h2 id="konten" class="section-title">Konten</h2>
		{#if data.items.length === 0}
			<div class="empty">
				<p>Belum ada konten.</p>
				<p class="meta">Ide konten baru muncul di sini setelah dibuat.</p>
			</div>
		{:else}
			<ul class="list-plain">
				{#each data.items as p (p.id)}
					<li class="card">
						<p class="font-semibold">{p.title}</p>
						<p class="meta mt-1">
							{p.channel}{p.format ? ` (${p.format})` : ''} ({p.division}){p.scheduled
								? `, target ${p.scheduled}`
								: ''}
						</p>
						<p class="meta mt-1">Desain {p.design}, copy {p.copy}</p>
						<p class="mt-1"><StatusBadge map={PUBLICATION_STATUS} code={p.status} /></p>
						{#if p.publishedUrl}
							<p class="mt-1">
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external post URL -->
								<a class="underline" href={p.publishedUrl} target="_blank" rel="noreferrer"
									>Lihat posting</a
								>
							</p>
						{/if}
						{#if p.nextStatuses.length > 0}
							<form method="post" action="?/advance" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="pubId" value={p.id} />
								<label class="field">
									Status
									<select name="status" class="input">
										{#each p.nextStatuses as s (s)}
											<option value={s}>{lookup(PUBLICATION_STATUS, s).label}</option>
										{/each}
									</select>
								</label>
								<label class="field">
									Tautan posting (wajib saat published)
									<input name="publishedUrl" type="url" maxlength="500" class="input" />
								</label>
								<label class="field">
									Alasan (wajib saat batal)
									<input name="reason" maxlength="1000" class="input" />
								</label>
								<div class="btn-row">
									<button type="submit" class="btn btn-secondary">Ubah status</button>
								</div>
							</form>
						{/if}
						{#if p.status !== 'PUBLISHED' && p.status !== 'CANCELLED'}
							<form method="post" action="?/reschedule" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="pubId" value={p.id} />
								<label class="field">
									Jadwal baru <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
									<input name="scheduledAt" type="datetime-local" required class="input" />
								</label>
								<label class="field">
									Alasan penjadwalan ulang
									<span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
									<input name="reason" required maxlength="1000" class="input" />
								</label>
								<div class="btn-row">
									<button type="submit" class="btn btn-secondary">Jadwalkan ulang</button>
								</div>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if data.canCreate}
		<section aria-labelledby="ide">
			<h2 id="ide" class="section-title">Ide konten baru</h2>
			<form method="post" action="?/create" class="flex flex-col gap-3">
				<p class="hint">Tanda * berarti wajib diisi.</p>
				<label class="field">
					Judul <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<input name="title" required minlength="3" maxlength="120" class="input" />
				</label>
				<label class="field">
					Divisi <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<select name="divisionId" required class="input">
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Kanal (opsional)
					<span class="hint">Contoh: Instagram, TikTok</span>
					<input name="channel" maxlength="80" class="input" />
				</label>
				<label class="field">
					Format (opsional)
					<span class="hint">Contoh: poster, reels</span>
					<input name="format" maxlength="80" class="input" />
				</label>
				<label class="field">
					Caption (opsional)
					<textarea name="caption" rows="2" maxlength="2000" class="input"></textarea>
				</label>
				<label class="field">
					Target publikasi (opsional)
					<input name="scheduledAt" type="datetime-local" class="input" />
				</label>
				<label class="field">
					PIC desain (opsional)
					<select name="designOwnerId" class="input">
						<option value="">Belum ada</option>
						{#each data.members as m (m.id)}
							<option value={m.id}>{m.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					PIC copy (opsional)
					<select name="copyOwnerId" class="input">
						<option value="">Belum ada</option>
						{#each data.members as m (m.id)}
							<option value={m.id}>{m.name}</option>
						{/each}
					</select>
				</label>
				<div class="btn-row">
					<button type="submit" class="btn btn-primary">Simpan ide</button>
				</div>
			</form>
		</section>
	{/if}

	<p class="mt-6">
		<a class="underline" href={resolve('/app/timeline')}>Lihat timeline</a>
	</p>
</main>
