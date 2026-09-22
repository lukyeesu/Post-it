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
  Database,
  Activity,
  Code2
} from 'lucide-react';
import { GoogleSheetsConfig } from '@/types/post-it';
import { storageService } from '@/services/storageService';

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

  const handlePing = async () => {
    if (!url.trim()) {
      setStatus({ type: 'error', message: 'กรุณากรอก Web App URL ก่อนทดสอบ' });
      return;
    }
    setStatus({ type: 'loading', message: 'กำลังทดสอบเชื่อมต่อ API (Ping)...' });
    try {
      const ok = await storageService.pingGoogleSheets(url.trim());
      if (ok) {
        setStatus({ type: 'success', message: 'เชื่อมต่อ Google Apps Script API สำเร็จ 100%! 🚀' });
      } else {
        setStatus({ type: 'error', message: 'ไม่สามารถติดต่อ API ได้ ตรวจสอบ URL หรือสิทธิ์เข้าถึง (ต้องเป็น Anyone)' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setStatus({ type: 'error', message: msg });
    }
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
      const scriptCode = `/**
 * Webapp Post-it Backend API (Google Apps Script + Google Sheets)
 */
const SHEET_NAME = 'PostIts';
const HEADERS = ['id', 'title', 'content', 'category', 'color', 'tags', 'isPinned', 'isCompleted', 'glowColor', 'createdAt', 'updatedAt'];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold').setBackground('#FEF08A').setFontColor('#713F12');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'getNotes';
    if (action === 'ping') {
      return jsonResponse({ status: 'success', message: 'API is live', timestamp: new Date().toISOString() });
    }
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse({ status: 'success', count: 0, notes: [] });
    const notes = [];
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      if (!r[0]) continue;
      let tags = [];
      try { tags = r[5] ? JSON.parse(r[5]) : []; } catch(err) { tags = r[5] ? String(r[5]).split(',') : []; }
      notes.push({
        id: String(r[0]), title: String(r[1] || ''), content: String(r[2] || ''),
        category: String(r[3] || 'Ideas'), color: String(r[4] || 'yellow'),
        tags: Array.isArray(tags) ? tags : [], isPinned: Boolean(r[6]), isCompleted: Boolean(r[7]),
        glowColor: String(r[8] || 'purple'), createdAt: r[9] || new Date().toISOString(), updatedAt: r[10] || new Date().toISOString()
      });
    }
    return jsonResponse({ status: 'success', count: notes.length, notes: notes });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) return jsonResponse({ status: 'error', message: 'Server busy' });
    const contents = e && e.postData ? e.postData.contents : null;
    if (!contents) return jsonResponse({ status: 'error', message: 'No payload' });
    const payload = JSON.parse(contents);
    const action = payload.action || 'sync';
    const sheet = getOrCreateSheet();
    const now = new Date().toISOString();

    if (action === 'create') {
      const n = payload.note;
      const noteId = n.id || ('note-' + new Date().getTime());
      sheet.appendRow([noteId, n.title || '', n.content || '', n.category || 'Ideas', n.color || 'yellow', JSON.stringify(n.tags || []), Boolean(n.isPinned), Boolean(n.isCompleted), n.glowColor || 'purple', n.createdAt || now, n.updatedAt || now]);
      return jsonResponse({ status: 'success', message: 'Created', note: { ...n, id: noteId } });
    }

    if (action === 'update') {
      const n = payload.note;
      const targetId = (n && n.id) || payload.id;
      const data = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(targetId)) { rowIndex = i + 1; break; }
      }
      if (rowIndex === -1) return jsonResponse({ status: 'error', message: 'Not found' });
      const old = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([[targetId, n.title !== undefined ? n.title : old[1], n.content !== undefined ? n.content : old[2], n.category !== undefined ? n.category : old[3], n.color !== undefined ? n.color : old[4], n.tags !== undefined ? JSON.stringify(n.tags) : old[5], n.isPinned !== undefined ? Boolean(n.isPinned) : old[6], n.isCompleted !== undefined ? Boolean(n.isCompleted) : old[7], n.glowColor !== undefined ? n.glowColor : old[8], old[9] || now, now]]);
      return jsonResponse({ status: 'success', message: 'Updated', id: targetId });
    }

    if (action === 'delete') {
      const targetId = payload.id;
      const data = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(targetId)) { sheet.deleteRow(i + 1); return jsonResponse({ status: 'success', message: 'Deleted' }); }
      }
      return jsonResponse({ status: 'error', message: 'Not found' });
    }

    if (action === 'sync') {
      const notes = payload.notes || [];
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
      if (notes.length > 0) {
        const rows = notes.map(n => [n.id, n.title || '', n.content || '', n.category || 'Ideas', n.color || 'yellow', JSON.stringify(n.tags || []), Boolean(n.isPinned), Boolean(n.isCompleted), n.glowColor || 'purple', n.createdAt || now, n.updatedAt || now]);
        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      }
      return jsonResponse({ status: 'success', message: \`Synced \${notes.length} notes\` });
    }
    return jsonResponse({ status: 'error', message: 'Unknown action' });
  } catch(err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
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
                เชื่อมต่อฐานข้อมูล Google Sheets API
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Google Apps Script Backend API • อ่าน/เขียน/ลบ ข้อมูล Real-time ฟรีตลอดชีพ
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Google Apps Script Web App URL
              </label>
              <button
                type="button"
                onClick={handlePing}
                disabled={status.type === 'loading' || !url.trim()}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ทดสอบเชื่อมต่อ (Ping)</span>
              </button>
            </div>
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
                วิธีติดตั้ง Google Apps Script Backend (ทำเพียงครั้งเดียว):
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
              <li>กด Deploy แล้วคัดลอก URL ที่ลงท้ายด้วย <code>/exec</code> มาใส่ในช่องด้านบน แล้วกดทดสอบ (Ping) ได้เลย!</li>
            </ol>
          </div>

          {/* API Endpoints Info */}
          <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs space-y-2">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-500" />
              API Endpoints ที่พร้อมใช้งานใน Code.gs:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <div><code>GET ?action=getNotes</code> : อ่านโน้ตทั้งหมด</div>
              <div><code>GET ?action=ping</code> : ตรวจสอบสถานะ API</div>
              <div><code>POST action=create</code> : เพิ่มโพสต์อิทใหม่</div>
              <div><code>POST action=update</code> : แก้ไขข้อมูลโพสต์อิท</div>
              <div><code>POST action=delete</code> : ลบโพสต์อิทตาม ID</div>
              <div><code>POST action=sync</code> : ซิงค์ข้อมูลทั้งหมด</div>
            </div>
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
