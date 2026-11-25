import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

/** 两种文章共用的元数据；各自维护目录，游玩感想不绑定游戏。 */
const articleSchema = z.object({
  title: z.string().trim().min(1),
  published: z.coerce.date(),
  description: z.string().trim().optional(),
  draft: z.boolean().default(false),
});

/** 注册两个独立的内容集合，各自从对应 Markdown 目录装载。 */
export const collections = {
  learning: defineCollection({
    loader: glob({ base: './src/content/learning', pattern: '**/*.md' }),
    schema: articleSchema,
  }),
  'game-notes': defineCollection({
    loader: glob({ base: './src/content/game-notes', pattern: '**/*.md' }),
    schema: articleSchema,
  }),
};
