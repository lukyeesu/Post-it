import React, { useState, useEffect } from 'react';
import { X, Pin, Tag } from 'lucide-react';
import { PostItNote, NoteColor } from '@/types/post-it';

interface PostItModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<PostItNote, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  editingNote?: PostItNote | null;
  categories: string[];
}

const mujiColorOptions: { id: NoteColor; name: string; bgClass: string; dotClass: string }[] = [
  { id: 'sand', name: 'กระดาษธรรมชาติ', bgClass: 'bg-[#FAF8F4] border-[#E6E0D4] text-[#2D2824]', dotClass: 'bg-[#EAE6DE]' },
  { id: 'kraft', name: 'กระดาษคราฟท์', bgClass: 'bg-[#F3EADB] border-[#DFD3BE] text-[#2E271F]', dotClass: 'bg-[#D1C3B2]' },
  { id: 'sage', name: 'เขียวมัทฉะ', bgClass: 'bg-[#EEF3ED] border-[#D9E3D7] text-[#242F26]', dotClass: 'bg-[#B6C7B9]' },
  { id: 'sky', name: 'ฟ้าน้ำทะเลอ่อน', bgClass: 'bg-[#EEF3F7] border-[#D8E3EB] text-[#202B33]', dotClass: 'bg-[#B7C7D4]' },
  { id: 'clay', name: 'ดินเผาพาสเทล', bgClass: 'bg-[#F7EBE8] border-[#EAD5D0] text-[#332220]', dotClass: 'bg-[#D4BCB8]' },
  { id: 'ochre', name: 'ส้มมัสตาร์ด', bgClass: 'bg-[#FAF2DF] border-[#EDDFC0] text-[#332917]', dotClass: 'bg-[#D1C3A3]' },
  { id: 'charcoal', name: 'เทาชาร์โคล', bgClass: 'bg-[#2D2926] border-[#443E3B] text-[#FAF8F5]', dotClass: 'bg-[#1D1B1A]' },
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
  const [color, setColor] = useState<NoteColor>('sand');
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setCategory(editingNote.category);
      setCustomCategory('');
      setColor(editingNote.color || 'sand');
      setTagInput((editingNote.tags || []).join(', '));
      setIsPinned(Boolean(editingNote.isPinned));
    } else {
      setTitle('');
      setContent('');
      setCategory('Ideas');
      setCustomCategory('');
      setColor('sand');
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
      },
      editingNote?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-[#FAF8F5] dark:bg-[#201D1C] rounded-3xl shadow-2xl border border-[#E8E4DC] dark:border-[#363230] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-[#E8E4DC] dark:border-[#363230] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2D2824] dark:text-[#ECE9E4]">
            {editingNote ? 'แก้ไขโพสต์อิท' : 'สร้างโพสต์อิทใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A857D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#7A756E] dark:text-[#99948D] mb-2">
              หัวข้อโน้ต
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ซื้อของเข้าออฟฟิศ, แผนงานประจำสัปดาห์..."
              className="w-full px-4 py-3 text-base rounded-2xl border border-[#E0DBD0] dark:border-[#363330] bg-white dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] placeholder-[#A39E95] dark:placeholder-[#6B665F] focus:outline-none focus:border-[#713F12]/50 dark:focus:border-[#A39E95]/50 transition-all shadow-2xs"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#7A756E] dark:text-[#99948D] mb-2">
              เนื้อหาโพสต์อิท
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="พิมพ์ข้อความที่ต้องการจดจำ..."
              className="w-full px-4 py-3 text-base sm:text-lg rounded-2xl border border-[#E0DBD0] dark:border-[#363330] bg-white dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] placeholder-[#A39E95] dark:placeholder-[#6B665F] focus:outline-none focus:border-[#713F12]/50 dark:focus:border-[#A39E95]/50 transition-all leading-relaxed shadow-2xs"
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#7A756E] dark:text-[#99948D] mb-2">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#E0DBD0] dark:border-[#363330] bg-white dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] text-sm sm:text-base focus:outline-none focus:border-[#713F12]/50 shadow-2xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="custom">+ เพิ่มหมวดหมู่ใหม่...</option>
              </select>
            </div>

            {category === 'custom' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#7A756E] dark:text-[#99948D] mb-2">
                  ชื่อหมวดหมู่ใหม่
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="เช่น Marketing, Home..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#E0DBD0] dark:border-[#363330] bg-white dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] text-sm sm:text-base focus:outline-none focus:border-[#713F12]/50 shadow-2xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#7A756E] dark:text-[#99948D] mb-2">
                แท็ก (คั่นด้วยจุลภาค)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-[#9C968D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="work, urgent, sprint"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E0DBD0] dark:border-[#363330] bg-white dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] text-sm sm:text-base focus:outline-none focus:border-[#713F12]/50 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Color Selection (Muji Palette) */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#7A756E] dark:text-[#99948D] mb-2.5">
              โทนสีกระดาษ (Muji Tone)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {mujiColorOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setColor(opt.id)}
                  className={`px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-medium border flex items-center gap-2.5 transition-all ${
                    color === opt.id
                      ? 'ring-2 ring-[#2D2824] dark:ring-[#ECE9E4] font-semibold scale-102 shadow-xs'
                      : 'hover:border-[#9C968D]'
                  } ${opt.bgClass}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${opt.dotClass} shadow-2xs`} />
                  <span className="truncate">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pin Option */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-sm font-medium text-[#2D2824] dark:text-[#ECE9E4] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4.5 h-4.5 rounded-md text-[#2D2824] border-[#D4CEBF] focus:ring-0 cursor-pointer"
              />
              <Pin className="w-4 h-4 text-[#B45309]" />
              <span>ปักหมุดโพสต์อิทนี้ไว้ด้านบนสุด</span>
            </label>
          </div>

          {/* Modal Footer (Larger buttons) */}
          <div className="pt-5 border-t border-[#E8E4DC] dark:border-[#363230] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-sm sm:text-base font-medium text-[#7A756E] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl text-sm sm:text-base font-semibold bg-[#2D2824] hover:bg-[#1C1816] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] dark:hover:bg-[#FFFFFF] transition-all shadow-sm active:scale-95"
            >
              {editingNote ? 'บันทึกการแก้ไข' : 'สร้างโพสต์อิท'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
