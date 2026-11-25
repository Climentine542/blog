import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { demoTracks, makeDemoWav } from '../scripts/demo-audio.ts';
import { adjacentTrack, formatTime } from '../src/lib/music-format.ts';

test('媒体时间格式化涵盖未加载和跨分钟', () => {
  assert.equal(formatTime(Number.NaN), '00:00');
  assert.equal(formatTime(Infinity), '00:00');
  assert.equal(formatTime(-3), '00:00');
  assert.equal(formatTime(65.9), '01:05');
});

test('切歌循环但不切换空清单、单首歌和未选择的清单', () => {
  assert.equal(adjacentTrack(0, -1, 3), 2);
  assert.equal(adjacentTrack(2, 1, 3), 0);
  assert.equal(adjacentTrack(-1, 1, 3), -1);
  assert.equal(adjacentTrack(0, -1, 1), 0);
  assert.equal(adjacentTrack(-1, 1, 0), -1);
});

test('两段静态示例与生成器一致，包含不同的可解码 PCM 数据', async () => {
  const files = await Promise.all(Object.entries(demoTracks).map(async ([name, melody]) => {
    const file = await readFile(new URL(`../public/media/music/${name}.wav`, import.meta.url));
    assert.deepEqual(file, Buffer.from(makeDemoWav(melody)));
    return file;
  }));
  assert.notDeepEqual(files[0], files[1]);
  for (const file of files) {
    // 同时校验头部、数据长度和波形，避免只生成能识别格式的静音文件。
    assert.equal(file.toString('ascii', 0, 4), 'RIFF');
    assert.equal(file.toString('ascii', 8, 16), 'WAVEfmt ');
    assert.equal(file.readUInt32LE(4), file.length - 8);
    assert.equal(file.readUInt16LE(20), 1);
    assert.equal(file.readUInt16LE(22), 1);
    assert.equal(file.readUInt32LE(24), 22050);
    assert.equal(file.readUInt16LE(34), 16);
    assert.equal(file.toString('ascii', 36, 40), 'data');
    assert.equal(file.readUInt32LE(40), file.length - 44);
    assert.ok((file.length - 44) / 44100 > 8);
    assert.ok(file.subarray(44).some((sample) => sample !== 0));
  }
});
