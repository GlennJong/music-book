import { CHORD_DATA, ROOT_NOTES } from '../../../components/GuitarChord/constants';
import type { ChordPosition } from '../../../components/GuitarChord/constants';
import type { TabData, Beat, BeatFrets } from '../../../types';

// STRING_BASE_MIDI[s] = MIDI base for string (s+1): 0=string1(highE), 5=string6(lowE)
export const STRING_BASE_MIDI: number[] = [64, 59, 55, 50, 45, 40];

export const parseChordNotes = (chordName: string): number[] => {
  if (!chordName) return [];
  const chordPositions = CHORD_DATA[chordName];
  if (!chordPositions || chordPositions.length === 0) return [];
  const chord = chordPositions[0].chord;
  // chord is [str6...str1], STRING_BASE_MIDI[5-idx] = MIDI base for that string
  return chord
    .map((fret: number | null, idx: number) => fret !== null ? (STRING_BASE_MIDI[5 - idx] + fret) % 12 : null)
    .filter((n: number | null): n is number => n !== null);
};

export const getNoteMidi = (stringNum: number, fret: number): number =>
  STRING_BASE_MIDI[stringNum - 1] + fret;

// chord[] is ordered [string6(lowE)...string1(highE)], STRING_BASE_MIDI[s] is string(s+1)
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

// Encode/decode beat chord with position index: "Am:2" → { name: "Am", idx: 2 }
export const decodeBeatChord = (s: string): { name: string; idx: number } => {
  const colonIdx = s.lastIndexOf(':');
  if (colonIdx > 0) {
    const idx = parseInt(s.slice(colonIdx + 1), 10);
    if (!isNaN(idx)) return { name: s.slice(0, colonIdx), idx };
  }
  return { name: s, idx: 0 };
};

export const encodeBeatChord = (name: string, idx: number): string =>
  idx > 0 ? `${name}:${idx}` : name;

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
      notes: m.notes.map(beat => {
        if (beat === null) return null;
        if (typeof beat === 'string') {
          const { name, idx } = decodeBeatChord(beat);
          return encodeBeatChord(transposeChordName(name, semitones), idx);
        }
        return (beat as BeatFrets).map(f => f !== null ? Math.max(0, f + semitones) : null);
      }) as Beat[],
    };
  }),
});

// Parse ASCII tab text to Beat[] (index s = BeatFrets[s] = fret for string s+1)
export const parseTextTabToNotes = (text: string, subdivisions: number): Beat[] => {
  // stringIdxMap: label → BeatFrets index (0=str1/highE, 5=str6/lowE)
  const stringIdxMap: Record<string, number> = { E: 0, B: 1, G: 2, D: 3, A: 4, e: 5 };
  const beats: (number | null)[][] = Array.from({ length: subdivisions }, () => Array(6).fill(null));

  text.split(/\r?\n/).map(l => l.trim()).forEach(line => {
    if (!line.includes('|')) return;
    const m = line.match(/^(E|B|G|D|A|e)\s*\|(.+)$/);
    if (!m) return;
    const strIdx = stringIdxMap[m[1]];
    if (strIdx === undefined) return;
    m[2].split('|').map(c => c.trim()).forEach((cell, b) => {
      if (b < subdivisions && cell !== '' && !isNaN(Number(cell)))
        beats[b][strIdx] = Number(cell);
    });
  });

  return beats.map(b => b.every(f => f === null) ? null : b) as Beat[];
};

// Migrate old Note[] format ({ string, fret, beat }) to new Beat[] format
export const migrateMeasureNotes = (measure: any, subdivisions: number): any => {
  const notes = measure.notes;
  if (!Array.isArray(notes) || notes.length === 0) return measure;

  const first = notes[0];
  const isOldFormat =
    first !== null &&
    typeof first === 'object' &&
    !Array.isArray(first) &&
    'string' in first && 'fret' in first && 'beat' in first;

  if (!isOldFormat) return measure;

  const beats: (number | null)[][] = Array.from({ length: subdivisions }, () => Array(6).fill(null));
  notes.forEach((note: any) => {
    const b = note.beat;
    const s = note.string - 1; // string 1→idx 0
    if (b >= 0 && b < subdivisions && s >= 0 && s < 6)
      beats[b][s] = note.fret;
  });

  return {
    ...measure,
    notes: beats.map(b => b.every(f => f === null) ? null : b),
  };
};

export const migrateTabData = (data: TabData): TabData => ({
  ...data,
  measures: data.measures.map(m => migrateMeasureNotes(m, data.subdivisions)),
});
