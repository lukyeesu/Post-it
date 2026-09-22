/**
 * =========================================================================
 * 📌 Webapp Post-it Backend API (Google Apps Script + Google Sheets)
 * =========================================================================
 * ทำหน้าที่เป็น RESTful / Action-based JSON API เชื่อมต่อกับ Google Sheets
 * รองรับการทำงาน CRUD ครบวงจร:
 *  - อ่านข้อมูลทั้งหมด (Get All Notes)
 *  - ค้นหา/อ่านรายตัว (Get Single Note)
 *  - เพิ่มโพสต์อิทใหม่ (Create Note)
 *  - แก้ไขโพสต์อิท (Update Note)
 *  - ลบโพสต์อิท (Delete Note)
 *  - ปักหมุด / ทำเสร็จ (Toggle Pin / Complete)
 *  - ซิงค์แบบชุดข้อมูล (Bulk Sync)
 * พร้อมระบบป้องกันการเขียนทับซ้อน (Concurrency LockService)
 * 
 * -------------------------------------------------------------------------
 * 🚀 ขั้นตอนการติดตั้งและการ Deploy ให้เป็น Web App API:
 * -------------------------------------------------------------------------
 * 1. เปิด Google Sheets ใหม่ (หรือที่ต้องการใช้เป็น Database)
 * 2. ไปที่เมนู "ส่วนขยาย (Extensions)" > "Apps Script"
 * 3. ลบโค้ดเดิมใน Code.gs ทั้งหมด แล้ววางโค้ดชุดนี้ลงไป
 * 4. (ทางเลือก) กดเลือกฟังก์ชัน "setupSheet" ด้านบนแล้วกด "เรียกใช้ (Run)" 
 *    เพื่อสร้างชีต PostIts และฟอร์แมตหัวตารางทันที
 * 5. กดปุ่มสีน้ำเงินขวาบน "ทำให้ใช้งานได้ (Deploy)" > "การปรับใช้รายการใหม่ (New deployment)"
 * 6. เลือกประเภทรูปเฟือง: "เว็บแอปพลิเคชัน (Web app)"
 *    - คำอธิบาย (Description): Post-it Backend API v1
 *    - ดำเนินการในฐานะ (Execute as): "ฉัน (Me)"
 *    - ผู้มีสิทธิ์เข้าถึง (Who has access): "ทุกคน (Anyone)"  <--- **สำคัญที่สุด**
 * 7. กด "ทำให้ใช้งานได้ (Deploy)" ให้สิทธิ์ (Authorize access) 
 * 8. คัดลอก "URL เว็บแอปพลิเคชัน" (ลงท้ายด้วย /exec) นำไปใส่ใน Webapp Post-it
 * =========================================================================
 */

const SHEET_NAME = 'PostIts';
const HEADERS = [
  'id',          // A: รหัสอ้างอิงโน้ต (unique ID)
  'title',       // B: หัวข้อโน้ต
  'content',     // C: เนื้อหาโพสต์อิท
  'category',    // D: หมวดหมู่ (Work, Ideas, Todo, Personal, Urgent ฯลฯ)
  'color',       // E: สีของการ์ด (yellow, green, blue, purple, pink, orange, spotlight, holographic)
  'tags',        // F: แท็ก (เก็บเป็น JSON string หรือ comma-separated)
  'isPinned',    // G: สถานะปักหมุด (TRUE / FALSE)
  'isCompleted', // H: สถานะทำเสร็จ (TRUE / FALSE)
  'glowColor',   // I: สีแสง Glow ของ Spotlight card
  'createdAt',   // J: วันเวลาที่สร้าง (ISO Date string)
  'updatedAt'    // K: วันเวลาที่แก้ไขล่าสุด (ISO Date string)
];

