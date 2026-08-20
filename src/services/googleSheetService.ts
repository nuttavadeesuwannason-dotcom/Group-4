import { User, Student, InspectionLog } from '../types';

// Sheet 1: Admin Users Sheet ID
export const ADMIN_USERS_SHEET_ID = '1y3pedYse34ZArBYCBNXtcnOcQ7DFO1XMWB3lQ-iH2uc';
export const ADMIN_USERS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${ADMIN_USERS_SHEET_ID}/edit?gid=0#gid=0`;

// Sheet 2: General Users Sheet ID
export const GENERAL_USERS_SHEET_ID = '14TB49AXslxpBnxgBzg1wdkOz5io1n0EFPZPM0vnh_SU';
export const GENERAL_USERS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GENERAL_USERS_SHEET_ID}/edit?gid=0#gid=0`;

// Backward compatibility alias
export const LOGIN_USERS_SHEET_ID = ADMIN_USERS_SHEET_ID;
export const LOGIN_USERS_SHEET_URL = ADMIN_USERS_SHEET_URL;

export const DETAILS_SHEET_ID = '1dB4UC_Qrych4C7e3aoakioLLfjNtAMFTzbHkqULgAs4';
export const DETAILS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DETAILS_SHEET_ID}/edit?usp=sharing`;

/**
 * Helper to fetch and parse Google Sheet gviz JSON format
 */
export async function fetchGvizData(sheetId: string, sheetName?: string): Promise<any[]> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json${
    sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''
  }`;

  const res = await fetch(gvizUrl);
  if (!res.ok) {
    throw new Error(`Google Sheet fetch failed with status ${res.status}`);
  }

  const text = await res.text();
  // Strip out `/*O_o*/\ngoogle.visualization.Query.setResponse(` and ending `);`
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('Invalid Google Sheet response format');
  }

  const parsed = JSON.parse(jsonMatch[1]);
  const table = parsed.table;
  if (!table) return [];

  const cols: string[] = (table.cols || []).map((c: any) => (c && c.label ? c.label.trim() : ''));
  const rows: any[] = table.rows || [];

  return rows.map((r: any) => {
    const rowObj: Record<string, any> = {};
    const cells = r.c || [];
    cells.forEach((cell: any, idx: number) => {
      const colName = cols[idx] || `col_${idx}`;
      let val = '';
      if (cell) {
        if (cell.f !== undefined && cell.f !== null) {
          val = String(cell.f);
        } else if (cell.v !== undefined && cell.v !== null) {
          val = String(cell.v);
        }
      }
      rowObj[colName] = val;
      rowObj[idx] = val; // Also index by position
    });
    return rowObj;
  });
}

/**
 * Fetch Dataset 1: Login Users from Google Sheet (1y3pedYse34ZArBYCBNXtcnOcQ7DFO1XMWB3lQ-iH2uc)
 * Extracts ID -> User ID, PASSWORD -> Password
 */
