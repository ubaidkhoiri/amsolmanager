<script lang="ts">
	import { lookup, type BadgeTone } from '../status-labels';

	let {
		map,
		code,
		label,
		tone: toneProp
	}: {
		map?: Record<string, { label: string; tone: BadgeTone }>;
		code?: string;
		label?: string;
		tone?: BadgeTone;
	} = $props();

	const resolved = $derived(
		label ? { label, tone: toneProp ?? 'neutral' } : lookup(map ?? {}, code ?? '')
	);
</script>

<span class="badge" data-tone={resolved.tone}>{resolved.label}</span>
