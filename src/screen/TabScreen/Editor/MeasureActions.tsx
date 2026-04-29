import React from "react";

interface MeasureActionsProps {
  canMovePrev: boolean;
  canMoveNext: boolean;
  onMovePrev: () => void;
  onMoveNext: () => void;
  onCopyNext: () => void;
  onCopyLast: () => void;
  onDelete: () => void;
  onTextTab: () => void;
  breakAfter: boolean;
  onToggleBreak: () => void;
}

const MeasureActions: React.FC<MeasureActionsProps> = ({
  canMovePrev,
  canMoveNext,
  onMovePrev,
  onMoveNext,
  onCopyNext,
  onCopyLast,
  onDelete,
  onTextTab,
  breakAfter,
  onToggleBreak,
}) => (
  <div className="absolute top-12 right-2 z-20 flex gap-1">
    <button
      onClick={onMovePrev}
      className="p-1 w-[24px] h-[24px] rounded-full bg-zinc-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 shadow transition-all disabled:opacity-30"
      title="前移小節"
      disabled={!canMovePrev}
    >
      <span className="material-icons text-[16px]">arrow_back</span>
    </button>
    <button
      onClick={onMoveNext}
      className="p-1 w-[24px] h-[24px] rounded-full bg-zinc-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 shadow transition-all disabled:opacity-30"
      title="後移小節"
      disabled={!canMoveNext}
    >
      <span className="material-icons text-[16px]">arrow_forward</span>
    </button>
    <button
      onClick={onToggleBreak}
      className={`p-1 w-[24px] h-[24px] rounded-full shadow transition-all ${breakAfter ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-zinc-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700'}`}
      title={breakAfter ? '取消換行' : '在此小節後換行'}
    >
      <span className="material-icons text-[16px]">keyboard_return</span>
    </button>
    <button
      onClick={onTextTab}
      className="p-1 w-[24px] h-[24px] rounded-full bg-emerald-50 hover:bg-emerald-200 text-emerald-500 shadow transition-all"
      title="文字譜"
    >
      <span className="material-icons text-[16px]">edit_note</span>
    </button>
    <button
      onClick={onCopyNext}
      className="p-1 w-[24px] h-[24px] rounded-full bg-blue-50 hover:bg-blue-200 text-blue-500 shadow transition-all"
      title="複製小節"
    >
      <span className="material-icons text-[16px]">content_copy</span>
    </button>
    <button
      onClick={onCopyLast}
      className="p-1 w-[24px] h-[24px] rounded-full bg-blue-200 hover:bg-blue-600 text-blue-900 shadow transition-all"
      title="複製到最後"
    >
      <span className="material-icons text-[16px]">content_copy</span>
    </button>
    <button
      onClick={onDelete}
      className="p-1 w-[24px] h-[24px] rounded-full bg-red-50 hover:bg-red-200 text-red-500 shadow transition-all"
      title="刪除小節"
    >
      <span className="material-icons text-[16px]">delete</span>
    </button>
  </div>
);

export default MeasureActions;
