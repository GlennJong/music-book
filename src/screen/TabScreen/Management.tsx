import React, { useState, useEffect } from 'react';
import type { TabData } from './index';


interface ManagementProps {
  onSelect: (data: TabData) => void;
}

const STORAGE_KEY = 'tabdata_list';

const Management: React.FC<ManagementProps> = ({ onSelect }) => {
  const [tabList, setTabList] = useState<TabData[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let arr: TabData[] = [];
    if (raw) {
      try {
        arr = JSON.parse(raw);
      } catch {
        arr = [];
      }
    }
    // 避免同步 setState，改為 effect 外部計算
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTabList(Array.isArray(arr) ? arr : []);
  }, []);

  const handleDelete = (idx: number) => {
    const newList = tabList.filter((_, i) => i !== idx);
    setTabList(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  };

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
                <div className="font-bold text-lg">{tab.metadata.title}</div>
                <div className="text-zinc-500 text-sm">{tab.metadata.artist} | {tab.metadata.key} | {tab.metadata.bpm} BPM</div>
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
                  onClick={() => handleDelete(idx)}
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
