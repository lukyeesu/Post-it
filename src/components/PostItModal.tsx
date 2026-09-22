import React, { useState, useEffect } from 'react';
import { X, Sparkles, Pin, Tag, Palette } from 'lucide-react';
import { PostItNote, NoteColor } from '@/types/post-it';

interface PostItModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<PostItNote, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  editingNote?: PostItNote | null;
  categories: string[];
}

const colorOptions: { id: NoteColor; name: string; bgClass: string }[] = [
  { id: 'yellow', name: 'เหลืองคลาสสิก', bgClass: 'bg-amber-200' },
  { id: 'green', name: 'เขียวมิ้นต์', bgClass: 'bg-emerald-200' },
  { id: 'blue', name: 'ฟ้าพาสเทล', bgClass: 'bg-sky-200' },
  { id: 'purple', name: 'ม่วงลาเวนเดอร์', bgClass: 'bg-purple-200' },
  { id: 'pink', name: 'ชมพูคอรัล', bgClass: 'bg-rose-200' },
  { id: 'orange', name: 'ส้มอบอุ่น', bgClass: 'bg-orange-200' },
  { id: 'spotlight', name: '21st Spotlight Glow', bgClass: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' },
  { id: 'holographic', name: '21st Holographic Foil', bgClass: 'bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-400 text-black' },
];

export const PostItModal: React.FC<PostItModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingNote,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Ideas');
  const [customCategory, setCustomCategory] = useState('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const [glowColor, setGlowColor] = useState<'blue' | 'purple' | 'green' | 'red' | 'orange'>('purple');
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setCategory(editingNote.category);
      setCustomCategory('');
      setColor(editingNote.color);
      setGlowColor(editingNote.glowColor || 'purple');
      setTagInput((editingNote.tags || []).join(', '));
      setIsPinned(Boolean(editingNote.isPinned));
    } else {
      setTitle('');
      setContent('');
      setCategory('Ideas');
      setCustomCategory('');
      setColor('yellow');
      setGlowColor('purple');
      setTagInput('');
      setIsPinned(false);
    }
  }, [editingNote, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const finalCategory = customCategory.trim() ? customCategory.trim() : category;
    const tags = tagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave(
      {
        title: title.trim() || 'ไม่มีหัวข้อ',
        content: content.trim(),
        category: finalCategory,
        color,
        tags,
        isPinned,
        glowColor: color === 'spotlight' ? glowColor : undefined,
      },
      editingNote?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {editingNote ? 'แก้ไขโพสต์อิท' : 'สร้างโพสต์อิทใหม่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              หัวข้อโน้ต
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น นัดประชุมโปรเจกต์ใหม่..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              ข้อความในโพสต์อิท
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="พิมพ์ข้อความที่นี่ (สามารถกดปุ่ม Copy จากการ์ดเพื่อคัดลอกได้ทันที)..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 font-handwriting text-xl leading-snug"
            />
          </div>

          {/* Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="custom">+ หมวดหมู่ใหม่...</option>
              </select>
            </div>

            {category === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  ชื่อหมวดหมู่ใหม่
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="เช่น Marketing, Study..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                แท็ก (คั่นด้วยจุลภาค)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="work, urgent, sprint1"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
            </div>
          </div>

          {/* Color & Theme Style */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>สไตล์และสีการ์ด (รองรับ 21st.dev Effects)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setColor(opt.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    color === opt.id
                      ? 'ring-2 ring-amber-500 border-transparent shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  } ${opt.bgClass}`}
                >
                  <span className="block truncate font-semibold">{opt.name}</span>
                </button>
              ))}
            </div>

            {/* Spotlight Glow Color Options */}
            {color === 'spotlight' && (
              <div className="mt-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs font-semibold block mb-1.5 text-zinc-700 dark:text-zinc-300">
                  สีกระทบแสง Spotlight Glow:
                </span>
                <div className="flex gap-2">
                  {(['purple', 'blue', 'green', 'red', 'orange'] as const).map((gc) => (
                    <button
                      key={gc}
                      type="button"
                      onClick={() => setGlowColor(gc)}
                      className={`px-2.5 py-1 rounded-lg text-xs capitalize font-medium border ${
                        glowColor === gc
                          ? 'border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold'
                          : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {gc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pin Option */}
          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <Pin className="w-4 h-4 text-amber-500" />
              <span>ปักหมุดโพสต์อิทนี้ไว้ด้านบนสุด</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-amber-950 shadow-md shadow-amber-400/20"
            >
              {editingNote ? 'บันทึกการแก้ไข' : 'สร้างโพสต์อิท'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
