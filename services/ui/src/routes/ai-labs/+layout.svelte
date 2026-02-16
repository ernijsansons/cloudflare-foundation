<script lang="ts">
  import SubNav from "$lib/components/SubNav.svelte";

  const tabs = [
    { href: "/ai-labs/idea", label: "Ideas" },
    { href: "/ai-labs/research", label: "Research" },
    { href: "/ai-labs/production", label: "Production" },
  ];
</script>

<SubNav {tabs} />
<slot />
