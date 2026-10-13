<script lang="ts">
	import StatusBadge from '../../../lib/components/StatusBadge.svelte';
	import { lookup, TIMELINE_STATUS } from '../../../lib/status-labels';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Timeline</h1>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="meta mt-4">{form.success}</p>
	{/if}

	<form method="get" class="mt-4 flex flex-col gap-3">
		<label class="field">
			Divisi
			<select name="division" class="input">
				<option value="">Semua</option>
				{#each data.divisions as d (d.id)}
					<option value={d.id} selected={d.id === data.filters.division}>{d.name}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			Kategori
			<select name="category" class="input">
				<option value="">Semua</option>
				{#each data.categories as c (c.value)}
					<option value={c.value} selected={c.value === data.filters.category}>{c.label}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			Status
			<select name="status" class="input">
				<option value="">Semua</option>
				{#each data.statuses as s (s)}
					<option value={s} selected={s === data.filters.status}>
						{lookup(TIMELINE_STATUS, s).label}
					</option>
				{/each}
			</select>
		</label>
		<label class="field">
			Dari
			<input name="from" type="date" value={data.filters.from ?? ''} class="input" />
		</label>
		<label class="field">
			Sampai
			<input name="to" type="date" value={data.filters.to ?? ''} class="input" />
		</label>
		<div class="btn-row">
			<button type="submit" class="btn btn-secondary">Filter</button>
		</div>
	</form>

	<section aria-labelledby="jadwal">
		<h2 id="jadwal" class="section-title">Jadwal</h2>
		{#if data.groups.length === 0}
			<div class="empty">
				<p>Belum ada item.</p>
				<p class="meta">Item timeline muncul di sini setelah ditambah.</p>
			</div>
		{:else}
			{#each data.groups as g (g.day)}
				<h3 class="mt-4 font-bold">{g.day}</h3>
				<ul class="list-plain mt-1">
					{#each g.items as item (item.id)}
						<li class="card">
							<p class="font-semibold">{item.title}</p>
							<p class="meta mt-1">
								{item.category} ({item.division}), {item.starts}{item.end
									? ` sampai ${item.end}`
									: ''}
							</p>
							<p class="mt-1"><StatusBadge map={TIMELINE_STATUS} code={item.status} /></p>
							{#if item.nextStatuses.length > 0 && data.canManage}
								<form method="post" action="?/advance" class="mt-2 flex flex-col gap-2">
									<input type="hidden" name="itemId" value={item.id} />
									<label class="field">
										Status
										<select name="status" class="input">
											{#each item.nextStatuses as s (s)}
												<option value={s}>{lookup(TIMELINE_STATUS, s).label}</option>
											{/each}
										</select>
									</label>
									<div class="btn-row">
										<button type="submit" class="btn btn-secondary">Ubah status</button>
									</div>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{/each}
		{/if}
	</section>

	{#if data.canManage}
		<section aria-labelledby="tambah">
			<h2 id="tambah" class="section-title">Tambah item</h2>
			<form method="post" action="?/create" class="flex flex-col gap-3">
				<p class="hint">Tanda * berarti wajib diisi.</p>
				<label class="field">
					Judul <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<input name="title" required minlength="3" maxlength="120" class="input" />
				</label>
				<label class="field">
					Kategori <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<select name="category" class="input">
						{#each data.categories as c (c.value)}
							<option value={c.value}>{c.label}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Mulai <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<input name="startsAt" type="datetime-local" required class="input" />
				</label>
				<label class="field">
					Selesai (opsional)
					<input name="endsAt" type="datetime-local" class="input" />
				</label>
				{#if data.actor.systemRole === 'MOD'}
					<label class="field">
						Divisi (opsional, kosongkan untuk semua)
						<select name="divisionId" class="input">
							<option value="">Semua</option>
							{#each data.divisions as d (d.id)}
								<option value={d.id}>{d.name}</option>
							{/each}
						</select>
					</label>
				{/if}
				<label class="field">
					Deskripsi (opsional)
					<textarea name="description" rows="2" maxlength="2000" class="input"></textarea>
				</label>
				<div class="btn-row">
					<button type="submit" class="btn btn-primary">Simpan item</button>
				</div>
			</form>
		</section>
	{/if}
</main>
