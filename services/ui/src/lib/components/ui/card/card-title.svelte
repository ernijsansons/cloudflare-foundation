<script lang="ts">
	import { cn } from "../utils";

	let { class: className, children }: { class?: string; children?: import("svelte").Snippet } = $props();
</script>

<h3 class={cn("font-semibold leading-none tracking-tight", className)}>
	{@render children?.()}
</h3>
