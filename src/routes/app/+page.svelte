<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Beranda</h1>
	<p class="mt-2 text-sm">
		Halo {data.actor.name}. Modul lain menyusul di Sprint 2 dan seterusnya.
	</p>
	{#if data.actor.systemRole === 'MOD'}
		<p class="mt-4 text-sm">
			<a class="underline" href={resolve('/app/members')}>Kelola anggota dan kode akses</a>
		</p>
	{/if}
</main>
