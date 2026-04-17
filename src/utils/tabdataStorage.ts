// Utility for versioned localStorage management of TabData
import type { TabData } from '../screen/TabScreen/index';

const STORAGE_KEY = 'tabdata_list';
const STORAGE_VERSION = 1;

interface SerializedTabData extends Omit<TabData, 'measures'> {
  measures: string;
}
interface VersionedTabData {
  version: number;
  data: SerializedTabData[];
}


// measures 欄位可為 string 或 array
function isValidTabDataArray(data: unknown): data is (TabData[] | SerializedTabData[]) {
  return Array.isArray(data) && data.every(item => {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    const measures = obj.measures;
    return (
      typeof obj.title === 'string' &&
      typeof obj.artist === 'string' &&
      typeof obj.key === 'string' &&
      typeof obj.bpm === 'number' &&
      typeof obj.subdivisions === 'number' &&
      typeof obj.capo === 'number' &&
      (typeof measures === 'string' || Array.isArray(measures))
    );
  });
}

// parse measures 欄位
export function parseTabData(raw: unknown): TabData {
  if (!raw || typeof raw !== 'object') throw new Error('No data');
  const r = raw as { [key: string]: unknown };
  const measures = typeof r.measures === 'string' ? JSON.parse(r.measures) : r.measures;
  return { ...(r as Omit<TabData, 'measures'>), measures };
}

export function serializeTabData(tab: TabData): SerializedTabData {
  return { ...tab, measures: JSON.stringify(tab.measures) };
}

export function loadTabDataList(): TabData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // New format
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      if (parsed.version === STORAGE_VERSION && isValidTabDataArray(parsed.data)) {
        return parsed.data.map(parseTabData);
      } else {
        // 不要清空，直接回傳空陣列
        return [];
      }
    }
    // Old format fallback: array only
    if (isValidTabDataArray(parsed)) {
      // Migrate to new format (only if array is TabData[])
      const arr = parsed as unknown[];
      const isTabDataArr = arr.every(item => {
        if (typeof item !== 'object' || item === null) return false;
        const obj = item as Record<string, unknown>;
        return typeof obj.measures !== 'string';
      });
      if (isTabDataArr) {
        saveTabDataList(parsed as TabData[]);
      }
      return arr.map(parseTabData);
    }
  } catch (e) { console.error('[loadTabDataList] error', e); }
  // On error,回傳空陣列但不覆蓋 localStorage
  return [];
}

export function saveTabDataList(list: TabData[]) {
  // 確保 measures 欄位都為 string
  const serializedList = list.map(serializeTabData);
  const versioned: VersionedTabData = { version: STORAGE_VERSION, data: serializedList };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned));
}

export function addTabData(tab: TabData) {
  const list = loadTabDataList();
  list.push(parseTabData(tab)); // 先 parse 確保 measures 是 array
  saveTabDataList(list);
}

export function deleteTabDataByIndex(idx: number) {
  const list = loadTabDataList();
  list.splice(idx, 1);
  saveTabDataList(list);
}
