import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GuitarChordPhoto } from '../../../components/GuitarChord';
import { CHORD_DATA } from '../../../components/GuitarChord/constants';
import { transposeTabData, migrateTabData, decodeBeatChord, applyChordShapeToTabData, chunkMeasuresIntoRows } from '../Editor/utils';
import type { TabData } from '../../../types';
import { EyeScroller } from '../../../components/EyeScroller';

const STRING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E'];

interface PlayProps {
  tabData: TabData;
}

type ChordShape = 'Open' | 'A' | 'E' | null;
type EyeSettings = { top: number; bottom: number; speed: number; frequency: number };
type StoredSettings = {
  measuresPerRow: number;
  transposeOffset: number;
  showChordPhoto: boolean;
  lyricsOnly: boolean;
  chordShape: ChordShape;
  eyeSettings: EyeSettings;
};

const DEFAULT_SETTINGS: StoredSettings = {
  measuresPerRow: 2,
  transposeOffset: 0,
  showChordPhoto: true,
  lyricsOnly: false,
  chordShape: null,
  eyeSettings: { top: 0.2, bottom: 0.45, speed: 8, frequency: 20 },
};

const loadPlaySettings = (id: string | undefined): StoredSettings => {
  if (!id) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(`play_settings:${id}`);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw);
    return {
      measuresPerRow: typeof p.measuresPerRow === 'number' ? p.measuresPerRow : DEFAULT_SETTINGS.measuresPerRow,
      transposeOffset: typeof p.transposeOffset === 'number' ? p.transposeOffset : DEFAULT_SETTINGS.transposeOffset,
      showChordPhoto: typeof p.showChordPhoto === 'boolean' ? p.showChordPhoto : DEFAULT_SETTINGS.showChordPhoto,
      lyricsOnly: typeof p.lyricsOnly === 'boolean' ? p.lyricsOnly : DEFAULT_SETTINGS.lyricsOnly,
      chordShape: p.chordShape === null || p.chordShape === 'Open' || p.chordShape === 'A' || p.chordShape === 'E'
        ? p.chordShape
        : DEFAULT_SETTINGS.chordShape,
      eyeSettings: p.eyeSettings && typeof p.eyeSettings === 'object'
        ? { ...DEFAULT_SETTINGS.eyeSettings, ...p.eyeSettings }
        : DEFAULT_SETTINGS.eyeSettings,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

type MeasureViewProps = {
  measure: TabData['measures'][0];
  subdivisions: number;
  showChordPhoto: boolean;
  lyricsOnly: boolean;
};

const resolveBeatChord = (beat: TabData['measures'][0]['notes'][number]) => {
  if (typeof beat !== 'string') return null;
  const decoded = decodeBeatChord(beat);
  if (!decoded?.name) return null;
  const photo = CHORD_DATA[decoded.name]?.[decoded.idx] ?? CHORD_DATA[decoded.name]?.[0] ?? null;
  return { name: decoded.name, photo };
};

const MeasureView: React.FC<MeasureViewProps> = ({ measure, subdivisions, showChordPhoto, lyricsOnly }) => {
  const chordPositions = measure.chord ? CHORD_DATA[measure.chord] : null;
  const chordPhoto = chordPositions?.[measure.chordPositionIndex ?? 0] ?? null;
  const beats = [...Array(subdivisions)].map((_, b) => measure.notes[b] ?? null);
  const beatChords = beats
    .map(resolveBeatChord)
    .filter((bc): bc is NonNullable<ReturnType<typeof resolveBeatChord>> => bc !== null);

  if (lyricsOnly) {
    // 純簡譜：主和弦與小節內換的和弦並列顯示，可自動換行
    const items = [
      ...(measure.chord ? [{ name: measure.chord, photo: chordPhoto }] : []),
      ...beatChords,
    ];
    return (
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {items.length === 0 && (
            <span className="text-2xl font-black tracking-tighter text-foreground leading-none">-</span>
          )}
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter text-foreground leading-none">{item.name}</span>
              {showChordPhoto && item.photo && <GuitarChordPhoto chord={item.photo} size="xs" isShowTitle={false} />}
            </div>
          ))}
          <span className="ml-auto text-[10px] font-black text-muted-foreground tracking-widest">#{measure.id}</span>
        </div>
        {measure.lyrics && (
          <p className="text-lg font-medium leading-relaxed text-foreground">{measure.lyrics}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 rounded-3xl space-y-4">
      <div className="flex items-center gap-3 h-[100px]">
        <span className="text-2xl font-black tracking-tighter text-foreground leading-none">
          {measure.chord || '-'}
        </span>
        {showChordPhoto && chordPhoto && <GuitarChordPhoto chord={chordPhoto} size="sm" isShowTitle={false} />}
        <span className="ml-auto text-[10px] font-black text-muted-foreground tracking-widest">#{measure.id}</span>
      </div>

      <div className="relative bg-card rounded-2xl p-5 py-2 pl-8">
        <div
          className="relative min-h-24 grid gap-0"
          style={{ gridTemplateColumns: `repeat(${subdivisions}, 1fr)` }}
        >
          <div className="absolute inset-0 flex flex-col justify-between py-3 pointer-events-none">
            {STRING_LABELS.map((label, i) => (
              <div key={i} className="relative w-full h-px bg-border">
                <span className="absolute -left-6 -top-2 text-[9px] font-black text-muted-foreground w-5 text-right">{label}</span>
              </div>
            ))}
          </div>

          {[...Array(subdivisions)].map((_, b) => {
            const beat = beats[b];
            const frets = Array.isArray(beat) ? beat : null;
            const bc = resolveBeatChord(beat);
            const beatChordName = bc?.name ?? null;
            const beatChordPhoto = bc?.photo ?? null;

            return (
              <div key={b} className="relative h-full border-l border-border/60 first:border-l-0 flex flex-col justify-between py-3 px-0.5">
                {beatChordName && (
                  showChordPhoto && beatChordPhoto ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <GuitarChordPhoto chord={beatChordPhoto} size="xs" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-black text-violet-500 bg-violet-50 dark:text-violet-300 dark:bg-violet-950 px-1.5 py-0.5 rounded-full leading-none">
                        {beatChordName}
                      </span>
                    </div>
                  )
                )}

                {[...Array(6)].map((_, s) => {
                  const fret = frets?.[s] ?? null;
                  return (
                    <div key={s} className="w-full h-1 flex items-center justify-center">
                      {fret !== null && (
                        <span className="w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center font-mono font-bold text-[10px] shadow-sm">
                          {fret}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {measure.lyrics && (
        <p className="text-sm font-medium leading-relaxed text-text-secondary">{measure.lyrics}</p>
      )}
    </div>
  );
};

const Play: React.FC<PlayProps> = ({ tabData }) => {
  const tabId = tabData?.id;

  const [measuresPerRow, setMeasuresPerRow] = useState(() => loadPlaySettings(tabId).measuresPerRow);
  const [transposeOffset, setTransposeOffset] = useState(() => loadPlaySettings(tabId).transposeOffset);
  const [showChordPhoto, setShowChordPhoto] = useState(() => loadPlaySettings(tabId).showChordPhoto);
  const [lyricsOnly, setLyricsOnly] = useState(() => loadPlaySettings(tabId).lyricsOnly);
  const [chordShape, setChordShape] = useState<ChordShape>(() => loadPlaySettings(tabId).chordShape);
  const [showChordShapeMenu, setShowChordShapeMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [eyeActive, setEyeActive] = useState(false);
  const [eyeLoading, setEyeLoading] = useState(false);
  const [showEyeSettings, setShowEyeSettings] = useState(false);
  const [eyeSettings, setEyeSettings] = useState<EyeSettings>(() => loadPlaySettings(tabId).eyeSettings);

  const eyeRef = useRef<EyeScroller | null>(null);
  const chordShapeMenuRef = useRef<HTMLDivElement>(null);
  const prevIdRef = useRef(tabId);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    if (prevIdRef.current === tabId) return;
    prevIdRef.current = tabId;
    skipSaveRef.current = true;
    const s = loadPlaySettings(tabId);
    setMeasuresPerRow(s.measuresPerRow);
    setTransposeOffset(s.transposeOffset);
    setShowChordPhoto(s.showChordPhoto);
    setLyricsOnly(s.lyricsOnly);
    setChordShape(s.chordShape);
    setEyeSettings(s.eyeSettings);
  }, [tabId]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    if (!tabId) return;
    const settings: StoredSettings = { measuresPerRow, transposeOffset, showChordPhoto, lyricsOnly, chordShape, eyeSettings };
    localStorage.setItem(`play_settings:${tabId}`, JSON.stringify(settings));
  }, [tabId, measuresPerRow, transposeOffset, showChordPhoto, lyricsOnly, chordShape, eyeSettings]);

  useEffect(() => {
    if (!showChordShapeMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (chordShapeMenuRef.current && !chordShapeMenuRef.current.contains(e.target as Node)) {
        setShowChordShapeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChordShapeMenu]);

  useEffect(() => {
    eyeRef.current = new EyeScroller('main-scroll-container', {
      ...eyeSettings,
      left: 0.05,
      right: 0.05,
    });
    return () => { eyeRef.current?.disable(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    eyeRef.current?.updateOptions(eyeSettings);
  }, [eyeSettings]);

  // 全螢幕版面：在 <html> 加 class 隱藏 App 外框（捲動容器不變，視線捲動照常運作）
  useEffect(() => {
    if (!fullscreen) return;
    const root = document.documentElement;
    root.classList.add('play-fullscreen');

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      root.classList.remove('play-fullscreen');
      document.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  const handleEyeToggle = async () => {
    if (!eyeRef.current) return;
    if (eyeActive) {
      eyeRef.current.disable();
      setEyeActive(false);
    } else {
      setEyeLoading(true);
      try {
        await eyeRef.current.enable();
        eyeRef.current.start();
        setEyeActive(true);
      } catch (e) {
        console.error('EyeScroller enable failed', e);
      } finally {
        setEyeLoading(false);
      }
    }
  };

  const migratedData = useMemo(() => migrateTabData(tabData), [tabData]);

  const displayData = useMemo(() => {
    let data = transposeOffset !== 0 ? transposeTabData(migratedData, transposeOffset) : migratedData;
    if (chordShape) data = applyChordShapeToTabData(data, chordShape);
    return data;
  }, [migratedData, transposeOffset, chordShape]);

  if (!tabData?.measures) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground font-bold">無譜面資料</div>
  );

  const { title, artist, bpm, capo, subdivisions } = displayData;
  const key = displayData.key;

  const groups = chunkMeasuresIntoRows(displayData.measures, measuresPerRow);

  // 眼球追蹤控制項：一般模式放在工具列，全螢幕模式放在頂端固定列
  const eyeControls = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleEyeToggle}
        disabled={eyeLoading}
        title={eyeActive ? '關閉視線捲動' : '開啟視線捲動'}
        className={`p-2 rounded-xl transition-colors flex items-center ${eyeActive ? 'bg-primary-subtle text-primary' : 'bg-muted text-muted-foreground hover:bg-hover'} disabled:opacity-50`}
      >
        <span className={`material-icons text-[18px] ${eyeLoading ? 'animate-spin' : ''}`}>
          {eyeLoading ? 'sync' : 'visibility'}
        </span>
      </button>

      <button
        onClick={() => setShowEyeSettings(v => !v)}
        title="視線捲動設定"
        className={`p-2 rounded-xl transition-colors flex items-center ${showEyeSettings ? 'bg-primary-subtle text-primary' : 'bg-muted text-muted-foreground hover:bg-hover'}`}
      >
        <span className="material-icons text-[18px]">tune</span>
      </button>

      {eyeActive && (
        <>
          <button
            onClick={() => eyeRef.current?.adjust()}
            title="校準視線"
            className="p-2 rounded-xl bg-muted text-text-secondary hover:bg-hover transition-colors flex items-center"
          >
            <span className="material-icons text-[18px]">track_changes</span>
          </button>
          <button
            onClick={() => eyeRef.current?.hideDot()}
            title="關閉視線點"
            className="p-2 rounded-xl bg-muted text-text-secondary hover:bg-hover transition-colors flex items-center"
          >
            <span className="material-icons text-[18px]">adjust</span>
            <span className="text-[12px]"> Hide</span>
          </button>
          <button
            onClick={() => eyeRef.current?.showDot()}
            title="顯示視線點"
            className="p-2 rounded-xl bg-muted text-text-secondary hover:bg-hover transition-colors flex items-center"
          >
            <span className="material-icons text-[18px]">adjust</span>
            <span className="text-[12px]"> Show</span>
          </button>
          <button
            onClick={() => eyeRef.current?.refresh()}
            title="清除校準數據"
            className="p-2 rounded-xl bg-muted text-text-secondary hover:bg-hover transition-colors flex items-center"
          >
            <span className="material-icons text-[18px]">refresh</span>
          </button>
        </>
      )}
    </div>
  );

  const eyeSettingsPanel = (
    <div className="px-6 py-4 bg-card border-b border-border flex flex-wrap gap-6">
      {(
        [
          { key: 'top',       label: '上觸發區',  min: 0.05, max: 0.5,  step: 0.05, fmt: (v: number) => `${Math.round(v * 100)}%` },
          { key: 'bottom',    label: '下觸發區',  min: 0.05, max: 0.5,  step: 0.05, fmt: (v: number) => `${Math.round(v * 100)}%` },
          { key: 'speed',     label: '移動速度',  min: 1,    max: 30,   step: 1,    fmt: (v: number) => `${v} px` },
          { key: 'frequency', label: '更新頻率',  min: 5,    max: 60,   step: 1,    fmt: (v: number) => `${v} Hz` },
        ] as const
      ).map(({ key, label, min, max, step, fmt }) => (
        <label key={key} className="flex flex-col gap-1.5 min-w-[140px]">
          <div className="flex justify-between text-[10px] font-black text-muted-foreground tracking-widest">
            <span>{label}</span>
            <span className="text-primary">{fmt(eyeSettings[key])}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={eyeSettings[key]}
            onChange={e => setEyeSettings(prev => ({ ...prev, [key]: key === 'top' || key === 'bottom' ? parseFloat(e.target.value) : parseInt(e.target.value) }))}
            className="w-full accent-primary"
          />
        </label>
      ))}
    </div>
  );

  return (
    <div className={`${fullscreen ? 'min-h-screen' : 'h-screen'} bg-background text-foreground font-sans`}>
      {fullscreen && (
        <>
          <div
            className="sticky top-0 z-40 flex items-center gap-2 px-3 pb-1.5 bg-card/80 backdrop-blur border-b border-border"
            style={{ paddingTop: 'calc(6px + env(safe-area-inset-top))' }}
          >
            {eyeControls}
            <button
              onClick={() => setFullscreen(false)}
              title="離開全螢幕"
              className="ml-auto p-2 rounded-xl bg-muted text-muted-foreground hover:bg-hover transition-colors flex items-center"
            >
              <span className="material-icons text-[18px]">fullscreen_exit</span>
            </button>
          </div>
          {showEyeSettings && eyeSettingsPanel}
        </>
      )}

      {!fullscreen && <>
      <div className="bg-card border-b border-border px-6 py-5">
        <h1 className="text-2xl font-black tracking-tight">{title || '未命名'}</h1>
        <div className="flex flex-wrap gap-3 text-[11px] font-bold text-muted-foreground tracking-widest mt-1.5">
          {artist && <><span>{artist}</span><span>•</span></>}
          {key && <><span>{key} 調</span><span>•</span></>}
          <span>{bpm} BPM</span>
          {capo > 0 && <><span>•</span><span>Capo {capo}</span></>}
        </div>
      </div>

      <div className="px-6 py-4 flex flex-wrap items-center gap-4 border-b border-border bg-card/80">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-muted-foreground tracking-widest">每行小節</span>
          {[1, 2, 3, 4, 6, 8].map(n => (
            <button
              key={n}
              onClick={() => setMeasuresPerRow(n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${measuresPerRow === n ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-text-secondary hover:bg-hover'}`}
            >{n}</button>
          ))}
        </div>

        <div className="w-px h-5 bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-muted-foreground tracking-widest">移調</span>
          <button
            onClick={() => setTransposeOffset(o => o - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-text-secondary hover:bg-hover font-bold text-xs transition-all"
          >↓ 1</button>
          {transposeOffset !== 0 && (
            <span className={`text-xs font-black px-2 py-1 rounded-lg ${transposeOffset > 0 ? 'bg-primary-subtle text-primary' : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'}`}>
              {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
            </span>
          )}
          <button
            onClick={() => setTransposeOffset(o => o + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-text-secondary hover:bg-hover font-bold text-xs transition-all"
          >↑ 1</button>
          {transposeOffset !== 0 && (
            <button
              onClick={() => setTransposeOffset(0)}
              className="px-2 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-hover text-xs font-bold transition-all"
            >重置</button>
          )}
        </div>

        <div className="w-px h-5 bg-border hidden sm:block" />

        <button
          onClick={() => setShowChordPhoto(v => !v)}
          title={showChordPhoto ? '隱藏和弦圖' : '顯示和弦圖'}
          className={`p-2 rounded-xl transition-colors flex items-center ${showChordPhoto ? 'bg-primary-subtle text-primary' : 'bg-muted text-muted-foreground hover:bg-hover'}`}
        >
          <span className="material-icons text-[18px]">piano</span>
        </button>

        <button
          onClick={() => setLyricsOnly(v => !v)}
          title={lyricsOnly ? '顯示六線譜' : '只顯示和弦與歌詞'}
          className={`p-2 rounded-xl transition-colors flex items-center ${lyricsOnly ? 'bg-primary-subtle text-primary' : 'bg-muted text-muted-foreground hover:bg-hover'}`}
        >
          <span className="material-icons text-[18px]">lyrics</span>
        </button>

        <button
          onClick={() => setFullscreen(true)}
          title="全螢幕"
          className="p-2 rounded-xl transition-colors flex items-center bg-muted text-muted-foreground hover:bg-hover"
        >
          <span className="material-icons text-[18px]">fullscreen</span>
        </button>

        <div className="relative" ref={chordShapeMenuRef}>
          <button
            onClick={() => setShowChordShapeMenu(v => !v)}
            title="切換和弦型態"
            className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${chordShape || showChordShapeMenu ? 'bg-primary-subtle text-primary' : 'bg-muted text-muted-foreground hover:bg-hover'}`}
          >
            <span className="material-icons text-[18px]">grid_view</span>
            {chordShape && (
              <span className="text-[10px] font-black tracking-widest">
                {chordShape === 'Open' ? 'OPEN' : chordShape}
              </span>
            )}
          </button>
          {showChordShapeMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card rounded-xl shadow-lg border border-border py-1 z-50 min-w-30">
              <button
                onClick={() => { setChordShape(null); setShowChordShapeMenu(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${chordShape === null ? 'text-primary font-bold' : 'text-text-secondary'}`}
              >
                預設
              </button>
              {(['Open', 'A', 'E'] as const).map(shape => (
                <button
                  key={shape}
                  onClick={() => { setChordShape(shape); setShowChordShapeMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${chordShape === shape ? 'text-primary font-bold' : 'text-text-secondary'}`}
                >
                  {shape === 'Open' ? '開放和弦' : `封閉和弦 ${shape} 型`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border hidden sm:block" />

        {eyeControls}
      </div>

      {showEyeSettings && eyeSettingsPanel}

      </>}

      <div
        className={fullscreen ? 'px-3 space-y-6' : 'px-6 py-8 space-y-8 pb-24'}
        style={fullscreen ? { paddingTop: '8px', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' } : undefined}
      >
        {displayData.measures.length === 0 ? (
          <div className="text-center text-muted-foreground font-bold py-16">尚無小節</div>
        ) : (
          groups.map((group, gi) => (
            <div key={gi} className="flex gap-4">
              {group.map(measure => (
                <MeasureView key={measure.id} measure={measure} subdivisions={subdivisions} showChordPhoto={showChordPhoto} lyricsOnly={lyricsOnly} />
              ))}
              {Array.from({ length: measuresPerRow - group.length }).map((_, i) => (
                <div key={i} className="flex-1 min-w-0" />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Play;
