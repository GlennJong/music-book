import React, { useState } from 'react';
import Tab from './Tab';
import Converter from './Converter';
import Management, { INITIAL_TAB_DATA } from './Management';

// --- 型別定義（僅保留必要） ---
interface Metadata {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  subdivisions: number;
  capo: number;
  tuning: string[];
}
interface Note {
  string: number;
  fret: number;
  beat: number;
}
interface Measure {
  id: number;
  chord: string;
  lyrics: string;
  notes: Note[];
}
interface ChordInfo {
  frets: (number | null)[];
  theory: string;
}
export interface TabData {
  metadata: Metadata;
  chordLib: Record<string, ChordInfo>;
  measures: Measure[];
}







type Mode = 'management' | 'tab' | 'converter';

const STORAGE_KEY = 'tabdata_list';

const TabScreen: React.FC = () => {
  const [tabData, setTabData] = useState<TabData>(INITIAL_TAB_DATA);
  const [mode, setMode] = useState<Mode>('management');

  // 將目前 tabData 儲存到 localStorage
  const saveCurrentTab = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: TabData[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch { list = []; }
    }
    list.push(tabData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    alert('已儲存到本地');
  };

  // Header 標題與描述
  let headerTitle = '';
  let headerDesc = '';
  if (mode === 'management') {
    headerTitle = '樂譜管理';
    headerDesc = '管理、選擇、刪除已儲存的樂譜';
  } else if (mode === 'tab') {
    headerTitle = tabData.metadata.title || '樂譜編輯';
    headerDesc = tabData.metadata.artist ? `by ${tabData.metadata.artist}` : '編輯樂譜內容';
  } else if (mode === 'converter') {
    headerTitle = '圖片辨識轉譜';
    headerDesc = '將六線譜圖片轉為可編輯樂譜';
  }

  return (
    <div>
      {/* Header 區塊 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4 mb-8 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">{headerTitle}</h1>
            <div className="text-zinc-400 text-xs md:text-sm font-bold tracking-widest">{headerDesc}</div>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            {mode==='tab' && (
              <button onClick={saveCurrentTab} className="ml-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 font-bold">儲存目前樂譜</button>
            )}
            <button onClick={() => setMode('management')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${mode==='management' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-50'}`}>管理</button>
            <button onClick={() => setMode('tab')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${mode==='tab' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-50'}`}>Tab</button>
            <button onClick={() => setMode('converter')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${mode==='converter' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-50'}`}>Converter</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {mode === 'management' && (
          <Management onSelect={data => { setTabData(data); setMode('tab'); }} />
        )}
        {mode === 'tab' && <Tab tabData={tabData} setTabData={setTabData} />}
        {mode === 'converter' && <Converter onChange={(data: TabData) => { setTabData(data); setMode('tab'); }} />}
      </main>
    </div>
  );
};

export default TabScreen;