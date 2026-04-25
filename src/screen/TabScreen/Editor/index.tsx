import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import type { TabData } from '../../../types';
import ControlsBar from './ControlsBar';
import MeasureCard from './MeasureCard';
import DataView from './DataView';
import { deepCopy, parseChordNotes, transposeTabData, migrateTabData, STRING_BASE_MIDI, decodeBeatChord, encodeBeatChord } from './utils';
import { CHORD_DATA } from '../../../components/GuitarChord/constants';

interface EditorProps {
  tabData?: TabData;
  updateData: (data: TabData) => void;
  createData: (data: TabData) => Promise<string>;
}

type Measure = TabData['measures'][0];

const defaultTabData: TabData = {
  id: '',
  title: '',
  artist: '',
  capo: 0,
  tuningName: 'standard',
  measures: [],
  subdivisions: 4,
  key: '',
  bpm: 0,
  updated_at: '',
  created_at: '',
};

const Editor: React.FC<EditorProps> = ({ tabData, updateData, createData }) => {
  const isNewRef = useRef<boolean>(tabData === undefined);
  const [currentData, setCurrentData] = useState<TabData>(() =>
    tabData === undefined ? defaultTabData : migrateTabData(deepCopy(tabData))
  );
  const [measuresPerRow, setMeasuresPerRow] = useState(2);
  const [history, setHistory] = useState<{ past: TabData[]; future: TabData[] }>({ past: [], future: [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [jsonEditValue, setJsonEditValue] = useState('');
  const [viewMode, setViewMode] = useState<'render' | 'data'>('render');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState<number | null>(null);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);
  const [showChordPhoto, setShowChordPhoto] = useState(true);
  const [showChordShapeMenu, setShowChordShapeMenu] = useState(false);
  const [volume, setVolume] = useState(6); // dB, range -20 to 12

  const synth = useRef<Tone.PolySynth | null>(null);
  const reverb = useRef<Tone.Reverb | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const currentDataRef = useRef<TabData>(currentData);
  const chordShapeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { currentDataRef.current = currentData; }, [currentData]);

  useEffect(() => {
    setJsonEditValue(JSON.stringify(tabData, null, 2));
    if (titleRef.current) titleRef.current.value = tabData?.title || '';
  }, [tabData]);

  useEffect(() => {
    if (!isEditMode) setJsonEditValue(JSON.stringify(currentData, null, 2));
  }, [isEditMode, currentData]);

  useEffect(() => {
    reverb.current = new Tone.Reverb(1.5).toDestination();
    synth.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
    }).connect(reverb.current);
    synth.current.volume.value = volume;
    return () => { Tone.Transport.stop(); Tone.Transport.cancel(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (synth.current) synth.current.volume.value = volume;
  }, [volume]);

  useEffect(() => {
    if (!showChordShapeMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (chordShapeMenuRef.current && !chordShapeMenuRef.current.contains(e.target as Node)) {
        setShowChordShapeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChordShapeMenu]);

  // --- History ---

  // commit: snapshot current state to history, then apply the update
  const commit = useCallback((updater: TabData | ((prev: TabData) => TabData)) => {
    const snapshot = currentDataRef.current;
    setCurrentData(prev => typeof updater === 'function' ? updater(prev) : updater);
    setHistory(prev => ({
      past: [...prev.past, snapshot].slice(-50),
      future: [],
    }));
  }, []);

  const applyChordShape = useCallback((shape: 'Open' | 'A' | 'E') => {
    commit(prev => ({
      ...prev,
      measures: prev.measures.map(measure => {
        const positions = CHORD_DATA[measure.chord];
        let newIdx = measure.chordPositionIndex ?? 0;
        if (positions && positions.length > 1) {
          const found = positions.findIndex(p => p.baseShape === shape);
          if (found !== -1) newIdx = found;
        }
        const newNotes = measure.notes.map(beat => {
          if (typeof beat !== 'string') return beat;
          const { name } = decodeBeatChord(beat);
          const beatPositions = CHORD_DATA[name];
          if (!beatPositions || beatPositions.length <= 1) return beat;
          const foundBeat = beatPositions.findIndex(p => p.baseShape === shape);
          return foundBeat !== -1 ? encodeBeatChord(name, foundBeat) : beat;
        });
        return { ...measure, chordPositionIndex: newIdx, notes: newNotes };
      }),
    }));
    setShowChordShapeMenu(false);
  }, [commit]);

  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const current = currentDataRef.current;
    setHistory(prev => ({ past: prev.past.slice(0, -1), future: [current, ...prev.future] }));
    setCurrentData(previous);
  }, [history.past]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const current = currentDataRef.current;
    setHistory(prev => ({ past: [...prev.past, current], future: prev.future.slice(1) }));
    setCurrentData(next);
  }, [history.future]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  // --- Measure mutations ---

  const updateMeasure = useCallback((updated: Measure) => {
    commit(prev => ({
      ...prev,
      measures: prev.measures.map(m => m.id === updated.id ? updated : m),
    }));
  }, [commit]);

  const emptyMeasure = (id: number): Measure => ({ id, chord: '', lyrics: '', notes: [] });

  const addMeasureAtEnd = () => {
    commit(prev => {
      const newId = prev.measures.length > 0 ? Math.max(...prev.measures.map(m => m.id)) + 1 : 1;
      return { ...prev, measures: [...prev.measures, emptyMeasure(newId)] };
    });
  };

  const addMeasureAtStart = () => {
    commit(prev => {
      const newId = prev.measures.length > 0 ? Math.max(...prev.measures.map(m => m.id)) + 1 : 1;
      return { ...prev, measures: [emptyMeasure(newId), ...prev.measures] };
    });
  };

  const moveMeasure = (measureId: number, direction: 'prev' | 'next') => {
    commit(prev => {
      const idx = prev.measures.findIndex(m => m.id === measureId);
      const swapIdx = direction === 'prev' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.measures.length) return prev;
      const newMeasures = [...prev.measures];
      [newMeasures[idx], newMeasures[swapIdx]] = [newMeasures[swapIdx], newMeasures[idx]];
      return { ...prev, measures: newMeasures };
    });
  };

  const copyMeasure = (measureId: number, position: 'next' | 'end') => {
    commit(prev => {
      const maxId = Math.max(0, ...prev.measures.map(m => m.id));
      const idx = prev.measures.findIndex(m => m.id === measureId);
      const target = prev.measures[idx];
      if (!target) return prev;
      const copy: Measure = {
        ...target,
        id: maxId + 1,
        notes: target.notes.map(b => Array.isArray(b) ? [...b] : b),
      };
      const newMeasures = position === 'next'
        ? [...prev.measures.slice(0, idx + 1), copy, ...prev.measures.slice(idx + 1)]
        : [...prev.measures, copy];
      return { ...prev, measures: newMeasures };
    });
  };

  const deleteMeasure = (measureId: number) =>
    commit(prev => ({ ...prev, measures: prev.measures.filter(m => m.id !== measureId) }));

  // --- Playback ---

  const playTab = async (startMeasureIdx?: number) => {
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setIsPlaying(false);
      setCurrentMeasure(null);
      if (startMeasureIdx === undefined) return;
    }
    if (isEditMode) setIsEditMode(false);
    await Tone.start();
    setIsPlaying(true);
    Tone.Transport.bpm.value = currentData.bpm;
    Tone.Transport.cancel();

    const startIdx = startMeasureIdx ?? 0;
    currentData.measures.slice(startIdx).forEach((measure, relIdx) => {
      const hasNotes = measure.notes.some(b =>
        typeof b === 'string' || (Array.isArray(b) && b.some(fret => fret !== null))
      );

      for (let b = 0; b < currentData.subdivisions; b++) {
        const beat = measure.notes[b] ?? null;
        const timePos = `${relIdx}:${(b * 4) / currentData.subdivisions}`;

        if (typeof beat === 'string') {
          const chordTones = parseChordNotes(decodeBeatChord(beat).name);
          if (chordTones.length === 0) continue;
          Tone.Transport.schedule(t => {
            synth.current?.triggerAttackRelease(
              chordTones.map(n => Tone.Frequency(60 + n, 'midi').toFrequency()), '8n', t
            );
            Tone.Draw.schedule(() => { setCurrentMeasure(measure.id); setCurrentBeat(b); }, t);
          }, timePos);
        } else if (Array.isArray(beat)) {
          const freqs: number[] = [];
          beat.forEach((fret, s) => {
            if (fret !== null) freqs.push(Tone.Frequency(STRING_BASE_MIDI[s] + fret, 'midi').toFrequency());
          });
          if (freqs.length === 0) continue;
          Tone.Transport.schedule(t => {
            synth.current?.triggerAttackRelease(freqs, '8n', t);
            Tone.Draw.schedule(() => { setCurrentMeasure(measure.id); setCurrentBeat(b); }, t);
          }, timePos);
        } else if (measure.chord && !hasNotes) {
          const chordTones = parseChordNotes(measure.chord);
          if (chordTones.length === 0) continue;
          Tone.Transport.schedule(t => {
            synth.current?.triggerAttackRelease(
              chordTones.map(n => Tone.Frequency(60 + n, 'midi').toFrequency()), '8n', t
            );
            Tone.Draw.schedule(() => { setCurrentMeasure(measure.id); setCurrentBeat(b); }, t);
          }, timePos);
        }
      }
    });

    Tone.Transport.schedule(() => {
      Tone.Draw.schedule(() => { setIsPlaying(false); setCurrentMeasure(null); Tone.Transport.stop(); }, Tone.now());
    }, `${currentData.measures.length - startIdx}:0`);

    Tone.Transport.start();
  };

  const volumeIcon = volume <= -20 ? 'volume_off' : volume >= 0 ? 'volume_up' : 'volume_down';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100">
      <nav className="z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all ${isEditMode ? 'bg-amber-500 scale-105 shadow-amber-200' : 'bg-indigo-600'}`}>
              <span className="material-icons text-[22px]">{isEditMode ? 'edit' : 'music_note'}</span>
            </div>
            <div>
              {isEditMode ? (
                <input
                  ref={titleRef}
                  className="text-xl font-black tracking-tight bg-transparent border-b-2 border-indigo-100 focus:border-indigo-400 outline-none w-full mb-1"
                  defaultValue={currentData.title}
                  placeholder="請輸入標題"
                  aria-label="樂譜標題"
                  maxLength={64}
                  onBlur={() => {
                    if (titleRef.current && titleRef.current.value !== currentData.title)
                      commit(prev => ({ ...prev, title: titleRef.current!.value }));
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) (e.target as HTMLInputElement).blur(); }}
                />
              ) : (
                <h3 className="text-xl font-black tracking-tight">{currentData.title}</h3>
              )}
              <div className="flex gap-3 text-[10px] font-bold text-zinc-400 tracking-widest mt-0.5">
                {currentData.artist && <><span>{currentData.artist}</span><span>•</span></>}
                {currentData.key && <span>{currentData.key}</span>}
                {currentData.key && <span>•</span>}
                <span>{currentData.bpm} BPM</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <div className="flex gap-1 mr-4 border-r pr-4 border-zinc-200">
                <button
                  onClick={undo}
                  disabled={history.past.length === 0}
                  title="復原 (Ctrl+Z)"
                  className="p-2 rounded-lg hover:bg-zinc-100 disabled:opacity-20 transition-opacity flex items-center"
                >
                  <span className="material-icons text-[18px]">undo</span>
                </button>
                <button
                  onClick={redo}
                  disabled={history.future.length === 0}
                  title="重做 (Ctrl+Shift+Z)"
                  className="p-2 rounded-lg hover:bg-zinc-100 disabled:opacity-20 transition-opacity flex items-center"
                >
                  <span className="material-icons text-[18px]">redo</span>
                </button>
              </div>
            )}
            <button
              onClick={() => setShowChordPhoto(v => !v)}
              title={showChordPhoto ? '隱藏和弦圖' : '顯示和弦圖'}
              className={`p-2.5 rounded-xl transition-colors flex items-center ${showChordPhoto ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
            >
              <span className="material-icons text-[20px]">piano</span>
            </button>
            <div className="relative" ref={chordShapeMenuRef}>
              <button
                onClick={() => setShowChordShapeMenu(v => !v)}
                title="一鍵切換和弦型態"
                className={`p-2.5 rounded-xl transition-colors flex items-center ${showChordShapeMenu ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                <span className="material-icons text-[20px]">tune</span>
              </button>
              {showChordShapeMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-zinc-200 py-1 z-50 min-w-30">
                  {(['Open', 'A', 'E'] as const).map(shape => (
                    <button
                      key={shape}
                      onClick={() => applyChordShape(shape)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors text-zinc-700"
                    >
                      {shape === 'Open' ? '開放和弦' : `封閉和弦 ${shape} 型`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setViewMode(viewMode === 'render' ? 'data' : 'render')} className="p-2.5 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors flex items-center">
              <span className="material-icons text-[20px]">description</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-4 pb-56">
        {viewMode === 'render' ? (
          <div className="space-y-16">
            <ControlsBar
              isEditMode={isEditMode}
              subdivisions={currentData.subdivisions}
              onSubdivisionsChange={num => commit(prev => ({ ...prev, subdivisions: num }))}
              keyLabel={currentData.key}
              onKeyChange={val => commit(prev => ({ ...prev, key: val }))}
              bpm={currentData.bpm}
              onBpmChange={val => commit(prev => ({ ...prev, bpm: val }))}
              artist={currentData.artist}
              onArtistChange={val => commit(prev => ({ ...prev, artist: val }))}
              capo={currentData.capo}
              onCapoChange={val => commit(prev => ({ ...prev, capo: val }))}
              measuresPerRow={measuresPerRow}
              onMeasuresPerRowChange={setMeasuresPerRow}
              onTranspose={semitones => commit(prev => transposeTabData(prev, semitones))}
            />

            <div className="space-y-28">
              {isEditMode && (
                <button
                  onClick={addMeasureAtStart}
                  className="w-full mb-4 py-4 border-4 border-dashed border-indigo-200 rounded-4xl flex flex-col items-center justify-center gap-2 text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group"
                >
                  <span className="material-icons text-[28px] group-hover:rotate-180 transition-transform duration-700">add</span>
                  <span className="font-black tracking-[0.2em] text-sm">新增小節（最前面）</span>
                </button>
              )}

              {Array.from({ length: Math.ceil(currentData.measures.length / measuresPerRow) }).map((_, rowIdx) => {
                const rowMeasures = currentData.measures.slice(rowIdx * measuresPerRow, (rowIdx + 1) * measuresPerRow);
                const blanks = measuresPerRow - rowMeasures.length;
                return (
                  <div key={rowIdx} className="flex gap-8 flex-wrap mb-4">
                    {rowMeasures.map((measure, colIdx) => {
                      const idx = rowIdx * measuresPerRow + colIdx;
                      return (
                        <MeasureCard
                          key={measure.id}
                          measure={measure}
                          isEditMode={isEditMode}
                          subdivisions={currentData.subdivisions}
                          showChordPhoto={showChordPhoto}
                          currentMeasure={currentMeasure}
                          currentBeat={currentBeat}
                          canMovePrev={idx > 0}
                          canMoveNext={idx < currentData.measures.length - 1}
                          onMovePrev={() => moveMeasure(measure.id, 'prev')}
                          onMoveNext={() => moveMeasure(measure.id, 'next')}
                          onCopyNext={() => copyMeasure(measure.id, 'next')}
                          onCopyLast={() => copyMeasure(measure.id, 'end')}
                          onDelete={() => deleteMeasure(measure.id)}
                          onUpdate={updateMeasure}
                          onPlayFrom={() => playTab(idx)}
                        />
                      );
                    })}
                    {Array.from({ length: blanks }).map((_, i) => (
                      <div key={`blank-${i}`} className="flex-1 min-w-[320px]" />
                    ))}
                  </div>
                );
              })}

              {isEditMode && (
                <button
                  onClick={addMeasureAtEnd}
                  className="w-full py-4 border-4 border-dashed border-indigo-200 rounded-4xl flex flex-col items-center justify-center gap-2 text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group"
                >
                  <span className="material-icons text-[28px] group-hover:rotate-180 transition-transform duration-700">add</span>
                  <span className="font-black tracking-[0.2em] text-sm">新增小節（最後面）</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <DataView
            jsonEditValue={jsonEditValue}
            setJsonEditValue={setJsonEditValue}
            currentDataId={currentData.id}
            onApply={data => commit(() => data)}
          />
        )}
      </main>

      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6">
        <div className="bg-white/95 backdrop-blur-3xl px-12 py-7 rounded-4xl shadow-2xl border border-zinc-200/50 flex items-center gap-12 ring-1 ring-zinc-900/10">
          <button
            onClick={() => {
              if (isPlaying) playTab();
              if (isEditMode) {
                if (isNewRef.current) {
                  createData(currentData).then(newId => {
                    setCurrentData(prev => ({ ...prev, id: newId }));
                  });
                  isNewRef.current = false;
                }
                else updateData(currentData);
              }
              setIsEditMode(prev => !prev);
            }}
            className={`flex items-center gap-5 px-10 py-5 rounded-4xl font-black text-sm tracking-[0.2em] transition-all active:scale-95 ${isEditMode ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-200 shadow-xl shadow-amber-100' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
          >
            <span className="material-icons text-[16px]">{isEditMode ? 'check' : 'layers'}</span>
            {isEditMode ? 'FINISH' : 'EDIT'}
          </button>

          <button
            onClick={() => playTab()}
            disabled={isEditMode}
            className={`w-12 h-12 rounded-[2.5rem] flex items-center justify-center transition-all shadow-2xl ${
              isPlaying
                ? 'bg-red-500 shadow-red-200 text-white animate-pulse'
                : isEditMode
                  ? 'bg-zinc-100 text-zinc-200 cursor-not-allowed shadow-none'
                  : 'bg-zinc-950 text-white hover:bg-indigo-600 hover:-translate-y-2 shadow-indigo-100'
            }`}
          >
            <span className="material-icons text-[32px]">{isPlaying ? 'stop' : 'play_arrow'}</span>
          </button>

          <div className="flex items-center gap-2.5" title={`音量 ${volume} dB`}>
            <button
              onClick={() => setVolume(v => v <= -20 ? 6 : -20)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors flex items-center"
            >
              <span className="material-icons text-[18px]">{volumeIcon}</span>
            </button>
            <input
              type="range"
              min={-20}
              max={12}
              step={2}
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="w-20 cursor-pointer accent-indigo-600"
              aria-label="音量調節"
            />
          </div>

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

export default Editor;
