<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardContent } from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';

  let files = $state<{ name: string; src: string; convertedUrl: string | null; done: boolean }[]>([]);
  let targetFormat = $state('image/png');
  let converting = $state(false);
  let currentIndex = $state(0);
  let totalCount = $state(0);

  const FORMATS = [
    { mime: 'image/png', ext: 'png', label: 'PNG' },
    { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG' },
    { mime: 'image/webp', ext: 'webp', label: 'WebP' },
    { mime: 'image/bmp', ext: 'bmp', label: 'BMP' },
    { mime: 'image/avif', ext: 'avif', label: 'AVIF' },
  ];

  function handleFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const itemList: { name: string; src: string; convertedUrl: null; done: false }[] = [];
    let loaded = 0;
    const total = input.files.length;
    for (const f of input.files) {
      const name = f.name.replace(/\.[^.]+$/, '');
      const item = { name, src: '', convertedUrl: null, done: false };
      itemList.push(item);
      const reader = new FileReader();
      reader.onload = () => {
        item.src = reader.result as string;
        loaded++;
        if (loaded === total) files = [...files, ...itemList];
      };
      reader.readAsDataURL(f);
    }
    input.value = '';
  }

  function getFormatLabel(mime: string): string {
    return FORMATS.find(f => f.mime === mime)?.label || mime;
  }

  function convertAll() {
    const pending = files.filter(f => !f.done);
    if (!pending.length) return;
    converting = true;
    totalCount = pending.length;
    currentIndex = 0;
    processNext(pending);
  }

  function processNext(pending: typeof files) {
    if (currentIndex >= pending.length) { converting = false; return; }
    const item = pending[currentIndex];
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const mime = targetFormat;
      const quality = mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/avif' ? 0.92 : undefined;

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          item.convertedUrl = url;
          item.done = true;
          const ext = FORMATS.find(f => f.mime === targetFormat)?.ext || 'png';
          const a = document.createElement('a');
          a.href = url;
          a.download = `${item.name}.${ext}`;
          a.click();
        }
        files = [...files];
        currentIndex++;
        setTimeout(() => processNext(pending), 100);
      }, mime, quality);
    };
    img.src = item.src;
  }
</script>

<div class="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
  <div class="flex items-center gap-2">
    <Icon icon="mdi:swap-horizontal-bold" class="size-6 text-primary" />
    <h1 class="text-xl font-bold">图片转换</h1>
  </div>

  <Card>
    <CardContent class="space-y-4 pt-6">
      <div class="space-y-1.5">
        <Label class="text-xs">选择图片</Label>
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/bmp,image/avif,image/x-icon"
          onchange={handleFile}
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:cursor-pointer"
        />
      </div>

      <div class="space-y-1.5">
        <Label class="text-xs">目标格式</Label>
        <Select.Root type="single" bind:value={targetFormat}>
          <Select.Trigger class="w-full">
            {getFormatLabel(targetFormat)}
          </Select.Trigger>
          <Select.Content>
            {#each FORMATS as fmt}
              <Select.Item value={fmt.mime} label={fmt.label} />
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <Button class="w-full" onclick={convertAll} disabled={!files.length || converting}>
        <Icon icon={converting ? "mdi:loading" : "mdi:swap-horizontal-bold"} class="size-4 mr-1 {converting ? 'animate-spin' : ''}" />
        {converting ? `转换中 ${currentIndex}/${totalCount}` : `转换 ${files.length} 个文件为 ${getFormatLabel(targetFormat)}`}
      </Button>
    </CardContent>
  </Card>

  {#if files.length > 0}
    <Card>
      <CardContent class="pt-4 space-y-2">
        <p class="text-xs text-muted-foreground">已选择 {files.length} 个文件，{files.filter(f => f.done).length} 个已完成</p>
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {#each files as f}
            <div class="relative rounded-md overflow-hidden border {f.done ? 'ring-2 ring-green-500' : ''}">
              <img src={f.src} alt={f.name} class="w-full aspect-square object-cover" loading="lazy" />
              <div class="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">{f.name}</div>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
