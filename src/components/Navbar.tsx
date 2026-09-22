import React from 'react';
import { 
  Plus, 
  Moon, 
  Sun, 
  Search, 
  X
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Minimalist Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EFECE6] dark:bg-[#2A2725] border border-[#DDD8CE] dark:border-[#3E3A36] flex items-center justify-center text-[#2D2824] dark:text-[#ECE9E4] shadow-xs">
            <span className="text-base font-bold select-none">P</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-semibold tracking-tight text-[#2D2824] dark:text-[#ECE9E4]">
              Post-it
            </h1>
            <span className="text-xs text-[#8A857D] dark:text-[#8C8780] font-normal">
              {totalNotes} รายการ
            </span>
          </div>
        </div>

        {/* Minimal Search Bar */}
        <div className="flex-1 max-w-sm mx-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C968D] dark:text-[#7A756E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาโน้ต, หัวข้อ, หรือแท็ก..."
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-xl border border-[#E0DBD0] dark:border-[#363330] bg-[#F5F2EB]/60 dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] placeholder-[#A39E95] dark:placeholder-[#6B665F] focus:outline-none focus:border-[#713F12]/40 dark:focus:border-[#A39E95]/40 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9C968D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-[#6B665F] dark:text-[#A39E95] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] transition-colors"
            title={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#D4A373]" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* New Note Button */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-[#2D2824] hover:bg-[#1C1816] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] dark:hover:bg-[#FFFFFF] transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span className="hidden xs:inline">สร้างโน้ต</span>
          </button>
        </div>

      </div>
    </header>
  );
};
