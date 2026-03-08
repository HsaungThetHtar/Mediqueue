import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Sun, Moon, Play, SkipForward, X, ChevronRight, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { Pagination } from '../Pagination';
import { useNavigate, useOutletContext } from 'react-router';
import { callQueue, skipQueue, completeQueue, updateQueueStatus } from '../../../../api/queues';
import { cancelBooking } from '../../../../api/bookings';

interface QueueManagementProps {
    filterStatus: string;
    setFilterStatus: (status: any) => void;
    filterDepartment: string;
    setFilterDepartment: (dept: string) => void;
    filterDate: string;
    setFilterDate: (date: string) => void;
    filterDoctor: string;
    setFilterDoctor: (doctor: string) => void;
    departments: string[];
    doctors: string[];
    filteredQueues: any[];
    getStatusBadge: (status: any) => React.ReactNode;
    setSelectedQueue: (queue: any) => void;
    refresh: () => void;
}

export function QueueManagement() {
    const {
        filterStatus,
        setFilterStatus,
        filterDepartment,
        setFilterDepartment,
        filterDate,
        setFilterDate,
        filterDoctor,
        setFilterDoctor,
        departments,
        doctors,
        filteredQueues,
        getStatusBadge,
        setSelectedQueue,
        refresh
    } = useOutletContext<QueueManagementProps>();

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filterDepartment, filterDoctor]);

    // Session split: timeSlot, then M-/A- prefix, then hour from checkInTime
    const isMorning = (q: any) => {
        if (q.timeSlot === 'morning') return true;
        if (q.timeSlot === 'afternoon') return false;
        if (q.queueNumber?.startsWith('M-')) return true;
        if (q.queueNumber?.startsWith('A-')) return false;
        const hourPart = String(q.checkInTime || '').split(/[:.]/)[0];
        const h = parseInt(hourPart, 10);
        if (Number.isNaN(h)) return true;
        return h < 12;
    };
    const morningQueues = filteredQueues.filter(isMorning);
    const afternoonQueues = filteredQueues.filter(q => !isMorning(q));

    const totalMorning = morningQueues.length;
    const totalAfternoon = afternoonQueues.length;

    // For general pagination across all queues
    const paginatedQueues = filteredQueues.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(filteredQueues.length / pageSize);

    // Filter sessions based on what is currently visible on the page
    const visibleMorning = paginatedQueues.filter(q => morningQueues.includes(q));
    const visibleAfternoon = paginatedQueues.filter(q => afternoonQueues.includes(q));

    return (
        <div className="px-4 md:px-6 py-8 w-full max-w-full overflow-x-hidden bg-gray-50/50 min-h-screen">

            {/* Filters Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mb-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-5 h-5 flex items-center justify-center">
                        <Filter className="w-4 h-4 text-gray-400" />
                    </div>
                    <h2 className="text-[15px] font-bold text-gray-900">Filters</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-2.5">Date</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px]"
                        />
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-2.5">Status</label>
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] appearance-none cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="waiting">Waiting</option>
                                <option value="checked-in">Checked-in</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="skipped">Skipped</option>
                                <option value="canceled">Cancelled</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-2.5">Department</label>
                        <div className="relative">
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] appearance-none cursor-pointer"
                            >
                                <option value="all">All Departments</option>
                                {departments.filter(d => d !== 'all').map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-2.5">Doctor</label>
                        <div className="relative">
                            <select
                                value={filterDoctor}
                                onChange={(e) => setFilterDoctor(e.target.value)}
                                className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] appearance-none cursor-pointer"
                            >
                                <option value="all">All Doctors</option>
                                {doctors.filter(d => d !== 'all').map(doc => (
                                    <option key={doc} value={doc}>{doc}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Queue Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900">Active Queue ({filteredQueues.length})</h2>
                    <button onClick={() => refresh()} className="w-full sm:w-auto px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm">
                        Refresh Queue
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {/* Morning Session */}
                    {visibleMorning.length > 0 && (
                        <SessionTable
                            title="Morning Session (08.00-12.00)"
                            icon={<Sun className="w-4 h-4 text-orange-500" />}
                            bgColor="bg-[#fffcf5]"
                            queues={visibleMorning}
                            totalCount={totalMorning}
                            getStatusBadge={getStatusBadge}
                            setSelectedQueue={setSelectedQueue}
                            refresh={refresh}
                        />
                    )}

                    {/* Afternoon Session */}
                    {visibleAfternoon.length > 0 && (
                        <SessionTable
                            title="Afternoon Session (13.00-17.00)"
                            icon={<Moon className="w-4 h-4 text-orange-700" />}
                            bgColor="bg-[#fff9f5]"
                            queues={visibleAfternoon}
                            totalCount={totalAfternoon}
                            getStatusBadge={getStatusBadge}
                            setSelectedQueue={setSelectedQueue}
                            refresh={refresh}
                        />
                    )}

                    {filteredQueues.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No results found for current filters</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing {filteredQueues.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredQueues.length)} of {filteredQueues.length} patients
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

function SessionTable({ title, icon, bgColor, queues, totalCount, getStatusBadge, setSelectedQueue, refresh }: any) {
    const navigate = useNavigate();
    const [cancelModal, setCancelModal] = useState<{ show: boolean, queue: any }>({ show: false, queue: null });
    const [editModal, setEditModal] = useState<{ show: boolean, queue: any, newStatus: string }>({ show: false, queue: null, newStatus: '' });
    const [loading, setLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const handleAction = async (queueId: string, action: string, status?: string) => {
        setLoading(true);
        setActionError(null);
        try {
            if (action === 'call') {
                await callQueue(queueId);
            } else if (action === 'skip') {
                await skipQueue(queueId);
            } else if (action === 'cancel') {
                await cancelBooking(queueId);
            } else if (action === 'complete') {
                await completeQueue(queueId);
            } else if (action === 'update' && status) {
                await updateQueueStatus(queueId, status);
            }

            refresh();
            setCancelModal({ show: false, queue: null });
            setEditModal({ show: false, queue: null, newStatus: '' });
        } catch (err: any) {
            console.error(`Failed to ${action} queue:`, err);
            setActionError(err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-w-[1000px]">
            <div className={`${bgColor} px-8 py-4 flex items-center justify-between border-y border-gray-100`}>
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-[15px] font-black text-[#854d0e]">{title}</span>
                </div>
                <span className="text-[13px] font-bold text-[#854d0e]">{totalCount} patients</span>
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-white border-b border-gray-50">
                        <th className="text-left py-4 px-8 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Queue No.</th>
                        <th className="text-left py-4 px-8 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Patient</th>
                        <th className="text-left py-4 px-8 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Department</th>
                        <th className="text-left py-4 px-8 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Doctor</th>
                        <th className="text-left py-4 px-8 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Estimated Time</th>
                        <th className="text-left py-4 px-8 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Status</th>
                        <th className="text-left py-4 px-8 text-[11px] font-bold text-gray-400 tracking-wider uppercase text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {queues.map((queue: any) => (
                        <tr key={queue.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="py-5 px-8">
                                <span className="font-bold text-gray-900">{queue.queueNumber}</span>
                            </td>
                            <td className="py-5 px-8">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 leading-tight">{queue.patientName}</span>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{queue.patientId ? String(queue.patientId).slice(-6) : "—"}</span>
                                </div>
                            </td>
                            <td className="py-5 px-8 text-gray-500 font-medium">{queue.department}</td>
                            <td className="py-5 px-8 text-gray-500 font-medium">{queue.doctor}</td>
                            <td className="py-5 px-8 font-bold text-gray-900">
                                {queue.estimatedTime ? `${queue.estimatedTime}` : '—'}
                            </td>
                            <td className="py-5 px-8">
                                {getStatusBadge(queue.status)}
                            </td>
                            <td className="py-5 px-8">
                                <div className="flex items-center justify-center gap-1.5">
                                    {/* Actions for Waiting/Confirmed/Checked-in */}
                                    {(queue.status === 'waiting' || queue.status === 'confirmed' || queue.status === 'checked-in') && (
                                        <>
                                            <ActionButton
                                                icon={<Play className="w-3.5 h-3.5" />}
                                                color="text-green-600"
                                                bg="bg-green-50"
                                                tooltip="Call Next"
                                                onClick={() => handleAction(queue.id, 'call')}
                                                disabled={loading}
                                            />
                                            <ActionButton
                                                icon={<SkipForward className="w-4 h-4" />}
                                                color="text-gray-500"
                                                bg="bg-gray-50"
                                                tooltip="Skip Queue"
                                                onClick={() => handleAction(queue.id, 'skip')}
                                                disabled={loading}
                                            />
                                        </>
                                    )}
                                    {/* Actions for In-Progress */}
                                    {queue.status === 'in-progress' && (
                                        <ActionButton
                                            icon={<CheckCircle2 className="w-4 h-4" />}
                                            color="text-blue-500"
                                            bg="bg-blue-50"
                                            tooltip="Mark Completed"
                                            onClick={() => handleAction(queue.id, 'complete')}
                                            disabled={loading}
                                        />
                                    )}
                                    {/* Universal Actions */}
                                    {(queue.status === 'waiting' || queue.status === 'confirmed' || queue.status === 'checked-in' || queue.status === 'in-progress') && (
                                        <ActionButton
                                            icon={<X className="w-4 h-4" />}
                                            color="text-red-500"
                                            bg="bg-red-50"
                                            tooltip="Cancel Queue"
                                            onClick={() => setCancelModal({ show: true, queue })}
                                            disabled={loading}
                                        />
                                    )}
                                    <ActionButton
                                        icon={<ChevronRight className="w-4 h-4" />}
                                        color="text-gray-400"
                                        bg="bg-gray-50"
                                        tooltip="View Details"
                                        onClick={() => navigate(`/admin/bookings/${queue.id}`)}
                                    />
                                    <ActionButton
                                        icon={<Edit2 className="w-3.5 h-3.5" />}
                                        color="text-gray-400"
                                        bg="bg-gray-50"
                                        tooltip="Edit Status"
                                        onClick={() => { setActionError(null); setEditModal({ show: true, queue, newStatus: queue.status }); }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Cancel Modal */}
            {cancelModal.show && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-red-600 p-8 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-white">Cancel Queue</h3>
                        </div>
                        <div className="p-8">
                            <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100/50 mb-6">
                                <p className="text-[15px] font-medium text-gray-600 mb-4">
                                    Are you sure you want to cancel the queue for <span className="font-black text-gray-900">{cancelModal.queue.patientName}</span>?
                                </p>
                                <div className="space-y-2 text-[14px] font-bold text-gray-500">
                                    <div className="flex justify-between"><span>Queue:</span> <span className="text-gray-900">{cancelModal.queue.queueNumber}</span></div>
                                    <div className="flex justify-between"><span>ID:</span> <span className="text-gray-900">{cancelModal.queue.patientId ? String(cancelModal.queue.patientId).slice(-6) : "—"}</span></div>
                                    <div className="flex justify-between"><span>Department:</span> <span className="text-gray-900">{cancelModal.queue.department}</span></div>
                                    <div className="flex justify-between"><span>Doctor:</span> <span className="text-gray-900">{cancelModal.queue.doctor ?? '—'}</span></div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl mb-8">
                                <XCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[13px] font-bold text-orange-800 leading-relaxed">
                                    <span className="font-black">Warning:</span> This action will mark this queue as cancelled. The booking will still appear in "All Patients Today" with a cancelled status.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCancelModal({ show: false, queue: null })}
                                    className="flex-1 h-14 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-black transition-all"
                                >
                                    Keep Queue
                                </button>
                                <button
                                    onClick={() => handleAction(cancelModal.queue.id, 'cancel')}
                                    className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"
                                    disabled={loading}
                                >
                                    <XCircle className="w-5 h-5" />
                                    Cancel Queue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Status Modal */}
            {editModal.show && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-blue-600 p-8 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Edit2 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-white">Edit Status</h3>
                        </div>
                        <div className="p-8">
                            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50 mb-6">
                                <p className="text-[15px] font-medium text-gray-600">
                                    Update the status for <span className="font-black text-gray-900">{editModal.queue.patientName}</span>.
                                </p>
                                <div className="mt-4 space-y-1 text-[13px] font-bold text-gray-500">
                                    <div>Queue: {editModal.queue.queueNumber}</div>
                                    <div>ID: {editModal.queue.patientId ? String(editModal.queue.patientId).slice(-6) : "—"}</div>
                                    <div>Dept: {editModal.queue.department}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl mb-8">
                                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <p className="text-[13px] font-bold text-gray-500 leading-relaxed">
                                    This action will update the status of the queue.
                                </p>
                            </div>
                            <div className="mb-8">
                                <label className="block text-[14px] font-black text-gray-900 mb-3 ml-1">New Status</label>
                                <div className="relative group">
                                    <select
                                        className="w-full h-14 bg-white border border-gray-200 rounded-2xl px-6 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-[15px] font-bold text-gray-700 appearance-none cursor-pointer"
                                        value={editModal.newStatus}
                                        onChange={(e) => setEditModal({ ...editModal, newStatus: e.target.value })}
                                        disabled={loading}
                                    >
                                        <option value="waiting">Waiting</option>
                                        <option value="checked-in">Checked-in</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="canceled">Cancelled</option>
                                    </select>
                                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                            {actionError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                                    {actionError}
                                </div>
                            )}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => { setEditModal({ show: false, queue: null, newStatus: '' }); setActionError(null); }}
                                    className="flex-1 h-14 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-black transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(editModal.queue.id, 'update', editModal.newStatus)}
                                    className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                    disabled={loading}
                                >
                                    {loading ? 'กำลังอัปเดต...' : (
                                        <>
                                            <Edit2 className="w-5 h-5" />
                                            Update Status
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionButton({ icon, color, bg, onClick, tooltip, disabled }: any) {
    return (
        <div className="relative group/btn">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`p-2.5 ${bg} ${color} rounded-xl border border-transparent hover:scale-110 transition-all shadow-sm active:scale-90 disabled:opacity-50`}
            >
                {icon}
            </button>
            {tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {tooltip}
                </div>
            )}
        </div>
    );
}
