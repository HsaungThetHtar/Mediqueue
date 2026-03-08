import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Search,
    ChevronDown,
    QrCode,
    User,
    Clock,
    UserPlus,
    AlertCircle,
} from 'lucide-react';
import { useOutletContext } from 'react-router';
import { adminCheckIn, getCheckInsForDate } from '../../../../api/checkins';
import { Pagination } from '../Pagination';

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface CheckInsProps {
    queues: any[];
    filteredQueues: any[];
    filterDate?: string;
    setSelectedQueue: (queue: any) => void;
    refresh: () => void;
    departmentOptions?: string[];
}

export function CheckIns() {
    const { queues, filterDate, refresh, departmentOptions } = useOutletContext<CheckInsProps>();
    const date = filterDate || todayISO();
    const [activeTab, setActiveTab] = useState<'checked' | 'not-checked'>('checked');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // แสดง 10 รายการต่อหน้า
    const [checkInsList, setCheckInsList] = useState<any[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('All Departments');
    const [doctorFilter, setDoctorFilter] = useState('All Doctors');

    useEffect(() => {
        getCheckInsForDate(date).then(setCheckInsList).catch(() => setCheckInsList([]));
    }, [date]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, deptFilter, doctorFilter]);


    const checkInByBookingId = Object.fromEntries(
        checkInsList.map((c: any) => [String(c.bookingId?._id || c.bookingId), c])
    );

    // ข้อมูลดึงมาทั้งหมดจาก API (queues = ทั้งหมดของวัน) แล้ว filter ตามเงื่อนไข
    const allData = queues.map(q => {
        const ci = checkInByBookingId[q.id];
        const method = ci ? (ci.method === 'qr' ? 'QR Code' : 'Manual') : null;
        const checkInTimeStr = ci?.checkInTime
            ? new Date(ci.checkInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
            : (q.status === 'checked-in' || q.status === 'completed' ? (q.checkInTime || '—').replace(/:\d{2}\s*(AM|PM)?/i, '') : null);
        const scheduledTime = (q.estimatedTime || '08:00').replace(':', '.');
        const now = new Date();
        const [sh, sm] = (q.estimatedTime || '08:00').split(':').map(Number);
        const scheduledDate = new Date(now);
        scheduledDate.setHours(sh, sm || 0, 0, 0);
        const isLate = now > scheduledDate && (q.status === 'waiting' || q.status === 'confirmed');
        const pid = q.patientId;
        const rawId = !pid ? '' : typeof pid === 'object' ? (pid._id || pid.id) : pid;
        const idNumber = rawId ? String(rawId).slice(-6).toUpperCase() : '—';
        return {
            ...q,
            idNumber,
            checkInTime: checkInTimeStr,
            method,
            scheduledTime,
            statusDisplay: (q.status === 'waiting' || q.status === 'confirmed') ? (isLate ? 'Late' : 'On Time') : q.status,
        };
    });

    const checkedInItems = allData.filter(q => q.status === 'checked-in' || q.status === 'completed');
    const notCheckedInItems = allData.filter(q => q.status === 'waiting' || q.status === 'confirmed');

    const baseFiltered = (activeTab === 'checked' ? checkedInItems : notCheckedInItems).filter(q => {
        const matchesSearch = !searchTerm || q.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.queueNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(q.patientId ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter === 'All Departments' || q.department === deptFilter;
        const matchesDoctor = doctorFilter === 'All Doctors' || q.doctor === doctorFilter;
        return matchesSearch && matchesDept && matchesDoctor;
    });
    const filteredData = [...baseFiltered].sort((a, b) => {
        const sessionA = (a.queueNumber || '').startsWith('M-') ? 0 : 1;
        const sessionB = (b.queueNumber || '').startsWith('M-') ? 0 : 1;
        if (sessionA !== sessionB) return sessionA - sessionB;
        return (a.queueNumber || '').localeCompare(b.queueNumber || '');
    });

    // ดึงมาทั้งหมดที่เข้าเงื่อนไข (filteredData) แสดง 10 รายการต่อหน้า + pagination
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const displayedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const morningData = displayedData.filter(q => q.queueNumber?.startsWith('M-'));
    const afternoonData = displayedData.filter(q => q.queueNumber?.startsWith('A-'));

    const handleManualCheckIn = async (bookingId: string) => {
        try {
            await adminCheckIn(bookingId);
            await refresh();
            const list = await getCheckInsForDate(date);
            setCheckInsList(list);
        } catch (err) {
            console.error('admin manual check-in failed', err);
        }
    };

    const deptOptions = ['All Departments', ...(departmentOptions ?? [...new Set(queues.map((q: any) => q.department).filter(Boolean))])];
    const doctorOptions = ['All Doctors', ...new Set(queues.map((q: any) => q.doctor).filter(Boolean))];
    const totalForDate = queues.length;
    const checkedCount = checkedInItems.length;
    const notCheckedCount = notCheckedInItems.length;
    const qrCount = checkInsList.filter((c: any) => c.method === 'qr').length;
    const checkInRate = totalForDate ? Math.round((checkedCount / totalForDate) * 100) : 0;

    return (
        <div className="px-4 md:px-6 py-8 w-full mx-auto bg-gray-50/30 min-h-screen">

            {/* Tabs */}
            <div className="flex gap-0 w-full mb-6">
                <button
                    onClick={() => setActiveTab('checked')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-l-xl border border-gray-200 transition-all ${activeTab === 'checked'
                        ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-sm'
                        : 'bg-white text-gray-500 font-medium border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <CheckCircle className={`w-5 h-5 shrink-0 ${activeTab === 'checked' ? 'text-white' : 'text-gray-400'}`} />
                    Checked-In ({checkedCount})
                </button>
                <button
                    onClick={() => setActiveTab('not-checked')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-r-xl border border-gray-200 border-l-0 transition-all ${activeTab === 'not-checked'
                        ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-sm'
                        : 'bg-white text-gray-500 font-medium border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <XCircle className={`w-5 h-5 shrink-0 ${activeTab === 'not-checked' ? 'text-white' : 'text-gray-400'}`} />
                    Not Checked-In ({notCheckedCount})
                </button>
            </div>

            {/* Card ภาพแรก: แท็บ + Search/Filter อยู่ในการ์ดเดียว bg-white border border-gray-200 rounded-xl */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">

                {/* Filters: SEARCH + DEPARTMENT + DOCTOR */}
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px] max-w-6xl">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Search</label>
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by queue number, patient name, or ID..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <FilterSelect label="Department" value={deptFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDeptFilter(e.target.value)} options={deptOptions} />
                    <FilterSelect label="Doctor" value={doctorFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDoctorFilter(e.target.value)} options={doctorOptions} />
                </div>
            </div>

            {/* Card รายการผู้ป่วย — bg-white border border-gray-200 rounded-xl ตามภาพแรก */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">
                        {activeTab === 'checked' ? 'Checked-In Patients' : 'Not Checked-In Patients'}
                    </h3>
                    <span className="text-sm text-gray-600">
                        Total: <span className="font-semibold text-gray-900">{filteredData.length}</span>
                    </span>
                </div>

                <div className="overflow-x-auto">
                    {(morningData.length > 0 || afternoonData.length > 0) ? (
                        <>
                            {morningData.length > 0 && (
                                <SessionBlock
                                    title="Morning Session (08.00-12.00)"
                                    count={morningData.length}
                                    data={morningData}
                                    type={activeTab}
                                    onManualCheckIn={handleManualCheckIn}
                                />
                            )}
                            {afternoonData.length > 0 && (
                                <SessionBlock
                                    title="Afternoon Session (13.00-17.00)"
                                    count={afternoonData.length}
                                    data={afternoonData}
                                    type={activeTab}
                                    isAfternoon
                                    onManualCheckIn={handleManualCheckIn}
                                />
                            )}
                        </>
                    ) : (
                        <div className="py-16 text-center">
                            <p className="text-gray-500 font-medium mb-2">
                                No {activeTab === 'checked' ? 'checked-in' : 'not checked-in'} patients for current filters.
                            </p>
                            {activeTab === 'not-checked' && notCheckedCount === 0 && queues.length > 0 && (deptFilter !== 'All Departments' || doctorFilter !== 'All Doctors') && (
                                <p className="text-sm text-gray-400">
                                    ลองเลือก &quot;All Departments&quot; และ &quot;All Doctors&quot; เพื่อดูทุกคนที่ยังไม่ check-in
                                </p>
                            )}
                            {activeTab === 'not-checked' && notCheckedCount === 0 && queues.length > 0 && deptFilter === 'All Departments' && doctorFilter === 'All Doctors' && (
                                <p className="text-sm text-gray-400">
                                    ในวันนี้ไม่มีผู้ป่วยสถานะ waiting/confirmed รัน seed ใหม่ใน backend เพื่อสร้างข้อมูล: <code className="bg-gray-100 px-1 rounded">npm run seed</code>
                                </p>
                            )}
                            {activeTab === 'not-checked' && queues.length === 0 && (
                                <p className="text-sm text-gray-400">
                                    ไม่มีข้อมูลจองในวันนี้ หรือรัน seed ใน backend: <code className="bg-gray-100 px-1 rounded">npm run seed</code>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination: 10 รายการต่อหน้า */}
                {filteredData.length > 0 && (
                    <div className="px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[14px] text-gray-500 font-medium">
                            แสดง {(currentPage - 1) * pageSize + 1} ถึง {Math.min(currentPage * pageSize, filteredData.length)} จาก {filteredData.length} รายการ
                        </p>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Summary Cards — ตามแบบ: Check-In Rate (เขียว), QR Check-Ins (น้ำเงิน), Pending Check-Ins (เหลือง/ส้ม) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
                <StatsCard label="Check-In Rate" value={`${checkInRate}%`} icon={<CheckCircle className="w-6 h-6 text-white" />} bgColor="bg-green-500" />
                <StatsCard label="QR Check-Ins" value={qrCount.toString()} icon={<QrCode className="w-6 h-6 text-blue-600" />} bgColor="bg-blue-50" />
                <StatsCard label="Pending Check-Ins" value={notCheckedCount.toString()} icon={<AlertCircle className="w-6 h-6 text-amber-600" />} bgColor="bg-amber-50" />
            </div>
        </div>
    );
}

function SessionBlock({ title, count, data, type, isAfternoon, onManualCheckIn }: any) {
    const doctorDisplay = (name: string) => (name && !String(name).startsWith('Dr.')) ? `Dr. ${name}` : (name || '—');
    const idDisplay = (row: any) => row.idNumber && row.idNumber !== '—' ? `ID${row.idNumber}` : '—';

    return (
        <div className="w-full">
            {/* แถบ session สีส้ม-เหลือง + นาฬิกา + จำนวนด้านขวาเป็นสีแดง ตามภาพที่ 2 */}
            <div className="bg-amber-50/90 px-6 py-4 flex items-center justify-between border-b border-amber-100">
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="text-sm font-semibold text-amber-900">{title}</span>
                </div>
                <span className={`text-sm font-semibold ${type === 'not-checked' ? 'text-red-600' : 'text-amber-700'}`}>
                    {count} {type === 'checked' ? 'checked-in' : 'not checked-in'}
                </span>
            </div>
            <table className="w-full text-left min-w-[1000px]">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Queue No.</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Number</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {type === 'checked' ? 'Check-in Time' : 'Scheduled Time'}
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {type === 'checked' ? 'Method' : 'Status'}
                        </th>
                        {type === 'not-checked' && <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((row: any, index: number) => (
                        <tr
                            key={row.id}
                            className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}`}
                        >
                            <td className="py-4 px-4 font-medium text-gray-900 text-sm border-b border-gray-100">{row.queueNumber}</td>
                            <td className="py-4 px-4 font-medium text-gray-900 text-sm border-b border-gray-100">{row.patientName}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm border-b border-gray-100">{idDisplay(row)}</td>
                            <td className="py-4 px-4 text-gray-600 text-sm border-b border-gray-100">{row.department}</td>
                            <td className="py-4 px-4 text-gray-700 text-sm border-b border-gray-100">{doctorDisplay(row.doctor)}</td>
                            <td className="py-4 px-4 font-medium text-gray-900 text-sm border-b border-gray-100">
                                {type === 'checked' ? row.checkInTime : row.scheduledTime}
                            </td>
                            <td className="py-4 px-4 border-b border-gray-100">
                                {type === 'checked' ? (
                                    <div className="flex items-center gap-2">
                                        {row.method === 'QR Code' ? (
                                            <span className="text-xs font-medium text-green-600">QR Code</span>
                                        ) : (
                                            <span className="text-xs font-medium text-gray-500">Manual</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold text-white ${row.statusDisplay === 'Late'
                                        ? 'bg-red-500'
                                        : 'bg-green-500'
                                        }`}>
                                        {row.statusDisplay === 'Late' ? 'Late' : 'On Time'}
                                    </span>
                                )}
                            </td>
                            {type === 'not-checked' && (
                                <td className="py-4 px-4 text-center border-b border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => onManualCheckIn(row.id)}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                    >
                                        <User className="w-4 h-4" />
                                        Check In
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function FilterSelect({ label, value, onChange, options }: any) {
    return (

        <div className="min-w-[385px] max-w-1xl">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={onChange}
                    className="w-full pl-4 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer"
                >
                    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
        </div>
    );
}

function StatsCard({ label, value, icon, bgColor }: any) {
    return (
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all">
            <div>
                <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3">{label}</p>
                <p className="text-4xl font-black text-gray-900 tracking-tight">{value}</p>
            </div>
            <div className={`p-6 ${bgColor} rounded-[24px] transition-transform group-hover:scale-110 duration-500`}>
                {icon}
            </div>
        </div>
    );
}
