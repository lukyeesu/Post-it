import { PostItNote, GoogleSheetsConfig } from '@/types/post-it';

const STORAGE_KEY = 'webapp_post_it_notes_v1';
const SHEETS_CONFIG_KEY = 'webapp_post_it_sheets_config_v1';
const CUSTOM_BOARDS_KEY = 'webapp_post_it_custom_boards_v1';
const CUSTOM_CATEGORIES_KEY = 'webapp_post_it_custom_categories_v1';
export const SYSTEM_TAXONOMY_ID = '__SYSTEM_TAXONOMY__';

export const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyEUz_zRyVTxXarSP3OBnIg4YLOvUblb4-iMcu7VIf7-Nj608sWtkIHEYU9jCNUW_Sy/exec';

export interface FetchNotesResult {
  notes: PostItNote[];
  boards: string[];
  categories: string[];
}

export const storageService = {
  // ==========================================
  // LocalStorage Operations (Offline-First)
  // ==========================================
  getNotes(): PostItNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((n) => n.id !== SYSTEM_TAXONOMY_ID)
          .map((n, idx) => ({
            ...n,
            order: typeof n.order === 'number' ? n.order : idx,
            book: n.book && n.book.trim() ? n.book : 'ทั่วไป',
          }));
      }
      return [];
    } catch (err) {
      console.error('Error loading notes from localStorage:', err);
      return [];
    }
  },

  saveNotes(notes: PostItNote[]) {
    try {
      const clean = notes.filter((n) => n.id !== SYSTEM_TAXONOMY_ID);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch (err) {
      console.error('Error saving notes to localStorage:', err);
    }
  },

  getCustomBoards(): string[] {
    try {
      const saved = localStorage.getItem(CUSTOM_BOARDS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  saveCustomBoards(boards: string[]) {
    try {
      localStorage.setItem(CUSTOM_BOARDS_KEY, JSON.stringify(boards));
    } catch (err) {
      console.error('Error saving custom boards to localStorage:', err);
    }
  },

  getCustomCategories(): string[] {
    try {
      const saved = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  saveCustomCategories(cats: string[]) {
    try {
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
    } catch (err) {
      console.error('Error saving custom categories to localStorage:', err);
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

  // Builds the system metadata record storing all boards and categories into Google Sheets
  buildTaxonomyNote(boards?: string[], categories?: string[]): PostItNote {
    const effectiveBoards = boards || this.getCustomBoards();
    const effectiveCategories = categories || this.getCustomCategories();

    return {
      id: SYSTEM_TAXONOMY_ID,
      title: '[ระบบ] รายชื่อบอร์ดและหมวดหมู่ (Taxonomy Metadata)',
      content: JSON.stringify({
        boards: effectiveBoards,
        categories: effectiveCategories,
      }),
      category: 'ระบบ',
      book: 'ระบบ',
      color: 'sand',
      tags: ['system', 'taxonomy'],
      isPinned: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: -999,
    };
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

  // 2. GET All Notes & Taxonomy (Boards & Categories)
  async fetchFromGoogleSheets(webAppUrl: string): Promise<FetchNotesResult> {
    if (!webAppUrl) throw new Error('กรุณาระบุ Google Apps Script Web App URL');
    
    const separator = webAppUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${webAppUrl}${separator}action=getNotes`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('ไม่สามารถแปลงข้อมูล JSON จาก Google Sheets ได้');
    }

    if (data.status === 'success' && Array.isArray(data.notes)) {
      let extractedBoards: string[] = [];
      let extractedCategories: string[] = [];

      // Filter out any system notes from user-facing notes
      const existingLocalNotes = this.getNotes();
      const existingLocalMap = new Map(existingLocalNotes.map((n) => [n.id, n]));

      const userNotes = data.notes
        .filter((n: PostItNote) => n.id !== SYSTEM_TAXONOMY_ID && n.category !== 'ระบบ' && n.book !== 'ระบบ')
        .map((n: PostItNote, idx: number) => {
          const localNote = existingLocalMap.get(n.id);
          // If sheet returned a valid book, use it!
          // If sheet returned empty/undefined (older script version or unpopulated column), PRESERVE existing local book!
          const sheetBook = n.book && n.book.trim() ? n.book.trim() : '';
          const localBook = localNote && localNote.book && localNote.book.trim() ? localNote.book.trim() : '';
          const effectiveBook = sheetBook || localBook || 'ทั่วไป';

          return {
            ...n,
            order: typeof n.order === 'number' ? n.order : (typeof localNote?.order === 'number' ? localNote.order : idx),
            book: effectiveBook,
          };
        });

      // Also harvest boards & categories directly from existing notes and localStorage so created boards never vanish
      const localBoards = this.getCustomBoards();
      const booksFromNotes = userNotes
        .map((n: PostItNote) => (n.book || '').trim())
        .filter((b: string) => b && b !== 'ทั่วไป' && b !== 'ระบบ');
      const allExtractedBoards = Array.from(new Set([...localBoards, ...booksFromNotes]));
      if (allExtractedBoards.length > 0) {
        this.saveCustomBoards(allExtractedBoards);
      }

      const localCats = this.getCustomCategories();
      const catsFromNotes = userNotes
        .map((n: PostItNote) => (n.category || '').trim())
        .filter((c: string) => c && c !== 'ทั่วไป' && c !== 'ระบบ');
      const allExtractedCats = Array.from(new Set([...localCats, ...catsFromNotes]));
      if (allExtractedCats.length > 0) {
        this.saveCustomCategories(allExtractedCats);
      }

      return {
        notes: userNotes,
        boards: allExtractedBoards,
        categories: allExtractedCats,
      };
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

  // 8. POST: Bulk Sync Notes & Taxonomy (Boards and Categories)
  async syncToGoogleSheets(
    webAppUrl: string, 
    notes: PostItNote[], 
    boards?: string[], 
    categories?: string[]
  ): Promise<string> {
    if (!webAppUrl) throw new Error('กรุณาระบุ Google Apps Script Web App URL');

    const effectiveBoards = boards || this.getCustomBoards();
    const effectiveCategories = categories || this.getCustomCategories();

    // Persist to local storage as well
    if (boards) this.saveCustomBoards(boards);
    if (categories) this.saveCustomCategories(categories);

    // Only sync real user notes - No system/taxonomy metadata rows in Google Sheets!
    const cleanUserNotes = notes.filter(
      (n) => n.id !== SYSTEM_TAXONOMY_ID && n.category !== 'ระบบ' && n.book !== 'ระบบ'
    );

    const data = await this.postToApi(webAppUrl, {
      action: 'sync',
      notes: cleanUserNotes,
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
    const clean = notes.filter((n) => n.id !== SYSTEM_TAXONOMY_ID);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clean, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `post-it-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};
