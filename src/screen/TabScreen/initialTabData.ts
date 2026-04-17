import type { TabData } from './index';

export const INITIAL_TAB_DATA: TabData = {
  metadata: {
    title: "Nothing's Gonna Change My Love for You",
    artist: "Glenn Medeiros",
    key: "C",
    bpm: 80,
    subdivisions: 4,
    capo: 0,
    tuning: ["E", "B", "G", "D", "A", "E"]
  },
  chordLib: {
    C: { frets: [0, 1, 0, 2, 3, null], theory: "C Major triad" },
    "G/B": { frets: [3, 0, 0, 0, 2, null], theory: "G Major with B bass" },
    Am: { frets: [0, 1, 2, 2, 0, null], theory: "A Minor triad" },
    G: { frets: [3, 0, 0, 0, 2, 3], theory: "G Major triad" },
    F: { frets: [1, 1, 2, 3, 3, 1], theory: "F Major triad" },
    "C/E": { frets: [0, 1, 0, 2, null, 0], theory: "C Major with E bass" },
    Dm: { frets: [1, 3, 2, 0, null, null], theory: "D Minor triad" },
    C9sus: { frets: [null, 3, 3, 3, 3, null], theory: "C9 suspended 4th chord" },
    E: { frets: [0, 0, 1, 2, 2, 0], theory: "E Major triad" },
    "D/F#": { frets: [2, 3, 2, 0, null, 2], theory: "D Major with F# bass" }
  },
  measures: [
    { id: 1, chord: "C", lyrics: "If I had to live my life", notes: [] },
    { id: 2, chord: "G/B", lyrics: "without you", notes: [] },
    { id: 3, chord: "Am", lyrics: "near me", notes: [] },
    { id: 4, chord: "G", lyrics: "The days would", notes: [] },
    { id: 5, chord: "F", lyrics: "all be", notes: [] },
    { id: 6, chord: "C/E", lyrics: "empty", notes: [] },
    { id: 7, chord: "Dm", lyrics: "The nights would seem", notes: [] },
    { id: 8, chord: "G", lyrics: "so long", notes: [] }
  ]
};
