import React from 'react';
import { NOTES, type NoteName } from '../../utils/musicTheory';
import { soundEngine } from '../../utils/soundEngine';
import './style.css';

interface PianoPatternProps {
  onNoteClick?: (data: {note: string, name: string}) => void;
  isHideNoteName?: boolean;
  startKey?: string;
  endKey?: string;
}

interface KeyData {
  noteName: string; // e.g., "C"
  octave: number;   // e.g., 2
  fullNote: string; // e.g., "C2"
  isBlack: boolean;
  hasSharp: boolean; // 是否有對應的黑鍵 (右側)
}

const parseKey = (key: string): { note: NoteName; octave: number } | null => {
  const match = key.match(/^([A-G]#?)(\d+)$/);
  if (!match) return null;
  // Initialize with a check or cast if we are sure regex matches NoteName format
  // For safety, we can check if it exists in NOTES
  const note = match[1] as NoteName;
  if (!NOTES.includes(note)) return null;
  
  return { note, octave: parseInt(match[2], 10) };
};

export const PianoPattern: React.FC<PianoPatternProps> = ({ 
  onNoteClick, 
  isHideNoteName = false,
  startKey = "E2",
  endKey = "G5"
}) => {

  const generateKeys = (): KeyData[] => {
    const keys: KeyData[] = [];
    
    const start = parseKey(startKey);
    const end = parseKey(endKey);

    if (!start || !end) return [];

    const startOctave = start.octave;
    const endOctave = end.octave;
    const startNote = start.note;
    const endNote = end.note;

    // 我們需要生成 White Keys 的列表，並標記每個白鍵是否有附屬的黑鍵
    // 遍歷所有八度
    for (let oct = startOctave; oct <= endOctave; oct++) {
      // 遍歷所有音名
      for (const noteName of NOTES) {
        // 略過帶有 # 的音名，我們會在處理白鍵時檢查
        if (noteName.includes('#')) continue;

        // 檢查是否在範圍內
        // 開始檢查: 當 oct === startOctave 時，noteName 必須 >= startNote (在 NOTES 中的順序)
        if (oct === startOctave) {
            if (NOTES.indexOf(noteName) < NOTES.indexOf(startNote)) continue;
        }
        // 結束檢查: 當 oct === endOctave 時，noteName 必須 <= endNote
        if (oct === endOctave) {
             if (NOTES.indexOf(noteName) > NOTES.indexOf(endNote)) continue;
        }

        // 判斷此白鍵是否有黑鍵 (sharp)
        // 規則：如果下一個半音是黑鍵，且該黑鍵也在範圍內，則 hasSharp = true
        // 取得這個白鍵的 index
        const whiteIndex = NOTES.indexOf(noteName);
        // 取得下一個音 (可能是黑鍵)
        const nextIndex = (whiteIndex + 1) % 12;
        const nextNoteName = NOTES[nextIndex];
        
        let hasSharp = false;

        // 只有當下一個音是 sharp (例如 C -> C#)，才考慮加黑鍵
        // E -> F (F不是sharp, E沒有黑鍵)
        // B -> C (C不是sharp, B沒有黑鍵)
        if (nextNoteName.includes('#')) {
            // 還要檢查這個黑鍵是否超出範圍 (例如只到 endKey，那 endKey 旁邊的 # 就不該顯示)
            // 如果當前是 endOctave 且 當前 noteName 是 endNote，
            // 則這顆白鍵是最後一顆。
            // 例如範圍到 A4。理論上 A4 是最後一個音。
            // A4 下一個是 A#4 (Black). 如果範圍嚴格是到 A4，那就不顯示 A#4。
            if (!(oct === endOctave && noteName === endNote)) {
                hasSharp = true;
            }
        }
        
        keys.push({
            noteName,
            octave: oct,
            fullNote: `${noteName}${oct}`,
            isBlack: false,
            hasSharp
        });
      }
    }
    return keys;
  };

  const keys = generateKeys();

  const handlePlayNote = async (fullNote: string, noteName: string) => {
    await soundEngine.initialize();
    soundEngine.playNotes([fullNote], '8n');
    onNoteClick?.({note: fullNote, name: noteName});
  };

  return (
    <div className="piano-container">
      <div className="piano">
        {keys.map((key) => {
            // 如果這個白鍵有黑鍵，我們要算出黑鍵的資料
            // 黑鍵的音名通常是 白鍵音名 + "#"
            const blackNoteName = `${key.noteName}#`;
            const blackFullNote = `${blackNoteName}${key.octave}`;

            return (
                <div key={key.fullNote} className="key-group">
                    <div 
                        className="white-key"
                        onClick={() => handlePlayNote(key.fullNote, key.noteName)}
                    >
                        <span className="key-label">{!isHideNoteName && key.fullNote}</span>
                    </div>
                    {key.hasSharp && (
                        <div 
                            className="black-key"
                            onClick={() => handlePlayNote(blackFullNote, blackNoteName)}
                        >
                           {/* <span className="key-label">{blackNoteName}</span> */}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default PianoPattern;
