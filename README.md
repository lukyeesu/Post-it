# 📌 Webapp Post-it (21st.dev Edition)

> กระดานโพสต์อิทออนไลน์สุดโมเดิร์น สร้างขึ้นด้วย **React, Vite, TypeScript และ Tailwind CSS** พร้อมคอมโพเนนต์ระดับพรีเมียมจาก **21st.dev** และระบบเชื่อมต่อฐานข้อมูล **Google Sheets + Google Apps Script** ฟรี 100%!

🌐 **Repository:** [https://github.com/lukyeesu/Post-it](https://github.com/lukyeesu/Post-it)

---

## ✨ ไฮไลท์ฟีเจอร์เด่น (Key Features)

1. **จัดการโพสต์อิทครบวงจร (CRUD):**
   - สร้าง (Create), แก้ไข (Edit), ลบ (Delete), และปักหมุด (Pin to Top)
   - ปรับสถานะทำเสร็จ (Mark as Completed) พร้อมเอฟเฟกต์ Confetti ฉลองความสำเร็จ 🎉
2. **คัดลอกข้อความในคลิกเดียว (One-Click Copy):**
   - ปุ่ม Copy บนการ์ดทุกใบ คัดลอกทั้งหัวข้อและเนื้อหาลงคลิปบอร์ดทันที พร้อมไอคอนเช็คถูกยืนยัน
3. **จัดระเบียบหมวดหมู่และแท็กอย่างเป็นระบบ (Systematic Categorization):**
   - แยกกลุ่มงาน: Work, Ideas, Todo, Personal, Urgent หรือสร้างหมวดหมู่ใหม่เองได้ไม่จำกัด
   - แท็ก (#tags) สำหรับจัดกลุ่มย่อย
   - ฟิลเตอร์ตัวกรองรวดเร็ว: ดูเฉพาะที่ปักหมุด, ดูเฉพาะที่เสร็จแล้ว, หรือค้นหาข้อความแบบ Real-time
4. **21st.dev Components Integration:**
   - 🌟 **`spotlight-card.tsx` (GlowCard):** การ์ดเรืองแสง Spotlight เคลื่อนที่ตามเคอร์เซอร์เมาส์
   - 🔮 **`holographic-foil-card.tsx` (HolographicFoilCard):** การ์ดฟอยล์โฮโลแกรม 3 มิติ ใช้ physics spring จาก Framer Motion
5. **Database & Cloud Sync:**
   - **Offline-First / LocalStorage:** ใช้งานได้ทันที บันทึกข้อมูลบนเบราว์เซอร์อัตโนมัติ
   - **Google Sheets Integration:** ซิงค์ขึ้น Google Sheets ฟรี ผ่าน Google Apps Script Web App
   - **Export / Import:** ดาวน์โหลดไฟล์สำรองข้อมูลแบบ JSON เก็บไว้ได้ตลอดเวลา

---

## 🛠️ โครงสร้างโปรเจกต์ (Project Structure)

```text
webapp-post-it/
├── .github/workflows/
│   └── deploy.yml                   # ออโต้ Deploy ขึ้น GitHub Pages
├── google-apps-script/
│   └── Code.gs                      # โค้ด Google Apps Script Backend
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── spotlight-card.tsx   # 21st.dev GlowCard Component
│   │   │   ├── spotlight-card.demo.tsx
│   │   │   ├── holographic-foil-card.tsx # 21st.dev Holographic Foil Component
│   │   │   └── holographic-foil-card.demo.tsx
│   │   ├── Navbar.tsx               # เมนูด้านบน ค้นหา สลับธีม และปุ่มคำสั่ง
│   │   ├── CategoryFilter.tsx       # แท็บกรองหมวดหมู่ และสถานะปักหมุด
│   │   ├── PostItCard.tsx           # การ์ดโพสต์อิท (รองรับทั้ง Classic, Glow, Foil)
│   │   ├── PostItModal.tsx          # ป๊อปอัปสร้าง/แก้ไขโพสต์อิท
│   │   └── GoogleSheetsModal.tsx    # ตัวช่วยตั้งค่าและซิงค์ Google Sheets
│   ├── data/
│   │   └── sampleNotes.ts           # ข้อมูลตัวอย่างเริ่มต้น
│   ├── lib/
│   │   └── utils.ts                 # ฟังก์ชัน cn (clsx + tailwind-merge)
│   ├── services/
│   │   └── storageService.ts        # บริการจัดการ LocalStorage & Google Sheets API
│   ├── types/
│   │   └── post-it.ts               # TypeScript Interfaces
│   ├── App.tsx                      # Main Application
│   ├── index.css                    # Tailwind Directives & Custom Fonts
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 เริ่มต้นใช้งานบนเครื่องของคุณ (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. เริ่มรันเซิร์ฟเวอร์ทดสอบ
npm run dev

# 3. บิลด์สำหรับ Production
npm run build
```

---

## 📊 วิธีตั้งค่าฐานข้อมูล Google Sheets (ขั้นตอนง่ายๆ)

1. เปิด **[Google Sheets](https://sheets.new)** สร้างสเปรดชีตใหม่
2. ไปที่เมนูด้านบนเลือก **ส่วนขยาย (Extensions) > Apps Script**
3. คัดลอกโค้ดจากไฟล์ `google-apps-script/Code.gs` ไปวางแทนที่โค้ดเดิมทั้งหมด
4. กดปุ่มสีน้ำเงินด้านขวาบน **ทำให้ใช้งานได้ (Deploy) > การปรับใช้รายการใหม่ (New deployment)**
5. เลือกประเภทการปรับใช้: **เว็บแอปพลิเคชัน (Web app)**
   - *คำอธิบาย:* `Post-it Backend`
   - *เรียกใช้ในฐานะ:* `ฉัน (Me)`
   - *ผู้มีสิทธิ์เข้าถึง (Who has access):* **ทุกคน (Anyone)** *(สำคัญมาก)*
6. กด **Deploy** แล้วคัดลอก **Web app URL** (ที่ลงท้ายด้วย `/exec`)
7. กลับมาที่หน้า Webapp Post-it กดปุ่ม **Google Sheets** บนแถบเมนู วาง URL แล้วกด **บันทึก / ส่งข้อมูลขึ้น Sheets** ได้ทันที!

---

## 💡 คำแนะนำทางเลือกฐานข้อมูลเพิ่มเติม

| ระบบฐานข้อมูล | ข้อดี | ข้อจำกัด | เหมาะกับใคร |
| :--- | :--- | :--- | :--- |
| **LocalStorage (ค่าเริ่มต้น)** | รวดเร็วที่สุด 0ms, ไม่ต้องตั้งค่า, ออฟไลน์ได้ 100% | เก็บเฉพาะในเบราว์เซอร์เครื่องนั้น | ใช้ส่วนตัวบนเครื่องเดียว |
| **Google Sheets + Apps Script** | ฟรี 100%, ดูและแก้ไขในตาราง Sheets ได้, แชร์ให้ทีมดูได้ | ความเร็วระดับ 1-2 วินาทีต่อการซิงค์ | ทำงานร่วมกับทีม, จดบันทึกประจำวัน |
| **Supabase (PostgreSQL)** | Real-time ทันที, มี User Authentication, ฟรี Tier จุใจ | ต้องสมัครบัญชีและตั้งค่า API Key | ต้องการขยายระบบเป็น Multi-user SaaS |
| **Firebase Firestore** | Real-time NoSQL, SDK ใช้ง่าย | ต้องผูกบัตรเครดิตเพื่อเริ่มโครงการ | เหมาะกับ Mobile + Web Sync |

---

## 📦 การขึ้นระบบ GitHub Pages (`lukyeesu/Post-it`)

โปรเจกต์นี้ตั้งค่า `base: './'` และติดตั้ง GitHub Actions `.github/workflows/deploy.yml` ไว้เรียบร้อยแล้ว:
1. ทำการ Push โค้ดทั้งหมดขึ้นที่ `https://github.com/lukyeesu/Post-it`
2. ไปที่ GitHub Repository ของคุณ เข้าเมนู **Settings > Pages**
3. ในส่วน **Build and deployment > Source** ให้เลือกเป็น **GitHub Actions**
4. เว็บไซต์จะถูกดีพลอยขึ้น URL: `https://lukyeesu.github.io/Post-it/` โดยอัตโนมัติ!
