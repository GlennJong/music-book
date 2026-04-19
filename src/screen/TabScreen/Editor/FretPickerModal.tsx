import React from 'react';
import { STRING_BASE_MIDI } from './utils';

interface FretPickerModalProps {
  onClose: () => void;
  onSelect: (fret: number | null) => void;
  chordNotes?: number[];
  activeString?: number;
}

const FRETS = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;

const FretPickerModal: React.FC<FretPickerModalProps> = ({ onClose, onSelect, chordNotes = [], activeString }) => {
  const isChordFret = (fret: number): boolean => {
    if (!chordNotes.length || activeString == null) return false;
    const pitchClass = (STRING_BASE_MIDI[activeString - 1] + fret) % 12;
    return chordNotes.includes(pitchClass);
  };

  return (
    <>
      <div className="fixed inset-0 z-55 bg-transparent" onClick={onClose} />
      <div className="absolute bottom-16 z-60 bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl p-7 w-72 animate-in slide-in-from-bottom-6 duration-300 ring-1 ring-black/5">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] px-1">Fret Selection</span>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-500 flex items-center">
            <span className="material-icons text-[16px]">close</span>
          </button>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {FRETS.map(f => (
            <button
              key={f === null ? 'x' : f}
              onClick={() => onSelect(f)}
              className={`h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                f === null
                  ? 'bg-red-50 text-red-500 border border-red-100'
                  : isChordFret(f)
                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              {f === null ? <span className="material-icons text-[14px]">delete</span> : f}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default FretPickerModal;
