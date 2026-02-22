// src/components/TryScreen.tsx
import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { generateChordQuestion, generateSingleNoteQuestion, type NoteName } from '../../utils/musicTheory';
import GuitarPattern from '../../components/GuitarPattern';
import { PianoPattern } from '../../components/PianoPattern';
import { Selector } from '../../components/Selector';

const TryScreen: React.FC = () => {
  // 狀態管理
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('piano');
  const [showNotes, setShowNotes] = useState<'show' | 'hide'>('show');
  const [currentQuestion, setCurrentQuestion] = useState(generateSingleNoteQuestion());
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'revealed'>('idle');

  const handleDifficultyChange = (newDifficulty: 'easy' | 'hard') => {
    setDifficulty(newDifficulty);
    const newQuestion = newDifficulty === 'easy' ? generateSingleNoteQuestion() : generateChordQuestion();
    setCurrentQuestion(newQuestion);
    setSelectedNotes([]);
    setStatus('idle');
  };

  // 初始化 Audio Context (通常綁定在第一次點擊)
  const handleStart = async () => {
    await soundEngine.initialize();
    playQuestion();
  };

  const playQuestion = () => {
    // 播放題目中的音符
    soundEngine.playNotes(currentQuestion.notes, "2n");
  };

  const handleNoteClick = (note: NoteName) => {
    if (status === 'correct' || status === 'revealed') return; // 防止重複作答
    
    if (difficulty === 'easy') {
      // 簡單模式：單選
      setSelectedNotes([note]);
    } else {
      // 困難模式：複選 (Toggle)
      if (selectedNotes.includes(note)) {
        setSelectedNotes(prev => prev.filter(n => n !== note));
      } else {
        setSelectedNotes(prev => [...prev, note]);
      }
    }
  };

  const checkAnswer = () => {
    if (selectedNotes.length === 0) return;

    // 這裡簡化邏輯：檢查選的音名是否包含在題目中 (不分八度)
    // 題目: ["C4", "E4", "G4"] -> 正確答案: ["C", "E", "G"]
    const answerNotes = currentQuestion.notes.map(n => n.slice(0, -1)); // 去掉八度數字
    
    // 檢查長度是否一致且所有音都對
    const isCorrect = 
      selectedNotes.length === answerNotes.length &&
      selectedNotes.every(note => answerNotes.includes(note));

    setStatus(isCorrect ? 'correct' : 'wrong');
  };

  const nextQuestion = () => {
    const newQuestion = difficulty === 'easy' ? generateSingleNoteQuestion() : generateChordQuestion();
    setCurrentQuestion(newQuestion);
    setSelectedNotes([]);
    setStatus('idle');
    // 稍微延遲後播放
    setTimeout(() => soundEngine.playNotes(newQuestion.notes, "2n"), 500); 
  };

  const playSelectedNotes = () => {
    if (selectedNotes.length === 0) return;
    // 這裡為了讓使用者確認選取的音，我們統一用一個預設八度 (例如 4) 播放
    // 這樣可以聽到和弦的感覺
    const notesToPlay = selectedNotes.map(n => `${n}4`);
    soundEngine.playNotes(notesToPlay, "2n");
  };

  const handleGiveUp = () => {
    setStatus('revealed');
    // 顯示答案時，把正確答案的音名填入 selectedNotes 以便在樂器上顯示（可視化正確答案）
    // 注意：這裡我們只取音名部分 (e.g. "C")
    const correctNoteNames = currentQuestion.notes.map(n => n.slice(0, -1));
    setSelectedNotes(correctNoteNames);
    
    // 播放一次正確答案
    soundEngine.playNotes(currentQuestion.notes, "2n");
  };


  return (
    <div className="space-y-6 mx-auto p-4 sm:p-6 text-foreground">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold">
            音感訓練
          </h2>
          <p className="opacity-60 mt-1">聽辨音程與和弦練習</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Selector
            value={difficulty}
            onChange={handleDifficultyChange}
            options={[
              { value: 'easy', label: '單音' },
              { value: 'hard', label: '和弦' }
            ]}
            size="sm"
          />
          <Selector
            value={instrument}
            onChange={setInstrument}
            options={[
                { value: 'guitar', label: '吉他', icon: <span className="material-icons" style={{ fontSize: '16px' }}>music_note</span> },
                { value: 'piano', label: '鋼琴', icon: <span className="material-icons" style={{ fontSize: '16px' }}>grid_view</span> }
            ]}
            size="sm"
          />
          <Selector
            value={showNotes}
            onChange={setShowNotes}
            options={[
                { value: 'show', label: '顯示', icon: <span className="material-icons" style={{ fontSize: '16px' }}>visibility</span> },
                { value: 'hide', label: '隱藏', icon: <span className="material-icons" style={{ fontSize: '16px' }}>visibility_off</span> }
            ]}
            size="sm"
          />
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex flex-col items-center justify-center py-4">
        <button 
          onClick={handleStart} 
          title="播放題目"
          className="w-20 h-20 md:w-24 md:h-24 bg-foreground text-background rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <span className="material-icons" style={{ fontSize: '32px' }}>volume_up</span>
        </button>
        <div className="mt-4 opacity-50 text-sm font-medium">
            點擊播放
        </div>

        {/* Status / Instruction */}
        <div className="mt-6 w-full max-w-lg px-2">
          <div className={`
            text-center p-4 rounded-lg border transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-3
            ${status === 'correct' 
              ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
              : status === 'wrong'
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                : status === 'revealed'
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                  : 'border-border opacity-60'
            }
          `}>
            {status === 'correct' ? (
              <>
                <span className="material-icons hidden sm:block" style={{ fontSize: '20px' }}>check_circle</span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm sm:text-base">
                    正確！答案是 {currentQuestion.root} {currentQuestion.type !== '單音' ? currentQuestion.type : ''}
                  </span>
                  {currentQuestion.type !== '單音' && (
                    <span className="text-xs opacity-80 mt-1">
                      組成音: {currentQuestion.notes.map(n => n.slice(0, -1)).join(', ')}
                    </span>
                  )}
                </div>
              </>
            ) : status === 'wrong' ? (
              <>
                <span className="material-icons hidden sm:block" style={{ fontSize: '20px' }}>cancel</span>
                <span className="font-medium text-sm sm:text-base">答案不對，再試試看</span>
              </>
            ) : status === 'revealed' ? (
              <>
                <span className="material-icons hidden sm:block" style={{ fontSize: '20px' }}>help</span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm sm:text-base">
                    正確答案是 {currentQuestion.root} {currentQuestion.type !== '單音' ? currentQuestion.type : ''}
                  </span>
                  {currentQuestion.type !== '單音' && (
                    <span className="text-xs opacity-80 mt-1">
                      組成音: {currentQuestion.notes.map(n => n.slice(0, -1)).join(', ')}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="material-icons hidden sm:block" style={{ fontSize: '20px' }}>music_note</span>
                <span className="text-sm sm:text-base">請聽題目並在下方選出答案</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Instrument Display */}
      <div className="border border-border rounded-xl overflow-hidden w-full">
        <div className="bg-secondary/20 px-3 py-2 border-b border-border text-xs font-medium opacity-60 uppercase tracking-wider flex justify-between items-center">
          <span>{instrument === 'guitar' ? 'Guitar' : 'Piano'}</span>
          <span className="truncate max-w-[150px] text-right">sel: {selectedNotes.join(', ') || '-'}</span>
        </div>
        
        {/* Scrollable Container with better mobile handling */}
        <div className="p-2 sm:p-4 md:p-8 overflow-x-auto w-full scrollbar-hide">
             <div className="min-w-max mx-auto px-4">
                {instrument === 'guitar' ? (
                    <GuitarPattern
                    onNoteClick={({ note }) => handleNoteClick(note as NoteName)}
                    isHideNoteName={showNotes === 'hide'}
                    />
                ) : (
                    <PianoPattern
                    onNoteClick={({ name }) => handleNoteClick(name as NoteName)}
                    isHideNoteName={showNotes === 'hide'}
                    />
                )}
             </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap justify-center pt-2 pb-8 gap-3 px-2">
        {status === 'correct' || status === 'revealed' ? (
          <button 
            onClick={nextQuestion} 
            className="flex items-center gap-2 px-8 py-4 bg-foreground text-background hover:opacity-90 rounded-xl font-bold transition-all w-full sm:w-auto justify-center shadow-lg"
          >
            <span>下一題</span>
            <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
          </button>
        ) : (
          <>
            <button 
              onClick={handleGiveUp}
              className="px-4 py-3 rounded-lg font-medium transition-all text-sm bg-secondary/20 text-secondary-foreground hover:bg-secondary/40 flex-1 sm:flex-none"
            >
              放棄
            </button>
            {difficulty === 'hard' && (
              <button 
                onClick={playSelectedNotes}
                disabled={selectedNotes.length === 0}
                className={`
                  px-5 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none
                  ${selectedNotes.length === 0 
                    ? 'bg-secondary/30 text-secondary-foreground/50 cursor-not-allowed' 
                    : 'bg-secondary text-secondary-foreground hover:opacity-80'
                  }
                `}
                title="播放選取的音符"
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>play_arrow</span>
                <span className="sm:inline">試聽</span>
              </button>
            )}
            <button 
              onClick={checkAnswer} 
              disabled={selectedNotes.length === 0}
              className={`
                px-8 py-3 rounded-lg font-medium transition-all flex-1 sm:flex-none
                ${selectedNotes.length === 0 
                  ? 'bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed' 
                  : 'bg-foreground text-background hover:opacity-90 font-bold shadow-md'
                }
              `}
            >
              送出
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TryScreen;