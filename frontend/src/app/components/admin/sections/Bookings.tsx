import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, X, ChevronDown, Filter, FileText, Download, UserX, AlertTriangle, CheckCircle } from 'lucide-react';
import { Pagination } from '../Pagination';
import { useOutletContext, useNavigate } from 'react-router';
import { callQueue, skipQueue, completeQueue, updateQueueStatus } from '../../../../api/queues';
import { cancelBooking } from '../../../../api/bookings';
import { BASE_URL } from '../../../../api/client';

interface BookingsProps {
    queues: any[];
    getStatusBadge: (status: any) => React.ReactNode;
    filteredQueues: any[];
    setSelectedQueue: (queue: any) => void;
    refresh: () => void;
    departmentOptions?: string[];
}

export function Bookings() {
    const { filteredQueues, setSelectedQueue, refresh, departmentOptions } = useOutletContext<BookingsProps>();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [cancelModal, setCancelModal] = useState<{ show: boolean, queue: any }>({ show: false, queue: null });
    const [editModal, setEditModal] = useState<{ show: boolean, queue: any, newStatus: string }>({ show: false, queue: null, newStatus: '' });
    const [loading, setLoading] = useState(false);

    const handleAction = async (queueId: string, action: string, status?: string) => {
        setLoading(true);
        try {
            if (action === 'cancel') {
                await cancelBooking(queueId);
            } else if (action === 'update' && status) {
                await updateQueueStatus(queueId, status);
            }

            refresh();
            setCancelModal({ show: false, queue: null });
            setEditModal({ show: false, queue: null, newStatus: '' });
        } catch (err) {
            console.error(`Failed to ${action} queue:`, err);
        } finally {
            setLoading(false);
        }
    };

    // Local filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [deptFilter, setDeptFilter] = useState('All Departments');
    const [doctorFilter, setDoctorFilter] = useState('All Doctors');

    const deptOptions = ['All Departments', ...(departmentOptions ?? [...new Set(filteredQueues.map((q: any) => q.department).filter(Boolean))])];
    const doctorOptions = ['All Doctors', ...new Set(filteredQueues.map((q: any) => q.doctor).filter(Boolean))];

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFilter, statusFilter, deptFilter, doctorFilter]);

    // Enhanced filtering logic with real data
    const processedBookings = filteredQueues.filter(q => {
        const matchesSearch = !searchTerm || q.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.queueNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(q.patientId ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        const statusMap: Record<string, string> = { 'Waiting': 'waiting', 'In Progress': 'in-progress', 'Confirmed': 'confirmed', 'Checked-in': 'checked-in', 'Completed': 'completed', 'Cancelled': 'canceled' };
        const matchStatus = statusFilter === 'All Statuses' || (q.status && (statusMap[statusFilter] || statusFilter.toLowerCase().replace(/\s/g, '-')) === (q.status as string).toLowerCase());
        const matchesStatus = matchStatus;
        const matchesDept = deptFilter === 'All Departments' || q.department === deptFilter;
        const matchesDoctor = doctorFilter === 'All Doctors' || q.doctor === doctorFilter;
        const matchesDate = !dateFilter || q.date === dateFilter;
        return matchesSearch && matchesStatus && matchesDept && matchesDoctor && matchesDate;
    }).map(q => ({
        ...q,
        bookingId: q.id ? `SJ-${(q.date || '').replace(/-/g, '')}-${String(q.queueNumber).replace(/[^0-9]/g, '').padStart(3, '0')}` : `BK-${q.queueNumber}`,
        session: q.queueNumber?.startsWith('M-') ? 'Morning' : 'Afternoon',
        date: q.date ? new Date(q.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—',
        estimatedTimeRange: toTimeRange(q.estimatedTime),
    }));

    function toTimeRange(t?: string) {
        if (!t) return '—';
        const [h, m] = t.split(/[:.]/).map(Number);
        const endM = (m ?? 0) + 15;
        const endH = (h ?? 0) + (endM >= 60 ? 1 : 0);
        const endM2 = endM % 60;
        return `${String(h ?? 0).padStart(2, '0')}.${String(m ?? 0).padStart(2, '0')} - ${String(endH).padStart(2, '0')}.${String(endM2).padStart(2, '0')}`;
    }

    const paginatedBookings = processedBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(processedBookings.length / pageSize);

    return (
        <div className="px-4 md:px-6 py-8 w-full mx-auto bg-gray-50/30 min-h-screen">
            {/* Filters Section */}
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 md:p-10 mb-10 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <h2 className="text-[17px] font-black text-gray-900 tracking-tight">Search & Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <FilterInput
                        label="Search"
                        icon={<Search className="w-4.5 h-4.5 text-gray-400" />}
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        placeholder="Search by patient, ID, or queue number..."
                    />
                    <FilterInput
                        label="Date"
                        type="date"
                        value={dateFilter}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
                        placeholder="วว/ดด/ปปปป"
                    />
                    <FilterSelect
                        label="Status"
                        value={statusFilter}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                        options={['All Statuses', 'Waiting', 'In Progress', 'Confirmed', 'Checked-in', 'Completed', 'Cancelled']}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FilterSelect
                        label="Department"
                        value={deptFilter}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDeptFilter(e.target.value)}
                        options={deptOptions}
                    />
                    <FilterSelect
                        label="Doctor"
                        value={doctorFilter}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDoctorFilter(e.target.value)}
                        options={doctorOptions}
                    />
                </div>
            </div>

            {/* Table Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 px-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    All Bookings <span className="text-blue-500 ml-2">({processedBookings.length})</span>
                </h2>
                <button
                    onClick={() => {
                        const header = ['Booking ID', 'Queue No.', 'Session', 'Patient', 'Department', 'Doctor', 'Date', 'Estimated Time', 'Status'];
                        const rows = processedBookings.map(row => [
                            row.bookingId,
                            row.queueNumber,
                            row.session,
                            row.patientName,
                            row.department,
                            row.doctor,
                            row.date,
                            row.estimatedTime || '',
                            row.status,
                        ]);
                        const csv = [header, ...rows]
                            .map(cols => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
                            .join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }}
                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 group"
                >
                    <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                    Export CSV
                </button>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1400px]">
                        <thead className="bg-white border-b border-gray-100">
                            <tr>
                                <th className="py-6 px-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Booking ID</th>
                                <th className="py-6 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Queue No.</th>
                                <th className="py-6 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Session</th>
                                <th className="py-6 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Patient</th>
                                <th className="py-6 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Department</th>
                                <th className="py-6 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Doctor</th>
                                <th className="py-6 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Date</th>
                                <th className="py-6 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Estimated Time</th>
                                <th className="py-6 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Status</th>
                                <th className="py-6 px-10 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedBookings.map((row) => (
                                <tr key={row.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-7 px-10">
                                        <span className="font-bold text-gray-900 text-[14px] leading-relaxed block">{row.bookingId}</span>
                                    </td>
                                    <td className="py-7 px-6 font-black text-gray-900 text-[15px]">{row.queueNumber}</td>
                                    <td className="py-7 px-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${row.session === 'Morning'
                                            ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                            : 'bg-purple-50 text-purple-600 border border-purple-100'
                                            }`}>
                                            {row.session}
                                        </span>
                                    </td>
                                    <td className="py-7 px-6">
                                        <span className="font-black text-gray-900 text-[15px]">{row.patientName}</span>
                                    </td>
                                    <td className="py-7 px-6 font-bold text-gray-400 text-[14px]">{row.department}</td>
                                    <td className="py-7 px-6 font-bold text-gray-700 text-[14px]">{row.doctor?.startsWith('Dr.') ? row.doctor : `Dr. ${row.doctor}`}</td>
                                    <td className="py-7 px-6 font-bold text-gray-500 text-[14px] whitespace-nowrap">{row.date}</td>
                                    <td className="py-7 px-6 font-black text-gray-900 text-[14px]">{row.estimatedTimeRange}</td>
                                    <td className="py-7 px-6">
                                        <StatusBadge status={row.status} />
                                    </td>
                                    <td className="py-7 px-10">
                                        <div className="flex items-center justify-center gap-2">
                                            <button type="button" onClick={() => navigate(`/admin/bookings/${row.id}`)} className="w-10 h-10 rounded-full border-2 border-blue-500 bg-white text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors shrink-0" title="View Details"><Eye className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => setEditModal({ show: true, queue: row, newStatus: row.status || 'waiting' })} className="w-10 h-10 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0" title="Edit"><Edit className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => setCancelModal({ show: true, queue: row })} className="w-10 h-10 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0" title="Delete"><X className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination — ตามแบบ: Showing X to Y of Z ทางซ้าย, < 1 2 > ทางขวา */}
                <div className="px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[14px] text-gray-500 font-medium">
                        Showing {processedBookings.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, processedBookings.length)} of {processedBookings.length} bookings
                    </p>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Edit Status Modal */}
            {editModal.show && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#248df9] p-6 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Edit className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-[20px] font-bold text-white">Edit Booking Status</h3>
                        </div>
                        <div className="p-8">
                            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                                <p className="text-[14px] font-medium text-gray-500 mb-1">Patient</p>
                                <p className="text-[18px] font-bold text-gray-900 mb-4">{editModal.queue.patientName}</p>
                                <div className="text-[14px] font-medium text-gray-600 space-y-1">
                                    <p>Booking ID: {editModal.queue.bookingId}</p>
                                    <p>Queue: {editModal.queue.queueNumber}</p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <p className="text-[15px] font-bold text-gray-800 mb-3">Current Status</p>
                                <div className="w-fit">
                                    <StatusBadge status={editModal.queue.status} />
                                </div>
                            </div>
                            <div className="mb-8">
                                <p className="text-[15px] font-bold text-gray-800 mb-3">New Status</p>
                                <div className="relative group">
                                    <select
                                        className="w-full h-[52px] bg-white border border-gray-200 rounded-xl px-5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-[15px] font-medium text-gray-900 appearance-none cursor-pointer shadow-sm"
                                        value={editModal.newStatus}
                                        onChange={(e) => setEditModal({ ...editModal, newStatus: e.target.value })}
                                        disabled={loading}
                                    >
                                        <option value="waiting">Waiting</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="checked-in">Checked-in</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="canceled">Cancelled</option>
                                    </select>
                                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setEditModal({ show: false, queue: null, newStatus: '' })}
                                    className="flex-1 h-[52px] bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(editModal.queue._id || editModal.queue.id, 'update', editModal.newStatus)}
                                    className="flex-1 h-[52px] bg-[#248df9] hover:bg-blue-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                                    disabled={loading}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Booking Modal */}
            {cancelModal.show && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-[#dc2626] p-6 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <UserX className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-[20px] font-bold text-white">Cancel Booking</h3>
                        </div>
                        <div className="p-8">
                            <div className="bg-white border border-red-100 rounded-2xl p-6 mb-6 shadow-sm">
                                <p className="text-[16px] text-gray-700 mb-4 leading-relaxed">
                                    Are you sure you want to cancel the booking for <span className="font-bold text-gray-900">{cancelModal.queue.patientName}</span>?
                                </p>
                                <div className="space-y-1.5 text-[14px] text-gray-600 font-medium">
                                    <p>Booking ID: {cancelModal.queue.bookingId}</p>
                                    <p>Queue: {cancelModal.queue.queueNumber}</p>
                                    <p>Department: {cancelModal.queue.department}</p>
                                    <p>Doctor: Dr. {cancelModal.queue.doctor}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 mb-8">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-[14px] text-red-600 leading-relaxed font-medium">
                                    <span className="font-bold">Warning:</span> This action will mark this booking as cancelled. The booking will still appear in "All Patients Today" with a cancelled status.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCancelModal({ show: false, queue: null })}
                                    className="flex-1 h-[52px] bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl font-bold transition-all"
                                >
                                    Keep Booking
                                </button>
                                <button
                                    onClick={() => handleAction(cancelModal.queue._id || cancelModal.queue.id, 'cancel')}
                                    className="flex-1 h-[52px] bg-[#dc2626] hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                                    disabled={loading}
                                >
                                    <UserX className="w-5 h-5" />
                                    Cancel Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterInput({ label, icon, ...props }: any) {
    return (
        <div className="w-full">
            <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2">{icon}</div>}
                <input
                    {...props}
                    className={`w-full ${icon ? 'pl-14' : 'px-6'} h-14 bg-white border border-gray-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-[15px] font-bold text-gray-700 shadow-sm`}
                />
            </div>
        </div>
    );
}

function FilterSelect({ label, value, onChange, options }: any) {
    return (
        <div className="w-full">
            <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{label}</label>
            <div className="relative group">
                <select
                    value={value}
                    onChange={onChange}
                    className="w-full px-6 h-14 bg-white border border-gray-200 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-[15px] font-bold text-gray-700 appearance-none cursor-pointer shadow-sm pr-12"
                >
                    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = (status ?? '').toLowerCase().replace(/\s/g, '-');
    const config: Record<string, { label: string; className: string }> = {
        'in-progress': { label: 'In Progress', className: 'bg-purple-50 text-purple-600 border-purple-100' },
        waiting: { label: 'Waiting', className: 'bg-amber-50 text-amber-700 border-amber-200' },
        confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-600 border-blue-100' },
        'checked-in': { label: 'Checked-in', className: 'bg-blue-50 text-blue-600 border-blue-100' },
        completed: { label: 'Completed', className: 'bg-green-50 text-green-600 border-green-100' },
        canceled: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-100' },
    };
    const c = config[s] || { label: status || '—', className: 'bg-gray-100 text-gray-600 border-gray-200' };
    return (
        <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${c.className} inline-block text-center`}>
            {c.label}
        </span>
    );
}

