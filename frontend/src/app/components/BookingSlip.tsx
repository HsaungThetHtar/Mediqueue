import React, { useState, useEffect } from 'react';
import { Building2, Calendar, User, Clock, Activity, Home, X, QrCode, Bell, CheckCircle, AlertTriangle, Stethoscope } from 'lucide-react';
import { io } from 'socket.io-client';
import { BookingData } from '../MainApp';
import { cancelBooking, getQueueStatus } from '../../api/bookings';
import { BASE_URL } from '../../api/client';
import { getToken } from '../../api/auth';
import { QRCodeSVG } from 'qrcode.react';
import { getDepartmentName } from '../../utils/department';
import { useNavigate, useOutletContext } from 'react-router';

interface MainAppContext {
  bookingData: BookingData | null;
  handleCancelBooking: () => void;
  handleBackToHome: () => void;
}

export function BookingSlip() {
  const { bookingData, handleCancelBooking, handleBackToHome } = useOutletContext<MainAppContext>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!bookingData) {
      navigate('/app/select-date', { replace: true });
    }
  }, [bookingData, navigate]);

  if (!bookingData) {
    return null;
  }

  const onCancelBooking = handleCancelBooking;
  const onBackToHomeHandler = handleBackToHome;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [queueModalType, setQueueModalType] = useState<'called' | 'in-progress' | null>(null);

  // FIX #10: Track live booking status to hide cancel button after check-in
  const [liveStatus, setLiveStatus] = useState<string>((bookingData as any).status || 'waiting');

  const prefix = (bookingData.queueNumber || 'Q-000').split('-')[0] || 'Q';
  const [currentServing, setCurrentServing] = useState(bookingData.currentlyServing || `${prefix}-000`);
  const [waitingTime, setWaitingTime] = useState(0);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return dateStr;
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const bookingId = (bookingData as any).bookingId || (bookingData as any).id || (bookingData as any)._id;

  // Only encode the booking ID — the check-in endpoint does a server-side lookup
  const qrCodeData = bookingId || bookingData.queueNumber || '';

  const fetchStatus = React.useCallback(() => {
    if (!bookingId) return;
    getQueueStatus(bookingId)
      .then((s: { currentlyServing: string; estimatedWaitMinutes: number; status: string }) => {
        setCurrentServing(s.currentlyServing || `${prefix}-000`);
        setWaitingTime(s.estimatedWaitMinutes ?? 0);
        // FIX #10: Update live status from API
        if (s.status) setLiveStatus(s.status);
      })
      .catch(() => {});
  }, [bookingId, prefix]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelModal(false);
    if (bookingData.bookingId) {
      try {
        await cancelBooking(bookingData.bookingId);
      } catch (err) {
        console.error('Cancel booking error:', err);
      }
    }
    onCancelBooking();
  };

  const handleCloseModal = () => {
    setShowCancelModal(false);
  };

  const handleImOnMyWay = () => {
    setQueueModalType(null);
  };

  useEffect(() => {
    if (!bookingId) return;
    const socket = io(BASE_URL, { auth: { token: getToken() } });

    // Helper: convert currentQueueServing (number or "M-003") to display string like "M-003"
    const toDisplayServing = (val: number | string | undefined) => {
      if (val == null) return null;
      if (typeof val === 'string' && val.includes('-')) return val;
      const num = typeof val === 'number' ? val : parseInt(String(val), 10);
      if (isNaN(num)) return null;
      return `${prefix}-${String(num).padStart(3, '0')}`;
    };

    socket.on('booking-update', (payload: { bookingId: string; status: string; booking?: any }) => {
      if (payload.bookingId === bookingId) {
        if (payload.status === 'in-progress' || payload.status === 'called') setQueueModalType(payload.status as 'called' | 'in-progress');
        if (payload.status) setLiveStatus(payload.status);
        // Only update currentServing for our own booking (H3 fix)
        const serving = payload.booking?.doctor?.currentQueueServing;
        const display = toDisplayServing(serving);
        if (display) setCurrentServing(display);
        fetchStatus();
      }
    });

    socket.on('queue-update', (payload: { type: string; booking?: any; nextBooking?: any }) => {
      // When a queue is called, update currentServing immediately from the called booking
      if (payload.type === 'called' && payload.booking) {
        const b = payload.booking;
        // If this is our booking being called
        if (b._id === bookingId) setQueueModalType('called');
        // Update currently serving from queueNumber of the called booking
        const serving = b.doctor?.currentQueueServing ?? b.queueNumber;
        const display = toDisplayServing(serving);
        if (display) setCurrentServing(display);
      }
      // On complete/skip, next booking becomes the new serving
      if ((payload.type === 'completed' || payload.type === 'skipped') && payload.nextBooking) {
        const serving = payload.nextBooking.doctor?.currentQueueServing ?? payload.nextBooking.queueNumber;
        const display = toDisplayServing(serving);
        if (display) setCurrentServing(display);
      }
      fetchStatus();
    });

    socket.on('doctor-update', (payload: { currentQueueServing?: number | string; _id?: string }) => {
      // Doctor model update — has the latest currentQueueServing
      const display = toDisplayServing(payload.currentQueueServing);
      if (display) setCurrentServing(display);
    });

    socket.on('checkin-update', (payload: { bookingId: string; status: string }) => {
      if (payload.bookingId === bookingId) {
        setLiveStatus(payload.status || 'checked-in');
      }
    });

    return () => { socket.disconnect(); };
  }, [bookingId, fetchStatus, prefix]);

  // FIX #10: Patient can only cancel if status is "waiting" (not after check-in)
  const canCancel = liveStatus === 'waiting';

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-[#1E88E5] mb-2">
              <Activity className="w-5 h-5" />
              <span className="font-medium">MediQueue</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Booking Confirmed
            </h1>
          </div>

          {/* Success Banner */}
          <div className="bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-2xl p-8 mb-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Booking Successful!</h2>
            </div>
            <p className="text-white/90 text-sm">
              Your queue booking has been confirmed. Please arrive before your estimated service time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Digital Queue Slip */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-[#1E88E5] text-white p-8 text-center">
                  <Building2 className="w-10 h-10 mx-auto mb-3" />
                  <h2 className="text-xl font-semibold mb-1">{bookingData.hospital}</h2>
                  <p className="text-sm text-blue-100">Digital Queue Slip</p>
                </div>

                <div className="py-12 px-8 text-center border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-3">Your Queue Number</p>
                  <div className="text-6xl md:text-7xl font-bold text-[#1E88E5] mb-3">
                    {bookingData.queueNumber}
                  </div>
                  <p className="text-sm text-gray-600">Please keep this number for reference</p>
                </div>

                <div className="p-8 space-y-5">
                  <h3 className="font-semibold text-gray-900 mb-6 text-base">Booking Details</h3>

                  <div className="flex items-start gap-4">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Hospital</p>
                      <p className="text-base font-medium text-gray-900">{bookingData.hospital}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Activity className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Department</p>
                      <p className="text-base font-medium text-gray-900">{getDepartmentName(bookingData.department)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Doctor</p>
                      <p className="text-base font-medium text-gray-900">{bookingData.doctor}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="text-base font-medium text-gray-900">{formatDisplayDate(bookingData.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Estimated Service Time</p>
                      <p className="text-base font-medium text-gray-900">{bookingData.estimatedTime}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="p-8 pt-0">
                  <div className="border-t border-gray-100 pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <QrCode className="w-5 h-5 text-[#1E88E5]" />
                      <h3 className="font-semibold text-gray-900 text-base">Check-In QR Code</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <QRCodeSVG
                          value={qrCodeData}
                          size={200}
                          level="H"
                          includeMargin={true}
                          bgColor="#FFFFFF"
                          fgColor="#1E88E5"
                        />
                      </div>
                      <p className="text-xs text-gray-600 text-center mt-4 max-w-xs">
                        Scan this QR code at the hospital registration desk for quick check-in
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Live Queue Status */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2 text-base">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  Live Queue Status
                </h3>

                <div className="bg-blue-50 rounded-xl p-6 mb-5">
                  <p className="text-sm text-blue-800 mb-3 font-medium">Now Serving (estimated)</p>
                  <p className="text-4xl font-bold text-[#1E88E5]">{currentServing}</p>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Estimated Waiting Time</p>
                    <p className="text-2xl font-semibold text-gray-900">{waitingTime} minutes</p>
                  </div>
                  <Clock className="w-10 h-10 text-gray-300" />
                </div>
              </div>

              {/* FIX #10: Show status badge — informs patient of current status */}
              <div className={`p-4 rounded-xl border font-medium text-sm flex items-center gap-2 ${
                liveStatus === 'waiting' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                liveStatus === 'checked-in' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                liveStatus === 'in-progress' ? 'bg-purple-50 border-purple-200 text-purple-800' :
                liveStatus === 'completed' ? 'bg-green-50 border-green-200 text-green-800' :
                'bg-gray-50 border-gray-200 text-gray-700'
              }`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                Booking Status: <span className="font-bold uppercase ml-1">{liveStatus.replace('-', ' ')}</span>
              </div>

              {/* Important Notice */}
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-900 leading-relaxed">
                  <span className="font-semibold">Important:</span> Please arrive at least 15 minutes before your estimated service time. Late arrivals may result in queue cancellation.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* FIX #10: Only show Cancel button when status is "waiting" */}
                {canCancel ? (
                  <button
                    onClick={handleCancelClick}
                    className="w-full py-5 rounded-xl font-semibold text-white text-base transition-colors bg-[#D32F2F] hover:bg-[#C62828] active:bg-[#B71C1C] shadow-sm flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel Booking
                  </button>
                ) : (
                  <div className="w-full py-4 rounded-xl font-medium text-gray-500 text-sm text-center bg-gray-100 border border-gray-200">
                    Cannot cancel — booking is already {liveStatus.replace('-', ' ')}
                  </div>
                )}

                <button
                  onClick={onBackToHomeHandler}
                  className="w-full py-5 rounded-xl font-semibold text-gray-700 text-base transition-colors bg-white hover:bg-gray-50 active:bg-gray-100 border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#D32F2F] text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <X className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold">Cancel Queue Booking</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-base transition-colors bg-[#D32F2F] hover:bg-[#C62828] active:bg-[#B71C1C]"
                >
                  Yes, Cancel Booking
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-700 text-base transition-colors bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                >
                  No, Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Called Modal — green */}
      {queueModalType === 'called' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-[#2E7D32] text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your Queue is Called!</h2>
                  <p className="text-white/90 text-sm mt-0.5">Please proceed immediately</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <p className="text-sm text-green-800 mb-1">Your Queue Number</p>
                <p className="text-4xl font-bold text-[#2E7D32]">{bookingData.queueNumber}</p>
                <p className="text-sm text-green-700 mt-1">is now being called</p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">Important:</span> Please proceed to the consultation room immediately. If you don&apos;t respond within 10 minutes, your queue may be skipped.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleImOnMyWay}
                  className="w-full py-4 rounded-xl font-semibold text-white bg-[#2E7D32] hover:bg-[#1B5E20] flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  I&apos;m on My Way
                </button>
                <button
                  onClick={() => setQueueModalType(null)}
                  className="w-full py-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  Close Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Started Modal — blue */}
      {queueModalType === 'in-progress' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-blue-700 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Consultation Started</h2>
                  <p className="text-white/90 text-sm mt-0.5">Your turn is now in progress</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                <p className="text-sm text-blue-800 mb-1">Your Queue Number</p>
                <p className="text-4xl font-bold text-blue-700">{bookingData.queueNumber}</p>
                <p className="text-sm text-blue-600 mt-1">is now in consultation</p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Stethoscope className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">In Session:</span> Your consultation is now in progress. Please stay in the consultation room with your doctor.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleImOnMyWay}
                  className="w-full py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Got It
                </button>
                <button
                  onClick={() => setQueueModalType(null)}
                  className="w-full py-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  Close Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}