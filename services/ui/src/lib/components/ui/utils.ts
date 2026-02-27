import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge.
 * Handles class conflicts and conditional classes.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Type helper for component variants using tailwind-variants.
 */
export type { VariantProps } from "tailwind-variants";
