import React, { useState } from 'react';
import Converter from './Converter';
import Management from './Management';
import Play from './Play';
import { useTabData } from '../../hooks/useTabData';
import Setup from './Setup';
import Editor from './Editor';
import type { TabData } from '../../types';

type Mode = 'management' | 'editor' | 'converter' | 'play' | 'setup';


const TabScreen: React.FC = () => {
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>();
  const [mode, setMode] = useState<Mode>('management');
  const scriptUrl = localStorage.getItem('my_music_script_url');
  const { isSyncing, tabList, addTabData, updateTabData, removeTabData} = useTabData(scriptUrl);

  if (isSyncing) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <span className="spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
    </div>;
  }

  // Header 標題與描述
  let headerTitle = '樂譜管理';
  let headerDesc = '管理、選擇、刪除已儲存的樂譜';
  if (mode === 'management') {
    headerTitle = '樂譜管理';
    headerDesc = '管理、選擇、刪除已儲存的樂譜';
  } else if (mode === 'editor') {
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
            {mode==='editor' && (
              <button onClick={() => setMode('play')} className={`px-4 py-2 rounded-xl font-bold transition-colors bg-emerald-600 text-white shadow}`}>彈奏模式</button>
            )}
            { mode === 'management' && (
              <button
                className={`px-4 py-2 rounded-xl font-bold transition-colors ${mode==='management' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-50'}`}
                onClick={() => {
                  setSelectedTabIndex(undefined);
                  setMode('editor');
                }}
              >新增</button>
            ) }
            <button
              className={`px-4 py-2 rounded-xl font-bold transition-colors ${mode==='management' ? 'bg-indigo-600 text-white shadow' : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-50'}`}
              onClick={() => {
                setSelectedTabIndex(undefined);
                setMode('management');
              }}
              >管理樂譜</button>
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
            onSelect={data => { setSelectedTabIndex(tabList.findIndex(t => t.id === data.id)); setMode('editor'); }}
            onDelete={(id) => removeTabData(id)}
            // reloadTabList={sync}
          />
        )}
        { mode === 'editor' &&
          <Editor
            tabData={ selectedTabIndex === undefined ? undefined : tabList[selectedTabIndex]}
            updateData={async(data) => {
              await updateTabData(data.id, data);
              setSelectedTabIndex(undefined);
              setMode('management');
            }}
            createData={async(data) => {
              addTabData(data);
              setSelectedTabIndex(undefined);
              setMode('management');
            }}
          />
        }
        { mode === 'converter' &&
          <Converter onChange={(data: TabData) => {
            addTabData(data);
            setSelectedTabIndex(undefined);
            setMode('management');
          }} />
        }
        { selectedTabIndex !== undefined &&
          mode === 'play' && <Play tabData={tabList[selectedTabIndex]} />
        }
        {mode === 'setup' && <Setup onSelect={() => setMode('management')} />}
      </main>
    </div>
  );
};

export default TabScreen;