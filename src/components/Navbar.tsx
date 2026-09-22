import React from 'react';
import { 
  Plus, 
  Moon, 
  Sun, 
  Search, 
  X,
  StickyNote
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  totalNotes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNewModal,
  darkMode,
  onToggleDarkMode,
  totalNotes,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF8F5]/90 dark:bg-[#1D1B1A]/90 border-b border-[#E8E4DC] dark:border-[#33312E] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* Brand & Logo (Enhanced proportions) */}
        <div className="flex items-center gap-3.5 cursor-pointer select-none">
          <div className="w-10 h-10 rounded-xl bg-[#EFECE6] dark:bg-[#2A2725] border border-[#DDD8CE] dark:border-[#3E3A36] flex items-center justify-center text-[#2D2824] dark:text-[#ECE9E4] shadow-xs">
            <StickyNote className="w-5 h-5 stroke-[2] fill-amber-300/30" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#2D2824] dark:text-[#ECE9E4] leading-tight">
              Post-it
            </h1>
            <span className="text-xs sm:text-sm text-[#8A857D] dark:text-[#8C8780] font-medium">
              {totalNotes} รายการ
            </span>
          </div>
        </div>

        {/* Search Bar (Spacious and readable) */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9C968D] dark:text-[#7A756E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาโน้ต, หัวข้อ, หรือแท็ก..."
              className="w-full pl-10 pr-9 py-2.5 text-sm sm:text-base rounded-2xl border border-[#E0DBD0] dark:border-[#363330] bg-[#F5F2EB]/80 dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] placeholder-[#A39E95] dark:placeholder-[#6B665F] focus:outline-none focus:border-[#713F12]/50 dark:focus:border-[#A39E95]/50 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9C968D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4]"
                title="ล้างข้อความค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Actions (Comfortable Touch Targets) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-2xl text-[#6B665F] dark:text-[#A39E95] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] border border-transparent hover:border-[#E0DBD0] dark:hover:border-[#363330] transition-colors"
            title={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          >
            {darkMode ? <Sun className="w-5 h-5 text-[#D4A373]" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* New Note Button (Larger & Satisfying) */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-sm sm:text-base font-semibold bg-[#2D2824] hover:bg-[#1C1816] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] dark:hover:bg-[#FFFFFF] transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>สร้างโน้ต</span>
          </button>
        </div>

      </div>
    </header>
  );
};
