import React from 'react';
import type { TabData, SyncStatus } from '../../types';

interface ManagementProps {
  tabList: TabData[];
  onSelect: (data: TabData) => void;
  onPlay: (data: TabData) => void;
  onDelete: (id: string) => void;
  onSync?: () => void;
  isLoading?: boolean;
  isSyncingCloud?: boolean;
  pendingTaskCount?: number;
}

const SyncBadge: React.FC<{ status?: SyncStatus }> = ({ status }) => {
  if (!status || status === 'synced') return null;
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${status === 'pending' ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'}`}>
      {status === 'pending' ? '待同步' : '同步失敗'}
    </span>
  );
};

const Management: React.FC<ManagementProps> = ({ tabList, onSelect, onPlay, onDelete, onSync, isLoading, isSyncingCloud, pendingTaskCount }) => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-foreground">已儲存的樂譜列表</h2>
        <div className="flex items-center gap-3">
          {isSyncingCloud && (
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              雲端同步中…
            </div>
          )}
          {!isSyncingCloud && pendingTaskCount != null && pendingTaskCount > 0 && (
            <span className="text-xs font-bold text-amber-500">{pendingTaskCount} 項待上傳</span>
          )}
          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-text-secondary hover:bg-hover font-bold text-xs transition-all disabled:opacity-40"
            >
              <span className="material-icons text-[14px]">sync</span>
              立即同步
            </button>
          )}
        </div>
      </div>

      {tabList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          {(isLoading || isSyncingCloud) ? (
            <>
              <span className="w-8 h-8 rounded-full border-4 border-border border-t-primary animate-spin" />
              <span className="font-bold text-sm">{isLoading ? '載入資料中…' : '載入雲端資料中…'}</span>
            </>
          ) : (
            <>
              <span className="material-icons text-4xl">library_music</span>
              <span className="font-bold text-sm">尚無樂譜</span>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {tabList.map((tab) => (
            <li key={tab.id} className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg truncate text-foreground">{tab.title || '未命名'}</span>
                  <SyncBadge status={tab.syncStatus} />
                </div>
                <div className="text-muted-foreground text-sm mt-0.5">
                  {[tab.artist, tab.key && `${tab.key} 調`, tab.bpm && `${tab.bpm} BPM`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 text-sm"
                  onClick={() => onSelect(tab)}
                >開啟</button>
                <button
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 text-sm"
                  onClick={() => onPlay(tab)}
                >彈奏</button>
                <button
                  className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 text-sm"
                  onClick={() => onDelete(tab.id)}
                >刪除</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Management;
