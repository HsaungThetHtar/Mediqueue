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

// Persist booking flow state in sessionStorage so refresh doesn't lose data
const SESSION_KEY = 'mediqueue_booking_flow';

function loadFlowState() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { dateAndDepartment: null, selectedDoctor: null, bookingData: null };
    return JSON.parse(raw);
  } catch {
    return { dateAndDepartment: null, selectedDoctor: null, bookingData: null };
  }
}

function saveFlowState(state: { dateAndDepartment: DateDepartmentSelection | null; selectedDoctor: Doctor | null; bookingData: BookingData | null }) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {}
}

export default function MainApp() {
  const saved = loadFlowState();
  const [dateAndDepartment, setDateAndDepartment] = useState<DateDepartmentSelection | null>(saved.dateAndDepartment);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(saved.selectedDoctor);
  const [bookingData, setBookingData] = useState<BookingData | null>(saved.bookingData);

  const navigate = useNavigate();
  const location = useLocation();

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    saveFlowState({ dateAndDepartment, selectedDoctor, bookingData });
  }, [dateAndDepartment, selectedDoctor, bookingData]);

  // Guard: redirect back to the correct step if state is missing on refresh
  useEffect(() => {
    const path = location.pathname;

    if (path === '/app' || path === '/app/') {
      navigate('/app/select-date', { replace: true });
      return;
    }
    // select-doctor needs dateAndDepartment
    if (path === '/app/select-doctor' && !dateAndDepartment) {
      navigate('/app/select-date', { replace: true });
      return;
    }
    // booking needs selectedDoctor
    if (path === '/app/booking' && !selectedDoctor) {
      navigate('/app/select-date', { replace: true });
      return;
    }
    // slip needs bookingData
    if (path === '/app/slip' && !bookingData) {
      navigate('/app/select-date', { replace: true });
      return;
    }
  }, [location.pathname, dateAndDepartment, selectedDoctor, bookingData, navigate]);

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
    sessionStorage.removeItem(SESSION_KEY);
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