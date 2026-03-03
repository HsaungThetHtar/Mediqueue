import { useState, useEffect } from 'react';
import { Clock, Users, AlertCircle, Calendar, Building2, Stethoscope, Activity, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { authApi } from '../../services/api';

type BookingData = {
  queueNumber: string;
  hospital: string;
  department: string;
  doctor: string;
  date: string;
  estimatedTime: string;
  currentlyServing: string;
};

export interface Doctor {
  _id?: string;
  id?: string;
  name: string;
  department: string | { _id: string; name: string };
  availability: 'available' | 'nearlyFull' | 'full';
  workingHours: string;
  currentQueueServing: number;
  imageUrl: string;
  currentQueue?: number;
  maxQueue?: number;
  specialization?: string;
}

interface QueueBookingProps {
  onConfirmBooking: (data: BookingData) => void;
  selectedDoctor: Doctor;
  onBackToSelection: () => void;
  selectedDate: string;
}

type QueueStatus = 'available' | 'nearlyFull' | 'full';
type TimeSlot = 'morning' | 'afternoon';



  export function QueueBooking({ onConfirmBooking, selectedDoctor, onBackToSelection, selectedDate }: QueueBookingProps) {
    const [queueStatus, setQueueStatus] = useState<QueueStatus>('available');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('morning');
    const [slotInfo, setSlotInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get departmentId safely
    const departmentObj = typeof selectedDoctor.department === 'object' && selectedDoctor.department !== null
      ? selectedDoctor.department as { _id: string; name: string }
      : undefined;
    const departmentId = departmentObj ? departmentObj._id : '';
    const doctorId = selectedDoctor._id || selectedDoctor.id || '';
    const session = selectedTimeSlot === 'morning' ? 'MORNING' : 'AFTERNOON';
    const appointmentDate = selectedDate ? new Date(selectedDate).toISOString() : '';
    const currentSlotInfo = slotInfo ? slotInfo[selectedTimeSlot] : null;
    // Button is enabled if all required selections are made and slot is available
    const canConfirm = Boolean(departmentId && doctorId && session && appointmentDate && currentSlotInfo && queueStatus !== 'full');

    useEffect(() => {
      async function fetchSlotInfo() {
        setLoading(true);
        setError('');
        try {
          const res = await authApi.checkAvailability({
            departmentId,
            doctorId,
            appointmentDate: new Date(selectedDate).toISOString()
          });
          setSlotInfo(res);
          const slot = res[selectedTimeSlot];
          if (!slot.available) setQueueStatus('full');
          else if (slot.booked >= slot.total - 3) setQueueStatus('nearlyFull');
          else setQueueStatus('available');
        } catch (err: any) {
          setError(err.message || 'Failed to fetch slot info');
        } finally {
          setLoading(false);
        }
      }
      fetchSlotInfo();
      // eslint-disable-next-line
    }, [selectedDoctor, selectedDate, selectedTimeSlot]);

    const doctorInfo = {
      name: selectedDoctor.name,
      department: selectedDoctor.department,
      hospital: 'Central City Hospital',
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    const formattedDate = formatDate(selectedDate);

    const timeSlots = {
      morning: {
        time: '08.00-12.00',
        label: 'Morning Session',
      },
      afternoon: {
        time: '13.00-17.00',
        label: 'Afternoon Session',
      }
    };

    const queueInfo = {
      consultationTime: '15 minutes',
      serviceHours: timeSlots[selectedTimeSlot].time,
      dailyLimit: currentSlotInfo ? currentSlotInfo.total : 0,
      currentQueue: currentSlotInfo ? currentSlotInfo.booked : 0
    };

    const getStatusColor = () => {
      switch (queueStatus) {
        case 'available':
          return 'bg-[#4CAF50] text-white';
        case 'nearlyFull':
          return 'bg-[#FBC02D] text-white';
        case 'full':
          return 'bg-[#D32F2F] text-white';
        default:
          return '';
      }
    };

    const getStatusText = () => {
      switch (queueStatus) {
        case 'available':
          return 'Available';
        case 'nearlyFull':
          return 'Nearly Full';
        case 'full':
          return 'Full';
        default:
          return '';
      }
    };

    const handleConfirm = async () => {
      if (!canConfirm) return;
      setLoading(true);
      setError('');
      if (!departmentId || !doctorId || !session || !appointmentDate) {
        setError('Missing required booking information. Please select doctor, department, session, and date.');
        setLoading(false);
        return;
      }
      try {
        const booking = await authApi.bookQueue({
          departmentId,
          doctorId,
          session,
          appointmentDate
        });
        onConfirmBooking({
          queueNumber: `Q-${String(booking.queueNumber).padStart(3, '0')}`,
          hospital: doctorInfo.hospital,
          department: typeof doctorInfo.department === 'object' && doctorInfo.department !== null
            ? (doctorInfo.department as { name: string }).name
            : doctorInfo.department,
          doctor: doctorInfo.name,
          date: selectedDate,
          estimatedTime: booking.estimatedWaitTime ? `${booking.estimatedWaitTime} min` : '',
          currentlyServing: booking.currentPosition ? `Q-${String(booking.currentPosition).padStart(3, '0')}` : ''
        });
      } catch (err: any) {
        if (err && err.message) {
          setError(err.message);
        } else if (typeof err === 'string') {
          setError(err);
        } else {
          setError('Booking failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <button
              onClick={onBackToSelection}
              className="flex items-center gap-2 text-gray-600 hover:text-[#1E88E5] transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Doctor Selection</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              Queue Booking
            </h1>
            <div className="flex items-center gap-2 text-[#1E88E5]">
              <Activity className="w-5 h-5" />
              <span className="font-medium">MediQueue</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#1E88E5]" />
                  Doctor Information
                </h2>
                <div className="flex gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1594819246185-dbf1d40ebeaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjB3aGl0ZSUyMGNvYXR8ZW58MXx8fHwxNzY4MDYwOTY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                      alt="Dr. Sarah Johnson"
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
                      <p className="text-base font-medium text-gray-900">
                        {typeof doctorInfo.department === 'object' && doctorInfo.department !== null
                          ? (doctorInfo.department as { name: string }).name
                          : doctorInfo.department}
                      </p>
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
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-[#1E88E5]" />
                  <div>
                    <p className="text-sm text-blue-800 mb-1 font-medium">Selected Date</p>
                    <p className="text-base text-blue-900 font-medium">{formattedDate}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#1E88E5]" />
                  Select Time Slot
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setSelectedTimeSlot('morning')}
                    className={`p-5 rounded-xl border-2 transition-all text-left ${
                      selectedTimeSlot === 'morning'
                        ? 'border-[#1E88E5] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className={`font-semibold mb-1 text-base ${
                          selectedTimeSlot === 'morning' ? 'text-[#1E88E5]' : 'text-gray-900'
                        }`}>
                          {timeSlots.morning.label}
                        </p>
                        <p className={`text-sm ${
                          selectedTimeSlot === 'morning' ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          {timeSlots.morning.time}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedTimeSlot === 'morning'
                          ? 'border-[#1E88E5] bg-[#1E88E5]'
                          : 'border-gray-300'
                      }`}>
                        {selectedTimeSlot === 'morning' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={selectedTimeSlot === 'morning' ? 'text-blue-700 font-medium' : 'text-gray-500'}>
                        {queueInfo.currentQueue} / {queueInfo.dailyLimit} queues
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!canConfirm || loading}
                    className={`mt-8 w-full py-3 rounded-xl font-bold text-lg transition-colors ${!canConfirm || loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {loading
                      ? 'Confirming...'
                      : queueStatus === 'full'
                      ? 'Queue Full'
                      : 'Confirm Booking'}
                  </button>
                  {/* Feedback for disabled button */}
                  {!canConfirm && !loading && (
                    <div className="bg-yellow-50 border border-yellow-400 rounded-xl p-5 mt-4 text-yellow-800 font-semibold">
                      {queueStatus === 'full' ? (
                        <>
                          <AlertCircle className="w-5 h-5 text-[#D32F2F] mr-2 inline" />
                          Queue is full for this slot. Please try another slot or doctor.
                        </>
                      ) : !currentSlotInfo ? (
                        <>Please select a valid time slot and doctor.</>
                      ) : (
                        <>Please complete all selections to enable booking.</>
                      )}
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-50 border border-[#D32F2F] rounded-xl p-5 mt-4 text-[#D32F2F] font-semibold">{error}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}