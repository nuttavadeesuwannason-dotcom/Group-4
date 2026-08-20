import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, UserCheck, Lock, AlertCircle, Sparkles, UserPlus, FileSpreadsheet, RefreshCw, ExternalLink, UserCog, Users } from 'lucide-react';
import {
  fetchUsersFromGoogleSheet,
  ADMIN_USERS_SHEET_ID,
  ADMIN_USERS_SHEET_URL,
  GENERAL_USERS_SHEET_ID,
  GENERAL_USERS_SHEET_URL,
} from '../services/googleSheetService';

interface LoginFormProps {
  users: User[];
  onLogin: (user: User) => void;
  onGoToSignup?: () => void;
  onUpdateUsers?: (updatedUsers: User[]) => void;
  defaultInstitutionCode?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  users,
  onLogin,
  onGoToSignup,
  onUpdateUsers,
}) => {
  const [loginRole, setLoginRole] = useState<'admin' | 'user'>('admin');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Users state per role
  const [adminUsersList, setAdminUsersList] = useState<User[]>([]);
  const [generalUsersList, setGeneralUsersList] = useState<User[]>([]);

  const [syncStatus, setSyncStatus] = useState<{ admin?: string; user?: string }>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync users on initial render
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch Admin Users (Sheet 1)
      const adminRes = await fetchUsersFromGoogleSheet(undefined, ADMIN_USERS_SHEET_ID, 'admin');
      if (adminRes.users) {
        setAdminUsersList(adminRes.users);
        setSyncStatus((prev) => ({ ...prev, admin: `ดึงข้อมูล Admin สำเร็จ ${adminRes.users.length} บัญชี` }));
      }

      // 2. Fetch General Users (Sheet 2)
      const generalRes = await fetchUsersFromGoogleSheet(undefined, GENERAL_USERS_SHEET_ID, 'user');
      if (generalRes.users) {
        setGeneralUsersList(generalRes.users);
        setSyncStatus((prev) => ({ ...prev, user: `ดึงข้อมูลผู้ใช้งานทั่วไปสำเร็จ ${generalRes.users.length} บัญชี` }));
      }

      const combined = [...(adminRes.users || []), ...(generalRes.users || [])];
      if (combined.length > 0 && onUpdateUsers) {
        onUpdateUsers(combined);
      }
    } catch (err: any) {
      console.warn('Google Sheet user fetch error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Get active users based on selected role tab
  const activeUsersList = loginRole === 'admin'
    ? (adminUsersList.length > 0 ? adminUsersList : users.filter((u) => u.role === 'admin'))
    : (generalUsersList.length > 0 ? generalUsersList : users.filter((u) => u.role !== 'admin'));

  const activeSheetUrl = loginRole === 'admin' ? ADMIN_USERS_SHEET_URL : GENERAL_USERS_SHEET_URL;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userId.trim()) {
      setErrorMsg('กรุณากรอกรหัสผู้ใช้งาน (ID)');
      return;
    }

    // Search inside active users list first
    let matchedUser = activeUsersList.find(
      (u) => u.id.toLowerCase() === userId.trim().toLowerCase()
    );

    // Fallback search in all users
    if (!matchedUser) {
      matchedUser = users.find((u) => u.id.toLowerCase() === userId.trim().toLowerCase());
    }

    if (!matchedUser) {
      setErrorMsg(`ไม่พบรหัสผู้ใช้งาน "${userId.trim()}" ในกลุ่ม ${loginRole === 'admin' ? 'Admin' : 'ผู้ใช้งานทั่วไป'}`);
      return;
    }

    if (matchedUser.password && password && matchedUser.password !== password) {
      setErrorMsg('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    // Attach current tab role
    const finalUserObj: User = {
      ...matchedUser,
      role: loginRole,
    };

    onLogin(finalUserObj);
  };

  const handleQuickLogin = (user: User) => {
    setUserId(user.id);
    setPassword(user.password || '');
    setErrorMsg(null);
    onLogin({
      ...user,
      role: loginRole,
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 p-3 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-white/10">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">เข้าสู่ระบบตรวจเช็คระเบียบวินัย</h2>
          <p className="text-xs text-blue-200/80 mt-1">
            เลือกระดับการเข้าสู่ระบบ (Admin หรือ ผู้ใช้งานทั่วไป)
          </p>
        </div>

        {/* 2 Login Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginRole('admin');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              loginRole === 'admin'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>1. Admin (ผู้ดูแลระบบ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginRole('user');
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              loginRole === 'user'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. ผู้ใช้งานทั่วไป</span>
          </button>
        </div>

        {/* Google Sheet Integration Badge according to selected tab */}
        <div
          className={`p-3.5 border-b flex flex-col gap-1.5 text-xs ${
            loginRole === 'admin'
              ? 'bg-amber-50/90 border-amber-200/80 text-amber-950'
              : 'bg-emerald-50/90 border-emerald-200/80 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <FileSpreadsheet
                className={`w-4 h-4 ${loginRole === 'admin' ? 'text-amber-600' : 'text-emerald-600'}`}
              />
              <span>
                {loginRole === 'admin'
                  ? 'ข้อมูลล็อกอิน Admin (Google Sheet 1)'
                  : 'ข้อมูลล็อกอินผู้ใช้งานทั่วไป (Google Sheet 2)'}
              </span>
            </div>
            <button
              type="button"
              onClick={fetchAllUsers}
              disabled={isSyncing}
              className={`px-2 py-1 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 ${
                loginRole === 'admin' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'รีเฟรชชีต'}</span>
            </button>
          </div>

          <div className="text-[11px] flex items-center justify-between">
            <span className="truncate pr-2">
              เชื่อมโยง Sheet: <code className="font-mono font-bold">{loginRole === 'admin' ? '1y3pedY...' : '14TB49A...'}</code>
            </span>
            <a
              href={activeSheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-0.5 text-[10.5px] font-bold shrink-0"
            >
              <span>เปิด Google Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {syncStatus[loginRole] && (
            <div className="text-[10.5px] font-semibold bg-white/90 px-2 py-0.5 rounded border border-slate-200">
              ✅ {syncStatus[loginRole]}
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User ID Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {loginRole === 'admin' ? 'รหัส Admin (Admin ID)' : 'รหัสผู้ตรวจ (User ID)'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <input
                id="input-user-id"
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={loginRole === 'admin' ? 'เช่น ADMIN-01 หรือ INS-001' : 'เช่น INS-002 หรือ INS-003'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className={`w-full py-2.5 px-4 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 ${
              loginRole === 'admin'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>เข้าสู่ระบบ ({loginRole === 'admin' ? 'Admin' : 'ผู้ใช้งานทั่วไป'})</span>
          </button>

          {/* Sign Up Link */}
          {onGoToSignup && (
            <button
              id="btn-goto-signup"
              type="button"
              onClick={onGoToSignup}
              className="w-full py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 transition-all flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>ยังไม่มีบัญชีผู้ใช้งาน? สมัครสมาชิกที่นี่ (Sign Up)</span>
            </button>
          )}

          {/* Quick Demo Accounts Selection */}
          <div className="pt-4 border-t border-slate-200 mt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2.5">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>บัญชีด่วน ({loginRole === 'admin' ? 'Admin' : 'ผู้ใช้งานทั่วไป'}):</span>
              </div>
              <span className="text-[10px] text-slate-400">จาก Google Sheet</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeUsersList.length > 0 ? (
                activeUsersList.map((u, idx) => (
                  <button
                    key={`${u.id}-${idx}`}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-all group flex items-center justify-between ${
                      loginRole === 'admin'
                        ? 'bg-amber-50/50 hover:bg-amber-100/80 border-amber-200'
                        : 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {u.position || (loginRole === 'admin' ? 'Admin' : 'ผู้ตรวจ')} • รหัส: <code className="font-mono text-blue-600">{u.id}</code>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      เลือกเข้าใช้งาน
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  ไม่พบบัญชีผู้ใช้งานใน Google Sheet
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
