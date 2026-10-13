export type SystemRole = 'MOD' | 'DIVISION_ADMIN' | 'COMMITTEE';

export interface Actor {
	memberId: string;
	eventId: string;
	divisionId: string | null;
	systemRole: SystemRole;
	name: string;
}

export function canManageMembers(actor: Actor): boolean {
	return actor.systemRole === 'MOD';
}

export function hasDivisionScope(actor: Actor, divisionId: string): boolean {
	if (actor.systemRole === 'MOD') return true;
	return actor.divisionId !== null && actor.divisionId === divisionId;
}

export interface MeetingScope {
	divisionId: string | null;
}

// MOD manages all meetings. Division admins manage meetings inside their own
// division. Plenary meetings carry no division, so only MOD writes them.
export function canManageMeeting(actor: Actor, meeting: MeetingScope): boolean {
	if (actor.systemRole === 'MOD') return true;
	if (actor.systemRole !== 'DIVISION_ADMIN') return false;
	return meeting.divisionId !== null && meeting.divisionId === actor.divisionId;
}

export function canManageMinutes(actor: Actor, meeting: MeetingScope): boolean {
	return canManageMeeting(actor, meeting);
}

export interface DecisionScope {
	divisionId: string | null;
	status: string;
}

// Only MOD finalizes. Admins may edit drafts in scope to propose corrections.
// FINAL rows are immutable in place; revisions create a superseding row.
export function canEditDecision(actor: Actor, decision: DecisionScope): boolean {
	if (actor.systemRole === 'MOD') return true;
	if (decision.status === 'FINAL' || decision.status === 'SUPERSEDED') return false;
	if (actor.systemRole !== 'DIVISION_ADMIN') return false;
	if (decision.divisionId === null) return true;
	return decision.divisionId === actor.divisionId;
}

export function canFinalizeDecision(actor: Actor): boolean {
	return actor.systemRole === 'MOD';
}

export interface TaskScope {
	divisionId: string;
	assignedTo: string | null;
}

// MOD manages all tasks. Admins manage their division. Committee members
// manage only tasks assigned to them.
export function canManageTask(actor: Actor, task: TaskScope): boolean {
	if (actor.systemRole === 'MOD') return true;
	if (actor.systemRole === 'DIVISION_ADMIN') return task.divisionId === actor.divisionId;
	return task.assignedTo !== null && task.assignedTo === actor.memberId;
}

export interface SupportScope {
	requestingDivisionId: string;
	targetDivisionId: string;
	requestedBy: string;
	status: string;
}

function supportSide(actor: Actor, request: SupportScope): 'requester' | 'target' | 'both' | null {
	if (actor.systemRole === 'MOD') return 'both';
	if (actor.systemRole !== 'DIVISION_ADMIN' || actor.divisionId === null) return null;
	const isRequester = actor.divisionId === request.requestingDivisionId;
	const isTarget = actor.divisionId === request.targetDivisionId;
	if (isRequester && isTarget) return 'both';
	if (isTarget) return 'target';
	if (isRequester) return 'requester';
	return null;
}

// MOD acts on any request. Admins act inside their division, either side.
// Committee members only touch requests they filed themselves.
export function canAdvanceSupport(actor: Actor, request: SupportScope, to: string): boolean {
	if (actor.systemRole === 'COMMITTEE' && actor.memberId !== request.requestedBy) return false;
	const rawSide = supportSide(actor, request);
	// Committee filers act as requester side on their own request.
	const side = actor.systemRole === 'COMMITTEE' ? 'requester' : rawSide;
	if (side === null) return false;
	switch (to) {
		case 'UNDER_REVIEW':
			// Target picks it up, or requester resubmits after adding info.
			return side === 'target' || side === 'both' || actor.memberId === request.requestedBy;
		case 'ACCEPTED':
		case 'NEEDS_INFORMATION':
		case 'REJECTED':
		case 'IN_PROGRESS':
		case 'COMPLETED':
			return side === 'target' || side === 'both';
		case 'CANCELLED':
			return true;
		default:
			return false;
	}
}

export interface TimelineScope {
	divisionId: string | null;
}

export function canManageTimeline(actor: Actor, item: TimelineScope): boolean {
	if (actor.systemRole === 'MOD') return true;
	if (actor.systemRole !== 'DIVISION_ADMIN' || actor.divisionId === null) return false;
	return item.divisionId !== null && item.divisionId === actor.divisionId;
}

export interface PublicationScope {
	divisionId: string;
	designOwnerId: string | null;
	copyOwnerId: string | null;
}

// MOD and the owning division admin drive the whole flow. Assigned owners
// move their own content up to review, approval stays with the authorized.
export function canAdvancePublication(actor: Actor, pub: PublicationScope, to: string): boolean {
	if (actor.systemRole === 'MOD') return true;
	const isAdmin =
		actor.systemRole === 'DIVISION_ADMIN' &&
		actor.divisionId !== null &&
		actor.divisionId === pub.divisionId;
	const isOwner = actor.memberId === pub.designOwnerId || actor.memberId === pub.copyOwnerId;
	switch (to) {
		case 'DRAFT':
		case 'REVIEW':
			return isAdmin || isOwner;
		case 'APPROVED':
		case 'PUBLISHED':
		case 'CANCELLED':
			return isAdmin;
		default:
			return false;
	}
}
