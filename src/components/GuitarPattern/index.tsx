import React from 'react';
import { NOTES, type NoteName } from '../../utils/musicTheory';
import { soundEngine } from '../../utils/soundEngine';
import './style.css';

// Standard Tuning: High E to Low E (Strings 1 to 6)
// String 1: E
// String 2: B
// String 3: G
// String 4: D
// String 5: A
// String 6: E
const TUNING: NoteName[] = ['E', 'B', 'G', 'D', 'A', 'E'];
const STRING_OCTAVES = [4, 3, 3, 3, 2, 2];

interface GuitarPatternProps {
  onNoteClick?: (data: {name: string, note: string}) => void;
  isHideNoteName?: boolean;
  fretRange?: number;
}

export const GuitarPattern: React.FC<GuitarPatternProps> = ({ onNoteClick, isHideNoteName = false, fretRange = 5 }) => {
  // We want columns 0 to fretRange
  const frets = Array.from({ length: fretRange + 1 }, (_, i) => i);

  const getNoteData = (openStringNote: NoteName, baseOctave: number, fretNumber: number) => {
    const startIndex = NOTES.indexOf(openStringNote);
    const totalSemitones = startIndex + fretNumber;
    const noteIndex = totalSemitones % 12;
    const octaveShift = Math.floor(totalSemitones / 12);
    
    const noteName = NOTES[noteIndex];
    const fullNote = `${noteName}${baseOctave + octaveShift}`;
    
    return { noteName, fullNote };
  };

  const handlePlayNote = async (fullNote: string, noteName: string) => {
    await soundEngine.initialize();
    soundEngine.playNotes([fullNote], '8n');
    onNoteClick?.({name: fullNote, note: noteName});
  };

  return (
    <div className="guitar-pattern-container">
       <div className="guitar-pattern">
        {TUNING.map((stringBase,  stringIndex) => {
            const baseOctave = STRING_OCTAVES[stringIndex];
            
            return (
            <div key={`string-${stringIndex}`} className="guitar-string">
            {frets.map((fret) => {
                const { noteName, fullNote } = getNoteData(stringBase, baseOctave, fret);
                const isRoot = fret === 0; // Interpreting "First column is root" as visual indication or just class

                return (
                  <div className={`fret ${isRoot ? 'is-root' : ''}`} key={`s${stringIndex}-f${fret}`} >
                    <button 
                        className="fret-button"
                        title={`String ${stringIndex + 1}, Fret ${fret} (${fullNote})`}
                        onClick={() => handlePlayNote(fullNote, noteName)}
                    >
                        {!isHideNoteName && noteName}
                    </button>
                  </div>
                );
            })}
            </div>
        )})}
      </div>
    </div>
  );
};

export default GuitarPattern;
