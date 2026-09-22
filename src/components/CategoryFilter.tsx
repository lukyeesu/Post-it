import React from 'react';
import { Pin, CheckCircle, Tag, Sparkles } from 'lucide-react';
import { NoteCategory } from '@/types/post-it';

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
    <div className="w-full mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onSelectCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedCategory === 'All'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
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
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-amber-950 font-semibold shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat === 'Urgent' && <Sparkles className="w-3.5 h-3.5 text-rose-500" />}
                {cat === 'Work' && <Tag className="w-3.5 h-3.5 text-blue-500" />}
                {cat === 'Ideas' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected 
                    ? 'bg-amber-500/30 text-amber-950' 
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onTogglePinnedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-all ${
              showPinnedOnly
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${showPinnedOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>ปักหมุด ({pinnedCount})</span>
          </button>

          <button
            onClick={onToggleCompletedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-all ${
              showCompletedOnly
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CheckCircle className={`w-3.5 h-3.5 ${showCompletedOnly ? 'text-emerald-500' : ''}`} />
            <span>เสร็จแล้ว</span>
          </button>
        </div>

      </div>
    </div>
  );
};
