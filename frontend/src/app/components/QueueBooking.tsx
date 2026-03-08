import React, { useState, useEffect } from 'react';
import { Clock, Users, AlertCircle, Calendar, Building2, Stethoscope, Activity, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { BookingData } from '../MainApp';
import { Doctor } from './SelectedDoctor';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { createBooking, getSlotCounts } from '../../api/bookings';
import { getSession } from '../../api/auth';
import { useNavigate, useOutletContext } from 'react-router';
import { DateDepartmentSelection } from './SelectDateDepartment';
import { getDepartmentName } from '../../utils/department';

interface MainAppContext {
  selectedDoctor: Doctor | null;
  dateAndDepartment: DateDepartmentSelection | null;
  handleConfirmBooking: (data: BookingData) => void;
  handleBackToSelection: () => void;
}

type TimeSlot = 'morning' | 'afternoon';

export function QueueBooking() {
  const { selectedDoctor, dateAndDepartment, handleConfirmBooking, handleBackToSelection } = useOutletContext<MainAppContext>();

  if (!selectedDoctor || !dateAndDepartment) {
    return null; // Or a redirect/loading state
  }

  const selectedDate = dateAndDepartment.date;
  const onConfirmBooking = handleConfirmBooking;
  const onBackToSelectionHandler = handleBackToSelection;
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('morning');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotCounts, setSlotCounts] = useState<{ morning: number; afternoon: number }>({ morning: 0, afternoon: 0 });

  useEffect(() => {
    getSlotCounts(selectedDoctor._id, selectedDate)
      .then(setSlotCounts)
      .catch(() => setSlotCounts({ morning: 0, afternoon: 0 }));
  }, [selectedDoctor._id, selectedDate]);

  const doctorInfo = {
    name: selectedDoctor.name,
    department: getDepartmentName(selectedDoctor.department),
    hospital: 'Central City Hospital',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const handleConfirm = async () => {
    const user = getSession();
    if (!user) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเข้าสู่ระบบ', text: 'ต้องเข้าสู่ระบบก่อนจึงจะจองคิวได้', confirmButtonColor: '#1E88E5' });
      return;
    }
    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        patientName: user?.fullName,
        patientId: user?.id,
      });

      onConfirmBooking({
        queueNumber: booking.queueNumber,
        hospital: booking.hospital,
        department: getDepartmentName((booking as any).department),
        doctor: booking.doctorName,
        date: booking.date,
        estimatedTime: booking.estimatedTime,
        currentlyServing: booking.currentlyServing,
        bookingId: booking._id,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Swal.fire({ icon: 'error', title: 'Booking Failed', text: message, confirmButtonColor: '#1E88E5' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SESSION_LIMIT = 15;
  const DAILY_LIMIT = 30; // 15 + 15

  const timeSlots = {
    morning: { time: '08.00-12.00', label: 'Morning Session', dailyLimit: SESSION_LIMIT, currentQueue: slotCounts.morning },
    afternoon: { time: '13.00-17.00', label: 'Afternoon Session', dailyLimit: SESSION_LIMIT, currentQueue: slotCounts.afternoon },
  };

  const currentSlotInfo = timeSlots[selectedTimeSlot];
  const dailyTotal = slotCounts.morning + slotCounts.afternoon;
  const isSlotFull = currentSlotInfo.currentQueue >= SESSION_LIMIT;
  const isFull = dailyTotal >= DAILY_LIMIT;
  const slotCount = currentSlotInfo.currentQueue;
  const nearlyFullThreshold = Math.floor(SESSION_LIMIT * 0.8); // 12

  // Badge และ progress ใน Queue Information ใช้ค่าตามช่วงที่เลือก (เหมือนตัวอย่าง: 6/15, 13/15, 15/15)
  const getStatusColor = () => {
    if (slotCount >= SESSION_LIMIT) return 'bg-[#D32F2F] text-white';
    if (slotCount >= nearlyFullThreshold) return 'bg-[#FBC02D] text-white';
    return 'bg-[#4CAF50] text-white';
  };

  const getStatusText = () => {
    if (slotCount >= SESSION_LIMIT) return 'Full';
    if (slotCount >= nearlyFullThreshold) return 'Nearly Full';
    return 'Available';
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <button
            onClick={onBackToSelectionHandler}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1E88E5] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Doctor Selection</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Queue Booking</h1>
          <div className="flex items-center gap-2 text-[#1E88E5]">
            <Activity className="w-5 h-5" />
            <span className="font-medium">MediQueue</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Doctor Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#1E88E5]" />
                Doctor Information
              </h2>
              <div className="flex gap-6 mb-6">
                <div className="flex-shrink-0">
                  <ImageWithFallback
                    src={selectedDoctor.imageUrl}
                    alt={selectedDoctor.name}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-xl object-cover border-2 border-[#1E88E5]/20"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Doctor Name</p>
                    <p className="text-base font-medium text-gray-900">{doctorInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Department</p>
                    <p className="text-base font-medium text-gray-900">{doctorInfo.department}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Hospital</p>
                <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {doctorInfo.hospital}
                </p>
              </div>
            </div>

            {/* Selected Date */}
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#1E88E5]" />
                <div>
                  <p className="text-sm text-blue-800 mb-1 font-medium">Selected Date</p>
                  <p className="text-base text-blue-900 font-medium">{formatDate(selectedDate)}</p>
                </div>
              </div>
            </div>

            {/* Queue Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1E88E5]" />
                  Queue Information
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estimated Consultation Time</p>
                    <p className="text-base font-medium text-gray-900">15 minutes per patient</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Service Hours</p>
                    <p className="text-base font-medium text-gray-900">{currentSlotInfo.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-gray-500 mb-1">Daily Queue Limit</p>
                    <p className="text-base font-medium text-gray-900 mb-3">
                      {slotCount} / {SESSION_LIMIT} queues
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${getStatusColor()}`}
                        style={{ width: `${Math.min(100, (slotCount / SESSION_LIMIT) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Time Slot Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1E88E5]" />
                Select Time Slot
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {(['morning', 'afternoon'] as TimeSlot[]).map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`p-5 rounded-xl border-2 transition-all text-left ${selectedTimeSlot === slot
                      ? 'border-[#1E88E5] bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className={`font-semibold mb-1 text-base ${selectedTimeSlot === slot ? 'text-[#1E88E5]' : 'text-gray-900'}`}>
                          {timeSlots[slot].label}
                        </p>
                        <p className={`text-sm ${selectedTimeSlot === slot ? 'text-blue-700' : 'text-gray-600'}`}>
                          {timeSlots[slot].time}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedTimeSlot === slot ? 'border-[#1E88E5] bg-[#1E88E5]' : 'border-gray-300'
                        }`}>
                        {selectedTimeSlot === slot && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <p className={`text-sm ${selectedTimeSlot === slot ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                      {timeSlots[slot].currentQueue} / {timeSlots[slot].dailyLimit} queues
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {(isFull || isSlotFull) && (
              <div className="bg-red-50 border border-[#D32F2F] rounded-xl p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#D32F2F] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#D32F2F] mb-1">
                    {isSlotFull ? 'This session is full' : 'Daily queue full'}
                  </h3>
                  <p className="text-sm text-red-800">
                    {isSlotFull
                      ? `The ${currentSlotInfo.label} (${currentSlotInfo.time}) has reached the limit of ${SESSION_LIMIT} queues. Please choose the other session or another date.`
                      : 'Sorry, the daily queue limit has been reached. Please try again tomorrow or select another doctor.'}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={isSubmitting || isFull || isSlotFull}
              className="w-full mt-8 bg-[#1E88E5] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#1976D2] active:bg-[#1565C0] transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
