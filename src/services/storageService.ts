import { PostItNote, GoogleSheetsConfig } from '@/types/post-it';
import { initialNotes } from '@/data/sampleNotes';

const STORAGE_KEY = 'webapp_post_it_notes_v1';
const SHEETS_CONFIG_KEY = 'webapp_post_it_sheets_config_v1';

export const storageService = {
  // LocalStorage
  getNotes(): PostItNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialNotes));
        return initialNotes;
      }
      return JSON.parse(data);
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
    try {
      const data = localStorage.getItem(SHEETS_CONFIG_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading sheets config:', err);
    }
    return {
      webAppUrl: '',
      autoSync: false,
    };
  },

  saveSheetsConfig(config: GoogleSheetsConfig) {
    try {
      localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify(config));
    } catch (err) {
      console.error('Error saving sheets config:', err);
    }
  },

  // Google Sheets Fetch (doGet)
  async fetchFromGoogleSheets(webAppUrl: string): Promise<PostItNote[]> {
    if (!webAppUrl) throw new Error('กรุณาระบุ Google Apps Script Web App URL');
    
    const response = await fetch(webAppUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'success' && Array.isArray(data.notes)) {
      return data.notes;
    } else {
      throw new Error(data.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้');
    }
  },

  // Google Sheets Push (doPost)
  async syncToGoogleSheets(webAppUrl: string, notes: PostItNote[]): Promise<string> {
    if (!webAppUrl) throw new Error('กรุณาระบุ Google Apps Script Web App URL');

    const payload = {
      action: 'sync',
      notes: notes,
    };

    // Google Apps Script doPost requires text/plain or form data to avoid CORS preflight issues
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
    if (data.status === 'success') {
      return data.message || 'ซิงค์ข้อมูลสำเร็จ';
    } else {
      throw new Error(data.message || 'การซิงค์ข้อมูลล้มเหลว');
    }
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
