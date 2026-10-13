import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const actor = event.locals.actor;
	if (!actor) redirect(307, '/access');
	return {
		actor: {
			name: actor.name,
			systemRole: actor.systemRole,
			divisionId: actor.divisionId
		}
	};
};
