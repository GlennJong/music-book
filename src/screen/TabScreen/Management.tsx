import React, { useState, useEffect } from 'react';
import type { TabData } from './index';

export const INITIAL_TAB_DATA: TabData = {
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

interface ManagementProps {
  onSelect: (data: TabData) => void;
}

const STORAGE_KEY = 'tabdata_list';

const Management: React.FC<ManagementProps> = ({ onSelect }) => {
  const [tabList, setTabList] = useState<TabData[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        setTabList(Array.isArray(arr) && arr.length > 0 ? arr : [INITIAL_TAB_DATA]);
      } catch {
        setTabList([INITIAL_TAB_DATA]);
      }
    } else {
      setTabList([INITIAL_TAB_DATA]);
    }
  }, []);

  const handleDelete = (idx: number) => {
    const newList = tabList.filter((_, i) => i !== idx);
    setTabList(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-black mb-8">已儲存的樂譜列表</h2>
      {tabList.length === 0 ? (
        <div className="text-zinc-400">尚無資料</div>
      ) : (
        <ul className="space-y-4">
          {tabList.map((tab, idx) => (
            <li key={idx} className="bg-white rounded-2xl shadow p-6 flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">{tab.metadata.title}</div>
                <div className="text-zinc-500 text-sm">{tab.metadata.artist} | {tab.metadata.key} | {tab.metadata.bpm} BPM</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                  onClick={() => onSelect(tab)}
                >
                  開啟
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-100 text-red-500 font-bold hover:bg-red-200"
                  onClick={() => handleDelete(idx)}
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Management;
