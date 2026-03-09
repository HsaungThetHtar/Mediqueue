import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Users, CheckCircle, Clock, Activity, Sun, Moon, ChevronRight } from 'lucide-react';
import { Pagination } from '../Pagination';
import { useOutletContext, useNavigate } from 'react-router';
import type { PrevDayStats } from '../../AdminDashboard';

interface DashboardProps {
    queues: any[];
    getStatusBadge: (status: any) => React.ReactNode;
    filteredQueues: any[];
    setSelectedQueue: (queue: any) => void;
    prevDayStats?: PrevDayStats;
}

function calcTrend(current: number, prev: number): { text: string; up: boolean } {
    if (prev === 0) {
        if (current === 0) return { text: '0%', up: true };
        return { text: '+100%', up: true };
    }
    const pct = Math.round(((current - prev) / prev) * 100);
    if (pct === 0) return { text: '0%', up: true };
    if (pct > 0) return { text: `+${pct}%`, up: true };
    return { text: `${pct}%`, up: false };
}

export function Dashboard() {
    const { queues, getStatusBadge, filteredQueues, prevDayStats, setSelectedQueue } = useOutletContext<DashboardProps>();
    const navigate = useNavigate();

    const [morningPage, setMorningPage] = useState(1);
    const [afternoonPage, setAfternoonPage] = useState(1);
    const pageSize = 10;

    const totalBookings = queues.length;
    const checkedInCount = queues.filter(q => q.status === 'checked-in' || q.status === 'completed').length;
    const waitingCount = queues.filter(q => q.status === 'waiting').length;
    const inProgressCount = queues.filter(q => q.status === 'in-progress').length;
    const completedCount = queues.filter(q => q.status === 'completed').length;

    const prev = prevDayStats ?? { total: 0, checkedIn: 0, waiting: 0, inProgress: 0, completed: 0 };
    const stats = [
        { label: 'Total Bookings Today', value: totalBookings.toString(), trend: calcTrend(totalBookings, prev.total), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Checked-in', value: checkedInCount.toString(), trend: calcTrend(checkedInCount, prev.checkedIn), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Waiting', value: waitingCount.toString(), trend: calcTrend(waitingCount, prev.waiting), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'In Progress', value: inProgressCount.toString(), trend: calcTrend(inProgressCount, prev.inProgress), icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Completed', value: completedCount.toString(), trend: calcTrend(completedCount, prev.completed), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    // Session split: timeSlot from API, else M-/A- prefix, else by hour from checkInTime
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

    const totalMorningPages = Math.max(1, Math.ceil(totalMorning / pageSize));
    const totalAfternoonPages = Math.max(1, Math.ceil(totalAfternoon / pageSize));
    const paginatedMorning = morningQueues.slice((morningPage - 1) * pageSize, morningPage * pageSize);
    const paginatedAfternoon = afternoonQueues.slice((afternoonPage - 1) * pageSize, afternoonPage * pageSize);

    return (
        <div className="px-4 md:px-6 py-8 w-full mx-auto bg-gray-50/30 min-h-screen">
            {/* Stats Grid - ตรงตามภาพที่ 2: 5 การ์ด, ไอคอนซ้ายบน, เทรนด์ขวาบน (+ เขียว / - แดง), ตัวเลขใหญ่, ป้ายกำกับ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    const { text: trendText, up: trendUp } = stat.trend;
                    return (
                        <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col min-h-[160px]">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className={`flex items-center gap-0.5 font-bold text-[13px] ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                                    {trendUp ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                                    {trendText}
                                </div>
                            </div>
                            <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Today's Queue Section - ตรงตามภาพที่ 1: หัวข้อขาว, ป้าย total patients มุมขวา, เส้นคั่นสีเบจ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Today's Queue</h2>
                    <span className="bg-white px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-500">
                        {filteredQueues.length} total patients
                    </span>
                </div>
                <div className="h-px bg-amber-50/80 border-t border-[#f5e6d3]" aria-hidden="true" />

                <div className="overflow-x-auto">
                    {filteredQueues.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center gap-3 bg-white">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                <Users className="w-8 h-8" />
                            </div>
                            <p className="text-gray-500 font-medium">No patients in queue for today</p>
                        </div>
                    ) : (
                        <>
                            {/* Morning Session (08.00-12.00) */}
                            <SessionTable
                                title="Morning Session (08.00-12.00)"
                                icon={<Sun className="w-5 h-5 text-orange-500" />}
                                bgColor="bg-[#fff9f2]"
                                borderColor="border-[#ffebd4]"
                                textColor="text-[#b45d00]"
                                queues={paginatedMorning}
                                totalCount={totalMorning}
                                getStatusBadge={getStatusBadge}
                                setSelectedQueue={setSelectedQueue}
                            />
                            {totalMorning > pageSize && (
                                <div className="px-10 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                                    <p className="text-[14px] text-gray-500 font-medium">
                                        Showing {(morningPage - 1) * pageSize + 1}-{Math.min(morningPage * pageSize, totalMorning)} of {totalMorning}
                                    </p>
                                    <Pagination
                                        currentPage={morningPage}
                                        totalPages={totalMorningPages}
                                        onPageChange={setMorningPage}
                                    />
                                </div>
                            )}

                            {/* Afternoon Session (13.00-17.00) - always show */}
                            <SessionTable
                                title="Afternoon Session (13.00-17.00)"
                                icon={<Moon className="w-5 h-5 text-indigo-600" />}
                                bgColor="bg-[#f5f3ff]"
                                borderColor="border-[#e0dbf5]"
                                textColor="text-[#5b21b6]"
                                queues={paginatedAfternoon}
                                totalCount={totalAfternoon}
                                getStatusBadge={getStatusBadge}
                                setSelectedQueue={setSelectedQueue}
                            />
                            {totalAfternoon > pageSize && (
                                <div className="px-10 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                                    <p className="text-[14px] text-gray-500 font-medium">
                                        Showing {(afternoonPage - 1) * pageSize + 1}-{Math.min(afternoonPage * pageSize, totalAfternoon)} of {totalAfternoon}
                                    </p>
                                    <Pagination
                                        currentPage={afternoonPage}
                                        totalPages={totalAfternoonPages}
                                        onPageChange={setAfternoonPage}
                                    />
                                </div>
                            )}

                        </>
                    )}
                </div>

                <div className="p-10 bg-gray-50/10 flex justify-center border-t border-gray-50">
                    <button
                        onClick={() => navigate('/admin/queue')}
                        className="text-[#1E88E5] font-black text-[16px] hover:underline flex items-center gap-2 transition-all hover:gap-3"
                    >
                        View All Queues <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function SessionTable({ title, icon, bgColor, borderColor, textColor, queues, totalCount, getStatusBadge, setSelectedQueue }: any) {
    return (
        <div className="w-full">
            <div className={`${bgColor} px-10 py-4 flex items-center justify-between border-y ${borderColor}`}>
                <div className="flex items-center gap-3">
                    {icon}
                    <h3 className={`text-[17px] font-bold ${textColor}`}>{title}</h3>
                </div>
                <span className={`font-bold ${textColor}`}>{totalCount} patients</span>
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
                            <th className="py-5 px-10 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {queues.map((q: any) => (
                            <QueueRow key={q.id} queue={q} getStatusBadge={getStatusBadge} onSelect={setSelectedQueue} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function QueueRow({ queue, getStatusBadge, onSelect }: any) {
    return (
        <tr
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(queue)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(queue); } }}
            className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
        >
            <td className="py-6 px-10 font-black text-gray-900 text-[15px]">{queue.queueNumber}</td>
            <td className="py-6 px-6 font-bold text-gray-700 text-[15px]">
                <div className="flex flex-col">
                    <span className="leading-tight">{queue.patientName}</span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{queue.patientId ? String(queue.patientId).slice(-6) : "—"}</span>
                </div>
            </td>
            <td className="py-6 px-6 font-bold text-gray-400 text-[14px]">{queue.department}</td>
            <td className="py-6 px-6 font-bold text-gray-700 text-[14px]">{queue.doctor}</td>
            <td className="py-6 px-6 font-bold text-gray-500 text-[14px]">{queue.checkInTime}</td>
            <td className="py-6 px-10 text-right">
                <div className="flex justify-end">
                    {getStatusBadge(queue.status)}
                </div>
            </td>
        </tr>
    );
}
