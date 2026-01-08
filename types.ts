
export enum AppMode {
  GENERATOR = 'GENERATOR',
  LEARNING = 'LEARNING',
  LIBRARY = 'LIBRARY'
}

export interface GeneratedBlock {
  id: string;
  name: string;
  timestamp: number;
  code: string;
  request: string;
}

export interface HistoryItem {
  id: string;
  type: 'reference' | 'generation';
  content: string;
  response?: string;
  timestamp: number;
}
