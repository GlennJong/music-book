declare global {
  interface Window {
    webgazer: any;
  }
}

export interface EyeScrollerOptions {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  speed?: number;
  frequency?: number;
}

export interface EyeScrollerStatus {
  isEnabled: boolean;
  isLoaded: boolean;
  isTracking: boolean;
  gazeX: number;
  gazeY: number;
  zone: 'top' | 'bottom' | 'left' | 'right' | null;
}

type GazeCallback = (status: EyeScrollerStatus) => void;
type TriggerCallback = (status: EyeScrollerStatus) => void;

const CALIBRATION_POINTS = [
  { top: '15%', left: '15%' }, { top: '15%', left: '50%' }, { top: '15%', left: '85%' },
  { top: '50%', left: '15%' }, { top: '50%', left: '50%' }, { top: '50%', left: '85%' },
  { top: '85%', left: '15%' }, { top: '85%', left: '50%' }, { top: '85%', left: '85%' },
];

const WEBGAZER_SELECTORS = [
  '#webgazerVideoContainer',
  '#webgazerVideoFeed',
  '#webgazerVideoCanvas',
  '#webgazerFaceFeedbackBox',
  '#webgazerFaceDot',
];

export class EyeScroller {
  private opts: Required<EyeScrollerOptions>;

  private _targetInput: string | HTMLElement | null;
  private _scrollTarget: HTMLElement | null = null;

  private _isEnabled = false;
  private _isLoaded = false;
  private _isTracking = false;
  private _isCalibrating = false;
  private _gazeX = 0;
  private _gazeY = 0;
  private _dotVisible = true;

  private _dotEl: HTMLDivElement | null = null;
  private _calibrationEl: HTMLDivElement | null = null;
  private _loopId: number | null = null;
  private _calibrationStep = 0;

  private _gazeCallbacks: GazeCallback[] = [];
  private _triggerCallbacks: TriggerCallback[] = [];

  constructor(target: string | HTMLElement | null = null, options: EyeScrollerOptions = {}) {
    this._targetInput = target;
    this.opts = {
      top: options.top ?? 0.15,
      bottom: options.bottom ?? 0.15,
      left: options.left ?? 0.05,
      right: options.right ?? 0.05,
      speed: options.speed ?? 8,
      frequency: options.frequency ?? 30,
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
    this._isEnabled = false;
    this._isTracking = false;

    if (window.webgazer) {
      try {
        window.webgazer.setGazeListener(null);
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
    const interval = Math.round(1000 / this.opts.frequency);
    this._loopId = window.setInterval(() => this._tick(), interval);
  }

  stop(): void {
    if (this._loopId === null) return;
    clearInterval(this._loopId);
    this._loopId = null;
  }

  refresh(): void {
    if (window.webgazer) {
      try {
        window.webgazer.clearData();
      } catch (e) {
        console.warn('EyeScroller: clearData error', e);
      }
    }
  }

  adjust(): void {
    if (this._isCalibrating) return;
    this._isCalibrating = true;
    this._calibrationStep = 0;
    this._createCalibration();
  }

  onGaze(callback: GazeCallback): void {
    this._gazeCallbacks.push(callback);
  }

  onTrigger(callback: TriggerCallback): void {
    this._triggerCallbacks.push(callback);
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

  private _getZone(): EyeScrollerStatus['zone'] {
    const { innerWidth: w, innerHeight: h } = window;
    const { top, bottom, left, right } = this.opts;
    if (this._gazeY < h * top) return 'top';
    if (this._gazeY > h * (1 - bottom)) return 'bottom';
    if (this._gazeX < w * left) return 'left';
    if (this._gazeX > w * (1 - right)) return 'right';
    return null;
  }

  private _getStatus(zone: EyeScrollerStatus['zone']): EyeScrollerStatus {
    return {
      isEnabled: this._isEnabled,
      isLoaded: this._isLoaded,
      isTracking: this._isTracking,
      gazeX: this._gazeX,
      gazeY: this._gazeY,
      zone,
    };
  }

  private _tick(): void {
    if (this._isCalibrating) return;

    const { speed } = this.opts;
    const zone = this._getZone();
    const target: HTMLElement | Window = this._scrollTarget ?? window;

    if (zone === 'top') target.scrollBy(0, -speed);
    else if (zone === 'bottom') target.scrollBy(0, speed);
    else if (zone === 'left') target.scrollBy(-speed, 0);
    else if (zone === 'right') target.scrollBy(speed, 0);

    const hasGaze = this._gazeCallbacks.length > 0;
    const hasTrigger = zone !== null && this._triggerCallbacks.length > 0;
    if (hasGaze || hasTrigger) {
      const status = this._getStatus(zone);
      if (hasGaze) this._gazeCallbacks.forEach(cb => cb(status));
      if (hasTrigger) this._triggerCallbacks.forEach(cb => cb(status));
    }
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
    await window.webgazer
      .setRegression('ridge')
      .setGazeListener((data: { x: number; y: number } | null) => {
        if (!data) return;
        this._gazeX = data.x;
        this._gazeY = data.y;
        if (this._dotEl) {
          this._dotEl.style.transform = `translate3d(${data.x}px,${data.y}px,0)`;
        }
      })
      .begin();

    window.webgazer.showPredictionPoints(false);
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
      border: '2px solid #6366f1',
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: '10000',
      background: 'rgba(99,102,241,0.2)',
      willChange: 'transform',
      margin: '-10px 0 0 -10px',
    });
    const inner = document.createElement('div');
    Object.assign(inner.style, {
      position: 'absolute',
      inset: '0',
      margin: 'auto',
      width: '4px',
      height: '4px',
      background: '#4f46e5',
      borderRadius: '50%',
    });
    if (!this._dotVisible) dot.style.display = 'none';
    dot.appendChild(inner);
    document.body.appendChild(dot);
    this._dotEl = dot;
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
      background: 'rgba(255,255,255,0.98)',
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
    });
    header.innerHTML = `
      <h2 style="font-size:2rem;font-weight:900;color:#0f172a;margin:0 0 .5rem">精準度校準</h2>
      <p id="eye-cal-hint" style="color:#64748b;margin:0">
        請注視並點擊紅色圓點 (1/${CALIBRATION_POINTS.length})
      </p>`;
    overlay.appendChild(header);

    document.body.appendChild(overlay);
    this._calibrationEl = overlay;
    this._renderCalibrationBtn();
  }

  private _renderCalibrationBtn(): void {
    if (!this._calibrationEl) return;

    this._calibrationEl.querySelector('#eye-cal-btn')?.remove();

    const point = CALIBRATION_POINTS[this._calibrationStep];
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
      fontSize: '1.4rem',
      top: point.top,
      left: point.left,
      transform: 'translate(-50%,-50%)',
      transition: 'transform .1s',
    });
    btn.textContent = '⊕';
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translate(-50%,-50%) scale(1.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(-50%,-50%)';
    });
    btn.addEventListener('click', () => {
      this._calibrationStep++;
      if (this._calibrationStep >= CALIBRATION_POINTS.length) {
        this._isCalibrating = false;
        this._removeCalibration();
      } else {
        const hint = this._calibrationEl?.querySelector('#eye-cal-hint') as HTMLElement | null;
        if (hint) hint.textContent = `請注視並點擊紅色圓點 (${this._calibrationStep + 1}/${CALIBRATION_POINTS.length})`;
        this._renderCalibrationBtn();
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
