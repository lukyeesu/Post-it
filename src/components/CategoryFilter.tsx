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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E4DC] dark:border-[#33312E] pb-3">
        
        {/* Category Tabs (Minimalist Muji Style) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onSelectCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              selectedCategory === 'All'
                ? 'bg-[#EAE6DE] text-[#2D2824] dark:bg-[#2C2927] dark:text-[#ECE9E4] font-semibold'
                : 'text-[#7A756E] dark:text-[#99948D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4]'
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
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-[#EAE6DE] text-[#2D2824] dark:bg-[#2C2927] dark:text-[#ECE9E4] font-semibold'
                    : 'text-[#7A756E] dark:text-[#99948D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4]'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[11px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onTogglePinnedOnly}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${
              showPinnedOnly
                ? 'bg-[#EAE6DE] text-[#2D2824] border-[#D4CEBF] dark:bg-[#2C2927] dark:text-[#ECE9E4] dark:border-[#443F3B]'
                : 'text-[#7A756E] dark:text-[#99948D] border-transparent hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${showPinnedOnly ? 'fill-current' : ''}`} />
            <span>ปักหมุด ({pinnedCount})</span>
          </button>

          <button
            onClick={onToggleCompletedOnly}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${
              showCompletedOnly
                ? 'bg-[#EAE6DE] text-[#2D2824] border-[#D4CEBF] dark:bg-[#2C2927] dark:text-[#ECE9E4] dark:border-[#443F3B]'
                : 'text-[#7A756E] dark:text-[#99948D] border-transparent hover:bg-[#F2EFE9] dark:hover:bg-[#262322]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>เสร็จแล้ว</span>
          </button>
        </div>

      </div>
    </div>
  );
};
