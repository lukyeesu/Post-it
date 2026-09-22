import React, { useState } from 'react';
import { 
  X, 
  Table, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft,
  Database
} from 'lucide-react';
import { GoogleSheetsConfig } from '@/types/post-it';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (cfg: GoogleSheetsConfig) => void;
  onPullFromSheets: () => Promise<void>;
  onPushToSheets: () => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onPullFromSheets,
  onPushToSheets,
}) => {
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync || false);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      webAppUrl: url.trim(),
      autoSync,
      lastSyncedAt: config.lastSyncedAt,
    });
    setStatus({ type: 'success', message: 'บันทึกการตั้งค่าแล้ว' });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handlePull = async () => {
    if (!url.trim()) {
      setStatus({ type: 'error', message: 'กรุณากรอก Web App URL ก่อนดึงข้อมูล' });
      return;
    }
    setStatus({ type: 'loading', message: 'กำลังดึงข้อมูลจาก Google Sheets...' });
    try {
      await onPullFromSheets();
      setStatus({ type: 'success', message: 'ดึงข้อมูลสำเร็จเรียบร้อย!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
      setStatus({ type: 'error', message: msg });
    }
  };

  const handlePush = async () => {
    if (!url.trim()) {
      setStatus({ type: 'error', message: 'กรุณากรอก Web App URL ก่อนส่งข้อมูล' });
      return;
    }
    setStatus({ type: 'loading', message: 'กำลังส่งข้อมูลขึ้น Google Sheets...' });
    try {
      await onPushToSheets();
      setStatus({ type: 'success', message: 'ส่งข้อมูลขึ้น Google Sheets สำเร็จเรียบร้อย!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล';
      setStatus({ type: 'error', message: msg });
    }
  };

  const handleCopyAppsScript = async () => {
    try {
      const scriptCode = `// Google Apps Script Backend for Webapp Post-it
const SHEET_NAME = 'PostIts';
const HEADERS = ['id', 'title', 'content', 'category', 'color', 'tags', 'isPinned', 'isCompleted', 'glowColor', 'createdAt', 'updatedAt'];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#FFF2B2');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse({ status: 'success', notes: [] });
    const notes = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      let tags = [];
      try { tags = row[5] ? JSON.parse(row[5]) : []; } catch(e) { tags = row[5] ? String(row[5]).split(',') : []; }
      notes.push({
        id: String(row[0]),
        title: String(row[1] || ''),
        content: String(row[2] || ''),
        category: String(row[3] || 'Ideas'),
        color: String(row[4] || 'yellow'),
        tags: Array.isArray(tags) ? tags : [],
        isPinned: Boolean(row[6]),
        isCompleted: Boolean(row[7]),
        glowColor: String(row[8] || 'blue'),
        createdAt: row[9] ? String(row[9]) : new Date().toISOString(),
        updatedAt: row[10] ? String(row[10]) : new Date().toISOString()
      });
    }
    return jsonResponse({ status: 'success', notes: notes });
  } catch(err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const contents = e.postData ? e.postData.contents : null;
    if (!contents) return jsonResponse({ status: 'error', message: 'No payload' });
    const payload = JSON.parse(contents);
    const sheet = getOrCreateSheet();
    if (payload.action === 'sync') {
      const notes = payload.notes || [];
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
      if (notes.length > 0) {
        const rows = notes.map(n => [
          n.id, n.title || '', n.content || '', n.category || 'Ideas', n.color || 'yellow',
          JSON.stringify(n.tags || []), Boolean(n.isPinned), Boolean(n.isCompleted),
          n.glowColor || 'blue', n.createdAt || new Date().toISOString(), n.updatedAt || new Date().toISOString()
        ]);
        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      }
      return jsonResponse({ status: 'success', message: \`Synced \${notes.length} notes\` });
    }
    return jsonResponse({ status: 'error', message: 'Unknown action' });
  } catch(err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;
      await navigator.clipboard.writeText(scriptCode);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                เชื่อมต่อฐานข้อมูล Google Sheets
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ซิงค์โพสต์อิทแบบ Real-time เก็บข้อมูลฟรี 100% บนคลาวด์ของคุณเอง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Status Message */}
          {status.message && (
            <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
              status.type === 'loading' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' :
              status.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
              status.type === 'error' ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' : ''
            }`}>
              {status.type === 'loading' && <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />}
              {status.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {status.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{status.message}</span>
            </div>
          )}

          {/* Web App URL Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Google Apps Script Web App URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              * ต้องเป็น URL ที่ลงท้ายด้วย <code>/exec</code> และ Deploy ให้สิทธิ์การเข้าถึงเป็น &quot;Anyone&quot;
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handlePull}
              disabled={status.type === 'loading'}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4 text-sky-500" />
              <span>ดึงข้อมูลจาก Sheets (Pull)</span>
            </button>

            <button
              onClick={handlePush}
              disabled={status.type === 'loading'}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>ส่งข้อมูลขึ้น Sheets (Push)</span>
            </button>
          </div>

          {/* Quick Setup Guide Accordion */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-500" />
                วิธีสร้าง Web App Script (ทำเพียงครั้งเดียว):
              </span>
              <button
                onClick={handleCopyAppsScript}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-200 font-medium"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด Code.gs'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 dark:text-zinc-400 pl-1 leading-relaxed">
              <li>เปิด <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-semibold inline-flex items-center gap-0.5">Google Sheets <ExternalLink className="w-3 h-3" /></a> ใหม่</li>
              <li>ไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong></li>
              <li>ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดจากปุ่ม &quot;คัดลอกโค้ด Code.gs&quot; ด้านบน</li>
              <li>กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy) &gt; การปรับใช้รายการใหม่ (New deployment)</strong></li>
              <li>เลือกประเภท: <strong>เว็บแอปพลิเคชัน (Web app)</strong></li>
              <li>ผู้มีสิทธิ์เข้าถึง (Who has access): เลือกเป็น <strong>ทุกคน (Anyone)</strong> (สำคัญมาก)</li>
              <li>กด Deploy แล้วคัดลอก URL ที่ลงท้ายด้วย <code>/exec</code> มาใส่ในช่องด้านบนได้เลย!</li>
            </ol>
          </div>

          {/* Database Comparison Advice */}
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
            <span className="font-bold">💡 คำแนะนำเรื่องฐานข้อมูล:</span>
            <p>
              • <strong>Google Sheets:</strong> เหมาะมากสำหรับการใช้งานส่วนตัว หรือทำงานร่วมกันกับทีม เพราะเปิดดู แก้ไข หรือ Export ข้อมูลเป็น Excel ได้ง่ายมาก โดยไม่มีค่าใช้จ่าย
            </p>
            <p>
              • <strong>LocalStorage (ปัจจุบัน):</strong> บันทึกบนเบราว์เซอร์ของคุณทันทีอัตโนมัติ รวดเร็ว และใช้งานออฟไลน์ได้ 100%
            </p>
            <p>
              • <strong>Supabase / Firebase:</strong> หากในอนาคตต้องการระบบ User Login หลายคน หรือ Real-time Sync มิลลิวินาที สามารถสลับไปใช้ Supabase ได้ทันที
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ปิด
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm"
          >
            บันทึกการตั้งค่า
          </button>
        </div>

      </div>
    </div>
  );
};
