import { useState } from 'react';
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

  return (
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
  );
}