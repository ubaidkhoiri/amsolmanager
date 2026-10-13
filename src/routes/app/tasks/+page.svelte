<script lang="ts">
	import StatusBadge from '../../../lib/components/StatusBadge.svelte';
	import { lookup, TASK_PRIORITY, TASK_STATUS } from '../../../lib/status-labels';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Tugas</h1>

	<form method="get" class="mt-4 flex flex-col gap-3">
		<label class="field">
			Divisi
			<select name="division" class="input">
				<option value="">Semua</option>
				{#each data.divisions as d (d.id)}
					<option value={d.id} selected={d.id === data.selectedDivision}>{d.name}</option>
				{/each}
			</select>
		</label>
		<div class="btn-row">
			<button type="submit" class="btn btn-secondary">Filter</button>
		</div>
	</form>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="meta mt-4">{form.success}</p>
	{/if}

	{#if data.tasks.length === 0}
		<div class="empty mt-4">
			<p>Belum ada tugas aktif.</p>
			<p class="meta">Tugas baru muncul di sini setelah dibuat dari keputusan.</p>
		</div>
	{:else}
		<ul class="list-plain mt-4">
			{#each data.tasks as t (t.id)}
				<li class="card">
					<p class="font-semibold">{t.title}</p>
					<p class="meta mt-1">
						{t.division}{t.assignee ? `, PIC ${t.assignee}` : ', tanpa PIC'}{t.dueAt
							? `, tenggat ${t.dueAt.slice(0, 16).replace('T', ' ')}`
							: ''}{t.fromDecision ? ', dari keputusan' : ''}
					</p>
					<p class="mt-1 flex flex-wrap gap-1">
						<StatusBadge map={TASK_STATUS} code={t.status} />
						<StatusBadge map={TASK_PRIORITY} code={t.priority} />
						{#if t.overdue}
							<StatusBadge label="Terlambat" tone="error" />
						{/if}
					</p>
					{#if t.description}<p class="mt-1">{t.description}</p>{/if}
					{#if t.canManage}
						{#if t.nextStatuses.length > 0}
							<form method="post" action="?/setStatus" class="mt-2 flex flex-col gap-2">
								<input type="hidden" name="taskId" value={t.id} />
								<label class="field">
									Status
									<select name="status" class="input">
										{#each t.nextStatuses as s (s)}
											<option value={s}>{lookup(TASK_STATUS, s).label}</option>
										{/each}
									</select>
								</label>
								<div class="btn-row">
									<button type="submit" class="btn btn-secondary">Ubah status</button>
								</div>
							</form>
						{/if}
						<form method="post" action="?/assign" class="mt-2 flex flex-col gap-2">
							<input type="hidden" name="taskId" value={t.id} />
							<label class="field">
								PIC (opsional)
								<select name="assignedTo" class="input">
									<option value="">Tanpa PIC</option>
									{#each data.members as m (m.id)}
										<option value={m.id}>{m.name}</option>
									{/each}
								</select>
							</label>
							<label class="field">
								Deadline (opsional)
								<input name="dueAt" type="datetime-local" class="input" />
							</label>
							<div class="btn-row">
								<button type="submit" class="btn btn-secondary">Simpan PIC</button>
							</div>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
