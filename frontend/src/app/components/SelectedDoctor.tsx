import React, { useState, useEffect } from 'react';
import { Activity, Clock, Users, ChevronLeft, LogOut, Zap, LayoutDashboard } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useNavigate, useOutletContext } from 'react-router';
import { io } from 'socket.io-client';
import { getDoctors } from '../../api/doctors';
import { clearSession } from '../../api/auth';
import { BASE_URL } from '../../api/client';
import { DateDepartmentSelection } from './SelectDateDepartment';
import { getDepartmentName } from '../../utils/department';

export interface Doctor {
  _id: string;
  name: string;
  department: string;
  availability: 'available' | 'nearlyFull' | 'full';
  workingHours: string;
  currentQueueServing: number;
  imageUrl: string;
  currentQueue: number;
  maxQueue: number;
}

interface MainAppContext {
  dateAndDepartment: DateDepartmentSelection | null;
  handleDoctorSelection: (doctor: Doctor) => void;
  handleBackToDateDepartment: () => void;
}

export function SelectedDoctor() {
  const { dateAndDepartment, handleDoctorSelection, handleBackToDateDepartment } = useOutletContext<MainAppContext>();
  const selectedDepartment = dateAndDepartment?.department || '';
  const selectedDate = dateAndDepartment?.date || '';
  const onContinue = handleDoctorSelection;
  const onBack = handleBackToDateDepartment;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ถ้าไม่ได้เลือกแผนกมาก่อน (เช่น เข้าหน้าตรงหรือ refresh) ให้กลับไปเลือกวันที่/แผนก
  useEffect(() => {
    if (!selectedDepartment || !selectedDate) {
      navigate('/app/select-date', { replace: true });
      return;
    }
  }, [selectedDepartment, selectedDate, navigate]);

  useEffect(() => {
    if (!selectedDepartment) return;

    async function fetchDoctors() {
      setLoading(true);
      try {
        const data = await getDoctors(selectedDepartment, selectedDate);
        const filtered = data.filter((d) => getDepartmentName(d.department) === selectedDepartment);
        setDoctors(filtered);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();

    // Socket.io: realtime doctor queue updates
    const socket = io(BASE_URL);
    socket.on('doctor-update', (updatedDoctor: Doctor) => {
      setDoctors((prev) =>
        prev.map((doc) => (doc._id === updatedDoctor._id ? { ...doc, ...updatedDoctor } : doc))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDepartment, selectedDate]);

  const DAILY_QUEUE_LIMIT = 30;

  const queueCount = (d: Doctor & { dateQueueCount?: number }) =>
    typeof d.dateQueueCount === 'number' ? d.dateQueueCount : d.currentQueue;

  const findFastestDoctor = () => {
    const available = doctors.filter((d) => queueCount(d) < DAILY_QUEUE_LIMIT);
    if (available.length === 0) return null;
    return available.reduce((min, d) => (queueCount(d) < queueCount(min) ? d : min));
  };

  const getAvailabilityFromCount = (count: number) => {
    if (count >= DAILY_QUEUE_LIMIT) return { color: 'bg-red-50 text-red-800 border-red-200', label: 'Full' };
    if (count >= DAILY_QUEUE_LIMIT * 0.8) return { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Nearly Full' };
    return { color: 'bg-green-50 text-green-800 border-green-200', label: 'Available' };
  };

  const getAvailabilityBadge = (doctor: Doctor & { dateQueueCount?: number }) => {
    return getAvailabilityFromCount(queueCount(doctor));
  };

  const getEstimatedWaitingTime = (currentQueue: number) => {
    const totalMinutes = currentQueue * 15;
    if (totalMinutes === 0) return 'No wait';
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
    return hours === 1 ? `1 hour ${minutes} min` : `${hours} hours ${minutes} min`;
  };

  const handleLogout = () => {
    clearSession();
    navigate('/signin');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-blue-600 font-semibold animate-pulse">Fetching available doctors...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-[#1E88E5]">
              <Activity className="w-6 h-6" />
              <span className="text-xl font-bold tracking-tight">MediQueue</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDashboard}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-[14px] transition-all bg-white text-[#1E88E5] border-2 border-[#1E88E5] hover:bg-blue-50 active:scale-95"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-[14px] transition-all bg-white text-[#df4759] border-2 border-[#df4759] hover:bg-red-50 active:scale-95"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
          <h1 className="text-[32px] md:text-[40px] font-bold text-gray-900 leading-tight">Select a Doctor</h1>
          <p className="text-gray-500 text-lg mt-2 font-medium">Choose your preferred doctor to continue with queue booking</p>
        </div>

        {/* Date & Department Info Card */}
        <div className="mb-8 bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Selected Date</p>
                <div className="bg-[#f0f7ff] px-6 py-3 rounded-2xl">
                  <p className="font-bold text-[#1a1a1a] text-lg">{formatDate(selectedDate)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Department</p>
                <div className="bg-[#f0f7ff] px-6 py-3 rounded-2xl">
                  <p className="font-bold text-[#1a1a1a] text-lg">{selectedDepartment}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-[15px] transition-all bg-white text-gray-500 border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
              Change Selection
            </button>
          </div>
        </div>

        {/* Fastest Queue Banner */}
        {findFastestDoctor() && (
          <div className="mb-10 bg-[#38a149] rounded-[24px] p-10 text-white shadow-lg shadow-green-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110">
              <Zap className="w-32 h-32" />
            </div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-10 h-10 text-white fill-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Need to see a doctor quickly?</h3>
                <p className="text-white/90 text-[17px] mb-6 max-w-2xl font-medium leading-relaxed">
                  Automatically select the doctor with the shortest queue in <span className="font-bold">{selectedDepartment}</span>
                </p>
                <button
                  onClick={() => {
                    const fastest = findFastestDoctor();
                    if (fastest) onContinue(fastest);
                  }}
                  className="bg-white text-[#38a149] px-8 py-4 rounded-2xl font-bold text-base hover:bg-gray-50 transition-all shadow-xl active:scale-95"
                >
                  Select Fastest Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Cards Container */}
        {doctors.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500 text-lg font-medium">No doctors are currently available for this department.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 pb-12">
            {doctors.map((doctor) => {
              const count = queueCount(doctor);
              const badge = getAvailabilityBadge(doctor);
              const isDisabled = count >= DAILY_QUEUE_LIMIT;

              return (
                <div
                  key={doctor._id}
                  className={`bg-white rounded-[32px] shadow-sm border border-gray-100 transition-all overflow-hidden flex flex-col group ${isDisabled
                    ? 'opacity-60 grayscale cursor-not-allowed'
                    : 'hover:shadow-xl hover:-translate-y-1'
                    }`}
                >
                  <div className="relative h-64 overflow-hidden bg-gray-50">
                    <ImageWithFallback
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-6 left-6">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="text-[22px] font-bold text-gray-900 mb-1 leading-tight">{doctor.name}</h3>
                      <p className="text-[15px] font-semibold text-gray-400">{getDepartmentName(doctor.department)}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-gray-600 font-bold">{doctor.workingHours}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-gray-600 font-bold">{count} / {DAILY_QUEUE_LIMIT} queues</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="pt-6 border-t border-gray-50 mb-6">
                        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">Estimated Waiting Time</p>
                        <p className="text-xl font-bold text-[#1E88E5]">
                          {isDisabled ? 'N/A (Full)' : getEstimatedWaitingTime(count + 1)}
                        </p>
                      </div>

                      <button
                        onClick={() => !isDisabled && onContinue(doctor)}
                        disabled={isDisabled}
                        className={`w-full py-5 rounded-[22px] font-bold text-lg transition-all shadow-lg active:scale-95 ${isDisabled
                          ? 'bg-gray-200 text-gray-400 shadow-none'
                          : 'bg-[#1E88E5] text-white hover:bg-[#1976D2] shadow-blue-100'
                          }`}
                      >
                        {isDisabled ? 'Queue Full' : 'Select Doctor'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
