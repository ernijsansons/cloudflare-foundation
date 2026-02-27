<script lang="ts">
	import { cn } from "../utils";

	let { class: className, children }: { class?: string; children?: import("svelte").Snippet } = $props();
</script>

<p class={cn("text-sm text-[var(--color-text-muted)]", className)}>
	{@render children?.()}
</p>
