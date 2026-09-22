import React from 'react';
import { Pin, CheckCircle2 } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  showPinnedOnly: boolean;
  onTogglePinnedOnly: () => void;
  showCompletedOnly: boolean;
  onToggleCompletedOnly: () => void;
  categoryCounts: Record<string, number>;
  totalNotes: number;
  pinnedCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  showPinnedOnly,
  onTogglePinnedOnly,
  showCompletedOnly,
  onToggleCompletedOnly,
  categoryCounts,
  totalNotes,
  pinnedCount,
}) => {
  return (
    <div className="w-full mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-[#E8E4DC] dark:border-[#33312E] pb-4">
        
        {/* Category Tabs (Larger & More Readable) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => onSelectCategory('All')}
            className={`px-4 py-2 rounded-xl text-sm sm:text-base font-medium transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#EAE6DE] text-[#2D2824] dark:bg-[#2C2927] dark:text-[#ECE9E4] font-semibold shadow-xs'
                : 'text-[#7A756E] dark:text-[#99948D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
            }`}
          >
            ทั้งหมด ({totalNotes})
          </button>

          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-medium flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-[#EAE6DE] text-[#2D2824] dark:bg-[#2C2927] dark:text-[#ECE9E4] font-semibold shadow-xs'
                    : 'text-[#7A756E] dark:text-[#99948D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
                }`}
              >
                <span>{cat}</span>
                <span className="text-xs sm:text-sm opacity-65 font-normal">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Toggles (Enlarged and touch-friendly) */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <button
            onClick={onTogglePinnedOnly}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium border transition-all ${
              showPinnedOnly
                ? 'bg-[#EAE6DE] text-[#2D2824] border-[#D4CEBF] dark:bg-[#2C2927] dark:text-[#ECE9E4] dark:border-[#443F3B] shadow-2xs'
                : 'text-[#7A756E] dark:text-[#99948D] border-[#E8E4DC]/60 dark:border-[#33312E]/60 hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
            }`}
          >
            <Pin className={`w-4 h-4 ${showPinnedOnly ? 'fill-current text-[#B45309] dark:text-[#D97706]' : ''}`} />
            <span>ปักหมุด ({pinnedCount})</span>
          </button>

          <button
            onClick={onToggleCompletedOnly}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium border transition-all ${
              showCompletedOnly
                ? 'bg-[#EAE6DE] text-[#2D2824] border-[#D4CEBF] dark:bg-[#2C2927] dark:text-[#ECE9E4] dark:border-[#443F3B] shadow-2xs'
                : 'text-[#7A756E] dark:text-[#99948D] border-[#E8E4DC]/60 dark:border-[#33312E]/60 hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${showCompletedOnly ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span>เสร็จแล้ว</span>
          </button>
        </div>

      </div>
    </div>
  );
};
