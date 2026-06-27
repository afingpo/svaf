import type { ServerLoad } from './$types';

// 构建时预加载所有文章原始内容
const modules = import.meta.glob('/src/content/posts/**/index.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

function calculateWordCount(text: string): number {
  const plainText = text.replace(/<[^>]*>/g, '');
  const chineseChars = plainText.match(/[一-龥]/g) || [];
  const englishWords = plainText.match(/[a-zA-Z]+/g) || [];
  return chineseChars.length + englishWords.length;
}

export const load: ServerLoad = () => {
  let totalPosts = 0;
  let totalWords = 0;

  for (const [, rawContent] of Object.entries(modules)) {
    if (typeof rawContent !== 'string') continue;
    // 移除 frontmatter
    const parts = rawContent.split('---');
    const content = parts.length >= 3 ? parts.slice(2).join('---').trim() : rawContent.trim();
    totalPosts++;
    totalWords += calculateWordCount(content);
  }

  return { totalPosts, totalWords };
};
