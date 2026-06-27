<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import Icon from '@iconify/svelte';
  import { siteConfig } from '$lib/config/site';
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} - {siteConfig.title}</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
  <Card.Root class="w-full max-w-md">
    <Card.Content class="pt-6">
      <div class="text-center space-y-6">
        <div class="flex justify-center">
          <div class="rounded-full bg-primary/10 p-6">
            <Icon icon="mdi:alert-circle-outline" class="w-16 h-16 text-primary" />
          </div>
        </div>

        <div class="space-y-2">
          <Card.Title class="text-3xl">{page.status}</Card.Title>
          <Card.Description class="text-lg">
            {page.error?.message || '页面未找到'}
          </Card.Description>
        </div>

        <div class="space-y-4">
          <a href="/">
            <Button class="w-full">
              <Icon icon="mdi:home" class="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </a>
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</div>
