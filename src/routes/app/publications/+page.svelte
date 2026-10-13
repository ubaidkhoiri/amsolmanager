<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Publikasi</h1>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">{form.success}</p>
	{/if}

	<form method="get" class="mt-4 flex items-center gap-2 text-sm">
		<label>
			Status
			<select name="status" class="min-h-11 border px-3 py-2">
				<option value="">Semua</option>
				{#each data.statuses as s (s)}
					<option value={s} selected={s === data.selectedStatus}>{s}</option>
				{/each}
			</select>
		</label>
		<button type="submit" class="min-h-11 border px-3 py-2">Filter</button>
	</form>

	<section class="mt-6">
		{#if data.items.length === 0}
			<p class="text-sm">Belum ada konten.</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-2">
				{#each data.items as p (p.id)}
					<li class="border px-3 py-2 text-sm">
						<p class="font-semibold">{p.title} [{p.status}]</p>
						<p class="mt-1 text-xs">
							{p.channel}{p.format ? ` (${p.format})` : ''} ({p.division}){p.scheduled
								? `, target ${p.scheduled}`
								: ''}
						</p>
						<p class="mt-1 text-xs">Desain {p.design}, copy {p.copy}</p>
						{#if p.publishedUrl}
							<p class="mt-1 text-xs">
								<a class="underline" href={p.publishedUrl} target="_blank" rel="noreferrer"
									>Lihat posting</a
								>
							</p>
						{/if}
						{#if p.nextStatuses.length > 0}
							<form method="post" action="?/advance" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="pubId" value={p.id} />
								<label class="flex items-center gap-2 text-xs">
									Status
									<select name="status" class="min-h-11 border px-2 py-2">
										{#each p.nextStatuses as s (s)}
											<option value={s}>{s}</option>
										{/each}
									</select>
								</label>
								<label class="flex flex-col gap-1 text-xs">
									Tautan posting (wajib saat published)
									<input
										name="publishedUrl"
										type="url"
										maxlength="500"
										class="min-h-11 border px-2 py-2"
									/>
								</label>
								<label class="flex flex-col gap-1 text-xs">
									Alasan (wajib saat batal)
									<input name="reason" maxlength="1000" class="min-h-11 border px-2 py-2" />
								</label>
								<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Ubah</button>
							</form>
						{/if}
						{#if p.status !== 'PUBLISHED' && p.status !== 'CANCELLED'}
							<form method="post" action="?/reschedule" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="pubId" value={p.id} />
								<label class="flex flex-col gap-1 text-xs">
									Jadwal baru
									<input
										name="scheduledAt"
										type="datetime-local"
										required
										class="min-h-11 border px-2 py-2"
									/>
								</label>
								<label class="flex flex-col gap-1 text-xs">
									Alasan penjadwalan ulang
									<input
										name="reason"
										required
										maxlength="1000"
										class="min-h-11 border px-2 py-2"
									/>
								</label>
								<button type="submit" class="min-h-11 border px-3 py-2 text-xs"
									>Jadwalkan ulang</button
								>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if data.canCreate}
		<section class="mt-8">
			<h2 class="font-semibold">Ide konten baru</h2>
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
					Divisi
					<select name="divisionId" required class="min-h-11 border px-3 py-2">
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Kanal
					<input
						name="channel"
						maxlength="80"
						placeholder="Instagram, TikTok"
						class="min-h-11 border px-3 py-2"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Format
					<input
						name="format"
						maxlength="80"
						placeholder="Poster, reels"
						class="min-h-11 border px-3 py-2"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Caption
					<textarea name="caption" rows="2" maxlength="2000" class="border px-3 py-2"></textarea>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Target publikasi
					<input name="scheduledAt" type="datetime-local" class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					PIC desain
					<select name="designOwnerId" class="min-h-11 border px-3 py-2">
						<option value="">Belum ada</option>
						{#each data.members as m (m.id)}
							<option value={m.id}>{m.name}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					PIC copy
					<select name="copyOwnerId" class="min-h-11 border px-3 py-2">
						<option value="">Belum ada</option>
						{#each data.members as m (m.id)}
							<option value={m.id}>{m.name}</option>
						{/each}
					</select>
				</label>
				<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Simpan</button>
			</form>
		</section>
	{/if}

	<p class="mt-6 text-sm">
		<a class="underline" href={resolve('/app/timeline')}>Lihat timeline</a>
	</p>
</main>
