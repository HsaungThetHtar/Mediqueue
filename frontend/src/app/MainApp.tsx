import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { DateDepartmentSelection } from './components/SelectDateDepartment';
import { Doctor } from './components/SelectedDoctor';

export interface BookingData {
  bookingId: string;
  queueNumber: string;
  hospital: string;
  department: string;
  doctor: string;
  date: string;
  estimatedTime: string;
  currentlyServing: string;
}

export default function MainApp() {
  const [dateAndDepartment, setDateAndDepartment] = useState<DateDepartmentSelection | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to select-date if at root /app
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/select-date', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleDateDepartmentSelection = (selection: DateDepartmentSelection) => {
    setDateAndDepartment(selection);
    navigate('/app/select-doctor');
  };

  const handleDoctorSelection = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    navigate('/app/booking');
  };

  const handleBackToDateDepartment = () => {
    navigate('/app/select-date');
  };

  const handleBackToSelection = () => {
    navigate('/app/select-doctor');
  };

  const handleConfirmBooking = (data: BookingData) => {
    setBookingData(data);
    navigate('/app/slip');
  };

  const handleCancelBooking = () => {
    setBookingData(null);
    navigate('/app/select-doctor');
  };

  const handleBackToHome = () => {
    setBookingData(null);
    setSelectedDoctor(null);
    setDateAndDepartment(null);
    navigate('/dashboard');
  };

  const contextValues = {
    dateAndDepartment,
    selectedDoctor,
    bookingData,
    handleDateDepartmentSelection,
    handleDoctorSelection,
    handleBackToDateDepartment,
    handleBackToSelection,
    handleConfirmBooking,
    handleCancelBooking,
    handleBackToHome
  };

  return (
    <div className="min-h-screen bg-white">
      <Outlet context={contextValues} />
    </div>
  );
}