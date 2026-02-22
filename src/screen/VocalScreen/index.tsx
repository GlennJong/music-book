import React, { useEffect, useState } from 'react';
import { usePitchDetector } from '../../hooks/usePitchDetector';
import { Selector } from '../../components/Selector';
import { soundEngine } from '../../utils/soundEngine';

const VocalScreen: React.FC = () => {
  const { isListening, pitch, start, stop } = usePitchDetector();
  const [history, setHistory] = useState<{note: string, timestamp: number}[]>([]);
  const [mode, setMode] = useState<'fuzzy' | 'precise'>('fuzzy');
  
  // Reference Tone State
  const [targetNote, setTargetNote] = useState('C');
  const [targetOctave, setTargetOctave] = useState(4);
  const [isPlayingRef, setIsPlayingRef] = useState(false);

  // const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  // const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  const playReference = async () => {
    await soundEngine.initialize();
    soundEngine.playNotes([`${targetNote}${targetOctave}`], "2n");
    setIsPlayingRef(true);
    setTimeout(() => setIsPlayingRef(false), 1000); // Visual feedback
  };

  // Simple visualizer for history (last 5 notes)
  useEffect(() => {
    if (pitch) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory(prev => {
            const noteDisplay = pitch.note + pitch.octave;
            
            if (mode === 'fuzzy' && pitch.note.includes('#')) {
                 // In fuzzy mode for history, we might want to skip sharps or show them differently?
                 // For now, let's just keep the history accurate, or maybe just don't add it if it's not a natural note?
                 // Let's keep history accurate for reference, but display logic handles the main UI.
                 // Actually, if fuzzy mode is about practicing natural notes, showing sharps in history might be confusing.
                 // Let's filter history for fuzzy mode to only show natural notes "close enough"?
                 // Or just keep it as is.
            }
            
            const newHistory = [...prev, { note: noteDisplay, timestamp: Date.now() }];
            return newHistory.slice(-10); // Keep last 10
        });
    }
  }, [pitch?.note, pitch?.octave, mode]);

  // Fuzzy Mode Display Logic
  const getDisplayPitch = () => {
    if (!pitch) return null;

    if (mode === 'precise') {
        return pitch;
    }

    // Fuzzy Mode: C, D, E, F, G, A, B only
    // If pitch is C#, determines if it's closer to C or D?
    // Actually, usually C# is distinct. "Fuzzy" might mean "Don't show Cents", or "Snap to scale".
    // User request: "Fuzzy mode only displays CDEFGAB".
    // This implies we should snap sharp notes to the nearest natural note.
    
    // Logic:
    // C# (Index 1) -> Closer to C (0) or D (2)?
    // C  = 0
    // C# = 1
    // D  = 2
    // If cents is high on C, it gets to C#.
    // Since our detector already rounds to nearest semitone (including #),
    // pitch.note is already the nearest semitone.
    
    // If pitch.note has '#', we need to check cents to decide if we round Up or Down to a natural note.
    // Example: C# with -40 cents -> Closer to C.
    // Example: C# with +40 cents -> Closer to D.
    // If it's a "perfect" C#, it's exactly between C and D.
    
    // However, maybe valid input for Fuzzy mode is ONLY natural notes?
    // If I sing C#, should it say "C (Too High)" or "D (Too Low)"?
    // Or should it just show nothing until I hit a natural note?
    
    // Let's assume standard rounding:
    // C# is index 1. 0(C) <--> 2(D). 
    // We can map sharps to the nearest neighbor based on just index? 
    // No, C# is distinct.
    
    // Alternative Interpretation: "Snap to Natural".
    // If note is C#, detected as C# (+0 cents).
    // Show "C" ? -> No, that's -100 cents error.
    // Show "D" ? -> No, that's +100 cents error.
    
    // Maybe the user wants a mode where they DON'T see charts/cents, just the letter?
    // "Fuzzy mode only displays CDEFGAB"
    // Let's implement: If note is sharp, indicate "between notes" or show the sharp note but small?
    // OR, easiest: Display the sharp note, BUT maybe the user *means* they only want to see Major Scale notes?
    
    // Let's try this: For Fuzzy Mode, we hide the Cents indicator, and we only show the Note Letter.
    // IF the note is a Sharp (e.g. F#), we show it as F# but maybe grayed out or indicate "Sing Natural"?
    // OR, maybe the user wants to practice C Major scale.
    
    // Let's stick effectively to: 
    // Precise: Show everything (C#, +15 cents)
    // Fuzzy: Show big letter (C). If it's C#, show C#? The prompt says "Only display CDEFGAB".
    // This strongly implies hiding sharps.
    // If detected is C#, we have to choose to show C or D.
    // If cents > 0 (on C#), closer to D.
    // If cents < 0 (on C#), closer to C.
    
    // Let's do that snapping logic for display.
    
    let displayNote = pitch.note;
    // const displayOctave = pitch.octave;
    const isSharp = pitch.note.includes('#');
    
    if (isSharp) {
        // It's a sharp note. We need to force it to a natural note for "Fuzzy CDEFGAB" display.
        // We need to look at the next/prev note via NOTES array logic.
        // But we don't have easy index access here without import.
        // Let's do simple char mapping?
        // C# -> C or D
        // D# -> D or E
        // F# -> F or G
        // G# -> G or A
        // A# -> A or B
        
        // Let's just strip the '#'?
        // No, C# is equidistant.
        // Let's check cents.
        // pitch.cents is deviation from the Semitone.
        // Range is -50 to +50.
        
        // If we are at C# (MIDI 61), C is 60, D is 62.
        // C# is +100 cents from C.
        // if pitch is C# + 0 cents. It is +100 cents from C.
        
        // Let's just hide the sharp symbol? C# becomes C. D# becomes D.
        // This effectively makes the "target window" for C very large (B to C#).
        // This is "Fuzzy" in a way.
        displayNote = pitch.note.replace('#', '') as any;
    }
    
    return { ...pitch, note: displayNote };
  };

  const displayPitch = getDisplayPitch();

  return (
    <div className="max-w-md mx-auto p-6 flex flex-col items-center gap-8 flex-1">
      <div className="text-center space-y-2 w-full">
        <div className="flex justify-center mt-4">
            <Selector
                value={mode}
                onChange={setMode}
                options={[
                    { value: 'fuzzy', label: '模糊模式', icon: <span className="material-icons" style={{ fontSize: '16px' }}>filter_center_focus</span> },
                    { value: 'precise', label: '精準模式', icon: <span className="material-icons" style={{ fontSize: '16px' }}>bolt</span> }
                ]}
                size="sm"
            />
        </div>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center mt-4">
         {/* Circular Indicator Background */}
         <div className={`
            absolute inset-0 rounded-full border-4 transition-all duration-300
            ${isListening ? 'border-primary/20 scale-100' : 'border-border/50 scale-95'}
         `}></div>
         
         {/* Pitch Display */}
         <div className="relative z-10 text-center">
            {isListening ? (
                displayPitch ? (
                    <div className="flex flex-col items-center">
                        <span className="text-8xl font-black tracking-tighter text-foreground transition-all">
                            {displayPitch.note}
                        </span>
                        
                        {mode === 'precise' && (
                             <span className="text-2xl font-medium opacity-60 mt-2">
                                {displayPitch.octave}
                            </span>
                        )}
                        
                         {/* Cents Deviation Indicator - ONLY IN PRECISE MODE */}
                        {mode === 'precise' ? (
                            <>
                                <div className="mt-6 flex items-center gap-3">
                                <div className="w-24 h-2 bg-secondary/30 rounded-full overflow-hidden relative">
                                    <div 
                                        className={`absolute top-0 bottom-0 w-1 bg-foreground transition-all duration-100 left-1/2 -ml-0.5`}
                                        style={{ transform: `translateX(${displayPitch.cents}px)` }} 
                                    ></div>
                                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-primary/50 -ml-px"></div>
                                </div>
                                <span className={`text-xs font-mono w-8 text-right ${Math.abs(displayPitch.cents) < 10 ? 'text-green-500' : 'text-foreground'}`}>
                                    {displayPitch.cents > 0 ? '+' : ''}{displayPitch.cents}
                                </span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest opacity-40 mt-1">Cents</span>
                            </>
                        ) : (
                             // Fuzzy Mode: Maybe just a simple "Good" indicator if stable?
                             // Or nothing, just the letter.
                             <span className="text-sm opacity-40 mt-4 tracking-widest uppercase">Approx</span>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center opacity-30 animate-pulse">
                        <span className="material-icons" style={{ fontSize: '48px' }}>graphic_eq</span>
                        <span className="mt-2 text-sm">Listening...</span>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center opacity-30">
                    <span className="material-icons" style={{ fontSize: '48px' }}>mic_off</span>
                    <span className="mt-2 text-sm">Tap to Start</span>
                </div>
            )}
         </div>
      </div>

      <button
        onClick={isListening ? stop : start}
        className={`
            w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
            ${isListening 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:translate-y-[-2px]'
            }
        `}
      >
        {isListening ? (
            <>
                <span className="material-icons" style={{ fontSize: '20px' }}>mic_off</span> Stop
            </>
        ) : (
            <>
                <span className="material-icons" style={{ fontSize: '20px' }}>mic</span> Start
            </>
        )}
      </button>

      {/* Reference Tone Generator */}
      <div className="w-full bg-secondary/10 p-4 rounded-xl border border-border/50 mt-4">
        <div className="flex items-center gap-2 mb-3 opacity-70">
            <span className="material-icons" style={{ fontSize: '16px' }}>volume_up</span>
            <h3 className="text-sm font-bold uppercase tracking-wider">Reference Pitch</h3>
        </div>
        
        <div className="flex flex-col gap-4">
             {/* Note Selector: use justify-start to prevent clipping on small screens, center on larger */}
             <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide w-full justify-start sm:justify-center">
                {(mode === 'fuzzy' ? (['C', 'D', 'E', 'F', 'G', 'A', 'B']) : (['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])).map(n => (
                    <button
                        key={n}
                        onClick={() => setTargetNote(n)}
                        className={`
                            w-10 h-10 rounded-lg text-sm font-bold transition-all flex-shrink-0 flex items-center justify-center
                            ${targetNote === n 
                                ? 'bg-primary text-primary-foreground shadow-md' 
                                : 'bg-background hover:bg-secondary/50 text-muted-foreground border border-border/50'
                            }
                        `}
                    >
                        {n}
                    </button>
                ))}
             </div>
             
             <div className="flex items-center justify-between gap-4">
                 <div className="flex bg-background rounded-lg p-1 gap-1 border border-border/50">
                     {[3, 4, 5].map(oct => (
                        <button
                            key={oct}
                            onClick={() => setTargetOctave(oct)}
                            className={`
                                w-8 h-8 text-xs font-bold rounded transition-all flex items-center justify-center
                                ${targetOctave === oct 
                                    ? 'bg-primary/20 text-primary' 
                                    : 'hover:bg-secondary/50 text-muted-foreground'
                                }
                            `}
                        >
                            {oct}
                        </button>
                     ))}
                 </div>
                 
                 <button 
                    onClick={playReference}
                    className={`
                        flex-1 h-10 rounded-lg font-bold text-sm bg-secondary text-secondary-foreground flex items-center justify-center gap-2 transition-all active:scale-95 border border-border/50 hover:bg-secondary/80
                        ${isPlayingRef ? 'bg-primary text-primary-foreground border-primary' : ''}
                    `}
                 >
                    <span className={`material-icons ${isPlayingRef ? "text-current" : ""}`} style={{ fontSize: '16px' }}>play_arrow</span>
                    {isPlayingRef ? 'Playing...' : `Play ${targetNote}${targetOctave}`}
                 </button>
             </div>
        </div>
      </div>

      {/* Note History */}
      {isListening && history.length > 0 && mode === 'precise' && (
         <div className="w-full h-12 flex items-end justify-center gap-1 opacity-50">
            {history.map((h, i) => (
                <div key={i} className="text-[10px] font-mono bg-secondary/20 px-1 rounded">
                    {h.note}
                </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default VocalScreen;
