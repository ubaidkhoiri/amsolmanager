<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<p class="text-sm"><a class="underline" href={resolve('/app/meetings')}>Kembali</a></p>
	<h1 class="mt-2 text-2xl font-bold">{data.meeting.title}</h1>
	<p class="mt-1 text-xs">
		{data.meeting.type} [{data.meeting.status}]{data.meeting.startsAt
			? `, ${data.meeting.startsAt.slice(0, 16).replace('T', ' ')}`
			: ''}{data.meeting.location ? `, ${data.meeting.location}` : ''}
	</p>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">
			{form.success}
			{#if form?.taskId}
				<a class="underline" href={resolve('/app/tasks')}>Lihat tugas</a>
			{/if}
		</p>
	{/if}

	{#if data.canManage && data.nextStatuses.length > 0}
		<form method="post" action="?/setStatus" class="mt-4 flex items-center gap-2 text-sm">
			<label>
				Status
				<select name="status" class="min-h-11 border px-3 py-2">
					{#each data.nextStatuses as s (s)}
						<option value={s}>{s}</option>
					{/each}
				</select>
			</label>
			<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Ubah</button>
		</form>
	{/if}

	<section class="mt-6">
		<h2 class="font-semibold">Agenda</h2>
		<p class="mt-1 text-sm whitespace-pre-wrap">{data.meeting.agenda || 'Belum ada agenda.'}</p>
	</section>

	<section class="mt-8">
		<h2 class="font-semibold">Notulen</h2>
		{#if data.minutes.length === 0}
			<p class="mt-2 text-sm">Belum ada notulen.</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-2">
				{#each data.minutes as m (m.id)}
					<li class="border px-3 py-2 text-sm">
						<p class="font-semibold">{m.topic} [{m.status}]</p>
						{#if m.summary}<p class="mt-1">Bahasan: {m.summary}</p>{/if}
						{#if m.proposal}<p class="mt-1">Usulan: {m.proposal}</p>{/if}
						{#if m.outcome}<p class="mt-1">Hasil: {m.outcome}</p>{/if}
						<p class="mt-1 text-xs">oleh {m.author}</p>
						{#if data.canManage}
							<form method="post" action="?/setMinuteStatus" class="mt-2">
								<input type="hidden" name="minuteId" value={m.id} />
								<input type="hidden" name="status" value={m.status === 'OPEN' ? 'DONE' : 'OPEN'} />
								<button type="submit" class="min-h-11 border px-3 py-2 text-xs">
									{m.status === 'OPEN' ? 'Tandai selesai' : 'Buka lagi'}
								</button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if data.canManage}
			<form method="post" action="?/addMinute" class="mt-4 flex flex-col gap-3">
				<h3 class="text-sm font-semibold">Tambah notulen</h3>
				<label class="flex flex-col gap-1 text-sm">
					Topik
					<input
						name="topic"
						required
						minlength="3"
						maxlength="120"
						class="min-h-11 border px-3 py-2"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Ringkasan bahasan
					<textarea name="summary" rows="2" maxlength="2000" class="border px-3 py-2"></textarea>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Usulan
					<textarea name="proposal" rows="2" maxlength="2000" class="border px-3 py-2"></textarea>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Hasil
					<textarea name="outcome" rows="2" maxlength="2000" class="border px-3 py-2"></textarea>
				</label>
				<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Simpan</button>
			</form>
		{/if}
	</section>

	<section class="mt-8">
		<h2 class="font-semibold">Keputusan</h2>
		{#if data.decisions.length === 0}
			<p class="mt-2 text-sm">Belum ada keputusan.</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-2">
				{#each data.decisions as d (d.id)}
					<li class="border px-3 py-2 text-sm">
						<p class="font-semibold">{d.title} [v{d.version} {d.status}]</p>
						<p class="mt-1 whitespace-pre-wrap">{d.content}</p>
						{#if d.decider}
							<p class="mt-1 text-xs">
								Difinalkan {d.decider}{d.decidedAt
									? `, ${d.decidedAt.slice(0, 16).replace('T', ' ')}`
									: ''}
							</p>
						{/if}
						{#if d.canEdit && d.status !== 'FINAL' && d.status !== 'SUPERSEDED'}
							<div class="mt-2 flex flex-wrap gap-2">
								{#if d.status === 'DRAFT'}
									<form method="post" action="?/setDecisionStatus">
										<input type="hidden" name="decisionId" value={d.id} />
										<input type="hidden" name="status" value="NEEDS_DISCUSSION" />
										<button type="submit" class="min-h-11 border px-3 py-2 text-xs"
											>Perlu diskusi</button
										>
									</form>
								{/if}
								{#if d.status === 'NEEDS_DISCUSSION'}
									<form method="post" action="?/setDecisionStatus">
										<input type="hidden" name="decisionId" value={d.id} />
										<input type="hidden" name="status" value="DRAFT" />
										<button type="submit" class="min-h-11 border px-3 py-2 text-xs"
											>Kembalikan draft</button
										>
									</form>
								{/if}
								{#if data.canFinalize}
									<form method="post" action="?/setDecisionStatus">
										<input type="hidden" name="decisionId" value={d.id} />
										<input type="hidden" name="status" value="FINAL" />
										<button type="submit" class="min-h-11 border px-3 py-2 text-xs font-semibold"
											>Finalkan</button
										>
									</form>
								{/if}
							</div>
						{/if}
						{#if d.status === 'FINAL' && data.canFinalize}
							<form method="post" action="?/reviseDecision" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="decisionId" value={d.id} />
								<label class="flex flex-col gap-1 text-xs">
									Isi revisi (versi lama tersimpan)
									<textarea
										name="content"
										required
										rows="2"
										maxlength="4000"
										class="border px-3 py-2"></textarea>
								</label>
								<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Buat revisi</button>
							</form>
						{/if}
						{#if data.canManage && d.status === 'FINAL'}
							<form method="post" action="?/createTask" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="decisionId" value={d.id} />
								<label class="flex flex-col gap-1 text-xs">
									Judul tugas dari keputusan ini
									<input
										name="title"
										required
										minlength="3"
										maxlength="120"
										class="min-h-11 border px-3 py-2"
									/>
								</label>
								<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Buat tugas</button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if data.canManage}
			<form method="post" action="?/addDecision" class="mt-4 flex flex-col gap-3">
				<h3 class="text-sm font-semibold">Keputusan baru</h3>
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
					Isi
					<textarea name="content" required rows="3" maxlength="4000" class="border px-3 py-2"
					></textarea>
				</label>
				<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Simpan draft</button>
			</form>
		{/if}
	</section>
</main>
