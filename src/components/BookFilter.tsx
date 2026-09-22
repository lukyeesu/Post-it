import React, { useState } from 'react';
import { LayoutGrid, Plus, X } from 'lucide-react';

interface BookFilterProps {
  books: string[];
  selectedBook: string;
  onSelectBook: (book: string) => void;
  onAddBook: (newBook: string) => void;
  bookCounts: Record<string, number>;
  totalNotes: number;
}

export const BookFilter: React.FC<BookFilterProps> = ({
  books,
  selectedBook,
  onSelectBook,
  onAddBook,
  bookCounts,
  totalNotes,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newBookName, setNewBookName] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBookName.trim();
    if (trimmed) {
      onAddBook(trimmed);
      setNewBookName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full mb-5">
      {/* Board Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
          {/* Label */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#7A756E] dark:text-[#99948D] mr-1 shrink-0">
            <LayoutGrid className="w-4 h-4 text-[#8A857D]" />
            <span>บอร์ด:</span>
          </div>

          {/* "All Boards" Tab */}
          <button
            type="button"
            onClick={() => onSelectBook('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedBook === 'All'
                ? 'bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] shadow-xs'
                : 'bg-[#EFECE6] dark:bg-[#262322] text-[#59544D] dark:text-[#C4C0B8] hover:bg-[#E5DFD5] dark:hover:bg-[#322F2D]'
            }`}
          >
            <span>บอร์ดทั้งหมด</span>
            <span className="opacity-70 text-xs font-normal">({totalNotes})</span>
          </button>

          {/* Board Tabs */}
          {books.map((book) => {
            const isSelected = selectedBook === book;
            const count = bookCounts[book] || 0;
            return (
              <button
                key={book}
                type="button"
                onClick={() => onSelectBook(book)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] shadow-xs'
                    : 'bg-[#EFECE6] dark:bg-[#262322] text-[#59544D] dark:text-[#C4C0B8] hover:bg-[#E5DFD5] dark:hover:bg-[#322F2D]'
                }`}
              >
                <span>{book}</span>
                <span className="opacity-70 text-xs font-normal">({count})</span>
              </button>
            );
          })}

          {/* Add Board Button or Inline Input */}
          {isAdding ? (
            <form onSubmit={handleAddSubmit} className="flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                autoFocus
                value={newBookName}
                onChange={(e) => setNewBookName(e.target.value)}
                placeholder="ชื่อบอร์ดใหม่..."
                className="px-3 py-1 text-xs sm:text-sm rounded-xl border border-[#D4CEBF] dark:border-[#443F3B] bg-white dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] focus:outline-none w-32 sm:w-40"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-xl bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] text-xs font-semibold hover:opacity-90"
              >
                เพิ่ม
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-xl text-[#7A756E] hover:text-[#2D2824] dark:hover:text-[#ECE9E4]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#7A756E] dark:text-[#99948D] hover:bg-[#EFECE6] dark:hover:bg-[#262322] border border-dashed border-[#D4CEBF] dark:border-[#443F3B] flex items-center gap-1 shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มบอร์ด</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
