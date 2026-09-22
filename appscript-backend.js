/**
 * =========================================================================
 * 📌 Webapp Post-it Backend API (Google Apps Script + Google Sheets)
 * =========================================================================
 * ชื่อไฟล์: appscript-backend.js (หรือ Code.gs บน Google Apps Script)
 * 
 * ทำหน้าที่เป็น JSON API และเชื่อมต่อกับ Google Sheets โดยตรงเป็น Database
 * ฟีเจอร์ครบวงจร (CRUD):
 *   1. ดึงโพสต์อิททั้งหมด (Get All Notes)
 *   2. ดึงโพสต์อิทรายตัวตาม ID (Get Single Note)
 *   3. สร้างโพสต์อิทใหม่ (Create Note)
 *   4. แก้ไขโพสต์อิทเดิม (Update Note)
 *   5. ลบโพสต์อิท (Delete Note)
 *   6. ปักหมุด / ถอนหมุด (Toggle Pin)
 *   7. ติ๊กทำเสร็จ (Toggle Complete)
 *   8. ซิงค์ชุดข้อมูลทั้งหมด (Bulk Sync)
 *   9. ตรวจสอบสถานะการเชื่อมต่อ (Ping / Health Check)
 * 
 * -------------------------------------------------------------------------
 * 🚀 วิธีนำโค้ดไปติดตั้งบน Google Sheets (ทำเพียงครั้งเดียว):
 * -------------------------------------------------------------------------
 * 1. เปิด Google Sheets ขึ้นมา 1 ไฟล์ (สร้างใหม่ได้ที่ https://sheets.new)
 * 2. ไปที่เมนูด้านบน: "ส่วนขยาย (Extensions)" > "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมดในหน้าต่าง แล้วคัดลอกโค้ดทั้งหมดในไฟล์นี้ไปวาง
 * 4. (ทางเลือก) เลือกฟังก์ชัน "setupSheet" ด้านบนแล้วกดปุ่ม "เรียกใช้ (Run)" 
 *    เพื่อสร้างชีต PostIts และตกแต่งหัวตารางอัตโนมัติ
 * 5. กดปุ่มสีน้ำเงินขวาบน: "ทำให้ใช้งานได้ (Deploy)" > "การปรับใช้รายการใหม่ (New deployment)"
 * 6. กดรูปเฟืองเลือกประเภท: "เว็บแอปพลิเคชัน (Web app)"
 *    - คำอธิบาย: Post-it API Backend
 *    - ดำเนินการในฐานะ: "ฉัน (Me)"
 *    - ผู้มีสิทธิ์เข้าถึง: "ทุกคน (Anyone)"  <--- **สำคัญมาก ต้องเลือก Anyone**
 * 7. กด "ทำให้ใช้งานได้ (Deploy)" และอนุญาตสิทธิ์ (Authorize Access)
 * 8. คัดลอก "URL เว็บแอปพลิเคชัน" (ที่ลงท้ายด้วย /exec) นำไปวางใน Webapp Post-it!
 * =========================================================================
 */

const SHEET_NAME = 'PostIts';
const HEADERS = [
  'id',          // A: รหัสอ้างอิงโน้ต (unique ID)
  'title',       // B: หัวข้อโน้ต
  'content',     // C: เนื้อหาโพสต์อิท
  'category',    // D: หมวดหมู่ (Work, Ideas, Todo, Personal, Urgent ฯลฯ)
  'color',       // E: สีของการ์ด (yellow, green, blue, purple, pink, orange, spotlight, holographic)
  'tags',        // F: แท็ก (เก็บเป็น JSON array)
  'isPinned',    // G: สถานะปักหมุด (TRUE / FALSE)
  'isCompleted', // H: สถานะทำเสร็จ (TRUE / FALSE)
  'glowColor',   // I: สีแสง Glow ของ Spotlight card
  'createdAt',   // J: วันเวลาที่สร้าง (ISO Date string)
  'updatedAt',   // K: วันเวลาที่แก้ไขล่าสุด (ISO Date string)
  'book'         // L: เล่มหนังสือ (เช่น กีฬา, งาน, ทั่วไป)
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
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#CA8A04', SpreadsheetApp.BorderStyle.SOLID);
    
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);
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
    sheet.setColumnWidth(12, 140); // book
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
 * 📥 GET Request Handler: ดึงข้อมูลและตรวจสอบสถานะ API
 * =========================================================================
 * Parameter ที่รองรับ:
 *   ?action=getNotes (default) -> ดึงโพสต์อิททั้งหมด
 *   ?action=getNote&id=xxx     -> ดึงโน้ตเฉพาะตัวตาม ID
 *   ?action=ping               -> ตรวจสอบความพร้อมของ API (Health Check)
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

    // กรณีมีแค่แถวหัวตาราง (ไม่มีข้อมูล)
    if (data.length <= 1) {
      return jsonResponse({ status: 'success', count: 0, notes: [] });
    }

    const allNotes = parseRowsToNotes(data.slice(1));

    // 2. ดึงโน้ตเฉพาะตัวตาม ID
    if (action === 'getNote') {
      const id = params.id;
      if (!id) return jsonResponse({ status: 'error', message: 'Missing "id" parameter' });
      const found = allNotes.find(n => n.id === id);
      if (!found) return jsonResponse({ status: 'error', message: `Note ID "${id}" not found` });
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
    return jsonResponse({ status: 'error', message: 'doGet Error: ' + err.toString() });
  }
}

