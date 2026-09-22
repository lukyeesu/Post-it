import React from 'react';
import { Pin, CheckCircle2, LayoutGrid, Layers, Edit2, Trash2 } from 'lucide-react';

interface CategoryFilterProps {
  selectedBook: string;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  onDeleteCategory?: (catName: string) => void;
  showPinnedOnly: boolean;
  onTogglePinnedOnly: () => void;
  showCompletedOnly: boolean;
  onToggleCompletedOnly: () => void;
  categoryCounts: Record<string, number>;
  totalNotes: number;
  filteredCount: number;
  pinnedCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedBook,
  categories,
  selectedCategory,
  onSelectCategory,
  onRenameCategory,
  onDeleteCategory,
  showPinnedOnly,
  onTogglePinnedOnly,
  showCompletedOnly,
  onToggleCompletedOnly,
  categoryCounts,
  totalNotes,
  filteredCount,
  pinnedCount,
}) => {
  const handleInlineRenameCategory = () => {
    if (selectedCategory === 'All') return;
    const newName = window.prompt(`แก้ไขชื่อหมวดหมู่ "${selectedCategory}" เป็น:`, selectedCategory);
    if (newName && newName.trim() && newName.trim() !== selectedCategory) {
      onRenameCategory?.(selectedCategory, newName.trim());
    }
  };

  const handleInlineDeleteCategory = () => {
    if (selectedCategory === 'All') return;
    if (window.confirm(`คุณต้องการลบหมวดหมู่ "${selectedCategory}" ใช่หรือไม่?\n(โน้ตในหมวดหมู่นี้จะถูกย้ายไปที่หมวดหมู่ "Ideas")`)) {
      onDeleteCategory?.(selectedCategory);
    }
  };

  return (
    <div className="w-full mb-6">
      {/* Breadcrumb Hierarchy Display: Board > Category > Count */}
      <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm font-medium text-[#7A756E] dark:text-[#99948D] mb-3 px-1">
        <span className="flex items-center gap-1.5 text-[#2D2824] dark:text-[#ECE9E4] font-semibold">
          <LayoutGrid className="w-3.5 h-3.5 text-[#8A857D]" />
          <span>{selectedBook === 'All' ? 'บอร์ดทั้งหมด' : selectedBook}</span>
        </span>
        
        <span className="text-zinc-400">›</span>
        
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[#2D2824] dark:text-[#ECE9E4] font-semibold">
            <Layers className="w-3.5 h-3.5 text-[#8A857D]" />
            <span>หมวดหมู่: {selectedCategory === 'All' ? 'ทั้งหมด' : selectedCategory}</span>
          </span>

          {/* Quick Actions for Selected Category */}
          {selectedCategory !== 'All' && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                type="button"
                onClick={handleInlineRenameCategory}
                className="p-1 rounded-md text-[#7A756E] hover:text-[#2D2824] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] transition-colors"
                title={`แก้ไขชื่อหมวดหมู่ ${selectedCategory}`}
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={handleInlineDeleteCategory}
                className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title={`ลบหมวดหมู่ ${selectedCategory}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <span className="text-zinc-400">›</span>

        <span className="text-[#8A857D] dark:text-[#8C8780]">
          {filteredCount} การ์ด
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-[#E8E4DC] dark:border-[#33312E] pb-4">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => onSelectCategory('All')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#EAE6DE] text-[#2D2824] dark:bg-[#2C2927] dark:text-[#ECE9E4] font-semibold shadow-2xs'
                : 'text-[#7A756E] dark:text-[#99948D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
            }`}
          >
            หมวดหมู่ทั้งหมด ({totalNotes})
          </button>

          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#EAE6DE] text-[#2D2824] dark:bg-[#2C2927] dark:text-[#ECE9E4] font-semibold shadow-2xs'
                    : 'text-[#7A756E] dark:text-[#99948D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
                }`}
              >
                <span>{cat}</span>
                <span className="text-xs opacity-65 font-normal">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Toggles: Pinned & Completed */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <button
            type="button"
            onClick={onTogglePinnedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-all ${
              showPinnedOnly
                ? 'bg-[#EAE6DE] text-[#2D2824] border-[#D4CEBF] dark:bg-[#2C2927] dark:text-[#ECE9E4] dark:border-[#443F3B] shadow-2xs'
                : 'text-[#7A756E] dark:text-[#99948D] border-[#E8E4DC]/60 dark:border-[#33312E]/60 hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${showPinnedOnly ? 'fill-current text-[#B45309] dark:text-[#D97706]' : ''}`} />
            <span>ปักหมุด ({pinnedCount})</span>
          </button>

          <button
            type="button"
            onClick={onToggleCompletedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-all ${
              showCompletedOnly
                ? 'bg-[#EAE6DE] text-[#2D2824] border-[#D4CEBF] dark:bg-[#2C2927] dark:text-[#ECE9E4] dark:border-[#443F3B] shadow-2xs'
                : 'text-[#7A756E] dark:text-[#99948D] border-[#E8E4DC]/60 dark:border-[#33312E]/60 hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${showCompletedOnly ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span>เสร็จแล้ว</span>
          </button>
        </div>

      </div>
    </div>
  );
};
