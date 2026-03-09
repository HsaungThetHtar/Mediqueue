import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Search, Sun, Moon, Filter, Eye, ChevronDown } from 'lucide-react';
import { Pagination } from '../Pagination';
import { useOutletContext, useNavigate } from 'react-router';

interface CompletedProps {
    queues: any[];
    filteredQueues: any[];
    departmentOptions?: string[];
}

export function Completed() {
    const { queues, departmentOptions } = useOutletContext<CompletedProps>();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sessionFilter, setSessionFilter] = useState('All Sessions');
    const [deptFilter, setDeptFilter] = useState('All Departments');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sessionFilter, deptFilter]);

    const completedQueues = queues.filter((q: any) => q.status === 'completed');

    const filteredData = completedQueues.filter((q: any) => {
        const idStr = q.patientId ? String(q.patientId).slice(-6).toUpperCase() : '';
        const matchesSearch = !searchTerm || q.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.queueNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            idStr.toLowerCase().includes(searchTerm.toLowerCase());

        const isMorning = q.queueNumber?.startsWith('M-');
        const matchesSession = sessionFilter === 'All Sessions' ||
            (sessionFilter === 'Morning' && isMorning) ||
            (sessionFilter === 'Afternoon' && !isMorning);

        const matchesDept = deptFilter === 'All Departments' || q.department === deptFilter;

        return matchesSearch && matchesSession && matchesDept;
    });

    const completedToday = queues.filter(q => q.status === 'completed');
    const morningCount = completedToday.filter(q => q.queueNumber?.startsWith('M-')).length;
    const afternoonCount = completedToday.filter(q => q.queueNumber?.startsWith('A-')).length;

    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(filteredData.length / pageSize);

    const departments = ['All Departments', ...(departmentOptions ?? [...new Set(queues.map((q: any) => q.department))])];

    const idDisplay = (row: any) => row.patientId ? String(row.patientId).slice(-6).toUpperCase() : '—';
    const completedAtDisplay = (row: any) => {
        let date: Date | null = null;
        if (row.updatedAt) date = new Date(row.updatedAt);
        else if (row.createdAt) date = new Date(row.createdAt);
        if (date) {
            const h = date.getHours();
            const m = date.getMinutes();
            return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
        }
        const t = row.checkInTime || '';
        if (typeof t === 'string' && /^\d{1,2}:\d{2}/.test(t)) {
            const [h, m] = t.split(':');
            return `${String(parseInt(h, 10)).padStart(2, '0')}.${String(parseInt(m, 10)).padStart(2, '0')}`;
        }
        return t || '—';
    };

    return (
        <div className="px-4 md:px-6 py-8 w-full mx-auto bg-gray-50/30 min-h-screen">
            {/* Summary Cards - การ์ดขาว มุมโค้ง ไอคอนวงกลมเขียว + checkmark ขาว การ์ดแรก */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[13px] font-semibold text-gray-500 mb-1">Total Completed</p>
                        <p className="text-[32px] font-bold text-gray-900">{completedToday.length}</p>
                    </div>
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[13px] font-semibold text-gray-500 mb-1">Morning Session</p>
                        <p className="text-[32px] font-bold text-gray-900">{morningCount}</p>
                        <p className="text-[12px] text-gray-500 font-medium mt-1">08.00 - 12.00</p>
                    </div>
                    <div className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
                        <Sun className="w-7 h-7 text-white" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[13px] font-semibold text-gray-500 mb-1">Afternoon Session</p>
                        <p className="text-[32px] font-bold text-gray-900">{afternoonCount}</p>
                        <p className="text-[12px] text-gray-500 font-medium mt-1">13.00 - 17.00</p>
                    </div>
                    <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                        <Moon className="w-7 h-7 text-white" />
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar - พื้นขาว ตามแบบ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by patient name, ID, or queue number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[15px] font-medium"
                        />
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative min-w-[140px]">
                            <select
                                value={sessionFilter}
                                onChange={(e) => setSessionFilter(e.target.value)}
                                className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] font-medium text-gray-700 appearance-none cursor-pointer"
                            >
                                <option value="All Sessions">All Sessions</option>
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                            </select>
                            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <div className="relative min-w-[160px]">
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="w-full pl-4 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] font-medium text-gray-700 appearance-none cursor-pointer"
                            >
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Completed Appointments Table */}
            <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-[18px] font-black text-gray-900">Completed Appointments ({filteredData.length})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-5 px-6 font-bold text-gray-500 text-[11px] uppercase tracking-widest">Queue No.</th>
                                <th className="text-left py-5 px-6 font-bold text-gray-500 text-[11px] uppercase tracking-widest">Patient</th>
                                <th className="text-left py-5 px-6 font-bold text-gray-500 text-[11px] uppercase tracking-widest">Department</th>
                                <th className="text-left py-5 px-6 font-bold text-gray-500 text-[11px] uppercase tracking-widest">Doctor</th>
                                <th className="text-left py-5 px-6 font-bold text-gray-500 text-[11px] uppercase tracking-widest">Session</th>
                                <th className="text-left py-5 px-6 font-bold text-gray-500 text-[11px] uppercase tracking-widest">Completed At</th>
                                <th className="text-left py-5 px-6 font-bold text-gray-500 text-[11px] uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.map((row, idx) => (
                                <tr key={row.id || row._id || idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-5 px-6 text-[15px] font-bold text-blue-600">
                                        {row.queueNumber}
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-bold text-gray-900">{row.patientName}</span>
                                            <span className="text-[12px] text-gray-500 font-medium">ID{idDisplay(row)}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-[14px] font-medium text-gray-600">{row.department}</td>
                                    <td className="py-5 px-6 text-[14px] font-medium text-gray-600">{row.doctor || row.doctorName || '—'}</td>
                                    <td className="py-5 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${row.queueNumber?.startsWith('M-')
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {row.queueNumber?.startsWith('M-') ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                                            {row.queueNumber?.startsWith('M-') ? 'Morning' : 'Afternoon'}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 text-[14px] font-medium text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {completedAtDisplay(row)}
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/admin/bookings/${row.id}`)}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Filter className="w-10 h-10 text-gray-200" />
                                            <p className="text-gray-400 font-medium">No results found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <p className="text-[14px] font-medium text-gray-400 cursor-default">
                        Showing <span className="text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span className="text-gray-900 font-bold">{filteredData.length}</span> appointments
                    </p>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
