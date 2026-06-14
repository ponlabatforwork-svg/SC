// =========================================================================
// ⚙️ การตั้งค่าเริ่มต้น (Configuration)
// นำ ID ของ Google Sheets มาวางตรงนี้ 
// (ดูได้จาก URL เช่น https://docs.google.com/spreadsheets/d/[ก็อปปี้IDตรงนี้]/edit)
// =========================================================================
const SPREADSHEET_ID = "1RER1vqu9Yrqbh-JSUnjaKRLZdtLB3LZxnwDOKbXWYss";

/**
 * 1. ฟังก์ชันแสดงผลหน้าเว็บ (จำเป็นต้องมี)
 * เมื่อผู้ใช้เข้าผ่าน URL จะทำการโหลดหน้า UI จากไฟล์ Index.html
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('FUTURE PARTY | Official Website') // ตั้งชื่อแท็บเว็บบนเบราว์เซอร์
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1') // ป้องกันการซูมแปลกๆ บนมือถือ
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // อนุญาตให้นำเว็บไปฝัง (Embed) ใน Google Sites ได้
}

/**
 * 2. ฟังก์ชันตรวจสอบและเตรียมฐานข้อมูลอัตโนมัติ (Auto-Setup)
 * ช่วยป้องกันบั๊ก ถ้าผู้ใช้ลืมสร้างชีต ระบบจะสร้างและใส่สีหัวตารางให้เอง
 */
function setupSheetsIfNotExist() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 📌 จัดการชีต "ศูนย์ประสานงานของหาย" (LostAndFound)
  let lostSheet = ss.getSheetByName('LostAndFound');
  if (!lostSheet) {
    lostSheet = ss.insertSheet('LostAndFound');
    lostSheet.appendRow(['Timestamp', 'Item Name', 'Location', 'Type', 'ImageBase64']);
    // ตกแต่งหัวตารางให้ดูง่ายขึ้น
    lostSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#d8b4fe"); 
  }

  // 📌 จัดการชีต "เสียงสนับสนุน" (Support)
  let supportSheet = ss.getSheetByName('Support');
  if (!supportSheet) {
    supportSheet = ss.insertSheet('Support');
    supportSheet.appendRow(['Timestamp', 'Name', 'Class', 'Idea']);
    // ตกแต่งหัวตารางให้ดูง่ายขึ้น
    supportSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#fbcfe8"); 
  }
  
  return ss;
}

/**
 * 3. ฟังก์ชันดึงข้อมูลไปแสดงหน้าเว็บตอนเปิดแอป (Async Load)
 * เพื่อให้หน้าเว็บโหลดติดทันที ไม่ต้องค้างรอข้อมูล
 */
function getInitialData() {
  try {
    const ss = setupSheetsIfNotExist();
    const lostSheet = ss.getSheetByName('LostAndFound');
    const lostRows = lostSheet.getDataRange().getValues();
    
    let lostItems = [];
    // วนลูปเก็บข้อมูล (เริ่มที่ i=1 เพื่อข้ามแถวหัวตาราง)
    for (let i = 1; i < lostRows.length; i++) {
      if(lostRows[i][1] !== "") { // ข้ามแถวที่ชื่อของเป็นค่าว่าง
        lostItems.push({
          name: lostRows[i][1],
          loc: lostRows[i][2],
          type: lostRows[i][3],
          image: lostRows[i][4]
        });
      }
    }
    
    return { success: true, lostItems: lostItems };
  } catch (e) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + e.toString());
    // กรณี ID ชีตผิด หรือยังไม่ได้อนุญาตสิทธิ์ ให้ส่งข้อมูลจำลองไปก่อน เพื่อไม่ให้หน้าเว็บพัง
    return { 
      success: false, 
      lostItems: [] 
    };
  }
}

/**
 * 4. ฟังก์ชันบันทึกการแจ้งของหาย
 * รับข้อมูลจากฟอร์มหน้าเว็บและบันทึกลงชีต
 */
function handleLostReport(reportData) {
  try {
    const ss = setupSheetsIfNotExist();
    const sheet = ss.getSheetByName('LostAndFound');
    
    // เรียงข้อมูลเข้าตาราง: [เวลา, ชื่อของ, สถานที่, ประเภท, รูปภาพย่อขนาด]
    sheet.appendRow([
      new Date(), 
      reportData.name, 
      reportData.loc, 
      reportData.type, 
      reportData.image
    ]);
    
    return { success: true, message: "บันทึกรายการสำเร็จ! ระบบกำลังซิงค์ขึ้นหน้าจอ" };
  } catch (e) {
    console.error("เกิดข้อผิดพลาดตอนเซฟของหาย: " + e.toString());
    return { success: false, message: "เซิร์ฟเวอร์ขัดข้อง: " + e.message };
  }
}

/**
 * 5. ฟังก์ชันบันทึกข้อเสนอแนะและเสียงสนับสนุน
 * รับข้อมูลจากฟอร์มด้านล่างสุดของเว็บ
 */
function handleFormSubmit(formData) {
  try {
    const ss = setupSheetsIfNotExist();
    const sheet = ss.getSheetByName('Support');
    
    // เรียงข้อมูลเข้าตาราง: [เวลา, ชื่อ-นามสกุล, ชั้นเรียน, ไอเดีย]
    sheet.appendRow([
      new Date(), 
      formData.name, 
      formData.class, 
      formData.idea
    ]);
    
    return { success: true, message: "เราได้รับคะแนนเสียงและไอเดียของคุณแล้ว ขอบคุณที่ร่วมพัฒนาโรงเรียนไปด้วยกันครับ 💜" };
  } catch (e) {
    console.error("เกิดข้อผิดพลาดตอนเซฟกำลังใจ: " + e.toString());
    return { success: false, message: "เซิร์ฟเวอร์ขัดข้อง: " + e.message };
  }
}
