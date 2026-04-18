
interface Note {
  string: number;
  fret: number;
  beat: number;
}

interface Measure {
  textTab: string;
  id: number;
  chord: string;
  lyrics: string;
  notes: Note[];
}

export type Data = {
  id: string;
  title: string;
  artist: string;
  key: string;
  bpm: number;
  subdivisions: number;
  capo: number;
  tuningName: string;
  measures: Measure[];
  updated_at: string;
  created_at: string;
}

export type RawData = {
  id: string;
  title: string;
  artist: string;
  key: string;
  bpm: number;
  subdivisions: number;
  capo: number;
  tuningName: string;
  measures: string;
  updated_at: string;
  created_at: string;
}

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface TabData extends Data {
  syncStatus?: SyncStatus;
}