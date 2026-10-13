<script lang="ts">
	import { resolve } from '$app/paths';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<header class="border-b">
	<div class="mx-auto flex w-full max-w-xl items-center justify-between gap-2 px-4 py-3">
		<a href={resolve('/app')} class="font-bold">GenAwards</a>
		<span class="text-xs">{data.actor.name} ({data.actor.systemRole})</span>
		<form method="post" action="{resolve('/access')}?/logout">
			<button type="submit" class="min-h-11 border px-3 py-2 text-sm">Keluar</button>
		</form>
	</div>
</header>

{@render children()}
