<script lang="ts" module>
	export interface InputProps {
		type?: string;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		class?: string;
		id?: string;
		name?: string;
	}
</script>

<script lang="ts">
	import { cn } from "../utils";

	let {
		type = "text",
		value = $bindable(""),
		placeholder,
		disabled = false,
		readonly = false,
		class: className,
		id,
		name
	}: InputProps = $props();
</script>

<input
	{type}
	{id}
	{name}
	{placeholder}
	{disabled}
	{readonly}
	bind:value
	class={cn(
		"flex h-9 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
		"file:border-0 file:bg-transparent file:text-sm file:font-medium",
		"placeholder:text-[var(--color-text-subtle)]",
		"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]",
		"disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
/>
