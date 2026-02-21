import { useState } from 'react';
import { Activity, Calendar, Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';

export interface DateDepartmentSelection {
  date: string;
  department: string;
}

interface SelectDateDepartmentProps {
  onContinue: (selection: DateDepartmentSelection) => void;
}

export function SelectDateDepartment({ onContinue }: SelectDateDepartmentProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const departments = [
    'Internal Medicine',
    'Pediatrics',
    'Obstetrics and Gynecology',
    'General Surgery',
    'Orthopedics',
    'Ear, Nose and Throat (ENT)',
    'Dermatology'
  ];

  const handleContinue = () => {
    if (selectedDate && selectedDepartment) {
      onContinue({
        date: selectedDate,
        department: selectedDepartment,
      });
    }
  };

  const handleLogout = () => {
    navigate('/signin');
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get max date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const isFormValid = selectedDate && selectedDepartment;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-2xl">
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
          <div className="mt-12 md:mt-16">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Book Appointment
            </h1>
            <p className="text-gray-600 mt-2">Select date and department to view available doctors</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="flex items-center gap-2 mb-3 font-semibold text-gray-900">
                <Calendar className="w-5 h-5 text-[#1E88E5]" />
                Select Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getTodayDate()}
                  max={getMaxDate()}
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent transition-all cursor-pointer text-base font-medium
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                  [&::-webkit-calendar-picker-indicator]:opacity-0
                  [&::-webkit-calendar-picker-indicator]:absolute
                  [&::-webkit-calendar-picker-indicator]:w-full
                  [&::-webkit-calendar-picker-indicator]:h-full
                  [&::-webkit-calendar-picker-indicator]:left-0
                  [&::-webkit-calendar-picker-indicator]:top-0"
                  placeholder="Click to select date"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Calendar className="w-5 h-5 text-[#1E88E5]" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Click to open calendar and select your appointment date (up to 30 days)
              </p>
            </div>

            {/* Department Selection */}
            <div>
              <label className="flex items-center gap-2 mb-3 font-semibold text-gray-900">
                <Building2 className="w-5 h-5 text-[#1E88E5]" />
                Select Department
              </label>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent transition-all cursor-pointer text-base font-medium appearance-none"
                >
                  <option value="">Choose a department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Building2 className="w-5 h-5 text-[#1E88E5]" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Click to view and select from available departments
              </p>
            </div>

            {/* Continue Button */}
            <div className="pt-4">
              <button
                onClick={handleContinue}
                disabled={!isFormValid}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                  isFormValid
                    ? 'bg-[#1E88E5] text-white hover:bg-[#1976D2] active:bg-[#1565C0] shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue to Select Doctor
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#1E88E5] font-bold">1.</span>
              <span>Select your preferred appointment date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E88E5] font-bold">2.</span>
              <span>Choose the medical department you need</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E88E5] font-bold">3.</span>
              <span>Select from available doctors in that department</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E88E5] font-bold">4.</span>
              <span>Confirm your booking and receive your queue number</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}