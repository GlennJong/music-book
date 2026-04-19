import React, { useState, useMemo, useEffect } from 'react';
import { CHORD_DATA, ROOT_NOTES, SUFFIXES, type ChordPosition } from './constants';


interface PhotoProps {
  chord: ChordPosition | null;
  isShowTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GuitarChordPhoto: React.FC<PhotoProps> = ({ chord, isShowTitle = true, size = 'lg' }) => {
  if (!chord) return (
    <>-</>
    // <div className="flex flex-col items-center justify-center h-64 w-48 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
    //   <span className="material-icons text-slate-200 text-4xl mb-2">music_off</span>
    //   <p className="text-slate-300 font-bold text-xs">無此指法</p>
    // </div>
  );

  const { chord: pos, startFret = 1, barre, name } = chord;
  const cfg = {
    lg: { w: 120, h: 150, mt: 40, ml: 35, p: 'p-8', ts: 'text-xl', ms: 14, ls: 12 },
    md: { w: 90, h: 112, mt: 35, ml: 30, p: 'p-4', ts: 'text-lg', ms: 12, ls: 10 },
    sm: { w: 60, h: 75, mt: 30, ml: 25, p: 'p-2', ts: 'text-sm', ms: 10, ls: 8 }
  }[size];

  const SX = cfg.w / 5, SY = cfg.h / 5;

  return (
    <div className={`flex flex-col items-center bg-white rounded-3xl border border-slate-100 animate-in fade-in zoom-in duration-300 ${cfg.p}`}>
      {isShowTitle && <h3 className={`font-black text-slate-800 mb-4 tracking-tight ${cfg.ts}`}>{name}</h3>}
      <svg width={cfg.w + cfg.ml + 20} height={cfg.h + cfg.mt + 20} viewBox={`0 0 ${cfg.w + cfg.ml + 20} ${cfg.h + cfg.mt + 20}`}>
        {startFret > 1 && <text x={cfg.ml - 10} y={cfg.mt + SY / 2 + (cfg.ls / 2)} textAnchor="end" fontSize={cfg.ls} fontWeight="bold" fill="#4F46E5">{startFret}fr</text>}
        {pos.map((f, i) => {
          const x = cfg.ml + i * SX, ym = cfg.mt - 12;
          if (f === null) return <text key={i} x={x} y={ym} textAnchor="middle" fontSize={cfg.ms} fontWeight="bold" fill="#94a3b8">X</text>;
          if (f === 0) return <circle key={i} cx={x} cy={ym - 5} r={SX * 0.22} fill="none" stroke="#64748b" strokeWidth="1.5" />;
          return null;
        })}
        <g stroke="#1e293b" strokeWidth="1.5">
          {[...Array(6)].map((_, i) => <line key={i} x1={cfg.ml + i * SX} y1={cfg.mt} x2={cfg.ml + i * SX} y2={cfg.mt + cfg.h} />)}
          {[...Array(6)].map((_, i) => <line key={i} x1={cfg.ml} y1={cfg.mt + i * SY} x2={cfg.ml + cfg.w} y2={cfg.mt + i * SY} strokeWidth={i === 0 && startFret === 1 ? "6" : "1.2"} />)}
        </g>
        {barre && <rect x={cfg.ml + (barre.from - 1) * SX - (SX * 0.2)} y={cfg.mt + (barre.fret - startFret) * SY + SY / 2 - (SY * 0.25)} width={(barre.to - barre.from) * SX + (SX * 0.4)} height={SY * 0.5} rx={SY * 0.25} fill="#1e293b" />}
        {pos.map((f, i) => {
          if (f === null || f === 0 || (barre && f === barre.fret && (i + 1) >= barre.from && (i + 1) <= barre.to)) return null;
          return <circle key={i} cx={cfg.ml + i * SX} cy={cfg.mt + (f - startFret) * SY + SY / 2} r={SX * 0.35} fill="#1e293b" />;
        })}
      </svg>
    </div>
  );
};

interface SelectorProps {
  onChange: (chord: ChordPosition | null) => void;
  defaultChord?: string;
}

const parseChordName = (chord: string): { root: string; suffix: string } => {
  const r = [...ROOT_NOTES].sort((a, b) => b.length - a.length).find(x => chord.startsWith(x));
  return r ? { root: r, suffix: chord.slice(r.length) } : { root: 'C', suffix: '' };
};

const GuitarChordSelector: React.FC<SelectorProps> = ({ onChange, defaultChord }) => {
  const initial = defaultChord ? parseChordName(defaultChord) : { root: 'C', suffix: '' };
  const [root, setRoot] = useState(initial.root);
  const [suffix, setSuffix] = useState(initial.suffix);
  const [shape, setShape] = useState("All");
  const [search, setSearch] = useState("");
  const [showSug, setShowSug] = useState(false);

  const fullList = useMemo(() => {
    const key = `${root}${suffix}`;
    return CHORD_DATA[key] || [];
  }, [root, suffix]);

  const filtered = useMemo(() => (shape === "All" ? fullList : fullList.filter(c => c.baseShape === shape)), [fullList, shape]);

  useEffect(() => onChange(filtered[0] || null), [filtered, onChange]);

  const handleSug = (k: string) => {
    const r = [...ROOT_NOTES].sort((a,b) => b.length - a.length).find(x => k.startsWith(x));
    if (r) { setRoot(r); setSuffix(k.slice(r.length)); setSearch(""); setShowSug(false); setShape("All"); }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
        <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="快速搜尋 (如 Cmaj7)..." value={search} onChange={e => { setSearch(e.target.value); setShowSug(true); }} />
        {showSug && search && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl overflow-y-auto max-h-48 border">
            {Object.keys(CHORD_DATA).filter(k => k.toLowerCase().includes(search.toLowerCase())).slice(0, 8).map(k => (
              <button key={k} className="w-full text-left px-4 py-2 hover:bg-indigo-50 font-bold text-slate-600 text-sm" onClick={() => handleSug(k)}>{k}</button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className="bg-white p-2 rounded-lg border border-slate-200 font-bold outline-none text-sm appearance-none cursor-pointer" value={root} onChange={e => { setRoot(e.target.value); setShape("All"); }}>
          {ROOT_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className="bg-white p-2 rounded-lg border border-slate-200 font-bold outline-none text-sm appearance-none cursor-pointer" value={suffix} onChange={e => { setSuffix(e.target.value); setShape("All"); }}>
          {SUFFIXES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-black text-slate-400 tracking-widest ml-1">按法篩選</span>
        <div className="grid grid-cols-4 gap-1.5">
          {["All", "Open", "E", "A"].map(s => (
            <button key={s} disabled={s !== "All" && !fullList.some(c => c.baseShape === s)} onClick={() => setShape(s)} className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${shape === s ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 disabled:opacity-20"}`}>
              {s === "All" ? "auto" : `${s}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


export { GuitarChordSelector, GuitarChordPhoto };