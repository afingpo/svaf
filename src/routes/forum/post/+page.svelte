<script module lang="ts">
  export const prerender = false;
</script>

<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    const id = $page.url.searchParams.get('id');
    if (id) goto(`/forum/post/${encodeURIComponent(id)}`, { replaceState: true });
    else goto('/forum', { replaceState: true });
  });
</script>
