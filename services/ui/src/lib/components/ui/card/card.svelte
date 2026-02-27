<script lang="ts">
	import { cn } from "../utils";

	let { class: className, children }: { class?: string; children?: import("svelte").Snippet } = $props();
</script>

<div
	class={cn(
		"rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm",
		className
	)}
>
	{@render children?.()}
</div>
