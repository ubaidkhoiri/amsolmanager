<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Masuk GenAwards</h1>
	<p class="meta">Pilih nama kamu lalu isi kode akses sesuai role.</p>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}

	<form method="post" action="?/login" class="mt-6 flex flex-col gap-4">
		<label class="field">
			Nama anggota
			<select name="memberId" required class="input">
				<option value="">Pilih nama</option>
				{#each data.members as m (m.id)}
					<option value={m.id}
						>{m.name} ({m.systemRole}{m.division ? `, ${m.division}` : ''})</option
					>
				{/each}
			</select>
		</label>
		<label class="field">
			Kode akses
			<input name="code" type="password" required autocomplete="current-password" class="input" />
		</label>
		<button type="submit" class="btn btn-primary">Masuk</button>
	</form>
</main>
