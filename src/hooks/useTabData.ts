import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchScript } from './fetch';
import type { TabData, RawData } from '../types';

type SyncAction = 'add' | 'edit' | 'delete';

type SyncTask = {
  id: string;
  action: SyncAction;
  targetId: string;
  data?: RawData;
  timestamp: number;
};

const parseMeasures = (item: TabData): TabData => ({
  ...item,
  measures: typeof item.measures === 'string' ? JSON.parse(item.measures as unknown as string) : item.measures,
});

export const useTabData = (scriptUrl: string | null) => {
  // Initialize immediately from localStorage — no loading wait
  const [tabList, setTabList] = useState<TabData[]>(() => {
    try {
      const raw = localStorage.getItem('local_tabData');
      if (!raw) return [];
      return (JSON.parse(raw) as TabData[]).map(parseMeasures);
    } catch { return []; }
  });

  const [pendingTasks, setPendingTasks] = useState<SyncTask[]>(() => {
    try {
      const saved = localStorage.getItem('musicbook_pending_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const processingRef = useRef(false);
  const pendingTasksRef = useRef(pendingTasks);

  useEffect(() => { pendingTasksRef.current = pendingTasks; }, [pendingTasks]);

  // Persist to localStorage whenever tabList or pendingTasks change
  useEffect(() => {
    localStorage.setItem('local_tabData', JSON.stringify(tabList));
  }, [tabList]);

  useEffect(() => {
    localStorage.setItem('musicbook_pending_tasks', JSON.stringify(pendingTasks));
  }, [pendingTasks]);

  // Background cloud sync on mount — merges cloud into existing local state
  useEffect(() => {
    const syncWithCloud = async () => {
      if (!scriptUrl) return;
      setIsSyncingCloud(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cloud: any[] = await fetchScript(scriptUrl, 'GET');
        const cloudParsed: TabData[] = cloud.map(item => parseMeasures(item as TabData));

        setTabList(prev => {
          const localMap = new Map(prev.map(t => [t.id, t]));
          // Don't resurrect items that have a pending delete
          const pendingDeleteIds = new Set(
            pendingTasksRef.current.filter(t => t.action === 'delete').map(t => t.targetId)
          );

          const merged: TabData[] = cloudParsed
            .filter(c => !pendingDeleteIds.has(c.id))
            .map(cloudItem => {
              const local = localMap.get(cloudItem.id);
              if (!local) return { ...cloudItem, syncStatus: 'synced' as const };
              if (cloudItem.updated_at === local.updated_at) return { ...cloudItem, syncStatus: 'synced' as const };
              return { ...local, syncStatus: 'pending' as const };
            });

          // Keep local-only items (pending creates or deletes not yet synced)
          prev.forEach(localItem => {
            if (!cloudParsed.find(c => c.id === localItem.id)) {
              merged.push({ ...localItem, syncStatus: 'pending' as const });
            }
          });

          return merged;
        });
      } catch (e) {
        console.error('Background cloud sync failed', e);
      } finally {
        setIsSyncingCloud(false);
      }
    };

    syncWithCloud();
  }, [scriptUrl]);

  // Sync Logic — push pending tasks to cloud
  const processQueue = useCallback(async () => {
    if (!scriptUrl || pendingTasks.length === 0 || processingRef.current) return;

    processingRef.current = true;
    setIsSyncing(true);

    const tasksToSync = [...pendingTasks];
    const completedTaskIds: string[] = [];

    try {
      const addTasks = tasksToSync.filter(t => t.action === 'add');
      const editTasks = tasksToSync.filter(t => t.action === 'edit');
      const deleteTasks = tasksToSync.filter(t => t.action === 'delete');

      if (addTasks.length > 0) {
        try {
          await fetchScript(scriptUrl, 'POST', addTasks.map(t => t.data));
          completedTaskIds.push(...addTasks.map(t => t.id));
        } catch (e) { console.error('Batch add failed', e); }
      }

      if (editTasks.length > 0) {
        await Promise.all(editTasks.map(async task => {
          try {
            if (!task.data) return;
            const url = scriptUrl.includes('?') ? `${scriptUrl}&method=UPDATE` : `${scriptUrl}?method=UPDATE`;
            await fetchScript(url, 'POST', task.data);
            completedTaskIds.push(task.id);
          } catch (e) { console.error(`Edit failed for task ${task.id}`, e); }
        }));
      }

      if (deleteTasks.length > 0) {
        await Promise.all(deleteTasks.map(async task => {
          try {
            const url = scriptUrl.includes('?') ? `${scriptUrl}&method=DELETE` : `${scriptUrl}?method=DELETE`;
            await fetchScript(url, 'POST', { id: task.targetId });
            completedTaskIds.push(task.id);
          } catch (e) { console.error(`Delete failed for task ${task.id}`, e); }
        }));
      }

      setPendingTasks(prev => prev.filter(t => !completedTaskIds.includes(t.id)));

      const syncedIds = tasksToSync.filter(t => completedTaskIds.includes(t.id)).map(t => t.targetId);
      const failedIds = tasksToSync.filter(t => !completedTaskIds.includes(t.id)).map(t => t.targetId);

      setTabList(prev => prev.map(t => {
        if (syncedIds.includes(t.id)) return { ...t, syncStatus: 'synced' };
        if (failedIds.includes(t.id)) return { ...t, syncStatus: 'error' };
        return t;
      }));
    } catch (e) {
      console.error('Sync process critical error', e);
    } finally {
      processingRef.current = false;
      setIsSyncing(false);
    }
  }, [scriptUrl, pendingTasks]);

  // Periodic auto-sync of pending tasks
  useEffect(() => {
    if (pendingTasks.length > 0 && !processingRef.current) processQueue();
    const interval = setInterval(() => {
      if (pendingTasks.length > 0 && !processingRef.current) processQueue();
    }, 5000);
    return () => clearInterval(interval);
  }, [pendingTasks.length, processQueue]);

  // Actions
  const addTabData = useCallback(async (data: Omit<TabData, 'id' | 'updated_at' | 'syncStatus'> & { created_at?: string }) => {
    const newTx: TabData = {
      ...data,
      id: crypto.randomUUID(),
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      syncStatus: 'pending',
    };
    setTabList(prev => [newTx, ...prev]);
    const rawData: RawData = {
      id: newTx.id, title: newTx.title, artist: newTx.artist, key: newTx.key,
      bpm: newTx.bpm, subdivisions: newTx.subdivisions, capo: newTx.capo,
      tuningName: newTx.tuningName, measures: JSON.stringify(newTx.measures),
      updated_at: newTx.updated_at, created_at: newTx.created_at,
    };
    setPendingTasks(prev => [...prev, { id: crypto.randomUUID(), action: 'add', targetId: newTx.id, data: rawData, timestamp: Date.now() }]);
    return newTx.id;
  }, []);

  const updateTabData = useCallback(async (id: string, data: Partial<Omit<TabData, 'id' | 'syncStatus'>>) => {
    setTabList(current => {
      const index = current.findIndex(t => t.id === id);
      if (index === -1) return current;
      const updated = { ...current[index], ...data, updated_at: new Date().toISOString(), syncStatus: 'pending' as const };
      const next = [...current];
      next[index] = updated;
      const rawData: RawData = {
        id: updated.id, title: updated.title, artist: updated.artist, key: updated.key,
        bpm: updated.bpm, subdivisions: updated.subdivisions, capo: updated.capo,
        tuningName: updated.tuningName, measures: JSON.stringify(updated.measures),
        created_at: updated.created_at, updated_at: updated.updated_at,
      };
      setTimeout(() => {
        setPendingTasks(prev => [...prev, { id: crypto.randomUUID(), action: 'edit', targetId: id, data: rawData, timestamp: Date.now() }]);
      }, 0);
      return next;
    });
  }, []);

  const removeTabData = useCallback((id: string) => {
    setTabList(prev => prev.filter(t => t.id !== id));
    setPendingTasks(prev => [...prev, { id: crypto.randomUUID(), action: 'delete', targetId: id, timestamp: Date.now() }]);
  }, []);

  const syncFromCloud = useCallback(async () => {
    if (!scriptUrl) return;
    setIsSyncingCloud(true);
    try {
      await processQueue();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cloud: any[] = await fetchScript(scriptUrl);
      const cloudParsed: TabData[] = cloud.map(d => parseMeasures({ ...(d as TabData), syncStatus: 'synced' }));
      setTabList(prev => {
        const pendingMap = new Map(prev.filter(t => t.syncStatus !== 'synced').map(t => [t.id, t]));
        const merged = [...cloudParsed];
        pendingMap.forEach((val, key) => {
          const idx = merged.findIndex(t => t.id === key);
          if (idx >= 0) merged[idx] = val; else merged.unshift(val);
        });
        return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setIsSyncingCloud(false);
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
    isSyncing,
    isSyncingCloud,
  };
};
