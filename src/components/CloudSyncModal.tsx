import React, { useState } from 'react';
import { X, Cloud, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { DEFAULT_SHEETS_URL } from '@/services/storageService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  onSaveUrl: (newUrl: string) => void;
  syncStatus: 'idle' | 'syncing' | 'connected' | 'error';
  totalLocalNotes: number;
  onFetchFromSheets: () => void;
  onUploadToSheets: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  onSaveUrl,
  syncStatus,
  totalLocalNotes,
  onFetchFromSheets,
  onUploadToSheets,
}) => {
  const [urlInput, setUrlInput] = useState(webAppUrl || DEFAULT_SHEETS_URL);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (trimmed) {
      onSaveUrl(trimmed);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] dark:bg-[#201D1C] rounded-3xl shadow-2xl border border-[#E8E4DC] dark:border-[#363230] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E4DC] dark:border-[#363230] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <Cloud className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-lg font-bold text-[#2D2824] dark:text-[#ECE9E4]">
              เชื่อมต่อ Google Sheets API
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A857D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Connection Status Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#262322] border border-[#E8E4DC] dark:border-[#363230] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
              ) : syncStatus === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              <div>
                <p className="text-sm font-bold text-[#2D2824] dark:text-[#ECE9E4]">
                  {syncStatus === 'syncing'
                    ? 'กำลังเชื่อมต่อและซิงค์ข้อมูล...'
                    : syncStatus === 'error'
                    ? 'เชื่อมต่อไม่สำเร็จ'
                    : 'เชื่อมต่อ Google Sheets แล้ว'}
                </p>
                <p className="text-xs text-[#8A857D] dark:text-[#8C8780]">
                  ข้อมูลบนเครื่องปัจจุบัน: {totalLocalNotes} รายการ
                </p>
              </div>
            </div>

            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              syncStatus === 'syncing'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : syncStatus === 'error'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'error' ? 'Offline' : 'Connected'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onFetchFromSheets}
              disabled={syncStatus === 'syncing'}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-[#D4CEBF] dark:border-[#443F3B] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] text-xs sm:text-sm font-semibold text-[#2D2824] dark:text-[#ECE9E4] transition-colors"
            >
              <ArrowDownCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>ดึงข้อมูลจากชีต (Fetch)</span>
            </button>

            <button
              type="button"
              onClick={onUploadToSheets}
              disabled={syncStatus === 'syncing'}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-[#D4CEBF] dark:border-[#443F3B] hover:bg-[#EFECE6] dark:hover:bg-[#2A2725] text-xs sm:text-sm font-semibold text-[#2D2824] dark:text-[#ECE9E4] transition-colors"
            >
              <ArrowUpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ส่งข้อมูลขึ้นชีต (Upload)</span>
            </button>
          </div>

          {/* API URL Config */}
          <form onSubmit={handleSave} className="space-y-2 pt-2 border-t border-[#E8E4DC] dark:border-[#363230]">
            <label className="block text-xs font-semibold text-[#7A756E] dark:text-[#99948D]">
              Google Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E0DBD0] dark:border-[#363330] bg-white dark:bg-[#262322] text-[#2D2824] dark:text-[#ECE9E4] focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] text-xs font-semibold shrink-0"
              >
                {isSaved ? 'บันทึกแล้ว ✓' : 'บันทึก'}
              </button>
            </div>
            <p className="text-[11px] text-[#8A857D] dark:text-[#8C8780] leading-relaxed">
              API นี้เชื่อมต่อโดยตรงกับ Google Sheets เพื่อบันทึกข้อมูลโพสต์อิทแบบเรียลไทม์
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DC] dark:border-[#363230] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#2D2824] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A]"
          >
            เรียบร้อย
          </button>
        </div>
      </div>
    </div>
  );
};
