import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { BookFilter } from '@/components/BookFilter';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PostItCard } from '@/components/PostItCard';
import { PostItModal } from '@/components/PostItModal';
import { ManageTaxonomyModal } from '@/components/ManageTaxonomyModal';
import { PostItNote, GoogleSheetsConfig } from '@/types/post-it';
import { storageService, DEFAULT_SHEETS_URL } from '@/services/storageService';
import { Plus, StickyNote, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
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

  // 2. Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PostItNote | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        const remoteNotes = await storageService.fetchFromGoogleSheets(targetUrl);
        if (!isMounted) return;

        if (Array.isArray(remoteNotes)) {
          setNotes(remoteNotes);
          storageService.saveNotes(remoteNotes);
          setSyncStatus('connected');
          if (remoteNotes.length > 0) {
            showToast(`เชื่อมต่อ Google Sheets แล้ว (พบข้อมูล ${remoteNotes.length} รายการ) ☁️`);
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
      const remoteNotes = await storageService.fetchFromGoogleSheets(targetUrl);
      if (Array.isArray(remoteNotes) && remoteNotes.length > 0) {
        setNotes(remoteNotes);
        storageService.saveNotes(remoteNotes);
        setSyncStatus('connected');
        showToast(`ซิงค์ข้อมูลสำเร็จ (${remoteNotes.length} รายการ) ☁️`);
      } else {
        setSyncStatus('connected');
        showToast('ซิงค์ข้อมูลเรียบร้อย (ไม่พบรายการใหม่)');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
      showToast('ซิงค์ไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อ');
    }
  };

  // 5. Boards calculation (e.g. กีฬา, งาน, ทั่วไป)
  const allBooks = useMemo(() => {
    const defaults = ['กีฬา', 'งาน', 'ทั่วไป'];
    const custom = notes
      .map((n) => n.book || 'ทั่วไป')
      .filter((b) => b && !defaults.includes(b));
    return Array.from(new Set([...defaults, ...custom]));
  }, [notes]);

  const bookCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      const b = note.book || 'ทั่วไป';
      counts[b] = (counts[b] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // 6. Categories list calculation: dynamically derived from DB notes
  const allCategoriesGlobal = useMemo(() => {
    const defaultCats = ['Work', 'Ideas', 'Todo', 'Personal'];
    const custom = notes.map((n) => n.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...custom]));
  }, [notes]);

  const availableCategories = useMemo(() => {
    const sourceNotes = selectedBook === 'All' 
      ? notes 
      : notes.filter((n) => (n.book || 'ทั่วไป') === selectedBook);
    
    const catsFromNotes = sourceNotes.map((n) => n.category).filter(Boolean);
    const combined = Array.from(new Set(catsFromNotes));
    
    if (combined.length === 0) {
      return ['Work', 'Ideas', 'Todo', 'Personal'];
    }
    return combined;
  }, [notes, selectedBook]);

  // Reset category filter to 'All' when user switches boards
  const handleSelectBook = (book: string) => {
    setSelectedBook(book);
    setSelectedCategory('All');
  };

  const handleAddBook = (newBookName: string) => {
    setSelectedBook(newBookName);
    setSelectedCategory('All');
    showToast(`เปิดบอร์ด "${newBookName}" แล้ว`);
  };

  // 7. Board Management Handlers (Rename & Delete)
  const handleRenameBoard = (oldName: string, newName: string) => {
    const updatedNotes = notes.map((n) => {
      const currentBook = n.book || 'ทั่วไป';
      if (currentBook === oldName) {
        return { ...n, book: newName, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updatedNotes);
    if (selectedBook === oldName) {
      setSelectedBook(newName);
    }
    showToast(`เปลี่ยนชื่อบอร์ดเป็น "${newName}" แล้ว`);

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    setSyncStatus('syncing');
    storageService.syncToGoogleSheets(targetUrl, updatedNotes)
      .then(() => setSyncStatus('connected'))
      .catch(() => setSyncStatus('connected'));
  };

  const handleDeleteBoard = (boardName: string) => {
    if (boardName === 'ทั่วไป') {
      showToast('ไม่สามารถลบบอร์ดทั่วไปได้');
      return;
    }
    // Reassign all notes in this board to 'ทั่วไป'
    const updatedNotes = notes.map((n) => {
      const currentBook = n.book || 'ทั่วไป';
      if (currentBook === boardName) {
        return { ...n, book: 'ทั่วไป', updatedAt: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updatedNotes);
    if (selectedBook === boardName) {
      setSelectedBook('All');
    }
    showToast(`ลบบอร์ด "${boardName}" แล้ว (ย้ายโน้ตไปบอร์ดทั่วไป)`);

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    setSyncStatus('syncing');
    storageService.syncToGoogleSheets(targetUrl, updatedNotes)
      .then(() => setSyncStatus('connected'))
      .catch(() => setSyncStatus('connected'));
  };

  // 8. Category Management Handlers (Rename & Delete)
  const handleRenameCategory = (oldName: string, newName: string) => {
    const updatedNotes = notes.map((n) => {
      if (n.category === oldName) {
        return { ...n, category: newName, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updatedNotes);
    if (selectedCategory === oldName) {
      setSelectedCategory(newName);
    }
    showToast(`เปลี่ยนชื่อหมวดหมู่เป็น "${newName}" แล้ว`);

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    setSyncStatus('syncing');
    storageService.syncToGoogleSheets(targetUrl, updatedNotes)
      .then(() => setSyncStatus('connected'))
      .catch(() => setSyncStatus('connected'));
  };

  const handleDeleteCategory = (catName: string) => {
    // Reassign all notes in this category to 'Ideas'
    const updatedNotes = notes.map((n) => {
      if (n.category === catName) {
        return { ...n, category: 'Ideas', updatedAt: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updatedNotes);
    if (selectedCategory === catName) {
      setSelectedCategory('All');
    }
    showToast(`ลบหมวดหมู่ "${catName}" แล้ว (ย้ายโน้ตไป Ideas)`);

    // Sync with Google Sheets
    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
    setSyncStatus('syncing');
    storageService.syncToGoogleSheets(targetUrl, updatedNotes)
      .then(() => setSyncStatus('connected'))
      .catch(() => setSyncStatus('connected'));
  };

  const handleAddCategoryGlobal = (newCat: string) => {
    setSelectedCategory(newCat);
    showToast(`สร้างหมวดหมู่ "${newCat}" แล้ว`);
  };

  // Category counts within current board view
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const sourceNotes = selectedBook === 'All' 
      ? notes 
      : notes.filter((n) => (n.book || 'ทั่วไป') === selectedBook);
    
    for (const note of sourceNotes) {
      counts[note.category] = (counts[note.category] || 0) + 1;
    }
    return counts;
  }, [notes, selectedBook]);

  // Filtered and Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Board Filter
        if (selectedBook !== 'All') {
          const noteBook = note.book || 'ทั่วไป';
          if (noteBook !== selectedBook) return false;
        }

        // Category Filter
        if (selectedCategory !== 'All' && note.category !== selectedCategory) {
          return false;
        }

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchCategory = note.category.toLowerCase().includes(q);
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
        // Pinned notes first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Newest updated / created first
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [notes, searchQuery, selectedBook, selectedCategory, showPinnedOnly, showCompletedOnly]);

  // Responsive Masonry column count matching Tailwind breakpoints
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window === 'undefined') return 5;
    const w = window.innerWidth;
    if (w >= 1536) return 5;
    if (w >= 1280) return 4;
    if (w >= 768) return 3;
    if (w >= 640) return 2;
    return 1;
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      let c = 1;
      if (w >= 1536) c = 5;
      else if (w >= 1280) c = 4;
      else if (w >= 768) c = 3;
      else if (w >= 640) c = 2;
      setColumnCount((prev) => (prev !== c ? c : prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Distribute notes into columns for Masonry layout (eliminating vertical empty gaps)
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

    if (id) {
      // Update
      const updated = { ...noteData, id, updatedAt: now } as PostItNote;
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...noteData, updatedAt: now } : n))
      );
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
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
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

  const handleDeleteNote = (id: string) => {
    if (window.confirm('คุณต้องการลบโพสต์อิทนี้ใช่หรือไม่?')) {
      const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_URL;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      showToast('ลบโพสต์อิทแล้ว');
      if (targetUrl) {
        setSyncStatus('syncing');
        storageService.apiDeleteNote(targetUrl, id)
          .then(() => setSyncStatus('connected'))
          .catch(() => setSyncStatus('connected'));
      }
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

  const currentBookNotesCount = useMemo(() => {
    if (selectedBook === 'All') return notes.length;
    return notes.filter((n) => (n.book || 'ทั่วไป') === selectedBook).length;
  }, [notes, selectedBook]);

  const pinnedCount = useMemo(() => {
    const sourceNotes = selectedBook === 'All' 
      ? notes 
      : notes.filter((n) => (n.book || 'ทั่วไป') === selectedBook);
    return sourceNotes.filter((n) => n.isPinned).length;
  }, [notes, selectedBook]);

  return (
    <div className="min-h-screen bg-muji-grid flex flex-col selection:bg-[#EAE6DE] selection:text-[#2D2824]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] shadow-xl border border-black/10 dark:border-white/10 text-sm font-medium animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 stroke-[2.5]" />
          <span>{toastMessage}</span>
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
        totalNotes={notes.length}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6 items-start">
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
        editingNote={editingNote}
        categories={availableCategories}
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
        categoryCounts={categoryCounts}
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
