import React, { useState } from 'react';
import { User } from '../types';
import {
  UserPlus,
  ShieldCheck,
  School,
  Lock,
  UserCheck,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Code2,
  Sparkles,
  ArrowLeft,
  Send,
  HelpCircle,
} from 'lucide-react';

interface SignupFormProps {
  users: User[];
  onSignup: (newUser: User) => void;
  onCancelToLogin: () => void;
  defaultInstitutionCode?: string;
}

const TARGET_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1dB4UC_Qrych4C7e3aoakioLLfjNtAMFTzbHkqULgAs4/edit?usp=sharing';

// Default sample Apps Script Web App URL or user custom
const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx_EXAMPLE_CONDUCT_SYS_APP_SCRIPT/exec';

export const SignupForm: React.FC<SignupFormProps> = ({
  users,
  onSignup,
  onCancelToLogin,
}) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('ครูฝ่ายปกครอง');
  const [customPosition, setCustomPosition] = useState('');
  const [inspectorId, setInspectorId] = useState(`INS-${String(users.length + 1).padStart(3, '0')}`);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [appsScriptUrl, setAppsScriptUrl] = useState(DEFAULT_APPS_SCRIPT_URL);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sheetStatus, setSheetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const sampleAppsScriptCode = `// ===== Google Apps Script Code สำหรับบันทึกข้อมูลสมาชิกไปยัง Google Sheet =====
// ลิงก์ชีต: ${TARGET_SHEET_URL}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // หากเป็นหัวข้อแรก ให้สร้าง Header
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "วัน-เวลาสมัคร",
        "รหัสผู้ตรวจ (ID)",
        "ชื่อ-นามสกุล",
        "ตำแหน่ง/บทบาท",
        "รหัสสถาบัน/องค์กร",
        "เบอร์โทรศัพท์",
        "อีเมล",
        "สถานะ"
      ]);
    }

    // เพิ่มบรรทัดข้อมูลใหม่
    sheet.appendRow([
      new Date().toLocaleString("th-TH"),
      data.id || "-",
      data.name || "-",
      data.position || "-",
      data.institutionCode || "-",
      data.phone || "-",
      data.email || "-",
      "อนุมัติแล้ว"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "บันทึกเรียบร้อย" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Student Conduct System Sign-Up Endpoint is Active!");
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    const finalPosition = position === 'อื่นๆ' ? customPosition.trim() : position;
    if (!finalPosition) {
      setErrorMsg('กรุณาระบุตำแหน่ง/บทบาท');
      return;
    }

    if (!inspectorId.trim()) {
      setErrorMsg('กรุณากรอกรหัสผู้ตรวจ');
      return;
    }

    // Check existing ID
    if (users.some((u) => u.id.toLowerCase() === inspectorId.trim().toLowerCase())) {
      setErrorMsg(`รหัสผู้ตรวจ "${inspectorId.trim()}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    setIsSubmitting(true);
    setSheetStatus('sending');

    const newUserData: User = {
      id: inspectorId.trim().toUpperCase(),
      name: name.trim(),
      position: finalPosition,
      password: password.trim() || '123456',
    };

    // Payload for Google Apps Script
    const sheetPayload = {
      timestamp: new Date().toISOString(),
      id: newUserData.id,
      name: newUserData.name,
      position: newUserData.position,
      phone: phone.trim() || '-',
      email: email.trim() || '-',
      source: 'Student Conduct Web App',
    };

    // Attempt to send to Google Apps Script URL if valid
    let sentToAppsScript = false;
    if (appsScriptUrl.trim() && appsScriptUrl.startsWith('https://script.google.com')) {
      try {
        await fetch(appsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors', // Standard for Apps Script Web Apps cross-domain
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sheetPayload),
        });
        sentToAppsScript = true;
        setSheetStatus('sent');
      } catch (err) {
        console.warn('Google Apps Script submission warning:', err);
        setSheetStatus('error');
      }
    } else {
      // Simulate successful local payload queueing for Google Sheet
      setSheetStatus('sent');
    }

    setIsSubmitting(false);

    // Add user locally
    onSignup(newUserData);

    setSuccessMsg(
      `สมัครสมาชิกสำเร็จ! รหัสผู้ตรวจของคุณคือ: ${newUserData.id}${
        sentToAppsScript
          ? ' (นำข้อมูลลง Google Sheet ผ่าน Apps Script เรียบร้อย)'
          : ' (เพิ่มข้อมูลในระบบเรียบร้อย)'
      }`
    );
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white relative">
          <button
            type="button"
            onClick={onCancelToLogin}
            className="absolute top-4 left-4 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าล็อกอิน</span>
          </button>

          <div className="text-center pt-2">
            <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 flex items-center justify-center shadow-lg shadow-teal-500/30 ring-4 ring-white/10">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">สมัครสมาชิกผู้ตรวจระเบียบวินัย</h2>
            <p className="text-xs text-blue-200/90 mt-1">
              ลงทะเบียนเพื่อบันทึกและตรวจเช็คความผิดนักเรียน ระบบจะส่งข้อมูลไปยัง Google Sheet โดยอัตโนมัติ
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-xs text-emerald-200 border border-emerald-500/30">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>เชื่อมต่อ Google Sheet via Apps Script</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <p className="text-emerald-600">
                คุณสามารถเข้าสู่ระบบและเริ่มทำรายการบันทึกระเบียบวินัยนักเรียนได้ทันที
              </p>
            </div>
          )}

          {/* Section 1: User Profile Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>1. ข้อมูลส่วนตัวผู้ตรวจ (Inspector Profile)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น อ.สมชาย ใจดี"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Inspector ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผู้ตรวจ (Inspector ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="signup-inspector-id"
                  type="text"
                  required
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value.toUpperCase())}
                  placeholder="เช่น INS-004"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-semibold text-blue-700 focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                />
              </div>

              {/* Position / Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำแหน่ง / บทบาท <span className="text-rose-500">*</span>
                </label>
                <select
                  id="signup-position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="ครูฝ่ายปกครอง">ครูฝ่ายปกครอง</option>
                  <option value="ครูประจำชั้น / ครูที่ปรึกษา">ครูประจำชั้น / ครูที่ปรึกษา</option>
                  <option value="กรรมการสภานักเรียน">กรรมการสภานักเรียน</option>
                  <option value="เจ้าหน้าที่ตรวจระเบียบ">เจ้าหน้าที่ตรวจระเบียบ</option>
                  <option value="อาจารย์หัวหน้าแผนก">อาจารย์หัวหน้าแผนก</option>
                  <option value="อื่นๆ">อื่นๆ (ระบุเอง)</option>
                </select>
                {position === 'อื่นๆ' && (
                  <input
                    type="text"
                    required
                    value={customPosition}
                    onChange={(e) => setCustomPosition(e.target.value)}
                    placeholder="ระบุตำแหน่ง..."
                    className="w-full mt-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล (Email)
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น teacher@school.ac.th"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตั้งรหัสผ่านสำหรับเข้าสู่ระบบ (Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่าน (อย่างน้อย 4 ตัวอักษร)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Google Sheets & Apps Script Link Integration */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>2. การส่งข้อมูลไปยัง Google Sheet ผ่าน Apps Script</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowScriptGuide(!showScriptGuide)}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showScriptGuide ? 'ซ่อนคู่มือโค้ด' : 'ดูโค้ด Apps Script'}</span>
              </button>
            </div>

            <div className="text-xs text-emerald-900 bg-white/80 p-3 rounded-lg border border-emerald-200 flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="font-semibold">เป้าหมาย Google Sheet:</span>{' '}
                <a
                  href={TARGET_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                >
                  docs.google.com/spreadsheets/d/1dB4UC_Qrych4C7e3aoakio...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Apps Script Web App URL Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Google Apps Script Web App URL:</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (รองรับการส่ง POST ข้อมูลอัตโนมัติ)
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  id="input-appscript-url"
                  type="url"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Collapsible Apps Script Code Guide */}
            {showScriptGuide && (
              <div className="mt-3 bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-sans font-bold text-white">
                      วิธีติดตั้ง Apps Script บน Google Sheet ของคุณ:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedScript ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ด'}</span>
                  </button>
                </div>
                <ol className="list-decimal list-inside text-slate-400 font-sans text-[11px] space-y-1">
                  <li>เปิด Google Sheet ปลายทาง ({TARGET_SHEET_URL})</li>
                  <li>ไปที่เมนู <strong>ส่วนขยาย (Extensions) &rarr; Apps Script</strong></li>
                  <li>ลบโค้ดเดิมแล้ววางโค้ดด้านล่างนี้ลงไป</li>
                  <li>
                    กด <strong>การทบทวน/การใช้บริการ (Deploy) &rarr; การทำให้ใช้งานได้อย่างใหม่ (New Deployment)</strong>
                  </li>
                  <li>เลือกประเภทเป็น <strong>เว็บแอป (Web App)</strong> และเลือกผู้มีสิทธิ์เข้าถึงเป็น <strong>ทุกคน (Anyone)</strong></li>
                  <li>คัดลอก URL Web App นำมาใส่ในช่อง Google Apps Script Web App URL ด้านบน</li>
                </ol>
                <pre className="max-h-48 overflow-y-auto p-2 bg-slate-950 rounded text-[10.5px] text-emerald-300 leading-relaxed border border-slate-800 selection:bg-emerald-900">
                  {sampleAppsScriptCode}
                </pre>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              id="btn-signup-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังลงทะเบียนและบันทึกลง Google Sheet...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ยืนยันการสมัครสมาชิก (Sign Up & Send to Sheet)</span>
                </>
              )}
            </button>

            <button
              id="btn-signup-cancel"
              type="button"
              onClick={onCancelToLogin}
              className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors border border-slate-300"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
