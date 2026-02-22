import React, { useState } from 'react';
import { NOTES, type NoteName } from '../../utils/musicTheory';
import { soundEngine } from '../../utils/soundEngine';
import { Selector } from '../../components/Selector';

type ChordCategory = 'triads' | 'seventh';

const CHORD_DATA = {
  triads: [
    {
        name: 'Major Triad (大三和弦)',
        type: 'Major',
        formula: '1 - 3 - 5',
        intervals: ['Root (1)', 'Major 3rd (3)', 'Perfect 5th (5)'],
        semitones: [0, 4, 7],
        description: '聽起來明亮、快樂、穩定。由根音、大三度與完全五度組成。',
        exampleDegree: ['1', '3', '5']
    },
    {
        name: 'Minor Triad (小三和弦)',
        type: 'Minor',
        formula: '1 - b3 - 5',
        intervals: ['Root (1)', 'Minor 3rd (b3)', 'Perfect 5th (5)'],
        semitones: [0, 3, 7],
        description: '聽起來悲傷、憂鬱、深沉。由根音、小三度與完全五度組成。',
        exampleDegree: ['1', 'b3', '5']
    },
    {
        name: 'Diminished Triad (減三和弦)',
        type: 'Diminished',
        formula: '1 - b3 - b5',
        intervals: ['Root (1)', 'Minor 3rd (b3)', 'Diminished 5th (b5)'],
        semitones: [0, 3, 6],
        description: '聽起來緊張、不穩定、像恐怖片。由根音、小三度與減五度組成。',
        exampleDegree: ['1', 'b3', 'b5']
    },
    {
        name: 'Augmented Triad (增三和弦)',
        type: 'Augmented',
        formula: '1 - 3 - #5',
        intervals: ['Root (1)', 'Major 3rd (3)', 'Augmented 5th (#5)'],
        semitones: [0, 4, 8],
        description: '聽起來神秘、懸疑、擴張感。由根音、大三度與增五度組成。',
        exampleDegree: ['1', '3', '#5']
    }
  ],
  seventh: [
    {
        name: 'Major 7th (大七和弦)',
        type: 'Maj7',
        formula: '1 - 3 - 5 - 7',
        intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Major 7th'],
        semitones: [0, 4, 7, 11],
        description: '聽起來夢幻、優雅、爵士感強烈。在大三和弦基礎上加入大七度。',
        exampleDegree: ['1', '3', '5', '7']
    },
    {
        name: 'Minor 7th (小七和弦)',
        type: 'm7',
        formula: '1 - b3 - 5 - b7',
        intervals: ['Root', 'Minor 3rd', 'Perfect 5th', 'Minor 7th'],
        semitones: [0, 3, 7, 10],
        description: '聽起來柔和、放鬆、現代。在小三和弦基礎上加入小七度。',
        exampleDegree: ['1', 'b3', '5', 'b7']
    },
    {
        name: 'Dominant 7th (屬七和弦)',
        type: 'dom7',
        formula: '1 - 3 - 5 - b7',
        intervals: ['Root', 'Major 3rd', 'Perfect 5th', 'Minor 7th'],
        semitones: [0, 4, 7, 10],
        description: '聽起來不穩定、有強烈解決傾向（想回到主和弦）。',
        exampleDegree: ['1', '3', '5', 'b7']
    },
    {
        name: 'Half-Diminished 7th (半減七)',
        type: 'm7b5',
        formula: '1 - b3 - b5 - b7',
        intervals: ['Root', 'Minor 3rd', 'Diminished 5th', 'Minor 7th'],
        semitones: [0, 3, 6, 10],
        description: '聽起來比減三和弦稍微柔和一點，常用於小調的 II 級和弦。',
        exampleDegree: ['1', 'b3', 'b5', 'b7']
    }
  ]
};

