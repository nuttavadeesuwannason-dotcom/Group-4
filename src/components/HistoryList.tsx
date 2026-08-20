import React, { useState, useMemo } from 'react';
import { InspectionLog, Student, ViolationCategory } from '../types';
import { GRADE_CLASS_LIST } from '../data/initialData';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  UserCheck, 
  Clock, 
  FileText,
  RotateCcw,
  Sparkles,
  ChevronRight,
  X,
  FileSpreadsheet,
  Download,
  RefreshCw
} from 'lucide-react';

interface HistoryListProps {
  logs: InspectionLog[];
  students: Student[];
  categories: ViolationCategory[];
  onUpdateLog: (updatedLog: InspectionLog) => void;
  onDeleteLog: (logId: string) => void;
  onOpenPrintModal: (log: InspectionLog) => void;
  onImportDetailsFromSheet?: (appsScriptUrl?: string) => Promise<{ studentCount: number; logCount: number }>;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  logs,
  students,
  categories,
  onUpdateLog,
  onDeleteLog,
  onOpenPrintModal,
  onImportDetailsFromSheet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  
  // Edit Modal State
  const [editingLog, setEditingLog] = useState<InspectionLog | null>(null);
  const [editViolations, setEditViolations] = useState<string[]>([]);
  const [editNote, setEditNote] = useState('');

  // Delete Confirmation Modal State
  const [deletingLog, setDeletingLog] = useState<InspectionLog | null>(null);

