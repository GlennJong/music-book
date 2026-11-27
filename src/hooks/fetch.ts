// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawData = Record<string, any>;
type Data = RawData;

export class ScriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptError';
  }
  /** 雲端已沒有這筆資料（刪除時可視為成功） */
  get isNotFound() {
    return this.message.startsWith('ID not found') || this.message.startsWith('No data to');
  }
}

export const fetchScript = async (url: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<Data[]> => {
  const options: RequestInit = { method };
  if (method === 'POST' && body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    if (method === 'POST') return []; // Non-JSON success response is OK for writes
    throw new Error(`Invalid JSON response: ${text.slice(0, 100)}`);
  }

  // Apps Script 以 HTTP 200 + { error } 回報失敗（例如 ID not found、LOCK_TIMEOUT），
  // 不能當成成功，否則待同步任務會被移除而資料其實沒寫入
  if (json && typeof json.error === 'string') {
    throw new ScriptError(json.error);
  }

  // Safety check: ensure data exists and is an array
  const data: RawData[] = Array.isArray(json.data) ? json.data : [];
  
  return data.map((item: RawData) => {
    // If tags is a string, split it and filter out empty strings
    const rawTags = typeof item.tags === 'string' ? item.tags.split(',') : (item.tags || []);
    const tags = rawTags.map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    return { 
        ...item, 
        tags 
    };
  });
};