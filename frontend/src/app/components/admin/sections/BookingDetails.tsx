import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    Building2,
    UserRound,
    Hash,
    RefreshCw,
    Edit,
    PhoneCall,
    XCircle,
    CheckCircle2,
    Search,
    ChevronDown
} from 'lucide-react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import { getQueueById, updateQueueStatus } from '../../../../api/queues';
import { getCheckInsByPatient, CheckIn } from '../../../../api/checkins';
import { cancelBooking, updateBooking } from '../../../../api/bookings';
import { getDoctors } from '../../../../api/doctors';
import { getDepartments } from '../../../../api/departments';
import { getDepartmentName } from '../../../../utils/department';

interface BookingDetailsProps {
    queues: any[];
    refresh: () => void;
}

function ageFromDob(dobStr: string | undefined): string {
    if (!dobStr) return '—';
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return age >= 0 ? `${age} years old` : '—';
}

export function BookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { queues, refresh } = useOutletContext<BookingDetailsProps>();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [checkInsLoading, setCheckInsLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [editDoctorId, setEditDoctorId] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editDepartment, setEditDepartment] = useState('');
    const [doctors, setDoctors] = useState<{ _id: string; name: string; department: string }[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const statusSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const data = await getQueueById(id);
                if (!cancelled) {
                    setBooking(data);
                    setSelectedStatus(data.status || 'waiting');
                }
            } catch (err) {
                if (!cancelled) {
                    const fromList = (queues || []).find((q: any) => (q.id || q._id) === id);
                    if (fromList) {
                        setBooking({ ...fromList, _id: fromList._id || fromList.id });
                        setSelectedStatus(fromList.status || 'waiting');
                    } else {
                        setBooking(null);
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id, queues]);

    useEffect(() => {
        if (!booking?.patientId) return;
        const pid = typeof booking.patientId === 'object' ? booking.patientId?._id : booking.patientId;
        if (!pid) return;
        setCheckInsLoading(true);
        getCheckInsByPatient(pid)
            .then(setCheckIns)
            .catch(() => setCheckIns([]))
            .finally(() => setCheckInsLoading(false));
    }, [booking?.patientId]);

    const handleUpdateStatus = async () => {
        if (!id || !selectedStatus) return;
        setLoading(true);
        try {
            await updateQueueStatus(id, selectedStatus);
            refresh();
            setBooking((prev: any) => prev ? { ...prev, status: selectedStatus } : null);
            if (selectedStatus === 'canceled' || selectedStatus === 'completed') {
                navigate('/admin/bookings');
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = () => {
        const doctorId = booking?.doctor?._id || booking?.doctor || '';
        const departmentFromBooking = getDepartmentName(booking?.department) || getDepartmentName(booking?.doctor?.department) || '';
        setEditDoctorId(doctorId);
        setEditDate(booking?.date ? new Date(booking.date).toISOString().slice(0, 10) : '');
        setEditDepartment(departmentFromBooking);
        getDoctors().then((list) => {
            setDoctors(list);
            if (!departmentFromBooking && list.length) {
                const doc = list.find((d: any) => (d._id || d.id) === doctorId);
                if (doc?.department) setEditDepartment(getDepartmentName(doc.department));
            }
        }).catch(() => setDoctors([]));
        getDepartments().then(setDepartments).catch(() => setDepartments([]));
        setShowEditModal(true);
    };

    const handleEditDoctorChange = (newDoctorId: string) => {
        setEditDoctorId(newDoctorId);
        const doc = doctors.find((d: any) => (d._id || d.id) === newDoctorId);
        if (doc?.department) setEditDepartment(getDepartmentName(doc.department));
    };

    const handleSaveEdit = async () => {
        if (!id) return;
        try {
            const updated = await updateBooking(id, {
                doctorId: editDoctorId || undefined,
                date: editDate || undefined,
            });
            setBooking((prev: any) => (prev ? { ...prev, ...updated } : updated));
            setShowEditModal(false);
            refresh();
        } catch (err: any) {
            console.error('Update booking failed:', err);
            const msg = err?.response?.data?.message || err?.message || 'ไม่สามารถบันทึกการแก้ไขได้';
            alert(msg);
        }
    };

    const handleCancelBookingConfirm = async () => {
        if (!id) return;
        try {
            await cancelBooking(id);
            setShowCancelModal(false);
            setCancelReason('');
            refresh();
            navigate('/admin/bookings');
        } catch (err) {
            console.error('Cancel booking failed:', err);
            alert('ยกเลิกการจองไม่สำเร็จ');
        }
    };

    const patient = typeof booking?.patientId === 'object' ? booking.patientId : null;
    const patientPhone = patient?.phone || booking?.phone;
    const patientEmail = patient?.email || booking?.email;
    const patientDob = patient?.dateOfBirth;

    if (loading) {
        return (
            <div className="p-10 text-center">
                <p className="text-gray-500">Loading booking...</p>
            </div>
        );
    }
    if (!booking) {
        return (
            <div className="p-10 text-center">
                <p className="text-gray-500">Booking not found. The link may be invalid or the booking was removed.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-bold hover:underline flex items-center gap-2 justify-center mx-auto">
                    <ChevronLeft className="w-4 h-4" /> Back to Bookings
                </button>
            </div>
        );
    }

    const patientDisplayId = `ID${(booking._id || booking.id || '')?.toString().slice(-6).toUpperCase() || '—'}`;
    const patientName = patient?.fullName || booking?.patientName || 'this patient';

    return (
        <>
        <div className="px-4 md:px-6 py-8 w-full mx-auto min-h-screen">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Bookings
            </button>

            {/* Top Info Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2.5">
                    <span className="text-[14px] font-bold text-gray-900">
                        Booking #{booking.bookingId || booking.id?.substring(18).toUpperCase() || 'SJ-01032026-005'}
                    </span>
                    <div className="flex flex-wrap items-center gap-4 text-[14px] text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {booking.estimatedTime || '09.00'}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${booking.status === 'in-progress'
                            ? 'bg-blue-50 text-blue-600'
                            : booking.status === 'completed'
                                ? 'bg-green-50 text-green-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                            {booking.status === 'in-progress' ? 'In Progress' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div className="text-[28px] font-bold text-blue-600 tracking-tight">
                    {booking.queueNumber}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Patient Information */}
                    <SectionCard icon={<UserRound className="w-5 h-5 text-gray-700" />} title="Patient Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <InfoField label="Full Name" value={patient?.fullName || booking.patientName || '—'} valueColor="text-blue-600" />
                            <InfoField label="ID Number" value={patientDisplayId} valueColor="text-blue-600" />
                            <InfoField label="Phone Number" value={patientPhone || '—'} icon={<Phone className="w-4 h-4 text-blue-500" />} valueColor="text-blue-600" />
                            <InfoField label="Email Address" value={patientEmail || '—'} icon={<Mail className="w-4 h-4 text-blue-500" />} valueColor="text-blue-600" />
                            <InfoField label="Date of Birth" value={patientDob || '—'} />
                            <InfoField label="Age" value={ageFromDob(patientDob)} />
                        </div>
                    </SectionCard>

                    {/* Booking Information */}
                    <SectionCard icon={<Calendar className="w-5 h-5 text-gray-700" />} title="Booking Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <InfoField label="Hospital" value={booking.hospital || 'Central City Hospital'} />
                            <InfoField label="Department" value={getDepartmentName(booking.department)} />
                            <InfoField label="Doctor" value={(booking.doctorName || booking.doctor?.name || '').startsWith('Dr.') ? (booking.doctorName || booking.doctor?.name) : `Dr. ${booking.doctorName || booking.doctor?.name || '—'}`} />
                            <InfoField label="Appointment Date" value={new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                            <InfoField
                                label="Session"
                                value={booking.queueNumber?.startsWith('M-') ? 'Morning (08.00-12.00)' : 'Afternoon (13.00-17.00)'}
                                isSession
                                sessionType={booking.queueNumber?.startsWith('M-') ? 'morning' : 'afternoon'}
                            />
                            <InfoField label="Queue Number" value={booking.queueNumber} valueColor="text-blue-600" />
                            <InfoField label="Estimated Time" value={booking.estimatedTime || "09.00 - 09.15"} />
                        </div>
                    </SectionCard>

                    {/* Check-in History for this patient */}
                    <SectionCard icon={<Clock className="w-5 h-5 text-gray-700" />} title="Check-in History">
                        {checkInsLoading ? (
                            <p className="text-sm text-gray-500">Loading check-in history...</p>
                        ) : checkIns.length === 0 ? (
                            <p className="text-sm text-gray-500">No check-in records for this patient.</p>
                        ) : (
                            <div className="space-y-3">
                                {checkIns.map((c) => (
                                    <div key={c._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {new Date(c.checkInTime).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Method: {c.method === 'qr' ? 'QR Code' : 'Manual'}
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                            {c.status.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>

                {/* Right Side - Actions */}
                <div className="space-y-6">
                    {/* Update Status */}
                    <div id="update-status-card" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-[16px] font-bold text-gray-900">Update Status</h3>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <label className="block text-[13px] text-gray-600 mb-2">Change Status</label>
                                <div className="relative">
                                    <select
                                        className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-[14px] text-gray-900 appearance-none cursor-pointer"
                                        value={selectedStatus || booking.status}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="waiting">Waiting</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="checked-in">Checked-in</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="canceled">Canceled</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateStatus}
                                className="w-full h-11 bg-[#1877F2] hover:bg-blue-600 text-white rounded-lg font-medium text-[14px] transition-colors flex items-center justify-center disabled:opacity-50"
                                disabled={loading}
                            >
                                Update Status
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-[16px] font-bold text-gray-900">Quick Actions</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            <QuickActionButton
                                icon={<Edit className="w-4 h-4 text-gray-600" />}
                                label="Edit Booking"
                                onClick={openEditModal}
                            />
                            <QuickActionButton
                                icon={<PhoneCall className="w-4 h-4 text-gray-600" />}
                                label="Call Patient"
                                onClick={() => {
                                    const phone = patientPhone || (typeof booking?.patientId === 'object' ? booking?.patientId?.phone : null);
                                    if (phone && String(phone).replace(/\D/g, '').length >= 8) {
                                        window.location.href = `tel:${String(phone).replace(/\D/g, '')}`;
                                    } else {
                                        alert('No phone number on file for this patient.');
                                    }
                                }}
                            />
                            <QuickActionButton
                                icon={<XCircle className="w-4 h-4 text-[#E53E3E]" />}
                                label="Cancel Booking"
                                variant="danger"
                                onClick={() => setShowCancelModal(true)}
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm text-amber-900">
                            <span className="font-semibold">Note:</span> Any status changes will be logged and the patient will be notified via SMS and email.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Edit Booking Modal */}
        {showEditModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <Edit className="w-6 h-6 text-gray-700" />
                        <h2 className="text-xl font-bold text-gray-900">Edit Booking</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-[13px] text-gray-600 mb-2">Doctor</label>
                            <select
                                className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-[14px] text-gray-900"
                                value={editDoctorId}
                                onChange={(e) => handleEditDoctorChange(e.target.value)}
                            >
                                {doctors.map((d) => (
                                    <option key={d._id} value={d._id}>Dr. {d.name} ({getDepartmentName(d.department)})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[13px] text-gray-600 mb-2">Date</label>
                            <input
                                type="date"
                                className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-[14px] text-gray-900"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[13px] text-gray-600 mb-2">Department</label>
                            <select
                                className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-[14px] text-gray-900"
                                value={editDepartment}
                                onChange={(e) => setEditDepartment(e.target.value)}
                            >
                                {!editDepartment && <option value="">Select department</option>}
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                                {editDepartment && !departments.includes(editDepartment) && (
                                    <option value={editDepartment}>{editDepartment}</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                        <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="button" onClick={handleSaveEdit} className="px-5 py-2.5 rounded-lg font-medium text-white bg-[#1877F2] hover:bg-blue-600">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Cancel Booking Modal */}
        {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                    <div className="bg-[#D32F2F] text-white p-6 flex items-center gap-3">
                        <XCircle className="w-6 h-6 shrink-0" />
                        <h2 className="text-xl font-bold">Cancel Booking</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            Are you sure you want to cancel this booking for <strong>{patientName}</strong>? This action cannot be undone and the patient will be notified immediately.
                        </p>
                        <div>
                            <label className="block text-[13px] text-gray-600 mb-2">Cancellation Reason</label>
                            <textarea
                                className="w-full min-h-[80px] px-4 py-3 border border-gray-300 rounded-lg text-[14px] text-gray-900 resize-y"
                                placeholder="Enter reason for cancellation..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex gap-3">
                        <button type="button" onClick={() => { setShowCancelModal(false); setCancelReason(''); }} className="flex-1 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200">
                            No, Go Back
                        </button>
                        <button type="button" onClick={handleCancelBookingConfirm} className="flex-1 py-3 rounded-xl font-semibold text-white bg-[#D32F2F] hover:bg-[#C62828]">
                            Yes, Cancel Booking
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
    );
}

function SectionCard({ icon, title, children }: any) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                {icon}
                <h3 className="text-[16px] font-bold text-gray-900">{title}</h3>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

function InfoField({ label, value, valueColor = "text-gray-900", icon, isSession, sessionType }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-gray-500">{label}</label>
            <div className="flex items-center gap-2">
                {icon}
                {isSession ? (
                    <span className={`px-4 py-1 rounded-full text-[13px] font-medium ${sessionType === 'morning' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                        {value}
                    </span>
                ) : (
                    <span className={`text-[15px] ${valueColor}`}>{value}</span>
                )}
            </div>
        </div>
    );
}

function QuickActionButton({ icon, label, variant = "secondary", onClick }: any) {
    const styles = variant === "danger"
        ? "bg-[#FFF5F5] text-[#E53E3E] border border-[#FED7D7] hover:bg-[#FED7D7]"
        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50";

    return (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClick?.(); }}
            className={`w-full h-10 rounded-lg flex items-center justify-center gap-2 text-[14px] font-medium transition-colors ${styles}`}
        >
            {icon}
            {label}
        </button>
    );
}