  // Import Apps Script Modal State for Dataset 2
  const [showImportModal, setShowImportModal] = useState(false);
  const [customAppsScriptUrl, setCustomAppsScriptUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResultMsg, setImportResultMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleExecuteImportDetails = async () => {
    if (!onImportDetailsFromSheet) return;
    setIsImporting(true);
    setImportResultMsg(null);
    try {
      const res = await onImportDetailsFromSheet(customAppsScriptUrl);
      setImportResultMsg({
        type: 'success',
        text: `นำเข้าข้อมูลชุดที่ 2 ผ่าน Apps Script สำเร็จ! (เพิ่มนักเรียนใหม่ ${res.studentCount} คน, เพิ่มประวัติความผิด ${res.logCount} รายการ)`,
      });
    } catch (err: any) {
      setImportResultMsg({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการดึงข้อมูล: ${err.message || 'ไม่สามารถเชื่อมต่อกับ Apps Script'}`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchGrade = selectedGrade === '' || log.gradeClass === selectedGrade;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        term === '' ||
        log.studentId.toLowerCase().includes(term) ||
        (log.studentName && log.studentName.toLowerCase().includes(term)) ||
        (log.inspectorName && log.inspectorName.toLowerCase().includes(term)) ||
        log.id.toLowerCase().includes(term) ||
        log.violations.some((v) => v.toLowerCase().includes(term));
      return matchGrade && matchSearch;
    });
  }, [logs, selectedGrade, searchTerm]);

  // Open Edit Modal
  const handleStartEdit = (log: InspectionLog) => {
    setEditingLog(log);
    setEditViolations([...log.violations]);
    setEditNote(log.detailNote);
  };

  // Toggle edit violation item
  const handleToggleEditViolation = (catName: string) => {
    if (editViolations.includes(catName)) {
      setEditViolations(editViolations.filter((v) => v !== catName));
    } else {
      setEditViolations([...editViolations, catName]);
    }
  };

  // Save Edit Changes
  const handleSaveEdit = () => {
    if (!editingLog) return;

    if (editViolations.length === 0) {
      alert('กรุณาเลือกความผิดอย่างน้อย 1 ข้อ หากต้องการยกเลิกการติ๊กความผิดทั้งหมด ให้ใช้ปุ่มลบรายการแทน');
      return;
    }

    // Recalculate total deducted points
    const newTotalPoints = editViolations.reduce((sum, vName) => {
      const found = categories.find((c) => c.name === vName);
      return sum + (found ? found.deductPoints : 5);
    }, 0);

    const updated: InspectionLog = {
      ...editingLog,
      violations: editViolations,
      totalDeductPoints: newTotalPoints,
      detailNote: editNote.trim() || 'ไม่มีรายละเอียดเพิ่มเติม',
    };

    onUpdateLog(updated);
    setEditingLog(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingLog) return;
    onDeleteLog(deletingLog.id);
    setDeletingLog(null);
  };

  // Calculate quick summary metrics
  const totalDeductedAll = useMemo(() => {
    return filteredLogs.reduce((sum, l) => sum + l.totalDeductPoints, 0);
  }, [filteredLogs]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>ประวัติการตรวจย้อนหลัง & สถานะหักคะแนน</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              ประวัติการตรวจเช็คระเบียบวินัย
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ค้นหารหัสนักเรียนเพื่อดูประวัติย้อนหลัง พร้อมปุ่มแก้ไขหรือลบรายการกรณีผู้ตรวจติ๊กผิดพลาด
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>นำเข้าข้อมูลผ่าน Apps Script (ชุดที่ 2)</span>
            </button>
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">จำนวนรายการ</span>
              <span className="text-lg font-extrabold text-slate-900">{filteredLogs.length} รายการ</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] text-rose-600 uppercase block font-semibold">รวมหักคะแนน</span>
              <span className="text-lg font-extrabold text-rose-700">-{totalDeductedAll} คะแนน</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4">
          <div className="md:col-span-8 relative">
            <input
              id="input-history-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารหัสนักเรียน (เช่น 67001), ชื่อนักเรียน, ชื่อผู้ตรวจ หรือความผิด..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-4">
            <select
              id="select-history-grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="">-- กรองชั้นเรียนทั้งหมด --</option>
              {GRADE_CLASS_LIST.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History Cards / Table */}
      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const studentObj = students.find((s) => s.studentId === log.studentId);
            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                      {log.gradeClass || 'ม.4/1'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {log.studentName || 'นักเรียน'}
                        </span>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          รหัส: {log.studentId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {log.dateTime}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          ผู้ตรวจ: {log.inspectorName || log.inspectorId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                      -{log.totalDeductPoints} คะแนน
                    </span>

                    {/* Print Slip Button */}
                    <button
                      onClick={() => onOpenPrintModal(log)}
                      title="พิมพ์ใบเตือน/หลักฐาน"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline text-[11px]">พิมพ์</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleStartEdit(log)}
                      title="แก้ไขความผิดกรณีติ๊กพลาด"
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200 transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">แก้ไข</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingLog(log)}
                      title="ลบรายการบันทึกผิด"
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">ลบ</span>
                    </button>
                  </div>
                </div>

                {/* Violations Chips & Detail Note */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  <div className="md:col-span-7 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">รายการความผิดที่ตรวจพบ:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {log.violations.map((v, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium border border-slate-200 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">รายละเอียดเพิ่มเติม:</span>
                    <p className="italic text-slate-700 leading-relaxed">
                      "{log.detailNote || 'ไม่มีรายละเอียดเพิ่มเติม'}"
                    </p>
                    {studentObj && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 flex justify-between">
                        <span>คะแนนพฤติกรรมคงเหลือในระบบ:</span>
                        <span className="font-bold text-blue-700">{studentObj.score} คะแนน</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">ไม่พบประวัติการโดนหักคะแนนที่ค้นหา</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหา หรือเลือกระดับชั้นเรียนอื่น หรือกดล้างคำค้นหา
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGrade('');
                }}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                ล้างคำค้นหาทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>แก้ไขรายการความผิด (ID: {editingLog.id})</span>
              </h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <strong>นักเรียน:</strong> {editingLog.studentName} ({editingLog.studentId}) ชั้น {editingLog.gradeClass}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                เลือกรายการความผิดใหม่:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
                {categories.map((c) => {
                  const isChecked = editViolations.includes(c.name);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleToggleEditViolation(c.name)}
                      className={`w-full text-left p-2 rounded-xl text-xs border transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-blue-50 border-blue-400 font-semibold text-blue-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] font-bold text-rose-600">-{c.deductPoints} คะแนน</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดเพิ่มเติม:
              </label>
              <textarea
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบรายการบันทึกนี้?</h3>
              <p className="text-xs text-slate-500">
                เมื่อลบรายการนี้แล้ว คะแนน <strong className="text-emerald-600">+{deletingLog.totalDeductPoints} คะแนน</strong> จะถูกคืนกลับให้แก่นักเรียนโดยอัตโนมัติ
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><strong>รายการ:</strong> {deletingLog.id}</div>
              <div><strong>นักเรียน:</strong> {deletingLog.studentName} ({deletingLog.studentId})</div>
              <div><strong>ความผิด:</strong> {deletingLog.violations.join(', ')}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingLog(null)}
                className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset 2 Import Modal via Google Apps Script */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">นำเข้าข้อมูลชุดที่ 2 ผ่าน Google Apps Script</h3>
                  <p className="text-[11px] text-slate-500">ดึงข้อมูลรายชื่อนักเรียนและประวัติความผิดลงในระบบ</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResultMsg(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ระบุ Google Apps Script Web App URL (Dataset 2 Middleware):
                </label>
                <input
                  type="url"
                  value={customAppsScriptUrl}
                  onChange={(e) => setCustomAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 หากเว้นว่างไว้ ระบบจะใช้ค่าเริ่มต้นจาก URL ของ Google Sheet ชุดที่ 2 ที่ตั้งไว้แล้ว
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                <div className="font-bold text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ข้อมูลที่ดึงมาเข้าสู่ระบบ:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                  <li>รายชื่อนักเรียน รหัสนักเรียน ชั้นเรียน และคะแนนคงเหลือ</li>
                  <li>ประวัติการตรวจหักคะแนนย้อนหลังและรายละเอียดหมายเหตุ</li>
                </ul>
              </div>

              {importResultMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    importResultMsg.type === 'success'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                      : importResultMsg.type === 'error'
                      ? 'bg-rose-100 border-rose-300 text-rose-900'
                      : 'bg-blue-100 border-blue-300 text-blue-900'
                  }`}
                >
                  {importResultMsg.text}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResultMsg(null);
                }}
                disabled={isImporting}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                ปิด
              </button>
              <button
                onClick={handleExecuteImportDetails}
                disabled={isImporting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังดึงข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>ดึงและนำเข้าข้อมูลทันที (Import Data)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
