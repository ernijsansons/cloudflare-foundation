<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
		variants: {
			variant: {
				default:
					"border-transparent bg-[var(--color-primary)] text-white shadow hover:bg-[var(--color-primary-hover)]",
				secondary:
					"border-transparent bg-[var(--color-bg-secondary)] text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]",
				destructive:
					"border-transparent bg-[var(--color-error)] text-white shadow hover:bg-[var(--color-error)]/80",
				outline: "text-[var(--color-text)] border-[var(--color-border)]",
				success:
					"border-transparent bg-[var(--color-success)] text-white shadow",
				warning:
					"border-transparent bg-[var(--color-warning)] text-white shadow",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

	export interface BadgeProps {
		variant?: BadgeVariant;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from "../utils";

let {
		variant = "default",
		class: className,
		children
	}: BadgeProps & { children?: import("svelte").Snippet } = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)}>
	{@render children?.()}
</div>
