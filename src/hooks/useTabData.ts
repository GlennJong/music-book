import { useState } from 'react';
import { loadTabDataList, saveTabDataList, addTabData, deleteTabDataByIndex, serializeTabData } from '../utils/tabdataStorage';
import type { TabData } from '../screen/TabScreen/index';

export function useTabData() {
  const [tabList, setTabList] = useState<TabData[]>(() => loadTabDataList());


  // 新增一筆
  const add = (tab: TabData) => {
    addTabData(tab);
    setTabList(loadTabDataList());
  };

  // 刪除一筆
  const remove = (idx: number) => {
    deleteTabDataByIndex(idx);
    setTabList(loadTabDataList());
  };

  // 覆蓋全部
  const saveAll = (list: TabData[]) => {
    saveTabDataList(list);
    setTabList(loadTabDataList());
  };

  // 取得全部
  const reload = () => setTabList(loadTabDataList());

  return {
    tabList,
    add,
    remove,
    saveAll,
    reload,
  };
}

// Google Sheets 溝通
export async function updateSheetWithTabData(tabData: TabData) {
  const endpoint = localStorage.getItem('my_music_script_url');
  if (!endpoint) throw new Error('my_music_script_url not set');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update',
      data: serializeTabData(tabData)
    })
  });
  if (!res.ok) throw new Error('Failed to update Google Sheet');
  return await res.json();
}
