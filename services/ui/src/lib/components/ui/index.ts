/**
 * shadcn-svelte UI Components
 *
 * A collection of accessible, customizable UI components built on
 * Tailwind CSS and Bits UI. Based on shadcn/ui patterns.
 *
 * @example
 * ```svelte
 * <script>
 *   import { Button, Card, CardHeader, CardTitle, Badge, Input } from '$lib/components/ui';
 * </script>
 *
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Hello World</CardTitle>
 *   </CardHeader>
 * </Card>
 * ```
 */

// Utilities
export { cn } from "./utils";

// Components
export * from "./button";
export * from "./card";
export * from "./badge";
export * from "./input";
