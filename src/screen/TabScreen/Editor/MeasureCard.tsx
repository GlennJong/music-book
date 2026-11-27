import React, { useState } from 'react';
import MeasureActions from './MeasureActions';
import TextTabModal from './TextTabModal';
import FretPickerModal from './FretPickerModal';
import { GuitarChordSelector, GuitarChordPhoto } from '../../../components/GuitarChord';
import { CHORD_DATA } from '../../../components/GuitarChord/constants';
import type { ChordPosition } from '../../../components/GuitarChord/constants';
import { parseTextTabToNotes, getChordPitchClasses, decodeBeatChord, encodeBeatChord } from './utils';
import type { TabData, Beat, BeatFrets } from '../../../types';

type Measure = TabData['measures'][0];

interface MeasureCardProps {
  measure: Measure;
  isEditMode: boolean;
  subdivisions: number;
  showChordPhoto: boolean;
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
  onPlayFrom?: () => void;
}

const STRING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E'];

const MeasureCard: React.FC<MeasureCardProps> = ({
  measure, isEditMode, subdivisions, showChordPhoto,
  currentMeasure, currentBeat,
  canMovePrev, canMoveNext, onMovePrev, onMoveNext, onCopyNext, onCopyLast, onDelete,
  onUpdate, onPlayFrom,
}) => {
  const [chordPickerOpen, setChordPickerOpen] = useState(false);
  const [beatChordPickerBeat, setBeatChordPickerBeat] = useState<number | null>(null);
  const [pendingChord, setPendingChord] = useState<ChordPosition | null>(null);
  const [activeFretPicker, setActiveFretPicker] = useState<{ stringIdx: number; beat: number } | null>(null);
  const [textTabOpen, setTextTabOpen] = useState(false);

  const isActiveMeasure = currentMeasure === measure.id;
  const chordPositions = measure.chord ? CHORD_DATA[measure.chord] : null;
  const chordPhoto = chordPositions?.[measure.chordPositionIndex ?? 0] ?? null;
  const chordNotes = chordPhoto ? getChordPitchClasses(chordPhoto) : [];

  // --- Beat helpers ---

  const getBeat = (b: number): Beat => measure.notes[b] ?? null;
  const getBeatFrets = (b: number): BeatFrets | null => { const v = getBeat(b); return Array.isArray(v) ? v : null; };
  const getBeatChord = (b: number): string | null => { const v = getBeat(b); return typeof v === 'string' ? v : null; };
  const getFret = (b: number, s: number): number | null => getBeatFrets(b)?.[s] ?? null;

  const setBeatValue = (b: number, value: Beat) => {
    const newNotes = [...measure.notes];
    while (newNotes.length <= b) newNotes.push(null);
    newNotes[b] = value;
    onUpdate({ ...measure, notes: newNotes });
  };

  const setFret = (b: number, s: number, fret: number | null) => {
    const current = getBeat(b);
    const currentFrets: (number | null)[] = Array.isArray(current) ? [...current] : Array(6).fill(null);
    while (currentFrets.length < 6) currentFrets.push(null);
    currentFrets[s] = fret;
    setBeatValue(b, currentFrets.every(f => f === null) ? null : currentFrets);
  };

  // --- Measure-level chord ---

  const handleChordConfirm = () => {
    if (pendingChord) {
      const chordName = pendingChord.name.split(' ')[0];
      const positions = CHORD_DATA[chordName] ?? [];
      const positionIndex = positions.indexOf(pendingChord);
      onUpdate({ ...measure, chord: chordName, chordPositionIndex: positionIndex >= 0 ? positionIndex : 0 });
    }
    setChordPickerOpen(false);
  };

  // --- Per-beat chord ---

  const handleBeatChordConfirm = () => {
    if (beatChordPickerBeat === null || !pendingChord) { setBeatChordPickerBeat(null); return; }
    const chordName = pendingChord.name.split(' ')[0];
    const positions = CHORD_DATA[chordName] ?? [];
    const positionIndex = positions.indexOf(pendingChord);
    setBeatValue(beatChordPickerBeat, encodeBeatChord(chordName, positionIndex >= 0 ? positionIndex : 0));
    setBeatChordPickerBeat(null);
  };

  // --- Grid / Notes ---

  const handleGridClick = (s: number, b: number) => {
    if (getFret(b, s) === null && chordPhoto) {
      const f = chordPhoto.chord[5 - s];
      if (f != null) { setFret(b, s, f); return; }
    }
    setActiveFretPicker({ stringIdx: s, beat: b });
  };

  const handleFretSelect = (fret: number | null) => {
    if (!activeFretPicker) return;
    setFret(activeFretPicker.beat, activeFretPicker.stringIdx, fret);
    setActiveFretPicker(null);
  };

  const handleRemoveColumn = (b: number) => setBeatValue(b, null);

  const handleCopyColumn = (b: number) => {
    if (b >= subdivisions - 1) return;
    const src = getBeat(b);
    setBeatValue(b + 1, Array.isArray(src) ? [...src] : src);
  };

  const handleTextTabSave = (text: string) =>
    onUpdate({ ...measure, textTab: text, notes: parseTextTabToNotes(text, subdivisions) });

  // --- Shared chord picker (plain helper, NOT a React component, to avoid remount on re-render) ---

  const renderChordPicker = (
    title: string,
    defaultChord: string | undefined,
    onConfirm: () => void,
    onClear: () => void,
    onClose: () => void,
  ) => (
    <>
      <div className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] pointer-events-auto animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-black text-xl tracking-tighter">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground flex items-center">
              <span className="material-icons text-[22px]">close</span>
            </button>
          </div>
          <div className="overflow-y-auto flex gap-6 p-6">
            <GuitarChordSelector defaultChord={defaultChord} onChange={setPendingChord} />
            <div className="flex justify-center">
              <GuitarChordPhoto chord={pendingChord} size="md" isShowTitle />
            </div>
          </div>
          <div className="flex justify-between gap-2 px-6 py-4 border-t border-border">
            <button onClick={onClear} className="px-5 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/15 font-bold">清除</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-5 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-hover font-bold">取消</button>
              <button onClick={onConfirm} disabled={!pendingChord} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-40">確認</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative flex-1 min-w-0">
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
          breakAfter={!!measure.breakAfter}
          onToggleBreak={() => onUpdate({ ...measure, breakAfter: !measure.breakAfter })}
        />
      )}

      {textTabOpen && (
        <TextTabModal
          initialText={measure.textTab || ''}
          onClose={() => setTextTabOpen(false)}
          onSave={handleTextTabSave}
        />
      )}

      {chordPickerOpen && renderChordPicker(
        '設定和弦',
        measure.chord || undefined,
        handleChordConfirm,
        () => { onUpdate({ ...measure, chord: '', chordPositionIndex: undefined }); setChordPickerOpen(false); },
        () => setChordPickerOpen(false),
      )}

      {beatChordPickerBeat !== null && renderChordPicker(
        `Beat ${beatChordPickerBeat + 1} 和弦變換`,
        (() => { const bc = getBeatChord(beatChordPickerBeat); return bc ? decodeBeatChord(bc).name : undefined; })(),
        handleBeatChordConfirm,
        () => { setBeatValue(beatChordPickerBeat, null); setBeatChordPickerBeat(null); },
        () => setBeatChordPickerBeat(null),
      )}

      {/* Measure chord header */}
      <div className="flex items-center gap-4 px-4 h-[84px]">
        <button
          onClick={() => { if (isEditMode) setChordPickerOpen(true); else onPlayFrom?.(); }}
          className={`text-2xl font-black tracking-tighter leading-none transition-all ${isEditMode ? 'text-primary hover:scale-105' : onPlayFrom ? 'text-foreground hover:text-primary cursor-pointer' : 'text-foreground cursor-default'}`}
        >
          {measure.chord || '-'}
        </button>
        {(showChordPhoto && chordPhoto) && <GuitarChordPhoto chord={chordPhoto} size="xs" isShowTitle={false} />}
      </div>

      {/* Note grid */}
      <div className={`relative bg-card border-2 rounded-sm p-5 pt-6 transition-all ${isActiveMeasure ? 'border-primary shadow-primary/20 bg-primary-subtle/10 ring-14 ring-primary-subtle' : 'border-border'} ${isEditMode ? 'border-dashed border-amber-500/30' : ''}`}>
        <div
          className="relative min-h-36 grid gap-0"
          style={{ gridTemplateColumns: `repeat(${subdivisions}, 1fr)` }}
        >
          {/* String lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
            {STRING_LABELS.map((label, i) => (
              <div key={i} className="relative w-full h-px bg-muted">
                <span className="absolute -left-12 -top-2.5 text-[10px] font-black text-muted-foreground w-12 text-right tracking-tighter">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Beat columns */}
          {[...Array(subdivisions)].map((_, b) => {
            const beatChord = getBeatChord(b);
            const frets = getBeatFrets(b);
            const hasContent = getBeat(b) !== null;
            const hasNotes = frets?.some(f => f !== null) ?? false;
            const beatChordDecoded = beatChord ? decodeBeatChord(beatChord) : null;
            const beatChordName = beatChordDecoded?.name ?? null;
            const beatChordPhoto = beatChordName ? (CHORD_DATA[beatChordName]?.[beatChordDecoded!.idx] ?? CHORD_DATA[beatChordName]?.[0] ?? null) : null;

            return (
              <div key={b} className="relative h-full border-l border-border/50 first:border-l-0 flex flex-col justify-between py-2 px-1 group">
                {/* Top area: beat chord badge + actions */}
                <div className="absolute -top-6 left-0 right-0 flex items-center justify-center gap-1">
                  {isEditMode &&
                    <>
                      {
                        hasContent ? (
                          <button
                            onClick={() => handleRemoveColumn(b)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg flex items-center"
                            title="清除此拍"
                          >
                            <span className="material-icons text-[16px]">remove_circle_outline</span>
                          </button>
                        )
                        :
                        <button
                          onClick={() => isEditMode && setBeatChordPickerBeat(b)}
                          disabled={!isEditMode}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg flex items-center"
                        >
                          { beatChordName ?
                            <span className="inline-flex items-center justify-center font-black text-[14px]">{beatChordName}</span> :
                            <span className="material-icons text-[16px]">music_note</span>
                          }
                        </button>
                      }
                    </>
                    }
                </div>

                {/* Chord-type beat: show chord diagram centered in column */}
                {beatChordName && showChordPhoto && (
                  <div className="flex items-center justify-center" style={{transform: 'translateY(-12px)'}}>
                    <GuitarChordPhoto chord={beatChordPhoto} size="xs" />
                  </div>
                )}

                {/* String cells */}
                {[...Array(6)].map((_, s) => {
                  const fret = frets?.[s] ?? null;
                  const isNoteActive = isActiveMeasure && currentBeat === b;
                  const isPicking = activeFretPicker?.stringIdx === s && activeFretPicker?.beat === b;

                  return (
                    <div key={s} className="relative w-full h-1 flex items-center justify-center">
                      {fret !== null ? (
                        <button
                          disabled={!isEditMode}
                          onClick={() => handleGridClick(s, b)}
                          className={`relative z-10 w-4 h-4 rounded-[1.25rem] flex items-center justify-center font-mono font-bold text-xs shadow-xl transition-all ${isNoteActive ? 'bg-primary text-primary-foreground scale-110 ring-8 ring-primary/30' : 'bg-foreground text-background shadow-black/10'} ${isEditMode ? 'hover:scale-110 active:scale-95' : 'cursor-default'}`}
                        >
                          {fret}
                        </button>
                      ) : !beatChordName && isEditMode ? (
                        <button
                          onClick={() => handleGridClick(s, b)}
                          className="w-6 h-6 rounded-2xl border-2 border-dashed border-border text-border hover:border-primary hover:text-primary hover:bg-primary-subtle transition-all flex items-center justify-center group/add"
                        >
                        </button>
                      ) : null}

                      {isPicking && (
                        <FretPickerModal
                          onClose={() => setActiveFretPicker(null)}
                          onSelect={handleFretSelect}
                          chordNotes={chordNotes}
                          activeString={s + 1}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Copy button */}
                {isEditMode && hasNotes && b < subdivisions - 1 && (
                  <button
                    onClick={() => handleCopyColumn(b)}
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 p-1.5 text-muted-foreground hover:text-primary hover:bg-primary-subtle rounded-lg transition-all flex items-center opacity-0 group-hover:opacity-100"
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
        <div className="mt-4 border-t-2 border-border flex flex-col gap-4">
          <textarea
            disabled={!isEditMode}
            value={measure.lyrics || ''}
            onChange={e => onUpdate({ ...measure, lyrics: e.target.value })}
            placeholder={isEditMode ? '在這裡輸入歌詞...' : ''}
            className={`w-full bg-background/50 rounded-md p-5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary min-h-20 resize-none ${!isEditMode && 'bg-transparent text-muted-foreground px-0'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default MeasureCard;
