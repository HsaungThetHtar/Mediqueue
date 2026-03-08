import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router';
import { io } from 'socket.io-client';
import { Users, Phone, SkipForward, CheckCircle } from 'lucide-react';
import { BASE_URL } from '../../api/client';
import { clearSession, getSession } from '../../api/auth';
import { getQueues, callQueue, skipQueue, completeQueue } from '../../api/queues';
import { getDepartments } from '../../api/departments';
import { getDepartmentName } from '../../utils/department';

// Local date YYYY-MM-DD (matches seed "today" when run in same timezone).
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function prevDayISO(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface PrevDayStats {
  total: number;
  checkedIn: number;
  waiting: number;
  inProgress: number;
  completed: number;
}

// Components
import { Sidebar } from './admin/Sidebar';
import { Header } from './admin/Header';

interface Queue {
  id: string;
  queueNumber: string;
  patientName: string;
  department: string;
  doctor: string;
  doctorName: string;
  estimatedTime?: string;
  patientId?: string;
  checkInTime: string;
  date?: string;
  createdAt?: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'skipped' | 'checked-in' | 'confirmed' | 'canceled';
  timeSlot?: 'morning' | 'afternoon';
}

export function AdminDashboard() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [userEmail, setUserEmail] = useState('admin@hospital.com');
  const [userName, setUserName] = useState('Admin User');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Queue['status']>('all');
  const [filterDate, setFilterDate] = useState(todayISO());
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [prevDayStats, setPrevDayStats] = useState<PrevDayStats>({ total: 0, checkedIn: 0, waiting: 0, inProgress: 0, completed: 0 });

  const navigate = useNavigate();
  const location = useLocation();

  // Determine active page from path (เมื่อ login เข้า /admin ให้ active หน้า dashboard)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1] || '';
  const activePage = (lastSegment === 'admin' || lastSegment === '' || lastSegment === 'dashboard') ? 'dashboard' : lastSegment;

  const refresh = async () => {
    try {
      const [data, prevData] = await Promise.all([
        getQueues({ date: filterDate }),
        getQueues({ date: prevDayISO(filterDate) }),
      ]);
      const ui = data.map((q) => ({
        id: q._id,
        queueNumber: q.queueNumber,
        patientName: q.patientName || "Unknown",
        department: getDepartmentName(q.department),
        doctor: q.doctorName,
        doctorName: q.doctorName,
        estimatedTime: q.estimatedTime,
        patientId: q.patientId,
        checkInTime: new Date(q.createdAt).toLocaleTimeString(),
        date: q.date,
        createdAt: q.createdAt,
        status: q.status as any,
        timeSlot: q.timeSlot,
      }));
      setQueues(ui);
      const prev = Array.isArray(prevData) ? prevData : [];
      setPrevDayStats({
        total: prev.length,
        checkedIn: prev.filter((q: any) => q.status === 'checked-in' || q.status === 'completed').length,
        waiting: prev.filter((q: any) => q.status === 'waiting').length,
        inProgress: prev.filter((q: any) => q.status === 'in-progress').length,
        completed: prev.filter((q: any) => q.status === 'completed').length,
      });
    } catch (err) {
      console.error("refresh error", err);
    }
  };

  useEffect(() => {
    refresh();
  }, [filterDate]);

  useEffect(() => {
    getDepartments().then(setDepartmentOptions).catch(() => setDepartmentOptions([]));
  }, []);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUserEmail(session.email);
      setUserName(session.fullName);
    }

    const socket = io(BASE_URL);
    socket.on('queue-update', refresh);
    return () => { socket.disconnect(); };
  }, []);

  // Close sidebar on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const getStatusBadge = (status: Queue['status']) => {
    const styles: Record<string, string> = {
      waiting: 'bg-[#fff8e1] text-[#ff9800] border-[#ffe082]',
      'in-progress': 'bg-[#f3e5f5] text-[#9c27b0] border-[#d1c4e9]',
      completed: 'bg-[#e8f5e9] text-[#4caf50] border-[#a5d6a7]',
      skipped: 'bg-[#ffebee] text-[#f44336] border-[#ef9a9a]',
      'checked-in': 'bg-[#e3f2fd] text-[#2196f3] border-[#90caf9]',
      'confirmed': 'bg-[#e3f2fd] text-[#2196f3] border-[#90caf9]',
      canceled: 'bg-[#ffebee] text-[#c62828] border-[#ef9a9a]',
    };
    const labels: Record<string, string> = {
      waiting: 'Waiting',
      'in-progress': 'In Progress',
      completed: 'Completed',
      skipped: 'Skipped',
      'checked-in': 'Confirmed',
      'confirmed': 'Confirmed',
      canceled: 'Cancelled',
    };
    const currentStyle = styles[status] || 'bg-gray-100 text-gray-500 border-gray-200';
    const currentLabel = labels[status] || status;

    return (
      <span className={`px-4 py-1 rounded-full text-[12px] font-black border-2 shadow-sm ${currentStyle}`}>
        {currentLabel.toUpperCase()}
      </span>
    );
  };

  const departments = ['all', ...departmentOptions];
  const doctors = ['all', ...new Set(queues.map(q => q.doctor).filter(Boolean))];
  const filteredQueues = queues.filter(queue => {
    const matchDept = filterDepartment === 'all' || queue.department === filterDepartment;
    const matchStatus = filterStatus === 'all' || queue.status === filterStatus;
    const matchDoctor = filterDoctor === 'all' || queue.doctor === filterDoctor;
    return matchDept && matchStatus && matchDoctor;
  });

  const handleCallQueue = async (id: string) => { await callQueue(id); refresh(); setSelectedQueue(null); };
  const handleSkipQueue = async (id: string) => { await skipQueue(id); refresh(); setSelectedQueue(null); };
  const handleCompleteQueue = async (id: string) => { await completeQueue(id); refresh(); setSelectedQueue(null); };

  const contextValues = {
    queues,
    getStatusBadge,
    filteredQueues,
    filterStatus,
    setFilterStatus,
    filterDepartment,
    setFilterDepartment,
    filterDate,
    setFilterDate,
    filterDoctor,
    setFilterDoctor,
    departments,
    departmentOptions,
    doctors,
    setSelectedQueue,
    refresh,
    prevDayStats,
    userEmail,
    userName
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => navigate(`/admin/${page}`)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header
          activePage={activePage}
          userEmail={userEmail}
          userName={userName}
          isProfileOpen={isProfileOpen}
          setIsProfileOpen={setIsProfileOpen}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 p-0 overflow-x-hidden w-full relative">
          <Outlet context={contextValues} />
        </main>

        {selectedQueue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold">Queue Actions</h3>
                <button onClick={() => setSelectedQueue(null)} className="text-gray-400 font-bold text-2xl">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm"><Users /></div>
                  <div>
                    <div className="text-xs text-blue-600 font-bold uppercase">Patient</div>
                    <div className="text-lg font-bold">{selectedQueue.patientName} ({selectedQueue.queueNumber})</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleCallQueue(selectedQueue.id)} className="p-4 bg-purple-50 text-purple-700 rounded-xl font-bold flex flex-col items-center gap-2"><Phone />Call Next</button>
                  <button onClick={() => handleSkipQueue(selectedQueue.id)} className="p-4 bg-orange-50 text-orange-700 rounded-xl font-bold flex flex-col items-center gap-2"><SkipForward />Skip</button>
                  <button onClick={() => handleCompleteQueue(selectedQueue.id)} className="p-4 bg-green-50 text-green-700 rounded-xl font-bold flex flex-col items-center gap-2 col-span-2"><CheckCircle />Complete Session</button>
                </div>
                <button onClick={() => setSelectedQueue(null)} className="w-full py-2 text-gray-500 font-medium">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
