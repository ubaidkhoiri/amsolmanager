<script lang="ts">
	import { resolve } from '$app/paths';
	import StatusBadge from '../../lib/components/StatusBadge.svelte';
	import {
		DECISION_STATUS,
		MEETING_STATUS,
		MEETING_TYPE,
		TASK_STATUS
	} from '../../lib/status-labels';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Beranda</h1>
	{#if data.actor}
		<p class="meta">Halo {data.actor.name}.</p>

		<section aria-labelledby="agenda">
			<h2 id="agenda" class="section-title">Agenda terdekat</h2>
			{#if data.upcoming.length === 0}
				<div class="empty">
					<p>Belum ada agenda terjadwal.</p>
					<p class="meta">Jadwal baru muncul di sini setelah musyawarah dibuat.</p>
				</div>
			{:else}
				<ul class="list-plain">
					{#each data.upcoming as m (m.id)}
						<li class="card">
							<a class="font-semibold underline" href={resolve('/app/meetings/[id]', { id: m.id })}>
								{m.title}
							</a>
							<p class="meta">
								{MEETING_TYPE[m.meetingType] ?? m.meetingType}{m.startsAt
									? `, ${m.startsAt.slice(0, 16).replace('T', ' ')}`
									: ''}
							</p>
							<p class="mt-1"><StatusBadge map={MEETING_STATUS} code={m.status} /></p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section aria-labelledby="tugas">
			<h2 id="tugas" class="section-title">Tugas saya</h2>
			{#if data.myTasks.length === 0}
				<div class="empty">
					<p>Tidak ada tugas aktif.</p>
					<p class="meta">Tugas baru muncul di sini setelah ditugaskan ke kamu.</p>
				</div>
			{:else}
				<ul class="list-plain">
					{#each data.myTasks as t (t.id)}
						<li class="card">
							<a class="font-semibold underline" href={resolve('/app/tasks')}>{t.title}</a>
							<p class="meta">
								{t.dueAt ? `Tenggat ${t.dueAt.slice(0, 16).replace('T', ' ')}` : 'Tanpa tenggat'}
							</p>
							<p class="mt-1 flex flex-wrap gap-1">
								<StatusBadge map={TASK_STATUS} code={t.status} />
								{#if t.overdue}
									<StatusBadge label="Terlambat" tone="error" />
								{/if}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section aria-labelledby="keputusan">
			<h2 id="keputusan" class="section-title">Keputusan final terbaru</h2>
			{#if data.recentDecisions.length === 0}
				<div class="empty">
					<p>Belum ada keputusan final.</p>
					<p class="meta">Keputusan final musyawarah muncul di sini.</p>
				</div>
			{:else}
				<ul class="list-plain">
					{#each data.recentDecisions as d (d.id)}
						<li class="card">
							<a
								class="font-semibold underline"
								href={resolve('/app/meetings/[id]', { id: d.meetingId })}
							>
								{d.title}
							</a>
							<p class="meta">
								Versi {d.version}{d.decidedAt ? `, ${d.decidedAt.slice(0, 10)}` : ''}
							</p>
							<p class="mt-1"><StatusBadge map={DECISION_STATUS} code="FINAL" /></p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</main>