export async function fetchUsersFromGoogleSheet(
  appsScriptUrl?: string,
  sheetId: string = ADMIN_USERS_SHEET_ID,
  defaultRole: 'admin' | 'user' = sheetId === GENERAL_USERS_SHEET_ID ? 'user' : 'admin'
): Promise<{ users: User[]; rawCount: number; source: 'AppsScript' | 'DirectSheet' }> {
  // Option 1: Try fetching through Apps Script if URL provided
  if (appsScriptUrl && appsScriptUrl.trim().startsWith('https://script.google.com')) {
    try {
      const res = await fetch(appsScriptUrl.trim(), { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          const usersFromScript: User[] = json.map((item: any, idx: number) => {
            const rawId = item.ID || item.id || item.Id || `INS-${String(idx + 1).padStart(3, '0')}`;
            const rawPass = item.PASSWORD || item.password || item.Password || '123456';
            const rawName = item.NAME || item.name || item['ชื่อ-นามสกุล'] || `ผู้ตรวจ (${rawId})`;
            const rawPos = item.POSITION || item.position || item['ตำแหน่ง'] || (defaultRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ครูฝ่ายปกครอง (ผู้ตรวจ)');
            const rawInst = item.INSTITUTION || item.institutionCode || item['รหัสสถาบัน'] || 'SCH-10102';

            return {
              id: String(rawId).trim(),
              name: String(rawName).trim(),
              position: String(rawPos).trim(),
              password: String(rawPass).trim(),
              institutionCode: String(rawInst).trim(),
              role: defaultRole,
            };
          });

          return { users: usersFromScript, rawCount: usersFromScript.length, source: 'AppsScript' };
        }
      }
    } catch (err) {
      console.warn('Apps Script user fetch failed, falling back to direct gviz reader:', err);
    }
  }

  // Option 2: Read directly from public Google Sheet gviz JSON
  const rawRows = await fetchGvizData(sheetId);
  const usersFromSheet: User[] = rawRows
    .map((row: any, idx: number): User | null => {
      // Look for columns: ID / password
      let rawId = '';
      let rawPass = '';
      let rawName = '';
      let rawPos = '';
      let rawInst = '';

      Object.keys(row).forEach((k) => {
        const keyUpper = String(k).toUpperCase();
        if (keyUpper === 'ID' || keyUpper === 'USERID' || keyUpper === 'รหัสผู้ใช้งาน') {
          rawId = row[k];
        } else if (keyUpper === 'PASSWORD' || keyUpper === 'PASS' || keyUpper === 'รหัสผ่าน') {
          rawPass = row[k];
        } else if (keyUpper === 'NAME' || keyUpper === 'FULLNAME' || keyUpper.includes('ชื่อ')) {
          rawName = row[k];
        } else if (keyUpper === 'POSITION' || keyUpper.includes('ตำแหน่ง')) {
          rawPos = row[k];
        } else if (keyUpper === 'INSTITUTION' || keyUpper.includes('สถาบัน')) {
          rawInst = row[k];
        }
      });

      // Fallback by column position if labels weren't clear
      if (!rawId && row[0]) rawId = row[0];
      if (!rawPass && row[1]) rawPass = row[1];

      if (!rawId) return null;

      // Construct friendly name if missing
      const formattedName = rawName || `ผู้ใช้งาน (${rawId})`;
      const formattedPos = rawPos || (defaultRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ครูฝ่ายปกครอง / ผู้ตรวจระเบียบ');

      return {
        id: String(rawId).trim(),
        name: String(formattedName).trim(),
        position: String(formattedPos).trim(),
        password: String(rawPass).trim() || '2551',
        institutionCode: String(rawInst || 'SCH-10102').trim(),
        role: defaultRole,
      };
    })
    .filter((u): u is User => u !== null);

  return {
    users: usersFromSheet,
    rawCount: usersFromSheet.length,
    source: 'DirectSheet',
  };
}

/**
 * Fetch Dataset 2: Detail Data (Students & Inspection Logs) from Apps Script / Google Sheet
 */
export async function fetchDetailsFromAppsScript(
  appsScriptUrl?: string,
  sheetId: string = DETAILS_SHEET_ID
): Promise<{ students: Student[]; logs: InspectionLog[] }> {
  // If custom Apps Script URL is set
  if (appsScriptUrl && appsScriptUrl.trim().startsWith('https://script.google.com')) {
    try {
      const res = await fetch(appsScriptUrl.trim(), { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.students || json.logs) {
          return {
            students: Array.isArray(json.students) ? json.students : [],
            logs: Array.isArray(json.logs) ? json.logs : [],
          };
        }
      }
    } catch (e) {
      console.warn('Apps Script details fetch error:', e);
    }
  }

  // Fallback: Fetch from public gviz sheet
  try {
    const rawRows = await fetchGvizData(sheetId);
    const importedLogs: InspectionLog[] = [];
    const importedStudents: Student[] = [];

    rawRows.forEach((row, idx) => {
      // Try parsing inspection log row or student row
      const id = row['ID'] || row['id'] || row['เลขที่รายการ'] || `LOG-GS-${idx + 1}`;
      const name = row['ชื่อ-นามสกุล'] || row['studentName'] || row['NAME'] || row[1];
      const studentId = row['รหัสนักเรียน'] || row['studentId'] || row['ID'] || `670${10 + idx}`;
      const grade = row['ชั้นเรียน'] || row['gradeClass'] || 'ม.4/1';

      if (name) {
        importedStudents.push({
          studentId: String(studentId).trim(),
          fullName: String(name).trim(),
          department: row['แผนก'] || 'แผนกวิทย์-คณิต',
          gradeClass: String(grade).trim(),
          phone: row['เบอร์โทร'] || '081-000-0000',
          week: 12,
          score: 100,
        });
      }
    });

    return { students: importedStudents, logs: importedLogs };
  } catch (err) {
    console.error('Failed to parse details sheet:', err);
    return { students: [], logs: [] };
  }
}

/**
 * Code sample for Google Apps Script for Dataset 1 (Login Users)
 */
export const SAMPLE_LOGIN_APPS_SCRIPT_CODE = `// ===== Google Apps Script สำหรับ Dataset 1: ดึงข้อมูลหน้า Login จาก Google Sheet =====
// ลิงก์ Sheet: ${LOGIN_USERS_SHEET_URL}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var users = [];
    
    // แถวแรกคือ Header (ID, PASSWORD, NAME, POSITION, INSTITUTION)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[0]) { // ตรวจสอบว่ามี ID
        users.push({
          id: String(row[0]).trim(),
          password: String(row[1]).trim(),
          name: row[2] ? String(row[2]).trim() : "ผู้ตรวจ (" + row[0] + ")",
          position: row[3] ? String(row[3]).trim() : "ครูฝ่ายปกครอง",
          institutionCode: row[4] ? String(row[4]).trim() : "SCH-10102"
        });
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify(users))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Post single Student record to Google Sheet via Apps Script
 */
export async function exportStudentToAppsScript(
  student: Student,
  appsScriptUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = appsScriptUrl && appsScriptUrl.trim().startsWith('https://script.google.com')
    ? appsScriptUrl.trim()
    : null;

  if (!url) {
    return {
      success: true,
      message: 'เพิ่มนักเรียนในระบบเรียบร้อย (สามารถกรอก Apps Script URL เพื่อส่งข้อมูลไปยัง Google Sheet โดยตรง)',
    };
  }

  try {
    const payload = {
      action: 'ADD_STUDENT',
      studentId: student.studentId,
      fullName: student.fullName,
      department: student.department || 'แผนกทั่วไป',
      gradeClass: student.gradeClass || 'ม.4/1',
      phone: student.phone || '081-000-0000',
      week: student.week || 12,
      score: student.score || 100,
      timestamp: new Date().toLocaleString('th-TH'),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.type === 'opaque') {
      return { success: true, message: `ส่งข้อมูลนักเรียน ${student.fullName} ไปยัง Google Sheet เรียบร้อยแล้ว!` };
    } else {
      return { success: false, message: 'ไม่สามารถส่งข้อมูลไป Apps Script ได้ (HTTP Status Error)' };
    }
  } catch (err: any) {
    console.error('Error posting student to Apps Script:', err);
    return { success: false, message: `ส่งข้อมูลไป Apps Script ล้มเหลว: ${err.message}` };
  }
}

/**
 * Code sample for Google Apps Script for Dataset 2 (Details / Logs / Students Import & Export)
 */
export const SAMPLE_DETAILS_APPS_SCRIPT_CODE = `// ===== Google Apps Script สำหรับ Dataset 2: นำเข้า/ส่งออกข้อมูลนักเรียน และ รายละเอียดความผิด =====
// ลิงก์ Sheet: ${DETAILS_SHEET_URL}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var logs = [];
    var students = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[0]) {
        // สามารถอ่านได้ทั้งบันทึกความผิดและรายชื่อนักเรียน
        logs.push({
          id: String(row[0]),
          dateTime: String(row[1] || ""),
          studentId: String(row[2] || row[0]),
          studentName: String(row[3] || row[1]),
          gradeClass: String(row[4] || row[3]),
          violations: String(row[5] || "").split(", "),
          totalDeductPoints: Number(row[6]) || 0,
          detailNote: String(row[7] || ""),
          inspectorId: String(row[8] || "-"),
          inspectorName: String(row[9] || "-")
        });

        if (row[2] || row[1]) {
          students.push({
            studentId: String(row[2] || row[0]),
            fullName: String(row[3] || row[1]),
            department: String(row[4] || "แผนกทั่วไป"),
            gradeClass: String(row[4] || "ม.4/1"),
            phone: String(row[7] || "081-000-0000"),
            score: 100
          });
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", students: students, logs: logs }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    // หากเป็นข้อมูลการเพิ่มนักเรียนใหม่ (ADD_STUDENT)
    if (data.action === "ADD_STUDENT" || (data.studentId && !data.violations)) {
      var studentSheet = ss.getSheetByName("Students") || ss.getActiveSheet();
      
      if (studentSheet.getLastRow() === 0) {
        studentSheet.appendRow([
          "รหัสนักเรียน", "ชื่อ-นามสกุล", "แผนก/สายการเรียน", "ชั้นเรียน", "เบอร์โทร", "คะแนนเริ่มต้น", "วันที่บันทึก"
        ]);
      }

      studentSheet.appendRow([
        data.studentId || "-",
        data.fullName || "-",
        data.department || "-",
        data.gradeClass || "-",
        data.phone || "-",
        data.score || 100,
        data.timestamp || new Date().toLocaleString("th-TH")
      ]);

      return ContentService
        .createTextOutput(JSON.stringify({ result: "success", message: "บันทึกข้อมูลนักเรียนลง Google Sheet เรียบร้อยแล้ว" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // กรณีบันทึกความผิดนักเรียน (Inspection Log)
    var logSheet = ss.getSheetByName("Logs") || ss.getActiveSheet();
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow([
        "ID รายการ", "วันที่-เวลา", "รหัสนักเรียน", "ชื่อนักเรียน",
        "ชั้นเรียน", "รายการความผิด", "คะแนนหัก", "รายละเอียด",
        "รหัสผู้ตรวจ", "ชื่อผู้ตรวจ"
      ]);
    }

    logSheet.appendRow([
      data.id || ("LOG-" + new Date().getTime()),
      data.dateTime || new Date().toLocaleString("th-TH"),
      data.studentId || "-",
      data.studentName || "-",
      data.gradeClass || "-",
      Array.isArray(data.violations) ? data.violations.join(", ") : (data.violations || "-"),
      data.totalDeductPoints || 0,
      data.detailNote || "-",
      data.inspectorId || "-",
      data.inspectorName || "-"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "บันทึกข้อมูลสำเร็จ" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
