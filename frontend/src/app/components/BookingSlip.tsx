import { useState, useEffect } from 'react';
import { Building2, Calendar, User, Clock, Activity, Home, X, QrCode } from 'lucide-react';
import { BookingData } from '../App';
import { QRCodeSVG } from 'qrcode.react';
import { checkinBooking } from '../../services/api';

interface BookingSlipProps {
  bookingData: BookingData;
  onCancelBooking: () => void;
  onBackToHome: () => void;
}

export function BookingSlip({ bookingData, onCancelBooking, onBackToHome }: BookingSlipProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentServing, setCurrentServing] = useState(bookingData.currentlyServing);
  const [waitingTime, setWaitingTime] = useState(0);

  // Generate QR code data (bookingId for check-in)
  const qrCodeData = JSON.stringify({ bookingId: bookingData.bookingId });
  // Demo check-in button
  const [checkinStatus, setCheckinStatus] = useState<string>('');
  const handleCheckin = async () => {
    try {
      setCheckinStatus('Checking in...');
      const res = await checkinBooking(bookingData.bookingId);
      setCheckinStatus(res.msg || 'Check-in successful!');
    } catch (err: any) {
      setCheckinStatus(err.message || 'Check-in failed');
    }
  };

  // Simulate live queue updates
  useEffect(() => {
    const queueNum = parseInt(bookingData.queueNumber.split('-')[1]);
    const servingNum = parseInt(currentServing.split('-')[1]);
    const remaining = queueNum - servingNum;
    setWaitingTime(remaining * 15);

    const interval = setInterval(() => {
      setCurrentServing(prev => {
        const num = parseInt(prev.split('-')[1]);
        if (num < queueNum - 1) {
          return `Q-${String(num + 1).padStart(3, '0')}`;
        }
        return prev;
      });
    }, 10000); // Update every 10 seconds for demo

    return () => clearInterval(interval);
  }, [bookingData.queueNumber, currentServing]);

  // Update waiting time when currently serving changes
  useEffect(() => {
    const queueNum = parseInt(bookingData.queueNumber.split('-')[1]);
    const servingNum = parseInt(currentServing.split('-')[1]);
    const remaining = Math.max(0, queueNum - servingNum);
    setWaitingTime(remaining * 15);
  }, [currentServing, bookingData.queueNumber]);

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onCancelBooking();
  };

  const handleCloseModal = () => {
    setShowCancelModal(false);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-10">
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

          {/* Desktop Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Digital Queue Slip */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Hospital Header */}
                <div className="bg-[#1E88E5] text-white p-8 text-center">
                  <Building2 className="w-10 h-10 mx-auto mb-3" />
                  <h2 className="text-xl font-semibold mb-1">{bookingData.hospital}</h2>
                  <p className="text-sm text-blue-100">Digital Queue Slip</p>
                </div>

                {/* Queue Number */}
                <div className="py-12 px-8 text-center border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-3">Your Queue Number</p>
                  <div className="text-6xl md:text-7xl font-bold text-[#1E88E5] mb-3">
                    {bookingData.queueNumber}
                  </div>
                  <p className="text-sm text-gray-600">Please keep this number for reference</p>
                </div>

                {/* Booking Details */}
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
                      <p className="text-base font-medium text-gray-900">{bookingData.department}</p>
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
                      <p className="text-base font-medium text-gray-900">{bookingData.date}</p>
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

                {/* QR Code Section */}
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
                      <button
                        className="mt-4 px-4 py-2 rounded-lg bg-[#1E88E5] text-white font-semibold hover:bg-blue-600"
                        onClick={handleCheckin}
                      >
                        Demo Check-In
                      </button>
                      {checkinStatus && (
                        <p className="text-xs text-green-600 mt-2">{checkinStatus}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Live Status & Actions */}
            <div className="space-y-6">
              {/* Live Queue Status */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2 text-base">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  Live Queue Status
                </h3>
                
                <div className="bg-blue-50 rounded-xl p-6 mb-5">
                  <p className="text-sm text-blue-800 mb-3 font-medium">Now Serving</p>
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

              {/* Important Notice */}
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-900 leading-relaxed">
                  <span className="font-semibold">Important:</span> Please arrive at least 15 minutes before your estimated service time. Late arrivals may result in queue cancellation.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleCancelClick}
                  className="w-full py-5 rounded-xl font-semibold text-white text-base transition-colors bg-[#D32F2F] hover:bg-[#C62828] active:bg-[#B71C1C] shadow-sm flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel Booking
                </button>
                
                <button
                  onClick={onBackToHome}
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
            {/* Modal Header */}
            <div className="bg-[#D32F2F] text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <X className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold">Cancel Queue Booking</h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                Are you sure you want to cancel this booking? This action cannot be undone and you will need to book a new queue if you wish to see the doctor.
              </p>

              {/* Modal Actions */}
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
    </>
  );
}