import React, { useState, useEffect, useRef } from 'react';
import { Activity, Calendar, Building2, LogOut, ChevronDown, Check, LayoutDashboard } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { getDepartments } from '../../api/departments';

export interface DateDepartmentSelection {
  date: string;
  department: string;
}

interface MainAppContext {
  handleDateDepartmentSelection: (selection: DateDepartmentSelection) => void;
}

const FALLBACK_DEPARTMENTS = [
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics and Gynecology',
  'General Surgery',
  'Orthopedics',
  'Ear, Nose and Throat (ENT)',
  'Dermatology',
];

export function SelectDateDepartment() {
  const { handleDateDepartmentSelection } = useOutletContext<MainAppContext>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<string[]>(FALLBACK_DEPARTMENTS);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const departmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDepartments()
      .then((list) => {
        if (list.length > 0) setDepartments(list);
      })
      .catch(() => setLoadError('Failed to load departments. Please refresh the page.'));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (departmentRef.current && !departmentRef.current.contains(event.target as Node)) {
        setDepartmentOpen(false);
      }
    }
    if (departmentOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [departmentOpen]);

  const handleContinue = () => {
    console.log('SelectDateDepartment: handleContinue clicked', { selectedDate, selectedDepartment });
    if (selectedDate && selectedDepartment) {
      console.log('SelectDateDepartment: calling context handler');
      handleDateDepartmentSelection({
        date: selectedDate,
        department: selectedDepartment,
      });
    } else {
      console.warn('SelectDateDepartment: form invalid');
    }
  };

  const handleLogout = () => {
    navigate('/signin');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
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
    <div className="min-h-screen bg-gray-50 w-full min-w-0 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-2xl min-w-0">
        {/* Header - รองรับทุกหน้าจอ */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 text-[#1E88E5] min-w-0 shrink-0">
              <Activity className="w-5 h-5 shrink-0" />
              <span className="font-medium truncate">MediQueue</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDashboard}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-xl font-medium text-sm transition-colors bg-white text-[#1E88E5] border-2 border-[#1E88E5] hover:bg-blue-50"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-xl font-medium text-sm transition-colors bg-white text-[#D32F2F] border-2 border-[#D32F2F] hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div className="mt-8 sm:mt-10 md:mt-16">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
              Book Appointment
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Select date and department to view available doctors
            </p>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            {loadError}
          </div>
        )}

        {/* Main Card - padding รองรับมือถือ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 md:p-8">
          <div className="space-y-5 sm:space-y-6">
            {/* Date Selection */}
            <div>
              <label className="flex items-center gap-2 mb-2 sm:mb-3 font-semibold text-gray-900 text-sm sm:text-base">
                <Calendar className="w-5 h-5 text-[#1E88E5] shrink-0" />
                Select Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getTodayDate()}
                  max={getMaxDate()}
                  className="w-full min-h-[48px] px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent transition-all cursor-pointer text-base font-medium
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
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2">
                Click to open calendar and select your appointment date (up to 30 days)
              </p>
            </div>

            {/* Department Selection - custom dropdown เปิดด้านล่าง ไม่ทับ header */}
            <div ref={departmentRef}>
              <label className="flex items-center gap-2 mb-2 sm:mb-3 font-semibold text-gray-900 text-sm sm:text-base">
                <Building2 className="w-5 h-5 text-[#1E88E5] shrink-0" />
                Select Department
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDepartmentOpen((o) => !o)}
                  className={`w-full min-h-[48px] px-4 py-3 sm:py-4 pr-10 rounded-xl border-2 text-left text-base font-medium transition-all flex items-center gap-2 ${departmentOpen
                    ? 'border-[#1E88E5] ring-2 ring-[#1E88E5] ring-opacity-30'
                    : 'border-gray-300 text-gray-900 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent'
                    }`}
                  aria-haspopup="listbox"
                  aria-expanded={departmentOpen}
                >
                  <span className={selectedDepartment ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedDepartment || 'Choose a department'}
                  </span>
                </button>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                  <ChevronDown
                    className={`w-5 h-5 text-[#1E88E5] transition-transform ${departmentOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                {/* รายการเปิดด้านล่างช่องเสมอ */}
                {departmentOpen && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-[280px] overflow-y-auto"
                    role="listbox"
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        role="option"
                        onClick={() => {
                          setSelectedDepartment('');
                          setDepartmentOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between gap-2 hover:bg-blue-50 ${!selectedDepartment ? 'bg-blue-50 text-[#1E88E5]' : 'text-gray-700'}`}
                      >
                        <span>Choose a department</span>
                        {!selectedDepartment && <Check className="w-5 h-5 shrink-0" />}
                      </button>
                      {departments.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          role="option"
                          onClick={() => {
                            setSelectedDepartment(dept);
                            setDepartmentOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between gap-2 hover:bg-blue-50 ${selectedDepartment === dept ? 'bg-blue-50 text-[#1E88E5]' : 'text-gray-700'}`}
                        >
                          <span className="truncate">{dept}</span>
                          {selectedDepartment === dept && <Check className="w-5 h-5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2">
                Click to view and select from available departments
              </p>
            </div>

            {/* Continue Button - ความสูงเหมาะกับ touch */}
            <div className="pt-2 sm:pt-4">
              <button
                onClick={handleContinue}
                disabled={!isFormValid}
                className={`w-full min-h-[48px] py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all ${isFormValid
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
        <div className="mt-4 sm:mt-6 bg-blue-50 rounded-2xl border border-blue-200 p-4 sm:p-5 md:p-6">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">How it works</h3>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#1E88E5] font-bold shrink-0">1.</span>
              <span>Select your preferred appointment date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E88E5] font-bold shrink-0">2.</span>
              <span>Choose the medical department you need</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E88E5] font-bold shrink-0">3.</span>
              <span>Select from available doctors in that department</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1E88E5] font-bold shrink-0">4.</span>
              <span>Confirm your booking and receive your queue number</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}