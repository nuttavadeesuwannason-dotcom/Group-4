import React, { useState, useMemo } from 'react';
import { Student, ViolationCategory, InspectionLog, User } from '../types';
import { GRADE_CLASS_LIST } from '../data/initialData';
import { 
  UserCheck, 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Save, 
  RotateCcw, 
  FileText, 
  Phone, 
  Calendar, 
  Award,
  CheckCircle2,
  Sparkles,
  UserX
} from 'lucide-react';

interface ViolationFormProps {
  students: Student[];
  categories: ViolationCategory[];
  currentUser: User;
  onSaveInspection: (log: Omit<InspectionLog, 'id'>) => void;
}

export const ViolationForm: React.FC<ViolationFormProps> = ({
  students,
  categories,
  currentUser,
  onSaveInspection,
}) => {
  // Form state
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [detailNote, setDetailNote] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [lastSubmittedLog, setLastSubmittedLog] = useState<InspectionLog | null>(null);

  // Filter student candidates based on Grade dropdown and Student ID search input
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchGrade = selectedGrade === '' || student.gradeClass === selectedGrade;
      const matchSearch =
        studentSearch === '' ||
        student.studentId.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [students, selectedGrade, studentSearch]);

  // Selected Student Object
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.studentId === selectedStudentId);
  }, [students, selectedStudentId]);

  // Calculate total points to deduct
  const totalDeductPoints = useMemo(() => {
    return selectedCategories.reduce((sum, catCode) => {
      const category = categories.find((c) => c.code === catCode);
      return sum + (category ? category.deductPoints : 0);
    }, 0);
  }, [selectedCategories, categories]);

  // Toggle category checkbox
  const handleToggleCategory = (catCode: string) => {
    if (selectedCategories.includes(catCode)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catCode));
    } else {
      setSelectedCategories([...selectedCategories, catCode]);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      alert('กรุณาเลือกรหัสนักเรียนของผู้ที่ผิดระเบียบ');
      return;
    }

    if (selectedCategories.length === 0) {
      alert('กรุณาเลือกรายการความผิดอย่างน้อย 1 ข้อ');
      return;
    }

    const violationNames = selectedCategories.map((code) => {
      const found = categories.find((c) => c.code === code);
      return found ? found.name : code;
    });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const dateTimeFormatted = `${dateStr} ${timeStr}`;

    const newLogData: Omit<InspectionLog, 'id'> = {
      dateTime: dateTimeFormatted,
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.fullName,
      gradeClass: selectedStudent.gradeClass,
      violations: violationNames,
      totalDeductPoints: totalDeductPoints,
      detailNote: detailNote.trim() || 'ไม่มีรายละเอียดเพิ่มเติม',
      inspectorId: currentUser.id,
      inspectorName: currentUser.name,
    };

    onSaveInspection(newLogData);

    const generatedLog: InspectionLog = {
      ...newLogData,
      id: `LOG-${Date.now().toString().slice(-6)}`,
    };

    setLastSubmittedLog(generatedLog);
    setShowSuccessModal(true);
  };

  const handleResetForm = () => {
    setSelectedStudentId('');
    setStudentSearch('');
    setSelectedCategories([]);
    setDetailNote('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>แบบฟอร์มตรวจเช็คพฤติกรรมประจำวัน</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            กรอกข้อมูลบันทึกความผิดระเบียบนักเรียน
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ค้นหานักเรียน เลือกรายการความผิด ตรวจสอบคะแนน และกดบันทึกเพื่อหักคะแนนพฤติกรรม
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            {currentUser.id.split('-')[1] || '01'}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{currentUser.name}</div>
            <div className="text-slate-500">{currentUser.position}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Selection & Details */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>1. ค้นหาและเลือกรหัสนักเรียน</span>
              </h3>
              <span className="text-[11px] text-slate-400">ระบุชั้นเรียน / รหัส</span>
            </div>

            {/* Dropdown Grade/Class Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>เลือกระดับชั้น / ห้องเรียน (Dropdown):</span>
              </label>
              <select
                id="select-grade-class"
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setSelectedStudentId('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">-- แสดงนักเรียนทุกชั้นเรียน --</option>
                {GRADE_CLASS_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Student ID Search Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ค้นหารหัสนักเรียน หรือ ชื่อ-สกุล:
              </label>
              <div className="relative">
                <input
                  id="input-student-search"
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="พิมพ์รหัสนักเรียน e.g. 67001 หรือ ชื่อ..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Student Candidates Dropdown List */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คลิกเลือกนักเรียนที่ทำผิดกฎ ({filteredStudents.length} คน):
              </label>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const isSelected = selectedStudentId === s.studentId;
                    return (
                      <button
                        key={s.studentId}
                        type="button"
                        onClick={() => setSelectedStudentId(s.studentId)}
                        className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white font-medium'
                            : 'hover:bg-blue-50/80 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            <span className="font-mono">{s.studentId}</span>
                            <span>• {s.fullName}</span>
                          </div>
                          <div className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {s.gradeClass} ({s.department})
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : s.score >= 80
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {s.score} คะแนน
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                    <UserX className="w-5 h-5 text-slate-300" />
                    <span>ไม่พบรายชื่อนักเรียนที่ตรงกับเงื่อนไข</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Student Card Display */}
          {selectedStudent ? (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-lg space-y-3 border border-indigo-900">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{selectedStudent.fullName}</h4>
                    <p className="text-[11px] text-blue-200">รหัสนักเรียน: {selectedStudent.studentId}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedStudent.gradeClass}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">แผนก/สายการเรียน</span>
                  <span className="font-medium text-slate-200">{selectedStudent.department}</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">เบอร์โทรติดต่อ</span>
                  <span className="font-medium text-slate-200 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-400" />
                    {selectedStudent.phone}
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">สัปดาห์บันทึก</span>
                  <span className="font-medium text-slate-200 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    สัปดาห์ที่ {selectedStudent.week}
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">คะแนนคงเหลือปัจจุบัน</span>
                  <span className="font-bold text-amber-300 flex items-center gap-1 text-sm">
                    <Award className="w-4 h-4 text-amber-400" />
                    {selectedStudent.score} / 100
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">ยังไม่ได้เลือกรหัสนักเรียน:</strong>
                โปรดเลือกรหัสนักเรียนจากรายการด้านบนเพื่อดูข้อมูลส่วนตัวและบันทึกคะแนนที่ถูกหัก
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Violation Checklists & Details */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>2. เลือกรายการผิดระเบียบ (เลือกได้มากกว่า 1 ข้อ)</span>
              </h3>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                เลือกแล้ว {selectedCategories.length} ข้อ
              </span>
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const isChecked = selectedCategories.includes(cat.code);
                return (
                  <div
                    key={cat.code}
                    onClick={() => handleToggleCategory(cat.code)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="mt-0.5 text-blue-600 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 fill-blue-600 text-white" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold ${isChecked ? 'text-blue-900' : 'text-slate-800'}`}>
                          {cat.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                        -{cat.deductPoints} คะแนน
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Detail Field */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>รายละเอียดเพิ่มเติม (Additional Details):</span>
              </label>
              <textarea
                id="textarea-detail-note"
                rows={3}
                value={detailNote}
                onChange={(e) => setDetailNote(e.target.value)}
                placeholder="ระบุสถานที่ที่ตรวจพบ หรือรายละเอียดเพิ่มเติมเกี่ยวกับการทำผิดกฎ..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Live Calculation Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div>
                <span className="text-xs text-slate-400 block">สรุปการหักคะแนนครั้งนี้:</span>
                <div className="text-xl font-extrabold text-rose-400 flex items-center gap-2">
                  <span>-{totalDeductPoints} คะแนน</span>
                  {selectedStudent && (
                    <span className="text-xs font-normal text-slate-300">
                      (คะแนนคงเหลือหลังหัก: <strong className="text-amber-300">{selectedStudent.score - totalDeductPoints}</strong>)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างข้อมูล</span>
                </button>

                <button
                  id="btn-submit-violation"
                  type="submit"
                  disabled={!selectedStudent || selectedCategories.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                    selectedStudent && selectedCategories.length > 0
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการเช็คความผิด</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && lastSubmittedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">บันทึกความผิดเรียบร้อยแล้ว!</h3>
              <p className="text-xs text-slate-500 mt-1">
                ระบบได้ทำการตัดคะแนนพฤติกรรมและบันทึกลงในประวัติเรียบร้อยแล้ว
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>เลขที่รายการ:</span>
                <span className="font-mono font-bold text-slate-900">{lastSubmittedLog.id}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>นักเรียน:</span>
                <span className="font-bold text-slate-900">
                  {lastSubmittedLog.studentName} ({lastSubmittedLog.gradeClass})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>รายการความผิด:</span>
                <span className="font-semibold text-rose-600 text-right">
                  {lastSubmittedLog.violations.join(', ')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
                <span>คะแนนที่ถูกหัก:</span>
                <span className="font-bold text-rose-600 text-sm">-{lastSubmittedLog.totalDeductPoints} คะแนน</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                handleResetForm();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              ตกลง และกรอกรายถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
