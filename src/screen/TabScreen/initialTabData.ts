import type { TabData } from './index';

export const INITIAL_TAB_DATA: TabData = {
  title: "Nothing's Gonna Change My Love for You",
  artist: "Glenn Medeiros",
  key: "C",
  bpm: 80,
  subdivisions: 4,
  capo: 0,
  tuningName: 'standard',
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
