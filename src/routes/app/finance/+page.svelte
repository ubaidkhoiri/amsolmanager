<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="mx-auto w-full max-w-xl px-4 py-10">
	<h1 class="text-2xl font-bold">Keuangan</h1>

	{#if form?.error}
		<p role="alert" class="mt-4 border px-3 py-2 text-sm">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="mt-4 border px-3 py-2 text-sm">{form.success}</p>
	{/if}

	<section class="mt-6 grid grid-cols-3 gap-2 text-sm" aria-label="Ringkasan">
		<div class="border px-3 py-2">
			<p class="text-xs">Masuk</p>
			<p class="font-semibold">{data.income}</p>
		</div>
		<div class="border px-3 py-2">
			<p class="text-xs">Keluar</p>
			<p class="font-semibold">{data.expense}</p>
		</div>
		<div class="border px-3 py-2">
			<p class="text-xs">Saldo</p>
			<p class="font-semibold">{data.balance}</p>
		</div>
	</section>

	<section class="mt-8">
		<h2 class="font-semibold">Anggaran per divisi</h2>
		{#if data.budgets.length === 0}
			<p class="mt-2 text-sm">Belum ada anggaran.</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-2 text-sm">
				{#each data.budgets as b (b.id)}
					<li class="border px-3 py-2">
						<p class="font-semibold">{b.division}{b.category ? ` (${b.category})` : ''}</p>
						<p class="mt-1 text-xs">
							Rencana {b.planned}, realisasi {b.realized}, sisa {b.remaining} ({b.percent})
						</p>
						<p class="text-xs">Selisih {b.diff} (positif berarti lewat anggaran).</p>
					</li>
				{/each}
			</ul>
		{/if}
		{#if data.canBudget}
			<form method="post" action="?/setBudget" class="mt-3 flex flex-col gap-3">
				<h3 class="text-sm font-semibold">Atur anggaran (MOD)</h3>
				<label class="flex flex-col gap-1 text-sm">
					Divisi
					<select name="divisionId" required class="min-h-11 border px-3 py-2">
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Kategori (opsional)
					<input name="category" maxlength="120" class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Nominal (Rp, nol boleh)
					<input name="amount" required inputmode="decimal" class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Catatan
					<input name="notes" maxlength="2000" class="min-h-11 border px-3 py-2" />
				</label>
				<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Simpan</button>
			</form>
		{/if}
	</section>

	<section class="mt-8">
		<h2 class="font-semibold">Ledger</h2>
		{#if data.transactions.length === 0}
			<p class="mt-2 text-sm">Belum ada transaksi.</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-2 text-sm">
				{#each data.transactions as t (t.id)}
					<li class="border px-3 py-2">
						<p class="font-semibold">
							{t.type === 'INCOME' ? 'Masuk' : 'Keluar'} Rp{Number(t.amount).toLocaleString(
								'id-ID'
							)} [{t.status}]
						</p>
						<p class="mt-1 text-xs">{t.date}{t.category ? ` (${t.category})` : ''}</p>
						{#if t.description}
							<p class="text-xs">{t.description}</p>
						{/if}
						{#if data.canWrite && t.status === 'ACTIVE'}
							<details class="mt-2 text-xs">
								<summary class="cursor-pointer underline">Koreksi atau batalkan</summary>
								<form method="post" action="?/correct" class="mt-2 flex flex-col gap-2">
									<input type="hidden" name="id" value={t.id} />
									<label class="flex flex-col gap-1">
										Nominal baru (Rp)
										<input
											name="amount"
											required
											inputmode="decimal"
											class="min-h-11 border px-2 py-2"
										/>
									</label>
									<label class="flex flex-col gap-1">
										Alasan koreksi
										<input
											name="reason"
											required
											minlength="3"
											maxlength="1000"
											class="min-h-11 border px-2 py-2"
										/>
									</label>
									<button type="submit" class="min-h-11 border px-3 py-2">Simpan koreksi</button>
								</form>
								<form method="post" action="?/void" class="mt-2 flex flex-col gap-2">
									<input type="hidden" name="id" value={t.id} />
									<label class="flex flex-col gap-1">
										Alasan pembatalan
										<input
											name="reason"
											required
											minlength="3"
											maxlength="1000"
											class="min-h-11 border px-2 py-2"
										/>
									</label>
									<button type="submit" class="min-h-11 border px-3 py-2">Batalkan</button>
								</form>
							</details>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if data.canWrite}
			<form method="post" action="?/create" class="mt-4 flex flex-col gap-3">
				<h3 class="text-sm font-semibold">Catat transaksi</h3>
				<label class="flex flex-col gap-1 text-sm">
					Jenis
					<select name="type" class="min-h-11 border px-3 py-2">
						<option value="EXPENSE">Pengeluaran</option>
						<option value="INCOME">Pemasukan</option>
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Nominal (Rp)
					<input name="amount" required inputmode="decimal" class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Tanggal
					<input name="date" type="date" class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Divisi terkait (opsional)
					<select name="divisionId" class="min-h-11 border px-3 py-2">
						<option value="">Kas event</option>
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Kategori
					<input name="category" maxlength="120" class="min-h-11 border px-3 py-2" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Deskripsi
					<textarea name="description" rows="2" maxlength="2000" class="border px-3 py-2"
					></textarea>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Tautan bukti (opsional)
					<input name="evidenceUrl" type="url" class="min-h-11 border px-3 py-2" />
				</label>
				<button type="submit" class="min-h-11 border px-4 py-2 font-semibold">Catat</button>
			</form>
		{/if}
	</section>
</main>
