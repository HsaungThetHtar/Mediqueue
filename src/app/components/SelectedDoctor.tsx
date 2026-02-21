import { useState } from 'react';
import { Activity, Check, Clock, Users, ChevronRight, ChevronLeft, LogOut, Zap } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useNavigate } from 'react-router';

export interface Doctor {
  id: string;
  name: string;
  department: string;
  availability: 'available' | 'nearlyFull' | 'full';
  workingHours: string;
  currentQueueServing: number;
  imageUrl: string;
  currentQueue: number;
  maxQueue: number;
}

interface SelectedDoctorProps {
  onContinue: (doctor: Doctor) => void;
  selectedDepartment: string;
  selectedDate: string;
  onBack: () => void;
}

export function SelectedDoctor({ onContinue, selectedDepartment, selectedDate, onBack }: SelectedDoctorProps) {
  // Mock doctor data
  const doctors: Doctor[] = [
    // Internal Medicine
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      department: 'Internal Medicine',
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 10,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjgwNzY2NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 5,
      maxQueue: 30,
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      department: 'Internal Medicine',
      availability: 'nearlyFull',
      workingHours: '08.00-17.00',
      currentQueueServing: 5,
      imageUrl: 'https://images.unsplash.com/photo-1605504836193-e77d3d9ede8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGRvY3RvciUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODE0MTQ4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 25,
      maxQueue: 30,
    },
    // Pediatrics
    {
      id: '3',
      name: 'Dr. Emily Davis',
      department: 'Pediatrics',
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 1,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjgwNzY2NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 8,
      maxQueue: 30,
    },
    {
      id: '4',
      name: 'Dr. James Wilson',
      department: 'Pediatrics',
      availability: 'full',
      workingHours: '08.00-17.00',
      currentQueueServing: 0,
      imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZG9jdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY4MDQ3OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 30,
      maxQueue: 30,
    },
    // Obstetrics and Gynecology
    {
      id: '5',
      name: 'Dr. Lisa Anderson',
      department: 'Obstetrics and Gynecology',
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 5,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjgwNzY2NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 12,
      maxQueue: 30,
    },
    {
      id: '6',
      name: 'Dr. Maria Rodriguez',
      department: 'Obstetrics and Gynecology',
      availability: 'nearlyFull',
      workingHours: '08.00-17.00',
      currentQueueServing: 8,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjgwNzY2NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 22,
      maxQueue: 30,
    },
    // General Surgery
    {
      id: '7',
      name: 'Dr. Robert Martinez',
      department: 'General Surgery',
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 10,
      imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZG9jdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY4MDQ3OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 7,
      maxQueue: 30,
    },
    {
      id: '8',
      name: 'Dr. David Thompson',
      department: 'General Surgery',
      availability: 'nearlyFull',
      workingHours: '08.00-17.00',
      currentQueueServing: 6,
      imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZG9jdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY4MDQ3OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 24,
      maxQueue: 30,
    },
    // Orthopedics
    {
      id: '9',
      name: 'Dr. Jennifer Lee',
      department: 'Orthopedics',
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 12,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjgwNzY2NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 9,
      maxQueue: 30,
    },
    {
      id: '10',
      name: 'Dr. Thomas Brown',
      department: 'Orthopedics',
      availability: 'full',
      workingHours: '08.00-17.00',
      currentQueueServing: 0,
      imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZG9jdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY4MDQ3OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 30,
      maxQueue: 30,
    },
    // Ear, Nose and Throat (ENT)
    {
      id: '11',
      name: 'Dr. Amanda Clark',
      department: 'Ear, Nose and Throat (ENT)',
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 11,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjgwNzY2NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 10,
      maxQueue: 30,
    },
    {
      id: '12',
      name: 'Dr. Steven Harris',
      department: 'Ear, Nose and Throat (ENT)',
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 9,
      imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZG9jdG9yJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY4MDQ3OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 11,
      maxQueue: 30,
    },
    // Dermatology
    {
      id: '13',
      name: 'Dr. Michelle Taylor',
      department: 'Dermatology',
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 13,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjgwNzY2NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 8,
      maxQueue: 30,
    },
    {
      id: '14',
      name: 'Dr. Daniel Moore',
      department: 'Dermatology',
      availability: 'nearlyFull',
      workingHours: '08.00-17.00',
      currentQueueServing: 4,
      imageUrl: 'https://images.unsplash.com/photo-1605504836193-e77d3d9ede8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGRvY3RvciUyMHBvcnRyYWl0fGVufDF8fHx8MTc2ODE0MTQ4NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      currentQueue: 26,
      maxQueue: 30,
    },
  ];

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter(doc => doc.department === selectedDepartment);

  // Find the doctor with the fastest queue in the selected department
  const findFastestDoctor = () => {
    const availableDoctors = filteredDoctors.filter(doc => doc.currentQueue < 30);
    if (availableDoctors.length === 0) return null;
    
    return availableDoctors.reduce((min, doctor) => 
      doctor.currentQueue < min.currentQueue ? doctor : min
    );
  };

  const handleFastestQueue = () => {
    const fastestDoctor = findFastestDoctor();
    if (fastestDoctor) {
      onContinue(fastestDoctor);
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return {
          color: 'bg-green-50 text-green-800 border-green-200',
          label: 'Available',
        };
      case 'nearlyFull':
        return {
          color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          label: 'Nearly Full',
        };
      case 'full':
        return {
          color: 'bg-red-50 text-red-800 border-red-200',
          label: 'Full',
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-800 border-gray-200',
          label: 'Unknown',
        };
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    if (doctor.availability !== 'full') {
      onContinue(doctor);
    }
  };

  const getEstimatedWaitingTime = (currentQueue: number) => {
    const totalMinutes = currentQueue * 15; // 15 minutes per patient
    
    if (totalMinutes === 0) {
      return 'No wait';
    } else if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (minutes === 0) {
        return hours === 1 ? '1 hour' : `${hours} hours`;
      } else {
        return hours === 1 ? `1 hour ${minutes} min` : `${hours} hours ${minutes} min`;
      }
    }
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/signin');
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[#1E88E5]">
              <Activity className="w-5 h-5" />
              <span className="font-medium">MediQueue</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors bg-white text-[#D32F2F] border-2 border-[#D32F2F] hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Select a Doctor
          </h1>
          <p className="text-gray-600 mt-2">Choose your preferred doctor to continue with queue booking</p>
        </div>

        {/* Selected Date and Department Info + Back Button */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                <p className="text-xs text-gray-600 mb-0.5">Selected Date</p>
                <p className="font-semibold text-gray-900">{formatDate(selectedDate)}</p>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                <p className="text-xs text-gray-600 mb-0.5">Department</p>
                <p className="font-semibold text-gray-900">{selectedDepartment}</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Change Selection
            </button>
          </div>
        </div>

        {/* Find Fastest Queue Banner */}
        {findFastestDoctor() && (
          <div className="mb-6 bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Zap className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Need to see a doctor quickly?</h3>
                <p className="text-sm text-white/90 mb-3">
                  Automatically select the doctor with the shortest queue in {selectedDepartment}
                </p>
                <button
                  onClick={handleFastestQueue}
                  className="bg-white text-[#2E7D32] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors shadow-md"
                >
                  Select Fastest Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {filteredDoctors.map((doctor) => {
            const badge = getAvailabilityBadge(doctor.availability);
            const isDisabled = doctor.availability === 'full';

            return (
              <div
                key={doctor.id}
                className={`bg-white rounded-2xl shadow-sm border-2 transition-all overflow-hidden ${ 
                  isDisabled
                    ? 'border-gray-200 opacity-60'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Doctor Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={doctor.imageUrl}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Availability Badge Overlay */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">
                    {doctor.name}
                  </h3>
                  <p className="text-sm mb-4 text-gray-600">
                    {doctor.department}
                  </p>

                  <div className="space-y-3">
                    {/* Working Hours */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {doctor.workingHours}
                      </span>
                    </div>

                    {/* Queue Status */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {doctor.currentQueue} / {doctor.maxQueue} queues
                      </span>
                    </div>

                    {/* Estimated Waiting Time - Only show if not full */}
                    {doctor.availability !== 'full' && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Estimated Waiting Time</p>
                        <p className="text-sm font-medium text-[#1E88E5]">
                          {getEstimatedWaitingTime(doctor.currentQueue)}
                        </p>
                      </div>
                    )}

                    {/* Queue Full Message */}
                    {doctor.availability === 'full' && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-red-600 mb-1">Queue Status</p>
                        <p className="text-sm font-medium text-[#D32F2F]">
                          Queue Full - No slots available
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleDoctorSelect(doctor)}
                    disabled={isDisabled}
                    className={`w-full mt-6 py-3 rounded-xl font-semibold text-base transition-colors ${
                      isDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#1E88E5] text-white hover:bg-[#1976D2] active:bg-[#1565C0]'
                    }`}
                  >
                    {isDisabled ? 'Queue Full' : 'Select Doctor'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}