<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Audit log</h1>
	<p class="meta">Append-only. 200 entri terbaru.</p>
	{#if data.logs.length === 0}
		<div class="empty mt-4">
			<p>Belum ada aktivitas sensitif.</p>
			<p class="meta">Perubahan sensitif tercatat di sini.</p>
		</div>
	{:else}
		<ul class="list-plain mt-4">
			{#each data.logs as l (l.at + l.action + l.entity)}
				<li class="card">
					<p class="font-semibold">{l.action} {l.entity}</p>
					<p class="meta">{l.at}</p>
					{#if l.reason}
						<p class="meta">Alasan: {l.reason}</p>
					{/if}
					{#if l.before}
						<p class="meta mt-1">Sebelum: {l.before}</p>
					{/if}
					{#if l.after}
						<p class="meta">Sesudah: {l.after}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
