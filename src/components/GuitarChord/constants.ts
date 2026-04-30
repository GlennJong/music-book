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
export const DEFAULT_CHORD_DATA: ChordDatabase = {
  // --- C 系列 ---
  "C": [
    { name: "C (Open)", chord: [null, 3, 2, 0, 1, 0], baseShape: "Open" },
    { name: "C (A 型)", chord: [null, 3, 5, 5, 5, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" },
    { name: "C (E 型)", chord: [8, 10, 10, 9, 8, 8], startFret: 8, barre: { fret: 8, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Cm": [{ name: "Cm (A 型)", chord: [null, 3, 5, 5, 4, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" }, { name: "Cm (E 型)", chord: [8, 10, 10, 8, 8, 8], startFret: 8, barre: { fret: 8, from: 1, to: 6 }, baseShape: "E" }],
  "Cdim": [{ name: "Cdim (Movable)", chord: [null, 3, 4, null, 4, null], startFret: 3, baseShape: "A" }],
  "Caug": [{ name: "Caug (Open)", chord: [null, 3, 2, 1, 1, null], baseShape: "Open" }],
  "Cmaj7": [{ name: "Cmaj7 (Open)", chord: [null, 3, 2, 0, 0, 0], baseShape: "Open" }, { name: "Cmaj7 (A 型)", chord: [null, 3, 5, 4, 5, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" }],
  "Cm7": [{ name: "Cm7 (A 型)", chord: [null, 3, 5, 3, 4, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" }],
  "C7": [{ name: "C7 (Open)", chord: [null, 3, 2, 3, 1, 0], baseShape: "Open" }, { name: "C7 (A 型)", chord: [null, 3, 5, 3, 5, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 }, baseShape: "A" }],
  "Cm7b5": [{ name: "Cm7b5 (A 型)", chord: [null, 3, 4, 3, 4, null], startFret: 3, baseShape: "A" }],
  "Csus2": [{ name: "Csus2 (Open)", chord: [null, 3, 0, 0, 3, 3], baseShape: "Open" }],
  "Csus4": [{ name: "Csus4 (Open)", chord: [null, 3, 3, 0, 1, 1], baseShape: "Open" }],

  // --- C# / Db 系列 ---
  "C#": [
    { name: "C# (A 型)", chord: [null, 4, 6, 6, 6, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" },
    { name: "C# (E 型)", chord: [9, 11, 11, 10, 9, 9], startFret: 9, barre: { fret: 9, from: 1, to: 6 }, baseShape: "E" }
  ],
  "C#m": [{ name: "C#m (A 型)", chord: [null, 4, 6, 6, 5, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" }, { name: "C#m (E 型)", chord: [9, 11, 11, 9, 9, 9], startFret: 9, barre: { fret: 9, from: 1, to: 6 }, baseShape: "E" }],
  "C#dim": [{ name: "C#dim (A 型)", chord: [null, 4, 5, null, 5, null], startFret: 4, baseShape: "A" }],
  "C#aug": [{ name: "C#aug (Movable)", chord: [null, 4, 3, 2, 2, null], startFret: 2, baseShape: "A" }],
  "C#maj7": [{ name: "C#maj7 (A 型)", chord: [null, 4, 6, 5, 6, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" }, { name: "C#maj7 (E 型)", chord: [9, 11, 10, 10, 9, 9], startFret: 9, barre: { fret: 9, from: 1, to: 6 }, baseShape: "E" }],
  "C#m7": [{ name: "C#m7 (A 型)", chord: [null, 4, 6, 4, 5, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" }],
  "C#7": [{ name: "C#7 (A 型)", chord: [null, 4, 6, 4, 6, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" }],
  "C#m7b5": [{ name: "C#m7b5 (A 型)", chord: [null, 4, 5, 4, 5, null], startFret: 4, baseShape: "A" }],
  "C#sus2": [{ name: "C#sus2 (A 型)", chord: [null, 4, 6, 6, 4, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" }],
  "C#sus4": [{ name: "C#sus4 (A 型)", chord: [null, 4, 6, 6, 7, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 }, baseShape: "A" }],

  // --- D 系列 ---
  "D": [
    { name: "D (Open)", chord: [null, null, 0, 2, 3, 2], baseShape: "Open" },
    { name: "D (A 型)", chord: [null, 5, 7, 7, 7, 5], startFret: 5, barre: { fret: 5, from: 2, to: 6 }, baseShape: "A" },
    { name: "D (E 型)", chord: [10, 12, 12, 11, 10, 10], startFret: 10, barre: { fret: 10, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Dm": [{ name: "Dm (Open)", chord: [null, null, 0, 2, 3, 1], baseShape: "Open" }, { name: "Dm (A 型)", chord: [null, 5, 7, 7, 6, 5], startFret: 5, barre: { fret: 5, from: 2, to: 6 }, baseShape: "A" }],
  "Ddim": [{ name: "Ddim (Movable)", chord: [null, 5, 6, null, 6, null], startFret: 5, baseShape: "A" }],
  "Daug": [{ name: "Daug (Open)", chord: [null, null, 0, 3, 3, 2], baseShape: "Open" }],
  "Dmaj7": [{ name: "Dmaj7 (Open)", chord: [null, null, 0, 2, 2, 2], baseShape: "Open" }, { name: "Dmaj7 (A 型)", chord: [null, 5, 7, 6, 7, 5], startFret: 5, barre: { fret: 5, from: 2, to: 6 }, baseShape: "A" }],
  "Dm7": [{ name: "Dm7 (Open)", chord: [null, null, 0, 2, 1, 1], baseShape: "Open" }],
  "D7": [{ name: "D7 (Open)", chord: [null, null, 0, 2, 1, 2], baseShape: "Open" }],
  "Dm7b5": [{ name: "Dm7b5 (A 型)", chord: [null, 5, 6, 5, 6, null], startFret: 5, baseShape: "A" }],
  "Dsus2": [{ name: "Dsus2 (Open)", chord: [null, null, 0, 2, 3, 0], baseShape: "Open" }],
  "Dsus4": [{ name: "Dsus4 (Open)", chord: [null, null, 0, 2, 3, 3], baseShape: "Open" }],

  // --- Eb 系列 ---
  "Eb": [
    { name: "Eb (A 型)", chord: [null, 6, 8, 8, 8, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" },
    { name: "Eb (E 型)", chord: [11, 13, 13, 12, 11, 11], startFret: 11, barre: { fret: 11, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Ebm": [{ name: "Ebm (A 型)", chord: [null, 6, 8, 8, 7, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" }],
  "Ebdim": [{ name: "Ebdim (A 型)", chord: [null, 6, 7, null, 7, null], startFret: 6, baseShape: "A" }],
  "Ebaug": [{ name: "Ebaug (Movable)", chord: [null, null, 1, 0, 0, 3], baseShape: "Other" }],
  "Ebmaj7": [{ name: "Ebmaj7 (A 型)", chord: [null, 6, 8, 7, 8, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" }],
  "Ebm7": [{ name: "Ebm7 (A 型)", chord: [null, 6, 8, 6, 7, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" }],
  "Eb7": [{ name: "Eb7 (A 型)", chord: [null, 6, 8, 6, 8, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" }],
  "Ebm7b5": [{ name: "Ebm7b5 (A 型)", chord: [null, 6, 7, 6, 7, null], startFret: 6, baseShape: "A" }],
  "Ebsus2": [{ name: "Ebsus2 (A 型)", chord: [null, 6, 8, 8, 6, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" }],
  "Ebsus4": [{ name: "Ebsus4 (A 型)", chord: [null, 6, 8, 8, 9, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 }, baseShape: "A" }],

  // --- E 系列 ---
  "E": [
    { name: "E (Open)", chord: [0, 2, 2, 1, 0, 0], baseShape: "Open" },
    { name: "E (A 型)", chord: [null, 7, 9, 9, 9, 7], startFret: 7, barre: { fret: 7, from: 2, to: 6 }, baseShape: "A" },
    { name: "E (E 型)", chord: [12, 14, 14, 13, 12, 12], startFret: 12, barre: { fret: 12, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Em": [{ name: "Em (Open)", chord: [0, 2, 2, 0, 0, 0], baseShape: "Open" }, { name: "Em (A 型)", chord: [null, 7, 9, 9, 8, 7], startFret: 7, barre: { fret: 7, from: 2, to: 6 }, baseShape: "A" }],
  "Edim": [{ name: "Edim (Open)", chord: [0, 1, 2, 0, null, null], baseShape: "Open" }],
  "Eaug": [{ name: "Eaug (Open)", chord: [0, 3, 2, 1, null, null], baseShape: "Open" }],
  "Emaj7": [{ name: "Emaj7 (Open)", chord: [0, 2, 1, 1, 0, 0], baseShape: "Open" }],
  "Em7": [{ name: "Em7 (Open)", chord: [0, 2, 0, 0, 0, 0], baseShape: "Open" }],
  "E7": [{ name: "E7 (Open)", chord: [0, 2, 0, 1, 0, 0], baseShape: "Open" }],
  "Em7b5": [{ name: "Em7b5 (Open)", chord: [0, 1, 0, 0, null, null], baseShape: "Open" }],
  "Esus2": [{ name: "Esus2 (Open)", chord: [0, 2, 4, 4, 0, 0], baseShape: "Open" }],
  "Esus4": [{ name: "Esus4 (Open)", chord: [0, 2, 2, 2, 0, 0], baseShape: "Open" }],

  // --- F 系列 ---
  "F": [
    { name: "F", chord: [null, null, 3, 2, 1, 1], baseShape: "Open" },
    { name: "F (E 型)", chord: [1, 3, 3, 2, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 }, baseShape: "E" },
    { name: "F (A 型)", chord: [null, 8, 10, 10, 10, 8], startFret: 8, barre: { fret: 8, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Fm": [
    { name: "Fm", chord: [null, null, 3, 1, 1, 1], baseShape: "Open" },
    { name: "Fm (E 型)", chord: [1, 3, 3, 1, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Fdim": [{ name: "Fdim (E 型)", chord: [1, 2, 3, 1, null, null], startFret: 1, baseShape: "E" }],
  "Faug": [{ name: "Faug (Movable)", chord: [null, null, 3, 2, 2, 1], startFret: 1, baseShape: "Other" }],
  "Fmaj7": [{ name: "Fmaj7 (Open-style)", chord: [null, null, 3, 2, 1, 0], baseShape: "Other" }, { name: "Fmaj7 (E 型)", chord: [1, 3, 2, 2, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 }, baseShape: "E" }],
  "Fm7": [{ name: "Fm7 (E 型)", chord: [1, 3, 1, 1, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 }, baseShape: "E" }],
  "F7": [{ name: "F7 (E 型)", chord: [1, 3, 1, 2, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 }, baseShape: "E" }],
  "Fm7b5": [{ name: "Fm7b5 (E 型)", chord: [1, 2, 1, 1, null, null], startFret: 1, baseShape: "E" }],
  "Fsus2": [
    { name: "Fsus2", chord: [1, 1, null, 3, null, null], baseShape: "Open" },
    { name: "Fsus2 (E 型)", chord: [1, 3, 3, 0, 1, 1], startFret: 1, baseShape: "E" }
  ],
  "Fsus4": [
    { name: "Fsus4", chord: [null, null, 3, 3, 1, 1], baseShape: "Open" },
    { name: "Fsus4 (E 型)", chord: [1, 3, 3, 3, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 }, baseShape: "E" }
  ],

  // --- F# 系列 ---
  "F#": [
    { name: "F# (E 型)", chord: [2, 4, 4, 3, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 }, baseShape: "E" },
    { name: "F# (A 型)", chord: [null, 9, 11, 11, 11, 9], startFret: 9, barre: { fret: 9, from: 2, to: 6 }, baseShape: "A" }
  ],
  "F#m": [{ name: "F#m (E 型)", chord: [2, 4, 4, 2, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 }, baseShape: "E" }],
  "F#dim": [{ name: "F#dim (E 型)", chord: [2, 3, 4, 2, null, null], startFret: 2, baseShape: "E" }],
  "F#aug": [{ name: "F#aug (Movable)", chord: [2, 1, 0, 3, null, null], startFret: 1, baseShape: "Other" }],
  "F#maj7": [{ name: "F#maj7 (E 型)", chord: [2, 4, 3, 3, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 }, baseShape: "E" }],
  "F#m7": [{ name: "F#m7 (E 型)", chord: [2, 4, 2, 2, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 }, baseShape: "E" }],
  "F#7": [{ name: "F#7 (E 型)", chord: [2, 4, 2, 3, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 }, baseShape: "E" }],
  "F#m7b5": [{ name: "F#m7b5 (E 型)", chord: [2, 3, 2, 2, null, null], startFret: 2, baseShape: "E" }],
  "F#sus2": [{ name: "F#sus2 (Movable)", chord: [null, null, 4, 1, 2, 2], startFret: 1, baseShape: "Other" }],
  "F#sus4": [{ name: "F#sus4 (E 型)", chord: [2, 4, 4, 4, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 }, baseShape: "E" }],

  // --- G 系列 ---
  "G": [
    { name: "G (Open)", chord: [3, 2, 0, 0, 0, 3], baseShape: "Open" },
    { name: "G (E 型)", chord: [3, 5, 5, 4, 3, 3], startFret: 3, barre: { fret: 3, from: 1, to: 6 }, baseShape: "E" },
    { name: "G (A 型)", chord: [null, 10, 12, 12, 12, 10], startFret: 10, barre: { fret: 10, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Gm": [{ name: "Gm (E 型)", chord: [3, 5, 5, 3, 3, 3], startFret: 3, barre: { fret: 3, from: 1, to: 6 }, baseShape: "E" }],
  "Gdim": [{ name: "Gdim (E 型)", chord: [3, 4, 5, 3, null, null], startFret: 3, baseShape: "E" }],
  "Gaug": [{ name: "Gaug (Open)", chord: [3, 2, 1, 0, null, null], baseShape: "Open" }],
  "Gmaj7": [{ name: "Gmaj7 (Open)", chord: [3, 2, 0, 0, 0, 2], baseShape: "Open" }],
  "Gm7": [{ name: "Gm7 (E 型)", chord: [3, 5, 3, 3, 3, 3], startFret: 3, barre: { fret: 3, from: 1, to: 6 }, baseShape: "E" }],
  "G7": [{ name: "G7 (Open)", chord: [3, 2, 0, 0, 0, 1], baseShape: "Open" }],
  "Gm7b5": [{ name: "Gm7b5 (E 型)", chord: [3, 4, 3, 3, null, null], startFret: 3, baseShape: "E" }],
  "Gsus2": [{ name: "Gsus2 (Open)", chord: [3, 0, 0, 0, 3, 3], baseShape: "Open" }],
  "Gsus4": [{ name: "Gsus4 (Open)", chord: [3, null, 0, 0, 1, 3], baseShape: "Open" }],

  // --- Ab 系列 ---
  "Ab": [
    { name: "Ab (E 型)", chord: [4, 6, 6, 5, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" },
    { name: "Ab (A 型)", chord: [null, 11, 13, 13, 13, 11], startFret: 11, barre: { fret: 11, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Abm": [{ name: "Abm (E 型)", chord: [4, 6, 6, 4, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" }],
  "Abdim": [{ name: "Abdim (E 型)", chord: [4, 5, 6, 4, null, null], startFret: 4, baseShape: "E" }],
  "Abaug": [{ name: "Abaug (E 型)", chord: [4, 3, 2, 1, null, null], startFret: 1, baseShape: "E" }],
  "Abmaj7": [{ name: "Abmaj7 (E 型)", chord: [4, 6, 5, 5, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" }],
  "Abm7": [{ name: "Abm7 (E 型)", chord: [4, 6, 4, 4, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" }],
  "Ab7": [{ name: "Ab7 (E 型)", chord: [4, 6, 4, 5, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" }],
  "Abm7b5": [{ name: "Abm7b5 (E 型)", chord: [4, 5, 4, 4, null, null], startFret: 4, baseShape: "E" }],
  "Absus2": [{ name: "Absus2 (E 型)", chord: [4, 6, 6, 4, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" }],
  "Absus4": [{ name: "Absus4 (E 型)", chord: [4, 6, 6, 6, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 }, baseShape: "E" }],

  // --- A 系列 ---
  "A": [
    { name: "A (Open)", chord: [null, 0, 2, 2, 2, 0], baseShape: "Open" },
    { name: "A (E 型)", chord: [5, 7, 7, 6, 5, 5], startFret: 5, barre: { fret: 5, from: 1, to: 6 }, baseShape: "E" },
    { name: "A (A 型)", chord: [null, 12, 14, 14, 14, 12], startFret: 12, barre: { fret: 12, from: 2, to: 6 }, baseShape: "A" }
  ],
  "Am": [{ name: "Am (Open)", chord: [null, 0, 2, 2, 1, 0], baseShape: "Open" }, { name: "Am (E 型)", chord: [5, 7, 7, 5, 5, 5], startFret: 5, barre: { fret: 5, from: 1, to: 6 }, baseShape: "E" }],
  "Adim": [{ name: "Adim (Open)", chord: [null, 0, 1, 2, 1, null], baseShape: "Open" }],
  "Aaug": [{ name: "Aaug (Open)", chord: [null, 0, 3, 2, 2, 1], baseShape: "Open" }],
  "Amaj7": [{ name: "Amaj7 (Open)", chord: [null, 0, 2, 1, 2, 0], baseShape: "Open" }],
  "Am7": [{ name: "Am7 (Open)", chord: [null, 0, 2, 0, 1, 0], baseShape: "Open" }],
  "A7": [{ name: "A7 (Open)", chord: [null, 0, 2, 0, 2, 0], baseShape: "Open" }],
  "Am7b5": [{ name: "Am7b5 (Open)", chord: [null, 0, 1, 0, 1, null], baseShape: "Open" }],
  "Asus2": [{ name: "Asus2 (Open)", chord: [null, 0, 2, 2, 0, 0], baseShape: "Open" }],
  "Asus4": [{ name: "Asus4 (Open)", chord: [null, 0, 2, 2, 3, 0], baseShape: "Open" }],

  // --- Bb 系列 ---
  "Bb": [
    { name: "Bb (A 型)", chord: [null, 1, 3, 3, 3, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" },
    { name: "Bb (E 型)", chord: [6, 8, 8, 7, 6, 6], startFret: 6, barre: { fret: 6, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Bbm": [{ name: "Bbm (A 型)", chord: [null, 1, 3, 3, 2, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" }],
  "Bbdim": [{ name: "Bbdim (A 型)", chord: [null, 1, 2, null, 2, null], startFret: 1, baseShape: "A" }],
  "Bbaug": [{ name: "Bbaug (Movable)", chord: [null, 1, 0, 3, 3, null], startFret: 1, baseShape: "Other" }],
  "Bbmaj7": [{ name: "Bbmaj7 (A 型)", chord: [null, 1, 3, 2, 3, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" }],
  "Bbm7": [{ name: "Bbm7 (A 型)", chord: [null, 1, 3, 1, 2, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" }],
  "Bb7": [{ name: "Bb7 (A 型)", chord: [null, 1, 3, 1, 3, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" }],
  "Bbm7b5": [{ name: "Bbm7b5 (A 型)", chord: [null, 1, 2, 1, 2, null], startFret: 1, baseShape: "A" }],
  "Bbsus2": [{ name: "Bbsus2 (A 型)", chord: [null, 1, 3, 3, 1, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" }],
  "Bbsus4": [{ name: "Bbsus4 (A 型)", chord: [null, 1, 3, 3, 4, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 }, baseShape: "A" }],

  // --- B 系列 ---
  "B": [
    { name: "B (A 型)", chord: [null, 2, 4, 4, 4, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 }, baseShape: "A" },
    { name: "B (E 型)", chord: [7, 9, 9, 8, 7, 7], startFret: 7, barre: { fret: 7, from: 1, to: 6 }, baseShape: "E" }
  ],
  "Bm": [{ name: "Bm (A 型)", chord: [null, 2, 4, 4, 3, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 }, baseShape: "A" }, { name: "Bm (E 型)", chord: [7, 9, 9, 7, 7, 7], startFret: 7, barre: { fret: 7, from: 1, to: 6 }, baseShape: "E" }],
  "Bdim": [{ name: "Bdim (A 型)", chord: [null, 2, 3, null, 3, null], startFret: 2, baseShape: "A" }],
  "Baug": [{ name: "Baug (Movable)", chord: [null, 2, 1, 0, 0, null], startFret: 1, baseShape: "Other" }],
  "Bmaj7": [{ name: "Bmaj7 (A 型)", chord: [null, 2, 4, 3, 4, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 }, baseShape: "A" }],
  "Bm7": [{ name: "Bm7 (A 型)", chord: [null, 2, 4, 2, 3, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 }, baseShape: "A" }],
  "B7": [{ name: "B7 (Open-style)", chord: [null, 2, 1, 2, 0, 2], baseShape: "Other" }],
  "Bm7b5": [{ name: "Bm7b5 (A 型)", chord: [null, 2, 3, 2, 3, null], startFret: 2, baseShape: "A" }],
  "Bsus2": [{ name: "Bsus2 (A 型)", chord: [null, 2, 4, 4, 2, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 }, baseShape: "A" }],
  "Bsus4": [{ name: "Bsus4 (A 型)", chord: [null, 2, 4, 4, 5, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 }, baseShape: "A" }]
};

export const CHORD_DATA_STORAGE_KEY = 'chord_data_override';

const loadStoredChordData = (): ChordDatabase | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CHORD_DATA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as ChordDatabase : null;
  } catch {
    return null;
  }
};

export const CHORD_DATA: ChordDatabase = loadStoredChordData() ?? DEFAULT_CHORD_DATA;

export const saveChordData = (data: ChordDatabase): void => {
  localStorage.setItem(CHORD_DATA_STORAGE_KEY, JSON.stringify(data));
};

export const resetChordData = (): void => {
  localStorage.removeItem(CHORD_DATA_STORAGE_KEY);
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
