<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Bantuan lintas divisi</h1>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">
			{form.success}
			{#if form?.taskId}
				<a class="underline" href={resolve('/app/tasks')}>Lihat tugas</a>
			{/if}
		</p>
	{/if}

	<section class="mt-6">
		<h2 class="font-semibold">Daftar permintaan</h2>
		{#if data.requests.length === 0}
			<p class="mt-2 text-sm">Belum ada permintaan.</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-2">
				{#each data.requests as r (r.id)}
					<li class="border px-3 py-2 text-sm">
						<p class="font-semibold">{r.title} [{r.status}]</p>
						<p class="mt-1 text-xs">
							{r.from} ke {r.to} ({r.priority}){r.neededBy
								? `, butuh ${r.neededBy.slice(0, 16).replace('T', ' ')}`
								: ''}
						</p>
						{#if r.nextStatuses.length > 0}
							<form method="post" action="?/advance" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="requestId" value={r.id} />
								<label class="flex items-center gap-2 text-xs">
									Status
									<select name="status" class="min-h-11 border px-2 py-2">
										{#each r.nextStatuses as s (s)}
											<option value={s}>{s}</option>
										{/each}
									</select>
								</label>
								<label class="flex flex-col gap-1 text-xs">
									Respons atau alasan (wajib untuk minta info dan tolak)
									<input name="response" maxlength="1000" class="min-h-11 border px-2 py-2" />
								</label>
								<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Ubah</button>
							</form>
						{/if}
						{#if (r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS') && data.actor.systemRole !== 'COMMITTEE'}
							<form method="post" action="?/linkTask" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="requestId" value={r.id} />
								<label class="flex flex-col gap-1 text-xs">
									Judul tugas untuk permintaan ini
									<input
										name="title"
										required
										minlength="3"
										maxlength="120"
										class="min-h-11 border px-2 py-2"
									/>
								</label>
								<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Buat tugas</button>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if data.canCreate}
		<section class="mt-8">
			<h2 class="font-semibold">Minta bantuan</h2>
			<form method="post" action="?/create" class="mt-2 flex flex-col gap-3">
				{#if data.actor.systemRole === 'MOD'}
					<label class="flex flex-col gap-1 text-sm">
						Divisi peminta
						<select name="requestingDivisionId" required class="min-h-11 border px-3 py-2">
							{#each data.divisions as d (d.id)}
								<option value={d.id}>{d.name}</option>
							{/each}
						</select>
					</label>
				{/if}
				<label class="flex flex-col gap-1 text-sm">
					Divisi tujuan
					<select name="targetDivisionId" required class="min-h-11 border px-3 py-2">
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Judul
					<input
						name="title"
						required
						minlength="3"
						maxlength="120"
						class="min-h-11 border px-3 py-2"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Deskripsi kebutuhan
					<textarea name="description" required rows="3" maxlength="2000" class="border px-3 py-2"
					></textarea>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Alasan atau konteks
					<textarea name="reason" rows="2" maxlength="2000" class="border px-3 py-2"></textarea>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Prioritas
					<select name="priority" class="min-h-11 border px-3 py-2">
						<option value="LOW">LOW</option>
						<option value="MEDIUM" selected>MEDIUM</option>
						<option value="HIGH">HIGH</option>
						<option value="URGENT">URGENT</option>
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Butuh sebelum (opsional)
					<input name="neededBy" type="datetime-local" class="min-h-11 border px-3 py-2" />
				</label>
				<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Kirim</button>
			</form>
		</section>
	{/if}
</main>
