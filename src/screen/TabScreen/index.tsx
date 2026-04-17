import React, { useState } from 'react';
import Tab from './Tab';
import Converter from './Converter';

// --- 型別定義 ---

interface Metadata {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  subdivisions: number;
  capo: number;
  tuning: string[];
}

interface Note {
  string: number;
  fret: number;
  beat: number;
}

interface Measure {
  id: number;
  chord: string;
  lyrics: string;
  notes: Note[];
}

interface ChordInfo {
  frets: (number | null)[];
  theory: string;
}

interface TabData {
  metadata: Metadata;
  chordLib: Record<string, ChordInfo>;
  measures: Measure[];
}

// --- 常數與對照表 ---
const STRING_BASE_MIDI: number[] = [64, 59, 55, 50, 45, 40]; // E4, B3, G3, D3, A2, E2
const NOTE_NAMES: string[] = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const CHORD_INTERVALS: Record<string, number[]> = {
  "": [0, 4, 7],
  "m": [0, 3, 7],
  "7": [0, 4, 7, 10],
  "maj7": [0, 4, 7, 11],
  "m7": [0, 3, 7, 10],
  "sus4": [0, 5, 7],
  "add9": [0, 4, 7, 14],
  "9": [0, 4, 7, 10, 14],
  "dim": [0, 3, 6],
  "aug": [0, 4, 8],
  "m7b5": [0, 3, 6, 10],
  "6": [0, 4, 7, 9],
  "m6": [0, 3, 7, 9],
};

const ALL_CHORD_TYPES: string[] = Object.keys(CHORD_INTERVALS);
const ROOT_NOTES: string[] = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const CHORD_POOL: string[] = ROOT_NOTES.flatMap(root => ALL_CHORD_TYPES.map(type => root + type));

const THEORY_CHORDS: Record<string, string[]> = {
  "G Major": ["G", "Am", "Bm", "C", "D", "Em", "F#dim", "Gmaj7", "Am7", "D7", "Dsus4", "A"],
  "C Major": ["C", "Dm", "Em", "F", "G", "Am", "Bdim", "Cmaj7", "Dm7", "G7"],
};

// --- 工具函數 ---
const parseChordNotes = (chordName: string): number[] => {
  if (!chordName) return [];
  let root = "";
  let type = "";
  if (chordName[1] === '#' || chordName[1] === 'b') {
    root = chordName.substring(0, 2);
    type = chordName.substring(2);
  } else {
    root = chordName.substring(0, 1);
    type = chordName.substring(1);
  }
  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return [];
  const intervals = CHORD_INTERVALS[type] || [0, 4, 7];
  return intervals.map(i => (rootIndex + i) % 12);
};

const INITIAL_TAB_DATA: TabData = {
  "metadata": {
    "title": "Nothing's Gonna Change My Love for You",
    "artist": "Glenn Medeiros",
    "key": "C",
    "bpm": 80,
    "subdivisions": 4,
    "capo": 0,
    "tuning": [
      "E",
      "B",
      "G",
      "D",
      "A",
      "E"
    ]
  },
  "chordLib": {
    "C": {
      "frets": [
        0,
        1,
        0,
        2,
        3,
        null
      ],
      "theory": "C Major triad"
    },
    "G/B": {
      "frets": [
        3,
        0,
        0,
        0,
        2,
        null
      ],
      "theory": "G Major with B bass"
    },
    "Am": {
      "frets": [
        0,
        1,
        2,
        2,
        0,
        null
      ],
      "theory": "A Minor triad"
    },
    "G": {
      "frets": [
        3,
        0,
        0,
        0,
        2,
        3
      ],
      "theory": "G Major triad"
    },
    "F": {
      "frets": [
        1,
        1,
        2,
        3,
        3,
        1
      ],
      "theory": "F Major triad"
    },
    "C/E": {
      "frets": [
        0,
        1,
        0,
        2,
        null,
        0
      ],
      "theory": "C Major with E bass"
    },
    "Dm": {
      "frets": [
        1,
        3,
        2,
        0,
        null,
        null
      ],
      "theory": "D Minor triad"
    },
    "C9sus": {
      "frets": [
        null,
        3,
        3,
        3,
        3,
        null
      ],
      "theory": "C9 suspended 4th chord"
    },
    "E": {
      "frets": [
        0,
        0,
        1,
        2,
        2,
        0
      ],
      "theory": "E Major triad"
    },
    "D/F#": {
      "frets": [
        2,
        3,
        2,
        0,
        null,
        2
      ],
      "theory": "D Major with F# bass"
    }
  },
  "measures": [
    {
      "id": 1,
      "chord": "C",
      "lyrics": "If I had to live my life",
      "notes": []
    },
    {
      "id": 2,
      "chord": "G/B",
      "lyrics": "without you",
      "notes": []
    },
    {
      "id": 3,
      "chord": "Am",
      "lyrics": "near me",
      "notes": []
    },
    {
      "id": 4,
      "chord": "G",
      "lyrics": "The days would",
      "notes": []
    },
    {
      "id": 5,
      "chord": "F",
      "lyrics": "all be",
      "notes": []
    },
    {
      "id": 6,
      "chord": "C/E",
      "lyrics": "empty",
      "notes": []
    },
    {
      "id": 7,
      "chord": "Dm",
      "lyrics": "The nights would seem",
      "notes": []
    },
    {
      "id": 8,
      "chord": "G",
      "lyrics": "so long",
      "notes": []
    }
  ]
};

const TabScreen: React.FC = () => {
  const [tabData, setTabData] = useState<TabData>(INITIAL_TAB_DATA);
  const [mode, setMode] = useState<'tab' | 'converter'>(tabData ? 'tab' : 'converter');


  return (
    <div>
        <div>
          <button onClick={() => setMode('tab')}>Tab</button>
          <button onClick={() => setMode('converter')}>Converter</button>
        </div>
        {mode === 'tab' && <Tab tabData={tabData} />}
        {mode === 'converter' && <Converter onChange={data => setTabData(data)} />}
    </div>
  );
};

export default TabScreen;