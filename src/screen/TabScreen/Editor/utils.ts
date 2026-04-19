import { CHORD_DATA, ROOT_NOTES } from '../../../components/GuitarChord/constants';
import type { ChordPosition } from '../../../components/GuitarChord/constants';
import type { TabData } from '../../../types';

export interface Note {
  string: number;
  fret: number;
  beat: number;
}

export const STRING_BASE_MIDI: number[] = [64, 59, 55, 50, 45, 40];

export const parseChordNotes = (chordName: string): number[] => {
  if (!chordName) return [];
  const chordPositions = CHORD_DATA[chordName];
  if (!chordPositions || chordPositions.length === 0) return [];
  const chord = chordPositions[0].chord;
  return chord
    .map((fret: number | null, idx: number) => fret !== null ? (STRING_BASE_MIDI[idx] + fret) % 12 : null)
    .filter((n: number | null): n is number => n !== null);
};

export const getNoteMidi = (stringNum: number, fret: number): number =>
  STRING_BASE_MIDI[stringNum - 1] + fret;

// chord[] is ordered [string6(lowE)...string1(highE)], STRING_BASE_MIDI[0] is string1(highE)
export const getChordPitchClasses = (position: ChordPosition): number[] =>
  position.chord
    .map((fret, idx) => fret != null ? (STRING_BASE_MIDI[5 - idx] + fret) % 12 : null)
    .filter((n): n is number => n !== null);

export const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const parseChordRoot = (chord: string): { root: string; suffix: string } | null => {
  const root = [...ROOT_NOTES].sort((a, b) => b.length - a.length).find(r => chord.startsWith(r));
  return root ? { root, suffix: chord.slice(root.length) } : null;
};

export const transposeChordName = (chord: string, semitones: number): string => {
  if (!chord) return chord;
  const parsed = parseChordRoot(chord);
  if (!parsed) return chord;
  const newIdx = ((ROOT_NOTES.indexOf(parsed.root) + semitones) % 12 + 12) % 12;
  return ROOT_NOTES[newIdx] + parsed.suffix;
};

export const transposeTabData = (data: TabData, semitones: number): TabData => ({
  ...data,
  key: transposeChordName(data.key, semitones),
  measures: data.measures.map(m => {
    const newChord = transposeChordName(m.chord, semitones);
    const oldShape = CHORD_DATA[m.chord]?.[m.chordPositionIndex ?? 0]?.baseShape;
    const newPositions = CHORD_DATA[newChord] ?? [];
    const newIdx = oldShape ? Math.max(0, newPositions.findIndex(p => p.baseShape === oldShape)) : 0;
    return {
      ...m,
      chord: newChord,
      chordPositionIndex: newIdx,
      notes: m.notes.map(n => ({ ...n, fret: Math.max(0, n.fret + semitones) })),
    };
  }),
});

export const parseTextTabToNotes = (text: string, subdivisions: number): Note[] => {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const stringMap: Record<string, number> = { E: 1, B: 2, G: 3, D: 4, A: 5, e: 6 };
  const notes: Note[] = [];
  lines.forEach(line => {
    if (!line.includes('|')) return;
    const m = line.match(/^(E|B|G|D|A|e)\s*\|(.+)$/);
    if (!m) return;
    const stringNum = stringMap[m[1]];
    if (!stringNum) return;
    m[2].split('|').map(c => c.trim()).forEach((cell, idx) => {
      if (cell !== '' && !isNaN(Number(cell))) {
        notes.push({ string: stringNum, fret: Number(cell), beat: idx });
      }
    });
  });
  return notes.filter(n => n.beat < subdivisions);
};
