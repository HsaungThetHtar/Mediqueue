import { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { useHideAuthNavButtons } from './hooks/useHideAuthNavButtons';
import { useIsAuthenticated } from './hooks/useIsAuthenticated';
import { SelectDateDepartment, DateDepartmentSelection } from './components/SelectDateDepartment';
import { SelectedDoctor, Doctor } from './components/SelectedDoctor';
import { QueueBooking } from './components/QueueBooking';
import { BookingSlip } from './components/BookingSlip';

export type Screen = 'selectDateDepartment' | 'selectDoctor' | 'booking' | 'slip';

export interface BookingData {
  queueNumber: string;
  hospital: string;
  department: string;
  doctor: string;
  date: string;
  estimatedTime: string;
  currentlyServing: string;
}

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('selectDateDepartment');
  const [dateAndDepartment, setDateAndDepartment] = useState<DateDepartmentSelection | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  const handleDateDepartmentSelection = (selection: DateDepartmentSelection) => {
    setDateAndDepartment(selection);
    setCurrentScreen('selectDoctor');
  };

  const handleDoctorSelection = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentScreen('booking');
  };

  const handleBackToDateDepartment = () => {
    setCurrentScreen('selectDateDepartment');
  };

  const handleBackToSelection = () => {
    setCurrentScreen('selectDoctor');
  };

  const handleConfirmBooking = (data: BookingData) => {
    setBookingData(data);
    setCurrentScreen('slip');
  };

  const handleCancelBooking = () => {
    setBookingData(null);
    setCurrentScreen('selectDoctor');
  };

  const handleBackToHome = () => {
    setBookingData(null);
    setSelectedDoctor(null);
    setDateAndDepartment(null);
    setCurrentScreen('selectDateDepartment');
  };

  const hideAuthNavButtons = useHideAuthNavButtons();
  const isAuthenticated = useIsAuthenticated();
  return (
    <div>
      <nav className="bg-gradient-to-r from-blue-600 to-blue-400 shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-white font-bold text-xl tracking-wide">MediQueue</span>
              <Link to="/app" className="text-white hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Home</Link>
              <Link to="/doctor/dashboard" className="text-white hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Doctor Dashboard</Link>
            </div>
            {!hideAuthNavButtons && !isAuthenticated && (
              <div className="flex items-center gap-2">
                <Link to="/signup" className="bg-white text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-semibold transition">Patient Sign Up</Link>
                <Link to="/signin" className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-md text-sm font-semibold transition">Patient Sign In</Link>
                <Link to="/doctor/signup" className="bg-white text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-semibold transition">Doctor Sign Up</Link>
                <Link to="/doctor/signin" className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-md text-sm font-semibold transition">Doctor Sign In</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="min-h-screen bg-white">
        {currentScreen === 'selectDateDepartment' && (
          <SelectDateDepartment onContinue={handleDateDepartmentSelection} />
        )}
        {currentScreen === 'selectDoctor' && dateAndDepartment && (
          <SelectedDoctor 
            onContinue={handleDoctorSelection}
            selectedDepartment={dateAndDepartment.department}
            selectedDate={dateAndDepartment.date}
            onBack={handleBackToDateDepartment}
          />
        )}
        {currentScreen === 'booking' && selectedDoctor && dateAndDepartment && (
          <QueueBooking 
            onConfirmBooking={handleConfirmBooking}
            selectedDoctor={selectedDoctor}
            onBackToSelection={handleBackToSelection}
            selectedDate={dateAndDepartment.date}
          />
        )}
        {currentScreen === 'slip' && bookingData && (
          <BookingSlip 
            bookingData={bookingData}
            onCancelBooking={handleCancelBooking}
            onBackToHome={handleBackToHome}
          />
        )}
      </div>
    </div>
  );
}