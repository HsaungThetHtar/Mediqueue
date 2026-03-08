import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, Users, Search, ChevronDown, Sun, Moon, Filter } from 'lucide-react';
import { Pagination } from '../Pagination';
import { useOutletContext } from 'react-router';
import { cancelBooking } from '../../../../api/bookings';
import { updateQueueStatus } from '../../../../api/queues';
import { getDepartmentName } from '../../../../utils/department';

interface WaitingListProps {
    queues: any[];
    getStatusBadge: (status: any) => React.ReactNode;
    filteredQueues: any[];
    setSelectedQueue: (queue: any) => void;
    refresh: () => void;
}

export function WaitingList() {
    const { queues, getStatusBadge, filteredQueues, setSelectedQueue, refresh } = useOutletContext<WaitingListProps>();
    const [currentPage, setCurrentPage] = useState(1);
    const [currentTime, setCurrentTime] = useState(new Date().getTime());
    const pageSize = 10;
    const cancelingRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().getTime()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleCancelQueue = async (id: string) => {
        if (cancelingRef.current.has(id)) return;
        cancelingRef.current.add(id);
        try {
            await cancelBooking(id);
            refresh();
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const targetStatus = newStatus.toLowerCase().replace(/\s+/g, '-');
            const statusMap: Record<string, string> = {
                'waiting': 'waiting',
                'in-progress': 'in-progress',
                'called': 'in-progress',
                'completed': 'completed',
                'canceled': 'canceled',
                'cancelled': 'canceled',
            };
            const apiStatus = statusMap[targetStatus] ?? targetStatus;
            await updateQueueStatus(id, apiStatus);
            refresh();
        } catch (err: any) {
            console.error(err);
            alert(err?.message || 'เปลี่ยนสถานะไม่ได้');
        }
    };

    const waitingCount = queues.filter(q => q.status === 'waiting' || q.status === 'confirmed').length;
    const calledCount = queues.filter(q => q.status === 'checked-in' || q.status === 'in-progress' || q.status === 'completed').length;
    const cancelledCount = queues.filter(q => q.status === 'canceled').length;
    const inProgressCount = filteredQueues.filter(q => q.status === 'in-progress').length;
    const completedCount = filteredQueues.filter(q => q.status === 'completed').length;

    const stats = [
        { label: 'Currently Waiting', value: waitingCount.toString(), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Called Today', value: calledCount.toString(), icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Cancelled Today', value: cancelledCount.toString(), icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    ];

    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const activeItems = filteredQueues
        .filter(q => q.status === 'waiting' || q.status === 'confirmed');

    // Auto-cancel when "Time left" (10 min from createdAt) has expired
    useEffect(() => {
        const active = filteredQueues.filter(q => q.status === 'waiting' || q.status === 'confirmed');
        active.forEach(q => {
            const createdAtMs = q.createdAt ? new Date(q.createdAt).getTime() : 0;
            if (!createdAtMs || !q.id) return;
            const deadlineMs = createdAtMs + TEN_MINUTES_MS;
            if (currentTime >= deadlineMs && !cancelingRef.current.has(q.id)) {
                handleCancelQueue(q.id);
            }
        });
    }, [currentTime, filteredQueues]);

    // Format data for Active Waiting List — Time left = 10 minutes from createdAt
    const activeWaitingItems = activeItems.map(q => {
        const createdAtMs = q.createdAt ? new Date(q.createdAt).getTime() : currentTime;
        const deadlineMs = createdAtMs + TEN_MINUTES_MS;
        const diffMs = Math.max(0, deadlineMs - currentTime);
        const totalSeconds = Math.floor(diffMs / 1000);
        const minutesLeft = Math.floor(totalSeconds / 60);
        const secondsLeft = totalSeconds % 60;
        const timeLeft = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
        const appointmentTime = q.estimatedTime || '09:00';

        return {
            id: q.id,
            queue: q.queueNumber,
            name: q.patientName,
            dept: getDepartmentName(q.department),
            doctor: q.doctor,
            timeLeft,
            appointment: appointmentTime,
            checkIn: q.checkInTime || '14:30:00',
            session: q.queueNumber?.startsWith('M-') ? 'morning' : 'afternoon',
            warning: minutesLeft < 3,
            originalStatus: q.status
        };
    });

    const paginatedAllPatients = filteredQueues.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(filteredQueues.length / pageSize);

    return (
        <div className="px-4 md:px-6 py-8 w-full mx-auto bg-gray-50/30 min-h-screen">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
                            <div className={`w-[72px] h-[72px] ${stat.bg} rounded-3xl flex items-center justify-center`}>
                                <Icon className={`w-8 h-8 ${stat.color}`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[32px] font-black text-gray-900 leading-none mb-1">{stat.value}</span>
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Waiting List Section */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-10">
                <div className="p-8 md:p-10 border-b border-gray-50 flex items-start flex-col gap-2">
                    <h2 className="text-[22px] font-black text-gray-900 tracking-tight">Active Waiting List</h2>
                    <p className="text-[14px] font-bold text-gray-500">Patients have 10 minutes to respond before their queue is automatically cancelled</p>
                </div>

                <div className="divide-y divide-gray-50">
                    {/* Morning Session */}
                    <SessionGroup
                        title="Morning Session (08.00-12.00)"
                        icon={<Sun className="w-5 h-5 text-[#b45d00]" />}
                        items={activeWaitingItems.filter(i => i.session === 'morning')}
                        onCancel={handleCancelQueue}
                        onStatusChange={handleStatusChange}
                    />

                    {/* Afternoon Session */}
                    <SessionGroup
                        title="Afternoon Session (13.00-17.00)"
                        icon={<Moon className="w-5 h-5 text-[#b45d00]" />}
                        items={activeWaitingItems.filter(i => i.session === 'afternoon')}
                        onCancel={handleCancelQueue}
                        onStatusChange={handleStatusChange}
                    />
                </div>
            </div>

            {/* All Patients Today Section */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-10">
                <div className="p-8 md:p-10 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                    <h2 className="text-[20px] font-black text-gray-900 tracking-tight">All Patients Today</h2>
                    <div className="flex gap-3">
                        <span className="bg-purple-50 px-5 py-2.5 rounded-xl text-[13px] font-bold text-purple-600 border border-purple-100">
                            In Progress: {inProgressCount}
                        </span>
                        <span className="bg-green-50 px-5 py-2.5 rounded-xl text-[13px] font-bold text-green-600 border border-green-100">
                            Completed: {completedCount}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-100">
                            <tr>
                                <th className="py-5 px-10 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Queue No.</th>
                                <th className="py-5 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Patient</th>
                                <th className="py-5 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Department</th>
                                <th className="py-5 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Doctor</th>
                                <th className="py-5 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                                <th className="py-5 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="py-5 px-10 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedAllPatients.map((q) => (
                                <tr key={q.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-6 px-10 font-black text-gray-900 text-[15px]">{q.queueNumber}</td>
                                    <td className="py-6 px-6 font-bold text-gray-700 text-[15px]">{q.patientName}</td>
                                    <td className="py-6 px-6 font-bold text-gray-400 text-[14px]">{getDepartmentName(q.department)}</td>
                                    <td className="py-6 px-6 font-bold text-gray-700 text-[14px]">Dr. {q.doctor}</td>
                                    <td className="py-6 px-6 font-bold text-gray-500 text-[14px]">{q.checkInTime || '14.30'}</td>
                                    <td className="py-6 px-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase border ${
                                            q.status === 'waiting'
                                                ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
                                                : q.status === 'in-progress'
                                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                : q.status === 'completed'
                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                : q.status === 'canceled'
                                                ? 'bg-red-50 text-red-500 border-red-100'
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                            {q.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-6 px-10">
                                        <div className="flex justify-center">
                                            <div className="relative">
                                                <select
                                                    className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-10 text-[13px] font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer shadow-sm"
                                                    value={q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                                                    onChange={(e) => handleStatusChange(q.id, e.target.value)}
                                                >
                                                    <option value="Waiting">Waiting</option>
                                                    <option value="In-progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Canceled">Cancelled</option>
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-10 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[15px] text-gray-400 font-bold">
                        Showing {filteredQueues.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredQueues.length)} of {filteredQueues.length} patients
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

function SessionGroup({ title, icon, items, onCancel, onStatusChange }: any) {
    return (
        <div className="session-container">
            <div className="bg-[#FFF9F2] px-8 py-5 flex items-center justify-between border-y border-[#FFEBD4]">
                <div className="flex items-center gap-3">
                    {icon}
                    <h3 className="text-[15px] font-black text-[#B45D00]">{title}</h3>
                </div>
                <span className="text-[14px] font-black text-[#B45D00]">{items.length} waiting</span>
            </div>

            <div className="p-6 md:p-8 space-y-4">
                {items.map((item: any) => (
                    <div key={item.id} className="flex flex-col xl:flex-row xl:items-center justify-between p-6 border border-gray-100 rounded-3xl hover:bg-gray-50/50 transition-all gap-6 shadow-sm">
                        <div className="flex items-start md:items-center gap-5 flex-1">
                            <div className="w-14 h-14 bg-blue-50/80 rounded-[20px] flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-[18px] font-black text-gray-900">{item.name}</h4>
                                    <span className="bg-blue-50 px-3 py-1 rounded-lg text-[12px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
                                        {item.queue}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-bold text-gray-400">
                                    <span className="text-gray-400">{item.dept}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-gray-400">{item.doctor}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px] font-bold text-gray-400 mt-1">
                                    <div className="text-gray-500">
                                        <span className="text-gray-400 mr-1.5">Appointment:</span>{item.appointment}
                                    </div>
                                    <div className="text-gray-400">
                                        <span className="text-gray-300 mr-1.5">Check-in time:</span>{item.checkIn}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between xl:justify-end gap-4 pl-0 xl:border-l border-gray-100/0 pt-2 xl:pt-0">
                            <div className={`px-6 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[150px] ${item.warning ? 'bg-[#FFF9E6] border border-[#FFE082]' : 'bg-[#EBFBEE] border border-[#C6F6D5]'
                                }`}>
                                <div className={`text-[22px] font-black tracking-tight ${item.warning ? 'text-[#D97706]' : 'text-[#16A34A]'} flex items-center gap-2 leading-none mb-1`}>
                                    <Clock className="w-5 h-5 flex-shrink-0" />
                                    {item.timeLeft}
                                </div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${item.warning ? 'text-[#D97706]/70' : 'text-[#16A34A]/70'}`}>Time Left</div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <select
                                        className="appearance-none bg-white border border-gray-200 rounded-2xl px-5 py-3.5 pr-10 text-[14px] font-bold text-gray-700 hover:border-gray-300 transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-50"
                                        value={item.originalStatus === 'checked-in' ? 'Called' : item.originalStatus.charAt(0).toUpperCase() + item.originalStatus.slice(1)}
                                        onChange={(e) => onStatusChange(item.id, e.target.value)}
                                    >
                                        <option value="Waiting">Waiting</option>
                                        <option value="Called">Called</option>
                                        <option value="In-progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Canceled">Cancelled</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <button
                                    onClick={() => onCancel(item.id)}
                                    className="px-6 h-[50px] bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-2xl font-black text-[14px] transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                >
                                    Cancel Queue
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
