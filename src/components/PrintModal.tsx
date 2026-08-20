import React from 'react';
import { InspectionLog, Student } from '../types';
import { Printer, X, ShieldCheck, School, CheckCircle, Calendar, UserCheck } from 'lucide-react';

interface PrintModalProps {
  log: InspectionLog | null;
  student?: Student;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ log, student, onClose }) => {
  if (!log) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">พิมพ์ใบบันทึกการแจ้งตัดคะแนนความผิด</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Content */}
        <div className="border-2 border-slate-900 rounded-2xl p-6 space-y-5 bg-white text-slate-900">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">ใบบันทึกการแจ้งตัดคะแนนความผิดระเบียบวินัย</h2>
            <p className="text-xs font-medium text-slate-700">ฝ่ายปกครอง และคณะกรรมการตรวจระเบียบวินัยนักเรียน</p>
            <p className="text-[11px] text-slate-500 font-mono">เลขที่รายการ: {log.id} • วันที่ออกเอกสาร: {log.dateTime}</p>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">ชื่อ-นามสกุล นักเรียน:</span>
              <strong className="text-sm font-bold">{log.studentName || 'นักเรียน'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">รหัสนักเรียน:</span>
              <strong className="font-mono text-sm">{log.studentId}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ระดับชั้น/ห้องเรียน:</span>
              <span className="font-semibold">{log.gradeClass || 'ม.4/1'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">คะแนนพฤติกรรมคงเหลือ:</span>
              <strong className="text-blue-700">{student ? `${student.score} คะแนน` : '-'}</strong>
            </div>
          </div>

          {/* Violation Details */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
              รายการความผิดระเบียบที่ตรวจพบ:
            </span>
            <ul className="space-y-1 pl-2">
              {log.violations.map((v, i) => (
                <li key={i} className="flex items-center justify-between text-slate-800">
                  <span>• {v}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-slate-200 text-rose-700">
              <span>คะแนนที่ถูกหักรวมในครั้งนี้:</span>
              <span>-{log.totalDeductPoints} คะแนน</span>
            </div>
          </div>

          {/* Notes */}
          <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700 block mb-0.5">รายละเอียดเพิ่มเติมจากผู้ตรวจ:</span>
            <p className="italic text-slate-600">"{log.detailNote || 'ไม่มีรายละเอียดเพิ่มเติม'}"</p>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs border-t border-slate-300">
            <div className="space-y-6">
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <div>
                <p className="font-semibold">({log.inspectorName || 'ผู้ตรวจระเบียบ'})</p>
                <p className="text-[10px] text-slate-500">ลงชื่อผู้ตรวจ / ครูฝ่ายปกครอง</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <div>
                <p className="font-semibold">({log.studentName})</p>
                <p className="text-[10px] text-slate-500">ลงชื่อรับทราบ (นักเรียน)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
