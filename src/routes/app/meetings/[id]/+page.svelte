<script lang="ts">
	import { resolve } from '$app/paths';
	import StatusBadge from '../../../../lib/components/StatusBadge.svelte';
	import {
		DECISION_STATUS,
		lookup,
		MEETING_STATUS,
		MEETING_TYPE,
		MINUTE_STATUS
	} from '../../../../lib/status-labels';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<p class="meta"><a class="underline" href={resolve('/app/meetings')}>Kembali ke musyawarah</a></p>
	<h1 class="page-title mt-2">{data.meeting.title}</h1>
	<p class="meta mt-1">
		{MEETING_TYPE[data.meeting.type] ?? data.meeting.type}{data.meeting.startsAt
			? `, ${data.meeting.startsAt.slice(0, 16).replace('T', ' ')}`
			: ''}{data.meeting.location ? `, ${data.meeting.location}` : ''}
	</p>
	<p class="mt-1"><StatusBadge map={MEETING_STATUS} code={data.meeting.status} /></p>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="meta mt-4">
			{form.success}
			{#if form?.taskId}
				<a class="underline" href={resolve('/app/tasks')}>Lihat tugas</a>
			{/if}
		</p>
	{/if}

	{#if data.canManage && data.nextStatuses.length > 0}
		<form method="post" action="?/setStatus" class="mt-4 flex flex-col gap-2">
			<label class="field">
				Status
				<select name="status" class="input">
					{#each data.nextStatuses as s (s)}
						<option value={s}>{lookup(MEETING_STATUS, s).label}</option>
					{/each}
				</select>
			</label>
			<div class="btn-row">
				<button type="submit" class="btn btn-secondary">Ubah status</button>
			</div>
		</form>
	{/if}

	<section aria-labelledby="agenda">
		<h2 id="agenda" class="section-title">Agenda</h2>
		<p class="whitespace-pre-wrap">{data.meeting.agenda || 'Belum ada agenda.'}</p>
	</section>

	<section aria-labelledby="notulen">
		<h2 id="notulen" class="section-title">Notulen</h2>
		{#if data.minutes.length === 0}
			<div class="empty">
				<p>Belum ada notulen.</p>
				<p class="meta">Ringkasan bahasan muncul di sini setelah dicatat.</p>
			</div>
		{:else}
			<ul class="list-plain">
				{#each data.minutes as m (m.id)}
					<li class="card">
						<p class="font-semibold">{m.topic}</p>
						<p class="mt-1"><StatusBadge map={MINUTE_STATUS} code={m.status} /></p>
						{#if m.summary}<p class="mt-1">Bahasan: {m.summary}</p>{/if}
						{#if m.proposal}<p class="mt-1">Usulan: {m.proposal}</p>{/if}
						{#if m.outcome}<p class="mt-1">Hasil: {m.outcome}</p>{/if}
						<p class="meta mt-1">oleh {m.author}</p>
						{#if data.canManage}
							<form method="post" action="?/setMinuteStatus" class="btn-row mt-2">
								<input type="hidden" name="minuteId" value={m.id} />
								<input type="hidden" name="status" value={m.status === 'OPEN' ? 'DONE' : 'OPEN'} />
								<button type="submit" class="btn btn-secondary">
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
				<h3 class="font-semibold">Tambah notulen</h3>
				<p class="hint">Tanda * berarti wajib diisi.</p>
				<label class="field">
					Topik <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<input name="topic" required minlength="3" maxlength="120" class="input" />
				</label>
				<label class="field">
					Ringkasan bahasan (opsional)
					<textarea name="summary" rows="2" maxlength="2000" class="input"></textarea>
				</label>
				<label class="field">
					Usulan (opsional)
					<textarea name="proposal" rows="2" maxlength="2000" class="input"></textarea>
				</label>
				<label class="field">
					Hasil (opsional)
					<textarea name="outcome" rows="2" maxlength="2000" class="input"></textarea>
				</label>
				<div class="btn-row">
					<button type="submit" class="btn btn-primary">Simpan notulen</button>
				</div>
			</form>
		{/if}
	</section>

	<section aria-labelledby="keputusan">
		<h2 id="keputusan" class="section-title">Keputusan</h2>
		{#if data.decisions.length === 0}
			<div class="empty">
				<p>Belum ada keputusan.</p>
				<p class="meta">Keputusan musyawarah muncul di sini setelah dibuat.</p>
			</div>
		{:else}
			<ul class="list-plain">
				{#each data.decisions as d (d.id)}
					<li class="card">
						<p class="font-semibold">{d.title} <span class="meta">v{d.version}</span></p>
						<p class="mt-1"><StatusBadge map={DECISION_STATUS} code={d.status} /></p>
						<p class="mt-1 whitespace-pre-wrap">{d.content}</p>
						{#if d.decider}
							<p class="meta mt-1">
								Difinalkan {d.decider}{d.decidedAt
									? `, ${d.decidedAt.slice(0, 16).replace('T', ' ')}`
									: ''}
							</p>
						{/if}
						{#if d.canEdit && d.status !== 'FINAL' && d.status !== 'SUPERSEDED'}
							<div class="btn-row mt-2">
								{#if d.status === 'DRAFT'}
									<form method="post" action="?/setDecisionStatus">
										<input type="hidden" name="decisionId" value={d.id} />
										<input type="hidden" name="status" value="NEEDS_DISCUSSION" />
										<button type="submit" class="btn btn-secondary">Perlu diskusi</button>
									</form>
								{/if}
								{#if d.status === 'NEEDS_DISCUSSION'}
									<form method="post" action="?/setDecisionStatus">
										<input type="hidden" name="decisionId" value={d.id} />
										<input type="hidden" name="status" value="DRAFT" />
										<button type="submit" class="btn btn-secondary">Kembalikan draft</button>
									</form>
								{/if}
								{#if data.canFinalize}
									<form method="post" action="?/setDecisionStatus">
										<input type="hidden" name="decisionId" value={d.id} />
										<input type="hidden" name="status" value="FINAL" />
										<button type="submit" class="btn btn-primary">Finalkan</button>
									</form>
								{/if}
							</div>
						{/if}
						{#if d.status === 'FINAL' && data.canFinalize}
							<form method="post" action="?/reviseDecision" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="decisionId" value={d.id} />
								<label class="field">
									Isi revisi (versi lama tersimpan)
									<textarea name="content" required rows="2" maxlength="4000" class="input"
									></textarea>
								</label>
								<div class="btn-row">
									<button type="submit" class="btn btn-secondary">Buat revisi</button>
								</div>
							</form>
						{/if}
						{#if data.canManage && d.status === 'FINAL'}
							<form method="post" action="?/createTask" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="decisionId" value={d.id} />
								<label class="field">
									Judul tugas dari keputusan ini
									<span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
									<input name="title" required minlength="3" maxlength="120" class="input" />
								</label>
								<div class="btn-row">
									<button type="submit" class="btn btn-secondary">Buat tugas</button>
								</div>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if data.canManage}
			<form method="post" action="?/addDecision" class="mt-4 flex flex-col gap-3">
				<h3 class="font-semibold">Keputusan baru</h3>
				<p class="hint">Tanda * berarti wajib diisi.</p>
				<label class="field">
					Judul <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<input name="title" required minlength="3" maxlength="120" class="input" />
				</label>
				<label class="field">
					Isi <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<textarea name="content" required rows="3" maxlength="4000" class="input"></textarea>
				</label>
				<div class="btn-row">
					<button type="submit" class="btn btn-primary">Simpan draft</button>
				</div>
			</form>
		{/if}
	</section>
</main>
