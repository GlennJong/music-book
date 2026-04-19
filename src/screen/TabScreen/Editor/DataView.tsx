import React from 'react';
import type { TabData } from '../../../types';

interface DataViewProps {
  jsonEditValue: string;
  setJsonEditValue: (value: string) => void;
  currentDataId: string;
  onApply: (data: TabData) => void;
}

const DataView: React.FC<DataViewProps> = ({ jsonEditValue, setJsonEditValue, currentDataId, onApply }) => (
  <div className="bg-zinc-900 p-12 rounded-[3.5rem] shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom-8">
    <textarea
      className="w-full text-indigo-300 font-mono text-[13px] leading-loose overflow-auto max-h-200 bg-transparent border-none outline-none resize-vertical"
      style={{ minHeight: 300 }}
      value={jsonEditValue}
      onChange={e => setJsonEditValue(e.target.value)}
      spellCheck={false}
    />
    <button
      className="p-2.5 rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors flex items-center"
      onClick={() => {
        try {
          const data = JSON.parse(jsonEditValue);
          data.id = currentDataId;
          onApply(data);
        } catch {
          window.alert('Invalid JSON');
        }
      }}
    >
      <span className="material-icons text-[18px]">save</span>
      <span> 覆蓋</span>
    </button>
  </div>
);

export default DataView;
