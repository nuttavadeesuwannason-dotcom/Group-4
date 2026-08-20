import React from 'react';
import { User } from '../types';
import { ShieldCheck, ClipboardList, History, Database, LogOut, UserCheck, School, UserPlus } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'form' | 'history' | 'database';
  setActiveTab: (tab: 'form' | 'history' | 'database') => void;
  onLogout: () => void;
  onSwitchUser: () => void;
  onGoToSignup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchUser,
  onGoToSignup,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white leading-tight">
                  ระบบตรวจเช็คระเบียบวินัยนักเรียน
                </h1>
              </div>
              <p className="text-xs text-slate-400">Student Conduct & Behavior Discipline System</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          {currentUser && (
            <nav className="hidden md:flex space-x-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
              <button
                id="nav-tab-form"
                onClick={() => setActiveTab('form')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'form'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>บันทึกความผิด (Form)</span>
              </button>

              <button
                id="nav-tab-history"
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <History className="w-4 h-4" />
                <span>ประวัติ & สถานะการตรวจ</span>
              </button>

              <button
                id="nav-tab-database"
                onClick={() => setActiveTab('database')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'database'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>ตารางฐานข้อมูล (Database)</span>
              </button>
            </nav>
          )}

          {/* User Profile Pill & Actions */}
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-left">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        currentUser.role === 'admin'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                          : 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                      }`}
                    >
                      {currentUser.role === 'admin' ? 'Admin' : 'ผู้ใช้งาน'}
                    </span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <span className="text-blue-400">{currentUser.position}</span> • ID: {currentUser.id}
                  </div>
                </div>
              </div>

              <button
                id="btn-switch-user"
                onClick={onSwitchUser}
                title="สลับบัญชีผู้ตรวจ"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60 text-xs flex items-center gap-1"
              >
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span className="hidden lg:inline text-xs">สลับผู้ตรวจ</span>
              </button>

              <button
                id="btn-logout"
                onClick={onLogout}
                title="ออกจากระบบ"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-slate-700/60"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex text-xs text-slate-400 items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
                <School className="w-4 h-4 text-blue-400" />
                <span>กรุณาลงชื่อเข้าใช้งาน</span>
              </div>
              {onGoToSignup && (
                <button
                  id="nav-btn-signup"
                  onClick={onGoToSignup}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>สมัครสมาชิก</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Tab Navigation */}
        {currentUser && (
          <div className="md:hidden py-2 border-t border-slate-800 flex justify-around">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs ${
                activeTab === 'form' ? 'text-blue-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <ClipboardList className="w-5 h-5 mb-0.5" />
              <span>กรอกข้อมูล</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs ${
                activeTab === 'history' ? 'text-blue-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <History className="w-5 h-5 mb-0.5" />
              <span>ประวัติ</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs ${
                activeTab === 'database' ? 'text-blue-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <Database className="w-5 h-5 mb-0.5" />
              <span>ฐานข้อมูล</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
