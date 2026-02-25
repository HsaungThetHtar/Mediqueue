import { useState, useEffect } from 'react';
import { Activity, Check, Clock, Users, ChevronRight, ChevronLeft, LogOut, Zap } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useNavigate } from 'react-router';
import { doctorApi, clearAuthToken } from '../../services/api';

export interface Doctor {
  _id?: string;
  id?: string;
  name: string;
  department: string;
  availability: 'available' | 'nearlyFull' | 'full';
  workingHours: string;
  currentQueueServing: number;
  imageUrl: string;
  currentQueue?: number;
  maxQueue?: number;
  specialization?: string;
}

interface SelectedDoctorProps {
  onContinue: (doctor: Doctor) => void;
  selectedDepartment: string;
  selectedDate: string;
  onBack: () => void;
}

export function SelectedDoctor({ onContinue, selectedDepartment, selectedDate, onBack }: SelectedDoctorProps) {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  // Fetch doctors from backend
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await doctorApi.getDoctorsByDepartment(selectedDepartment);
        // Transform backend data to match frontend interface
        const transformedDoctors: Doctor[] = (data || []).map((doc: any) => ({
          _id: doc._id,
          id: doc._id,
          name: doc.name,
          specialization: doc.specialization,
          department: selectedDepartment,
          availability: doc.availability || 'available',
          workingHours: doc.workingHours || '08.00-17.00',
          currentQueueServing: doc.currentQueueServing || 0,
          currentQueue: Math.floor(Math.random() * 20) + 1,
          maxQueue: 30,
          imageUrl: doc.imageUrl || 'https://via.placeholder.com/100',
        }));
        setDoctors(transformedDoctors.length > 0 ? transformedDoctors : getDefaultDoctors());
      } catch (err: any) {
        setError(err.message);
        setDoctors(getDefaultDoctors());
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [selectedDepartment]);

  const getDefaultDoctors = (): Doctor[] => [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      department: selectedDepartment,
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 10,
      currentQueue: 5,
      maxQueue: 30,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    },
    {
      id: '2',
      name: 'Dr. Michael Chang',
      department: selectedDepartment,
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 8,
      currentQueue: 7,
      maxQueue: 30,
      imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    },
    {
      id: '3',
      name: 'Dr. Emily Watson',
      department: selectedDepartment,
      availability: 'nearlyFull',
      workingHours: '08.00-17.00',
      currentQueueServing: 15,
      currentQueue: 12,
      maxQueue: 30,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    },
  ];

  const handleLogout = () => {
    clearAuthToken();
    navigate('/signin');
  };

  // Filter doctors by selected department
  const filteredDoctors = doctors;

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

  // const navigate = useNavigate();

  // const handleLogout = () => {
  //   navigate('/signin');
  // };

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