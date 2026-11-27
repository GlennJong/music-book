declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webgazer: any;
  }
}

/**
 * 視線翻頁：視線在畫面下方「穩定停留」一段時間後，把正在看的那一行平滑捲到上方。
 *
 * 為什麼不是「看著觸發區就持續捲動」：
 * - 持續捲動會讓正在讀的那行跟著跑，眼睛追上去又停下，形成來回晃動。
 * - 上方觸發區正好是捲動後開始閱讀的位置，容易誤觸往回捲。
 * - webcam 眼動誤差約 100–200px，單一預測點不可靠；整行（數百 px）才是可靠的判斷單位。
 */
export interface EyeScrollerOptions {
  /** 觸發線（畫面高度比例）：視線低於此線才開始累積停留時間 */
  trigger?: number;
  /** 捲動後，正在看的那一行要對齊到的位置（畫面高度比例） */
  anchor?: number;
  /** 需要停留多久才翻頁（ms） */
  dwell?: number;
  /** 翻頁後的冷卻時間（ms，從捲動結束起算），讓眼睛重新找到閱讀位置 */
  cooldown?: number;
  /** 翻頁捲動動畫時間（ms）；瀏覽器內建 smooth scroll 太快且無法調整 */
  duration?: number;
  /** 翻頁時加到「正在看的那一行」的 class，作為眼睛跟隨的視覺錨點 */
  highlightClass?: string;
  /** 用來對齊整行的元素選擇器；找不到時直接依視線位置捲動 */
  rowSelector?: string;
}

type GazeState = 'idle' | 'dwelling' | 'away' | 'cooldown';

type Sample = { t: number; x: number; y: number };

const TICK_MS = 50;
const SAMPLE_WINDOW_MS = 300;   // 取最近 300ms 的預測點做中位數
const MIN_SAMPLES = 3;          // 樣本太少視為偵測不到臉
const BOTTOM_DEAD_BAND = 0.05;  // 畫面最下方 5% 視為「看向畫面外」（低頭看指板時預測常落在這裡）
const CLICKS_PER_POINT = 5;
const DATA_VERSION_KEY = 'eye_scroller_data_version';
const DATA_VERSION = '2';       // 舊版會用滑鼠移動訓練，資料已被污染，升級時清掉一次

const CALIBRATION_POINTS = [
  { top: 15, left: 15 }, { top: 15, left: 50 }, { top: 15, left: 85 },
  { top: 50, left: 15 }, { top: 50, left: 50 }, { top: 50, left: 85 },
  { top: 85, left: 15 }, { top: 85, left: 50 }, { top: 85, left: 85 },
];

const WEBGAZER_SELECTORS = [
  '#webgazerVideoContainer',
  '#webgazerVideoFeed',
  '#webgazerVideoCanvas',
  '#webgazerFaceFeedbackBox',
  '#webgazerFaceDot',
];

