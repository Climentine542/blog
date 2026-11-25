import { mkdir, writeFile } from 'node:fs/promises';
import { demoTracks, makeDemoWav } from './demo-audio.ts';

/**
 * 重新生成自制示例音频。只覆盖两个固定示例文件，不读取或修改正式歌单。
 * @returns 所有示例文件写入完成后结束
 */
async function generateDemoAudio(): Promise<void> {
  const folder = new URL('../public/media/music/', import.meta.url);
  await mkdir(folder, { recursive: true });
  for (const [name, melody] of Object.entries(demoTracks)) {
    // 将成品存在 public，使开发预览和构建产物都由静态服务器处理媒体定位。
    await writeFile(new URL(`${name}.wav`, folder), new Uint8Array(makeDemoWav(melody)));
  }
}

await generateDemoAudio();
