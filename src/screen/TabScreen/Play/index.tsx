import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GuitarChordPhoto } from '../../../components/GuitarChord';
import { CHORD_DATA } from '../../../components/GuitarChord/constants';
import { transposeTabData, migrateTabData, decodeBeatChord } from '../Editor/utils';
import type { TabData } from '../../../types';
import { EyeScroller } from '../../../components/EyeScroller';

const STRING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E'];

interface PlayProps {
  tabData: TabData;
}

const MeasureView: React.FC<{ measure: TabData['measures'][0]; subdivisions: number; showChordPhoto: boolean }> = ({ measure, subdivisions, showChordPhoto }) => {
  const chordPositions = measure.chord ? CHORD_DATA[measure.chord] : null;
  const chordPhoto = chordPositions?.[measure.chordPositionIndex ?? 0] ?? null;

  return (
    <div className="flex-1 min-w-[260px] rounded-3xl space-y-4">
      <div className="flex items-center gap-3 h-[100px]">
        <span className="text-2xl font-black tracking-tighter text-zinc-800 leading-none">
          {measure.chord || '-'}
        </span>
        {showChordPhoto && chordPhoto && <GuitarChordPhoto chord={chordPhoto} size="sm" isShowTitle={false} />}
        <span className="ml-auto text-[10px] font-black text-zinc-300 tracking-widest">#{measure.id}</span>
      </div>

      <div className="relative bg-zinc-50 rounded-2xl p-5 py-2 pl-8">
        <div
          className="relative min-h-24 grid gap-0"
          style={{ gridTemplateColumns: `repeat(${subdivisions}, 1fr)` }}
        >
          <div className="absolute inset-0 flex flex-col justify-between py-3 pointer-events-none">
            {STRING_LABELS.map((label, i) => (
              <div key={i} className="relative w-full h-px bg-zinc-200">
                <span className="absolute -left-6 -top-2 text-[9px] font-black text-zinc-400 w-5 text-right">{label}</span>
              </div>
            ))}
          </div>

          {[...Array(subdivisions)].map((_, b) => {
            const beat = measure.notes[b] ?? null;
            const frets = Array.isArray(beat) ? beat : null;
            const beatChordRaw = typeof beat === 'string' ? beat : null;
            const beatChordDecoded = beatChordRaw ? decodeBeatChord(beatChordRaw) : null;
            const beatChordName = beatChordDecoded?.name ?? null;
            const beatChordPhoto = beatChordName
              ? (CHORD_DATA[beatChordName]?.[beatChordDecoded!.idx] ?? CHORD_DATA[beatChordName]?.[0] ?? null)
              : null;

            return (
              <div key={b} className="relative h-full border-l border-zinc-200/60 first:border-l-0 flex flex-col justify-between py-3 px-0.5">
                {beatChordName && (
                  showChordPhoto ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <GuitarChordPhoto chord={beatChordPhoto} size="xs" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-black text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full leading-none">
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
                        <span className="w-4 h-4 rounded-full bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-[10px] shadow-sm">
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
        <p className="text-sm text-zinc-500 font-medium leading-relaxed">{measure.lyrics}</p>
      )}
    </div>
  );
};

const Play: React.FC<PlayProps> = ({ tabData }) => {
  const [measuresPerRow, setMeasuresPerRow] = useState(2);
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [showChordPhoto, setShowChordPhoto] = useState(true);
  const [eyeActive, setEyeActive] = useState(false);
  const [eyeLoading, setEyeLoading] = useState(false);
  const [showEyeSettings, setShowEyeSettings] = useState(false);
  const [eyeSettings, setEyeSettings] = useState({ top: 0.2, bottom: 0.45, speed: 8, frequency: 20 });

  const eyeRef = useRef<EyeScroller | null>(null);

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

  const displayData = useMemo(
    () => transposeOffset !== 0 ? transposeTabData(migratedData, transposeOffset) : migratedData,
    [migratedData, transposeOffset]
  );

  if (!tabData?.measures) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 font-bold">無譜面資料</div>
  );

  const { title, artist, bpm, capo, subdivisions } = displayData;
  const key = displayData.key;

  const groups = Array.from(
    { length: Math.ceil(displayData.measures.length / measuresPerRow) },
    (_, i) => displayData.measures.slice(i * measuresPerRow, (i + 1) * measuresPerRow)
  );

  return (
    <div className="h-screen bg-zinc-50 text-zinc-900 font-sans">
      <div className="bg-white border-b border-zinc-100 px-6 py-5">
        <h1 className="text-2xl font-black tracking-tight">{title || '未命名'}</h1>
        <div className="flex flex-wrap gap-3 text-[11px] font-bold text-zinc-400 tracking-widest mt-1.5">
          {artist && <><span>{artist}</span><span>•</span></>}
          {key && <><span>{key} 調</span><span>•</span></>}
          <span>{bpm} BPM</span>
          {capo > 0 && <><span>•</span><span>Capo {capo}</span></>}
        </div>
      </div>

      <div className="px-6 py-4 flex flex-wrap items-center gap-4 border-b border-zinc-100 bg-white/80">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-400 tracking-widest">每行小節</span>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setMeasuresPerRow(n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${measuresPerRow === n ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
            >{n}</button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-400 tracking-widest">移調</span>
          <button
            onClick={() => setTransposeOffset(o => o - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold text-xs transition-all"
          >↓ 1</button>
          {transposeOffset !== 0 && (
            <span className={`text-xs font-black px-2 py-1 rounded-lg ${transposeOffset > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
            </span>
          )}
          <button
            onClick={() => setTransposeOffset(o => o + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold text-xs transition-all"
          >↑ 1</button>
          {transposeOffset !== 0 && (
            <button
              onClick={() => setTransposeOffset(0)}
              className="px-2 py-1.5 rounded-lg bg-zinc-100 text-zinc-400 hover:bg-zinc-200 text-xs font-bold transition-all"
            >重置</button>
          )}
        </div>

        <div className="w-px h-5 bg-zinc-200 hidden sm:block" />

        <button
          onClick={() => setShowChordPhoto(v => !v)}
          title={showChordPhoto ? '隱藏和弦圖' : '顯示和弦圖'}
          className={`p-2 rounded-xl transition-colors flex items-center ${showChordPhoto ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
        >
          <span className="material-icons text-[18px]">piano</span>
        </button>

        <div className="w-px h-5 bg-zinc-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <button
            onClick={handleEyeToggle}
            disabled={eyeLoading}
            title={eyeActive ? '關閉視線捲動' : '開啟視線捲動'}
            className={`p-2 rounded-xl transition-colors flex items-center ${eyeActive ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'} disabled:opacity-50`}
          >
            <span className={`material-icons text-[18px] ${eyeLoading ? 'animate-spin' : ''}`}>
              {eyeLoading ? 'sync' : 'visibility'}
            </span>
          </button>

          <button
            onClick={() => setShowEyeSettings(v => !v)}
            title="視線捲動設定"
            className={`p-2 rounded-xl transition-colors flex items-center ${showEyeSettings ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
          >
            <span className="material-icons text-[18px]">tune</span>
          </button>

          {eyeActive && (
            <>
              <button
                onClick={() => eyeRef.current?.adjust()}
                title="校準視線"
                className="p-2 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors flex items-center"
              >
                <span className="material-icons text-[18px]">track_changes</span>
              </button>
              <button
                onClick={() => eyeRef.current?.hideDot()}
                title="關閉視線點"
                className="p-2 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors flex items-center"
              >
                <span className="material-icons text-[18px]">adjust</span>
                <span className="text-[12px]"> Hide</span>
              </button>
              <button
                onClick={() => eyeRef.current?.showDot()}
                title="顯示視線點"
                className="p-2 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors flex items-center"
              >
                <span className="material-icons text-[18px]">adjust</span>
                <span className="text-[12px]"> Show</span>
              </button>
              <button
                onClick={() => eyeRef.current?.refresh()}
                title="清除校準數據"
                className="p-2 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors flex items-center"
              >
                <span className="material-icons text-[18px]">refresh</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showEyeSettings && (
        <div className="px-6 py-4 bg-white border-b border-zinc-100 flex flex-wrap gap-6">
          {(
            [
              { key: 'top',       label: '上觸發區',  min: 0.05, max: 0.5,  step: 0.05, fmt: (v: number) => `${Math.round(v * 100)}%` },
              { key: 'bottom',    label: '下觸發區',  min: 0.05, max: 0.5,  step: 0.05, fmt: (v: number) => `${Math.round(v * 100)}%` },
              { key: 'speed',     label: '移動速度',  min: 1,    max: 30,   step: 1,    fmt: (v: number) => `${v} px` },
              { key: 'frequency', label: '更新頻率',  min: 5,    max: 60,   step: 1,    fmt: (v: number) => `${v} Hz` },
            ] as const
          ).map(({ key, label, min, max, step, fmt }) => (
            <label key={key} className="flex flex-col gap-1.5 min-w-[140px]">
              <div className="flex justify-between text-[10px] font-black text-zinc-400 tracking-widest">
                <span>{label}</span>
                <span className="text-indigo-500">{fmt(eyeSettings[key])}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={eyeSettings[key]}
                onChange={e => setEyeSettings(prev => ({ ...prev, [key]: key === 'top' || key === 'bottom' ? parseFloat(e.target.value) : parseInt(e.target.value) }))}
                className="w-full accent-indigo-500"
              />
            </label>
          ))}
        </div>
      )}

      <div className="px-6 py-8 space-y-8 pb-24">
        {displayData.measures.length === 0 ? (
          <div className="text-center text-zinc-400 font-bold py-16">尚無小節</div>
        ) : (
          groups.map((group, gi) => (
            <div key={gi} className="flex gap-4 flex-wrap">
              {group.map(measure => (
                <MeasureView key={measure.id} measure={measure} subdivisions={subdivisions} showChordPhoto={showChordPhoto} />
              ))}
              {Array.from({ length: measuresPerRow - group.length }).map((_, i) => (
                <div key={i} className="flex-1 min-w-[260px]" />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Play;
