import React, { useState } from 'react';
import MeasureActions from './MeasureActions';
import TextTabModal from './TextTabModal';
import FretPickerModal from './FretPickerModal';
import { GuitarChordSelector, GuitarChordPhoto } from '../../../components/GuitarChord';
import { CHORD_DATA } from '../../../components/GuitarChord/constants';
import type { ChordPosition } from '../../../components/GuitarChord/constants';
import { parseTextTabToNotes, getChordPitchClasses } from './utils';
import type { TabData } from '../../../types';

type Measure = TabData['measures'][0];

interface MeasureCardProps {
  measure: Measure;
  isEditMode: boolean;
  subdivisions: number;
  currentMeasure: number | null;
  currentBeat: number | null;
  canMovePrev: boolean;
  canMoveNext: boolean;
  onMovePrev: () => void;
  onMoveNext: () => void;
  onCopyNext: () => void;
  onCopyLast: () => void;
  onDelete: () => void;
  onUpdate: (measure: Measure) => void;
}

const STRING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E'];

const MeasureCard: React.FC<MeasureCardProps> = ({
  measure, isEditMode, subdivisions,
  currentMeasure, currentBeat,
  canMovePrev, canMoveNext, onMovePrev, onMoveNext, onCopyNext, onCopyLast, onDelete,
  onUpdate,
}) => {
  const [chordPickerOpen, setChordPickerOpen] = useState(false);
  const [pendingChord, setPendingChord] = useState<ChordPosition | null>(null);
  const [activeFretPicker, setActiveFretPicker] = useState<{ string: number; beat: number } | null>(null);
  const [textTabOpen, setTextTabOpen] = useState(false);

  const isActiveMeasure = currentMeasure === measure.id;
  const chordPositions = measure.chord ? CHORD_DATA[measure.chord] : null;
  const chordPhoto = chordPositions?.[measure.chordPositionIndex ?? 0] ?? null;
  const chordNotes = chordPhoto ? getChordPitchClasses(chordPhoto) : [];

  // --- Chord (no note linkage) ---

  const handleChordConfirm = () => {
    if (pendingChord) {
      const chordName = pendingChord.name.split(' ')[0];
      const positions = CHORD_DATA[chordName] ?? [];
      const positionIndex = positions.indexOf(pendingChord);
      const newNotes = measure.notes.map(note => {
        const f = pendingChord.chord[6 - note.string];
        return f != null ? { ...note, fret: f } : note;
      });
      onUpdate({ ...measure, chord: chordName, chordPositionIndex: positionIndex >= 0 ? positionIndex : 0, notes: newNotes });
    }
    setChordPickerOpen(false);
  };

  // --- Grid / Notes ---

  const handleGridClick = (stringNum: number, beat: number) => {
    const existingNote = measure.notes.find(n => n.string === stringNum && n.beat === beat);
    if (!existingNote && chordPhoto) {
      const f = chordPhoto.chord[6 - stringNum];
      if (f != null) {
        onUpdate({ ...measure, notes: [...measure.notes, { string: stringNum, fret: f, beat }] });
        return;
      }
    }
    setActiveFretPicker({ string: stringNum, beat });
  };

  const handleFretSelect = (fret: number | null) => {
    if (!activeFretPicker) return;
    const { string, beat } = activeFretPicker;
    const idx = measure.notes.findIndex(n => n.string === string && n.beat === beat);
    const newNotes = [...measure.notes];
    if (fret === null) {
      if (idx > -1) newNotes.splice(idx, 1);
    } else {
      if (idx > -1) newNotes[idx] = { ...newNotes[idx], fret };
      else newNotes.push({ string, fret, beat });
    }
    onUpdate({ ...measure, notes: newNotes });
    setActiveFretPicker(null);
  };

  const handleRemoveColumn = (beat: number) =>
    onUpdate({ ...measure, notes: measure.notes.filter(n => n.beat !== beat) });

  const handleCopyColumn = (beat: number) => {
    if (beat >= subdivisions - 1) return;
    const copied = measure.notes
      .filter(n => n.beat === beat)
      .map(n => ({ ...n, beat: beat + 1 }));
    const preserved = measure.notes.filter(n => n.beat !== beat + 1);
    onUpdate({ ...measure, notes: [...preserved, ...copied] });
  };

  const handleTextTabSave = (text: string) =>
    onUpdate({ ...measure, textTab: text, notes: parseTextTabToNotes(text, subdivisions) });

  return (
    <div className="relative flex-1 min-w-[320px]">
      {isEditMode && (
        <MeasureActions
          canMovePrev={canMovePrev}
          canMoveNext={canMoveNext}
          onMovePrev={onMovePrev}
          onMoveNext={onMoveNext}
          onTextTab={() => setTextTabOpen(true)}
          onCopyNext={onCopyNext}
          onCopyLast={onCopyLast}
          onDelete={onDelete}
        />
      )}

      {textTabOpen && (
        <TextTabModal
          initialText={measure.textTab || ''}
          onClose={() => setTextTabOpen(false)}
          onSave={handleTextTabSave}
        />
      )}

      {/* Chord section */}
      <div className="flex items-center gap-4 mb-4 px-2">
        <button
          onClick={() => isEditMode && setChordPickerOpen(true)}
          disabled={!isEditMode}
          className={`text-5xl font-black tracking-tighter leading-none transition-all disabled:pointer-events-none ${isEditMode ? 'text-indigo-600 hover:scale-105' : 'text-zinc-800'}`}
        >
          {measure.chord || '-'}
        </button>
        <GuitarChordPhoto chord={chordPhoto} size="sm" isShowTitle={false} />
        <div className="ml-auto text-[10px] font-black text-zinc-300 tracking-widest flex items-center gap-1">
          <span className="material-icons text-[12px]">straighten</span>
          #{measure.id}
        </div>
      </div>

      {/* Chord picker popup */}
      {chordPickerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setChordPickerOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] pointer-events-auto animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <h3 className="font-black text-xl tracking-tighter">設定和弦</h3>
                <button onClick={() => setChordPickerOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 flex items-center">
                  <span className="material-icons text-[22px]">close</span>
                </button>
              </div>
              <div className="overflow-y-auto flex gap-6 p-6">
                <GuitarChordSelector
                  defaultChord={measure.chord || undefined}
                  onChange={setPendingChord}
                />
                <div className="flex justify-center">
                  <GuitarChordPhoto chord={pendingChord} size="md" isShowTitle />
                </div>
              </div>
              <div className="flex justify-between gap-2 px-6 py-4 border-t border-zinc-100">
                <button
                  onClick={() => { onUpdate({ ...measure, chord: '', chordPositionIndex: undefined, notes: [] }); setChordPickerOpen(false); }}
                  className="px-5 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-bold"
                >清除和弦</button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChordPickerOpen(false)}
                    className="px-5 py-2 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 font-bold"
                  >取消</button>
                  <button
                    onClick={handleChordConfirm}
                    disabled={!pendingChord}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold disabled:opacity-40"
                  >確認</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Note grid */}
      <div className={`relative bg-white border-2 rounded-xl p-12 transition-all ${isActiveMeasure ? 'border-indigo-500 shadow-indigo-100 bg-indigo-50/10 ring-14 ring-indigo-50' : 'border-zinc-100'} ${isEditMode ? 'border-dashed border-amber-200' : ''}`}>
        <div
          className="relative min-h-56 grid gap-0"
          style={{ gridTemplateColumns: `repeat(${subdivisions}, 1fr)` }}
        >
          {/* String lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none">
            {STRING_LABELS.map((label, i) => (
              <div key={i} className="relative w-full h-px bg-zinc-100">
                <span className="absolute -left-16 -top-2.5 text-[10px] font-black text-zinc-400 w-12 text-right tracking-tighter">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Beat columns */}
          {[...Array(subdivisions)].map((_, b) => {
            const notesInColumn = measure.notes.filter(n => n.beat === b);
            const hasNotes = notesInColumn.length > 0;

            return (
              <div key={b} className="relative h-full border-l border-zinc-100/50 first:border-l-0 flex flex-col justify-between py-6 px-1">
                {/* Remove button — above column */}
                {isEditMode && hasNotes && (
                  <button
                    onClick={() => handleRemoveColumn(b)}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center"
                    title="清除此拍"
                  >
                    <span className="material-icons text-[14px]">remove_circle_outline</span>
                  </button>
                )}

                {/* String cells */}
                {[...Array(6)].map((_, s) => {
                  const stringNum = s + 1;
                  const note = measure.notes.find(n => n.string === stringNum && n.beat === b);
                  const isNoteActive = isActiveMeasure && currentBeat === b;
                  const isPicking = activeFretPicker?.string === stringNum && activeFretPicker?.beat === b;

                  return (
                    <div key={s} className="relative w-full h-1 flex items-center justify-center">
                      {note ? (
                        <button
                          disabled={!isEditMode}
                          onClick={() => handleGridClick(stringNum, b)}
                          className={`relative z-10 w-8 h-8 rounded-[1.25rem] flex items-center justify-center font-mono font-bold text-sm shadow-xl transition-all ${isNoteActive ? 'bg-indigo-600 text-white scale-110 ring-8 ring-indigo-100' : 'bg-zinc-900 text-white shadow-zinc-200'} ${isEditMode ? 'hover:scale-110 active:scale-95' : 'cursor-default'}`}
                        >
                          {note.fret}
                        </button>
                      ) : (
                        isEditMode && (
                          <button
                            onClick={() => handleGridClick(stringNum, b)}
                            className="w-9 h-9 rounded-2xl border-2 border-dashed border-zinc-100 text-zinc-100 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center group"
                          >
                            <span className="material-icons text-[18px] group-hover:scale-125 transition-transform">add</span>
                          </button>
                        )
                      )}

                      {isPicking && (
                        <FretPickerModal
                          onClose={() => setActiveFretPicker(null)}
                          onSelect={handleFretSelect}
                          chordNotes={chordNotes}
                          activeString={stringNum}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Copy button — below column */}
                {isEditMode && hasNotes && b < subdivisions - 1 && (
                  <button
                    onClick={() => handleCopyColumn(b)}
                    className="absolute -bottom-9 left-1/2 -translate-x-1/2 p-1.5 text-zinc-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all flex items-center"
                    title="複製到下一拍"
                  >
                    <span className="material-icons text-[14px]">content_copy</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Lyrics */}
        <div className="mt-4 pt-4 border-t-2 border-zinc-50 flex flex-col gap-4">
          <textarea
            disabled={!isEditMode}
            value={measure.lyrics || ''}
            onChange={e => onUpdate({ ...measure, lyrics: e.target.value })}
            placeholder={isEditMode ? '在這裡輸入歌詞...' : ''}
            className={`w-full bg-zinc-50/50 rounded-2xl p-5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-20 resize-none ${!isEditMode && 'bg-transparent text-zinc-500 px-0'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default MeasureCard;
