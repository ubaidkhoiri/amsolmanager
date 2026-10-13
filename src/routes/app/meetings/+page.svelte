<script lang="ts">
	import { resolve } from '$app/paths';
	import StatusBadge from '../../../lib/components/StatusBadge.svelte';
	import { MEETING_STATUS, MEETING_TYPE } from '../../../lib/status-labels';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Musyawarah</h1>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="meta mt-4">
			{form.success}
			{#if form?.meetingId}
				<a class="underline" href={resolve('/app/meetings/[id]', { id: form.meetingId })}>Buka</a>
			{/if}
		</p>
	{/if}

	<section aria-labelledby="daftar">
		<h2 id="daftar" class="section-title">Daftar</h2>
		{#if data.meetings.length === 0}
			<div class="empty">
				<p>Belum ada musyawarah.</p>
				<p class="meta">Musyawarah baru muncul di sini setelah dibuat.</p>
			</div>
		{:else}
			<ul class="list-plain">
				{#each data.meetings as m (m.id)}
					<li class="card">
						<a class="font-semibold underline" href={resolve('/app/meetings/[id]', { id: m.id })}>
							{m.title}
						</a>
						<p class="meta mt-1">
							{MEETING_TYPE[m.type] ?? m.type}{m.division ? `, ${m.division}` : ''}{m.startsAt
								? `, ${m.startsAt.slice(0, 16).replace('T', ' ')}`
								: ''}
						</p>
						<p class="mt-1"><StatusBadge map={MEETING_STATUS} code={m.status} /></p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if data.canCreate}
		<section aria-labelledby="baru">
			<h2 id="baru" class="section-title">Musyawarah baru</h2>
			<form method="post" action="?/create" class="flex flex-col gap-3">
				<p class="hint">Tanda * berarti wajib diisi.</p>
				<label class="field">
					Judul <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<input name="title" required minlength="3" maxlength="120" class="input" />
				</label>
				<label class="field">
					Jenis <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<select name="meetingType" required class="input">
						<option value="PLENARY">Besar</option>
						<option value="DIVISION">Divisi</option>
					</select>
				</label>
				<label class="field">
					Divisi (wajib untuk musyawarah divisi, opsional untuk besar)
					<select name="divisionId" class="input">
						<option value="">Tanpa divisi</option>
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Waktu (opsional)
					<input name="startsAt" type="datetime-local" class="input" />
				</label>
				<label class="field">
					Lokasi (opsional)
					<input name="location" maxlength="120" class="input" />
				</label>
				<label class="field">
					Agenda (opsional)
					<textarea name="agenda" rows="3" maxlength="2000" class="input"></textarea>
				</label>
				<div class="btn-row">
					<button type="submit" class="btn btn-primary">Buat musyawarah</button>
				</div>
			</form>
		</section>
	{/if}
</main>
