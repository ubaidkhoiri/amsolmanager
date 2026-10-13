<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Beranda</h1>
	{#if data.actor}
		<p class="mt-2 text-sm">Halo {data.actor.name}.</p>

		<nav class="mt-4 flex flex-wrap gap-2 text-sm">
			<a class="border px-3 py-2 underline" href={resolve('/app/meetings')}>Musyawarah</a>
			<a class="border px-3 py-2 underline" href={resolve('/app/tasks')}>Tugas</a>
			<a class="border px-3 py-2 underline" href={resolve('/app/support')}>Bantuan</a>
			{#if data.actor.systemRole === 'MOD'}
				<a class="border px-3 py-2 underline" href={resolve('/app/members')}>Anggota</a>
			{/if}
		</nav>

		<section class="mt-6">
			<h2 class="font-semibold">Agenda terdekat</h2>
			{#if data.upcoming.length === 0}
				<p class="mt-1 text-sm">Tidak ada agenda terjadwal.</p>
			{:else}
				<ul class="mt-2 flex flex-col gap-2">
					{#each data.upcoming as m (m.id)}
						<li class="border px-3 py-2 text-sm">
							<a class="font-semibold underline" href={resolve('/app/meetings/[id]', { id: m.id })}>
								{m.title}
							</a>
							<p class="text-xs">
								[{m.status}]{m.startsAt ? `, ${m.startsAt.slice(0, 16).replace('T', ' ')}` : ''}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="mt-6">
			<h2 class="font-semibold">Tugasku</h2>
			{#if data.myTasks.length === 0}
				<p class="mt-1 text-sm">Tidak ada tugas aktif.</p>
			{:else}
				<ul class="mt-2 flex flex-col gap-2">
					{#each data.myTasks as t (t.id)}
						<li class="border px-3 py-2 text-sm">
							<a class="font-semibold underline" href={resolve('/app/tasks')}>{t.title}</a>
							<p class="text-xs">
								[{t.status}]{#if t.overdue}
									[TERLAMBAT]{/if}{t.dueAt ? `, ${t.dueAt.slice(0, 16).replace('T', ' ')}` : ''}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="mt-6">
			<h2 class="font-semibold">Keputusan final terbaru</h2>
			{#if data.recentDecisions.length === 0}
				<p class="mt-1 text-sm">Belum ada keputusan final.</p>
			{:else}
				<ul class="mt-2 flex flex-col gap-2">
					{#each data.recentDecisions as d (d.id)}
						<li class="border px-3 py-2 text-sm">
							<a
								class="font-semibold underline"
								href={resolve('/app/meetings/[id]', { id: d.meetingId })}
							>
								{d.title}
							</a>
							<p class="text-xs">
								[v{d.version}]{d.decidedAt ? `, ${d.decidedAt.slice(0, 10)}` : ''}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</main>
