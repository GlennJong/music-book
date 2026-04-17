import React from "react";

interface MeasureActionsProps {
  canMovePrev: boolean;
  canMoveNext: boolean;
  onMovePrev: () => void;
  onMoveNext: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onTextTab: () => void;
}

const MeasureActions: React.FC<MeasureActionsProps> = ({
  canMovePrev,
  canMoveNext,
  onMovePrev,
  onMoveNext,
  onCopy,
  onDelete,
  onTextTab,
}) => (
  <div className="absolute top-2 right-2 z-20 flex gap-2">
    <button
      onClick={onMovePrev}
      className="p-2 rounded-full bg-zinc-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 shadow transition-all disabled:opacity-30"
      title="前移小節"
      disabled={!canMovePrev}
    >
      <span className="material-icons text-[18px]">arrow_back</span>
    </button>
    <button
      onClick={onMoveNext}
      className="p-2 rounded-full bg-zinc-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 shadow transition-all disabled:opacity-30"
      title="後移小節"
      disabled={!canMoveNext}
    >
      <span className="material-icons text-[18px]">arrow_forward</span>
    </button>
    <button
      onClick={onTextTab}
      className="p-2 rounded-full bg-emerald-50 hover:bg-emerald-200 text-emerald-500 shadow transition-all"
      title="文字譜"
    >
      <span className="material-icons text-[18px]">edit_note</span>
    </button>
    <button
      onClick={onCopy}
      className="p-2 rounded-full bg-blue-50 hover:bg-blue-200 text-blue-500 shadow transition-all"
      title="複製小節"
    >
      <span className="material-icons text-[18px]">content_copy</span>
    </button>
    <button
      onClick={onDelete}
      className="p-2 rounded-full bg-red-50 hover:bg-red-200 text-red-500 shadow transition-all"
      title="刪除小節"
    >
      <span className="material-icons text-[18px]">delete</span>
    </button>
  </div>
);

export default MeasureActions;
