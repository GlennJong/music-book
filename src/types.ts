export type Data = {
  id: string,
  price: number,
  name: string,
  description: string,
  tags: string[],
  created_at: string,
  updated_at: string
}

export type RawData = {
  id: string,
  price: number,
  name: string,
  description: string,
  tags: string,
  created_at: string,
  updated_at: string
}

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface Transaction extends Data {
  syncStatus?: SyncStatus;
}