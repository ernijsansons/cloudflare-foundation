<script lang="ts">
  import { page } from "$app/stores";
</script>
<h1>Dashboard</h1>
<p>Tenant: {$page.data.tenantId ?? "—"}</p>
