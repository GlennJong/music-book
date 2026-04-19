import React, { useState, useMemo, useEffect } from 'react';
import { CHORD_DATA, ENHARMONIC_MAP, ROOT_NOTES, SUFFIXES } from './constants';

/** * ==========================================
 * 1. 共享型別與資料庫
 * ==========================================
 */
interface Barre {
  fret: number;
  from: number;
  to: number;
}

interface ChordPosition {
  name: string;
  chord: (number | null)[];
  startFret?: number;
  barre?: Barre;
}


/** * ==========================================
 * 2. GuitarChordPhoto 元件 (純渲染)
 * ==========================================
 */
interface PhotoProps {
  chord: ChordPosition | null;
}

// eslint-disable-next-line react-refresh/only-export-components
const GuitarChordPhoto: React.FC<PhotoProps> = ({ chord }) => {
  if (!chord) return (
    <div className="flex flex-col items-center justify-center h-80 w-64 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300">
      <span className="material-icons text-slate-300 text-5xl mb-2">auto_graph</span>
      <p className="text-slate-400 font-bold text-sm">請選擇和弦</p>
    </div>
  );

  const { chord: positions, startFret = 1, barre, name } = chord;
  const GRID_WIDTH = 120, GRID_HEIGHT = 150, MARGIN_TOP = 40, MARGIN_LEFT = 35;
  const STRINGS = 6, FRETS = 5;
  const STEP_X = GRID_WIDTH / (STRINGS - 1), STEP_Y = GRID_HEIGHT / FRETS;

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
      <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight uppercase">{name}</h3>
      <svg width={GRID_WIDTH + MARGIN_LEFT + 20} height={GRID_HEIGHT + MARGIN_TOP + 20} viewBox={`0 0 ${GRID_WIDTH + MARGIN_LEFT + 20} ${GRID_HEIGHT + MARGIN_TOP + 20}`}>
        {startFret > 1 && <text x={MARGIN_LEFT - 12} y={MARGIN_TOP + STEP_Y / 2 + 5} textAnchor="end" fontSize="12" fontWeight="bold" fill="#4F46E5">{startFret}fr</text>}
        
        {positions.map((fret, i) => {
          const x = MARGIN_LEFT + i * STEP_X;
          const yMark = MARGIN_TOP - 12;
          if (fret === null) return <text key={i} x={x} y={yMark} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#94a3b8">X</text>;
          if (fret === 0) return <circle key={i} cx={x} cy={yMark - 5} r={STEP_X * 0.22} fill="none" stroke="#64748b" strokeWidth="1.5" />;
          return null;
        })}
        
        <g stroke="#1e293b" strokeWidth="1.5">
          {[...Array(STRINGS)].map((_, i) => <line key={i} x1={MARGIN_LEFT + i * STEP_X} y1={MARGIN_TOP} x2={MARGIN_LEFT + i * STEP_X} y2={MARGIN_TOP + GRID_HEIGHT} />)}
          {[...Array(FRETS + 1)].map((_, i) => <line key={i} x1={MARGIN_LEFT} y1={MARGIN_TOP + i * STEP_Y} x2={MARGIN_LEFT + GRID_WIDTH} y2={MARGIN_TOP + i * STEP_Y} strokeWidth={i === 0 && startFret === 1 ? "8" : "1.2"} />)}
        </g>

        {barre && (
          <rect 
            x={MARGIN_LEFT + (barre.from - 1) * STEP_X - 6} 
            y={MARGIN_TOP + (barre.fret - startFret) * STEP_Y + STEP_Y / 2 - 8} 
            width={(barre.to - barre.from) * STEP_X + 12} height={16} rx={8} fill="#1e293b" 
          />
        )}

        {positions.map((fret, i) => {
          if (fret === null || fret === 0) return null;
          if (barre && fret === barre.fret && (i + 1) >= barre.from && (i + 1) <= barre.to) return null;
          const x = MARGIN_LEFT + i * STEP_X;
          const y = MARGIN_TOP + (fret - startFret) * STEP_Y + STEP_Y / 2;
          return <circle key={i} cx={x} cy={y} r={STEP_X * 0.35} fill="#1e293b" />;
        })}
      </svg>
    </div>
  );
};

/** * ==========================================
 * 3. GuitarChordSelector 元件 (邏輯控制)
 * ==========================================
 */
interface SelectorProps {
  onChange: (chord: ChordPosition | null) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
const GuitarChordSelector: React.FC<SelectorProps> = ({ onChange }) => {
  const [root, setRoot] = useState("C");
  const [suffix, setSuffix] = useState("");
  const [voicingIdx, setVoicingIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [showSug, setShowSug] = useState(false);

  const currentList = useMemo(() => {
    let key = `${root}${suffix}`;
    for (const [alias, real] of Object.entries(ENHARMONIC_MAP)) {
      if (key.startsWith(alias)) { key = key.replace(alias, real); break; }
    }
    return CHORD_DATA[key] || null;
  }, [root, suffix]);

  useEffect(() => {
    if (currentList) onChange(currentList[voicingIdx]);
    else onChange(null);
  }, [currentList, voicingIdx, onChange]);

  const handleSugClick = (key: string) => {
    const matchedRoot = [...ROOT_NOTES].sort((a,b) => b.length - a.length).find(r => key.startsWith(r));
    if (matchedRoot) {
      setRoot(matchedRoot);
      setSuffix(key.slice(matchedRoot.length));
      setVoicingIdx(0);
      setSearch("");
      setShowSug(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 智慧搜尋 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="material-icons text-slate-400">search</span>
        </div>
        <input 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          placeholder="快速搜尋 (例: Am7)..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowSug(true); }}
        />
        {showSug && search && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden">
            {Object.keys(CHORD_DATA).filter(k => k.toLowerCase().includes(search.toLowerCase())).slice(0, 5).map(k => (
              <button key={k} className="w-full text-left px-5 py-3 hover:bg-indigo-50 font-bold text-slate-600" onClick={() => handleSugClick(k)}>{k}</button>
            ))}
          </div>
        )}
      </div>

      {/* 選單切換 */}
      <div className="grid grid-cols-2 gap-3">
        <select className="bg-white p-3 rounded-xl border border-slate-200 font-bold outline-none appearance-none cursor-pointer" value={root} onChange={(e) => { setRoot(e.target.value); setVoicingIdx(0); }}>
          {ROOT_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className="bg-white p-3 rounded-xl border border-slate-200 font-bold outline-none appearance-none cursor-pointer" value={suffix} onChange={(e) => { setSuffix(e.target.value); setVoicingIdx(0); }}>
          {SUFFIXES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* 指法變體切換 */}
      {currentList && currentList.length > 1 && (
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button disabled={voicingIdx === 0} onClick={() => setVoicingIdx(v => v - 1)} className="p-2 text-indigo-600 disabled:text-slate-200"><span className="material-icons">chevron_left</span></button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">指法變體 {voicingIdx + 1}/{currentList.length}</span>
          <button disabled={voicingIdx === currentList.length - 1} onClick={() => setVoicingIdx(v => v + 1)} className="p-2 text-indigo-600 disabled:text-slate-200"><span className="material-icons">chevron_right</span></button>
        </div>
      )}
    </div>
  );
};


export default { GuitarChordSelector, GuitarChordPhoto };