// Status transition rules for Sprint 2 and 3 entities (PRD FR-03 through FR-06).
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

// A request becomes real work only after the target division accepts it.
// NEEDS_INFORMATION bounces back to the requester, who resubmits to review.
export const SUPPORT_TRANSITIONS: Record<string, string[]> = {
	SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
	UNDER_REVIEW: ['ACCEPTED', 'NEEDS_INFORMATION', 'REJECTED', 'CANCELLED'],
	NEEDS_INFORMATION: ['UNDER_REVIEW', 'CANCELLED'],
	ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
	IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
	COMPLETED: [],
	REJECTED: [],
	CANCELLED: []
};

// Planning tasks (BACKLOG) may lack PIC and deadline. Anything past planning must have both.
export function taskRequiresAssigneeAndDue(status: string): boolean {
	return status !== 'BACKLOG';
}

// Overdue is derived from date plus status, never stored. DONE/CANCELLED are never overdue.
export function isTaskOverdue(dueAt: Date | null, status: string, now: Date = new Date()): boolean {
	if (!dueAt || status === 'DONE' || status === 'CANCELLED') return false;
	return dueAt.getTime() < now.getTime();
}
