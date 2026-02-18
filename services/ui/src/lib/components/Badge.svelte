<script lang="ts">
  interface Props {
    count?: number;
    text?: string;
    variant?: "default" | "success" | "warning" | "error" | "info";
    size?: "sm" | "md";
  }

  let { count, text, variant = "default", size = "md" }: Props = $props();
</script>

<span class="badge {variant} {size}">
  {#if count !== undefined}
    {count}
  {:else if text}
    {text}
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    border-radius: 9999px;
  }

  .md {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    min-width: 1.5rem;
  }

  .sm {
    padding: 0.0625rem 0.375rem;
    font-size: 0.625rem;
    min-width: 1.25rem;
  }

  .default {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }

  .success {
    background: color-mix(in srgb, var(--color-success) 15%, transparent);
    color: var(--color-success);
  }

  .warning {
    background: color-mix(in srgb, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
  }

  .error {
    background: color-mix(in srgb, var(--color-error) 15%, transparent);
    color: var(--color-error);
  }

  .info {
    background: color-mix(in srgb, var(--color-info) 15%, transparent);
    color: var(--color-info);
  }
</style>
