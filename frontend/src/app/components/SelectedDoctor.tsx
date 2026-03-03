import { useState, useEffect } from 'react';
import { Activity, Check, Clock, Users, ChevronRight, ChevronLeft, LogOut, Zap } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useNavigate } from 'react-router';
import { doctorApi, clearAuthToken } from '../../services/api';

export interface Doctor {
  _id?: string;
  id?: string;
  name: string;
  department: any;
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

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await doctorApi.getDoctorsByDepartment(selectedDepartment);

        const transformedDoctors: Doctor[] = (data || []).map((doc: any) => ({
          _id: doc._id,
          id: doc._id,
          name: doc.name,
          specialization: doc.specialization,
          department:
            doc.department && typeof doc.department === 'object'
              ? doc.department
              : { _id: doc.department, name: selectedDepartment },
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
      department: { _id: selectedDepartment, name: selectedDepartment },
      availability: 'available',
      workingHours: '08.00-17.00',
      currentQueueServing: 10,
      currentQueue: 5,
      maxQueue: 30,
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?w=200',
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
      imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?w=200',
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
      imageUrl: 'https://images.unsplash.com/photo-1706565029539-d09af5896340?w=200',
    },
  ];

  const handleLogout = () => {
    clearAuthToken();
    navigate('/signin');
  };

  const findFastestDoctor = () => {
    const availableDoctors = doctors.filter(doc => doc.currentQueue! < 30);
    if (availableDoctors.length === 0) return null;

    return availableDoctors.reduce((min, doctor) =>
      doctor.currentQueue! < min.currentQueue! ? doctor : min
    );
  };

  const handleFastestQueue = () => {
    const fastestDoctor = findFastestDoctor();
    if (fastestDoctor) onContinue(fastestDoctor);
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return { color: 'bg-green-50 text-green-800 border-green-200', label: 'Available' };
      case 'nearlyFull':
        return { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Nearly Full' };
      case 'full':
        return { color: 'bg-red-50 text-red-800 border-red-200', label: 'Full' };
      default:
        return { color: 'bg-gray-50 text-gray-800 border-gray-200', label: 'Unknown' };
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    if (doctor.availability !== 'full') {
      // Ensure department is always an object with _id and name
      let departmentObj = doctor.department;
      if (typeof departmentObj === 'string') {
        departmentObj = { _id: departmentObj, name: selectedDepartment };
      }
      // Pass real MongoDB ObjectId for doctor and department
      onContinue({
        ...doctor,
        department: departmentObj,
        _id: doctor._id, // ensure _id is present
        id: doctor._id   // ensure id is ObjectId
      });
    }
  };

  const getEstimatedWaitingTime = (currentQueue: number = 0) => {
    const totalMinutes = currentQueue * 15;

    if (totalMinutes === 0) return 'No wait';
    if (totalMinutes < 60) return `${totalMinutes} min`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return minutes === 0
      ? `${hours} hour${hours > 1 ? 's' : ''}`
      : `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      {/* Header Info */}
      <div className="mb-6 bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex justify-between flex-wrap gap-4">
          <div className="flex gap-4 flex-wrap">
            <div className="bg-blue-50 px-4 py-2 rounded-xl border">
              <p className="text-xs">Selected Date</p>
              <p className="font-semibold">{formatDate(selectedDate)}</p>
            </div>

            <div className="bg-blue-50 px-4 py-2 rounded-xl border">
              <p className="text-xs">Department</p>
              <p className="font-semibold">{selectedDepartment}</p>
            </div>
          </div>

          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border rounded-xl">
            <ChevronLeft className="w-4 h-4" />
            Change
          </button>
        </div>
      </div>

      {/* Fastest Queue */}
      {findFastestDoctor() && (
        <div className="mb-6 bg-green-500 text-white p-6 rounded-2xl">
          <button onClick={handleFastestQueue}>Select Fastest Queue</button>
        </div>
      )}

      {/* Doctors - only show those with a valid _id (from database) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.filter(doc => !!doc._id).map((doctor) => {
          const badge = getAvailabilityBadge(doctor.availability);
          const isDisabled = doctor.availability === 'full';
          return (
            <div
              key={doctor.id}
              className={`bg-white rounded-2xl border p-4 ${
                isDisabled ? 'opacity-60' : ''
              }`}
            >
              <span className={`text-xs px-2 py-1 border rounded ${badge.color}`}>
                {badge.label}
              </span>
              <div className="mt-4">
                <h3 className="font-semibold">{doctor.name}</h3>
                <p className="text-sm text-gray-500">
                  {doctor.department?.name || doctor.department}
                </p>
                <p className="text-sm mt-2">
                  ⏱ {doctor.workingHours}
                </p>
                <p className="text-sm">
                  👥 {doctor.currentQueue} / {doctor.maxQueue}
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  {getEstimatedWaitingTime(doctor.currentQueue)}
                </p>
                <button
                  onClick={() => handleDoctorSelect(doctor)}
                  disabled={isDisabled}
                  className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
                >
                  {isDisabled ? 'Full' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}