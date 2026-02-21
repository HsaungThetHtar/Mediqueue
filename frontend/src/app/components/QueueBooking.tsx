import { useState } from 'react';
import { Clock, Users, AlertCircle, Calendar, Building2, Stethoscope, Activity, ArrowLeft } from 'lucide-react';
import { BookingData } from '../App';
import { Doctor } from './SelectedDoctor';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface QueueBookingProps {
  onConfirmBooking: (data: BookingData) => void;
  selectedDoctor: Doctor;
  onBackToSelection: () => void;
  selectedDate: string;
}

type QueueStatus = 'available' | 'nearlyFull' | 'full';
type TimeSlot = 'morning' | 'afternoon';

export function QueueBooking({ onConfirmBooking, selectedDoctor, onBackToSelection, selectedDate }: QueueBookingProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>(selectedDoctor.availability);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('morning');

  // Use selected doctor's information
  const doctorInfo = {
    name: selectedDoctor.name,
    department: selectedDoctor.department,
    hospital: 'Central City Hospital',
  };

  // Format the selected date to a readable format
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
      dailyLimit: 15,
      currentQueue: queueStatus === 'available' ? 6 : queueStatus === 'nearlyFull' ? 13 : 15
    },
    afternoon: {
      time: '13.00-17.00',
      label: 'Afternoon Session',
      dailyLimit: 15,
      currentQueue: queueStatus === 'available' ? 7 : queueStatus === 'nearlyFull' ? 14 : 15
    }
  };

  const currentSlotInfo = timeSlots[selectedTimeSlot];

  const queueInfo = {
    consultationTime: '15 minutes',
    serviceHours: currentSlotInfo.time,
    dailyLimit: currentSlotInfo.dailyLimit,
    currentQueue: currentSlotInfo.currentQueue
  };

  const getStatusColor = () => {
    switch (queueStatus) {
      case 'available':
        return 'bg-[#4CAF50] text-white';
      case 'nearlyFull':
        return 'bg-[#FBC02D] text-white';
      case 'full':
        return 'bg-[#D32F2F] text-white';
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
    }
  };

  const handleConfirm = () => {
    if (queueStatus === 'full') return;

    const now = new Date();
    // Generate queue number based on doctor's current queue + 1
    const nextQueueNumber = selectedDoctor.currentQueue + 1;
    const queueNumber = `Q-${String(nextQueueNumber).padStart(3, '0')}`;
    
    // Calculate waiting time: (people ahead of you) * 15 minutes per patient
    const estimatedWaitMinutes = selectedDoctor.currentQueue * 15;
    const estimatedTime = new Date(now.getTime() + estimatedWaitMinutes * 60000);
    
    // Currently serving is the doctor's currentQueueServing number
    const currentlyServing = `Q-${String(selectedDoctor.currentQueueServing).padStart(3, '0')}`;
    
    onConfirmBooking({
      queueNumber,
      hospital: doctorInfo.hospital,
      department: doctorInfo.department,
      doctor: doctorInfo.name,
      date: selectedDate,
      estimatedTime: estimatedTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      currentlyServing: currentlyServing
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-10">
      {/* Header */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          {/* Back Button */}
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

        {/* Desktop Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Doctor & Date Info */}
          <div className="space-y-6">
            {/* Doctor Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#1E88E5]" />
                Doctor Information
              </h2>
              
              {/* Doctor Profile Section */}
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
                  <p className="text-base text-blue-900 font-medium">{formattedDate}</p>
                </div>
              </div>
            </div>

            {/* Queue Information Card - Desktop */}
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
                    <p className="text-base font-medium text-gray-900">{queueInfo.consultationTime} per patient</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Service Hours</p>
                    <p className="text-base font-medium text-gray-900">{queueInfo.serviceHours}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-gray-500 mb-1">Daily Queue Limit</p>
                    <p className="text-base font-medium text-gray-900 mb-3">
                      {queueInfo.currentQueue} / {queueInfo.dailyLimit} queues
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all ${
                          queueStatus === 'full' ? 'bg-[#D32F2F]' : 
                          queueStatus === 'nearlyFull' ? 'bg-[#FBC02D]' : 
                          'bg-[#4CAF50]'
                        }`}
                        style={{ width: `${(queueInfo.currentQueue / queueInfo.dailyLimit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Time Slot Selection & Actions */}
          <div className="space-y-6">
            {/* Time Slot Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1E88E5]" />
                Select Time Slot
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Morning Slot */}
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
                      {timeSlots.morning.currentQueue} / {timeSlots.morning.dailyLimit} queues
                    </span>
                  </div>
                </button>

                {/* Afternoon Slot */}
                <button
                  onClick={() => setSelectedTimeSlot('afternoon')}
                  className={`p-5 rounded-xl border-2 transition-all text-left ${
                    selectedTimeSlot === 'afternoon'
                      ? 'border-[#1E88E5] bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`font-semibold mb-1 text-base ${
                        selectedTimeSlot === 'afternoon' ? 'text-[#1E88E5]' : 'text-gray-900'
                      }`}>
                        {timeSlots.afternoon.label}
                      </p>
                      <p className={`text-sm ${
                        selectedTimeSlot === 'afternoon' ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {timeSlots.afternoon.time}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedTimeSlot === 'afternoon'
                        ? 'border-[#1E88E5] bg-[#1E88E5]'
                        : 'border-gray-300'
                    }`}>
                      {selectedTimeSlot === 'afternoon' && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={selectedTimeSlot === 'afternoon' ? 'text-blue-700 font-medium' : 'text-gray-500'}>
                      {timeSlots.afternoon.currentQueue} / {timeSlots.afternoon.dailyLimit} queues
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Error State for Full Queue */}
            {queueStatus === 'full' && (
              <div className="bg-red-50 border border-[#D32F2F] rounded-xl p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#D32F2F] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#D32F2F] mb-1">Queue Full</h3>
                  <p className="text-sm text-red-800">
                    Sorry, the daily queue limit has been reached. Please try again tomorrow or select another doctor.
                  </p>
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={queueStatus === 'full'}
              className={`w-full py-5 rounded-xl font-semibold text-white text-base transition-colors shadow-sm ${
                queueStatus === 'full'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#1E88E5] hover:bg-[#1976D2] active:bg-[#1565C0]'
              }`}
            >
              {queueStatus === 'full' ? 'Queue Full' : 'Confirm Queue Booking'}
            </button>

            {/* Demo Controls */}
            <div className="p-6 bg-gray-100 rounded-xl">
              <p className="text-sm text-gray-600 mb-4 font-medium">Demo Controls:</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setQueueStatus('available')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    queueStatus === 'available'
                      ? 'bg-[#4CAF50] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => setQueueStatus('nearlyFull')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    queueStatus === 'nearlyFull'
                      ? 'bg-[#FBC02D] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Nearly Full
                </button>
                <button
                  onClick={() => setQueueStatus('full')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    queueStatus === 'full'
                      ? 'bg-[#D32F2F] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Full
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}