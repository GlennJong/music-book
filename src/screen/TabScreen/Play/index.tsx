import React, { useMemo, useState } from 'react';
import { GuitarChordPhoto } from '../../../components/GuitarChord';
import { CHORD_DATA } from '../../../components/GuitarChord/constants';
import { transposeTabData } from '../Editor/utils';
import type { TabData } from '../../../types';

const STRING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E'];

interface PlayProps {
  tabData: TabData;
}

const MeasureView: React.FC<{ measure: TabData['measures'][0]; subdivisions: number }> = ({ measure, subdivisions }) => {
  const chordPositions = measure.chord ? CHORD_DATA[measure.chord] : null;
  const chordPhoto = chordPositions?.[measure.chordPositionIndex ?? 0] ?? null;

  return (
    <div className="flex-1 min-w-[260px] bg-white rounded-3xl border border-zinc-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black tracking-tighter text-zinc-800 uppercase leading-none">
          {measure.chord || '-'}
        </span>
        <GuitarChordPhoto chord={chordPhoto} size="sm" isShowTitle={false} />
        <span className="ml-auto text-[10px] font-black text-zinc-300 uppercase tracking-widest">#{measure.id}</span>
      </div>

      <div className="relative bg-zinc-50 rounded-2xl p-5 pl-8">
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

          {[...Array(subdivisions)].map((_, b) => (
            <div key={b} className="relative h-full border-l border-zinc-200/60 first:border-l-0 flex flex-col justify-between py-3 px-0.5">
              {[...Array(6)].map((_, s) => {
                const note = measure.notes.find(n => n.string === s + 1 && n.beat === b);
                return (
                  <div key={s} className="w-full h-1 flex items-center justify-center">
                    {note != null && (
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-[10px] shadow-sm">
                        {note.fret}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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

  const displayData = useMemo(
    () => transposeOffset !== 0 ? transposeTabData(tabData, transposeOffset) : tabData,
    [tabData, transposeOffset]
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <div className="bg-white border-b border-zinc-100 px-6 py-5">
        <h1 className="text-2xl font-black tracking-tight uppercase">{title || '未命名'}</h1>
        <div className="flex flex-wrap gap-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">
          {artist && <><span>{artist}</span><span>•</span></>}
          {key && <><span>{key} 調</span><span>•</span></>}
          <span>{bpm} BPM</span>
          {capo > 0 && <><span>•</span><span>Capo {capo}</span></>}
        </div>
      </div>

      <div className="px-6 py-4 flex flex-wrap items-center gap-4 border-b border-zinc-100 bg-white/80">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">每行小節</span>
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
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">移調</span>
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
      </div>

      <div className="px-6 py-8 space-y-8">
        {displayData.measures.length === 0 ? (
          <div className="text-center text-zinc-400 font-bold py-16">尚無小節</div>
        ) : (
          groups.map((group, gi) => (
            <div key={gi} className="flex gap-4 flex-wrap">
              {group.map(measure => (
                <MeasureView key={measure.id} measure={measure} subdivisions={subdivisions} />
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
