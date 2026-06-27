<script lang="ts">
  import Icon from '@iconify/svelte';
  import { themeMode, isDark, type ThemeMode } from '$lib/stores/theme';

  const modes: ThemeMode[] = ['light', 'dark', 'system'];

  function cycle() {
    themeMode.update((cur) => {
      const idx = modes.indexOf(cur);
      return modes[(idx + 1) % modes.length];
    });
  }

  const icon = $derived.by(() => {
    switch ($themeMode) {
      case 'light':
        return 'mdi:weather-sunny';
      case 'dark':
        return 'mdi:weather-night';
      case 'system':
        return 'mdi:monitor';
    }
  });

  const label = $derived.by(() => {
    switch ($themeMode) {
      case 'light':
        return '浅色模式';
      case 'dark':
        return '深色模式';
      case 'system':
        return '跟随系统';
    }
  });
</script>

<button
  onclick={cycle}
  class="inline-flex items-center justify-center rounded-md w-8 h-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
  aria-label={label}
  title={label}
>
  <Icon {icon} class="w-5 h-5" />
</button>
