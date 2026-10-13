<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Tugas</h1>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">{form.success}</p>
	{/if}

	{#if data.tasks.length === 0}
		<p class="mt-4 text-sm">Belum ada tugas aktif.</p>
	{:else}
		<ul class="mt-4 flex flex-col gap-2">
			{#each data.tasks as t (t.id)}
				<li class="border px-3 py-2 text-sm">
					<p class="font-semibold">
						{t.title}
						{#if t.overdue}<span class="text-xs">[TERLAMBAT]</span>{/if}
					</p>
					<p class="mt-1 text-xs">
						{t.division} [{t.status}] ({t.priority}){t.assignee
							? `, PIC ${t.assignee}`
							: ', tanpa PIC'}{t.dueAt
							? `, tenggat ${t.dueAt.slice(0, 16).replace('T', ' ')}`
							: ''}{t.fromDecision ? ', dari keputusan' : ''}
					</p>
					{#if t.description}<p class="mt-1">{t.description}</p>{/if}
					{#if t.canManage}
						{#if t.nextStatuses.length > 0}
							<form method="post" action="?/setStatus" class="mt-2 flex items-center gap-2">
								<input type="hidden" name="taskId" value={t.id} />
								<label class="text-xs">
									Status
									<select name="status" class="min-h-11 border px-2 py-2">
										{#each t.nextStatuses as s (s)}
											<option value={s}>{s}</option>
										{/each}
									</select>
								</label>
								<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Ubah</button>
							</form>
						{/if}
						<form method="post" action="?/assign" class="mt-2 flex flex-col gap-2">
							<input type="hidden" name="taskId" value={t.id} />
							<label class="flex flex-col gap-1 text-xs">
								PIC
								<select name="assignedTo" class="min-h-11 border px-2 py-2">
									<option value="">Tanpa PIC</option>
									{#each data.members as m (m.id)}
										<option value={m.id}>{m.name}</option>
									{/each}
								</select>
							</label>
							<label class="flex flex-col gap-1 text-xs">
								Deadline
								<input name="dueAt" type="datetime-local" class="min-h-11 border px-2 py-2" />
							</label>
							<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Simpan PIC</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
