// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawData = Record<string, any>;
type Data = RawData;

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