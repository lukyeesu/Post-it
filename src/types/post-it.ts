export type NoteColor = 
  | 'yellow' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'pink' 
  | 'orange' 
  | 'spotlight' 
  | 'holographic';

export type NoteCategory = 
  | 'All'
  | 'Work' 
  | 'Ideas' 
  | 'Todo' 
  | 'Personal' 
  | 'Urgent' 
  | string;

export interface PostItNote {
  id: string;
  title: string;
  content: string;
  category: string;
  color: NoteColor;
  tags: string[];
  isPinned: boolean;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}
