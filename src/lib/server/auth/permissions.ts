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
