import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import MeasureActions from './components/MeasureActions';
// ...existing code...

import * as Tone from 'tone';
import { chordInfo } from './chordInfo';
import { tuningInfo } from './tuningInfo';

// --- 型別定義 ---

interface Metadata {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  subdivisions: number;
  capo: number;
  tuningName: string;
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
  textTab?: string;
}


interface TabData {
  metadata: Metadata;
  measures: Measure[];
}

interface HistoryState {
  past: TabData[];
  future: TabData[];
}

interface ActiveFretPicker {
  measureId: number;
  string: number;
  beat: number;
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

const getNoteMidi = (stringNum: number, fret: number): number => STRING_BASE_MIDI[stringNum - 1] + fret;



interface TabProps {
  tabData: TabData;
  setTabData: (data: TabData) => void;
}

const Tab: React.FC<TabProps> = ({ tabData, setTabData }) => {
  const [measuresPerRow, setMeasuresPerRow] = useState<number>(2);
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // State for JSON editing
  const [jsonEditValue, setJsonEditValue] = useState("");

  // Sync jsonEditValue with tabData when switching to JSON view
  useEffect(() => {
    if (!isEditMode) {
      setJsonEditValue(JSON.stringify(tabData, null, 2));
    }
  }, [isEditMode, tabData]);
  const [viewMode, setViewMode] = useState<'render' | 'data'>('render');
  const [activeChordPicker, setActiveChordPicker] = useState<number | null>(null);
  const [activeFretPicker, setActiveFretPicker] = useState<ActiveFretPicker | null>(null); 
  const [chordFilter, setChordFilter] = useState<string>('');
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMeasure, setCurrentMeasure] = useState<number | null>(null);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);

  // 文字譜彈窗狀態
  const [activeTextTab, setActiveTextTab] = useState<null | { measureId: number; text: string }>(null);
  
  const synth = useRef<Tone.PolySynth | null>(null);
  const reverb = useRef<Tone.Reverb | null>(null);

  // 載入 Material Icons
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // 音訊引擎初始化
  useEffect(() => {
    reverb.current = new Tone.Reverb(1.5).toDestination();
    synth.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 }
    }).connect(reverb.current);
    
    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  // --- 歷史紀錄系統 ---

  const saveToHistory = useCallback((newData: TabData) => {
    setHistory(prev => ({
      past: [...prev.past, tabData],
      future: []
    }));
    setTabData(newData);
  }, [tabData, setTabData]);

  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    setHistory(prev => ({
      past: prev.past.slice(0, -1),
      future: [tabData, ...prev.future]
    }));
    setTabData(previous);
  }, [history, tabData, setTabData]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    setHistory(prev => ({
      past: [...prev.past, tabData],
      future: prev.future.slice(1)
    }));
    setTabData(next);
  }, [history, tabData, setTabData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // --- 編輯功能邏輯 ---
  const addMeasure = () => {
    const newId = tabData.measures.length > 0 ? Math.max(...tabData.measures.map(m => m.id)) + 1 : 1;
    saveToHistory({
      ...tabData,
      measures: [...tabData.measures, { id: newId, chord: "", lyrics: "", notes: [] }]
    });
  };

  const updateLyrics = (measureId: number, text: string) => {
    const newMeasures = tabData.measures.map(m => 
      m.id === measureId ? { ...m, lyrics: text } : m
    );
    saveToHistory({ ...tabData, measures: newMeasures });
  };

  // 文字譜內容儲存
  // 解析文字譜並同步 notes
  const parseTextTabToNotes = (text: string, subdivisions: number) => {
    // 支援格式：E |  |  |  | 3|
    // 回傳 notes: Note[]
    const lines = text.split(/\r?\n/).map(l => l.trim());
    const stringMap: Record<string, number> = { 'E': 1, 'B': 2, 'G': 3, 'D': 4, 'A': 5, 'e': 6 };
    // 也支援小寫 e 當 6 弦
    const notes: Note[] = [];
    lines.forEach(line => {
      // 只處理有 | 的行
      if (!line.includes('|')) return;
      // 取弦名
      const m = line.match(/^(E|B|G|D|A|e)\s*\|(.+)$/);
      if (!m) return;
      const stringName = m[1] as keyof typeof stringMap;
      const stringNum = stringMap[stringName];
      if (!stringNum) return;
      // 取每格
      const cells = m[2].split('|').map(c => c.trim());
      cells.forEach((cell, idx) => {
        if (cell !== '' && !isNaN(Number(cell))) {
          notes.push({ string: stringNum, fret: Number(cell), beat: idx });
        }
      });
    });
    // 過濾超出 subdivisions 的 beat
    return notes.filter(n => n.beat < subdivisions);
  };

  const updateTextTab = (measureId: number, text: string) => {
    const newMeasures = tabData.measures.map(m => {
      if (m.id === measureId) {
        // 解析文字譜
        const notes = parseTextTabToNotes(text, tabData.metadata.subdivisions);
        return { ...m, textTab: text, notes };
      }
      return m;
    });
    saveToHistory({ ...tabData, measures: newMeasures });
  };

  const clearColumn = (measureId: number, beat: number) => {
    const newMeasures = tabData.measures.map(m => {
      if (m.id === measureId) {
        return { ...m, notes: m.notes.filter(n => n.beat !== beat) };
      }
      return m;
    });
    saveToHistory({ ...tabData, measures: newMeasures });
  };

  const duplicateToNextEmpty = (measureId: number, currentBeat: number) => {
    const targetMeasure = tabData.measures.find(m => m.id === measureId);
    if (!targetMeasure) return;

    let nextEmptyBeat = -1;
    for (let b = currentBeat + 1; b < tabData.metadata.subdivisions; b++) {
      if (!targetMeasure.notes.some(n => n.beat === b)) {
        nextEmptyBeat = b;
        break;
      }
    }

    if (nextEmptyBeat === -1) return;

    const notesToCopy = targetMeasure.notes.filter(n => n.beat === currentBeat);
    const newMeasures = tabData.measures.map(m => {
      if (m.id === measureId) {
        const copiedNotes = notesToCopy.map(n => ({ ...n, beat: nextEmptyBeat }));
        return { ...m, notes: [...m.notes, ...copiedNotes] };
      }
      return m;
    });
    saveToHistory({ ...tabData, measures: newMeasures });
  };

  const handleGridClick = (measureId: number, stringNum: number, beat: number) => {
    const measure = tabData.measures.find(m => m.id === measureId);
    if (!measure) return;
    const existingNote = measure.notes.find(n => n.string === stringNum && n.beat === beat);

    if (existingNote) {
      setActiveFretPicker({ measureId, string: stringNum, beat });
    } else {

      const currentChordInfo = chordInfo[measure.chord];
      const recommendedFret = currentChordInfo ? currentChordInfo.frets[stringNum - 1] : 0;
      const fretToAdd = recommendedFret !== null ? recommendedFret : 0;

      const newMeasures = tabData.measures.map(m => {
        if (m.id === measureId) {
          return { ...m, notes: [...m.notes, { string: stringNum, fret: fretToAdd, beat }] };
        }
        return m;
      });
      saveToHistory({ ...tabData, measures: newMeasures });
    }
  };

  const setChordAndNotes = (measureId: number, newChordName: string) => {
    const newChordInfo = chordInfo[newChordName];
    const newMeasures = tabData.measures.map(m => {
      if (m.id === measureId) {
        if (m.notes.length === 0 && newChordInfo) {
          // frets[0] = 1弦, frets[5] = 6弦
          const baseNotes = newChordInfo.frets
            .map((fret: number | null, idx: number) => fret !== null ? { string: idx + 1, fret: fret, beat: 0 } : null)
            .filter((n: Note | null): n is Note => n !== null);
          return { ...m, chord: newChordName, notes: baseNotes };
        }
        if (newChordInfo) {
          const updatedNotes = m.notes.map(note => {
            const targetFret = newChordInfo.frets[note.string - 1];
            return { ...note, fret: targetFret !== null ? targetFret : note.fret };
          });
          return { ...m, chord: newChordName, notes: updatedNotes };
        }
        return { ...m, chord: newChordName };
      }
      return m;
    });
    saveToHistory({ ...tabData, measures: newMeasures });
    setActiveChordPicker(null);
    setChordFilter('');
  };

  const setSpecificFret = (measureId: number, string: number, beat: number, fret: number | null) => {
    const newMeasures = tabData.measures.map(m => {
      if (m.id === measureId) {
        const existingNoteIdx = m.notes.findIndex(n => n.string === string && n.beat === beat);
        const newNotes = [...m.notes];
        if (fret === null) {
          if (existingNoteIdx > -1) newNotes.splice(existingNoteIdx, 1);
        } else {
          if (existingNoteIdx > -1) newNotes[existingNoteIdx].fret = fret;
          else newNotes.push({ string, fret, beat });
        }
        return { ...m, notes: newNotes };
      }
      return m;
    });
    saveToHistory({ ...tabData, measures: newMeasures });
    setActiveFretPicker(null);
  };

  const filteredChords = useMemo(() => {
    if (!chordFilter) return (THEORY_CHORDS[tabData.metadata.key] || CHORD_POOL).slice(0, 15);
    
    const filter = chordFilter.toLowerCase();
    return CHORD_POOL
      .filter(c => c.toLowerCase().includes(filter))
      .sort((a, b) => {
        const aLow = a.toLowerCase();
        const bLow = b.toLowerCase();
        if (aLow === filter) return -1;
        if (bLow === filter) return 1;
        if (aLow.startsWith(filter) && !bLow.startsWith(filter)) return -1;
        if (bLow.startsWith(filter) && !aLow.startsWith(filter)) return 1;
        return a.length - b.length;
      })
      .slice(0, 15);
  }, [chordFilter, tabData.metadata.key]);

  // 支援從指定 measure index 播放
  const playTab = async (startMeasureIdx?: number) => {
    if (isPlaying) { 
      Tone.Transport.stop(); 
      Tone.Transport.cancel(); 
      setIsPlaying(false); 
      setCurrentMeasure(null); 
      return; 
    }
    if (isEditMode) setIsEditMode(false);

    await Tone.start();
    setIsPlaying(true);
    Tone.Transport.bpm.value = tabData.metadata.bpm;
    Tone.Transport.cancel();

    // 只排程從 startMeasureIdx 開始的小節
    const startIdx = typeof startMeasureIdx === 'number' ? startMeasureIdx : 0;
    tabData.measures.slice(startIdx).forEach((measure, relIdx) => {
      if (measure.notes.length === 0 && measure.chord) {
        // Play the chord as a block chord for each subdivision
        const chordNotes = parseChordNotes(measure.chord);
        for (let b = 0; b < tabData.metadata.subdivisions; b++) {
          const time = `${relIdx}:${(b * 4) / tabData.metadata.subdivisions}`;
          Tone.Transport.schedule((t) => {
            if (synth.current) {
              // Play all chord notes as a block chord
              const chordMidis = chordNotes.map(n => 60 + n); // C4 = 60
              const freqs = chordMidis.map(midi => Tone.Frequency(midi, "midi").toFrequency());
              synth.current.triggerAttackRelease(freqs, "8n", t);
            }
            Tone.Draw.schedule(() => {
              setCurrentMeasure(measure.id);
              setCurrentBeat(b);
            }, t);
          }, time);
        }
      } else {
        measure.notes.forEach((note) => {
          const time = `${relIdx}:${(note.beat * 4) / tabData.metadata.subdivisions}`;
          Tone.Transport.schedule((t) => {
            if (synth.current) {
              const midiNote = getNoteMidi(note.string, note.fret);
              const freq = Tone.Frequency(midiNote, "midi").toFrequency();
              synth.current.triggerAttackRelease(freq, "8n", t);
            }
            Tone.Draw.schedule(() => { 
              setCurrentMeasure(measure.id); 
              setCurrentBeat(note.beat); 
            }, t);
          }, time);
        });
      }
    });

    Tone.Transport.schedule(() => {
      Tone.Draw.schedule(() => { 
        setIsPlaying(false); 
        setCurrentMeasure(null); 
        Tone.Transport.stop(); 
      }, Tone.now());
    }, `${tabData.measures.length - startIdx}:0`);

    Tone.Transport.start();
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100">
      {/* 導覽列 */}
      <nav className="z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all ${isEditMode ? 'bg-amber-500 scale-105 shadow-amber-200' : 'bg-indigo-600'}`}>
              <span className="material-icons text-[22px]">{isEditMode ? 'edit' : 'music_note'}</span>
            </div>
            <div>
              {isEditMode ? (
                <input
                  className="text-xl font-black tracking-tight uppercase bg-transparent border-b-2 border-indigo-100 focus:border-indigo-400 outline-none w-full mb-1"
                  value={tabData.metadata.title}
                  onChange={e => setTabData({ ...tabData, metadata: { ...tabData.metadata, title: e.target.value } })}
                  placeholder="請輸入標題"
                  aria-label="樂譜標題"
                  maxLength={64}
                />
              ) : (
                <h3 className="text-xl font-black tracking-tight uppercase">{tabData.metadata.title}</h3>
              )}
              <div className="flex gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                <span>{tabData.metadata.key}</span>
                <span>•</span>
                <span>{tabData.metadata.bpm} BPM</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <div className="flex gap-1 mr-4 border-r pr-4 border-zinc-200">
                <button onClick={undo} disabled={history.past.length === 0} className="p-2 rounded-lg hover:bg-zinc-100 disabled:opacity-20 transition-opacity flex items-center">
                  <span className="material-icons text-[18px]">undo</span>
                </button>
                <button onClick={redo} disabled={history.future.length === 0} className="p-2 rounded-lg hover:bg-zinc-100 disabled:opacity-20 transition-opacity flex items-center">
                  <span className="material-icons text-[18px]">redo</span>
                </button>
              </div>
            )}
            <button onClick={() => setViewMode(viewMode === 'render' ? 'data' : 'render')} className="p-2.5 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors flex items-center">
              <span className="material-icons text-[20px]">description</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-4 pb-56">
        {viewMode === 'render' ? (
          <div className="space-y-16">
            {/* 參數控制 */}
            <div className="bg-white p-8 rounded-3xl border border-zinc-200/60 shadow-sm flex flex-wrap gap-10 items-center animate-in fade-in duration-500">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">小節分段 (Subdivisions)</label>
                <div className="flex items-center gap-2">
                  {[4, 8, 16].map(num => (
                    <button
                      key={num}
                      onClick={() => isEditMode && saveToHistory({...tabData, metadata: {...tabData.metadata, subdivisions: num}})}
                      disabled={!isEditMode}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${tabData.metadata.subdivisions === num ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400'} ${!isEditMode ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-200'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-10 w-px bg-zinc-100 hidden md:block"></div>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">調性 (Key)</label>
                <div className="flex gap-2 items-center font-black text-indigo-600 text-lg">
                  <span className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 uppercase">{tabData.metadata.key} 調</span>
                </div>
              </div>
              <div className="h-10 w-px bg-zinc-100 hidden md:block"></div>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-1">每列顯示小節數</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setMeasuresPerRow(num)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${measuresPerRow === num ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>


            <div className="space-y-28">
              {Array.from({ length: Math.ceil(tabData.measures.length / measuresPerRow) }).map((_, rowIdx) => {
                const rowMeasures = tabData.measures.slice(rowIdx * measuresPerRow, (rowIdx + 1) * measuresPerRow);
                const blanks = Array.from({ length: measuresPerRow - rowMeasures.length });
                return (
                  <div key={rowIdx} className="flex gap-8 flex-wrap">
                    {rowMeasures.map((measure) => (
                      <div key={measure.id} className="relative flex-1 min-w-[320px]">
                        {isEditMode && (
                          <MeasureActions
                            canMovePrev={tabData.measures.findIndex(m => m.id === measure.id) > 0}
                            canMoveNext={tabData.measures.findIndex(m => m.id === measure.id) < tabData.measures.length - 1}
                            onMovePrev={() => {
                              const idx = tabData.measures.findIndex(m => m.id === measure.id);
                              if (idx > 0) {
                                const newMeasures = [...tabData.measures];
                                const temp = newMeasures[idx - 1];
                                newMeasures[idx - 1] = newMeasures[idx];
                                newMeasures[idx] = temp;
                                saveToHistory({ ...tabData, measures: newMeasures });
                              }
                            }}
                            onMoveNext={() => {
                              const idx = tabData.measures.findIndex(m => m.id === measure.id);
                              if (idx < tabData.measures.length - 1) {
                                const newMeasures = [...tabData.measures];
                                const temp = newMeasures[idx + 1];
                                newMeasures[idx + 1] = newMeasures[idx];
                                newMeasures[idx] = temp;
                                saveToHistory({ ...tabData, measures: newMeasures });
                              }
                            }}
                            onTextTab={() => setActiveTextTab({ measureId: measure.id, text: measure.textTab || '' })}
                            onCopy={() => {
                              const maxId = tabData.measures.length > 0 ? Math.max(...tabData.measures.map(m => m.id)) : 0;
                              const target = tabData.measures.find(m => m.id === measure.id);
                              if (!target) return;
                              const newMeasure = {
                                ...target,
                                id: maxId + 1,
                                notes: target.notes.map(n => ({ ...n })),
                              };
                              saveToHistory({
                                ...tabData,
                                measures: [...tabData.measures, newMeasure]
                              });
                            }}
                            onDelete={() => {
                              saveToHistory({
                                ...tabData,
                                measures: tabData.measures.filter(m => m.id !== measure.id)
                              });
                            }}
                          />
                        )}
                                          {/* 文字譜彈窗 */}
                                          {activeTextTab && activeTextTab.measureId === measure.id && (
                                            <>
                                              <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]" onClick={() => setActiveTextTab(null)} />
                                              <div className="absolute inset-x-0 top-10 z-60 bg-white/95 backdrop-blur-md rounded-3xl p-8 border-2 border-emerald-500 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 max-w-lg mx-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                  <h3 className="font-black text-lg text-emerald-700">編輯文字譜</h3>
                                                  <button onClick={() => setActiveTextTab(null)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 flex items-center">
                                                    <span className="material-icons text-[24px]">close</span>
                                                  </button>
                                                </div>
                                                <textarea
                                                  className="w-full rounded-xl border border-emerald-200 p-4 font-mono text-sm min-h-40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                  value={activeTextTab.text}
                                                  onChange={e => setActiveTextTab({ ...activeTextTab, text: e.target.value })}
                                                  placeholder={
`E |  |  |  |  |
B |  |  |  |  |
G |  |  |  |  |
D |  |  |  |  |
A |  |  |  |  |
E |  |  |  |  |`
                                                  }
                                                />
                                                <div className="flex justify-end gap-2 mt-4">
                                                  <button
                                                    className="px-5 py-2 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 font-bold"
                                                    onClick={() => setActiveTextTab(null)}
                                                  >取消</button>
                                                  <button
                                                    className="px-5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold"
                                                    onClick={() => {
                                                      updateTextTab(measure.id, activeTextTab.text);
                                                      setActiveTextTab(null);
                                                    }}
                                                  >儲存</button>
                                                </div>
                                              </div>
                                            </>
                                          )}
                      {/* 和弦選擇彈窗 */}
                      {activeChordPicker === measure.id && (
                        <>
                          <div className="fixed inset-0 z-40 bg-zinc-950/5 backdrop-blur-[2px]" onClick={() => {setActiveChordPicker(null); setChordFilter('');}} />
                          <div className="absolute inset-x-0 -top-8 z-50 bg-white/95 backdrop-blur-md rounded-3xl p-10 border-2 border-indigo-500 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 max-h-105">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                <h3 className="font-black text-2xl uppercase tracking-tighter shrink-0">變更和弦</h3>
                                <div className="relative w-full sm:w-80">
                                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[16px]">search</span>
                                  <input 
                                    autoFocus
                                    type="text"
                                    placeholder="搜尋... (G, Am7, Bbmaj7)"
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                                    value={chordFilter}
                                    onChange={(e) => setChordFilter(e.target.value)}
                                  />
                                </div>
                              </div>
                              <button onClick={() => {setActiveChordPicker(null); setChordFilter('');}} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 flex items-center">
                                <span className="material-icons text-[24px]">close</span>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 overflow-y-auto pr-2 pb-4 scrollbar-hide">
                              {filteredChords.map(c => (
                                <button 
                                  key={c}
                                  onClick={() => setChordAndNotes(measure.id, c)}
                                  className={`group py-4 rounded-2xl font-black text-lg border-2 transition-all ${measure.chord === c ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-zinc-100 hover:border-indigo-400 hover:text-indigo-600'}`}
                                >
                                  {c}
                                  <div className={`text-[9px] uppercase mt-1 opacity-40 group-hover:opacity-100 ${measure.chord === c ? 'text-indigo-200' : ''}`}>
                                    {chordInfo[c]?.theory || "Chord"}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                        <div className="flex items-center justify-between mb-10 px-4">
                          <div 
                            onClick={() => {
                              if (isEditMode) {
                                setActiveChordPicker(measure.id);
                              } else {
                                // 檢視模式下點擊小節標題，從該小節開始播放
                                const idx = tabData.measures.findIndex(m => m.id === measure.id);
                                if (idx !== -1) playTab(idx);
                              }
                            }}
                            className={`transition-all ${isEditMode ? 'cursor-pointer hover:scale-105 text-indigo-600' : 'cursor-pointer hover:scale-105 text-indigo-500'}`}
                            style={{ userSelect: 'none' }}
                          >
                            <span className="text-6xl font-black tracking-tighter uppercase leading-none">{measure.chord || "-"}</span>
                            {isEditMode && <span className="ml-4 text-[10px] font-black text-white uppercase tracking-widest bg-indigo-500 px-3 py-1 rounded-full shadow-lg shadow-indigo-100">變更和弦</span>}
                          </div>
                          <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-icons text-[14px]">straighten</span> 小節 #{measure.id}
                          </div>
                        </div>

                      <div className={`relative bg-white border-2 rounded-[3.5rem] p-12 transition-all ${currentMeasure === measure.id ? 'border-indigo-500 shadow-indigo-100 bg-indigo-50/10 ring-14 ring-indigo-50' : 'border-zinc-100'} ${isEditMode ? 'border-dashed border-amber-200' : ''}`}>
                        <div 
                            className={`relative min-h-56 grid gap-0`}
                            style={{ 
                              gridTemplateColumns: `repeat(${tabData.metadata.subdivisions}, 1fr)` 
                            }}
                          >
                          <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="relative w-full h-px bg-zinc-100">
                                <span className="absolute -left-16 -top-2.5 text-[10px] font-black text-zinc-400 w-12 text-right uppercase tracking-tighter">
                                  {tuningInfo[tabData.metadata.tuningName]?.[i] ?? ''}
                                </span>
                              </div>
                            ))}
                          </div>

                          {[...Array(tabData.metadata.subdivisions)].map((_, b) => {
                            const notesInColumn = measure.notes.filter(n => n.beat === b);
                            
                            return (
                              <div key={b} className="relative h-full border-l border-zinc-100/50 first:border-l-0 flex flex-col justify-between py-6 px-1 group/col transition-colors hover:bg-zinc-50/50">
                                
                                {isEditMode && notesInColumn.length > 0 && (
                                  <button 
                                    onClick={() => clearColumn(measure.id, b)}
                                    className="absolute -top-12 left-1/2 -translate-x-1/2 p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/col:opacity-100 shadow-sm flex items-center"
                                    title="清空此拍"
                                  >
                                    <span className="material-icons text-[14px]">delete</span>
                                  </button>
                                )}

                                {[...Array(6)].map((_, s) => {
                                  const stringNum = s + 1;
                                  const note = measure.notes.find(n => n.string === stringNum && n.beat === b);
                                  const isNoteActive = currentMeasure === measure.id && currentBeat === b;
                                  const isPicking = activeFretPicker?.measureId === measure.id && activeFretPicker?.string === stringNum && activeFretPicker?.beat === b;
                                  const chordNotes = parseChordNotes(measure.chord);

                                  return (
                                    <div key={s} className="relative w-full h-1 flex items-center justify-center">
                                      {note ? (
                                        <button 
                                          disabled={!isEditMode}
                                          onClick={() => handleGridClick(measure.id, stringNum, b)}
                                          className={`group/note relative z-10 w-8 h-8 rounded-[1.25rem] flex items-center justify-center font-mono font-bold text-sm shadow-xl transition-all ${isNoteActive ? 'bg-indigo-600 text-white scale-110 ring-8 ring-indigo-100' : 'bg-zinc-900 text-white shadow-zinc-200'} ${isEditMode ? 'hover:scale-110 active:scale-95' : 'cursor-default'}`}
                                        >
                                          {note.fret}
                                        </button>
                                      ) : (
                                        isEditMode && (
                                          <button 
                                            onClick={() => handleGridClick(measure.id, stringNum, b)}
                                            className="w-9 h-9 rounded-2xl border-2 border-dashed border-zinc-100 text-zinc-100 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center group"
                                          >
                                            <span className="material-icons text-[18px] group-hover:scale-125 transition-transform">add</span>
                                          </button>
                                        )
                                      )}

                                      {/* 指法選擇彈窗 */}
                                      {isPicking && (
                                        <>
                                          <div className="fixed inset-0 z-55 bg-transparent" onClick={() => setActiveFretPicker(null)} />
                                          <div className="absolute bottom-16 z-60 bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl p-7 w-72 animate-in slide-in-from-bottom-6 duration-300 ring-1 ring-black/5">
                                            <div className="flex justify-between items-center mb-5">
                                              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] px-1">Fret Selection</span>
                                              <button onClick={() => setActiveFretPicker(null)} className="text-zinc-300 hover:text-zinc-500 flex items-center">
                                                <span className="material-icons text-[16px]">close</span>
                                              </button>
                                            </div>
                                            <div className="grid grid-cols-6 gap-3">
                                              {[null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(f => {
                                                const midi = f !== null ? getNoteMidi(stringNum, f) : 0;
                                                const isChordNote = f !== null && chordNotes.includes(midi % 12);
                                                return (
                                                  <button 
                                                    key={f === null ? 'x' : f}
                                                    onClick={() => setSpecificFret(measure.id, stringNum, b, f)}
                                                    className={`h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                                                      f === null ? 'bg-red-50 text-red-500 border border-red-100' :
                                                      isChordNote ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
                                                    }`}
                                                  >
                                                    {f === null ? <span className="material-icons text-[14px]">delete</span> : f}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}

                                {isEditMode && notesInColumn.length > 0 && b < tabData.metadata.subdivisions - 1 && (
                                  <button 
                                    onClick={() => duplicateToNextEmpty(measure.id, b)}
                                    className={`absolute -bottom-12 left-1/2 -translate-x-1/2 p-2 rounded-xl transition-all opacity-0 group-hover/col:opacity-100 shadow-sm flex items-center ${measure.notes.some(n => n.beat > b && n.beat < tabData.metadata.subdivisions) ? 'text-zinc-200 bg-zinc-50' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                                    title="複製到下一個空格"
                                  >
                                    <span className="material-icons text-[14px]">content_copy</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-12 pt-10 border-t-2 border-zinc-50 flex flex-col gap-4">
                          <div className="flex items-center gap-3 px-2">
                            <span className="material-icons text-[16px] text-zinc-400">notes</span>
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">小節歌詞 (Lyrics)</span>
                          </div>
                          <textarea
                            disabled={!isEditMode}
                            value={measure.lyrics || ""}
                            onChange={(e) => updateLyrics(measure.id, e.target.value)}
                            placeholder={isEditMode ? "在這裡輸入歌詞..." : ""}
                            className={`w-full bg-zinc-50/50 rounded-2xl p-5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-20 resize-none ${!isEditMode && "bg-transparent text-zinc-500 px-0"}`}
                          />
                        </div>
                      </div>
                    </div>
                    ))}
                    {blanks.map((_, i) => (
                      <div key={`blank-${i}`} className="flex-1 min-w-[320px]" />
                    ))}
                  </div>
                );
              })}

              {isEditMode && (
                <button 
                  onClick={addMeasure}
                  className="w-full py-12 border-4 border-dashed border-zinc-200 rounded-[3.5rem] flex flex-col items-center justify-center gap-5 text-zinc-300 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all group"
                >
                  <span className="material-icons text-[48px] group-hover:rotate-180 transition-transform duration-700">add</span>
                  <span className="font-black uppercase tracking-[0.3em] text-sm">Create Next Measure</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 p-12 rounded-[3.5rem] shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom-8">
            <textarea
              disabled={!isEditMode}
              className="w-full text-indigo-300 font-mono text-[13px] leading-loose overflow-auto max-h-200 bg-transparent border-none outline-none resize-vertical"
              style={{ minHeight: 300 }}
              value={jsonEditValue}
              onChange={e => setJsonEditValue(e.target.value)}
              spellCheck={false}
            />
          </div>
        )}
      </main>

      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6">
        <div className="bg-white/95 backdrop-blur-3xl px-12 py-7 rounded-4xl shadow-2xl border border-zinc-200/50 flex items-center gap-12 ring-1 ring-zinc-900/10">
          <button 
            onClick={() => {
              if (isPlaying) playTab();
              if (isEditMode) {
                // 結束 JSON 編輯時，嘗試 parse 並 setTabData
                try {
                  const parsed = JSON.parse(jsonEditValue);
                  setTabData(parsed);
                } catch {
                  // 可選：顯示錯誤訊息
                }
                setIsEditMode(false);
              } else {
                setIsEditMode(true);
              }
            }}
            className={`flex items-center gap-5 px-10 py-5 rounded-4xl font-black text-sm tracking-[0.2em] transition-all active:scale-95 ${isEditMode ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-200 shadow-xl shadow-amber-100' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
          >
            <span className="material-icons text-[16px]">{isEditMode ? 'check' : 'layers'}</span>
            {isEditMode ? "FINISH" : "EDIT"}
          </button>
          
          <button 
            onClick={() => playTab()}
            disabled={isEditMode}
            className={`w-12 h-12 rounded-[2.5rem] flex items-center justify-center transition-all shadow-2xl ${
              isPlaying ? 'bg-red-500 shadow-red-200 text-white animate-pulse' : 
              isEditMode ? 'bg-zinc-100 text-zinc-200 cursor-not-allowed shadow-none' : 'bg-zinc-950 text-white hover:bg-indigo-600 hover:-translate-y-2 shadow-indigo-100'
            }`}
          >
            <span className="material-icons text-[32px]">{isPlaying ? 'stop' : 'play_arrow'}</span>
          </button>
          
          <div className="hidden xl:block border-l-2 border-zinc-100 pl-12 space-y-2 text-right">
            <div className="flex items-center justify-end gap-3 text-emerald-500">
              <span className="material-icons text-[14px]">check_circle</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Ready to Sync</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">History: {history.past.length} Steps</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tab;