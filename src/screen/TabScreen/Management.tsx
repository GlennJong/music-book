
import React from 'react';
import type { TabData } from '../../types';

interface ManagementProps {
  tabList: TabData[];
  onSelect: (data: TabData) => void;
  onDelete: (id: string) => void;
  reloadTabList?: () => void;
}

const Management: React.FC<ManagementProps> = ({ tabList, onSelect, onDelete, reloadTabList }) => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-black mb-8">已儲存的樂譜列表</h2>
      {tabList.length === 0 ? (
        <div className="text-zinc-400">尚無資料</div>
      ) : (
        <ul className="space-y-4">
          {tabList.map((tab, idx) => (
            <li key={idx} className="bg-white rounded-2xl shadow p-6 flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">{tab.title}</div>
                <div className="text-zinc-500 text-sm">{tab.artist} | {tab.key} | {tab.bpm} BPM</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                  onClick={() => onSelect(tab)}
                >
                  開啟
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-100 text-red-500 font-bold hover:bg-red-200"
                  onClick={() => {
                    onDelete(tab.id);
                    if (reloadTabList) reloadTabList();
                  }}
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Management;
