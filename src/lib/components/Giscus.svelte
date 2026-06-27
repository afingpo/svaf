<script lang="ts">
  import { onMount } from 'svelte';
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
  import Icon from '@iconify/svelte';
  import { isDark } from '$lib/stores/theme';
  import { siteConfig } from '$lib/config/site';

  let loaded = $state(false);

  const STORAGE_KEY = 'cookie-consent-preferences';
  const CONSENT_VERSION = '2.0';

  function checkExistingConsent(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === CONSENT_VERSION && data.preferences?.functional) {
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to read cookie preferences:', e);
    }
    return false;
  }

  onMount(() => {
    // 首次挂载时检查已存在的 consent
    if (checkExistingConsent()) {
      loadGiscus();
      loaded = true;
    }

    // 监听 Cookie Consent 更新事件
    const handleConsentUpdate = (e: CustomEvent) => {
      const preferences = e.detail;
      if (preferences.functional && !loaded) {
        loadGiscus();
        loaded = true;
      }
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate as EventListener);

    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate as EventListener);
    };
  });

  // Listen for theme changes and update giscus
  $effect(() => {
    const dark = $isDark;
    const frame = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (frame?.contentWindow) {
      frame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: dark ? 'dark_protanopia' : 'light_protanopia' } } },
        'https://giscus.app'
      );
    }
  });

  function loadGiscus() {
    const dark = document.documentElement.classList.contains('dark');
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', siteConfig.giscus.repo);
    script.setAttribute('data-repo-id', siteConfig.giscus.repoId);
    script.setAttribute('data-category', siteConfig.giscus.category);
    script.setAttribute('data-category-id', siteConfig.giscus.categoryId);
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', dark ? 'dark_protanopia' : 'light_protanopia');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    const container = document.getElementById('giscus-container');
    if (container) {
      container.appendChild(script);
    }
  }
</script>

<div id="giscus-container" class="mt-12">
  {#if !loaded}
    <Alert>
      <Icon icon="mdi:information-outline" />
      <AlertTitle>评论功能需要启用功能性 Cookie</AlertTitle>
      <AlertDescription>
        请在 <a href="#" id="open_preferences_center" class="text-primary underline">Cookie 设置</a> 中启用
      </AlertDescription>
    </Alert>
  {/if}
</div>