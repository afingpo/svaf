<script lang="ts">
  import { onMount } from 'svelte';
  import { type ForumUploadType, uploadFile } from '$lib/forum/api/auth';
  import { ForumApiError } from '$lib/forum/types/api';
  import { renderForumMarkdown } from '$lib/forum/utils/markdown';
  import {
    POST_IMAGE_MAX_BYTES,
    compressPostImage,
    isPostImageWithinLimit
  } from '$lib/forum/utils/image-compression';

  const MAX_UPLOAD_SIZE_LABEL = `${Math.round(POST_IMAGE_MAX_BYTES / 1024)}KB`;

  type EditorMode = 'post' | 'comment' | 'reply';

  interface Props {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    submitting?: boolean;
    mode?: EditorMode;
    uploadType?: Exclude<ForumUploadType, 'avatar'>;
    uploadPostId?: string;
    minHeight?: number;
    shellClass?: string;
    autoFocus?: boolean;
    onsubmit?: () => void;
    onescape?: () => void;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    placeholder = '支持 Markdown',
    disabled = false,
    submitting = false,
    mode = 'comment',
    uploadType,
    uploadPostId = '',
    minHeight = 220,
    shellClass = '',
    autoFocus = false,
    onsubmit,
    onescape,
    onchange
  }: Props = $props();

  let textareaEl: HTMLTextAreaElement | undefined = $state();
  let previewEl: HTMLDivElement | undefined = $state();
  let fileInputEl: HTMLInputElement | undefined = $state();
  let uploadStatus = $state('');
  let uploading = $state(false);

  function normalizeUploadError(error: unknown) {
    if (error instanceof ForumApiError && error.status === 401) {
      return '请先登录论坛后再上传图片。';
    }
    if (error instanceof Error && error.message) return error.message;
    return '图片上传失败，请稍后重试。';
  }

  function updatePreview() {
    if (!previewEl) return;
    previewEl.innerHTML = renderForumMarkdown(value);
    void (async () => {
      const { renderMermaidIn } = await import('$lib/utils/mermaid');
      const { highlightCodeBlocksIn } = await import('$lib/utils/highlight');
      await renderMermaidIn(previewEl);
      await highlightCodeBlocksIn(previewEl);
    })();
  }

  function insertAtCursor(text: string) {
    const ta = textareaEl;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    value = before + text + after;
    ta.value = value;
    const pos = start + text.length;
    ta.selectionStart = pos;
    ta.selectionEnd = pos;
    onchange?.(value);
    updatePreview();
  }

  async function uploadAndInsert(file: File) {
    if (!uploadType) {
      uploadStatus = '当前编辑器未启用图片上传。';
      return;
    }
    if (!file.type.startsWith('image/')) {
      uploadStatus = '仅支持上传图片文件。';
      return;
    }

    uploading = true;
    uploadStatus = '正在压缩图片...';
    let target: File = file;

    try {
      try {
        target = await compressPostImage(file);
      } catch {
        if (!isPostImageWithinLimit(file)) {
          throw new Error(`图片压缩失败，且原图仍超过 ${MAX_UPLOAD_SIZE_LABEL} 限制。`);
        }
        target = file;
      }

      if (!isPostImageWithinLimit(target)) {
        uploadStatus = `压缩后图片仍超过 ${MAX_UPLOAD_SIZE_LABEL}，请更换更小的图片。`;
        return;
      }

      uploadStatus = target === file ? '正在上传图片...' : '正在上传压缩后的图片...';
      const url = await uploadFile({
        file: target,
        type: uploadType,
        postId: uploadPostId || undefined
      });
      if (!url) throw new Error('上传成功，但未获取到图片地址。');
      insertAtCursor(`![${file.name}](${url})`);
      uploadStatus = '图片已上传并插入。';
    } catch (error) {
      uploadStatus = normalizeUploadError(error);
    } finally {
      uploading = false;
    }
  }

  function handleInput() {
    value = textareaEl!.value;
    onchange?.(value);
    updatePreview();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.isComposing) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onsubmit?.();
      return;
    }
    if (e.key === 'Escape') onescape?.();
  }

  function handlePaste(e: ClipboardEvent) {
    if (e.isComposing) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) void uploadAndInsert(file);
        return;
      }
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      void uploadAndInsert(file);
    }
  }

  function handleUploadClick() {
    fileInputEl?.click();
  }

  function handleFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    void uploadAndInsert(file);
    e.target && ((e.target as HTMLInputElement).value = '');
  }

  onMount(() => {
    if (autoFocus) textareaEl?.focus();
    if (value) updatePreview();
  });

  $effect(() => {
    if (textareaEl && value !== textareaEl.value) {
      textareaEl.value = value;
      updatePreview();
    }
  });
</script>

<div class={`forum-editor-shell ${shellClass}`.trim()}>
  <div class="editor-toolbar">
    <button
      class="upload-btn"
      onclick={handleUploadClick}
      disabled={disabled || submitting || uploading || !uploadType}
      title="上传图片"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
      上传图片
    </button>
    <input
      bind:this={fileInputEl}
      type="file"
      accept="image/*"
      onchange={handleFileChange}
      class="hidden"
    />
    <span class="ml-auto text-xs text-muted-foreground">Ctrl+V 粘贴图片 / 拖拽上传</span>
  </div>

  <div class="editor-body" style="min-height: {minHeight}px">
    <textarea
      bind:this={textareaEl}
      class="editor-textarea"
      class:is-disabled={disabled || submitting}
      placeholder={placeholder}
      oninput={handleInput}
      onkeydown={handleKeydown}
      onpaste={handlePaste}
      ondragover={handleDragOver}
      ondrop={handleDrop}
      disabled={disabled || submitting}
      spellcheck="true"
    ></textarea>
    <div class="editor-divider"></div>
    <div
      bind:this={previewEl}
      class="editor-preview prose prose-invert !max-w-none break-words text-white/75"
      class:is-empty={!value}
    >
      {#if !value}
        <span class="preview-placeholder">预览</span>
      {/if}
    </div>
  </div>

  {#if uploading || uploadStatus}
    <p class="upload-status">{uploadStatus}</p>
  {/if}
</div>

<style>
  .forum-editor-shell {
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--card);
    font-size: 0.9rem;
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: var(--muted);
    border-bottom: 1px solid var(--border);
  }

  .upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    font-size: 0.8125rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--background);
    color: var(--foreground);
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .upload-btn:hover:not(:disabled) {
    opacity: 0.8;
  }
  .upload-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .editor-body {
    display: flex;
    background: var(--background);
  }

  .editor-textarea {
    width: 50%;
    min-height: inherit;
    padding: 1rem 1.25rem;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: var(--foreground);
    font-family: 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace;
    font-size: 0.875rem;
    line-height: 1.6;
    tab-size: 2;
  }
  .editor-textarea::placeholder {
    color: var(--muted-foreground);
  }
  .editor-textarea.is-disabled {
    opacity: 0.65;
    pointer-events: none;
  }

  .editor-divider {
    width: 1px;
    background: var(--border);
    flex-shrink: 0;
  }

  .editor-preview {
    width: 50%;
    min-height: inherit;
    padding: 1rem 1.25rem;
    overflow-y: auto;
    font-size: 0.875rem;
    line-height: 1.6;
  }
  .editor-preview :global(pre) {
    overflow-x: auto;
  }
  .editor-preview.is-empty {
    display: flex;
    align-items: flex-start;
  }
  .preview-placeholder {
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }

  .upload-status {
    margin: 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
    border-top: 1px solid var(--border);
    background: var(--card);
  }

  .hidden {
    display: none;
  }
</style>
