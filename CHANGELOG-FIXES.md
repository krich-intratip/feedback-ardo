# สรุปการแก้ไขทั้งระบบ (Checklist)

## 1. Google Apps Script (Code.gs)
- [x] แก้ `handleGetInstructors`: ใช้ `getRange(2, 1, lastRow, 2)` แทน `getLastRow() - 1`
- [x] เช็ก `lastRow < 2` ก่อนอ่านข้อมูล

## 2. ข้อมูลและสรุป (app.js)
- [x] `renderSummary`: เช็ก element เป็น null ก่อนตั้งค่า stat และก่อนเรียก `animateValue`
- [x] `calculateAverageScore`: เช็ก ratings null/undefined, ใช้ `(Number(score) || 0)`
- [x] `calculateCategoryAverage`: เช็ก array และความยาว
- [x] `viewRecord`: เช็ก record มี metadata, ratings, openEnded
- [x] รายการ: `.filter(record => record && record.metadata && record.ratings)` + trainingDate fallback '-'
- [x] `generateCSVContent`: ใช้เฉพาะ `validRecords` (มี metadata, ratings, openEnded)
- [x] `renderCharts`: กรอง `chartData` จาก record ที่มี ratings ถูกต้อง

## 3. CSV และความปลอดภัย
- [x] ฟังก์ชัน `csvEscape()`: ใส่ quote/escape ตามมาตรฐาน CSV + ป้องกัน CSV injection
- [x] Toast: ใช้ `escapeHtml(message)`
- [x] Confirm modal: ใช้ `escapeHtml(title)`, ข้อความใน `<div>` เพื่อรองรับ HTML

## 4. Form (กรอกแบบประเมิน)
- [x] `parseRating(val)`: คืนค่า 1–5, default 3
- [x] `getFormRating(form, prefix, count)`: ดึงคะแนนแบบปลอดภัย
- [x] เก็บ metadata/openEnded แบบมี fallback เมื่อ element ไม่มี
- [x] เช็กชื่อหลักสูตรและสถานที่ก่อน submit

## 5. Import JSON
- [x] `normalizeImportedRecord()`: เติมโครงสร้างและค่าที่หาย
- [x] ข้อความผลลัพธ์: แสดงจำนวนที่นำเข้า, รายการซ้ำ, รายการที่ไม่ถูกต้อง
- [x] อ่านไฟล์ด้วย `readAsText(file, 'UTF-8')`

## 6. Google Sheets
- [x] `isRecordValidForSheets(record)` ก่อนส่ง
- [x] Header `Content-Type: application/json` ใน fetch
- [x] แสดง toast สำเร็จเฉพาะเมื่อ `response.ok`
- [x] `syncInstructorsToSheets`: Content-Type + payload ที่ปลอดภัย

## 7. UI
- [x] `showTab`: เช็ก `contentArea` และ `activeBtn` ก่อนทำงาน
- [x] `initTheme`: บันทึก `theme = 'light'` เมื่อโหมดระบบเป็น light
- [x] ปุ่มเลื่อนขึ้น: `title` และ `aria-label` ภาษาไทย
- [x] Toast: จำกัดสูงสุด 5 อัน, เช็ก container, fallback สี/ไอคอน
- [x] Form progress: ตัวแปร `radioRequiredCount` อ่านง่าย

## 8. Autosave (autosave.js)
- [x] `restoreAutoSave`: ตั้ง `autoSaveConfig.enabled = false` และ `saveAutoSaveConfig()`
- [x] `verifyPermission`: try/catch และเช็ก handle เป็น null
- [x] `safeToast(message, type)`: เรียก `showToast` ผ่าน window แบบปลอดภัย
- [x] ใช้ `safeToast` แทน `showToast` ทั้งหมดใน autosave.js

---
*อัปเดต: ตรวจสอบทุกรายการแล้ว*
