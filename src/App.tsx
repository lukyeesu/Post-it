import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PostItCard } from '@/components/PostItCard';
import { PostItModal } from '@/components/PostItModal';
import { PostItNote, GoogleSheetsConfig } from '@/types/post-it';
import { storageService } from '@/services/storageService';
import { Plus, StickyNote, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  // 1. Core State
  const [notes, setNotes] = useState<PostItNote[]>(() => storageService.getNotes());
  const [sheetsConfig] = useState<GoogleSheetsConfig>(() => storageService.getSheetsConfig());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('webapp_post_it_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 2. Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    }, 2200);
  };

  // Categories list calculation
  const allCategories = useMemo(() => {
    const defaultCats = ['Work', 'Ideas', 'Todo', 'Personal', 'Focus'];
    const customCats = notes
      .map((n) => n.category)
      .filter((c) => c && !defaultCats.includes(c));
    return Array.from(new Set([...defaultCats, ...customCats]));
  }, [notes]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      counts[note.category] = (counts[note.category] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // Filtered and Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchCategory = note.category.toLowerCase().includes(q);
          const matchTags = note.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchCategory && !matchTags) {
            return false;
          }
        }

        // Category Filter
        if (selectedCategory !== 'All' && note.category !== selectedCategory) {
          return false;
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
  }, [notes, searchQuery, selectedCategory, showPinnedOnly, showCompletedOnly]);

  // Actions
  const handleSaveNote = (noteData: Omit<PostItNote, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => {
    const now = new Date().toISOString();
    if (id) {
      // Update
      const updated = { ...noteData, id, updatedAt: now } as PostItNote;
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...noteData, updatedAt: now } : n))
      );
      showToast('บันทึกการแก้ไขแล้ว');
      if (sheetsConfig.webAppUrl) {
        storageService.apiUpdateNote(sheetsConfig.webAppUrl, updated).catch(console.error);
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
      if (sheetsConfig.webAppUrl) {
        storageService.apiCreateNote(sheetsConfig.webAppUrl, newNote).catch(console.error);
      }
    }
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('คุณต้องการลบโพสต์อิทนี้ใช่หรือไม่?')) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      showToast('ลบโพสต์อิทแล้ว');
      if (sheetsConfig.webAppUrl) {
        storageService.apiDeleteNote(sheetsConfig.webAppUrl, id).catch(console.error);
      }
    }
  };

  const handleTogglePin = (id: string) => {
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
    if (sheetsConfig.webAppUrl) {
      storageService.apiTogglePin(sheetsConfig.webAppUrl, id).catch(console.error);
    }
  };

  const handleToggleComplete = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isCompleted: !n.isCompleted } : n))
    );
    if (sheetsConfig.webAppUrl) {
      storageService.apiToggleComplete(sheetsConfig.webAppUrl, id).catch(console.error);
    }
  };

  const handleEditNote = (note: PostItNote) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const pinnedCount = useMemo(() => notes.filter((n) => n.isPinned).length, [notes]);

  return (
    <div className="min-h-screen bg-muji-grid flex flex-col selection:bg-[#EAE6DE] selection:text-[#2D2824]">
      
      {/* Toast Notification (Minimalist Muji Style) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] shadow-lg border border-black/10 dark:border-white/10 text-xs font-medium animate-slideUp">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
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
      />

      {/* Main Board Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Category Filter */}
        <CategoryFilter
          categories={allCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          showPinnedOnly={showPinnedOnly}
          onTogglePinnedOnly={() => setShowPinnedOnly(!showPinnedOnly)}
          showCompletedOnly={showCompletedOnly}
          onToggleCompletedOnly={() => setShowCompletedOnly(!showCompletedOnly)}
          categoryCounts={categoryCounts}
          totalNotes={notes.length}
          pinnedCount={pinnedCount}
        />

        {/* Post-it Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
            {filteredNotes.map((note) => (
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
        ) : (
          /* Clean Empty State */
          <div className="py-24 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] dark:bg-[#262322] text-[#8A857D] dark:text-[#8C8780] flex items-center justify-center mb-3">
              <StickyNote className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-semibold text-[#2D2824] dark:text-[#ECE9E4] mb-1">
              ไม่พบโพสต์อิท
            </h3>
            <p className="text-xs text-[#8A857D] dark:text-[#8C8780] mb-5 leading-relaxed">
              {searchQuery
                ? `ไม่มีข้อความที่ตรงกับ "${searchQuery}"`
                : 'เริ่มต้นสร้างโพสต์อิทใหม่เพื่อบันทึกงานและความคิด'}
            </p>
            <button
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#2D2824] hover:bg-[#1C1816] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] dark:hover:bg-[#FFFFFF] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
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
        categories={allCategories}
      />

    </div>
  );
}

export default App;