/**
 * =========================================================================
 * 📤 POST Request Handler: บันทึก แก้ไข ลบ และซิงค์ข้อมูล
 * =========================================================================
 * Actions ที่รองรับ:
 *   - action: 'create'         -> สร้างโน้ตใหม่
 *   - action: 'update'         -> แก้ไขโน้ตเดิม
 *   - action: 'delete'         -> ลบโน้ตตาม ID
 *   - action: 'togglePin'      -> สลับสถานะปักหมุด
 *   - action: 'toggleComplete' -> สลับสถานะทำเสร็จ
 *   - action: 'sync'           -> ซิงค์ชุดข้อมูลทั้งหมด
 */
function doPost(e) {
  // ระบบ Concurrency Lock ป้องกันการเขียนข้อมูลทับซ้อนเมื่อมีการเรียกพร้อมกัน
  const lock = LockService.getScriptLock();
  
  try {
    if (!lock.tryLock(10000)) {
      return jsonResponse({ status: 'error', message: 'Server is busy, please retry in a moment.' });
    }

    const contents = e && e.postData ? e.postData.contents : null;
    if (!contents) {
      return jsonResponse({ status: 'error', message: 'No payload received' });
    }

    const payload = JSON.parse(contents);
    const action = payload.action || 'sync';
    const sheet = getOrCreateSheet();
    const now = new Date().toISOString();

    // -----------------------------------------------------------------
    // 1. CREATE NOTE
    // -----------------------------------------------------------------
    if (action === 'create') {
      const note = payload.note;
      if (!note) return jsonResponse({ status: 'error', message: 'Missing note data' });

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
        note.updatedAt || now,
        note.book || 'ทั่วไป'
      ];

      sheet.appendRow(rowData);
      return jsonResponse({ 
        status: 'success', 
        message: 'สร้างโพสต์อิทลง Google Sheet เรียบร้อยแล้ว', 
        noteId: noteId 
      });
    }

    // -----------------------------------------------------------------
    // 2. UPDATE NOTE
    // -----------------------------------------------------------------
    if (action === 'update') {
      const note = payload.note;
      const targetId = (note && note.id) || payload.id;
      if (!targetId) return jsonResponse({ status: 'error', message: 'Missing target ID' });

      const rowIndex = findRowIndexById(sheet, targetId);
      if (rowIndex === -1) return jsonResponse({ status: 'error', message: `Note ID "${targetId}" not found` });

      const old = sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
      const updatedRow = [
        targetId,
        note.title !== undefined ? note.title : old[1],
        note.content !== undefined ? note.content : old[2],
        note.category !== undefined ? note.category : old[3],
        note.color !== undefined ? note.color : old[4],
        note.tags !== undefined ? JSON.stringify(note.tags) : old[5],
        note.isPinned !== undefined ? Boolean(note.isPinned) : old[6],
        note.isCompleted !== undefined ? Boolean(note.isCompleted) : old[7],
        note.glowColor !== undefined ? note.glowColor : old[8],
        old[9] || now, // วันเวลาสร้างเดิม
        now,           // อัปเดต updatedAt ใหม่
        note.book !== undefined ? note.book : (old[11] || 'ทั่วไป')
      ];

      sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([updatedRow]);
      return jsonResponse({ status: 'success', message: 'แก้ไขโพสต์อิทแล้ว', id: targetId });
    }

    // -----------------------------------------------------------------
    // 3. DELETE NOTE
    // -----------------------------------------------------------------
    if (action === 'delete') {
      const targetId = payload.id;
      if (!targetId) return jsonResponse({ status: 'error', message: 'Missing target ID' });

      const rowIndex = findRowIndexById(sheet, targetId);
      if (rowIndex === -1) return jsonResponse({ status: 'error', message: `Note ID "${targetId}" not found` });

      sheet.deleteRow(rowIndex);
      return jsonResponse({ status: 'success', message: `ลบโพสต์อิท "${targetId}" เรียบร้อยแล้ว` });
    }

    // -----------------------------------------------------------------
    // 4. TOGGLE PIN
    // -----------------------------------------------------------------
    if (action === 'togglePin') {
      const targetId = payload.id;
      const rowIndex = findRowIndexById(sheet, targetId);
      if (rowIndex === -1) return jsonResponse({ status: 'error', message: `Note ID "${targetId}" not found` });

      const cell = sheet.getRange(rowIndex, 7); // คอลัมน์ G (isPinned)
      const newVal = !Boolean(cell.getValue());
      cell.setValue(newVal);
      sheet.getRange(rowIndex, 11).setValue(now);
      return jsonResponse({ status: 'success', isPinned: newVal });
    }

    // -----------------------------------------------------------------
    // 5. TOGGLE COMPLETE
    // -----------------------------------------------------------------
    if (action === 'toggleComplete') {
      const targetId = payload.id;
      const rowIndex = findRowIndexById(sheet, targetId);
      if (rowIndex === -1) return jsonResponse({ status: 'error', message: `Note ID "${targetId}" not found` });

      const cell = sheet.getRange(rowIndex, 8); // คอลัมน์ H (isCompleted)
      const newVal = !Boolean(cell.getValue());
      cell.setValue(newVal);
      sheet.getRange(rowIndex, 11).setValue(now);
      return jsonResponse({ status: 'success', isCompleted: newVal });
    }

    // -----------------------------------------------------------------
    // 6. BULK SYNC (Full Replacement)
    // -----------------------------------------------------------------
    if (action === 'sync') {
      const notes = payload.notes || [];
      const lastRow = sheet.getLastRow();
      
      // ลบข้อมูลเดิมทั้งหมดยกเว้นแถวที่ 1 (Header)
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
          n.updatedAt || now,
          n.book || 'ทั่วไป'
        ]);
        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      }
      return jsonResponse({ status: 'success', message: `ซิงค์สำเร็จ ${notes.length} รายการ`, count: notes.length });
    }

    return jsonResponse({ status: 'error', message: `Unknown action: "${action}"` });

  } catch (err) {
    return jsonResponse({ status: 'error', message: 'doPost Error: ' + err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * =========================================================================
 * 🛠️ ฟังก์ชัน Utility
 * =========================================================================
 */

// ค้นหาแถวตาม ID ในชีต (1-indexed)
function findRowIndexById(sheet, id) {
  const data = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

// แปลง Array แถวจาก Google Sheets เป็น Array ของ Object Post-it
function parseRowsToNotes(rows) {
  return rows.filter(r => r[0]).map(r => {
    let tags = [];
    if (r[5]) {
      try { tags = JSON.parse(r[5]); } catch(e) { tags = String(r[5]).split(',').map(s => s.trim()).filter(Boolean); }
    }
    return {
      id: String(r[0]),
      title: String(r[1] || ''),
      content: String(r[2] || ''),
      category: String(r[3] || 'Ideas'),
      color: String(r[4] || 'yellow'),
      tags: Array.isArray(tags) ? tags : [],
      isPinned: Boolean(r[6]),
      isCompleted: Boolean(r[7]),
      glowColor: String(r[8] || 'purple'),
      createdAt: r[9] ? String(r[9]) : new Date().toISOString(),
      updatedAt: r[10] ? String(r[10]) : new Date().toISOString(),
      book: r[11] ? String(r[11]) : 'ทั่วไป'
    };
  });
}

// สร้างผลลัพธ์ JSON สำหรับส่งกลับไปยัง Webapp
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
