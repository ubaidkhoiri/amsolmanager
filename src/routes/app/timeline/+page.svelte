<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Timeline</h1>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">{form.success}</p>
	{/if}

	<form method="get" class="mt-4 flex flex-wrap items-end gap-2 text-sm">
		<label class="flex flex-col gap-1">
			Divisi
			<select name="division" class="min-h-11 border px-2 py-2">
				<option value="">Semua</option>
				{#each data.divisions as d (d.id)}
					<option value={d.id} selected={d.id === data.filters.division}>{d.name}</option>
				{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1">
			Kategori
			<select name="category" class="min-h-11 border px-2 py-2">
				<option value="">Semua</option>
				{#each data.categories as c (c.value)}
					<option value={c.value} selected={c.value === data.filters.category}>{c.label}</option>
				{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1">
			Status
			<select name="status" class="min-h-11 border px-2 py-2">
				<option value="">Semua</option>
				{#each data.statuses as s (s)}
					<option value={s} selected={s === data.filters.status}>{s}</option>
				{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1">
			Dari
			<input
				name="from"
				type="date"
				value={data.filters.from ?? ''}
				class="min-h-11 border px-2 py-2"
			/>
		</label>
		<label class="flex flex-col gap-1">
			Sampai
			<input
				name="to"
				type="date"
				value={data.filters.to ?? ''}
				class="min-h-11 border px-2 py-2"
			/>
		</label>
		<button type="submit" class="min-h-11 border px-3 py-2">Filter</button>
	</form>

	<section class="mt-6">
		{#if data.groups.length === 0}
			<p class="text-sm">Belum ada item.</p>
		{:else}
			{#each data.groups as g (g.day)}
				<h2 class="mt-4 text-sm font-bold">{g.day}</h2>
				<ul class="mt-1 flex flex-col gap-2">
					{#each g.items as item (item.id)}
						<li class="border px-3 py-2 text-sm">
							<p class="font-semibold">{item.title} [{item.status}]</p>
							<p class="mt-1 text-xs">
								{item.category} ({item.division}), {item.starts}{item.end
									? ` sampai ${item.end}`
									: ''}
							</p>
							{#if item.nextStatuses.length > 0 && data.canManage}
								<form method="post" action="?/advance" class="mt-2 flex items-center gap-2">
									<input type="hidden" name="itemId" value={item.id} />
									<select name="status" class="min-h-11 border px-2 py-2 text-xs">
										{#each item.nextStatuses as s (s)}
											<option value={s}>{s}</option>
										{/each}
									</select>
									<button type="submit" class="min-h-11 border px-3 py-2 text-xs">Ubah</button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{/each}
		{/if}
	</section>

	{#if data.canManage}
		<section class="mt-8">
			<h2 class="font-semibold">Tambah item</h2>
			<form method="post" action="?/create" class="mt-2 flex flex-col gap-3">
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
					Kategori
					<select name="category" class="min-h-11 border px-3 py-2">
						{#each data.categories as c (c.value)}
							<option value={c.value}>{c.label}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Mulai
					<input name="startsAt" type="datetime-local" required class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Selesai (opsional)
					<input name="endsAt" type="datetime-local" class="min-h-11 border px-3 py-2" />
				</label>
				{#if data.actor.systemRole === 'MOD'}
					<label class="flex flex-col gap-1 text-sm">
						Divisi (kosongkan untuk semua)
						<select name="divisionId" class="min-h-11 border px-3 py-2">
							<option value="">Semua</option>
							{#each data.divisions as d (d.id)}
								<option value={d.id}>{d.name}</option>
							{/each}
						</select>
					</label>
				{/if}
				<label class="flex flex-col gap-1 text-sm">
					Deskripsi
					<textarea name="description" rows="2" maxlength="2000" class="border px-3 py-2"
					></textarea>
				</label>
				<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Simpan</button>
			</form>
		</section>
	{/if}
</main>
