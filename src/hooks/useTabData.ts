import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchScript } from './fetch';
import { dbGet, dbPut } from '../utils/db';
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

const migrateFromLocalStorage = async (): Promise<{ tabs: TabData[]; tasks: SyncTask[] }> => {
  try {
    const rawTabs = localStorage.getItem('local_tabData');
    const rawTasks = localStorage.getItem('musicbook_pending_tasks');
    const tabs = rawTabs ? (JSON.parse(rawTabs) as TabData[]).map(parseMeasures) : [];
    const tasks = rawTasks ? (JSON.parse(rawTasks) as SyncTask[]) : [];
    if (tabs.length > 0 || tasks.length > 0) {
      await dbPut([['local_tabData', tabs], ['musicbook_pending_tasks', tasks]]);
      localStorage.removeItem('local_tabData');
      localStorage.removeItem('musicbook_pending_tasks');
    }
    return { tabs, tasks };
  } catch {
    return { tabs: [], tasks: [] };
  }
};

export const useTabData = (scriptUrl: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tabList, setTabList] = useState<TabData[]>([]);
  const [pendingTasks, setPendingTasks] = useState<SyncTask[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const processingRef = useRef(false);
  const pendingTasksRef = useRef<SyncTask[]>([]);
  const tabListRef = useRef<TabData[]>([]);
  const syncFromCloudRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => { pendingTasksRef.current = pendingTasks; }, [pendingTasks]);
  useEffect(() => { tabListRef.current = tabList; }, [tabList]);

  // Load from IndexedDB on mount, migrate from localStorage if needed
  useEffect(() => {
    (async () => {
      try {
        let tabs = await dbGet<TabData[]>('local_tabData');
        let tasks = await dbGet<SyncTask[]>('musicbook_pending_tasks');

        // Migrate from localStorage if IndexedDB has no data yet
        if (!tabs) {
          const migrated = await migrateFromLocalStorage();
          tabs = migrated.tabs;
          tasks = migrated.tasks;
        }

        setTabList(tabs ? tabs.map(parseMeasures) : []);
        setPendingTasks(tasks ?? []);
      } catch (e) {
        console.error('Failed to load from IndexedDB', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Atomic write to IndexedDB whenever data changes (after initial load)
  useEffect(() => {
    if (isLoading) return;
    dbPut([['local_tabData', tabList], ['musicbook_pending_tasks', pendingTasks]]).catch(e => {
      console.error('IndexedDB write failed', e);
    });
  }, [tabList, pendingTasks, isLoading]);

  // processQueue: upload pending tasks to cloud, returns synced targetIds
  const processQueue = useCallback(async (): Promise<string[]> => {
    if (!scriptUrl || pendingTasksRef.current.length === 0 || processingRef.current) return [];

    processingRef.current = true;
    setIsSyncing(true);

    const tasksToSync = [...pendingTasksRef.current];
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

      const syncedTargetIds = tasksToSync.filter(t => completedTaskIds.includes(t.id)).map(t => t.targetId);
      const failedTargetIds = tasksToSync.filter(t => !completedTaskIds.includes(t.id)).map(t => t.targetId);

      setPendingTasks(prev => prev.filter(t => !completedTaskIds.includes(t.id)));
      setTabList(prev => prev.map(t => {
        if (syncedTargetIds.includes(t.id)) return { ...t, syncStatus: 'synced' };
        if (failedTargetIds.includes(t.id)) return { ...t, syncStatus: 'error' };
        return t;
      }));

      return syncedTargetIds;
    } catch (e) {
      console.error('Sync process critical error', e);
      return [];
    } finally {
      processingRef.current = false;
      setIsSyncing(false);
    }
  }, [scriptUrl]);

  // syncFromCloud: processQueue first, then fetch and merge using timestamp comparison
  const syncFromCloud = useCallback(async () => {
    if (!scriptUrl) return;
    setIsSyncingCloud(true);
    try {
      // Upload pending changes first, collect which targetIds were just synced
      const justSyncedIds = new Set(await processQueue());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cloud: any[] = await fetchScript(scriptUrl, 'GET');
      const cloudParsed: TabData[] = cloud.map(item => parseMeasures(item as TabData));

      setTabList(prev => {
        const localMap = new Map(prev.map(t => [t.id, t]));

        // Items with pending deletes should not be resurrected
        const pendingDeleteIds = new Set(
          pendingTasksRef.current.filter(t => t.action === 'delete').map(t => t.targetId)
        );

        const merged: TabData[] = cloudParsed
          .filter(c => !pendingDeleteIds.has(c.id))
          .map(cloudItem => {
            const local = localMap.get(cloudItem.id);
            if (!local) return { ...cloudItem, syncStatus: 'synced' as const };

            const cloudTime = new Date(cloudItem.updated_at).getTime();
            const localTime = new Date(local.updated_at).getTime();

            // Local is strictly newer → prefer local (needs sync or just synced)
            if (localTime > cloudTime) {
              const status = justSyncedIds.has(local.id) ? 'synced' as const : 'pending' as const;
              return { ...local, syncStatus: status };
            }

            // Cloud same or newer → cloud wins
            return { ...cloudItem, syncStatus: 'synced' as const };
          });

        // Keep local-only items (pending creates not yet in cloud)
        prev.forEach(localItem => {
          if (!cloudParsed.find(c => c.id === localItem.id)) {
            merged.push({ ...localItem, syncStatus: pendingDeleteIds.has(localItem.id) ? 'pending' as const : 'pending' as const });
          }
        });

        return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setIsSyncingCloud(false);
    }
  }, [scriptUrl, processQueue]);

  // Keep ref to latest syncFromCloud for the startup effect
  useEffect(() => { syncFromCloudRef.current = syncFromCloud; }, [syncFromCloud]);

  // Startup: after loading, run processQueue then syncFromCloud (sequential, not concurrent)
  const startupDone = useRef(false);
  useEffect(() => {
    if (isLoading || !scriptUrl || startupDone.current) return;
    startupDone.current = true;
    syncFromCloudRef.current();
  }, [isLoading, scriptUrl]);

  // Periodic auto-sync of pending tasks (skip while loading or startup sync is in progress)
  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      if (pendingTasksRef.current.length > 0 && !processingRef.current) processQueue();
    }, 5000);
    return () => clearInterval(interval);
  }, [isLoading, processQueue]);

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
    const current = tabListRef.current;
    const index = current.findIndex(t => t.id === id);
    if (index === -1) return;

    const updated: TabData = { ...current[index], ...data, updated_at: new Date().toISOString(), syncStatus: 'pending' };
    const next = [...current];
    next[index] = updated;
    const rawData: RawData = {
      id: updated.id, title: updated.title, artist: updated.artist, key: updated.key,
      bpm: updated.bpm, subdivisions: updated.subdivisions, capo: updated.capo,
      tuningName: updated.tuningName, measures: JSON.stringify(updated.measures),
      created_at: updated.created_at, updated_at: updated.updated_at,
    };

    setTabList(next);
    setPendingTasks(prev => [...prev, { id: crypto.randomUUID(), action: 'edit', targetId: id, data: rawData, timestamp: Date.now() }]);
  }, []);

  const removeTabData = useCallback((id: string) => {
    setTabList(prev => prev.filter(t => t.id !== id));
    setPendingTasks(prev => [...prev, { id: crypto.randomUUID(), action: 'delete', targetId: id, timestamp: Date.now() }]);
  }, []);

  return {
    tabList,
    isLoading,
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
