import React, { useState, useEffect } from 'react';
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
  Database,
  Check,
  Layers,
  Phone,
  Mail,
} from 'lucide-react';
import {
  SIGNUP_TARGET_SHEET_URL,
  SAMPLE_SIGNUP_APPS_SCRIPT_CODE,
  registerUserToGoogleSheet,
} from '../services/googleSheetService';

interface SignupFormProps {
  users: User[];
  onSignup: (newUser: User) => void;
  onCancelToLogin: () => void;
  defaultInstitutionCode?: string;
}

const STORAGE_KEY_SIGNUP_SCRIPT = 'conduct_signup_appscript_url';

export const SignupForm: React.FC<SignupFormProps> = ({
  users,
  onSignup,
  onCancelToLogin,
  defaultInstitutionCode = 'SCH-10102',
}) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('ครูฝ่ายปกครอง');
  const [customPosition, setCustomPosition] = useState('');
  const [inspectorId, setInspectorId] = useState(`INS-${String(users.length + 1).padStart(3, '0')}`);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [institutionCode, setInstitutionCode] = useState(defaultInstitutionCode);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Load saved Apps Script URL from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SIGNUP_SCRIPT);
    if (saved) {
      setAppsScriptUrl(saved);
    }
  }, []);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SAMPLE_SIGNUP_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmittedData(null);

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
      setErrorMsg('กรุณากรอกรหัสผู้ตรวจ/ผู้ใช้งาน');
      return;
    }

    if (!password.trim() || password.length < 4) {
      setErrorMsg('กรุณากำหนดรหัสผ่านอย่างน้อย 4 ตัวอักษร');
      return;
    }

    // Check duplicate ID
    if (users.some((u) => u.id.toLowerCase() === inspectorId.trim().toLowerCase())) {
      setErrorMsg(`รหัสผู้ใช้งาน "${inspectorId.trim()}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    // Save Apps Script URL for future usage
    if (appsScriptUrl.trim()) {
      localStorage.setItem(STORAGE_KEY_SIGNUP_SCRIPT, appsScriptUrl.trim());
    }

    setIsSubmitting(true);

    const nowFormatted = new Date().toLocaleString('th-TH');
    const newUserData: User = {
      id: inspectorId.trim().toUpperCase(),
      name: name.trim(),
      position: finalPosition,
      password: password.trim(),
      role: userRole,
      institutionCode: institutionCode.trim() || 'SCH-10102',
    };

    // Prepare 100% Complete Payload
    const fullPayload = {
      id: newUserData.id,
      password: newUserData.password,
      name: newUserData.name,
      position: newUserData.position,
      phone: phone.trim() || '-',
      email: email.trim() || '-',
      role: userRole,
      institutionCode: newUserData.institutionCode,
      registeredAt: nowFormatted,
    };

    // Send 100% of data to Google Sheet via Apps Script
    const result = await registerUserToGoogleSheet(fullPayload, appsScriptUrl);

    setIsSubmitting(false);

    // Store submitted data for 100% transparent audit card
    setSubmittedData(fullPayload);

    // Add user to local session and auto login
    onSignup(newUserData);

    setSuccessMsg(
      result.mode === 'apps_script'
        ? `สมัครสมาชิกสำเร็จ และบันทึกข้อมูล 100% ไปยัง Google Sheet เรียบร้อยแล้ว!`
        : `สมัครสมาชิกสำเร็จ! บันทึกข้อมูล ${newUserData.id} เข้าระบบเรียบร้อยแล้ว`
    );
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
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
            <h2 className="text-xl font-bold tracking-tight">สมัครสมาชิกผู้ใช้งาน / ผู้ตรวจระเบียบวินัย</h2>
            <p className="text-xs text-blue-200/90 mt-1 max-w-xl mx-auto">
              ลงทะเบียนเข้าใช้งานระบบ ข้อมูลทั้งหมด 100% จะถูกบันทึกลง Google Sheet ปลายทางอัตโนมัติ
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-xs text-emerald-200 border border-emerald-500/30">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>ปลายทาง: Google Sheet บัญชีผู้ใช้งาน (14TB49AXslxpBnxgBzg1wdkOz5io1n0EFPZPM0vnh_SU)</span>
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <p className="text-emerald-700">
                คุณสามารถใช้ <strong>รหัสผู้ใช้งาน: {submittedData?.id}</strong> และ <strong>รหัสผ่าน</strong> ที่ตั้งไว้ เข้าสู่ระบบได้ทันที
              </p>

              {/* 100% Data Summary Table */}
              {submittedData && (
                <div className="bg-white p-3 rounded-lg border border-emerald-200 text-[11.5px] space-y-1.5 font-sans">
                  <div className="font-bold text-emerald-900 border-b border-emerald-100 pb-1 flex items-center justify-between">
                    <span>ตารางข้อมูลที่บันทึกลง Google Sheet (ครบ 100%):</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">100% COMPLETE</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
                    <div><span className="text-slate-400">1. ID:</span> <strong className="text-blue-700 font-mono">{submittedData.id}</strong></div>
                    <div><span className="text-slate-400">2. รหัสผ่าน:</span> <strong className="font-mono">••••••••</strong></div>
                    <div><span className="text-slate-400">3. ชื่อ-สกุล:</span> <strong>{submittedData.name}</strong></div>
                    <div><span className="text-slate-400">4. ตำแหน่ง:</span> <strong>{submittedData.position}</strong></div>
                    <div><span className="text-slate-400">5. เบอร์โทร:</span> <strong>{submittedData.phone}</strong></div>
                    <div><span className="text-slate-400">6. อีเมล:</span> <strong>{submittedData.email}</strong></div>
                    <div><span className="text-slate-400">7. บทบาท:</span> <strong className="uppercase">{submittedData.role}</strong></div>
                    <div><span className="text-slate-400">8. รหัสสถาบัน:</span> <strong>{submittedData.institutionCode}</strong></div>
                    <div><span className="text-slate-400">9. เวลาสมัคร:</span> <strong>{submittedData.registeredAt}</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 1: User Profile Info (100% Fields) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>1. ข้อมูลส่วนตัวผู้สมัคร (100% Full User Profile)</span>
              </h3>
              <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                บันทึกเข้า Google Sheet ทุกช่อง
              </span>
            </div>

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
                  รหัสผู้ใช้งาน / รหัสผู้ตรวจ (ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="signup-inspector-id"
                  type="text"
                  required
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value.toUpperCase())}
                  placeholder="เช่น INS-004 หรือ 67001"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-semibold text-blue-700 focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                />
              </div>

              {/* Position / Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำแหน่ง / บทบาทหน้าที่ <span className="text-rose-500">*</span>
                </label>
                <select
                  id="signup-position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="ครูฝ่ายปกครอง">ครูฝ่ายปกครอง</option>
                  <option value="ครูประจำชั้น / ครูที่ปรึกษา">ครูประจำชั้น / ครูที่ปรึกษา</option>
                  <option value="อาจารย์ประจำแผนก">อาจารย์ประจำแผนก</option>
                  <option value="กรรมการสภานักเรียน">กรรมการสภานักเรียน</option>
                  <option value="เจ้าหน้าที่ตรวจระเบียบ">เจ้าหน้าที่ตรวจระเบียบ</option>
                  <option value="หัวหน้างานกิจการนักเรียน">หัวหน้างานกิจการนักเรียน</option>
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

              {/* User Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สิทธิ์การใช้งาน (User Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserRole('user')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      userRole === 'user'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>ผู้ใช้งานทั่วไป</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole('admin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      userRole === 'admin'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin ผู้ดูแล</span>
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>เบอร์โทรศัพท์ติดต่อ</span>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>อีเมล (Email)</span>
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

              {/* Institution Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  <span>รหัสสถาบัน / โรงเรียน</span>
                </label>
                <input
                  id="signup-institution"
                  type="text"
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value)}
                  placeholder="เช่น SCH-10102"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านเข้าสู่ระบบ (Password) <span className="text-rose-500">*</span>
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

          {/* Section 2: Google Sheet Destination & Apps Script Link */}
          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>2. การเชื่อมต่อ Google Sheet บันทึกข้อมูลสมาชิก</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowScriptGuide(!showScriptGuide)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border border-emerald-300"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showScriptGuide ? 'ซ่อนโค้ด Apps Script' : 'ดูโค้ด Apps Script'}</span>
              </button>
            </div>

            {/* Target Google Sheet link badge */}
            <div className="text-xs text-emerald-900 bg-white p-3 rounded-lg border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="truncate">
                <span className="font-semibold text-slate-700">Google Sheet ปลายทาง:</span>{' '}
                <a
                  href={SIGNUP_TARGET_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono text-[11px] font-bold"
                >
                  <span>14TB49AXslxpBnxgBzg1wdkOz5io1n0EFPZPM0vnh_SU</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <a
                href={SIGNUP_TARGET_SHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm shrink-0 hover:bg-emerald-700"
              >
                <ExternalLink className="w-3 h-3" />
                <span>เปิดดู Google Sheet</span>
              </a>
            </div>

            {/* Apps Script URL input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Google Apps Script Web App URL (Middleware สำหรับบันทึกลงชีต):</span>
                <span className="text-[10px] text-emerald-700 font-normal">
                  (ส่งข้อมูลแบบ POST อัตโนมัติ)
                </span>
              </label>
              <input
                id="input-appscript-url"
                type="url"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10.5px] text-slate-500 mt-1">
                * หากยังไม่ได้สร้าง Web App ระบบจะจัดเก็บข้อมูลในระบบพร้อมนำเข้าทันทีเมื่อมีการติดตั้ง Web App
              </p>
            </div>

            {/* Collapsible Apps Script Code Guide */}
            {showScriptGuide && (
              <div className="mt-3 bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-sans font-bold text-white">
                      โค้ด Apps Script สำหรับ Google Sheet ปลายทาง:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans text-[11px] font-semibold flex items-center gap-1 shadow"
                  >
                    {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                  </button>
                </div>
                <ol className="list-decimal list-inside text-slate-300 font-sans text-[11px] space-y-1">
                  <li>เปิด Google Sheet ปลายทาง (<a href={SIGNUP_TARGET_SHEET_URL} target="_blank" rel="noreferrer" className="text-blue-400 underline">ลิงก์ชีต</a>)</li>
                  <li>คลิกเมนู <strong>ส่วนขยาย (Extensions) &rarr; Apps Script</strong></li>
                  <li>ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดด้านล่างนี้ลงไป</li>
                  <li>กด <strong>การทำให้ใช้งานได้ (Deploy) &rarr; การทำให้ใช้งานได้รายการใหม่ (New Deployment)</strong></li>
                  <li>เลือกประเภท <strong>เว็บแอป (Web App)</strong> และเลือกผู้มีสิทธิ์เข้าถึงเป็น <strong>ทุกคน (Anyone)</strong></li>
                  <li>คัดลอก Web App URL นำมาวางในช่องด้านบน</li>
                </ol>
                <pre className="max-h-56 overflow-y-auto p-2 bg-slate-950 rounded text-[10.5px] text-emerald-300 leading-relaxed border border-slate-800 selection:bg-emerald-900">
                  {SAMPLE_SIGNUP_APPS_SCRIPT_CODE}
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
                  <span>กำลังบันทึกข้อมูล 100% ลง Google Sheet...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ยืนยันการสมัครสมาชิก (บันทึกข้อมูล 100% ลง Google Sheet)</span>
                </>
              )}
            </button>

            <button
              id="btn-signup-cancel"
              type="button"
              onClick={onCancelToLogin}
              className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors border border-slate-300"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

