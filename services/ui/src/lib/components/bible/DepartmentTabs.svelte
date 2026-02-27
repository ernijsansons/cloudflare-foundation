<script lang="ts">
  import type { DepartmentView, DepartmentId } from "$lib/types/bible";
  import { getDepartmentIcon, getDepartmentColor } from "$lib/types/bible";

  interface Props {
    departments: DepartmentView[];
    selected: DepartmentId;
    onSelect: (dept: DepartmentId) => void;
  }

  let { departments, selected, onSelect }: Props = $props();
</script>

<div class="department-tabs">
  {#each departments as dept}
    <button
      class="tab"
      class:active={selected === dept.id}
      type="button"
      onclick={() => onSelect(dept.id)}
    >
      <span class="tab-icon">{getDepartmentIcon(dept.id)}</span>
      <span class="tab-label">{dept.title}</span>
      <span class="tab-completeness {getDepartmentColor(dept.id)}">{dept.completeness}%</span>
    </button>
  {/each}
</div>

<style>
  .department-tabs {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab:hover {
    background: var(--color-bg-tertiary);
  }

  .tab.active {
    background: var(--color-bg-primary);
    border-color: var(--color-primary);
  }

  .tab-icon {
    font-size: 1.25rem;
  }

  .tab-label {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .tab.active .tab-label {
    font-weight: 600;
    color: var(--color-primary);
  }

  .tab-completeness {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }

  @media (max-width: 1024px) {
    .department-tabs {
      flex-direction: row;
      overflow-x: auto;
    }

    .tab {
      flex-shrink: 0;
    }
  }
</style>
