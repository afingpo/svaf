import { getAllPosts } from '$lib/utils/posts';
import { resolvePostAssetPath } from '$lib/utils/markdown';
import type { PageLoad } from './$types';

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

export const load: PageLoad = () => {
  const posts = getAllPosts().map(post => ({
    ...post,
    metadata: {
      ...post.metadata,
      image: resolvePostAssetPath(post.slug, post.metadata.image)
    }
  }));

  let totalWords = 0;
  const wordCountMap: Record<string, number> = {};
  for (const [path, rawContent] of Object.entries(modules)) {
    if (typeof rawContent !== 'string') continue;
    const slug = path.split('/').slice(-2, -1)[0];
    const parts = rawContent.split('---');
    const content = parts.length >= 3 ? parts.slice(2).join('---').trim() : rawContent.trim();
    const wc = calculateWordCount(content);
    wordCountMap[slug] = wc;
    totalWords += wc;
  }

  return {
    posts,
    totalPosts: posts.length,
    totalWords,
    wordCountMap
  };
};
