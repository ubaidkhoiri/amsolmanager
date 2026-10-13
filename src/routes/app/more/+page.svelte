<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Lainnya</h1>
	<nav aria-label="Menu lainnya" class="list-plain">
		<a class="card block" href={resolve('/app/support')}>
			<span class="font-semibold">Bantuan lintas divisi</span>
			<span class="meta block">Minta dan tanggapi bantuan antar divisi</span>
		</a>
		<a class="card block" href={resolve('/app/finance')}>
			<span class="font-semibold">Keuangan</span>
			<span class="meta block">Ledger, anggaran, dan sisa dana</span>
		</a>
		<a class="card block" href={resolve('/app/publications')}>
			<span class="font-semibold">Publikasi</span>
			<span class="meta block">Konten PDD dari ide sampai tayang</span>
		</a>
		{#if data.actor.systemRole === 'MOD'}
			<a class="card block" href={resolve('/app/members')}>
				<span class="font-semibold">Anggota</span>
				<span class="meta block">Daftar, nonaktifkan, dan rotasi kode</span>
			</a>
			<a class="card block" href={resolve('/app/audit')}>
				<span class="font-semibold">Audit</span>
				<span class="meta block">Jejak perubahan sensitif</span>
			</a>
		{/if}
	</nav>
</main>