/**
 * ฟังก์ชันสร้างหรือดึงชีตสำหรับเก็บ Post-it พร้อมจัดรูปแบบตารางอัตโนมัติ
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // เพิ่มแถวหัวตาราง
    sheet.appendRow(HEADERS);
    
    // จัดสไตล์หัวตารางให้สวยงามน่าใช้งาน
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold')
      .setBackground('#FEF08A') // สีเหลือง Pastel สไตล์ Post-it
      .setFontColor('#713F12')
      .setHorizontalAlignment('center')
      .setBorder(true, true, true, true, true, true, '#CA8A04', SpreadsheetApp.BorderStyle.SOLID);
    
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 35);
    sheet.setColumnWidth(1, 130); // id
    sheet.setColumnWidth(2, 220); // title
    sheet.setColumnWidth(3, 350); // content
    sheet.setColumnWidth(4, 130); // category
    sheet.setColumnWidth(5, 120); // color
    sheet.setColumnWidth(6, 180); // tags
    sheet.setColumnWidth(7, 90);  // isPinned
    sheet.setColumnWidth(8, 100); // isCompleted
    sheet.setColumnWidth(9, 100); // glowColor
    sheet.setColumnWidth(10, 190); // createdAt
    sheet.setColumnWidth(11, 190); // updatedAt
  }
  
  return sheet;
}

/**
 * ฟังก์ชันสำหรับทดสอบรันในโปรแกรมแก้ไข Apps Script โดยตรง
 */
function setupSheet() {
  const sheet = getOrCreateSheet();
  Logger.log('Setup sheet completed successfully: ' + sheet.getName());
}

/**
 * =========================================================================
 * 📥 GET: รองรับการดึงข้อมูลผ่าน HTTP GET
 * =========================================================================
 * Query Parameters:
 *   ?action=getNotes (default) -> ดึงโน้ตทั้งหมด
 *   ?action=getNote&id=xxx     -> ดึงโน้ตตาม id
 *   ?action=ping               -> ทดสอบการเชื่อมต่อ API
 */
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'getNotes';

    // 1. Health Check / Ping
    if (action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'Post-it Google Sheets API is running perfectly!',
        timestamp: new Date().toISOString()
      });
    }

    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    // กรณีไม่มีข้อมูล (มีแค่แถวหัวตาราง)
    if (data.length <= 1) {
      return jsonResponse({ status: 'success', count: 0, notes: [] });
    }

    const allNotes = parseRowsToNotes(data.slice(1));

    // 2. ดึงโน้ตตัวเดียวตาม ID
    if (action === 'getNote') {
      const id = params.id;
      if (!id) {
        return jsonResponse({ status: 'error', message: 'Missing "id" parameter' }, 400);
      }
      const found = allNotes.find(n => n.id === id);
      if (!found) {
        return jsonResponse({ status: 'error', message: `Note with id "${id}" not found` }, 404);
      }
      return jsonResponse({ status: 'success', note: found });
    }

    // 3. ดึงโน้ตทั้งหมด (เรียงตามปักหมุด และวันเวลาอัปเดตล่าสุด)
    allNotes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    return jsonResponse({
      status: 'success',
      count: allNotes.length,
      notes: allNotes
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'doGet Exception: ' + err.toString()
    });
  }
}

/**
 * =========================================================================
 * 📤 POST: รองรับการ Create, Update, Delete, Toggle และ Sync ข้อมูล
 * =========================================================================
 * Payload format (JSON string):
 *   { action: 'create', note: { ... } }
 *   { action: 'update', note: { id: '...', ... } }
 *   { action: 'delete', id: '...' }
 *   { action: 'togglePin', id: '...' }
 *   { action: 'toggleComplete', id: '...' }
 *   { action: 'sync', notes: [ ... ] }
 */
