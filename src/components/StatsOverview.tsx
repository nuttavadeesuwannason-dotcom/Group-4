import React, { useMemo } from 'react';
import { InspectionLog, Student, ViolationCategory } from '../types';
import { ClipboardList, Award, AlertTriangle, Users } from 'lucide-react';

interface StatsOverviewProps {
  logs: InspectionLog[];
  students: Student[];
  categories: ViolationCategory[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ logs, students, categories }) => {
  const totalLogs = logs.length;

  const totalDeductedPoints = useMemo(() => {
    return logs.reduce((sum, l) => sum + l.totalDeductPoints, 0);
  }, [logs]);

  const topViolation = useMemo(() => {
    if (logs.length === 0) return 'ไม่มีข้อมูล';
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      l.violations.forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
      });
    });
    let topName = 'ทรงผม';
    let maxCount = 0;
    Object.entries(counts).forEach(([v, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topName = v;
      }
    });
    return `${topName.split(' ')[0]} (${maxCount} ครั้ง)`;
  }, [logs]);

  const studentsAtRiskCount = useMemo(() => {
    return students.filter((s) => s.score < 80).length;
  }, [students]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">บันทึกความผิดรวม</span>
          <span className="text-lg font-bold text-slate-900">{totalLogs} รายการ</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">คะแนนโดนหักสะสม</span>
          <span className="text-lg font-bold text-rose-600">-{totalDeductedPoints} คะแนน</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">ความผิดที่พบสูงสุด</span>
          <span className="text-xs font-bold text-slate-900 truncate max-w-[120px] block">{topViolation}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">นักเรียนถูกเฝ้าระวัง</span>
          <span className="text-lg font-bold text-slate-900">{studentsAtRiskCount} คน (คะแนน &lt; 80)</span>
        </div>
      </div>
    </div>
  );
};
