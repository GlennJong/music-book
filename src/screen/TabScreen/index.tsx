import React, { useState } from 'react';
import Tab from './Tab';
import Converter from './Converter';
import Management from './Management';
import Play from './Play';
import { INITIAL_TAB_DATA } from './initialTabData';
import { useTabData } from '../../hooks/useTabData';
import Setup from './Setup';

// --- 型別定義（僅保留必要） ---
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
// 扁平化 TabData
export interface TabData {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  subdivisions: number;
  capo: number;
  tuningName: string;
  measures: Measure[];
}

type Mode = 'management' | 'tab' | 'converter' | 'play' | 'setup';




const TabScreen: React.FC = () => {
  const [tabData, setTabData] = useState<TabData>(INITIAL_TAB_DATA);
  const [mode, setMode] = useState<Mode>('management');
  const { tabList, add, remove, reload } = useTabData();

  // 儲存目前 tabData 到 useTabData
  const saveCurrentTab = () => {
    add(tabData);
    alert('已儲存到本地');
  };

  // Header 標題與描述
  let headerTitle = '樂譜管理';
  let headerDesc = '管理、選擇、刪除已儲存的樂譜';
  if (mode === 'management') {
    headerTitle = '樂譜管理';
    headerDesc = '管理、選擇、刪除已儲存的樂譜';
  } else if (mode === 'tab') {
    headerTitle = '吉他譜';
    headerDesc = '編輯樂譜內容';
  } else if (mode === 'converter') {
    headerTitle = '圖片辨識轉譜';
    headerDesc = '將六線譜圖片轉為可編輯樂譜';
  } else if (mode === 'play') {
    headerTitle = '簡化譜面';
    headerDesc = '以簡化方式瀏覽樂譜';
  }

  return (
    <div>
      {/* Header 區塊 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4 mb-8 sticky top-0 z-40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">{headerTitle}</h1>
            <div className="text-zinc-400 text-xs md:text-sm font-bold tracking-widest">{headerDesc}</div>
            
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <button
              onClick={() => {
                setTabData({
                  title: '',
                  artist: '',
                  key: 'C',
                  bpm: 80,
                  subdivisions: 4,
                  capo: 0,
                  tuningName: 'standard',
                  measures: []
                });
                setMode('tab');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold"
            >
              新增空白樂譜
            </button>
            {mode==='tab' && (
              <>
                <button onClick={saveCurrentTab} className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 font-bold">儲存目前樂譜</button>
                <button onClick={() => setMode('play')} className={`px-4 py-2 rounded-xl font-bold transition-colors bg-emerald-600 text-white shadow}`}>Play</button>
              </>
            )}
            <button onClick={() => setMode('management')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${mode==='management' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-50'}`}>管理樂譜</button>
            <button onClick={() => setMode('converter')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${mode==='converter' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-50'}`}>轉換器</button>
            <button
              onClick={() => setMode('setup')}
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${mode==='setup' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-50'}`}
            >
              設定
            </button>
          </div>
        </div>
      </header>

      <main className="pl-8 pr-8">
        {mode === 'management' && (
          <Management 
            tabList={tabList}
            onSelect={data => { setTabData(data); setMode('tab'); }}
            onDelete={remove}
            reloadTabList={reload}
          />
        )}
        {mode === 'tab' && <Tab tabData={tabData} setTabData={setTabData} />}
        {mode === 'converter' && <Converter onChange={(data: TabData) => { setTabData(data); setMode('tab'); }} />}
        {mode === 'play' && <Play tabData={tabData} />}
        {mode === 'setup' && <Setup />}
      </main>
    </div>
  );
};

export default TabScreen;