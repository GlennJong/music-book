import React from 'react';

interface ControlsBarProps {
  isEditMode: boolean;
  subdivisions: number;
  onSubdivisionsChange: (value: number) => void;
  keyLabel: string;
  onKeyChange: (value: string) => void;
  bpm: number;
  onBpmChange: (value: number) => void;
  artist: string;
  onArtistChange: (value: string) => void;
  capo: number;
  onCapoChange: (value: number) => void;
  measuresPerRow: number;
  onMeasuresPerRowChange: (value: number) => void;
  onTranspose: (semitones: number) => void;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-3">
    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">{label}</label>
    {children}
  </div>
);

const Divider = () => <div className="h-10 w-px bg-zinc-100 hidden md:block" />;

const ControlsBar: React.FC<ControlsBarProps> = ({
  isEditMode, subdivisions, onSubdivisionsChange,
  keyLabel, onKeyChange, bpm, onBpmChange,
  artist, onArtistChange, capo, onCapoChange,
  measuresPerRow, onMeasuresPerRowChange, onTranspose,
}) => (
  <div className="bg-white p-8 rounded-3xl border border-zinc-200/60 shadow-sm flex flex-wrap gap-10 items-center animate-in fade-in duration-500">
    <Field label="歌手 (Artist)">
      {isEditMode ? (
        <input
          value={artist}
          onChange={e => onArtistChange(e.target.value)}
          placeholder="歌手名稱"
          className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-400 w-40"
        />
      ) : (
        <span className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-100 font-bold text-sm text-zinc-600">{artist || '—'}</span>
      )}
    </Field>

    <Divider />

    <Field label="調性 (Key)">
      {isEditMode ? (
        <input
          value={keyLabel}
          onChange={e => onKeyChange(e.target.value)}
          placeholder="如 C, Am"
          className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 font-black text-sm text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-400 w-24 uppercase"
        />
      ) : (
        <span className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 font-black text-indigo-600 text-sm uppercase">{keyLabel || '—'} 調</span>
      )}
    </Field>

    <Divider />

    <Field label="BPM">
      {isEditMode ? (
        <input
          type="number"
          value={bpm || ''}
          onChange={e => onBpmChange(Number(e.target.value))}
          placeholder="120"
          min={20}
          max={300}
          className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-400 w-24"
        />
      ) : (
        <span className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-100 font-bold text-sm text-zinc-600">{bpm || '—'} BPM</span>
      )}
    </Field>

    <Divider />

    <Field label="Capo">
      {isEditMode ? (
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => onCapoChange(n)}
              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${capo === n ? 'bg-zinc-900 text-white shadow' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
            >{n}</button>
          ))}
        </div>
      ) : (
        <span className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-100 font-bold text-sm text-zinc-600">{capo > 0 ? `Capo ${capo}` : '無 Capo'}</span>
      )}
    </Field>

    <Divider />

    <Field label="移調 (Transpose)">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTranspose(-1)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold text-sm transition-all"
        >
          <span className="material-icons text-[16px]">arrow_downward</span>
          ↓ 1
        </button>
        <button
          onClick={() => onTranspose(1)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold text-sm transition-all"
        >
          <span className="material-icons text-[16px]">arrow_upward</span>
          ↑ 1
        </button>
      </div>
    </Field>

    <Divider />

    <Field label="小節分段 (Subdivisions)">
      <div className="flex items-center gap-2">
        {[2, 4, 8].map(num => (
          <button
            key={num}
            onClick={() => isEditMode && onSubdivisionsChange(num)}
            disabled={!isEditMode}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${subdivisions === num ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400'} ${!isEditMode ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-200'}`}
          >
            {num}
          </button>
        ))}
      </div>
    </Field>

    <Divider />

    <Field label="每列顯示小節數">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 6, 8].map(num => (
          <button
            key={num}
            onClick={() => onMeasuresPerRowChange(num)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${measuresPerRow === num ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
          >
            {num}
          </button>
        ))}
      </div>
    </Field>
  </div>
);

export default ControlsBar;
