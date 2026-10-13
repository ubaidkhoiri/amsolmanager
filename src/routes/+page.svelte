<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">GenAwards Cook Edition</h1>
	<p class="mt-2 text-sm">Pusat koordinasi panitia PAT. Fondasi Sprint 0.</p>
	<p class="mt-4 text-sm">
		Status server: <a class="underline" href={resolve('/api/health')}>/api/health</a>
	</p>
</main>
