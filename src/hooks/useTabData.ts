import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchScript } from './fetch';
import type { TabData, RawData } from '../types';

type SyncAction = 'add' | 'edit' | 'delete';

type SyncTask = {
  id: string; // Task ID (random)
  action: SyncAction;
  targetId: string; // The transaction ID
  data?: RawData;
  timestamp: number;
};

export const useTabData = (scriptUrl: string | null) => {
  const [tabList, setTabList] = useState<TabData[]>(() => {
    return [];
  });

  // Fetch cloud & local data, merge, and set tabList
  useEffect(() => {
    const fetchAndCompare = async () => {
      if (!scriptUrl) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cloud: any[] = [];
      try {
        cloud = await fetchScript(scriptUrl, 'GET');
      } catch (e) {
        console.error('Fetch cloud tabData failed', e);
      }
      const localRaw = localStorage.getItem('local_tabData');
      const local: TabData[] = localRaw ? JSON.parse(localRaw) : [];

      // 合併 cloud 和 local，標記 syncStatus
      const merged: TabData[] = cloud.map(cloudItem => {
        const localItem = local.find(l => l.id === cloudItem.id);
        if (!localItem) {
          return { ...cloudItem, syncStatus: 'synced' };
        }
        if (cloudItem.updated_at === localItem.updated_at) {
          return { ...cloudItem, syncStatus: 'synced' };
        } else {
          // 以本地為主，標記 pending
          return { ...localItem, syncStatus: 'pending' };
        }
      });

      // local 有但 cloud 沒有的（本地新增/待同步）
      local.forEach(localItem => {
        if (!cloud.find(c => c.id === localItem.id)) {
          merged.push({ ...localItem, syncStatus: 'pending' });
        }
      });
      for (const item of merged) {
        item.measures = typeof item.measures === 'string' ? JSON.parse(item.measures) : item.measures;
      }

      setTabList(merged);
    };
    fetchAndCompare();
  }, [scriptUrl]);
  
  const [pendingTasks, setPendingTasks] = useState<SyncTask[]>(() => {
    try {
      const saved = localStorage.getItem('musicbook_pending_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const processingRef = useRef(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('local_tabData', JSON.stringify(tabList));
  }, [tabList]);

  useEffect(() => {
    localStorage.setItem('musicbook_pending_tasks', JSON.stringify(pendingTasks));
  }, [pendingTasks]);

  // Sync Logic
  const processQueue = useCallback(async () => {
    // If running or no tasks, skip
    if (!scriptUrl || pendingTasks.length === 0 || processingRef.current) return;

    processingRef.current = true;
    setIsSyncing(true);
    
    // Snapshot tasks to sync
    const tasksToSync = [...pendingTasks];
    const completedTaskIds: string[] = [];

    try {
      // Group tasks by action
      const addTasks = tasksToSync.filter(t => t.action === 'add');
      const editTasks = tasksToSync.filter(t => t.action === 'edit');
      const deleteTasks = tasksToSync.filter(t => t.action === 'delete');

      // 1. Batch Add
      if (addTasks.length > 0) {
        try {
          const payload = addTasks.map(t => t.data);
          await fetchScript(scriptUrl, 'POST', payload);
          completedTaskIds.push(...addTasks.map(t => t.id));
        } catch (e) {
          console.error("Batch add failed", e);
        }
      }

      // 2. Individual Edits
      if (editTasks.length > 0) {
        await Promise.all(editTasks.map(async (task) => {
          try {
            if (!task.data) return;
            const url = scriptUrl.includes('?') ? `${scriptUrl}&method=UPDATE` : `${scriptUrl}?method=UPDATE`;
            await fetchScript(url, 'POST', task.data);
            completedTaskIds.push(task.id);
          } catch (e) {
            console.error(`Edit failed for task ${task.id}`, e);
          }
        }));
      }

      // 3. Individual Deletes
      if (deleteTasks.length > 0) {
        await Promise.all(deleteTasks.map(async (task) => {
          try {
            const url = scriptUrl.includes('?') ? `${scriptUrl}&method=DELETE` : `${scriptUrl}?method=DELETE`;
            await fetchScript(url, 'POST', { id: task.targetId });
            completedTaskIds.push(task.id);
          } catch (e) {
            console.error(`Delete failed for task ${task.id}`, e);
          }
        }));
      }

      // Update state based on results
      setPendingTasks(prev => prev.filter(t => !completedTaskIds.includes(t.id)));
      
      const syncedTargetIds = tasksToSync.filter(t => completedTaskIds.includes(t.id)).map(t => t.targetId);
      const failedTargetIds = tasksToSync.filter(t => !completedTaskIds.includes(t.id)).map(t => t.targetId);

      setTabList(prev => prev.map(t => {
        if (syncedTargetIds.includes(t.id)) return { ...t, syncStatus: 'synced' };
        if (failedTargetIds.includes(t.id)) return { ...t, syncStatus: 'error' };
        return t;
      }));

    } catch (e) {
      console.error("Sync process critical error", e);
    } finally {
      processingRef.current = false;
      setIsSyncing(false);
    }
  }, [scriptUrl, pendingTasks]); 

  // Periodic Sync / Auto Sync
  useEffect(() => {
    // Attempt sync on mount if there are pending tasks
    if (pendingTasks.length > 0 && !processingRef.current) {
        processQueue();
    }

    const interval = setInterval(() => {
        if (pendingTasks.length > 0 && !processingRef.current) {
            processQueue();
        }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [pendingTasks.length, processQueue]);


  // Actions
  const addTabData = useCallback(async (data: Omit<TabData, 'id' | 'updated_at' | 'syncStatus'> & { created_at?: string }) => {
    const newTx: TabData = {
      ...data,
      id: crypto.randomUUID(),
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      syncStatus: 'pending'
    };

    setTabList(prev => [newTx, ...prev]);

    const rawData: RawData = {
      id: newTx.id,
      title: newTx.title,
      artist: newTx.artist,
      key: newTx.key,
      bpm: newTx.bpm,
      subdivisions: newTx.subdivisions,
      capo: newTx.capo,
      tuningName: newTx.tuningName,
      measures: JSON.stringify(newTx.measures),
      updated_at: newTx.updated_at,
      created_at: newTx.created_at
    };

    const task: SyncTask = {
        id: crypto.randomUUID(),
        action: 'add',
        targetId: newTx.id,
        data: rawData,
        timestamp: Date.now()
    };

    setPendingTasks(prev => [...prev, task]);
    return newTx.id;
  }, []);

  const updateTabData = useCallback(async (id: string, data: Partial<Omit<TabData, 'id' | 'syncStatus'>>) => {
    // Access latest tabData state inside the updater
    setTabList(currentTabData => {
        const index = currentTabData.findIndex(t => t.id === id);
        if (index === -1) return currentTabData;

        const currentData = currentTabData[index];
        const updatedData = { ...currentData, ...data, updated_at: new Date().toISOString(), syncStatus: 'pending' as const };
        
        const newTabData = [...currentTabData];
        newTabData[index] = updatedData;

        // Side effect: Queue the task
        // We do this by scheduling a state update for pendingTasks immediately
        const rawData: RawData = {
            id: updatedData.id,
            title: updatedData.title,
            artist: updatedData.artist,
            key: updatedData.key,
            bpm: updatedData.bpm,
            subdivisions: updatedData.subdivisions,
            capo: updatedData.capo,
            tuningName: updatedData.tuningName,
            measures: JSON.stringify(updatedData.measures),
            created_at: updatedData.created_at,
            updated_at: updatedData.updated_at
        };

        const task: SyncTask = {
            id: crypto.randomUUID(),
            action: 'edit',
            targetId: id,
            data: rawData,
            timestamp: Date.now()
        };
        
        // We must update the queue. 
        // Note: calling setPendingTasks inside setTabList callback is safe in React 18+ batching, 
        // but to be clean/safe we can do it outside or use a ref for the queue if we wanted complex logic.
        // Here we just queue the state update.
        setTimeout(() => {
          setPendingTasks(prevQueue => [...prevQueue, task]);
        }, 0);

        return newTabData;
    });

  }, []);

  const removeTabData = useCallback((id: string) => {
    setTabList(prev => prev.filter(t => t.id !== id));
    
    const task: SyncTask = {
        id: crypto.randomUUID(),
        action: 'delete',
        targetId: id,
        timestamp: Date.now()
    };
    setPendingTasks(prev => [...prev, task]);
  }, []);

  const syncFromCloud = useCallback(async () => {
    if (!scriptUrl) return;
    try {
      // Try to push pending changes first
      await processQueue();

      const cloudData = await fetchScript(scriptUrl);
      const syncedData: TabData[] = cloudData.map(d => ({
        ...(d as TabData),
        syncStatus: 'synced'
      }));
      
      setTabList(prev => {
          const pendingMap = new Map();
          // Keep current pending items
          prev.forEach(t => {
              if (t.syncStatus === 'pending' || t.syncStatus === 'error') {
                  pendingMap.set(t.id, t);
              }
          });

          const merged = [...syncedData];
          // Re-apply pending local versions on top of cloud versions
          pendingMap.forEach((val, key) => {
              const idx = merged.findIndex(t => t.id === key);
              if (idx >= 0) {
                  merged[idx] = val;
              } else {
                  // Pending create
                  merged.unshift(val);
              }
          });
          
          return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });

    } catch(e) {
      console.error("Sync failed", e);
    }
  }, [scriptUrl, processQueue]);

  return {
    tabList,
    addTabData,
    removeTabData,
    updateTabData,
    syncFromCloud,
    pushPendingChanges: processQueue,
    pendingTaskCount: pendingTasks.length,
    isSyncing
  };
};