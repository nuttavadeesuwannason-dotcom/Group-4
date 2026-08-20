import React, { useState } from 'react';
import { User, Student, InspectionLog, ViolationCategory } from '../types';
import { 
  Database, 
  Table, 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  AlertOctagon, 
  Plus, 
  RotateCcw, 
  Download, 
  CheckCircle,
  Key,
  FileSpreadsheet
} from 'lucide-react';
import { GoogleSheetIntegrationPanel } from './GoogleSheetIntegrationPanel';
import { exportStudentToAppsScript } from '../services/googleSheetService';

interface DatabaseViewerProps {
  users: User[];
  students: Student[];
  logs: InspectionLog[];
  categories: ViolationCategory[];
  onAddStudent: (newStudent: Student) => void;
  onAddCategory: (newCategory: ViolationCategory) => void;
  onResetData: () => void;
  onSyncUsersFromSheet: (appsScriptUrl?: string) => Promise<number>;
  onImportDetailsFromSheet: (appsScriptUrl?: string) => Promise<{ studentCount: number; logCount: number }>;
  onExportLogsToAppsScript?: (appsScriptUrl: string) => Promise<boolean>;
}

export const DatabaseViewer: React.FC<DatabaseViewerProps> = ({
  users,
  students,
  logs,
  categories,
  onAddStudent,
  onAddCategory,
  onResetData,
  onSyncUsersFromSheet,
  onImportDetailsFromSheet,
  onExportLogsToAppsScript,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'students' | 'logs' | 'categories' | 'googlesheet'>('googlesheet');

  // Modal State for Adding New Student
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStdId, setNewStdId] = useState('');
  const [newStdName, setNewStdName] = useState('');
  const [newStdDept, setNewStdDept] = useState('แผนกวิทย์-คณิต');
  const [newStdGrade, setNewStdGrade] = useState('ม.4/1');
  const [newStdPhone, setNewStdPhone] = useState('081-000-0000');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [syncToSheet, setSyncToSheet] = useState(true);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [studentSyncMsg, setStudentSyncMsg] = useState<string | null>(null);

  // Modal State for Adding New Violation Category
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatCode, setNewCatCode] = useState(`V00${categories.length + 1}`);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPoints, setNewCatPoints] = useState(5);
  const [newCatDesc, setNewCatDesc] = useState('');

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStdId || !newStdName) return;

    setIsSubmittingStudent(true);
    setStudentSyncMsg(null);

    const newStudentObj: Student = {
      studentId: newStdId.trim(),
      fullName: newStdName.trim(),
      department: newStdDept,
      gradeClass: newStdGrade,
      phone: newStdPhone.trim(),
      week: 12,
      score: 100,
    };

    // Save to local app state
    onAddStudent(newStudentObj);

    // If sync to Google Sheet is enabled
    if (syncToSheet) {
      setStudentSyncMsg('กำลังบันทึกนักเรียนไปยัง Google Sheet...');
      const result = await exportStudentToAppsScript(newStudentObj, appsScriptUrl);
      if (result.success) {
        setStudentSyncMsg(`✅ ${result.message}`);
      } else {
        setStudentSyncMsg(`⚠️ ${result.message}`);
      }
    } else {
      setStudentSyncMsg('✅ บันทึกนักเรียนในระบบเรียบร้อยแล้ว');
    }

    setIsSubmittingStudent(false);
    setTimeout(() => {
      setShowAddStudentModal(false);
      setNewStdId('');
      setNewStdName('');
      setStudentSyncMsg(null);
    }, 1200);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatCode || !newCatName) return;

    onAddCategory({
      code: newCatCode.trim().toUpperCase(),
      name: newCatName.trim(),
      deductPoints: Number(newCatPoints),
      description: newCatDesc.trim() || 'เกณฑ์กำหนดโทษความผิดวินัยนักเรียน',
    });

    setShowAddCatModal(false);
    setNewCatName('');
    setNewCatDesc('');
  };

  const handleExportJSON = () => {
    const fullDbData = {
      users,
      students,
      inspectionLogs: logs,
      violationCategories: categories,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullDbData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_conduct_db_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* DB Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>โครงสร้างและตารางข้อมูล (Database Tables Inspector)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              จัดการตารางฐานข้อมูลในระบบ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงโครงสร้างข้อมูล 4 ตารางตามการออกแบบ: ผู้ใช้งาน, รายชื่อนักเรียน, บันทึกการเช็ค, และเกณฑ์คะแนนความผิด
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export DB (JSON)</span>
            </button>
            <button
              onClick={() => {
                if (confirm('คุณต้องการรีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นสาธิตหรือไม่?')) {
                  onResetData();
                }
              }}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* Database Table Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
          <button
            onClick={() => setActiveSubTab('googlesheet')}
            className={`p-3 rounded-xl border text-left transition-all col-span-2 md:col-span-1 ${
              activeSubTab === 'googlesheet'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
                : 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-5 h-5 mb-1 text-emerald-500" />
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-950/20 text-emerald-300">Google Sheet</span>
            </div>
            <div className="text-xs font-bold">Google Sheet Apps Script</div>
            <div className={`text-[10px] ${activeSubTab === 'googlesheet' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              (Dataset 1 & 2 Middleware)
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('students')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeSubTab === 'students'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <GraduationCap className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold font-mono">{students.length} รายการ</span>
            </div>
            <div className="text-xs font-bold">1. ตารางนักเรียน</div>
            <div className={`text-[10px] ${activeSubTab === 'students' ? 'text-blue-100' : 'text-slate-500'}`}>
              (Student Table)
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeSubTab === 'logs'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <ClipboardCheck className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold font-mono">{logs.length} รายการ</span>
            </div>
            <div className="text-xs font-bold">2. ตารางการเช็ค</div>
            <div className={`text-[10px] ${activeSubTab === 'logs' ? 'text-blue-100' : 'text-slate-500'}`}>
              (Inspection Log)
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeSubTab === 'categories'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <AlertOctagon className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold font-mono">{categories.length} ข้อหา</span>
            </div>
            <div className="text-xs font-bold">3. เกณฑ์คะแนน</div>
            <div className={`text-[10px] ${activeSubTab === 'categories' ? 'text-blue-100' : 'text-slate-500'}`}>
              (Criteria Table)
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeSubTab === 'users'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold font-mono">{users.length} คน</span>
            </div>
            <div className="text-xs font-bold">4. ตารางผู้ตรวจ</div>
            <div className={`text-[10px] ${activeSubTab === 'users' ? 'text-blue-100' : 'text-slate-500'}`}>
              (User Table)
            </div>
          </button>
        </div>
      </div>

      {/* Table Content View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Google Sheet Integration Panel */}
        {activeSubTab === 'googlesheet' && (
          <GoogleSheetIntegrationPanel
            users={users}
            students={students}
            logs={logs}
            onSyncUsersFromSheet={onSyncUsersFromSheet}
            onImportDetailsFromSheet={onImportDetailsFromSheet}
            onExportLogsToAppsScript={onExportLogsToAppsScript}
          />
        )}
        {/* Table 1: Students */}
        {activeSubTab === 'students' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">ตารางข้อมูลนักเรียน (Student Table)</h3>
                <p className="text-[11px] text-slate-500">ฟิลด์: [รหัสนักเรียน (PK), ชื่อ-สกุล, แผนก, ชั้นเรียน, เบอร์โทร, สัปดาห์, คะแนน]</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('googlesheet');
                  }}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>จัดการ Google Sheet</span>
                </button>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มนักเรียนใหม่ (พร้อมส่งไป Google Sheet)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
                    <th className="p-3 font-semibold">รหัสนักเรียน (PK)</th>
                    <th className="p-3 font-semibold">ชื่อ-นามสกุล</th>
                    <th className="p-3 font-semibold">แผนก/สายการเรียน</th>
                    <th className="p-3 font-semibold">ชั้นเรียน</th>
                    <th className="p-3 font-semibold">เบอร์โทร</th>
                    <th className="p-3 font-semibold">สัปดาห์</th>
                    <th className="p-3 font-semibold text-right">คะแนนพฤติกรรม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {students.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{s.studentId}</td>
                      <td className="p-3 font-medium">{s.fullName}</td>
                      <td className="p-3 text-slate-600">{s.department}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{s.gradeClass}</span></td>
                      <td className="p-3 font-mono text-slate-600">{s.phone}</td>
                      <td className="p-3 text-slate-600">สัปดาห์ที่ {s.week}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          s.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {s.score} คะแนน
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table 2: Inspection Logs */}
        {activeSubTab === 'logs' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">บันทึกตารางการเช็ค (Inspection Log Table)</h3>
              <p className="text-[11px] text-slate-500">ฟิลด์: [ID รายการ (PK), วันที่-เวลา, รหัสนักเรียนที่ผิดกฎ (FK), รายการความผิด, คะแนนที่ถูกหัก, รหัสผู้ตรวจ (FK)]</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
                    <th className="p-3 font-semibold">ID รายการ (PK)</th>
                    <th className="p-3 font-semibold">วันที่-เวลา</th>
                    <th className="p-3 font-semibold">รหัสนักเรียน (FK)</th>
                    <th className="p-3 font-semibold">ชื่อนักเรียน</th>
                    <th className="p-3 font-semibold">รายการความผิด</th>
                    <th className="p-3 font-semibold">คะแนนที่ถูกหัก</th>
                    <th className="p-3 font-semibold">รหัสผู้ตรวจ (FK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{l.id}</td>
                      <td className="p-3 text-slate-600 font-mono">{l.dateTime}</td>
                      <td className="p-3 font-mono text-blue-600 font-bold">{l.studentId}</td>
                      <td className="p-3 font-medium">{l.studentName} ({l.gradeClass})</td>
                      <td className="p-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {l.violations.map((v, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700">
                              {v}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-rose-600">-{l.totalDeductPoints}</td>
                      <td className="p-3 font-mono text-indigo-600">{l.inspectorId} ({l.inspectorName})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table 3: Violation Categories */}
        {activeSubTab === 'categories' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">ตารางประเภทความผิดและเกณฑ์คะแนน (Criteria Table)</h3>
                <p className="text-[11px] text-slate-500">ฟิลด์: [รหัสข้อหา (PK), ชื่อความผิด, คะแนนที่ต้องหัก, คำอธิบายเพิ่มเติม]</p>
              </div>
              <button
                onClick={() => setShowAddCatModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มข้อหาใหม่</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
                    <th className="p-3 font-semibold">รหัสข้อหา (PK)</th>
                    <th className="p-3 font-semibold">ชื่อความผิด</th>
                    <th className="p-3 font-semibold">คะแนนที่ต้องหัก</th>
                    <th className="p-3 font-semibold">รายละเอียดคำอธิบาย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {categories.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{c.code}</td>
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold font-mono">
                          -{c.deductPoints} คะแนน
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{c.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table 4: Users / Inspectors */}
        {activeSubTab === 'users' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">ตารางข้อมูลผู้ใช้งาน / ผู้ตรวจ (User Table)</h3>
              <p className="text-[11px] text-slate-500">ฟิลด์: [ID ผู้ตรวจ (PK), ชื่อ-นามสกุล, ตำแหน่ง, รหัสผ่าน]</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
                    <th className="p-3 font-semibold">ID ผู้ตรวจ (PK)</th>
                    <th className="p-3 font-semibold">ชื่อ-นามสกุล</th>
                    <th className="p-3 font-semibold">ตำแหน่ง</th>
                    <th className="p-3 font-semibold">รหัสผ่าน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{u.id}</td>
                      <td className="p-3 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3 text-slate-600">{u.position}</td>
                      <td className="p-3 font-mono text-slate-400">•••••••• ({u.password})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddStudentSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">เพิ่มข้อมูลนักเรียนใหม่</h3>
                <p className="text-[11px] text-slate-500">บันทึกข้อมูลลงฐานข้อมูลระบบ และส่งไปยัง Google Sheet</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Google Sheet Ready</span>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">รหัสนักเรียน (Student ID): <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newStdId}
                  onChange={(e) => setNewStdId(e.target.value)}
                  placeholder="เช่น 67011"
                  className="w-full p-2 bg-slate-50 border rounded-xl font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">ชื่อ-นามสกุล: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newStdName}
                  onChange={(e) => setNewStdName(e.target.value)}
                  placeholder="นายกษิดิศ ศรีสุข"
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">แผนก/สายการเรียน:</label>
                  <input
                    type="text"
                    value={newStdDept}
                    onChange={(e) => setNewStdDept(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ชั้นเรียน:</label>
                  <input
                    type="text"
                    value={newStdGrade}
                    onChange={(e) => setNewStdGrade(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">เบอร์โทรติดต่อ:</label>
                <input
                  type="text"
                  value={newStdPhone}
                  onChange={(e) => setNewStdPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              {/* Google Sheet Sync Option */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 mt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToSheet}
                    onChange={(e) => setSyncToSheet(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>บันทึกข้อมูลไปที่ Google Sheet (Apps Script)</span>
                </label>
                
                {syncToSheet && (
                  <div>
                    <label className="block text-[10px] text-emerald-800 font-medium mb-1">
                      Apps Script Web App URL (ตัวเลือก):
                    </label>
                    <input
                      type="url"
                      value={appsScriptUrl}
                      onChange={(e) => setAppsScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full p-1.5 text-[11px] bg-white border border-emerald-300 rounded-lg font-mono"
                    />
                    <p className="text-[10px] text-emerald-700 mt-1">
                      หากเว้นว่าง ระบบจะใช้ค่าเริ่มต้นจาก Google Sheet Dataset 2
                    </p>
                  </div>
                )}
              </div>

              {studentSyncMsg && (
                <div className="p-2 text-xs rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                  {studentSyncMsg}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                disabled={isSubmittingStudent}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmittingStudent}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isSubmittingStudent ? 'กำลังบันทึก...' : 'บันทึกนักเรียนลง Google Sheet'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddCategorySubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">เพิ่มเกณฑ์ความผิดและคะแนน</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">รหัสข้อหา (Violation Code):</label>
                <input
                  type="text"
                  required
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  placeholder="เช่น V009"
                  className="w-full p-2 bg-slate-50 border rounded-xl font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">ชื่อความผิด:</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="เช่น นำบุหรี่หรือสิ่งเสพติดเข้าโรงเรียน"
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">คะแนนที่ต้องหัก (Points Deducted):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={newCatPoints}
                  onChange={(e) => setNewCatPoints(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">คำอธิบายเพิ่มเติม:</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                บันทึกเกณฑ์ข้อหา
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
