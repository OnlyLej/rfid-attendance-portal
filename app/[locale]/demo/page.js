'use client';
import { useState, useEffect } from 'react';
import { useDarkMode, useIsMobile, useSidebarCollapse } from '../../_lib/usePageLayout';
import DashboardTab from '../../_components/DashboardTab';
import PageShell from '../../_components/PageShell';
import ClientProviders from '../../_components/ClientProviders';
import { AppProvider } from '../../_lib/AppContext';

// Mock data for demo
const mockStudents = [
  { id: '1', name: 'Juan Dela Cruz', rfid: 'A1B2C3D4', section: 'Grade 7-A', status: 'present' },
  { id: '2', name: 'Maria Santos', rfid: 'E5F6G7H8', section: 'Grade 7-A', status: 'present' },
  { id: '3', name: 'Jose Rizal', rfid: 'I9J0K1L2', section: 'Grade 7-B', status: 'absent' },
  { id: '4', name: 'Andres Bonifacio', rfid: 'M3N4O5P6', section: 'Grade 8-A', status: 'present' },
  { id: '5', name: 'Gabriela Silang', rfid: 'Q7R8S9T0', section: 'Grade 8-A', status: 'present' },
  { id: '6', name: 'Emilio Aguinaldo', rfid: 'U1V2W3X4', section: 'Grade 9-A', status: 'late' },
  { id: '7', name: 'Apolinario Mabini', rfid: 'Y5Z6A7B8', section: 'Grade 9-A', status: 'present' },
  { id: '8', name: 'Sultan Kudarat', rfid: 'C9D0E1F2', section: 'Grade 10-A', status: 'present' },
];

const mockLogs = [
  { id: '1', studentId: '1', studentName: 'Juan Dela Cruz', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'check-in' },
  { id: '2', studentId: '2', studentName: 'Maria Santos', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'check-in' },
  { id: '3', studentId: '4', studentName: 'Andres Bonifacio', timestamp: new Date(Date.now() - 5400000).toISOString(), type: 'check-in' },
  { id: '4', studentId: '5', studentName: 'Gabriela Silang', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'check-in' },
  { id: '5', studentId: '6', studentName: 'Emilio Aguinaldo', timestamp: new Date(Date.now() - 900000).toISOString(), type: 'check-in' },
];

const mockClasses = [
  { id: '1', name: 'Grade 7-A', teacher: 'Ms. Reyes', students: 25 },
  { id: '2', name: 'Grade 7-B', teacher: 'Mr. Cruz', students: 28 },
  { id: '3', name: 'Grade 8-A', teacher: 'Mrs. Santos', students: 30 },
  { id: '4', name: 'Grade 9-A', teacher: 'Mr. Garcia', students: 27 },
  { id: '5', name: 'Grade 10-A', teacher: 'Ms. Tan', students: 32 },
];

const mockStats = {
  totalStudents: 145,
  presentToday: 128,
  absentToday: 17,
  attendanceRate: 88,
  checkinsToday: 342,
  uptime: 99.9,
  responseTime: 85,
};

const mockWeeklyData = [
  { day: 'Mon', present: 132, absent: 13 },
  { day: 'Tue', present: 138, absent: 7 },
  { day: 'Wed', present: 140, absent: 5 },
  { day: 'Thu', present: 128, absent: 17 },
  { day: 'Fri', present: 135, absent: 10 },
];

function DemoContent() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set up demo user context on mount
  useEffect(() => {
    setMounted(true);
    
    // Check if user is returning to demo without proper demo mode setup
    const isDemoMode = sessionStorage.getItem('isDemoMode') === 'true';
    const hasDemoToken = sessionStorage.getItem('sessionToken') === 'demo-token';
    
    if (!isDemoMode || !hasDemoToken) {
      // User navigated to demo without proper setup - show exit confirmation
      setShowExitConfirm(true);
      return;
    }

    // Ensure mock data is persisted
    if (!sessionStorage.getItem('demoData')) {
      sessionStorage.setItem('demoData', JSON.stringify({
        students: mockStudents,
        logs: mockLogs,
        classes: mockClasses,
        stats: mockStats,
        weeklyData: mockWeeklyData
      }));
    }

  }, []);

  const handleRefresh = () => {
    // Simulate refresh with loading
    console.log('Demo refresh');
  };

  const handleExitDemo = () => {
    // Clear demo-specific data and redirect
    sessionStorage.removeItem('isDemoMode');
    sessionStorage.removeItem('demoData');
    window.location.href = '/';
  };

  const handleStayInDemo = () => {
    // Set up demo mode properly and continue
    sessionStorage.setItem('isDemoMode', 'true');
    sessionStorage.setItem('sessionToken', 'demo-token');
    sessionStorage.setItem('userType', 'teacher');
    sessionStorage.setItem('userInfo', JSON.stringify({
      fullName: 'Demo Teacher',
      username: 'demo',
    }));
    sessionStorage.setItem('loginTime', Date.now().toString());
    
    // Ensure mock data is persisted
    sessionStorage.setItem('demoData', JSON.stringify({
      students: mockStudents,
      logs: mockLogs,
      classes: mockClasses,
      stats: mockStats,
      weeklyData: mockWeeklyData
    }));
    
    setShowExitConfirm(false);
  };

  // Load persisted data or use defaults
  const [displayData, setDisplayData] = useState({
    students: mockStudents,
    logs: mockLogs,
    classes: mockClasses,
    stats: mockStats,
    weeklyData: mockWeeklyData
  });

  useEffect(() => {
    if (mounted) {
      const savedData = sessionStorage.getItem('demoData');
      if (savedData) {
        setDisplayData(JSON.parse(savedData));
      }
    }
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <PageShell 
        darkMode={darkMode} 
        toggleTheme={toggleTheme} 
        isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} 
        toggleSidebar={toggleSidebar}
        loading={false} 
        onRefresh={handleRefresh}
      >
        <div className="fade-in-up">
          <DashboardTab 
            darkMode={darkMode} 
            stats={displayData.stats} 
            weekData={displayData.weeklyData} 
            students={displayData.students} 
            logs={displayData.logs} 
            classes={displayData.classes} 
            loading={false} 
          />
        </div>
      </PageShell>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
          <div className={`relative w-full max-w-sm rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#0d1220] border-white/10' : 'bg-white border-gray-200'}`} style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            <div className="p-7 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Demo Mode</h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>You're entering demo mode. Would you like to continue with the demo or exit?</p>
              <div className="flex gap-2.5">
                <button onClick={handleExitDemo} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:scale-105 active:scale-95 ${darkMode ? 'border-white/10 text-gray-300 hover:bg-white/6' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Exit</button>
                <button onClick={handleStayInDemo} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95" style={{ background: '#0ea5e9' }}>Continue Demo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DemoPage() {
  return (
    <AppProvider>
      <ClientProviders>
        <DemoContent />
      </ClientProviders>
    </AppProvider>
  );
}
