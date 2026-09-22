import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PostItCard } from '@/components/PostItCard';
import { PostItModal } from '@/components/PostItModal';
import { GoogleSheetsModal } from '@/components/GoogleSheetsModal';
import { PostItNote, GoogleSheetsConfig } from '@/types/post-it';
import { storageService } from '@/services/storageService';
import { 
  Plus, 
  StickyNote, 
  Sparkles, 
  Database, 
  LayoutGrid, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  // 1. Core State
  const [notes, setNotes] = useState<PostItNote[]>(() => storageService.getNotes());
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => storageService.getSheetsConfig());
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
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
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

  // Categories list calculation
  const allCategories = useMemo(() => {
    const defaultCats = ['Work', 'Ideas', 'Todo', 'Personal', 'Urgent'];
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
      showToast('แก้ไขโพสต์อิทเรียบร้อยแล้ว ✨');
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
      showToast('สร้างโพสต์อิทใหม่เรียบร้อยแล้ว 📌');
      confetti({
        particleCount: 30,
        spread: 50,
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
      showToast('ลบโพสต์อิทเรียบร้อยแล้ว');
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
          showToast(isPinned ? 'ปักหมุดไว้ด้านบน 📌' : 'ถอนหมุดแล้ว');
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

  // Google Sheets Actions
  const handlePullFromSheets = async () => {
    if (!sheetsConfig.webAppUrl) throw new Error('ยังไม่ได้ตั้งค่า Google Sheets URL');
    const remoteNotes = await storageService.fetchFromGoogleSheets(sheetsConfig.webAppUrl);
    if (remoteNotes.length > 0) {
      setNotes(remoteNotes);
      showToast(`ดึงข้อมูลสำเร็จ ${remoteNotes.length} โพสต์อิท 🎉`);
    } else {
      showToast('ไม่พบข้อมูลใน Google Sheets หรือชีตว่างเปล่า');
    }
  };

  const handlePushToSheets = async () => {
    if (!sheetsConfig.webAppUrl) throw new Error('ยังไม่ได้ตั้งค่า Google Sheets URL');
    const result = await storageService.syncToGoogleSheets(sheetsConfig.webAppUrl, notes);
    showToast(result || 'ซิงค์ข้อมูลขึ้น Google Sheets สำเร็จ 🚀');
  };

  const handleSaveSheetsConfig = (cfg: GoogleSheetsConfig) => {
    setSheetsConfig(cfg);
    storageService.saveSheetsConfig(cfg);
    showToast('บันทึกการตั้งค่า Google Sheets แล้ว');
  };

  const handleExportBackup = () => {
    storageService.exportJSON(notes);
    showToast('ดาวน์โหลดไฟล์สำรองเรียบร้อย 📥');
  };

  const pinnedCount = useMemo(() => notes.filter((n) => n.isPinned).length, [notes]);

  return (
    <div className="min-h-screen bg-corkboard-pattern flex flex-col selection:bg-amber-300 selection:text-amber-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xl border border-zinc-700/50 dark:border-zinc-200 animate-slideUp text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewModal={() => {
          setEditingNote(null);
          setIsModalOpen(true);
        }}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        isSheetsConnected={Boolean(sheetsConfig.webAppUrl)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onExportBackup={handleExportBackup}
      />

      {/* Main Board Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Category Filter & Controls */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
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
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-inner">
              <StickyNote className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              ไม่พบโพสต์อิท
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              {searchQuery
                ? `ไม่พบโน้ตที่ตรงกับคำค้นหา "${searchQuery}"`
                : 'เริ่มแปะโพสต์อิทแรกของคุณเพื่อบันทึกงาน ไอเดีย หรือสิ่งที่ต้องทำ'}
            </p>
            <button
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-md transition-transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>สร้างโพสต์อิทใหม่</span>
            </button>
          </div>
        )}

        {/* 21st.dev Component Showcase Section */}
        <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  21st.dev Component Showcase
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                คอมโพเนนต์พิเศษที่ติดตั้งไว้ในโฟลเดอร์ <code>/components/ui</code> พร้อมเอฟเฟกต์แสงและมิติ 3D Foil
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              Active in UI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center p-6 rounded-3xl bg-zinc-900 text-white shadow-2xl">
            {/* Spotlight Glow Info */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                Component #1: spotlight-card.tsx
              </span>
              <h3 className="text-2xl font-bold">GlowCard with Dynamic Pointer Light</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                การ์ดที่มีเอฟเฟกต์ลำแสง Spotlight เคลื่อนไหวตามเคอร์เซอร์เมาส์แบบเรียลไทม์ พร้อมขอบกระจกสะท้อนเรืองแสง ปรับแต่งสี Glow Color ได้หลากหลาย
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleSaveNote({
                      title: 'งานด่วน Spotlight Glow 💡',
                      content: 'ตัวอย่างโพสต์อิทสไตล์ Spotlight Glow จาก 21st.dev สวยงามสะดุดตา!',
                      category: 'Work',
                      color: 'spotlight',
                      glowColor: 'blue',
                      tags: ['Spotlight', 'Demo'],
                      isPinned: true,
                    });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  + สร้างโน้ตสไตล์ Spotlight
                </button>
              </div>
            </div>

            {/* Holographic Foil Info */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                Component #2: holographic-foil-card.tsx
              </span>
              <h3 className="text-2xl font-bold">Holographic 3D Foil Card</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                การ์ดโฮโลแกรม 3 มิติ ใช้ Framer-motion คำนวณมุมหมุน (Perspective Rotate & Spring Physics) และการสะท้อนแสงฟอยล์สมจริง เหมาะสำหรับโน้ต VIP
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    handleSaveNote({
                      title: 'Holographic Rare Post-it 🌟',
                      content: 'โน้ตระดับ VIP สุดพิเศษที่มีแสงฟอยล์เคลื่อนไหว 3 มิติตามเมาส์!',
                      category: 'Urgent',
                      color: 'holographic',
                      tags: ['VIP', 'Holo'],
                      isPinned: true,
                    });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition-colors"
                >
                  + สร้างโน้ตสไตล์ Holographic
                </button>
              </div>
            </div>
          </div>
        </section>

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

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetsConfig}
        onSaveConfig={handleSaveSheetsConfig}
        onPullFromSheets={handlePullFromSheets}
        onPushToSheets={handlePushToSheets}
      />

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 mt-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Webapp Post-it • Built with React, Vite, TypeScript & Tailwind CSS</span>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/lukyeesu/Post-it" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              GitHub Repository
            </a>
            <span>•</span>
            <button 
              onClick={() => setIsSheetsModalOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Google Sheets Sync Setup
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
