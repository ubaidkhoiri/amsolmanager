<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Audit log</h1>
	<p class="mt-2 text-sm">Append-only. 200 entri terbaru.</p>
	{#if data.logs.length === 0}
		<p class="mt-4 text-sm">Belum ada aktivitas sensitif.</p>
	{:else}
		<ul class="mt-4 flex flex-col gap-2 text-sm">
			{#each data.logs as l (l.at + l.action + l.entity)}
				<li class="border px-3 py-2">
					<p class="font-semibold">{l.action} {l.entity}</p>
					<p class="text-xs">{l.at}</p>
					{#if l.reason}
						<p class="text-xs">Alasan: {l.reason}</p>
					{/if}
					{#if l.before}
						<p class="mt-1 text-xs">Sebelum: {l.before}</p>
					{/if}
					{#if l.after}
						<p class="text-xs">Sesudah: {l.after}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
