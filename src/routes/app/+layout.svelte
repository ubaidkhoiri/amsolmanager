<script lang="ts">
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const links = [
		{ href: '/app', label: 'Beranda' },
		{ href: '/app/meetings', label: 'Musyawarah' },
		{ href: '/app/tasks', label: 'Tugas' },
		{ href: '/app/timeline', label: 'Timeline' },
		{ href: '/app/more', label: 'Lainnya' }
	];

	function current(href: string): boolean {
		if (href === '/app') return page.url.pathname === '/app';
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<header class="border-b border-(--color-stroke-weak) bg-(--color-bg-raised)">
	<div class="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-4 py-3">
		<a href={resolve('/app')} class="font-bold">GenAwards</a>
		<span class="meta">{data.actor.name}</span>
		<form method="post" action="{resolve('/access')}?/logout">
			<button type="submit" class="btn btn-tertiary">Keluar</button>
		</form>
	</div>
</header>

{#if navigating.to}
	<p role="status" class="meta px-4 py-1 text-center">Memuat…</p>
{/if}

{@render children()}

<nav aria-label="Navigasi utama" class="bottomnav">
	<div class="bottomnav-list">
		{#each links as l (l.href)}
			<a
				href={resolve(l.href as '/app')}
				class="bottomnav-link"
				aria-current={current(l.href) ? 'page' : undefined}
			>
				{l.label}
			</a>
		{/each}
	</div>
</nav>
