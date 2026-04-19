import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import type { TabData } from '../../../types';
import ControlsBar from './ControlsBar';
import MeasureCard from './MeasureCard';
import DataView from './DataView';
import BottomBar from './BottomBar';
import { deepCopy, parseChordNotes, getNoteMidi, transposeTabData } from './utils';

interface EditorProps {
  tabData?: TabData;
  updateData: (data: TabData) => void;
  createData: (data: TabData) => void;
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
  const isNew = tabData === undefined;
  const [currentData, setCurrentData] = useState<TabData>(isNew ? defaultTabData : deepCopy(tabData));
  const [measuresPerRow, setMeasuresPerRow] = useState(2);
  const [history, setHistory] = useState<{ past: TabData[]; future: TabData[] }>({ past: [], future: [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [jsonEditValue, setJsonEditValue] = useState('');
  const [viewMode, setViewMode] = useState<'render' | 'data'>('render');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState<number | null>(null);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);

  const synth = useRef<Tone.PolySynth | null>(null);
  const reverb = useRef<Tone.Reverb | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

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
    return () => { Tone.Transport.stop(); Tone.Transport.cancel(); };
  }, []);

  // --- History ---

  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    setHistory(prev => ({ past: prev.past.slice(0, -1), future: [currentData, ...prev.future] }));
    setCurrentData(previous);
  }, [history, currentData]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    setHistory(prev => ({ past: [...prev.past, currentData], future: prev.future.slice(1) }));
    setCurrentData(next);
  }, [history, currentData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  // --- Measure mutations ---

  const updateMeasure = useCallback((updated: Measure) => {
    setCurrentData(prev => ({
      ...prev,
      measures: prev.measures.map(m => m.id === updated.id ? updated : m),
    }));
  }, []);

  const addMeasureAtEnd = () => {
    const newId = currentData.measures.length > 0 ? Math.max(...currentData.measures.map(m => m.id)) + 1 : 1;
    setCurrentData(prev => ({ ...prev, measures: [...prev.measures, { id: newId, chord: '', lyrics: '', notes: [], textTab: '' }] }));
  };

  const addMeasureAtStart = () => {
    const newId = currentData.measures.length > 0 ? Math.max(...currentData.measures.map(m => m.id)) + 1 : 1;
    setCurrentData(prev => ({ ...prev, measures: [{ id: newId, chord: '', lyrics: '', notes: [], textTab: '' }, ...prev.measures] }));
  };

  const moveMeasure = (measureId: number, direction: 'prev' | 'next') => {
    const idx = currentData.measures.findIndex(m => m.id === measureId);
    const swapIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= currentData.measures.length) return;
    const newMeasures = [...currentData.measures];
    [newMeasures[idx], newMeasures[swapIdx]] = [newMeasures[swapIdx], newMeasures[idx]];
    setCurrentData(prev => ({ ...prev, measures: newMeasures }));
  };

  const copyMeasure = (measureId: number) => {
    const maxId = Math.max(0, ...currentData.measures.map(m => m.id));
    const idx = currentData.measures.findIndex(m => m.id === measureId);
    const target = currentData.measures[idx];
    if (!target) return;
    const copy = { ...target, id: maxId + 1, notes: target.notes.map(n => ({ ...n })) };
    setCurrentData(prev => ({
      ...prev,
      measures: [...prev.measures.slice(0, idx + 1), copy, ...prev.measures.slice(idx + 1)],
    }));
  };

  const deleteMeasure = (measureId: number) =>
    setCurrentData(prev => ({ ...prev, measures: prev.measures.filter(m => m.id !== measureId) }));

  // --- Playback ---

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
    Tone.Transport.bpm.value = currentData.bpm;
    Tone.Transport.cancel();

    const startIdx = startMeasureIdx ?? 0;
    currentData.measures.slice(startIdx).forEach((measure, relIdx) => {
      if (measure.notes.length === 0 && measure.chord) {
        const chordTones = parseChordNotes(measure.chord);
        for (let b = 0; b < currentData.subdivisions; b++) {
          Tone.Transport.schedule(t => {
            if (synth.current) {
              synth.current.triggerAttackRelease(
                chordTones.map(n => Tone.Frequency(60 + n, 'midi').toFrequency()), '8n', t
              );
            }
            Tone.Draw.schedule(() => { setCurrentMeasure(measure.id); setCurrentBeat(b); }, t);
          }, `${relIdx}:${(b * 4) / currentData.subdivisions}`);
        }
      } else {
        measure.notes.forEach(note => {
          Tone.Transport.schedule(t => {
            if (synth.current) {
              synth.current.triggerAttackRelease(
                Tone.Frequency(getNoteMidi(note.string, note.fret), 'midi').toFrequency(), '8n', t
              );
            }
            Tone.Draw.schedule(() => { setCurrentMeasure(measure.id); setCurrentBeat(note.beat); }, t);
          }, `${relIdx}:${(note.beat * 4) / currentData.subdivisions}`);
        });
      }
    });

    Tone.Transport.schedule(() => {
      Tone.Draw.schedule(() => { setIsPlaying(false); setCurrentMeasure(null); Tone.Transport.stop(); }, Tone.now());
    }, `${currentData.measures.length - startIdx}:0`);

    Tone.Transport.start();
  };

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
                      setCurrentData({ ...currentData, title: titleRef.current.value });
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
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
            <button onClick={() => isNew ? createData(currentData) : updateData(currentData)} className="p-2.5 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors flex items-center gap-1">
              <span className="material-icons text-[20px]">save</span>
              <span>{isNew ? 'Create' : 'Update'}</span>
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
              onSubdivisionsChange={num => setCurrentData(prev => ({ ...prev, subdivisions: num }))}
              keyLabel={currentData.key}
              onKeyChange={val => setCurrentData(prev => ({ ...prev, key: val }))}
              bpm={currentData.bpm}
              onBpmChange={val => setCurrentData(prev => ({ ...prev, bpm: val }))}
              artist={currentData.artist}
              onArtistChange={val => setCurrentData(prev => ({ ...prev, artist: val }))}
              capo={currentData.capo}
              onCapoChange={val => setCurrentData(prev => ({ ...prev, capo: val }))}
              measuresPerRow={measuresPerRow}
              onMeasuresPerRowChange={setMeasuresPerRow}
              onTranspose={semitones => setCurrentData(prev => transposeTabData(prev, semitones))}
            />

            <div className="space-y-28">
              {isEditMode && (
                <button
                  onClick={addMeasureAtStart}
                  className="w-full mb-8 py-4 border-4 border-dashed border-indigo-200 rounded-4xl flex flex-col items-center justify-center gap-2 text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group"
                >
                  <span className="material-icons text-[28px] group-hover:rotate-180 transition-transform duration-700">add</span>
                  <span className="font-black tracking-[0.2em] text-sm">新增小節（最前面）</span>
                </button>
              )}

              {Array.from({ length: Math.ceil(currentData.measures.length / measuresPerRow) }).map((_, rowIdx) => {
                const rowMeasures = currentData.measures.slice(rowIdx * measuresPerRow, (rowIdx + 1) * measuresPerRow);
                const blanks = measuresPerRow - rowMeasures.length;
                return (
                  <div key={rowIdx} className="flex gap-8 flex-wrap">
                    {rowMeasures.map((measure, colIdx) => {
                      const idx = rowIdx * measuresPerRow + colIdx;
                      return (
                        <MeasureCard
                          key={measure.id}
                          measure={measure}
                          isEditMode={isEditMode}
                          subdivisions={currentData.subdivisions}
                          currentMeasure={currentMeasure}
                          currentBeat={currentBeat}
                          canMovePrev={idx > 0}
                          canMoveNext={idx < currentData.measures.length - 1}
                          onMovePrev={() => moveMeasure(measure.id, 'prev')}
                          onMoveNext={() => moveMeasure(measure.id, 'next')}
                          onCopy={() => copyMeasure(measure.id)}
                          onDelete={() => deleteMeasure(measure.id)}
                          onUpdate={updateMeasure}
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
                  className="w-full py-12 border-4 border-dashed border-zinc-200 rounded-[3.5rem] flex flex-col items-center justify-center gap-5 text-zinc-300 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all group"
                >
                  <span className="material-icons text-[48px] group-hover:rotate-180 transition-transform duration-700">add</span>
                  <span className="font-black tracking-[0.3em] text-sm">Create Next Measure</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <DataView
            jsonEditValue={jsonEditValue}
            setJsonEditValue={setJsonEditValue}
            currentDataId={currentData.id}
            onApply={setCurrentData}
          />
        )}
      </main>

      <BottomBar
        isPlaying={isPlaying}
        isEditMode={isEditMode}
        historyPastLength={history.past.length}
        onToggleEdit={() => { if (isPlaying) playTab(); setIsEditMode(prev => !prev); }}
        onTogglePlay={() => playTab()}
      />
    </div>
  );
};

export default Editor;
