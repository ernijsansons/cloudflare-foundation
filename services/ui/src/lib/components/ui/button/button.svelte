<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
		variants: {
			variant: {
				default:
					"bg-[var(--color-primary)] text-white shadow hover:bg-[var(--color-primary-hover)]",
				destructive:
					"bg-[var(--color-error)] text-white shadow-sm hover:bg-[var(--color-error)]/90",
				outline:
					"border border-[var(--color-border)] bg-transparent shadow-sm hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]",
				secondary:
					"bg-[var(--color-bg-secondary)] text-[var(--color-text)] shadow-sm hover:bg-[var(--color-bg-tertiary)]",
				ghost: "hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]",
				link: "text-[var(--color-primary)] underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-10 rounded-md px-8",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export interface ButtonProps {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		disabled?: boolean;
		type?: "button" | "submit" | "reset";
	}
</script>

<script lang="ts">
	import { cn } from "../utils";

	let {
		variant = "default",
		size = "default",
		class: className,
		disabled = false,
		type = "button",
		children
	}: ButtonProps & { children?: import("svelte").Snippet } = $props();
</script>

<button
	{type}
	{disabled}
	class={cn(buttonVariants({ variant, size }), className)}
>
	{@render children?.()}
</button>