function doPost(e) {
  // ระบบ Lock ป้องกันการเขียนข้อมูลชนกันในกรณีมี Request เข้ามาพร้อมกัน
  const lock = LockService.getScriptLock();
  
  try {
    // พยายามขอล็อค 10 วินาที
    if (!lock.tryLock(10000)) {
      return jsonResponse({
        status: 'error',
        message: 'Server is currently busy, please retry in a moment.'
      });
    }

    const contents = e && e.postData ? e.postData.contents : null;
    if (!contents) {
      return jsonResponse({ status: 'error', message: 'No payload received' });
    }

    let payload;
    try {
      payload = JSON.parse(contents);
    } catch (parseErr) {
      return jsonResponse({ status: 'error', message: 'Invalid JSON payload: ' + parseErr.toString() });
    }

    const action = payload.action || 'sync';
    const sheet = getOrCreateSheet();
    const now = new Date().toISOString();

    // -------------------------------------------------------------------
    // ACTION 1: สร้างโน้ตใหม่ (CREATE)
    // -------------------------------------------------------------------
    if (action === 'create') {
      const note = payload.note;
      if (!note) {
        return jsonResponse({ status: 'error', message: 'Missing note payload' });
      }

      const noteId = note.id || ('note-' + new Date().getTime() + '-' + Math.random().toString(36).substring(2, 6));
      const rowData = [
        noteId,
        note.title || 'ไม่มีหัวข้อ',
        note.content || '',
        note.category || 'Ideas',
        note.color || 'yellow',
        JSON.stringify(note.tags || []),
        Boolean(note.isPinned),
        Boolean(note.isCompleted),
        note.glowColor || 'purple',
        note.createdAt || now,
        note.updatedAt || now
      ];

      sheet.appendRow(rowData);

      return jsonResponse({
        status: 'success',
        message: 'สร้างโพสต์อิทลง Google Sheet เรียบร้อยแล้ว',
        note: {
          id: noteId,
          title: rowData[1],
          content: rowData[2],
          category: rowData[3],
          color: rowData[4],
          tags: note.tags || [],
          isPinned: rowData[6],
          isCompleted: rowData[7],
          glowColor: rowData[8],
          createdAt: rowData[9],
          updatedAt: rowData[10]
        }
      });
    }

    // -------------------------------------------------------------------
    // ACTION 2: แก้ไขโน้ตเดิม (UPDATE)
    // -------------------------------------------------------------------
    if (action === 'update') {
      const note = payload.note;
      const targetId = (note && note.id) || payload.id;
      if (!targetId) {
        return jsonResponse({ status: 'error', message: 'Missing note ID for update' });
      }

      const rowIndex = findRowIndexById(sheet, targetId);
      if (rowIndex === -1) {
        return jsonResponse({ status: 'error', message: `Note ID "${targetId}" not found in sheet` });
      }

      const existingValues = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
      const updatedRow = [
        targetId,
        note.title !== undefined ? note.title : existingValues[1],
        note.content !== undefined ? note.content : existingValues[2],
        note.category !== undefined ? note.category : existingValues[3],
        note.color !== undefined ? note.color : existingValues[4],
        note.tags !== undefined ? JSON.stringify(note.tags) : existingValues[5],
        note.isPinned !== undefined ? Boolean(note.isPinned) : existingValues[6],
        note.isCompleted !== undefined ? Boolean(note.isCompleted) : existingValues[7],
        note.glowColor !== undefined ? note.glowColor : existingValues[8],
        existingValues[9] || now, // รักษา createdAt เดิม
        now                       // อัปเดต updatedAt ใหม่
      ];

      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([updatedRow]);

      return jsonResponse({
        status: 'success',
        message: 'แก้ไขโพสต์อิทบน Google Sheet สำเร็จ',
        id: targetId
      });
    }

    // -------------------------------------------------------------------
    // ACTION 3: ลบโน้ต (DELETE)
    // -------------------------------------------------------------------
    if (action === 'delete') {
      const targetId = payload.id;
      if (!targetId) {
        return jsonResponse({ status: 'error', message: 'Missing note ID for deletion' });
      }

      const rowIndex = findRowIndexById(sheet, targetId);
      if (rowIndex === -1) {
        return jsonResponse({ status: 'error', message: `Note ID "${targetId}" not found in sheet` });
      }

      sheet.deleteRow(rowIndex);

      return jsonResponse({
        status: 'success',
        message: `ลบโพสต์อิทรหัส "${targetId}" ออกจาก Google Sheet เรียบร้อยแล้ว`,
        id: targetId
      });
    }

    // -------------------------------------------------------------------
    // ACTION 4: ปักหมุด / ถอนหมุด (TOGGLE PIN)
    // -------------------------------------------------------------------
    if (action === 'togglePin') {
      const targetId = payload.id;
      const rowIndex = findRowIndexById(sheet, targetId);
      if (rowIndex === -1) {
        return jsonResponse({ status: 'error', message: `Note ID "${targetId}" not found` });
      }

      const cell = sheet.getRange(rowIndex, 7); // คอลัมน์ G (isPinned)
      const currentVal = Boolean(cell.getValue());
      const newVal = !currentVal;
      cell.setValue(newVal);
      sheet.getRange(rowIndex, 11).setValue(now); // update updatedAt

      return jsonResponse({
        status: 'success',
        message: newVal ? 'ปักหมุดแล้ว' : 'ถอนหมุดแล้ว',
        isPinned: newVal
      });
    }

    // -------------------------------------------------------------------
    // ACTION 5: ปรับสถานะทำเสร็จ (TOGGLE COMPLETE)
    // -------------------------------------------------------------------
    if (action === 'toggleComplete') {
      const targetId = payload.id;
      const rowIndex = findRowIndexById(sheet, targetId);
      if (rowIndex === -1) {
        return jsonResponse({ status: 'error', message: `Note ID "${targetId}" not found` });
      }

      const cell = sheet.getRange(rowIndex, 8); // คอลัมน์ H (isCompleted)
      const currentVal = Boolean(cell.getValue());
      const newVal = !currentVal;
      cell.setValue(newVal);
      sheet.getRange(rowIndex, 11).setValue(now); // update updatedAt

      return jsonResponse({
        status: 'success',
        message: newVal ? 'ทำเสร็จแล้ว' : 'ยกเลิกสถานะทำเสร็จ',
        isCompleted: newVal
      });
    }

    // -------------------------------------------------------------------
    // ACTION 6: ซิงค์แบบทั้งก้อน (BULK SYNC)
    // -------------------------------------------------------------------
    if (action === 'sync') {
      const notes = payload.notes || [];
      const lastRow = sheet.getLastRow();
      
      // ล้างข้อมูลเก่าทั้งหมดออก (ยกเว้นแถวที่ 1 ซึ่งเป็น Header)
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }

      if (notes.length > 0) {
        const rows = notes.map(n => [
          n.id,
          n.title || '',
          n.content || '',
          n.category || 'Ideas',
          n.color || 'yellow',
          JSON.stringify(n.tags || []),
          Boolean(n.isPinned),
          Boolean(n.isCompleted),
          n.glowColor || 'purple',
          n.createdAt || now,
          n.updatedAt || now
        ]);

        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      }

      return jsonResponse({
        status: 'success',
        message: `ซิงค์สำเร็จทั้งหมด ${notes.length} รายการ`,
        count: notes.length
      });
    }

    return jsonResponse({ status: 'error', message: `Unknown action: "${action}"` });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'doPost Exception: ' + err.toString()
    });
  } finally {
    // ปลดล็อคเสมอ
    lock.releaseLock();
  }
}

/**
 * =========================================================================
 * 🛠️ ฟังก์ชัน Utility ช่วยจัดการแถวและแปลงข้อมูล
 * =========================================================================
 */

// ค้นหาเลขแถวใน Sheet ตาม ID (แถว 1-indexed)
function findRowIndexById(sheet, id) {
  const data = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      return i + 1; // แปลง index เป็น row number ของ Google Sheets
    }
  }
  return -1;
}

// แปลง Array แถวข้อมูลจาก Sheets เป็น Array ของ Object Post-it
function parseRowsToNotes(rows) {
  const notes = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue; // ข้ามแถวที่ไม่มี ID

    let tags = [];
    if (row[5]) {
      try {
        tags = JSON.parse(row[5]);
      } catch (e) {
        tags = String(row[5]).split(',').map(s => s.trim()).filter(Boolean);
      }
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
      glowColor: String(row[8] || 'purple'),
      createdAt: row[9] ? String(row[9]) : new Date().toISOString(),
      updatedAt: row[10] ? String(row[10]) : new Date().toISOString()
    });
  }
  return notes;
}

// ส่งผลลัพธ์กลับในรูปแบบ JSON พร้อมตั้ง MIME type
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
