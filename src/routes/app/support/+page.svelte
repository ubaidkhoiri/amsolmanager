<script lang="ts">
	import { resolve } from '$app/paths';
	import StatusBadge from '../../../lib/components/StatusBadge.svelte';
	import { lookup, SUPPORT_STATUS, TASK_PRIORITY } from '../../../lib/status-labels';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Bantuan lintas divisi</h1>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="meta mt-4">
			{form.success}
			{#if form?.taskId}
				<a class="underline" href={resolve('/app/tasks')}>Lihat tugas</a>
			{/if}
		</p>
	{/if}

	<section aria-labelledby="daftar">
		<h2 id="daftar" class="section-title">Daftar permintaan</h2>
		{#if data.requests.length === 0}
			<div class="empty">
				<p>Belum ada permintaan.</p>
				<p class="meta">Permintaan bantuan antar divisi muncul di sini.</p>
			</div>
		{:else}
			<ul class="list-plain">
				{#each data.requests as r (r.id)}
					<li class="card">
						<p class="font-semibold">{r.title}</p>
						<p class="meta mt-1">
							{r.from} ke {r.to}{r.neededBy
								? `, butuh ${r.neededBy.slice(0, 16).replace('T', ' ')}`
								: ''}
						</p>
						<p class="mt-1 flex flex-wrap gap-1">
							<StatusBadge map={SUPPORT_STATUS} code={r.status} />
							<StatusBadge map={TASK_PRIORITY} code={r.priority} />
						</p>
						{#if r.nextStatuses.length > 0}
							<form method="post" action="?/advance" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="requestId" value={r.id} />
								<label class="field">
									Status
									<select name="status" class="input">
										{#each r.nextStatuses as s (s)}
											<option value={s}>{lookup(SUPPORT_STATUS, s).label}</option>
										{/each}
									</select>
								</label>
								<label class="field">
									Respons atau alasan (wajib untuk minta info dan tolak)
									<input name="response" maxlength="1000" class="input" />
								</label>
								<div class="btn-row">
									<button type="submit" class="btn btn-secondary">Ubah status</button>
								</div>
							</form>
						{/if}
						{#if (r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS') && data.actor.systemRole !== 'COMMITTEE'}
							<form method="post" action="?/linkTask" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="requestId" value={r.id} />
								<label class="field">
									Judul tugas untuk permintaan ini
									<span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
									<input name="title" required minlength="3" maxlength="120" class="input" />
								</label>
								<div class="btn-row">
									<button type="submit" class="btn btn-secondary">Buat tugas</button>
								</div>
							</form>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if data.canCreate}
		<section aria-labelledby="minta">
			<h2 id="minta" class="section-title">Minta bantuan</h2>
			<form method="post" action="?/create" class="flex flex-col gap-3">
				<p class="hint">Tanda * berarti wajib diisi.</p>
				{#if data.actor.systemRole === 'MOD'}
					<label class="field">
						Divisi peminta <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
						<select name="requestingDivisionId" required class="input">
							{#each data.divisions as d (d.id)}
								<option value={d.id}>{d.name}</option>
							{/each}
						</select>
					</label>
				{/if}
				<label class="field">
					Divisi tujuan <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<select name="targetDivisionId" required class="input">
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Judul <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<input name="title" required minlength="3" maxlength="120" class="input" />
				</label>
				<label class="field">
					Deskripsi kebutuhan <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<textarea name="description" required rows="3" maxlength="2000" class="input"></textarea>
				</label>
				<label class="field">
					Alasan atau konteks (opsional)
					<textarea name="reason" rows="2" maxlength="2000" class="input"></textarea>
				</label>
				<label class="field">
					Prioritas <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<select name="priority" class="input">
						<option value="LOW">{lookup(TASK_PRIORITY, 'LOW').label}</option>
						<option value="MEDIUM" selected>{lookup(TASK_PRIORITY, 'MEDIUM').label}</option>
						<option value="HIGH">{lookup(TASK_PRIORITY, 'HIGH').label}</option>
						<option value="URGENT">{lookup(TASK_PRIORITY, 'URGENT').label}</option>
					</select>
				</label>
				<label class="field">
					Butuh sebelum (opsional)
					<input name="neededBy" type="datetime-local" class="input" />
				</label>
				<div class="btn-row">
					<button type="submit" class="btn btn-primary">Kirim permintaan</button>
				</div>
			</form>
		</section>
	{/if}
</main>
