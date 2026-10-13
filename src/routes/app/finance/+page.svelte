<script lang="ts">
	import StatusBadge from '../../../lib/components/StatusBadge.svelte';
	import { TRANSACTION_TYPE } from '../../../lib/status-labels';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main class="page">
	<h1 class="page-title">Keuangan</h1>

	{#if form?.error}
		<p role="alert" class="form-error mt-4">{form.error}</p>
	{/if}
	{#if form?.success}
		<p role="status" class="meta mt-4">{form.success}</p>
	{/if}

	<section aria-label="Ringkasan">
		<ul class="list-plain mt-4">
			<li class="card">
				<p class="meta">Masuk</p>
				<p class="numeral font-semibold">{data.income}</p>
			</li>
			<li class="card">
				<p class="meta">Keluar</p>
				<p class="numeral font-semibold">{data.expense}</p>
			</li>
			<li class="card">
				<p class="meta">Saldo</p>
				<p class="numeral font-semibold">{data.balance}</p>
			</li>
		</ul>
	</section>

	<section aria-labelledby="anggaran">
		<h2 id="anggaran" class="section-title">Anggaran per divisi</h2>
		{#if data.budgets.length === 0}
			<div class="empty">
				<p>Belum ada anggaran.</p>
				<p class="meta">Anggaran tiap divisi muncul di sini setelah diatur.</p>
			</div>
		{:else}
			<ul class="list-plain">
				{#each data.budgets as b (b.id)}
					<li class="card">
						<p class="font-semibold">{b.division}{b.category ? ` (${b.category})` : ''}</p>
						<p class="meta mt-1">
							Rencana <span class="numeral">{b.planned}</span>, realisasi
							<span class="numeral">{b.realized}</span>, sisa
							<span class="numeral">{b.remaining}</span> ({b.percent})
						</p>
						<p class="meta">
							Selisih <span class="numeral">{b.diff}</span> (positif berarti lewat anggaran).
						</p>
					</li>
				{/each}
			</ul>
		{/if}
		{#if data.canBudget}
			<form method="post" action="?/setBudget" class="mt-3 flex flex-col gap-3">
				<h3 class="font-semibold">Atur anggaran (MOD)</h3>
				<p class="hint">Tanda * berarti wajib diisi.</p>
				<label class="field">
					Divisi <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<select name="divisionId" required class="input">
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Kategori (opsional)
					<input name="category" maxlength="120" class="input" />
				</label>
				<label class="field">
					Nominal (Rp, nol boleh) <span aria-hidden="true">*</span><span class="sr-only"
						>(wajib)</span
					>
					<input name="amount" required inputmode="decimal" class="input" />
				</label>
				<label class="field">
					Catatan (opsional)
					<input name="notes" maxlength="2000" class="input" />
				</label>
				<div class="btn-row">
					<button type="submit" class="btn btn-primary">Simpan anggaran</button>
				</div>
			</form>
		{/if}
	</section>

	<section aria-labelledby="ledger">
		<h2 id="ledger" class="section-title">Ledger</h2>
		{#if data.transactions.length === 0}
			<div class="empty">
				<p>Belum ada transaksi.</p>
				<p class="meta">Transaksi tercatat muncul di sini.</p>
			</div>
		{:else}
			<ul class="list-plain">
				{#each data.transactions as t (t.id)}
					<li class="card">
						<p class="font-semibold">
							<span class="numeral">Rp{Number(t.amount).toLocaleString('id-ID')}</span>
						</p>
						<p class="meta mt-1">{t.date}{t.category ? ` (${t.category})` : ''}</p>
						<p class="mt-1 flex flex-wrap gap-1">
							<StatusBadge map={TRANSACTION_TYPE} code={t.type} />
							<StatusBadge
								label={t.status === 'ACTIVE' ? 'Aktif' : 'Batal'}
								tone={t.status === 'ACTIVE' ? 'neutral' : 'error'}
							/>
						</p>
						{#if t.description}
							<p class="mt-1">{t.description}</p>
						{/if}
						{#if data.canWrite && t.status === 'ACTIVE'}
							<details class="mt-2">
								<summary class="cursor-pointer underline">Koreksi atau batalkan</summary>
								<form method="post" action="?/correct" class="mt-2 flex flex-col gap-2">
									<input type="hidden" name="id" value={t.id} />
									<label class="field">
										Nominal baru (Rp) <span aria-hidden="true">*</span><span class="sr-only"
											>(wajib)</span
										>
										<input name="amount" required inputmode="decimal" class="input" />
									</label>
									<label class="field">
										Alasan koreksi <span aria-hidden="true">*</span><span class="sr-only"
											>(wajib)</span
										>
										<input name="reason" required minlength="3" maxlength="1000" class="input" />
									</label>
									<div class="btn-row">
										<button type="submit" class="btn btn-secondary">Simpan koreksi</button>
									</div>
								</form>
								<form method="post" action="?/void" class="mt-2 flex flex-col gap-2">
									<input type="hidden" name="id" value={t.id} />
									<label class="field">
										Alasan pembatalan <span aria-hidden="true">*</span><span class="sr-only"
											>(wajib)</span
										>
										<input name="reason" required minlength="3" maxlength="1000" class="input" />
									</label>
									<div class="btn-row">
										<button type="submit" class="btn btn-tertiary">Batalkan transaksi</button>
									</div>
								</form>
							</details>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if data.canWrite}
			<form method="post" action="?/create" class="mt-4 flex flex-col gap-3">
				<h3 class="font-semibold">Catat transaksi</h3>
				<p class="hint">Tanda * berarti wajib diisi.</p>
				<label class="field">
					Jenis <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<select name="type" class="input">
						<option value="EXPENSE">Pengeluaran</option>
						<option value="INCOME">Pemasukan</option>
					</select>
				</label>
				<label class="field">
					Nominal (Rp) <span aria-hidden="true">*</span><span class="sr-only">(wajib)</span>
					<input name="amount" required inputmode="decimal" class="input" />
				</label>
				<label class="field">
					Tanggal (opsional, kosongkan untuk hari ini)
					<input name="date" type="date" class="input" />
				</label>
				<label class="field">
					Divisi terkait (opsional)
					<select name="divisionId" class="input">
						<option value="">Kas event</option>
						{#each data.divisions as d (d.id)}
							<option value={d.id}>{d.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					Kategori (opsional)
					<input name="category" maxlength="120" class="input" />
				</label>
				<label class="field">
					Deskripsi (opsional)
					<textarea name="description" rows="2" maxlength="2000" class="input"></textarea>
				</label>
				<label class="field">
					Tautan bukti (opsional)
					<input name="evidenceUrl" type="url" class="input" />
				</label>
				<div class="btn-row">
					<button type="submit" class="btn btn-primary">Catat transaksi</button>
				</div>
			</form>
		{/if}
	</section>
</main>
