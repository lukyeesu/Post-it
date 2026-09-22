import React, { useState } from 'react';
import { X, LayoutGrid, Layers, Edit2, Trash2, Check, Plus } from 'lucide-react';

interface ManageTaxonomyModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: string[];
  categories: string[];
  bookCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  onRenameBoard: (oldName: string, newName: string) => void;
  onDeleteBoard: (boardName: string) => void;
  onAddBoard: (boardName: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (catName: string) => void;
  onAddCategory: (catName: string) => void;
}

export const ManageTaxonomyModal: React.FC<ManageTaxonomyModalProps> = ({
  isOpen,
  onClose,
  books,
  categories,
  bookCounts,
  categoryCounts,
  onRenameBoard,
  onDeleteBoard,
  onAddBoard,
  onRenameCategory,
  onDeleteCategory,
  onAddCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'boards' | 'categories'>('boards');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newBoardInput, setNewBoardInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');

  if (!isOpen) return null;

  const startEdit = (name: string) => {
    setEditingItem(name);
    setEditValue(name);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue('');
  };

  const saveBoardRename = (oldName: string) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== oldName) {
      onRenameBoard(oldName, trimmed);
    }
    cancelEdit();
  };

  const saveCategoryRename = (oldName: string) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== oldName) {
      onRenameCategory(oldName, trimmed);
    }
    cancelEdit();
  };

  const handleAddBoardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBoardInput.trim();
    if (trimmed) {
      onAddBoard(trimmed);
      setNewBoardInput('');
    }
  };

  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (trimmed) {
      onAddCategory(trimmed);
      setNewCatInput('');
    }
  };

  const handleDeleteBoardClick = (board: string) => {
    if (board === 'ทั่วไป') return;
    const count = bookCounts[board] || 0;
    const confirmMsg = count > 0
      ? `คุณต้องการลบบอร์ด "${board}" ใช่หรือไม่?\n\n* โน้ตในบอร์ดนี้ (${count} รายการ) จะถูกย้ายไปเก็บที่บอร์ด "ทั่วไป" อัตโนมัติ ไม่สูญหาย`
      : `คุณต้องการลบบอร์ด "${board}" ใช่หรือไม่?`;
    if (window.confirm(confirmMsg)) {
      onDeleteBoard(board);
      cancelEdit();
    }
  };

  const handleDeleteCategoryClick = (cat: string) => {
    const count = categoryCounts[cat] || 0;
    const confirmMsg = count > 0
      ? `คุณต้องการลบหมวดหมู่ "${cat}" ใช่หรือไม่?\n\n* โน้ตในหมวดหมู่นี้ (${count} รายการ) จะถูกย้ายไปที่หมวดหมู่อื่นอัตโนมัติ ไม่สูญหาย`
      : `คุณต้องการลบหมวดหมู่ "${cat}" ใช่หรือไม่?`;
    if (window.confirm(confirmMsg)) {
      onDeleteCategory(cat);
      cancelEdit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] dark:bg-[#201D1C] rounded-3xl shadow-2xl border border-[#E8E4DC] dark:border-[#363230] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E4DC] dark:border-[#363230] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2D2824] dark:text-[#ECE9E4]">
            จัดการบอร์ดและหมวดหมู่
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A857D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E8E4DC] dark:border-[#363230] bg-[#F5F2EB]/50 dark:bg-[#262322]/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('boards');
              cancelEdit();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'boards'
                ? 'border-[#2D2824] text-[#2D2824] dark:border-[#ECE9E4] dark:text-[#ECE9E4]'
                : 'border-transparent text-[#7A756E] dark:text-[#99948D] hover:text-[#2D2824]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>บอร์ดทั้งหมด ({books.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              cancelEdit();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'categories'
                ? 'border-[#2D2824] text-[#2D2824] dark:border-[#ECE9E4] dark:text-[#ECE9E4]'
                : 'border-transparent text-[#7A756E] dark:text-[#99948D] hover:text-[#2D2824]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>หมวดหมู่ทั้งหมด ({categories.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'boards' ? (
            <div>
              {/* Add New Board Form */}
              <form onSubmit={handleAddBoardSubmit} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newBoardInput}
                  onChange={(e) => setNewBoardInput(e.target.value)}
                  placeholder="เพิ่มชื่อบอร์ดใหม่..."
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E0DBD0] dark:border-[#363330] bg-white dark:bg-[#262322] text-sm text-[#2D2824] dark:text-[#ECE9E4] focus:outline-none focus:border-[#713F12]/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่ม</span>
                </button>
              </form>

              {/* Boards List */}
              <div className="space-y-2">
                {books.map((b) => {
                  const count = bookCounts[b] || 0;
                  const isEditing = editingItem === b;

                  return (
                    <div
                      key={b}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#262322] border border-[#E8E4DC] dark:border-[#363330] transition-all"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveBoardRename(b);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#D4CEBF] dark:border-[#443F3B] bg-white dark:bg-[#1E1B1A] text-sm text-[#2D2824] dark:text-[#ECE9E4] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveBoardRename(b)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            title="บันทึก"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg text-[#7A756E] hover:bg-black/5"
                            title="ยกเลิก"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="w-4 h-4 text-[#8A857D]" />
                          <span className="font-semibold text-sm text-[#2D2824] dark:text-[#ECE9E4]">
                            {b}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-[#F2EFE9] dark:bg-[#322F2D] text-[#7A756E] dark:text-[#99948D]">
                            {count} โน้ต
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(b)}
                            className="p-2 rounded-xl text-[#7A756E] hover:text-[#2D2824] hover:bg-[#F2EFE9] dark:hover:bg-[#322F2D] transition-colors"
                            title="แก้ไขชื่อบอร์ด"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBoardClick(b)}
                            disabled={b === 'ทั่วไป'}
                            className={`p-2 rounded-xl transition-colors ${
                              b === 'ทั่วไป'
                                ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                                : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            }`}
                            title={b === 'ทั่วไป' ? 'บอร์ดเริ่มต้นไม่สามารถลบได้' : 'ลบบอร์ด'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {/* Add New Category Form */}
              <form onSubmit={handleAddCatSubmit} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="เพิ่มชื่อหมวดหมู่ใหม่..."
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E0DBD0] dark:border-[#363330] bg-white dark:bg-[#262322] text-sm text-[#2D2824] dark:text-[#ECE9E4] focus:outline-none focus:border-[#713F12]/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่ม</span>
                </button>
              </form>

              {/* Categories List */}
              <div className="space-y-2">
                {categories.map((c) => {
                  const count = categoryCounts[c] || 0;
                  const isEditing = editingItem === c;

                  return (
                    <div
                      key={c}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#262322] border border-[#E8E4DC] dark:border-[#363330] transition-all"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveCategoryRename(c);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#D4CEBF] dark:border-[#443F3B] bg-white dark:bg-[#1E1B1A] text-sm text-[#2D2824] dark:text-[#ECE9E4] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveCategoryRename(c)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            title="บันทึก"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg text-[#7A756E] hover:bg-black/5"
                            title="ยกเลิก"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#8A857D]" />
                          <span className="font-semibold text-sm text-[#2D2824] dark:text-[#ECE9E4]">
                            {c}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-[#F2EFE9] dark:bg-[#322F2D] text-[#7A756E] dark:text-[#99948D]">
                            {count} โน้ต
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="p-2 rounded-xl text-[#7A756E] hover:text-[#2D2824] hover:bg-[#F2EFE9] dark:hover:bg-[#322F2D] transition-colors"
                            title="แก้ไขชื่อหมวดหมู่"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategoryClick(c)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="ลบหมวดหมู่"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DC] dark:border-[#363230] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A]"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
