interface Barre {
  fret: number;
  from: number;
  to: number;
}


export type ChordDatabase = Record<string, ChordPosition[]>;


export interface ChordPosition {
  name: string;
  chord: (number | null)[];
  startFret?: number;
  barre?: Barre;
  baseShape?: 'E' | 'A' | 'Open' | 'Other';
}

/** * ==========================================
 * 2. 核心資料庫 (CHORD_DATA)
 * 包含 12 根音 * 10 調式之矩陣
 * ==========================================
 */
export const CHORD_DATA: Record<string, ChordPosition[]> = {
  // --- C 系列 ---
  "C": [
    { name: "C (Open)", chord: [null, 3, 2, 0, 1, 0], baseShape: "Open" },
    { name: "C (A 型)", chord: [null, 3, 5, 5, 5, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" },
    { name: "C (E 型)", chord: [8, 10, 10, 9, 8, 8], startFret: 8, barre: { fret: 8, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Cm": [
    { name: "Cm (A 型)", chord: [null, 3, 5, 5, 4, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" },
    { name: "Cm (E 型)", chord: [8, 10, 10, 8, 8, 8], startFret: 8, barre: { fret: 8, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Cdim": [{ name: "Cdim (A 型)", chord: [null, 3, 4, 2, 4, null], startFret: 2, baseShape: "A" }],
  "Caug": [{ name: "Caug (Open)", chord: [null, 3, 2, 1, 1, null], baseShape: "Open" }],
  "Cmaj7": [
    { name: "Cmaj7 (Open)", chord: [null, 3, 2, 0, 0, 0], baseShape: "Open" },
    { name: "Cmaj7 (A 型)", chord: [null, 3, 5, 4, 5, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Cm7": [{ name: "Cm7 (A 型)", chord: [null, 3, 5, 3, 4, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" }],
  "C7": [{ name: "C7 (Open)", chord: [null, 3, 2, 3, 1, 0], baseShape: "Open" }],
  "Cm7b5": [{ name: "Cm7b5 (A 型)", chord: [null, 3, 4, 3, 4, null], startFret: 3, baseShape: "A" }],
  "Csus2": [{ name: "Csus2 (Open)", chord: [null, 3, 0, 0, 3, 3], baseShape: "Open" }],
  "Csus4": [{ name: "Csus4 (Open)", chord: [null, 3, 3, 0, 1, 1], baseShape: "Open" }],

  // --- C# / Db 系列 ---
  "C#": [
    { name: "C# (A 型)", chord: [null, 4, 6, 6, 6, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" },
    { name: "C# (E 型)", chord: [9, 11, 11, 10, 9, 9], startFret: 9, barre: { fret: 9, from: 1, to: 6 }, baseShape: "E" }
  ],
  "C#m": [
    { name: "C#m (A 型)", chord: [null, 4, 6, 6, 5, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" },
    { name: "C#m (E 型)", chord: [9, 11, 11, 9, 9, 9], startFret: 9, barre: { fret: 9, from: 1, to: 6 }, baseShape: "E" }
  ],

  // --- D 系列 ---
  "D": [
    { name: "D (Open)", chord: [null, null, 0, 2, 3, 2], baseShape: "Open" },
    { name: "D (A 型)", chord: [null, 5, 7, 7, 7, 5], startFret: 5, barre: { fret: 5, from: 2, to: 6 }, baseShape: "A" },
    { name: "D (E 型)", chord: [10, 12, 12, 11, 10, 10], startFret: 10, barre: { fret: 10, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Dm": [
    { name: "Dm (Open)", chord: [null, null, 0, 2, 3, 1], baseShape: "Open" },
    { name: "Dm (A 型)", chord: [null, 5, 7, 7, 6, 5], startFret: 5, barre: { fret: 5, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Dsus2": [{ name: "Dsus2 (Open)", chord: [null, null, 0, 2, 3, 0], baseShape: "Open" }],
  "Dsus4": [{ name: "Dsus4 (Open)", chord: [null, null, 0, 2, 3, 3], baseShape: "Open" }],

  // --- Eb / D# 系列 ---
  "Eb": [
    { name: "Eb (A 型)", chord: [null, 6, 8, 8, 8, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" },
    { name: "Eb (E 型)", chord: [11, 13, 13, 12, 11, 11], startFret: 11, barre: { fret: 11, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Ebm": [{ name: "Ebm (A 型)", chord: [null, 6, 8, 8, 7, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" }],

  // --- E 系列 ---
  "E": [
    { name: "E (Open)", chord: [0, 2, 2, 1, 0, 0], baseShape: "Open" },
    { name: "E (A 型)", chord: [null, 7, 9, 9, 9, 7], startFret: 7, barre: { fret: 7, from: 2, to: 6 }, baseShape: "A" },
    { name: "E (E 型)", chord: [12, 14, 14, 13, 12, 12], startFret: 12, barre: { fret: 12, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Em": [
    { name: "Em (Open)", chord: [0, 2, 2, 0, 0, 0], baseShape: "Open" },
    { name: "Em (A 型)", chord: [null, 7, 9, 9, 8, 7], startFret: 7, barre: { fret: 7, from: 2, to: 6 }, baseShape: "A" }
  ],
  "E7": [{ name: "E7 (Open)", chord: [0, 2, 0, 1, 0, 0], baseShape: "Open" }],
  "Emaj7": [{ name: "Emaj7 (Open)", chord: [0, 2, 1, 1, 0, 0], baseShape: "Open" }],
  "Esus4": [{ name: "Esus4 (Open)", chord: [0, 2, 2, 2, 0, 0], baseShape: "Open" }],

  // --- F 系列 ---
  "F": [
    { name: "F (E 型)", chord: [1, 3, 3, 2, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 }, baseShape: "E" },
    { name: "F (A 型)", chord: [null, 8, 10, 10, 10, 8], startFret: 8, barre: { fret: 8, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Fm": [
    { name: "Fm (E 型)", chord: [1, 3, 3, 1, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 }, baseShape: "E" },
    { name: "Fm (A 型)", chord: [null, 8, 10, 10, 9, 8], startFret: 8, barre: { fret: 8, from: 2, to: 6 }, baseShape: "A" }
  ],

  // --- F# / Gb 系列 ---
  "F#": [
    { name: "F# (E 型)", chord: [2, 4, 4, 3, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 }, baseShape: "E" },
    { name: "F# (A 型)", chord: [null, 9, 11, 11, 11, 9], startFret: 9, barre: { fret: 9, from: 2, to: 6 }, baseShape: "A" }
  ],
  "F#m": [{ name: "F#m (E 型)", chord: [2, 4, 4, 2, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 }, baseShape: "E" }],

  // --- G 系列 ---
  "G": [
    { name: "G (Open)", chord: [3, 2, 0, 0, 0, 3], baseShape: "Open" },
    { name: "G (E 型)", chord: [3, 5, 5, 4, 3, 3], startFret: 3, barre: { fret: 3, from: 1, to: 6 }, baseShape: "E" },
    { name: "G (A 型)", chord: [null, 10, 12, 12, 12, 10], startFret: 10, barre: { fret: 10, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Gm": [{ name: "Gm (E 型)", chord: [3, 5, 5, 3, 3, 3], startFret: 3, barre: { fret: 3, from: 1, to: 6 }, baseShape: "E" }],
  "G7": [{ name: "G7 (Open)", chord: [3, 2, 0, 0, 0, 1], baseShape: "Open" }],
  "Gsus4": [{ name: "Gsus4 (Open)", chord: [3, null, 0, 0, 1, 3], baseShape: "Open" }],

  // --- Ab / G# 系列 ---
  "Ab": [
    { name: "Ab (E 型)", chord: [4, 6, 6, 5, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" },
    { name: "Ab (A 型)", chord: [null, 11, 13, 13, 13, 11], startFret: 11, barre: { fret: 11, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Abm": [{ name: "Abm (E 型)", chord: [4, 6, 6, 4, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" }],

  // --- A 系列 ---
  "A": [
    { name: "A (Open)", chord: [null, 0, 2, 2, 2, 0], baseShape: "Open" },
    { name: "A (E 型)", chord: [5, 7, 7, 6, 5, 5], startFret: 5, barre: { fret: 5, from: 1, to: 6 }, baseShape: "E" },
    { name: "A (A 型)", chord: [null, 12, 14, 14, 14, 12], startFret: 12, barre: { fret: 12, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Am": [
    { name: "Am (Open)", chord: [null, 0, 2, 2, 1, 0], baseShape: "Open" },
    { name: "Am (E 型)", chord: [5, 7, 7, 5, 5, 5], startFret: 5, barre: { fret: 5, from: 1, to: 6 }, baseShape: "E" }
  ],
  "A7": [{ name: "A7 (Open)", chord: [null, 0, 2, 0, 2, 0], baseShape: "Open" }],
  "Amaj7": [{ name: "Amaj7 (Open)", chord: [null, 0, 2, 1, 2, 0], baseShape: "Open" }],
  "Asus2": [{ name: "Asus2 (Open)", chord: [null, 0, 2, 2, 0, 0], baseShape: "Open" }],
  "Asus4": [{ name: "Asus4 (Open)", chord: [null, 0, 2, 2, 3, 0], baseShape: "Open" }],

  // --- Bb / A# 系列 ---
  "Bb": [
    { name: "Bb (A 型)", chord: [null, 1, 3, 3, 3, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" },
    { name: "Bb (E 型)", chord: [6, 8, 8, 7, 6, 6], startFret: 6, barre: { fret: 6, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Bbm": [{ name: "Bbm (A 型)", chord: [null, 1, 3, 3, 2, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" }],

  // --- B 系列 ---
  "B": [
    { name: "B (A 型)", chord: [null, 2, 4, 4, 4, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 }, baseShape: "A" },
    { name: "B (E 型)", chord: [7, 9, 9, 8, 7, 7], startFret: 7, barre: { fret: 7, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Bm": [
    { name: "Bm (A 型)", chord: [null, 2, 4, 4, 3, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 }, baseShape: "A" },
    { name: "Bm (E 型)", chord: [7, 9, 9, 7, 7, 7], startFret: 7, barre: { fret: 7, from: 1, to: 6 }, baseShape: "E" }
  ]
};

export const ROOT_NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
export const SUFFIXES = [
  { label: "大三 (Major)", value: "" },
  { label: "小三 (Minor)", value: "m" },
  { label: "減三 (Diminished)", value: "dim" },
  { label: "增三 (Augmented)", value: "aug" },
  { label: "大七 (Major 7)", value: "maj7" },
  { label: "小七 (Minor 7)", value: "m7" },
  { label: "屬七 (Dominant 7)", value: "7" },
  { label: "半減七 (m7b5)", value: "m7b5" },
  { label: "掛二 (Sus2)", value: "sus2" },
  { label: "掛四 (Sus4)", value: "sus4" }
];


export const ENHARMONIC_MAP: Record<string, string> = {
  "Eb": "D#", "Ab": "G#", "Db": "C#", "Gb": "F#", "Bb": "A#"
};
