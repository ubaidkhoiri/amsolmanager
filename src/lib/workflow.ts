// Status transition rules for Sprint 2 entities (PRD FR-03, FR-04, FR-05).
// Framework-free so unit tests cover them without SvelteKit.

export const MEETING_TRANSITIONS: Record<string, string[]> = {
	DRAFT: ['SCHEDULED', 'CANCELLED'],
	SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
	IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
	COMPLETED: ['ARCHIVED'],
	ARCHIVED: [],
	CANCELLED: []
};

// FINAL decisions never change status in place. A revision creates a new
// row with supersedesDecisionId and marks the old one SUPERSEDED.
export const DECISION_TRANSITIONS: Record<string, string[]> = {
	DRAFT: ['NEEDS_DISCUSSION', 'FINAL'],
	NEEDS_DISCUSSION: ['DRAFT', 'FINAL'],
	FINAL: [],
	SUPERSEDED: []
};

export const TASK_TRANSITIONS: Record<string, string[]> = {
	BACKLOG: ['TODO', 'CANCELLED'],
	TODO: ['IN_PROGRESS', 'CANCELLED'],
	IN_PROGRESS: ['BLOCKED', 'DONE', 'CANCELLED'],
	BLOCKED: ['IN_PROGRESS', 'CANCELLED'],
	DONE: [],
	CANCELLED: []
};

export function canTransition(
	transitions: Record<string, string[]>,
	from: string,
	to: string
): boolean {
	return (transitions[from] ?? []).includes(to);
}

// Planning tasks (BACKLOG) may lack PIC and deadline. Anything past planning must have both.
export function taskRequiresAssigneeAndDue(status: string): boolean {
	return status !== 'BACKLOG';
}

// Overdue is derived from date plus status, never stored. DONE/CANCELLED are never overdue.
export function isTaskOverdue(dueAt: Date | null, status: string, now: Date = new Date()): boolean {
	if (!dueAt || status === 'DONE' || status === 'CANCELLED') return false;
	return dueAt.getTime() < now.getTime();
}
