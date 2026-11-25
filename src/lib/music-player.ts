import { adjacentTrack, formatTime } from './music-format';

/** 曲目元数据从页面按钮读取，与静态清单共用同一套数据。 */
interface Track {
  button: HTMLButtonElement;
  source: string;
  title: string;
  artist: string;
}

/** 播放器上会随媒体状态更新的控制和提示。 */
interface Controls {
  audio: HTMLAudioElement;
  title: HTMLElement;
  artist: HTMLElement;
  status: HTMLElement;
  toggle: HTMLButtonElement;
  previous: HTMLButtonElement | null;
  next: HTMLButtonElement | null;
  progress: HTMLInputElement;
  time: HTMLElement;
}

/**
 * 接线单曲列表与一个原生媒体元素，不记录跨页播放状态。
 * @param root 播放器组件根节点；空清单不会渲染此节点
 */
export function mountMusicPlayer(root: HTMLElement): void {
  const playerControls = getControls(root);
  const tracks: Track[] = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-track]'), (button) => ({
    button,
    source: button.dataset.source ?? '',
    title: button.dataset.title ?? '',
    artist: button.dataset.artist ?? '',
  }));
  if (!playerControls || !tracks.length) return;

  const controls = playerControls;
  let index = -1;
  let request = 0;
  const { audio, title, artist, status, toggle, previous, next } = controls;

  /**
   * 选择曲目并发出播放请求；首次进入不调用。
   * @param target 选中的曲目索引；不存在则不改变当前曲目
   */
  function select(target: number): void {
    const track = tracks[target];
    if (!track) return;

    // 切歌先停旧曲并使旧的播放请求失效，只允许一个媒体元素发声。
    request++;
    audio.pause();
    index = target;
    title.textContent = track.title;
    artist.textContent = track.artist;
    toggle.disabled = false;
    if (previous) previous.disabled = false;
    if (next) next.disabled = false;
    tracks.forEach(({ button }, position) => {
      if (position === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    audio.src = track.source;
    audio.load();
    syncTime(controls);
    void play();
  }

  /** 只响应最新播放请求的失败，忽略快速切歌触发的旧请求中断。 */
  async function play(): Promise<void> {
    const current = ++request;
    status.textContent = '正在加载音频…';
    try {
      await audio.play();
    } catch {
      if (request === current) showError(controls, tracks.length > 1);
    }
  }

  /** 在当前曲目上暂停或继续；音源错误后重新加载，允许用户主动重试。 */
  function togglePlayback(): void {
    if (index < 0) return;
    if (!audio.paused) {
      request++;
      audio.pause();
      toggle.textContent = '继续播放';
      status.textContent = '已暂停';
    } else if (audio.error) {
      select(index);
    } else {
      void play();
    }
  }

  // 所有按钮保持原生键盘语义；清单只有一首时模板不渲染切歌控件。
  tracks.forEach(({ button }, position) => button.addEventListener('click', () => {
    if (position === index) togglePlayback();
    else select(position);
  }));
  toggle.addEventListener('click', togglePlayback);
  previous?.addEventListener('click', () => select(adjacentTrack(index, -1, tracks.length)));
  next?.addEventListener('click', () => select(adjacentTrack(index, 1, tracks.length)));

  wireTimeline(controls);
  wireMediaStatus(controls, tracks.length > 1);
}

/**
 * 以媒体事件更新界面，区分正在播放、暂停、结束与音源错误。
 * @param controls 当前播放器控件
 * @param canSwitch 是否还有其他音源可选
 */
function wireMediaStatus(controls: Controls, canSwitch: boolean): void {
  const { audio, status, toggle } = controls;
  audio.addEventListener('playing', () => {
    // 快速切歌可能让旧曲事件进入队列；仅在当前音源能产出媒体数据时呈现播放态。
    if (!audio.paused && audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      toggle.textContent = '暂停';
      status.textContent = '正在播放';
    }
  });
  audio.addEventListener('pause', () => {
    // 切歌期间会收到暂停事件；新音源未就绪时保留加载提示。
    if (!audio.error && !audio.ended && audio.paused && audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      toggle.textContent = '继续播放';
      status.textContent = '已暂停';
    }
  });
  audio.addEventListener('ended', () => {
    toggle.textContent = '重新播放';
    status.textContent = '播放结束';
  });
  audio.addEventListener('error', () => {
    if (audio.error) showError(controls, canSwitch);
  });
}

/**
 * 读取播放器所需控件；模板不完整时不绑定事件，避免半套播放器继续执行。
 * @param root 当前组件的根节点
 * @returns 完整控件或 null；可选的切歌按钮不影响初始化
 */
function getControls(root: HTMLElement): Controls | null {
  const audio = root.querySelector<HTMLAudioElement>('audio');
  const title = root.querySelector<HTMLElement>('[data-now-title]');
  const artist = root.querySelector<HTMLElement>('[data-now-artist]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-toggle]');
  const progress = root.querySelector<HTMLInputElement>('[data-progress]');
  const time = root.querySelector<HTMLElement>('[data-time]');
  if (!audio || !title || !artist || !status || !toggle || !progress || !time) return null;
  return {
    audio, title, artist, status, toggle, progress, time,
    previous: root.querySelector<HTMLButtonElement>('[data-previous]'),
    next: root.querySelector<HTMLButtonElement>('[data-next]'),
  };
}

/**
 * 绑定媒体时长变化和用户拖动；先等待元数据，避免在无时长时跳转。
 * @param controls 播放器的媒体和进度控件
 */
function wireTimeline(controls: Controls): void {
  const { audio, progress } = controls;
  for (const event of ['emptied', 'loadedmetadata', 'durationchange', 'timeupdate', 'seeked']) {
    audio.addEventListener(event, () => syncTime(controls));
  }
  progress.addEventListener('input', () => {
    if (!progress.disabled && Number.isFinite(progress.valueAsNumber) && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(audio.duration, Math.max(0, progress.valueAsNumber));
      syncTime(controls);
    }
  });
}

/**
 * 将媒体真实位置同步至进度条；加载前或失败时禁用拖动。
 * @param controls 当前播放器控件
 */
function syncTime({ audio, progress, time }: Controls): void {
  const ready = !audio.error && Number.isFinite(audio.duration) && audio.duration > 0;
  const duration = ready ? audio.duration : 0;
  const current = ready ? Math.min(audio.currentTime, duration) : 0;
  progress.disabled = !ready;
  progress.max = String(duration || 1);
  progress.value = String(current);
  time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  progress.setAttribute('aria-valuetext', time.textContent);
}

/**
 * 显示播放失败，同时保留重试及有多首歌时的切歌入口。
 * @param controls 当前播放器控件
 * @param canSwitch 是否还有其他音源可选
 */
function showError(controls: Controls, canSwitch: boolean): void {
  controls.toggle.textContent = '重试播放';
  controls.status.textContent = canSwitch ? '音频无法播放，可以重试或选择另一首。' : '音频无法播放，可以重试。';
  syncTime(controls);
}
