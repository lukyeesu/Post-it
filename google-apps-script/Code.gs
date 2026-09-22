/**
 * Google Apps Script Backend for Webapp Post-it
 * Deploy as Web App:
 * 1. Open your Google Sheet
 * 2. Click Extensions > Apps Script
 * 3. Paste this code into Code.gs
 * 4. Click "Deploy" > "New deployment"
 * 5. Select type: "Web app"
 * 6. Set Description: "Post-it API"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone" (สำคัญมากเพื่อให้ Webapp ยิงเชื่อมต่อได้)
 * 9. Click "Deploy" และคัดลอก "Web app URL" มาวางใน Webapp Post-it ได้เลย!
 */

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

// GET: อ่านรายการ Post-it ทั้งหมด
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return jsonResponse({ status: 'success', notes: [] });
    }

    const headers = data[0];
    const notes = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // ข้ามแถวว่าง

      let tags = [];
      try {
        tags = row[5] ? JSON.parse(row[5]) : [];
      } catch (err) {
        tags = row[5] ? String(row[5]).split(',').map(s => s.trim()) : [];
      }

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

    return jsonResponse({ status: 'success', count: notes.length, notes: notes });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// POST: บันทึก ซิงค์ หรืออัปเดตข้อมูล
function doPost(e) {
  try {
    const contents = e.postData ? e.postData.contents : null;
    if (!contents) {
      return jsonResponse({ status: 'error', message: 'No payload received' });
    }

    const payload = JSON.parse(contents);
    const action = payload.action || 'sync';
    const sheet = getOrCreateSheet();

    if (action === 'sync') {
      // ทำการซิงค์แบบแทนที่ทั้งหมด (Full Sync)
      const notes = payload.notes || [];
      
      // ล้างข้อมูลเดิม (ยกเว้น Header)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }

      // บันทึกแถวใหม่ทั้งหมด
      if (notes.length > 0) {
        const rows = notes.map(note => [
          note.id,
          note.title || '',
          note.content || '',
          note.category || 'Ideas',
          note.color || 'yellow',
          JSON.stringify(note.tags || []),
          Boolean(note.isPinned),
          Boolean(note.isCompleted),
          note.glowColor || 'blue',
          note.createdAt || new Date().toISOString(),
          note.updatedAt || new Date().toISOString()
        ]);
        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      }

      return jsonResponse({ status: 'success', message: `Synced ${notes.length} notes successfully!` });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
