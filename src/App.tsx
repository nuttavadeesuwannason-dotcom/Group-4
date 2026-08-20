import React, { useState, useEffect } from 'react';
import { User, Student, ViolationCategory, InspectionLog } from './types';
import {
  INITIAL_INSTITUTION_CODE,
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_VIOLATION_CATEGORIES,
  INITIAL_INSPECTION_LOGS,
} from './data/initialData';
import {
  fetchUsersFromGoogleSheet,
  fetchDetailsFromAppsScript,
  ADMIN_USERS_SHEET_ID,
  GENERAL_USERS_SHEET_ID,
} from './services/googleSheetService';
import { Navbar } from './components/Navbar';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { ViolationForm } from './components/ViolationForm';
import { HistoryList } from './components/HistoryList';
import { DatabaseViewer } from './components/DatabaseViewer';
import { PrintModal } from './components/PrintModal';
import { StatsOverview } from './components/StatsOverview';

const STORAGE_KEY_USER = 'student_conduct_active_user';
const STORAGE_KEY_USERS = 'student_conduct_users_tbl';
const STORAGE_KEY_STUDENTS = 'student_conduct_students_tbl';
const STORAGE_KEY_LOGS = 'student_conduct_logs_tbl';
const STORAGE_KEY_CATEGORIES = 'student_conduct_categories_tbl';