const DOT_STYLES: Record<GazeState, { border: string; bg: string; scale: number; opacity: string }> = {
  idle:     { border: '#6366f1', bg: 'rgba(99,102,241,0.2)', scale: 1,   opacity: '1' },
  dwelling: { border: '#f59e0b', bg: 'rgba(245,158,11,0.3)', scale: 1.6, opacity: '1' },
  cooldown: { border: '#22c55e', bg: 'rgba(34,197,94,0.25)', scale: 1,   opacity: '1' },
  away:     { border: '#a1a1aa', bg: 'transparent',          scale: 1,   opacity: '0.4' },
};

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export class EyeScroller {
  private opts: Required<EyeScrollerOptions>;

  private _targetInput: string | HTMLElement | null;
  private _scrollTarget: HTMLElement | null = null;

  private _isEnabled = false;
  private _isLoaded = false;
  private _isTracking = false;
  private _isCalibrating = false;

  private _samples: Sample[] = [];
  private _dwellStart: number | null = null;
  private _cooldownUntil = 0;
  private _state: GazeState = 'away';

  private _dotVisible = true;
  private _dotEl: HTMLDivElement | null = null;
  private _calibrationEl: HTMLDivElement | null = null;
  private _loopId: number | null = null;
  private _animId: number | null = null;

  constructor(target: string | HTMLElement | null = null, options: EyeScrollerOptions = {}) {
    this._targetInput = target;
    this.opts = {
      trigger: options.trigger ?? 0.65,
      anchor: options.anchor ?? 0.2,
      dwell: options.dwell ?? 700,
      cooldown: options.cooldown ?? 800,
      duration: options.duration ?? 1200,
      rowSelector: options.rowSelector ?? '',
      highlightClass: options.highlightClass ?? '',
    };
  }

  async enable(): Promise<void> {
    if (this._isEnabled) return;

    if (typeof this._targetInput === 'string') {
      this._scrollTarget = document.getElementById(this._targetInput);
    } else if (this._targetInput instanceof HTMLElement) {
      this._scrollTarget = this._targetInput;
    }

    await this._loadScript();
    await this._initWebGazer();
    this._isEnabled = true;
    this._createDot();
  }

  disable(): void {
    this.stop();
    this._cancelScroll();
    this._isEnabled = false;
    this._isTracking = false;
    this._samples = [];

    if (window.webgazer) {
      try {
        window.webgazer.setGazeListener(() => {});
        window.webgazer.pause();
        window.webgazer.end();
      } catch (e) {
        console.warn('EyeScroller: cleanup error', e);
      }
    }

    // webgazer.end() does not stop MediaStream tracks — camera stays on without this
    const videoEl = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
    if (videoEl?.srcObject) {
      (videoEl.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoEl.srcObject = null;
    }

    WEBGAZER_SELECTORS.forEach(sel => document.querySelector(sel)?.remove());
    this._removeDot();
    this._removeCalibration();
  }

  start(): void {
    if (this._loopId !== null || !this._isTracking) return;
    this._loopId = window.setInterval(() => this._tick(), TICK_MS);
  }

  stop(): void {
    if (this._loopId === null) return;
    clearInterval(this._loopId);
    this._loopId = null;
  }

  updateOptions(options: EyeScrollerOptions): void {
    this.opts = { ...this.opts, ...options };
  }

  /** 清除所有校準資料（之後需要重新校準） */
  async refresh(): Promise<void> {
    try {
      await window.webgazer?.clearData();
    } catch (e) {
      console.warn('EyeScroller: clearData error', e);
    }
  }

  /** 重新校準：先清空舊資料，再以 9 點 × 5 次重新訓練 */
  async adjust(): Promise<void> {
    if (this._isCalibrating || !this._isTracking) return;
    this._isCalibrating = true;
    await this.refresh();
    this._createCalibration();
  }

  showDot(): void {
    this._dotVisible = true;
    if (this._dotEl) this._dotEl.style.display = 'block';
  }

  hideDot(): void {
    this._dotVisible = false;
    if (this._dotEl) this._dotEl.style.display = 'none';
  }

  // ── private ──────────────────────────────────────────────────────────────

  private _tick(): void {
    if (this._isCalibrating) return;

    const now = performance.now();
    const { innerWidth: w, innerHeight: h } = window;
    this._samples = this._samples.filter(s => now - s.t <= SAMPLE_WINDOW_MS);

    if (now < this._cooldownUntil) {
      this._dwellStart = null;
      this._setState('cooldown');
      return;
    }

    if (this._samples.length < MIN_SAMPLES) {
      this._dwellStart = null;
      this._setState('away');
      return;
    }

    const x = median(this._samples.map(s => s.x));
    const y = median(this._samples.map(s => s.y));
    const offScreen = x < 0 || x > w || y < 0 || y > h * (1 - BOTTOM_DEAD_BAND);
    if (offScreen) {
      this._dwellStart = null;
      this._setState('away');
      return;
    }

    if (y < h * this.opts.trigger) {
      this._dwellStart = null;
      this._setState('idle');
      return;
    }

    this._dwellStart ??= now;
    this._setState('dwelling');
    if (now - this._dwellStart >= this.opts.dwell) {
      const scrolled = this._advance(y, h);
      this._dwellStart = null;
      this._samples = [];
      this._cooldownUntil = now + (scrolled ? this.opts.duration : 0) + this.opts.cooldown;
      this._setState('cooldown');
    }
  }

  /** 把視線所在的那一行捲到 anchor 位置；回傳是否有捲動 */
  private _advance(gazeY: number, h: number): boolean {
    const anchorY = h * this.opts.anchor;
    const minStep = h * 0.15;
    let delta = gazeY - anchorY;
    let rowEl: HTMLElement | null = null;

    if (this.opts.rowSelector) {
      const rows = Array.from(document.querySelectorAll<HTMLElement>(this.opts.rowSelector));
      for (const el of rows) {
        if (el.getBoundingClientRect().top <= gazeY) rowEl = el; else break;
      }
      const top = rowEl?.getBoundingClientRect().top;
      // 該行很高時對齊行首可能幾乎不動，退回依視線位置捲動
      if (top !== undefined && top - anchorY >= minStep) delta = top - anchorY;
    }

    if (delta < minStep) return false;
    if (rowEl) this._highlight(rowEl);
    this._animateScroll(delta);
    return true;
  }

  /** 以 easeInOutCubic 捲動 delta px；使用者手動捲動時立即中止 */
  private _animateScroll(delta: number): void {
    this._cancelScroll();
    const target = this._scrollTarget ?? document.scrollingElement ?? document.documentElement;
    const from = target.scrollTop;
    const duration = Math.max(this.opts.duration, 1);
    const startT = performance.now();
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (t: number) => {
      const p = Math.min((t - startT) / duration, 1);
      target.scrollTop = from + delta * ease(p);
      if (p < 1) this._animId = requestAnimationFrame(step);
      else this._cancelScroll();
    };
    this._animId = requestAnimationFrame(step);

    window.addEventListener('wheel', this._onUserScroll, { passive: true });
    window.addEventListener('touchstart', this._onUserScroll, { passive: true });
    window.addEventListener('keydown', this._onUserScroll);
  }

  private _onUserScroll = (): void => this._cancelScroll();

  private _cancelScroll(): void {
    if (this._animId !== null) cancelAnimationFrame(this._animId);
    this._animId = null;
    window.removeEventListener('wheel', this._onUserScroll);
    window.removeEventListener('touchstart', this._onUserScroll);
    window.removeEventListener('keydown', this._onUserScroll);
  }

  private _highlight(el: HTMLElement): void {
    const cls = this.opts.highlightClass;
    if (!cls) return;
    el.classList.remove(cls);
    void el.offsetWidth; // 重新觸發 CSS 動畫
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), this.opts.duration + 1000);
  }

  private _setState(state: GazeState): void {
    if (state === this._state) return;
    this._state = state;
    if (!this._dotEl) return;
    const s = DOT_STYLES[state];
    Object.assign(this._dotEl.style, { borderColor: s.border, background: s.bg, opacity: s.opacity, color: s.border });
    (this._dotEl.firstElementChild as HTMLElement | null)?.style.setProperty('transform', `scale(${s.scale})`);
  }

  private _loadScript(): Promise<void> {
    if (this._isLoaded || window.webgazer) {
      this._isLoaded = true;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/webgazer@2.1.0/dist/webgazer.js';
      script.async = true;
      script.onload = () => { this._isLoaded = true; resolve(); };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  private async _initWebGazer(): Promise<void> {
    const wg = window.webgazer;
    await wg
      .setRegression('ridge')
      .applyKalmanFilter(true)
      .saveDataAcrossSessions(true)
      .setGazeListener((data: { x: number; y: number } | null) => {
        if (!data) return; // 偵測不到臉：不加入樣本，_tick 會判定為 away
        this._samples.push({ t: performance.now(), x: data.x, y: data.y });
        if (this._dotEl) {
          const x = Math.min(Math.max(data.x, 0), window.innerWidth);
          const y = Math.min(Math.max(data.y, 0), window.innerHeight);
          this._dotEl.style.transform = `translate3d(${x}px,${y}px,0)`;
        }
      })
      .begin();

    // begin() 會掛上 click / mousemove 監聽，把「滑鼠在哪」當成「眼睛在看哪」來訓練，
    // 操作按鈕或移動滑鼠時會把模型教歪。只在校準時手動記錄樣本。
    wg.removeMouseEventListeners();
    wg.showPredictionPoints(false);

    if (localStorage.getItem(DATA_VERSION_KEY) !== DATA_VERSION) {
      await this.refresh();
      localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
    }

    this._isTracking = true;

    const container = document.getElementById('webgazerVideoContainer');
    if (container) container.style.display = 'none';
  }

  private _createDot(): void {
    this._removeDot();
    const dot = document.createElement('div');
    dot.id = 'eye-scroller-dot';
    Object.assign(dot.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '20px',
      height: '20px',
      border: '2px solid',
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: '10000',
      willChange: 'transform',
      margin: '-10px 0 0 -10px',
      transition: 'border-color .15s, background .15s, opacity .15s',
    });
    const inner = document.createElement('div');
    Object.assign(inner.style, {
      position: 'absolute',
      inset: '0',
      margin: 'auto',
      width: '4px',
      height: '4px',
      background: 'currentColor',
      borderRadius: '50%',
      transition: 'transform .15s',
    });
    if (!this._dotVisible) dot.style.display = 'none';
    dot.appendChild(inner);
    document.body.appendChild(dot);
    this._dotEl = dot;
    const s = DOT_STYLES[this._state];
    Object.assign(dot.style, { borderColor: s.border, background: s.bg, opacity: s.opacity, color: s.border });
  }

  private _removeDot(): void {
    this._dotEl?.remove();
    this._dotEl = null;
    document.getElementById('eye-scroller-dot')?.remove();
  }

  private _createCalibration(): void {
    this._removeCalibration();

    const overlay = document.createElement('div');
    overlay.id = 'eye-scroller-calibration';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'var(--bg-main)',
      color: 'var(--text-main)',
      zIndex: '10001',
      fontFamily: 'sans-serif',
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      textAlign: 'center',
      pointerEvents: 'none',
      maxWidth: '80vw',
    });
    header.innerHTML = `
      <h2 style="font-size:2rem;font-weight:900;margin:0 0 .5rem">精準度校準</h2>
      <p style="color:var(--text-secondary);margin:0 0 .25rem">頭部保持不動，眼睛盯著紅點中心再點擊</p>
      <p id="eye-cal-hint" style="color:var(--text-muted);margin:0"></p>`;
    overlay.appendChild(header);

    const cancel = document.createElement('button');
    cancel.textContent = '取消';
    Object.assign(cancel.style, {
      position: 'absolute',
      top: 'calc(16px + env(safe-area-inset-top))',
      right: '16px',
      padding: '6px 14px',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-card)',
      color: 'var(--text-secondary)',
    });
    cancel.addEventListener('click', () => {
      this._isCalibrating = false;
      this._removeCalibration();
    });
    overlay.appendChild(cancel);

    document.body.appendChild(overlay);
    this._calibrationEl = overlay;
    this._renderCalibrationBtn(0, CLICKS_PER_POINT);
  }

  private _renderCalibrationBtn(step: number, remaining: number): void {
    if (!this._calibrationEl) return;

    this._calibrationEl.querySelector('#eye-cal-btn')?.remove();
    const hint = this._calibrationEl.querySelector('#eye-cal-hint') as HTMLElement | null;
    if (hint) hint.textContent = `第 ${step + 1} / ${CALIBRATION_POINTS.length} 點`;

    const point = CALIBRATION_POINTS[step];
    const btn = document.createElement('button');
    btn.id = 'eye-cal-btn';
    Object.assign(btn.style, {
      position: 'absolute',
      width: '56px',
      height: '56px',
      background: '#ef4444',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 10px 30px rgba(239,68,68,.4)',
      color: 'white',
      fontSize: '1.2rem',
      fontWeight: '900',
      top: `${point.top}%`,
      left: `${point.left}%`,
      transform: 'translate(-50%,-50%)',
      opacity: String(0.4 + 0.6 * (remaining / CLICKS_PER_POINT)),
    });
    btn.textContent = String(remaining);
    btn.addEventListener('click', () => {
      const r = btn.getBoundingClientRect();
      window.webgazer?.recordScreenPosition(r.left + r.width / 2, r.top + r.height / 2, 'click');

      if (remaining > 1) {
        this._renderCalibrationBtn(step, remaining - 1);
      } else if (step + 1 < CALIBRATION_POINTS.length) {
        this._renderCalibrationBtn(step + 1, CLICKS_PER_POINT);
      } else {
        this._isCalibrating = false;
        this._samples = [];
        this._removeCalibration();
      }
    });

    this._calibrationEl.appendChild(btn);
  }

  private _removeCalibration(): void {
    this._calibrationEl?.remove();
    this._calibrationEl = null;
    document.getElementById('eye-scroller-calibration')?.remove();
  }
}

export default EyeScroller;
