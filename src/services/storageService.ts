import { PostItNote, GoogleSheetsConfig } from '@/types/post-it';
import { initialNotes } from '@/data/sampleNotes';

const STORAGE_KEY = 'webapp_post_it_notes_v1';
const SHEETS_CONFIG_KEY = 'webapp_post_it_sheets_config_v1';

export const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyEUz_zRyVTxXarSP3OBnIg4YLOvUblb4-iMcu7VIf7-Nj608sWtkIHEYU9jCNUW_Sy/exec';

export const storageService = {
  // ==========================================
  // LocalStorage Operations (Offline-First)
  // ==========================================
  getNotes(): PostItNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialNotes));
        return initialNotes;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((n) => ({
          ...n,
          book: n.book && n.book.trim() ? n.book : 'ทั่วไป',
        }));
      }
      return initialNotes;
    } catch (err) {
      console.error('Error loading notes from localStorage:', err);
      return initialNotes;
    }
  },

  saveNotes(notes: PostItNote[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
      console.error('Error saving notes to localStorage:', err);
    }
  },

  getSheetsConfig(): GoogleSheetsConfig {
    return {
      webAppUrl: DEFAULT_SHEETS_URL,
      autoSync: true,
    };
  },

  saveSheetsConfig(config: GoogleSheetsConfig) {
    try {
      localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify(config));
    } catch (err) {
      console.error('Error saving sheets config:', err);
    }
  },

  // ==========================================
  // Google Apps Script API Operations
  // ==========================================

  // 1. Health Check / Ping API
  async pingGoogleSheets(webAppUrl: string): Promise<boolean> {
    if (!webAppUrl) return false;
    try {
      const separator = webAppUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${webAppUrl}${separator}action=ping`, {
        method: 'GET',
      });
      const data = await res.json();
      return data.status === 'success';
    } catch (err) {
      console.error('Ping failed:', err);
      return false;
    }
  },

  // 2. GET All Notes
  async fetchFromGoogleSheets(webAppUrl: string): Promise<PostItNote[]> {
    if (!webAppUrl) throw new Error('กรุณาระบุ Google Apps Script Web App URL');
    
    const separator = webAppUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${webAppUrl}${separator}action=getNotes`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'success' && Array.isArray(data.notes)) {
      return data.notes.map((n: PostItNote) => ({
        ...n,
        book: n.book && n.book.trim() ? n.book : 'ทั่วไป',
      }));
    } else {
      throw new Error(data.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้');
    }
  },

  // 3. POST: Create Note API
  async apiCreateNote(webAppUrl: string, note: PostItNote): Promise<void> {
    if (!webAppUrl) return;
    await this.postToApi(webAppUrl, {
      action: 'create',
      note: note,
    });
  },

  // 4. POST: Update Note API
  async apiUpdateNote(webAppUrl: string, note: PostItNote): Promise<void> {
    if (!webAppUrl) return;
    await this.postToApi(webAppUrl, {
      action: 'update',
      note: note,
    });
  },

  // 5. POST: Delete Note API
  async apiDeleteNote(webAppUrl: string, id: string): Promise<void> {
    if (!webAppUrl) return;
    await this.postToApi(webAppUrl, {
      action: 'delete',
      id: id,
    });
  },

  // 6. POST: Toggle Pin API
  async apiTogglePin(webAppUrl: string, id: string): Promise<void> {
    if (!webAppUrl) return;
    await this.postToApi(webAppUrl, {
      action: 'togglePin',
      id: id,
    });
  },

  // 7. POST: Toggle Complete API
  async apiToggleComplete(webAppUrl: string, id: string): Promise<void> {
    if (!webAppUrl) return;
    await this.postToApi(webAppUrl, {
      action: 'toggleComplete',
      id: id,
    });
  },

  // 8. POST: Bulk Sync Notes
  async syncToGoogleSheets(webAppUrl: string, notes: PostItNote[]): Promise<string> {
    if (!webAppUrl) throw new Error('กรุณาระบุ Google Apps Script Web App URL');

    const data = await this.postToApi(webAppUrl, {
      action: 'sync',
      notes: notes,
    });

    return data.message || 'ซิงค์ข้อมูลสำเร็จ';
  },

  // Internal Helper to POST with text/plain (avoiding CORS preflight issues with Google Apps Script)
  async postToApi(webAppUrl: string, payload: unknown): Promise<{ status: string; message?: string }> {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(data.message || 'API operation failed');
    }
    return data;
  },

  // Export JSON backup
  exportJSON(notes: PostItNote[]) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `post-it-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};
