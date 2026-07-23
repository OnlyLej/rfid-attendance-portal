'use client';
import { useState } from 'react';
import { useDarkMode, useIsMobile } from '../../_lib/usePageLayout';
import DashboardTab from '../../_components/DashboardTab';
import PageShell from '../../_components/PageShell';
import ClientProviders from '../../_components/ClientProviders';

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
  const [sidebarCollapsed, toggleSidebar] = useState(true);

  const handleRefresh = () => {
    // Simulate refresh with loading
    console.log('Demo refresh');
  };

  return (
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
          stats={mockStats} 
          weekData={mockWeeklyData} 
          students={mockStudents} 
          logs={mockLogs} 
          classes={mockClasses} 
          loading={false} 
        />
      </div>
    </PageShell>
  );
}

export default function DemoPage() {
  return (
    <ClientProviders>
      <DemoContent />
    </ClientProviders>
  );
}
