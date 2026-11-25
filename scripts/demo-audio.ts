/** 两段自制短旋律的生成参数；不是第三方录音或个人收藏。 */
export const demoTracks = {
  'window-light': { step: .62, notes: [60, 64, 67, 72, 71, 67, 64, 67, 62, 65, 69, 74, 72, 69, 65, 64] },
  'evening-breeze': { step: .52, notes: [57, 60, 64, 67, 64, 60, 62, 65, 69, 72, 69, 65, 64, 67, 71, 76] },
} as const;

/** 一段单音旋律的音符间隔（秒）和按 MIDI 音高表示的音符。 */
interface Melody {
  step: number;
  notes: readonly number[];
}

const SAMPLE_RATE = 22_050;
const HEADER_SIZE = 44;
const BYTES_PER_SAMPLE = 2;

/**
 * 生成可直接由浏览器解码的单声道 PCM WAV。
 * @param melody 固定的示例旋律；曲末保留少量空间让最后一个音自然衰减
 * @returns 完整 WAV 文件字节，可保存为本地静态资源
 */
export function makeDemoWav(melody: Melody): ArrayBuffer {
  const sampleCount = Math.ceil((melody.notes.length * melody.step + .45) * SAMPLE_RATE);
  const pcm = new Float32Array(sampleCount);
  melody.notes.forEach((note, index) => {
    const start = Math.floor(index * melody.step * SAMPLE_RATE);
    addNote(pcm, start, note, melody.step + .35);
  });

  const bytes = new ArrayBuffer(HEADER_SIZE + sampleCount * BYTES_PER_SAMPLE);
  const view = new DataView(bytes);
  writeHeader(view, bytes.byteLength - HEADER_SIZE);
  // 多个音的尾声可能叠加；写入 16 位整数前限幅，避免溢出回绕产生噪声。
  for (let index = 0; index < sampleCount; index++) {
    const value = Math.max(-1, Math.min(1, pcm[index]));
    view.setInt16(HEADER_SIZE + index * BYTES_PER_SAMPLE, Math.round(value * 32767), true);
  }
  return bytes;
}

/**
 * 把一个带轻微泛音的合成音加入波形，音头和尾部均渐变以免出现爆音。
 * @param pcm 要累加的波形
 * @param start 起始采样点
 * @param note MIDI 音高
 * @param duration 最多持续的秒数，超过缓冲区的部分自动截断
 */
function addNote(pcm: Float32Array, start: number, note: number, duration: number): void {
  const frequency = 440 * 2 ** ((note - 69) / 12);
  const length = Math.min(pcm.length - start, Math.floor(duration * SAMPLE_RATE));
  for (let offset = 0; offset < length; offset++) {
    const t = offset / SAMPLE_RATE;
    const phase = 2 * Math.PI * frequency * t;
    const envelope = Math.min(1, t / .03, (duration - t) / .15) * Math.exp(-3.4 * t);
    pcm[start + offset] += envelope * (.24 * Math.sin(phase) + .06 * Math.sin(phase * 2));
  }
}

/**
 * 写入标准 RIFF/WAVE 文件头。整数按格式要求使用小端序。
 * @param view 文件字节视图
 * @param dataSize 音频数据长度（字节，不包含文件头）
 */
function writeHeader(view: DataView, dataSize: number): void {
  // 四字符块标识逐字节写入，避免机器字节序影响标识内容。
  const chunks = [[0, 'RIFF'], [8, 'WAVEfmt '], [36, 'data']] as const;
  for (const [offset, tag] of chunks) {
    for (let i = 0; i < tag.length; i++) view.setUint8(offset + i, tag.charCodeAt(i));
  }
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM 编码，不依赖额外解码库。
  view.setUint16(22, 1, true); // 单声道足以验证播放器并控制示例文件体积。
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * BYTES_PER_SAMPLE, true);
  view.setUint16(32, BYTES_PER_SAMPLE, true);
  view.setUint16(34, BYTES_PER_SAMPLE * 8, true);
  view.setUint32(40, dataSize, true);
}
