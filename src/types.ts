export interface User {
  id: string; // ID ผู้ใช้งาน e.g. INS-001, ADMIN-01
  name: string; // ชื่อ-นามสกุล
  position: string; // ตำแหน่ง e.g. ครูฝ่ายปกครอง, กรรมการสภานักเรียน, ผู้ดูแลระบบ
  password?: string; // รหัสผ่าน
  institutionCode?: string; // รหัสสถาบัน/องค์กร
  role?: 'admin' | 'user'; // บทบาท: admin = ผู้ดูแลระบบ, user = ผู้ใช้งานทั่วไป
}

export interface Student {
  studentId: string; // รหัสนักเรียน e.g. 67001
  fullName: string; // ชื่อ-นามสกุล
  department: string; // แผนก/สายการเรียน e.g. วิทย์-คณิต, สามัญ, ช่างไฟฟ้า
  gradeClass: string; // ชั้นเรียน e.g. ม.4/1, ม.5/2, ปวช.1/2
  phone: string; // เบอร์โทร
  week: number; // สัปดาห์ e.g. 1-20
  score: number; // คะแนนพฤติกรรมเริ่มต้น (100)
}

export interface ViolationCategory {
  code: string; // รหัสข้อหา e.g. V001
  name: string; // ชื่อความผิด e.g. ทรงผมไม่ถูกต้อง
  deductPoints: number; // คะแนนที่ต้องหัก e.g. 5
  description?: string; // คำอธิบายเพิ่มเติม
}

export interface InspectionLog {
  id: string; // ID รายการ e.g. LOG-2026-001
  dateTime: string; // วันที่-เวลา e.g. 2026-07-23 08:15
  studentId: string; // รหัสนักเรียนที่ผิดกฎ
  studentName?: string; // ชื่อนักเรียน (เพื่อแสดงผลสะดวก)
  gradeClass?: string; // ชั้นเรียน
  violations: string[]; // รายการความผิด e.g. ["ทรงผม", "เสื้อผ้า"]
  totalDeductPoints: number; // คะแนนที่ถูกหักรวม
  detailNote: string; // รายละเอียดเพิ่มเติม
  inspectorId: string; // รหัสผู้ตรวจ
  inspectorName?: string; // ชื่อผู้ตรวจ
}

export interface FilterOptions {
  searchQuery: string;
  gradeClass: string;
  week: string;
  dateRange: string;
}
