export type NoteColor = 
  | 'sand'      // Muji Natural Off-White
  | 'kraft'     // Warm Kraft Paper
  | 'sage'      // Pale Matcha Sage
  | 'sky'       // Calm Morning Blue
  | 'clay'      // Soft Terracotta
  | 'ochre'     // Warm Mustard
  | 'charcoal'  // Minimal Dark Slate
  // Legacy / fallback colors
  | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'orange' | 'spotlight' | 'holographic';

export type NoteCategory = 
  | 'All'
  | 'Work' 
  | 'Ideas' 
  | 'Todo' 
  | 'Personal' 
  | 'Focus'
  | string;

export interface PostItNote {
  id: string;
  book?: string; // ชื่อเล่มหนังสือ เช่น "กีฬา", "งาน", "ทั่วไป"
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
