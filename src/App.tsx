import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { BookFilter } from '@/components/BookFilter';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PostItCard, PostItCardPreview } from '@/components/PostItCard';
import { PostItModal } from '@/components/PostItModal';
import { ManageTaxonomyModal } from '@/components/ManageTaxonomyModal';
import { PostItNote, GoogleSheetsConfig } from '@/types/post-it';
import { storageService, DEFAULT_SHEETS_URL } from '@/services/storageService';
import { Plus, StickyNote, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConfirm } from '@/context/ConfirmContext';

export function App() {
  const { confirm } = useConfirm();

  // 1. Core State
  const [notes, setNotes] = useState<PostItNote[]>(() => storageService.getNotes());
  const [sheetsConfig] = useState<GoogleSheetsConfig>(() => storageService.getSheetsConfig());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'connected' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('webapp_post_it_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 2. Modals & Drag State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PostItNote | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 120 FPS Drag State (Ref-based pointer tracking to prevent React re-renders while moving)
  const [activeDragNote, setActiveDragNote] = useState<PostItNote | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number>(300);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const dragCardRef = useRef<HTMLDivElement>(null);
  const initialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    note: PostItNote;
    offsetX: number;
    offsetY: number;
    targetId: string | null;
    cardRects: { id: string; rect: DOMRect }[];
  } | null>(null);

  // Global Pointer Event Listeners (Zero React re-renders during pointermove)
  useEffect(() => {
    if (!activeDragNote) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStateRef.current || !dragCardRef.current) return;
      const { offsetX, offsetY, cardRects } = dragStateRef.current;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;

      // 120 FPS Direct GPU transform without triggering React component tree re-renders
      dragCardRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.04) rotate(1.5deg)`;

      // Test against cached card boundaries (< 0.01ms, no DOM layout thrashing)
      let newTargetId: string | null = null;
      for (let i = 0; i < cardRects.length; i++) {
        const r = cardRects[i].rect;
        if (
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        ) {
          newTargetId = cardRects[i].id;
          break;
        }
      }

      // Only trigger React state change when drop target actually changes
      if (newTargetId !== dragStateRef.current.targetId) {
        dragStateRef.current.targetId = newTargetId;
        setDropTargetId(newTargetId);
      }
    };

    const handlePointerUp = () => {
      if (dragStateRef.current) {
        const { note, targetId } = dragStateRef.current;
        if (targetId && targetId !== note.id) {
          handleReorderNotes(note.id, targetId);
        }
        dragStateRef.current = null;
      }
      setActiveDragNote(null);
      setDropTargetId(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeDragNote]);

  // Sync dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('webapp_post_it_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('webapp_post_it_theme', 'light');
    }
  }, [darkMode]);

  // 1.1 Custom & Deleted Boards & Categories State (Persisted in LocalStorage & Google Sheets)
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = storageService.getCustomCategories();
    const fromNotes = storageService.getNotes()
      .map((n) => (n.category || '').trim())
      .filter((c) => c && c !== 'ทั่วไป' && c !== 'ระบบ');
    return Array.from(new Set([...saved, ...fromNotes]));
  });

  const [deletedCategories, setDeletedCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('webapp_post_it_deleted_categories_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customBoards, setCustomBoards] = useState<string[]>(() => {
    const saved = storageService.getCustomBoards();
    const fromNotes = storageService.getNotes()
      .map((n) => (n.book || '').trim())
      .filter((b) => b && b !== 'ทั่วไป' && b !== 'ระบบ');
    return Array.from(new Set([...saved, ...fromNotes]));
  });

  const [deletedBoards, setDeletedBoards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('webapp_post_it_deleted_boards_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync boards and categories to localStorage
  useEffect(() => {
    storageService.saveCustomCategories(customCategories);
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('webapp_post_it_deleted_categories_v1', JSON.stringify(deletedCategories));
  }, [deletedCategories]);

  useEffect(() => {
    storageService.saveCustomBoards(customBoards);
  }, [customBoards]);

  useEffect(() => {
    localStorage.setItem('webapp_post_it_deleted_boards_v1', JSON.stringify(deletedBoards));
  }, [deletedBoards]);

  // Persist notes to localStorage
  useEffect(() => {
    storageService.saveNotes(notes);
  }, [notes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // 3. Fast Auto-Sync on Mount: Directly fetch from Google Sheets
  useEffect(() => {
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    let isMounted = true;

    const fetchLatestFromSheets = async () => {
      try {
        setSyncStatus('syncing');
        const result = await storageService.fetchFromGoogleSheets(targetUrl);
        if (!isMounted) return;

        if (result && Array.isArray(result.notes)) {
          setNotes(result.notes);
          storageService.saveNotes(result.notes);

          // Merge boards from Google Sheets
          if (Array.isArray(result.boards) && result.boards.length > 0) {
            setCustomBoards((prev) => Array.from(new Set([...prev, ...result.boards])));
          }

          // Merge categories from Google Sheets
          if (Array.isArray(result.categories) && result.categories.length > 0) {
            setCustomCategories((prev) => Array.from(new Set([...prev, ...result.categories])));
          }

          setSyncStatus('connected');
          const totalNotes = result.notes.length;
          const totalBoards = result.boards?.length || 0;
          if (totalNotes > 0 || totalBoards > 0) {
            showToast(`เชื่อมต่อ Google Sheets แล้ว (พบโน้ต ${totalNotes} รายการ, บอร์ด ${totalBoards} บอร์ด) ☁️`);
          }
        }
      } catch (err) {
        console.warn('Initial fetch from Google Sheets:', err);
        if (isMounted) {
          // Check ping as fallback indicator
          storageService.pingGoogleSheets(targetUrl).then((alive) => {
            if (isMounted) setSyncStatus(alive ? 'connected' : 'error');
          });
        }
      }
    };

    fetchLatestFromSheets();
    return () => { isMounted = false; };
  }, [sheetsConfig.webAppUrl]);

  // 4. Cloud Sync Action (Direct Sync with Google Sheets)
  const handleSyncNow = async () => {
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    try {
      setSyncStatus('syncing');
      showToast('กำลังซิงค์ข้อมูลกับ Google Sheets...');
      const result = await storageService.fetchFromGoogleSheets(targetUrl);
      if (result && Array.isArray(result.notes)) {
        setNotes(result.notes);
        storageService.saveNotes(result.notes);

        if (Array.isArray(result.boards) && result.boards.length > 0) {
          setCustomBoards((prev) => Array.from(new Set([...prev, ...result.boards])));
        }
        if (Array.isArray(result.categories) && result.categories.length > 0) {
          setCustomCategories((prev) => Array.from(new Set([...prev, ...result.categories])));
        }

        setSyncStatus('connected');
        showToast(`ซิงค์ข้อมูลสำเร็จ (${result.notes.length} รายการ, ${result.boards?.length || 0} บอร์ด) ☁️`);
      } else {
        setSyncStatus('connected');
        showToast('ซิงค์ข้อมูลเรียบร้อย');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
      showToast('ซิงค์ไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อ');
    }
  };

  // 5. Boards calculation (e.g. กีฬา, งาน, ทั่วไป)
  const allBooks = useMemo(() => {
    const fromNotes = notes
      .filter((n) => n.id !== '__SYSTEM_TAXONOMY__')
      .map((n) => (n.book || 'ทั่วไป').trim())
      .filter(Boolean);
    const combined = Array.from(new Set(['ทั่วไป', ...fromNotes, ...customBoards.map((b) => b.trim())]));
    return combined.filter((b) => b === 'ทั่วไป' || (!deletedBoards.map((d) => d.trim()).includes(b) && b !== 'ระบบ'));
  }, [notes, customBoards, deletedBoards]);

  const bookCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      if (note.id === '__SYSTEM_TAXONOMY__') continue;
      const b = (note.book || 'ทั่วไป').trim();
      counts[b] = (counts[b] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // 6. Categories list calculation: dynamically derived from DB notes and custom categories
  const allCategoriesGlobal = useMemo(() => {
    const fromNotes = notes
      .filter((n) => n.id !== '__SYSTEM_TAXONOMY__')
      .map((n) => n.category.trim())
      .filter(Boolean);
    const combined = Array.from(new Set([...fromNotes, ...customCategories.map((c) => c.trim())]));
    const filtered = combined.filter((c) => !deletedCategories.map((d) => d.trim()).includes(c) && c !== 'ระบบ');
    return filtered.length > 0 ? filtered : ['ทั่วไป'];
  }, [notes, customCategories, deletedCategories]);

  // Global counts for all categories across all boards (for ManageTaxonomyModal)
  const globalCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      if (note.id === '__SYSTEM_TAXONOMY__') continue;
      if (note.category) {
        counts[note.category.trim()] = (counts[note.category.trim()] || 0) + 1;
      }
    }
    return counts;
  }, [notes]);

  const currentBookNotesCount = useMemo(() => {
    if (selectedBook === 'All') {
      return notes.filter((n) => n.id !== '__SYSTEM_TAXONOMY__').length;
    }
    return notes.filter((n) => n.id !== '__SYSTEM_TAXONOMY__' && (n.book || 'ทั่วไป').trim() === selectedBook.trim()).length;
  }, [notes, selectedBook]);

  // Available categories for the currently active board: ONLY show categories that actually have items in this board
  const availableCategories = useMemo(() => {
    const sourceNotes = selectedBook === 'All' 
      ? notes.filter((n) => n.id !== '__SYSTEM_TAXONOMY__')
      : notes.filter((n) => n.id !== '__SYSTEM_TAXONOMY__' && (n.book || 'ทั่วไป').trim() === selectedBook.trim());

    const noteCategories = Array.from(new Set(
      sourceNotes
        .map((n) => (n.category || 'ทั่วไป').trim())
        .filter(Boolean)
    )).filter((c) => !deletedCategories.map((d) => d.trim()).includes(c));
    
    return noteCategories;
  }, [notes, selectedBook, deletedCategories]);

  // Reset category filter to 'All' when user switches boards
  const handleSelectBook = (book: string) => {
    setSelectedBook(book.trim());
    setSelectedCategory('All');
  };

  const handleAddBook = (newBookName: string) => {
    const trimmed = newBookName.trim();
    if (!trimmed) return;
    const updatedBoards = Array.from(new Set([...customBoards, trimmed]));
    setCustomBoards(updatedBoards);
    storageService.saveCustomBoards(updatedBoards);
    setDeletedBoards((prev) => prev.filter((b) => b.trim() !== trimmed));
    setSelectedBook(trimmed);
    setSelectedCategory('All');
    showToast(`เปิดบอร์ด "${trimmed}" แล้ว ☁️`);

    // Sync to Google Sheets immediately
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    if (targetUrl) {
      setSyncStatus('syncing');
      storageService.syncToGoogleSheets(targetUrl, notes, updatedBoards, customCategories)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  // 7. Board Management Handlers (Rename & Delete)
  const handleRenameBoard = (oldName: string, newName: string) => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === trimmedOld) return;

    const baseBoards = Array.from(new Set([...customBoards.map((b) => b.trim()), trimmedOld]));
    const updatedBoards = baseBoards.map((b) => (b === trimmedOld ? trimmedNew : b));
    setCustomBoards(updatedBoards);
    storageService.saveCustomBoards(updatedBoards);
    setDeletedBoards((prev) => [...prev.filter((b) => b.trim() !== trimmedNew), trimmedOld]);

    const updatedNotes = notes.map((n) => {
      const currentBook = (n.book || 'ทั่วไป').trim();
      if (currentBook === trimmedOld) {
        return { ...n, book: trimmedNew, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updatedNotes);
    storageService.saveNotes(updatedNotes);

    if (selectedBook.trim() === trimmedOld) {
      setSelectedBook(trimmedNew);
    }
    showToast(`เปลี่ยนชื่อบอร์ดเป็น "${trimmedNew}" แล้ว ☁️`);

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    if (targetUrl) {
      setSyncStatus('syncing');
      storageService.syncToGoogleSheets(targetUrl, updatedNotes, updatedBoards, customCategories)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  const handleDeleteBoard = (boardName: string) => {
    const trimmed = boardName.trim();
    if (trimmed === 'ทั่วไป') {
      showToast('ไม่สามารถลบบอร์ดทั่วไปได้');
      return;
    }

    const updatedDeleted = Array.from(new Set([...deletedBoards.map((b) => b.trim()), trimmed]));
    const updatedBoards = customBoards.filter((b) => b.trim() !== trimmed);
    setDeletedBoards(updatedDeleted);
    setCustomBoards(updatedBoards);
    storageService.saveCustomBoards(updatedBoards);

    // Reassign all notes in this board to 'ทั่วไป'
    const updatedNotes = notes.map((n) => {
      const currentBook = (n.book || 'ทั่วไป').trim();
      if (currentBook === trimmed) {
        return { ...n, book: 'ทั่วไป', updatedAt: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updatedNotes);
    storageService.saveNotes(updatedNotes);

    if (selectedBook.trim() === trimmed) {
      setSelectedBook('All');
    }
    showToast(`ลบบอร์ด "${trimmed}" แล้ว (ย้ายโน้ตไปบอร์ดทั่วไป) ☁️`);

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    if (targetUrl) {
      setSyncStatus('syncing');
      storageService.syncToGoogleSheets(targetUrl, updatedNotes, updatedBoards, customCategories)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  // 8. Category Management Handlers (Rename & Delete)
  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === trimmedOld) return;

    const baseCats = Array.from(new Set([...customCategories.map((c) => c.trim()), trimmedOld]));
    const updatedCats = baseCats.map((c) => (c === trimmedOld ? trimmedNew : c));
    setCustomCategories(updatedCats);
    storageService.saveCustomCategories(updatedCats);
    setDeletedCategories((prev) => [...prev.filter((c) => c.trim() !== trimmedNew), trimmedOld]);

    const updatedNotes = notes.map((n) => {
      if ((n.category || '').trim() === trimmedOld) {
        return { ...n, category: trimmedNew, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updatedNotes);
    storageService.saveNotes(updatedNotes);

    if (selectedCategory.trim() === trimmedOld) {
      setSelectedCategory(trimmedNew);
    }
    showToast(`เปลี่ยนชื่อหมวดหมู่เป็น "${trimmedNew}" แล้ว ☁️`);

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    if (targetUrl) {
      setSyncStatus('syncing');
      storageService.syncToGoogleSheets(targetUrl, updatedNotes, customBoards, updatedCats)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  const handleDeleteCategory = (catName: string) => {
    const updatedDeleted = Array.from(new Set([...deletedCategories, catName]));
    const updatedCats = customCategories.filter((c) => c !== catName);
    setDeletedCategories(updatedDeleted);
    setCustomCategories(updatedCats);
    storageService.saveCustomCategories(updatedCats);

    // Find fallback category for any notes in this category
    const remainingCats = allCategoriesGlobal.filter((c) => c !== catName);
    const fallbackCategory = remainingCats.length > 0 ? remainingCats[0] : 'ทั่วไป';

    const hasNotes = notes.some((n) => n.category === catName);
    let updatedNotes = notes;

    if (hasNotes) {
      updatedNotes = notes.map((n) => {
        if (n.category === catName) {
          return { ...n, category: fallbackCategory, updatedAt: new Date().toISOString() };
        }
        return n;
      });
      setNotes(updatedNotes);
    }

    if (selectedCategory === catName) {
      setSelectedCategory('All');
    }

    showToast(
      hasNotes
        ? `ลบหมวดหมู่ "${catName}" แล้ว (ย้ายโน้ตไปหมวด "${fallbackCategory}") ☁️`
        : `ลบหมวดหมู่ "${catName}" แล้ว ☁️`
    );

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    if (targetUrl) {
      setSyncStatus('syncing');
      storageService.syncToGoogleSheets(targetUrl, updatedNotes, customBoards, updatedCats)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  const handleAddCategoryGlobal = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    const updatedCats = Array.from(new Set([...customCategories, trimmed]));
    setCustomCategories(updatedCats);
    storageService.saveCustomCategories(updatedCats);
    setDeletedCategories((prev) => prev.filter((c) => c !== trimmed));
    setSelectedCategory(trimmed);
    showToast(`สร้างหมวดหมู่ "${trimmed}" แล้ว ☁️`);

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    if (targetUrl) {
      setSyncStatus('syncing');
      storageService.syncToGoogleSheets(targetUrl, notes, customBoards, updatedCats)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  // Category counts within current board view
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const sourceNotes = selectedBook === 'All' 
      ? notes.filter((n) => n.id !== '__SYSTEM_TAXONOMY__')
      : notes.filter((n) => n.id !== '__SYSTEM_TAXONOMY__' && (n.book || 'ทั่วไป').trim() === selectedBook.trim());
    
    for (const note of sourceNotes) {
      if (note.id === '__SYSTEM_TAXONOMY__') continue;
      const cat = (note.category || 'ทั่วไป').trim();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [notes, selectedBook]);

  // If the active category has 0 notes in the newly selected board, reset to 'All'
  useEffect(() => {
    if (selectedCategory !== 'All' && (!categoryCounts[selectedCategory] || categoryCounts[selectedCategory] === 0)) {
      setSelectedCategory('All');
    }
  }, [selectedCategory, categoryCounts]);

  // Filtered and Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Exclude system taxonomy record
        if (note.id === '__SYSTEM_TAXONOMY__') return false;

        // Board Filter
        if (selectedBook !== 'All') {
          const noteBook = (note.book || 'ทั่วไป').trim();
          if (noteBook !== selectedBook.trim()) return false;
        }

        // Category Filter
        if (selectedCategory !== 'All') {
          const noteCat = (note.category || 'ทั่วไป').trim();
          if (noteCat !== selectedCategory.trim()) return false;
        }

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchCategory = (note.category || '').toLowerCase().includes(q);
          const matchBook = (note.book || 'ทั่วไป').toLowerCase().includes(q);
          const matchTags = note.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchCategory && !matchBook && !matchTags) {
            return false;
          }
        }

        // Pinned Only
        if (showPinnedOnly && !note.isPinned) {
          return false;
        }

        // Completed Only
        if (showCompletedOnly && !note.isCompleted) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Respect Drag & Drop custom order
        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // Fallback to timestamp if order is identical
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [notes, searchQuery, selectedBook, selectedCategory, showPinnedOnly, showCompletedOnly]);

  // Compute Masonry Grid Columns dynamically (Responsive 1 to 4/5 columns matching viewport)
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    if (w < 1536) return 3;
    if (w < 1920) return 4;
    return 5;
  });

  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      if (w < 640) setColumnCount(1);
      else if (w < 1024) setColumnCount(2);
      else if (w < 1536) setColumnCount(3);
      else if (w < 1920) setColumnCount(4);
      else setColumnCount(5);
    };
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const columnNotes = useMemo(() => {
    const cols: PostItNote[][] = Array.from({ length: columnCount }, () => []);
    filteredNotes.forEach((note, index) => {
      cols[index % columnCount].push(note);
    });
    return cols;
  }, [filteredNotes, columnCount]);

  // Save Note Action
  const handleSaveNote = (noteData: Omit<PostItNote, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => {
    const now = new Date().toISOString();
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    const cleanBook = (noteData.book || 'ทั่วไป').trim();
    const cleanCategory = (noteData.category || 'ทั่วไป').trim();

    // If user explicitly created or assigned a category/book, remove from deleted list
    if (cleanCategory) {
      setDeletedCategories((prev) => prev.filter((c) => c.trim() !== cleanCategory));
    }
    if (cleanBook) {
      setDeletedBoards((prev) => prev.filter((b) => b.trim() !== cleanBook));
      if (cleanBook !== 'ทั่วไป' && !customBoards.map((b) => b.trim()).includes(cleanBook)) {
        const nextBoards = Array.from(new Set([...customBoards, cleanBook]));
        setCustomBoards(nextBoards);
        storageService.saveCustomBoards(nextBoards);
      }
    }

    if (id) {
      // Update
      const existing = notes.find((n) => n.id === id);
      const updated: PostItNote = {
        ...existing,
        ...noteData,
        book: cleanBook,
        category: cleanCategory,
        id,
        updatedAt: now,
        order: existing?.order !== undefined ? existing.order : 0,
        createdAt: existing?.createdAt || now,
      };

      const nextNotes = notes.map((n) => (n.id === id ? updated : n));
      setNotes(nextNotes);
      storageService.saveNotes(nextNotes);

      showToast('บันทึกการแก้ไขแล้ว');
      if (targetUrl) {
        setSyncStatus('syncing');
        storageService.apiUpdateNote(targetUrl, updated)
          .then(() => setSyncStatus('connected'))
          .catch(() => setSyncStatus('connected'));
      }
    } else {
      // Create
      const newNote: PostItNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...noteData,
        book: cleanBook,
        category: cleanCategory,
        order: 0,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => {
        const shifted = prev.map((n, idx) => ({
          ...n,
          order: idx + 1,
        }));
        const nextNotes = [newNote, ...shifted];
        storageService.saveNotes(nextNotes);
        return nextNotes;
      });
      showToast('สร้างโพสต์อิทแล้ว');
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.9 },
      });
      if (targetUrl) {
        setSyncStatus('syncing');
        storageService.apiCreateNote(targetUrl, newNote)
          .then(() => setSyncStatus('connected'))
          .catch(() => setSyncStatus('connected'));
      }
    }
  };

  // Drag Start Handler (Snapshots card rects once for ultra-fast collision detection)
  const handleStartDrag = (note: PostItNote, clientX: number, clientY: number, rect: DOMRect) => {
    const cardElements = document.querySelectorAll<HTMLElement>('[data-note-id]');
    const cardRects: { id: string; rect: DOMRect }[] = [];
    cardElements.forEach((el) => {
      const id = el.getAttribute('data-note-id');
      if (id && id !== note.id) {
        cardRects.push({ id, rect: el.getBoundingClientRect() });
      }
    });

    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    initialPosRef.current = { x: rect.left, y: rect.top };
    dragStateRef.current = {
      note,
      offsetX,
      offsetY,
      targetId: null,
      cardRects,
    };

    setActiveDragNote(note);
    setActiveDragWidth(rect.width);
    setDropTargetId(null);
  };

  // Reorder Handler (Persisted to LocalStorage and Synced to Google Sheets)
  const handleReorderNotes = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    setNotes((prevNotes) => {
      // Sort notes by current effective display order
      const sorted = [...prevNotes].sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        if (orderA !== orderB) return orderA - orderB;
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      const sourceIndex = sorted.findIndex((n) => n.id === sourceId);
      const targetIndex = sorted.findIndex((n) => n.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prevNotes;

      const updated = [...sorted];
      const [movedNote] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedNote);

      // Re-assign sequential order numbers
      const withNewOrder = updated.map((note, idx) => ({
        ...note,
        order: idx,
      }));

      // 1. Save to LocalStorage immediately
      storageService.saveNotes(withNewOrder);

      // 2. Sync to Google Sheets for cross-device consistency
      const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
      if (targetUrl) {
        setSyncStatus('syncing');
        storageService.syncToGoogleSheets(targetUrl, withNewOrder)
          .then(() => setSyncStatus('connected'))
          .catch((err) => {
            console.warn('Sync order failed:', err);
            setSyncStatus('connected');
          });
      }

      return withNewOrder;
    });

    showToast('จัดตำแหน่งการ์ดเรียบร้อย 📌');
  };

  const handleDeleteNote = async (id: string) => {
    const noteToDelete = notes.find((n) => n.id === id);
    const confirmed = await confirm({
      title: 'คุณต้องการลบการ์ดนี้',
      message: noteToDelete?.title
        ? `"${noteToDelete.title}"`
        : 'ข้อมูลจะถูกลบออกจากกระดานอย่างถาวรและไม่สามารถกู้คืนได้',
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      variant: 'danger',
    });

    if (!confirmed) return;

    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('ลบโพสต์อิทแล้ว');
    if (isModalOpen && editingNote?.id === id) {
      setIsModalOpen(false);
      setEditingNote(null);
    }
    if (targetUrl) {
      setSyncStatus('syncing');
      storageService.apiDeleteNote(targetUrl, id)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  const handleTogglePin = (id: string) => {
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const isPinned = !n.isPinned;
          showToast(isPinned ? 'ปักหมุดแล้ว' : 'ถอนหมุดแล้ว');
          return { ...n, isPinned };
        }
        return n;
      })
    );
    if (targetUrl) {
      storageService.apiTogglePin(targetUrl, id)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  const handleToggleComplete = (id: string) => {
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isCompleted: !n.isCompleted } : n))
    );
    if (targetUrl) {
      storageService.apiToggleComplete(targetUrl, id)
        .then(() => setSyncStatus('connected'))
        .catch(() => setSyncStatus('connected'));
    }
  };

  const handleEditNote = (note: PostItNote) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const realNotes = useMemo(() => notes.filter((n) => n.id !== '__SYSTEM_TAXONOMY__'), [notes]);

  const pinnedCount = useMemo(() => {
    const sourceNotes = selectedBook === 'All' 
      ? realNotes 
      : realNotes.filter((n) => (n.book || 'ทั่วไป').trim() === selectedBook.trim());
    return sourceNotes.filter((n) => n.isPinned).length;
  }, [realNotes, selectedBook]);

  return (
    <div className="min-h-screen bg-muji-grid flex flex-col selection:bg-[#EAE6DE] selection:text-[#2D2824]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] shadow-xl border border-black/10 dark:border-white/10 text-sm font-medium animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Dragged Card (Direct DOM transform at 120 FPS, zero lag) */}
      {activeDragNote && (
        <div
          ref={dragCardRef}
          className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform select-none"
          style={{
            width: `${activeDragWidth}px`,
            transform: `translate3d(${initialPosRef.current.x}px, ${initialPosRef.current.y}px, 0) scale(1.04) rotate(1.5deg)`,
            transition: 'none',
          }}
        >
          <div className="shadow-2xl rounded-3xl ring-2 ring-amber-500/50">
            <PostItCardPreview note={activeDragNote} />
          </div>
        </div>
      )}

      {/* Minimal Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewModal={() => {
          setEditingNote(null);
          setIsModalOpen(true);
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        totalNotes={realNotes.length}
        syncStatus={syncStatus}
        onSyncNow={handleSyncNow}
      />

      {/* Main Board Container (Widescreen fluid layout max-w-[1700px]) */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-7">
        
        {/* Level 1: Board Filter (บอร์ด) */}
        <BookFilter
          books={allBooks}
          selectedBook={selectedBook}
          onSelectBook={handleSelectBook}
          onAddBook={handleAddBook}
          onRenameBoard={handleRenameBoard}
          onDeleteBoard={handleDeleteBoard}
          onOpenManageModal={() => setIsManageModalOpen(true)}
          bookCounts={bookCounts}
          totalNotes={notes.length}
        />

        {/* Level 2: Category Filter & Breadcrumb (หมวดหมู่) */}
        <CategoryFilter
          selectedBook={selectedBook}
          categories={availableCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          showPinnedOnly={showPinnedOnly}
          onTogglePinnedOnly={() => setShowPinnedOnly(!showPinnedOnly)}
          showCompletedOnly={showCompletedOnly}
          onToggleCompletedOnly={() => setShowCompletedOnly(!showCompletedOnly)}
          categoryCounts={categoryCounts}
          totalNotes={currentBookNotesCount}
          filteredCount={filteredNotes.length}
          pinnedCount={pinnedCount}
        />

        {/* Level 3: Post-it Notes Masonry (Fluid vertical stacking with zero gaps) */}
        {filteredNotes.length > 0 ? (
          <div 
            className="grid gap-5 sm:gap-6 items-start"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {columnNotes.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-5 sm:gap-6">
                {col.map((note) => (
                  <PostItCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    onToggleComplete={handleToggleComplete}
                    onStartDrag={handleStartDrag}
                    isDraggingThis={activeDragNote?.id === note.id}
                    isDropTarget={dropTargetId === note.id}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="py-24 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#EFECE6] dark:bg-[#262322] text-[#8A857D] dark:text-[#8C8780] flex items-center justify-center mb-3.5 shadow-2xs">
              <StickyNote className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-[#2D2824] dark:text-[#ECE9E4] mb-1.5">
              ไม่พบโพสต์อิท
            </h3>
            <p className="text-sm text-[#8A857D] dark:text-[#8C8780] mb-6 leading-relaxed">
              {searchQuery
                ? `ไม่มีข้อความที่ตรงกับ "${searchQuery}"`
                : selectedBook !== 'All'
                ? `ยังไม่มีโน้ตในบอร์ด "${selectedBook}" เริ่มต้นสร้างโพสต์อิทแรกในบอร์ดนี้ได้เลย`
                : 'เริ่มต้นสร้างโพสต์อิทใหม่เพื่อบันทึกงาน ไอเดีย และสิ่งที่ต้องทำ'}
            </p>
            <button
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm sm:text-base font-semibold bg-[#2D2824] hover:bg-[#1C1816] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] dark:hover:bg-[#FFFFFF] transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
              <span>สร้างโพสต์อิท</span>
            </button>
          </div>
        )}

      </main>

      {/* Post-it Modal (Create/Edit) */}
      <PostItModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        editingNote={editingNote}
        categories={allCategoriesGlobal}
        books={allBooks}
        defaultBook={selectedBook !== 'All' ? selectedBook : 'ทั่วไป'}
      />

      {/* Manage Taxonomy Modal (Manage Boards & Categories) */}
      <ManageTaxonomyModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        books={allBooks}
        categories={allCategoriesGlobal}
        bookCounts={bookCounts}
        categoryCounts={globalCategoryCounts}
        onRenameBoard={handleRenameBoard}
        onDeleteBoard={handleDeleteBoard}
        onAddBoard={handleAddBook}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddCategory={handleAddCategoryGlobal}
      />

    </div>
  );
}

export default App;
