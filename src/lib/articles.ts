import { getCollection, type CollectionEntry } from 'astro:content';

/** 仅接受第一版两种文章，避免目录或详情跨栏目读取。 */
export type ArticleCollection = 'learning' | 'game-notes';

/** 共享的文章字段类型来自内容集合校验结果。 */
export type Article = CollectionEntry<ArticleCollection>;

/**
 * 取得指定栏目的已发布文章，供目录和静态详情同时使用。
 * @param collection 文章归属栏目
 * @returns 按发布日期倒序排列的公开文章，无文章时返回空数组
 */
export async function getPublishedArticles<C extends ArticleCollection>(collection: C) {
  // 在进入目录和路由生成前统一过滤，防止隐藏草稿仍可通过直链访问。
  const articles = await getCollection(collection, (entry) => !entry.data.draft);
  // 同日文章按标识排序，确保不同构建环境下目录顺序一致。
  return articles.sort((a, b) =>
    b.data.published.getTime() - a.data.published.getTime() || (a.id < b.id ? -1 : Number(a.id > b.id)),
  );
}

/**
 * 将 Markdown 中的发布日期转成不受构建机时区影响的日历日期。
 * @param date 已经通过内容集合校验的日期
 * @returns 年-月-日格式，可同时用于页面展示和 time 元素
 */
export function articleDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
