import React from 'react';

interface BottomBarProps {
  isPlaying: boolean;
  isEditMode: boolean;
  historyPastLength: number;
  onToggleEdit: () => void;
  onTogglePlay: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  isPlaying, isEditMode, historyPastLength, onToggleEdit, onTogglePlay,
}) => (
  <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6">
    <div className="bg-white/95 backdrop-blur-3xl px-12 py-7 rounded-4xl shadow-2xl border border-zinc-200/50 flex items-center gap-12 ring-1 ring-zinc-900/10">
      <button
        onClick={onToggleEdit}
        className={`flex items-center gap-5 px-10 py-5 rounded-4xl font-black text-sm tracking-[0.2em] transition-all active:scale-95 ${isEditMode ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-200 shadow-xl shadow-amber-100' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
      >
        <span className="material-icons text-[16px]">{isEditMode ? 'check' : 'layers'}</span>
        {isEditMode ? 'FINISH' : 'EDIT'}
      </button>

      <button
        onClick={onTogglePlay}
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

      <div className="hidden xl:block border-l-2 border-zinc-100 pl-12 space-y-2 text-right">
        <div className="flex items-center justify-end gap-3 text-emerald-500">
          <span className="material-icons text-[14px]">check_circle</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Ready to Sync</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">History: {historyPastLength} Steps</p>
      </div>
    </div>
  </div>
);

export default BottomBar;
