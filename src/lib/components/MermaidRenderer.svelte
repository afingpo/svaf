<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { renderMermaidIn, rerenderAllMermaid } from '$lib/utils/mermaid';
  import { isDark } from '$lib/stores/theme';

  let { selector = '.prose' }: { selector?: string } = $props();

  onMount(async () => {
    await tick();
    const container = document.querySelector(selector) as HTMLElement | null;
    renderMermaidIn(container);

    const unsub = isDark.subscribe((dark) => {
      console.log(`[mermaid] isDark.subscribe fired, dark=${dark}`);
      rerenderAllMermaid();
    });
    return unsub;
  });
</script>
