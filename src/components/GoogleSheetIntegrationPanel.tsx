import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Code2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Key,
  Database,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  ADMIN_USERS_SHEET_URL,
  GENERAL_USERS_SHEET_URL,
  DETAILS_SHEET_URL,
  SAMPLE_LOGIN_APPS_SCRIPT_CODE,
  SAMPLE_DETAILS_APPS_SCRIPT_CODE,
  exportStudentToAppsScript,
} from '../services/googleSheetService';
import { User, Student, InspectionLog } from '../types';

interface GoogleSheetIntegrationPanelProps {
  users: User[];
  students: Student[];
  logs: InspectionLog[];
  onSyncUsersFromSheet: (appsScriptUrl?: string) => Promise<number>;
  onImportDetailsFromSheet: (appsScriptUrl?: string) => Promise<{ studentCount: number; logCount: number }>;
  onExportLogsToAppsScript?: (appsScriptUrl: string) => Promise<boolean>;
}

export const GoogleSheetIntegrationPanel: React.FC<GoogleSheetIntegrationPanelProps> = ({
  users,
  students,
  logs,
  onSyncUsersFromSheet,
  onImportDetailsFromSheet,
  onExportLogsToAppsScript,
}) => {
  const [activeTab, setActiveTab] = useState<'dataset1' | 'dataset2' | 'code'>('dataset1');

  const [loginAppsScriptUrl, setLoginAppsScriptUrl] = useState('');
  const [detailsAppsScriptUrl, setDetailsAppsScriptUrl] = useState('');

  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
  const [isImportingDetails, setIsImportingDetails] = useState(false);
  const [isExportingLogs, setIsExportingLogs] = useState(false);
  const [isExportingStudents, setIsExportingStudents] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState<'login' | 'details' | null>(null);

  const handleSyncUsers = async () => {
    setIsSyncingUsers(true);
    setStatusMsg(null);
    try {
      const count = await onSyncUsersFromSheet(loginAppsScriptUrl);
      setStatusMsg({
        type: 'success',
        text: `เชื่อมต่อดึงข้อมูลชุดที่ 1 (Login Users) สำเร็จ! โหลดข้อมูลผู้ตรวจ ${count} รายการจาก Google Sheet เรียบร้อย`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการดึงข้อมูล Login: ${err.message || 'ไม่สามารถดึงข้อมูลได้'}`,
      });
    } finally {
      setIsSyncingUsers(false);
    }
  };

  const handleImportDetails = async () => {
    setIsImportingDetails(true);
    setStatusMsg(null);
    try {
      const result = await onImportDetailsFromSheet(detailsAppsScriptUrl);
      setStatusMsg({
        type: 'success',
        text: `นำเข้าข้อมูลชุดที่ 2 สำเร็จ! นำเข้านักเรียน ${result.studentCount} คน และประวัติความผิด ${result.logCount} รายการเรียบร้อย`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการนำเข้าข้อมูลรายละเอียด: ${err.message || 'ไม่สามารถดึงข้อมูลได้'}`,
      });
    } finally {
      setIsImportingDetails(false);
    }
  };

  const handleExportLogs = async () => {
    if (!detailsAppsScriptUrl.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'กรุณากรอก Google Apps Script Web App URL สำหรับชุดข้อมูลที่ 2 ก่อนกดส่งข้อมูล',
      });
      return;
    }

    if (!onExportLogsToAppsScript) return;

    setIsExportingLogs(true);
    setStatusMsg(null);
    try {
      const ok = await onExportLogsToAppsScript(detailsAppsScriptUrl);
      if (ok) {
        setStatusMsg({
          type: 'success',
          text: `ส่งออกบันทึกการเช็คความผิดไปยัง Google Sheet ผ่าน Apps Script สำเร็จ!`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: `ไม่สามารถส่งข้อมูลไปยัง Apps Script ได้ กรุณาตรวจสอบสิทธิ์การปรับใช้ (Deploy) เป็น 'Anyone' (ทุกคน)`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการส่งออกข้อมูล: ${err.message}`,
      });
    } finally {
      setIsExportingLogs(false);
    }
  };

  const handleExportStudents = async () => {
    if (students.length === 0) {
      setStatusMsg({ type: 'info', text: 'ไม่พบข้อมูลนักเรียนสำหรับส่งออก' });
      return;
    }

    setIsExportingStudents(true);
    setStatusMsg(null);
    try {
      let successCount = 0;
      for (const std of students) {
        const res = await exportStudentToAppsScript(std, detailsAppsScriptUrl);
        if (res.success) successCount++;
      }
      setStatusMsg({
        type: 'success',
        text: `ส่งออกข้อมูลรายชื่อนักเรียน (${successCount}/${students.length} คน) ไปยัง Google Sheet ผ่าน Apps Script เรียบร้อยแล้ว!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการส่งข้อมูลนักเรียน: ${err.message}`,
      });
    } finally {
      setIsExportingStudents(false);
    }
  };

  const handleCopyCode = (type: 'login' | 'details') => {
    const code = type === 'login' ? SAMPLE_LOGIN_APPS_SCRIPT_CODE : SAMPLE_DETAILS_APPS_SCRIPT_CODE;
    navigator.clipboard.writeText(code);
    setCopiedScript(type);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-0">
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-5 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheet & Apps Script Database Middleware</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight">
              จัดการเชื่อมต่อฐานข้อมูล Google Sheet ผ่าน Apps Script
            </h3>
            <p className="text-xs text-blue-200/80 mt-0.5">
              ระบบเชื่อมต่อ 2 ข้อมูล: ข้อมูลชุดที่ 1 (Login Users: ID & PASSWORD) และ ข้อมูลชุดที่ 2 (รายละเอียดความผิด)
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-sm border border-white/10 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('dataset1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'dataset1'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>ชุดที่ 1: Login</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dataset2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'dataset2'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>ชุดที่ 2: รายละเอียด</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>โค้ด Apps Script</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 text-xs border-b flex items-center justify-between gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-[10px] font-bold underline opacity-70 hover:opacity-100"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Content Section */}
      <div className="p-5">
        {/* TAB 1: DATASET 1 - LOGIN USERS */}
        {activeTab === 'dataset1' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>ข้อมูลล็อกอินแยก 2 Google Sheet (Admin & ผู้ใช้งานทั่วไป)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ดึงข้อมูลรหัสผู้ใช้งานจากคอลัมน์ <code className="font-mono text-blue-600 font-bold">ID</code> และ
                    รหัสผ่านจากคอลัมน์ <code className="font-mono text-blue-600 font-bold">PASSWORD</code>
                  </p>
                </div>
              </div>

              {/* 2 Sheet URLs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="font-bold text-amber-900 flex items-center justify-between mb-1">
                      <span>1. Google Sheet Admin</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">Sheet ID: 1y3pedY...</span>
                    </div>
                    <p className="text-[11px] text-amber-800">สำหรับผู้ดูแลระบบ Admin</p>
                  </div>
                  <a
                    href={ADMIN_USERS_SHEET_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold text-[11px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิด Google Sheet Admin</span>
                  </a>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="font-bold text-blue-900 flex items-center justify-between mb-1">
                      <span>2. Google Sheet ผู้ใช้งานทั่วไป</span>
                      <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">Sheet ID: 14TB49A...</span>
                    </div>
                    <p className="text-[11px] text-blue-800">สำหรับครูและผู้ตรวจทั่วไป</p>
                  </div>
                  <a
                    href={GENERAL_USERS_SHEET_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold text-[11px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิด Google Sheet ผู้ใช้งานทั่วไป</span>
                  </a>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                {/* Optional Apps Script Web App URL override */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Google Apps Script Web App URL (Middleware):
                  </label>
                  <input
                    type="url"
                    value={loginAppsScriptUrl}
                    onChange={(e) => setLoginAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec (หรือเว้นว่างไว้เพื่ออ่านจาก Sheet โดยตรง)"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>สถานะผู้ตรวจในระบบปัจจุบัน: <strong className="text-slate-900">{users.length} คน</strong></span>
                </div>

                <button
                  id="btn-sync-users-sheet"
                  type="button"
                  onClick={handleSyncUsers}
                  disabled={isSyncingUsers}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingUsers ? 'animate-spin' : ''}`} />
                  <span>{isSyncingUsers ? 'กำลังซิงค์ผู้ตรวจ...' : 'ดึงข้อมูล Login จาก Google Sheet บัดนี้'}</span>
                </button>
              </div>
            </div>

            {/* User List Preview */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-100 text-slate-700 font-bold text-xs border-b border-slate-200 flex justify-between">
                <span>ตัวอย่างบัญชีผู้ตรวจที่ดึงจาก Google Sheet ชุดที่ 1</span>
                <span className="text-[11px] font-mono font-normal">แมปฟิลด์: [ID] &rarr; รหัสผู้ใช้งาน, [PASSWORD] &rarr; รหัสผ่าน</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {users.map((u) => (
                  <div key={u.id} className="p-2.5 text-xs flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.position}</div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200 text-[11px] mr-2">
                        ID: {u.id}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-semibold rounded border border-amber-200 text-[11px]">
                        PASS: {u.password}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATASET 2 - DETAILS IMPORT & EXPORT */}
        {activeTab === 'dataset2' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>ข้อมูลชุดที่ 2: หน้าแสดงรายละเอียดและบันทึกความผิด (Details & Logs)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รองรับการนำเข้าข้อมูลนักเรียน/ความผิดเดิม และส่งออกบันทึกการเช็คใหม่ไปยัง Google Sheet ผ่าน Apps Script
                  </p>
                </div>
                <a
                  href={DETAILS_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white border border-slate-300 text-emerald-600 hover:text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิด Google Sheet ชุดที่ 2</span>
                </a>
              </div>

              {/* Apps Script Endpoint Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Apps Script Web App URL (ตัวกลางดึง/บันทึกข้อมูลชุดที่ 2):
                </label>
                <input
                  type="url"
                  value={detailsAppsScriptUrl}
                  onChange={(e) => setDetailsAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>

              {/* Import & Export Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  id="btn-import-details-sheet"
                  type="button"
                  onClick={handleImportDetails}
                  disabled={isImportingDetails}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${isImportingDetails ? 'animate-bounce' : ''}`} />
                  <span>{isImportingDetails ? 'กำลังนำเข้า...' : 'ดึงข้อมูลจาก Google Sheet'}</span>
                </button>

                <button
                  id="btn-export-students-sheet"
                  type="button"
                  onClick={handleExportStudents}
                  disabled={isExportingStudents}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FileSpreadsheet className={`w-4 h-4 ${isExportingStudents ? 'animate-pulse' : ''}`} />
                  <span>{isExportingStudents ? 'กำลังส่งข้อมูลนักเรียน...' : `ส่งข้อมูลนักเรียน (${students.length} คน) ไปยัง Sheet`}</span>
                </button>

                <button
                  id="btn-export-logs-sheet"
                  type="button"
                  onClick={handleExportLogs}
                  disabled={isExportingLogs}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className={`w-4 h-4 ${isExportingLogs ? 'animate-bounce' : ''}`} />
                  <span>{isExportingLogs ? 'กำลังส่งออก...' : 'ส่งออกบันทึกการเช็คไป Sheet'}</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl text-xs">
                <span className="text-emerald-800 font-semibold block mb-0.5">นักเรียนในระบบปัจจุบัน:</span>
                <span className="text-lg font-bold text-emerald-900 font-mono">{students.length} คน</span>
              </div>
              <div className="bg-indigo-50/60 border border-indigo-200 p-3 rounded-xl text-xs">
                <span className="text-indigo-800 font-semibold block mb-0.5">ประวัติบันทึกการเช็คความผิด:</span>
                <span className="text-lg font-bold text-indigo-900 font-mono">{logs.length} รายการ</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CODE GUIDES & TUTORIAL */}
        {activeTab === 'code' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>1. โค้ด Apps Script สำหรับข้อมูลชุดที่ 1 (Login: ID & PASSWORD)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode('login')}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedScript === 'login' ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ด ชุดที่ 1'}</span>
                </button>
              </div>
              <pre className="max-h-36 overflow-y-auto p-2.5 bg-slate-950 rounded text-[10.5px] text-emerald-300 font-mono leading-relaxed border border-slate-800">
                {SAMPLE_LOGIN_APPS_SCRIPT_CODE}
              </pre>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>2. โค้ด Apps Script สำหรับข้อมูลชุดที่ 2 (Details: Import & Export)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode('details')}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedScript === 'details' ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ด ชุดที่ 2'}</span>
                </button>
              </div>
              <pre className="max-h-36 overflow-y-auto p-2.5 bg-slate-950 rounded text-[10.5px] text-emerald-300 font-mono leading-relaxed border border-slate-800">
                {SAMPLE_DETAILS_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