const LearnScreen: React.FC = () => {
    const [selectedRoot, setSelectedRoot] = useState<NoteName>('C');
    const [category, setCategory] = useState<ChordCategory>('triads');

    const getChordNotes = (root: NoteName, semitones: number[]) => {
        const rootIndex = NOTES.indexOf(root);
        return semitones.map(interval => {
            const index = (rootIndex + interval) % 12;
            const octaveShift = Math.floor((rootIndex + interval) / 12);
            return {
                note: NOTES[index],
                fullNote: `${NOTES[index]}${4 + octaveShift}`
            };
        });
    };

    const handlePlayChord = async (semitones: number[]) => {
        await soundEngine.initialize();
        const notes = getChordNotes(selectedRoot, semitones).map(n => n.fullNote);
        soundEngine.playNotes(notes, '2n');
    };

  return (
    <div className="mx-auto p-4 sm:p-6 space-y-6 text-foreground">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="material-icons text-primary" style={{ fontSize: '24px' }}>menu_book</span>
          樂理知識庫
        </h1>
        <p className="opacity-60 mt-2 text-sm sm:text-base">
            <strong>英文字母 (C, E, G)</strong> 告訴你手要按哪裡，
            <strong>數字 (1, 3, 5)</strong> 告訴你它們聽起來是什麼感覺。
            整合兩者是聽力進步的關鍵。
        </p>
        
        {/* Root Note Selector */}
        <div className="mt-6 flex flex-col gap-4">
            
            {/* Category Switcher */}
            <div className="self-start w-full sm:w-auto">
                <Selector
                    value={category}
                    onChange={setCategory}
                    options={[
                        { value: 'triads', label: '基礎三和弦' },
                        { value: 'seventh', label: '七和弦' }
                    ]}
                    size="sm"
                />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 bg-secondary/10 p-3 rounded-xl border border-border/50">
                <span className="text-sm font-medium opacity-80 whitespace-nowrap px-1">根音 (Key):</span>
                <div className="flex gap-2 w-full overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    {NOTES.map(note => (
                        <button
                            key={note}
                            onClick={() => setSelectedRoot(note)}
                            className={`
                                px-3 py-1.5 rounded-md text-sm font-bold transition-all min-w-[36px] flex-shrink-0
                                ${selectedRoot === note 
                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                    : 'bg-background hover:bg-secondary/20 border border-border/50'
                                }
                            `}
                        >
                            {note}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </header>
      
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {CHORD_DATA[category].map((chord) => {
          const currentNotes = getChordNotes(selectedRoot, chord.semitones);
          
          return (
          <div key={chord.name} className="border border-border rounded-xl p-6 bg-card hover:bg-secondary/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="material-icons text-primary opacity-80" style={{ fontSize: '20px' }}>music_note</span>
                {chord.name}
                </h3>
                <button 
                  onClick={() => handlePlayChord(chord.semitones)}
                  className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  title="播放和弦"
                >
                    <span className="material-icons" style={{ fontSize: '20px' }}>volume_up</span>
                </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-secondary/20 p-3 rounded-lg text-sm font-mono">
                <span className="opacity-60 block text-xs mb-1 uppercase tracking-wider">Formula</span>
                <span className="text-lg font-bold text-primary">{chord.formula}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold opacity-80 mb-1">音程結構</h4>
                    <ul className="text-sm space-y-1 opacity-70 list-disc list-inside">
                    {chord.intervals.map((interval, i) => (
                        <li key={i}>{interval}</li>
                    ))}
                    </ul>
                  </div>
                  <div className="bg-secondary/10 p-2 rounded-lg border border-border/50">
                     <h4 className="text-xs font-semibold opacity-60 mb-2 uppercase text-center">{selectedRoot} Key 範例</h4>
                     <div className="flex justify-between text-center gap-1">
                        {currentNotes.map((noteInfo, i) => (
                            <div key={i} className="flex-1 bg-background/50 rounded p-1">
                                <div className="text-xs opacity-50 font-mono mb-1">{chord.exampleDegree[i]}</div>
                                <div className="font-bold text-sm text-primary">{noteInfo.note}</div>
                            </div>
                        ))}
                     </div>
                  </div>
              </div>
              
              <div className="flex gap-3 items-start p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <span className="material-icons text-blue-500 mt-0.5 shrink-0" style={{ fontSize: '16px' }}>info</span>
                <p className="text-sm opacity-80 leading-relaxed">
                  {chord.description}
                </p>
              </div>
            </div>
          </div>
        )})}
      </div>


      
      <div className="mt-12 p-6 bg-secondary/10 rounded-xl border border-border">
        <h3 className="text-lg font-bold mb-4">如何練習？</h3>
        <ul className="space-y-2 list-decimal list-inside opacity-80">
            <li>先在 <strong>Learn</strong> 頁面熟悉各個和弦的組成與特質描述。</li>
            <li>切換到 <strong>Try</strong> 頁面，選擇「和弦練習」。</li>
            <li>試聽題目，嘗試分辨是快樂的 (Major)、悲傷的 (Minor) 還是緊張的 (Diminished)。</li>
            <li>在樂器上找出對應的根音與組成音來作答。</li>
        </ul>
      </div>
    </div>
  );
};

export default LearnScreen;
