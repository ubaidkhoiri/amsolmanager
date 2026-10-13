<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-md px-4 py-10">
	<h1 class="text-2xl font-bold">Masuk GenAwards</h1>
	<p class="mt-2 text-sm">Pilih nama kamu lalu isi kode akses sesuai role.</p>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}

	<form method="post" action="?/login" class="mt-6 flex flex-col gap-4">
		<label class="flex flex-col gap-1 text-sm">
			Nama anggota
			<select name="memberId" required class="min-h-11 border px-3 py-2">
				<option value="">Pilih nama</option>
				{#each data.members as m (m.id)}
					<option value={m.id}
						>{m.name} ({m.systemRole}{m.division ? `, ${m.division}` : ''})</option
					>
				{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Kode akses
			<input
				name="code"
				type="password"
				required
				autocomplete="current-password"
				class="min-h-11 border px-3 py-2"
			/>
		</label>
		<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Masuk</button>
	</form>
</main>
