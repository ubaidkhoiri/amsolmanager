// Label Indonesia dan tone badge untuk semua kode status enum.
// Satu sumber kebenaran (I-87): satu kata per konsep di seluruh produk.

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface StatusLabel {
	label: string;
	tone: BadgeTone;
}

function build<T extends string>(entries: Record<T, StatusLabel>): Record<T, StatusLabel> {
	return entries;
}

export const MEETING_STATUS = build({
	DRAFT: { label: 'Draf', tone: 'neutral' },
	SCHEDULED: { label: 'Terjadwal', tone: 'info' },
	IN_PROGRESS: { label: 'Berjalan', tone: 'info' },
	COMPLETED: { label: 'Selesai', tone: 'success' },
	ARCHIVED: { label: 'Arsip', tone: 'neutral' },
	CANCELLED: { label: 'Batal', tone: 'error' }
});

export const MEETING_TYPE: Record<string, string> = {
	PLENARY: 'Musyawarah besar',
	DIVISION: 'Diskusi divisi'
};

export const MINUTE_STATUS = build({
	OPEN: { label: 'Terbuka', tone: 'warning' },
	DONE: { label: 'Selesai', tone: 'success' }
});

export const DECISION_STATUS = build({
	DRAFT: { label: 'Draf', tone: 'neutral' },
	NEEDS_DISCUSSION: { label: 'Butuh bahas', tone: 'warning' },
	FINAL: { label: 'Final', tone: 'success' },
	SUPERSEDED: { label: 'Diganti', tone: 'neutral' }
});

export const TASK_STATUS = build({
	BACKLOG: { label: 'Backlog', tone: 'neutral' },
	TODO: { label: 'Siap kerja', tone: 'info' },
	IN_PROGRESS: { label: 'Berjalan', tone: 'info' },
	BLOCKED: { label: 'Tertahan', tone: 'error' },
	DONE: { label: 'Selesai', tone: 'success' },
	CANCELLED: { label: 'Batal', tone: 'error' }
});

export const TASK_PRIORITY = build({
	LOW: { label: 'Rendah', tone: 'neutral' },
	MEDIUM: { label: 'Sedang', tone: 'info' },
	HIGH: { label: 'Tinggi', tone: 'warning' },
	URGENT: { label: 'Mendesak', tone: 'error' }
});

export const SUPPORT_STATUS = build({
	SUBMITTED: { label: 'Diajukan', tone: 'info' },
	UNDER_REVIEW: { label: 'Ditinjau', tone: 'info' },
	NEEDS_INFORMATION: { label: 'Butuh info', tone: 'warning' },
	ACCEPTED: { label: 'Diterima', tone: 'success' },
	IN_PROGRESS: { label: 'Berjalan', tone: 'info' },
	COMPLETED: { label: 'Selesai', tone: 'success' },
	REJECTED: { label: 'Ditolak', tone: 'error' },
	CANCELLED: { label: 'Batal', tone: 'error' }
});

export const TIMELINE_STATUS = build({
	PLANNED: { label: 'Rencana', tone: 'neutral' },
	IN_PROGRESS: { label: 'Berjalan', tone: 'info' },
	DONE: { label: 'Selesai', tone: 'success' },
	CANCELLED: { label: 'Batal', tone: 'error' }
});

export const PUBLICATION_STATUS = build({
	IDEA: { label: 'Ide', tone: 'neutral' },
	DRAFT: { label: 'Draf', tone: 'neutral' },
	REVIEW: { label: 'Review', tone: 'warning' },
	APPROVED: { label: 'Disetujui', tone: 'success' },
	PUBLISHED: { label: 'Tayang', tone: 'success' },
	CANCELLED: { label: 'Batal', tone: 'error' }
});

export const TRANSACTION_TYPE: Record<string, StatusLabel> = {
	INCOME: { label: 'Masuk', tone: 'success' },
	EXPENSE: { label: 'Keluar', tone: 'warning' }
};

export const MEMBER_STATUS = build({
	ACTIVE: { label: 'Aktif', tone: 'success' },
	INACTIVE: { label: 'Nonaktif', tone: 'neutral' }
});

export const MEMBER_ROLE: Record<string, string> = {
	MOD: 'MOD',
	DIVISION_ADMIN: 'Admin divisi',
	COMMITTEE: 'Panitia'
};

export function lookup(map: Record<string, StatusLabel>, code: string): StatusLabel {
	return map[code] ?? { label: code, tone: 'neutral' };
}