export default function App() {
  // State initialization with localStorage fallback
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default logged in as Head Teacher
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [logs, setLogs] = useState<InspectionLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_INSPECTION_LOGS;
    } catch {
      return INITIAL_INSPECTION_LOGS;
    }
  });

  const [categories, setCategories] = useState<ViolationCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_VIOLATION_CATEGORIES;
    } catch {
      return INITIAL_VIOLATION_CATEGORIES;
    }
  });

  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'database'>('form');
  const [isSignupView, setIsSignupView] = useState<boolean>(false);
  const [printModalLog, setPrintModalLog] = useState<InspectionLog | null>(null);

  // Sync states to LocalStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  // Handler: Save New Inspection Log and deduct score from Student
  const handleSaveInspection = (newLogData: Omit<InspectionLog, 'id'>) => {
    const generatedId = `LOG-${new Date().getFullYear()}-${String(logs.length + 1).padStart(3, '0')}`;
    const newLog: InspectionLog = {
      ...newLogData,
      id: generatedId,
    };

    // Deduct score from student
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === newLog.studentId) {
          const updatedScore = Math.max(0, s.score - newLog.totalDeductPoints);
          return { ...s, score: updatedScore };
        }
        return s;
      })
    );

    // Add log to history
    setLogs((prev) => [newLog, ...prev]);
  };

  // Handler: Update Existing Inspection Log (adjust student score difference)
  const handleUpdateLog = (updatedLog: InspectionLog) => {
    const oldLog = logs.find((l) => l.id === updatedLog.id);
    if (!oldLog) return;

    const pointDifference = updatedLog.totalDeductPoints - oldLog.totalDeductPoints;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === updatedLog.studentId) {
          const newScore = Math.max(0, Math.min(100, s.score - pointDifference));
          return { ...s, score: newScore };
        }
        return s;
      })
    );

    setLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? updatedLog : l)));
  };

  // Handler: Delete Inspection Log (refund points to student)
  const handleDeleteLog = (logId: string) => {
    const logToDelete = logs.find((l) => l.id === logId);
    if (!logToDelete) return;

    // Refund points to student
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === logToDelete.studentId) {
          const restoredScore = Math.min(100, s.score + logToDelete.totalDeductPoints);
          return { ...s, score: restoredScore };
        }
        return s;
      })
    );

    // Remove from logs list
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  // Handler: Add New Student
  const handleAddStudent = (newStudent: Student) => {
    if (students.some((s) => s.studentId === newStudent.studentId)) {
      alert(`รหัสนักเรียน ${newStudent.studentId} มีอยู่ในระบบแล้ว`);
      return;
    }
    setStudents((prev) => [newStudent, ...prev]);
  };

  // Handler: Add New Violation Category Criteria
  const handleAddCategory = (newCategory: ViolationCategory) => {
    if (categories.some((c) => c.code === newCategory.code)) {
      alert(`รหัสข้อหา ${newCategory.code} มีอยู่ในระบบแล้ว`);
      return;
    }
    setCategories((prev) => [...prev, newCategory]);
  };

  // Handler: Register New Inspector User
  const handleSignupNewUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsSignupView(false);
  };

  // Google Sheet Dataset 1: Sync Users Handler (Both Admin and General Users)
  const handleSyncUsersFromSheet = async (appsScriptUrl?: string): Promise<number> => {
    const adminRes = await fetchUsersFromGoogleSheet(appsScriptUrl, ADMIN_USERS_SHEET_ID, 'admin');
    const userRes = await fetchUsersFromGoogleSheet(appsScriptUrl, GENERAL_USERS_SHEET_ID, 'user');

    const combined = [...(adminRes.users || []), ...(userRes.users || [])];
    if (combined.length > 0) {
      setUsers(combined);
      return combined.length;
    }
    return 0;
  };

  // Google Sheet Dataset 2: Import Details Handler
  const handleImportDetailsFromSheet = async (
    appsScriptUrl?: string
  ): Promise<{ studentCount: number; logCount: number }> => {
    const res = await fetchDetailsFromAppsScript(appsScriptUrl);
    let sCount = 0;
    let lCount = 0;

    if (res.students && res.students.length > 0) {
      setStudents((prev) => {
        const merged = [...prev];
        res.students.forEach((s) => {
          if (!merged.some((m) => m.studentId === s.studentId)) {
            merged.push(s);
            sCount++;
          }
        });
        return merged;
      });
    }

    if (res.logs && res.logs.length > 0) {
      setLogs((prev) => {
        const merged = [...prev];
        res.logs.forEach((l) => {
          if (!merged.some((m) => m.id === l.id)) {
            merged.push(l);
            lCount++;
          }
        });
        return merged;
      });
    }

    return { studentCount: sCount, logCount: lCount };
  };

  // Google Sheet Dataset 2: Export Logs Handler
  const handleExportLogsToAppsScript = async (appsScriptUrl: string): Promise<boolean> => {
    try {
      if (logs.length === 0) return true;
      const latestLog = logs[0];
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(latestLog),
      });
      return res.ok || res.type === 'opaque';
    } catch (e) {
      console.error('Error posting log to Apps Script:', e);
      return false;
    }
  };

  // Handler: Reset Database to Default Seed Data
  const handleResetData = () => {
    setUsers(INITIAL_USERS);
    setStudents(INITIAL_STUDENTS);
    setLogs(INITIAL_INSPECTION_LOGS);
    setCategories(INITIAL_VIOLATION_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_STUDENTS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => {
          setCurrentUser(null);
          setIsSignupView(false);
        }}
        onSwitchUser={() => {
          setCurrentUser(null);
          setIsSignupView(false);
        }}
        onGoToSignup={() => setIsSignupView(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {currentUser ? (
          <>
            {/* Top Overview Cards */}
            <StatsOverview logs={logs} students={students} categories={categories} />

            {/* Active Tab Views */}
            {activeTab === 'form' && (
              <ViolationForm
                students={students}
                categories={categories}
                currentUser={currentUser}
                onSaveInspection={handleSaveInspection}
              />
            )}

            {activeTab === 'history' && (
              <HistoryList
                logs={logs}
                students={students}
                categories={categories}
                currentUser={currentUser}
                onUpdateLog={handleUpdateLog}
                onDeleteLog={handleDeleteLog}
                onOpenPrintModal={(log) => setPrintModalLog(log)}
                onImportDetailsFromSheet={handleImportDetailsFromSheet}
              />
            )}

            {activeTab === 'database' && (
              <DatabaseViewer
                users={users}
                students={students}
                logs={logs}
                categories={categories}
                currentUser={currentUser}
                onAddStudent={handleAddStudent}
                onAddCategory={handleAddCategory}
                onResetData={handleResetData}
                onSyncUsersFromSheet={handleSyncUsersFromSheet}
                onImportDetailsFromSheet={handleImportDetailsFromSheet}
                onExportLogsToAppsScript={handleExportLogsToAppsScript}
              />
            )}
          </>
        ) : isSignupView ? (
          <SignupForm
            users={users}
            onSignup={handleSignupNewUser}
            onCancelToLogin={() => setIsSignupView(false)}
          />
        ) : (
          <LoginForm
            users={users}
            onLogin={(user) => setCurrentUser(user)}
            onGoToSignup={() => setIsSignupView(true)}
            onUpdateUsers={(updatedUsers) => setUsers(updatedUsers)}
          />
        )}
      </main>

      {/* Printable Slip Modal */}
      {printModalLog && (
        <PrintModal
          log={printModalLog}
          student={students.find((s) => s.studentId === printModalLog.studentId)}
          onClose={() => setPrintModalLog(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>ระบบตรวจเช็คระเบียบวินัยนักเรียน (Student Conduct System)</strong>
          </div>
          <div className="text-slate-400">
            พัฒนาสำหรับผู้ตรวจและครูฝ่ายปกครอง • รองรับการหักคะแนนพฤติกรรมและพิมพ์รายงาน
          </div>
        </div>
      </footer>
    </div>
  );
}
