/**
 * 将原生媒体时间格式化为易读的分:秒。
 * @param seconds 媒体秒数；未加载或无有效时长时按零显示
 * @returns 播放器上的时间文本
 */
export function formatTime(seconds: number): string {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}

/**
 * 计算前后切歌的循环位置。
 * @param index 已选中的歌曲
 * @param delta -1 表示上一首，1 表示下一首
 * @param count 歌单长度，空歌单或未选择时不能切歌
 * @returns 目标位置；不可切歌时保留当前索引
 */
export function adjacentTrack(index: number, delta: -1 | 1, count: number): number {
  return index < 0 || count < 2 ? index : (index + delta + count) % count;
}
