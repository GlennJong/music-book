interface Barre {
  fret: number;
  from: number;
  to: number;
}

export interface ChordPosition {
  name: string;
  chord: (number | null)[];
  startFret?: number;
  barre?: Barre;
}

export type ChordDatabase = Record<string, ChordPosition[]>;

/** * ==========================================
 * 第一部分：和弦資料庫 (CHORD_DATA)
 * ==========================================
 */
export const CHORD_DATA: ChordDatabase = {
  // C 系列
  "C": [{ name: "C Major", chord: [null, 3, 2, 0, 1, 0] }],
  "Cm": [{ name: "C Minor", chord: [null, 3, 5, 5, 4, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 } }],
  "Cdim": [{ name: "C Diminished", chord: [null, 3, 4, null, 4, null], startFret: 3 }],
  "Caug": [{ name: "C Augmented", chord: [null, 3, 2, 1, 1, null] }],
  "Cmaj7": [{ name: "C Major 7", chord: [null, 3, 2, 0, 0, 0] }],
  "Cm7": [{ name: "C Minor 7", chord: [null, 3, 5, 3, 4, 3], startFret: 3, barre: { fret: 3, from: 2, to: 6 } }],
  "C7": [{ name: "C Dominant 7", chord: [null, 3, 2, 3, 1, 0] }],
  "Cm7b5": [{ name: "C Half-Diminished 7", chord: [null, 3, 4, 3, 4, null], startFret: 3 }],
  "Csus2": [{ name: "C Suspended 2", chord: [null, 3, 0, 0, 3, 3] }],
  "Csus4": [{ name: "C Suspended 4", chord: [null, 3, 3, 0, 1, 1] }],

  // C# / Db 系列
  "C#": [{ name: "C# Major", chord: [null, 4, 6, 6, 6, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 } }],
  "C#m": [{ name: "C# Minor", chord: [null, 4, 6, 6, 5, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 } }],
  "C#dim": [{ name: "C# Diminished", chord: [null, 4, 5, null, 5, null], startFret: 4 }],
  "C#aug": [{ name: "C# Augmented", chord: [null, 4, 3, 2, 2, null] }],
  "C#maj7": [{ name: "C# Major 7", chord: [null, 4, 6, 5, 6, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 } }],
  "C#m7": [{ name: "C# Minor 7", chord: [null, 4, 6, 4, 5, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 } }],
  "C#7": [{ name: "C# Dominant 7", chord: [null, 4, 6, 4, 6, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 } }],
  "C#m7b5": [{ name: "C# Half-Diminished 7", chord: [null, 4, 5, 4, 5, null], startFret: 4 }],
  "C#sus2": [{ name: "C# Suspended 2", chord: [null, 4, 6, 6, 4, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 } }],
  "C#sus4": [{ name: "C# Suspended 4", chord: [null, 4, 6, 6, 7, 4], startFret: 4, barre: { fret: 4, from: 2, to: 6 } }],

  // D 系列
  "D": [{ name: "D Major", chord: [null, null, 0, 2, 3, 2] }],
  "Dm": [{ name: "D Minor", chord: [null, null, 0, 2, 3, 1] }],
  "Ddim": [{ name: "D Diminished", chord: [null, null, 0, 1, 0, 1] }],
  "Daug": [{ name: "D Augmented", chord: [null, null, 0, 3, 3, 2] }],
  "Dmaj7": [{ name: "D Major 7", chord: [null, null, 0, 2, 2, 2] }],
  "Dm7": [{ name: "D Minor 7", chord: [null, null, 0, 2, 1, 1] }],
  "D7": [{ name: "D Dominant 7", chord: [null, null, 0, 2, 1, 2] }],
  "Dm7b5": [{ name: "D Half-Diminished 7", chord: [null, 5, 6, 5, 6, null], startFret: 5 }],
  "Dsus2": [{ name: "D Suspended 2", chord: [null, null, 0, 2, 3, 0] }],
  "Dsus4": [{ name: "D Suspended 4", chord: [null, null, 0, 2, 3, 3] }],

  // D# / Eb 系列
  "D#": [{ name: "D# Major", chord: [null, 6, 8, 8, 8, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 } }],
  "D#m": [{ name: "D# Minor", chord: [null, 6, 8, 8, 7, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 } }],
  "D#dim": [{ name: "D# Diminished", chord: [null, null, 1, 2, 1, 2] }],
  "D#aug": [{ name: "D# Augmented", chord: [null, null, 1, 0, 0, 3] }],
  "D#maj7": [{ name: "D# Major 7", chord: [null, 6, 8, 7, 8, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 } }],
  "D#m7": [{ name: "D# Minor 7", chord: [null, 6, 8, 6, 7, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 } }],
  "D#7": [{ name: "D# Dominant 7", chord: [null, 6, 8, 6, 8, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 } }],
  "D#m7b5": [{ name: "D# Half-Diminished 7", chord: [null, 6, 7, 6, 7, null], startFret: 6 }],
  "D#sus2": [{ name: "D# Suspended 2", chord: [null, 6, 8, 8, 6, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 } }],
  "D#sus4": [{ name: "D# Suspended 4", chord: [null, 6, 8, 8, 9, 6], startFret: 6, barre: { fret: 6, from: 2, to: 6 } }],

  // E 系列
  "E": [{ name: "E Major", chord: [0, 2, 2, 1, 0, 0] }],
  "Em": [{ name: "E Minor", chord: [0, 2, 2, 0, 0, 0] }],
  "Edim": [{ name: "E Diminished", chord: [0, 1, 2, 0, null, null] }],
  "Eaug": [{ name: "E Augmented", chord: [0, 3, 2, 1, null, null] }],
  "Emaj7": [{ name: "E Major 7", chord: [0, 2, 1, 1, 0, null] }],
  "Em7": [{ name: "E Minor 7", chord: [0, 2, 0, 0, 0, 0] }],
  "E7": [{ name: "E Dominant 7", chord: [0, 2, 0, 1, 0, 0] }],
  "Em7b5": [{ name: "E Half-Diminished 7", chord: [0, 1, 0, 0, null, null] }],
  "Esus2": [{ name: "E Suspended 2", chord: [0, 2, 4, 4, 0, 0] }],
  "Esus4": [{ name: "E Suspended 4", chord: [0, 2, 2, 2, 0, 0] }],

  // F 系列
  "F": [{ name: "F Major", chord: [1, 3, 3, 2, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 } }],
  "Fm": [{ name: "F Minor", chord: [1, 3, 3, 1, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 } }],
  "Fdim": [{ name: "F Diminished", chord: [null, null, 3, 4, 3, 4], startFret: 3 }],
  "Faug": [{ name: "F Augmented", chord: [null, null, 3, 2, 2, 1] }],
  "Fmaj7": [{ name: "F Major 7", chord: [null, null, 3, 2, 1, 0] }],
  "Fm7": [{ name: "F Minor 7", chord: [1, 3, 1, 1, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 } }],
  "F7": [{ name: "F Dominant 7", chord: [1, 3, 1, 2, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 } }],
  "Fm7b5": [{ name: "F Half-Diminished 7", chord: [null, null, 3, 4, 4, 4], startFret: 3 }],
  "Fsus2": [{ name: "F Suspended 2", chord: [null, null, 3, 0, 1, 1] }],
  "Fsus4": [{ name: "F Suspended 4", chord: [1, 3, 3, 3, 1, 1], startFret: 1, barre: { fret: 1, from: 1, to: 6 } }],

  // F# / Gb 系列
  "F#": [{ name: "F# Major", chord: [2, 4, 4, 3, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 } }],
  "F#m": [{ name: "F# Minor", chord: [2, 4, 4, 2, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 } }],
  "F#dim": [{ name: "F# Diminished", chord: [null, null, 4, 5, 4, 5], startFret: 4 }],
  "F#aug": [{ name: "F# Augmented", chord: [2, 1, 0, 3, null, null] }],
  "F#maj7": [{ name: "F# Major 7", chord: [2, 4, 3, 3, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 } }],
  "F#m7": [{ name: "F# Minor 7", chord: [2, 4, 2, 2, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 } }],
  "F#7": [{ name: "F# Dominant 7", chord: [2, 4, 2, 3, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 } }],
  "F#m7b5": [{ name: "F# Half-Diminished 7", chord: [2, null, 2, 2, 1, null], startFret: 2 }],
  "F#sus2": [{ name: "F# Suspended 2", chord: [null, null, 4, 1, 2, 2], startFret: 1 }],
  "F#sus4": [{ name: "F# Suspended 4", chord: [2, 4, 4, 4, 2, 2], startFret: 2, barre: { fret: 2, from: 1, to: 6 } }],

  // G 系列
  "G": [{ name: "G Major", chord: [3, 2, 0, 0, 0, 3] }],
  "Gm": [{ name: "G Minor", chord: [3, 5, 5, 3, 3, 3], startFret: 3, barre: { fret: 3, from: 1, to: 6 } }],
  "Gdim": [{ name: "G Diminished", chord: [null, null, 5, 6, 5, 6], startFret: 5 }],
  "Gaug": [{ name: "G Augmented", chord: [3, 2, 1, 0, null, null] }],
  "Gmaj7": [{ name: "G Major 7", chord: [3, 2, 0, 0, 0, 2] }],
  "Gm7": [{ name: "G Minor 7", chord: [3, 5, 3, 3, 3, 3], startFret: 3, barre: { fret: 3, from: 1, to: 6 } }],
  "G7": [{ name: "G Dominant 7", chord: [3, 2, 0, 0, 0, 1] }],
  "Gm7b5": [{ name: "G Half-Diminished 7", chord: [3, null, 3, 3, 2, null], startFret: 3 }],
  "Gsus2": [{ name: "G Suspended 2", chord: [3, 0, 0, 0, 3, 3] }],
  "Gsus4": [{ name: "G Suspended 4", chord: [3, null, 0, 0, 1, 3] }],

  // G# / Ab 系列
  "G#": [{ name: "G# Major", chord: [4, 6, 6, 5, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 } }],
  "G#m": [{ name: "G# Minor", chord: [4, 6, 6, 4, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 } }],
  "G#dim": [{ name: "G# Diminished", chord: [null, null, 6, 7, 6, 7], startFret: 6 }],
  "G#aug": [{ name: "G# Augmented", chord: [4, 3, 2, 1, null, null] }],
  "G#maj7": [{ name: "G# Major 7", chord: [4, 6, 5, 5, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 } }],
  "G#m7": [{ name: "G# Minor 7", chord: [4, 6, 4, 4, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 } }],
  "G#7": [{ name: "G# Dominant 7", chord: [4, 6, 4, 5, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 } }],
  "G#m7b5": [{ name: "G# Half-Diminished 7", chord: [4, null, 4, 4, 3, null], startFret: 4 }],
  "G#sus2": [{ name: "G# Suspended 2", chord: [4, 6, 6, 4, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 } }],
  "G#sus4": [{ name: "G# Suspended 4", chord: [4, 6, 6, 6, 4, 4], startFret: 4, barre: { fret: 4, from: 1, to: 6 } }],

  // A 系列
  "A": [{ name: "A Major", chord: [null, 0, 2, 2, 2, 0] }],
  "Am": [{ name: "A Minor", chord: [null, 0, 2, 2, 1, 0] }],
  "Adim": [{ name: "A Diminished", chord: [null, 0, 1, 2, 1, null] }],
  "Aaug": [{ name: "A Augmented", chord: [null, 0, 3, 2, 2, 1] }],
  "Amaj7": [{ name: "A Major 7", chord: [null, 0, 2, 1, 2, 0] }],
  "Am7": [{ name: "A Minor 7", chord: [null, 0, 2, 0, 1, 0] }],
  "A7": [{ name: "A Dominant 7", chord: [null, 0, 2, 0, 2, 0] }],
  "Am7b5": [{ name: "A Half-Diminished 7", chord: [null, 0, 1, 0, 1, null] }],
  "Asus2": [{ name: "A Suspended 2", chord: [null, 0, 2, 2, 0, 0] }],
  "Asus4": [{ name: "A Suspended 4", chord: [null, 0, 2, 2, 3, 0] }],

  // A# / Bb 系列
  "A#": [{ name: "A# Major", chord: [null, 1, 3, 3, 3, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 } }],
  "A#m": [{ name: "A# Minor", chord: [null, 1, 3, 3, 2, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 } }],
  "A#dim": [{ name: "A# Diminished", chord: [null, 1, 2, null, 2, null], startFret: 1 }],
  "A#aug": [{ name: "A# Augmented", chord: [null, 1, 0, 3, 3, null] }],
  "A#maj7": [{ name: "A# Major 7", chord: [null, 1, 3, 2, 3, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 } }],
  "A#m7": [{ name: "A# Minor 7", chord: [null, 1, 3, 1, 2, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 } }],
  "A#7": [{ name: "A# Dominant 7", chord: [null, 1, 3, 1, 3, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 } }],
  "A#m7b5": [{ name: "A# Half-Diminished 7", chord: [null, 1, 2, 1, 2, null], startFret: 1 }],
  "A#sus2": [{ name: "A# Suspended 2", chord: [null, 1, 3, 3, 1, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 } }],
  "A#sus4": [{ name: "A# Suspended 4", chord: [null, 1, 3, 3, 4, 1], startFret: 1, barre: { fret: 1, from: 2, to: 6 } }],

  // B 系列
  "B": [{ name: "B Major", chord: [null, 2, 4, 4, 4, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 } }],
  "Bm": [{ name: "B Minor", chord: [null, 2, 4, 4, 3, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 } }],
  "Bdim": [{ name: "B Diminished", chord: [null, 2, 3, null, 3, null], startFret: 2 }],
  "Baug": [{ name: "B Augmented", chord: [null, 2, 1, 0, 0, null] }],
  "Bmaj7": [{ name: "B Major 7", chord: [null, 2, 4, 3, 4, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 } }],
  "Bm7": [{ name: "B Minor 7", chord: [null, 2, 4, 2, 3, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 } }],
  "B7": [{ name: "B Dominant 7", chord: [null, 2, 1, 2, 0, 2] }],
  "Bm7b5": [{ name: "B Half-Diminished 7", chord: [null, 2, 3, 2, 3, null], startFret: 2 }],
  "Bsus2": [{ name: "B Suspended 2", chord: [null, 2, 4, 4, 2, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 } }],
  "Bsus4": [{ name: "B Suspended 4", chord: [null, 2, 4, 4, 5, 2], startFret: 2, barre: { fret: 2, from: 2, to: 6 } }]
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
