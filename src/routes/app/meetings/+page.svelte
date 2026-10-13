<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Musyawarah</h1>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">
			{form.success}
			{#if form?.meetingId}
				<a class="underline" href={resolve('/app/meetings/[id]', { id: form.meetingId })}>Buka</a>
			{/if}
		</p>
	{/if}

	<section class="mt-6">
		<h2 class="font-semibold">Daftar</h2>
		{#if data.meetings.length === 0}
			<p class="mt-2 text-sm">Belum ada musyawarah.</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-2">
				{#each data.meetings as m (m.id)}
					<li class="border px-3 py-2 text-sm">
						<a class="font-semibold underline" href={resolve('/app/meetings/[id]', { id: m.id })}>
							{m.title}
						</a>
						<p class="mt-1 text-xs">
							{m.type}{m.division ? `, ${m.division}` : ''} [{m.status}]{m.startsAt
								? `, ${m.startsAt.slice(0, 16).replace('T', ' ')}`
								: ''}
						</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if data.canCreate}
		<section class="mt-8">
			<h2 class="font-semibold">Musyawarah baru</h2>
			<form method="post" action="?/create" class="mt-2 flex flex-col gap-3">
				<label class="flex flex-col gap-1 text-sm">
					Judul
					<input
						name="title"
						required
						minlength="3"
						maxlength="120"
						class="min-h-11 border px-3 py-2"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Jenis
					<select name="meetingType" required class="min-h-11 border px-3 py-2">
						<option value="PLENARY">Besar</option>
						<option value="DIVISION">Divisi</option>
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Divisi (wajib untuk musyawarah divisi)
					<select name="divisionId" class="min-h-11 border px-3 py-2">
						<option value="">Tanpa divisi</option>
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Waktu (opsional)
					<input name="startsAt" type="datetime-local" class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Lokasi (opsional)
					<input name="location" maxlength="120" class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Agenda
					<textarea name="agenda" rows="3" maxlength="2000" class="border px-3 py-2"></textarea>
				</label>
				<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Buat</button>
			</form>
		</section>
	{/if}
</main>
