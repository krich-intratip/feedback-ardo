// ========================================
// Google Apps Script - Feedback Integration
// สำหรับ Training Feedback Management System
// ========================================
//
// วิธีติดตั้ง:
// 1. เปิด Google Sheet: https://docs.google.com/spreadsheets/d/1rYgrTCft1FUmu1TA-vk_OiSUO6HzXFQFEYx4XrHCNE4/
// 2. ไปที่ Extensions > Apps Script
// 3. ลบโค้ดเดิมทั้งหมด แล้ววาง Code.gs นี้ลงไป
// 4. บันทึก (Ctrl+S)
// 5. Deploy > New deployment
//    - Select type: Web app
//    - Description: Feedback API v1
//    - Execute as: Me
//    - Who has access: Anyone
// 6. คลิก Deploy แล้วคัดลอก Web App URL
// 7. นำ URL ไปวางที่ GOOGLE_SHEETS_URL ในไฟล์ js/app.js
//
// หมายเหตุ: ทุกครั้งที่แก้ไขโค้ด ต้อง Deploy > Manage deployments > แก้ไข version เป็น New version
// ========================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'feedback') {
      return handleFeedback(ss, data);
    } else if (data.type === 'syncInstructors') {
      return handleSyncInstructors(ss, data);
    } else if (data.type === 'getInstructors') {
      return handleGetInstructors(ss);
    }

    return jsonResponse({ success: false, error: 'Unknown type: ' + data.type });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ========================================
// Handle Feedback Submission
// ========================================
function handleFeedback(ss, data) {
  var sheet = ss.getSheetByName('Feedback');

  // สร้าง Sheet อัตโนมัติถ้ายังไม่มี
  if (!sheet) {
    sheet = ss.insertSheet('Feedback');
    var headers = [
      'Timestamp', 'ID', 'ชื่อหลักสูตร', 'วันที่อบรม', 'สถานที่',
      'รุ่น', 'หน่วยงาน', 'ชื่อวิทยากร',
      'วิทยากร_1', 'วิทยากร_2', 'วิทยากร_3', 'วิทยากร_4',
      'เนื้อหา_1', 'เนื้อหา_2', 'เนื้อหา_3', 'เนื้อหา_4',
      'สถานที่_1', 'สถานที่_2', 'สถานที่_3',
      'อาหาร_1', 'อาหาร_2', 'อาหาร_3',
      'ประโยชน์_1', 'ประโยชน์_2', 'ประโยชน์_3',
      'คะแนนเฉลี่ย', 'จุดเด่น', 'ข้อเสนอแนะ', 'หัวข้อในอนาคต'
    ];
    sheet.appendRow(headers);

    // จัดรูปแบบ header
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#7c5cfc');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  // เตรียมข้อมูลแถวใหม่
  var row = [
    data.timestamp || new Date().toISOString(),
    data.id || '',
    data.courseName || '',
    data.trainingDate || '',
    data.location || '',
    data.batch || '',
    data.department || '',
    data.instructorName || ''
  ];

  // เพิ่มคะแนนแต่ละหมวด
  var categories = ['instructor', 'content', 'venue', 'catering', 'benefit'];
  categories.forEach(function(cat) {
    if (data[cat] && Array.isArray(data[cat])) {
      data[cat].forEach(function(score) {
        row.push(score);
      });
    }
  });

  // เพิ่มคะแนนเฉลี่ยและข้อคิดเห็น
  row.push(data.avgScore || '');
  row.push(data.strengths || '');
  row.push(data.suggestions || '');
  row.push(data.futureTopics || '');

  sheet.appendRow(row);

  return jsonResponse({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
}

// ========================================
// Handle Instructor Sync
// ========================================
function handleSyncInstructors(ss, data) {
  var sheet = ss.getSheetByName('Instructors');

  // สร้าง Sheet อัตโนมัติถ้ายังไม่มี
  if (!sheet) {
    sheet = ss.insertSheet('Instructors');
  }

  // ล้างข้อมูลเดิม
  sheet.clearContents();

  // เพิ่ม header
  sheet.appendRow(['ชื่อวิทยากร', 'วันที่เพิ่ม']);
  var headerRange = sheet.getRange(1, 1, 1, 2);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#7c5cfc');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  // เพิ่มข้อมูลวิทยากร
  if (data.instructors && Array.isArray(data.instructors)) {
    data.instructors.forEach(function(inst) {
      sheet.appendRow([
        inst.name || '',
        inst.addedAt || new Date().toISOString()
      ]);
    });
  }

  return jsonResponse({ success: true, message: 'ซิงค์รายชื่อวิทยากรสำเร็จ' });
}

// ========================================
// Handle Get Instructors
// ========================================
function handleGetInstructors(ss) {
  var sheet = ss.getSheetByName('Instructors');

  if (!sheet) {
    return jsonResponse({ success: true, instructors: [] });
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({ success: true, instructors: [] });
  }
  var data = sheet.getRange(2, 1, lastRow, 2).getValues();
  var instructors = data.map(function(row) {
    return { name: row[0], addedAt: row[1] };
  });

  return jsonResponse({ success: true, instructors: instructors });
}

// ========================================
// Utility: JSON Response
// ========================================
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// Test Function (สำหรับทดสอบใน Apps Script Editor)
// ========================================
function testDoPost() {
  var testPayload = {
    type: 'feedback',
    timestamp: new Date().toISOString(),
    id: 'test-001',
    courseName: 'หลักสูตรทดสอบ',
    trainingDate: '2026-02-11',
    location: 'ห้องประชุม A',
    batch: 'รุ่นที่ 1',
    department: 'ฝ่าย IT',
    instructorName: 'ดร.ทดสอบ ระบบ',
    instructor: [5, 4, 5, 4],
    content: [5, 4, 4, 5],
    venue: [4, 4, 4],
    catering: [4, 3, 4],
    benefit: [5, 5, 4],
    avgScore: '4.35',
    strengths: 'เนื้อหาดีมาก',
    suggestions: 'เพิ่มเวลา workshop',
    futureTopics: 'AI และ Machine Learning'
  };

  var e = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };

  var result = doPost(e);
  Logger.log(result.getContent());
}
