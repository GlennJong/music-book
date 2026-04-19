import React, { useState } from 'react';

interface TextTabModalProps {
  initialText: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

const PLACEHOLDER = `E |  |  |  |  |
B |  |  |  |  |
G |  |  |  |  |
D |  |  |  |  |
A |  |  |  |  |
E |  |  |  |  |`;

const TextTabModal: React.FC<TextTabModalProps> = ({ initialText, onClose, onSave }) => {
  const [text, setText] = useState(initialText);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 z-60 bg-white/95 backdrop-blur-md rounded-3xl p-8 border-2 border-emerald-500 shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg text-emerald-700">編輯文字譜</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 flex items-center">
            <span className="material-icons text-[24px]">close</span>
          </button>
        </div>
        <textarea
          className="w-full rounded-xl border border-emerald-200 p-4 font-mono text-sm min-h-40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={PLACEHOLDER}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-5 py-2 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 font-bold"
            onClick={onClose}
          >取消</button>
          <button
            className="px-5 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold"
            onClick={() => { onSave(text); onClose(); }}
          >儲存</button>
        </div>
      </div>
    </>
  );
};

export default TextTabModal;
