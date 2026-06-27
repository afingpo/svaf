<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';
  import Content, { metadata as rawMetadata } from '../../content/announcement/index.md';

  const metadata = (rawMetadata ?? {}) as {
    enable?: boolean;
    level?: 'info' | 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'happy';
  };

  const colorMap: Record<string, string> = {
    info: '#0969da',
    note: '#0969da',
    tip: '#1a7f37',
    happy: 'transparent',
    caution: '#cf222e',
    warning: '#9a6700',
    important: '#8250df'
  };

  const enable = metadata.enable ?? false;
  const level = metadata.level ?? 'info';
  const isHappy = level === 'happy';
  const currentColor = colorMap[level] || colorMap.info;
</script>

{#if enable}
  <div class="flex w-full justify-center">
    <Card
      class={`w-full max-w-2xl border-0 ring-0 ${isHappy ? 'announcement-happy' : ''}`}
      style={isHappy ? '' : `border-color: ${currentColor};`}
    >
      <CardContent class="text-center">
        <div
          class="announcement-text prose prose-neutral dark:prose-invert max-w-none text-sm md:text-base
            prose-headings:text-foreground prose-headings:my-0
            prose-p:text-foreground prose-p:my-0
            prose-strong:text-foreground
            prose-a:text-primary prose-a:underline prose-a:underline-offset-4 prose-a:transition-opacity prose-a:hover:opacity-80
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:my-0
            prose-code:bg-muted prose-code:text-foreground prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-foreground prose-pre:my-0
            prose-hr:border-border
            prose-ul:my-0 prose-ol:my-0 prose-li:my-0
            prose-img:rounded-lg prose-img:my-0"
          style={isHappy ? '' : `color: ${currentColor};`}
        >
          <Content />
        </div>
      </CardContent>
    </Card>
  </div>
{/if}

<style>
  @keyframes rainbow-flow {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 200% 50%;
    }
  }

  :global(.announcement-happy) {
    --notice-gradient: linear-gradient(
      90deg,
      oklch(0.78 0.18 0),
      oklch(0.78 0.18 45),
      oklch(0.78 0.18 90),
      oklch(0.78 0.18 135),
      oklch(0.78 0.18 180),
      oklch(0.78 0.18 225),
      oklch(0.78 0.18 270),
      oklch(0.78 0.18 315),
      oklch(0.78 0.18 360)
    );
    border: 2px solid transparent !important;
    background:
      linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box,
      var(--notice-gradient) border-box !important;
    background-size:
      100% 100%,
      200% 100% !important;
    animation: rainbow-flow 3s linear infinite;
  }

  .announcement-happy .announcement-text {
    background: var(--notice-gradient);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: rainbow-flow 3s linear infinite;
  }

  .announcement-text :global(p) {
    margin: 0;
  }

  :global(.announcement-happy) .announcement-text :global(*) {
    background: var(--notice-gradient);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: rainbow-flow 3s linear infinite;
  }
</style>
