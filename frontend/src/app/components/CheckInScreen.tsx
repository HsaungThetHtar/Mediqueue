import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { QrCode, MapPin, Clock, User, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { getDepartmentName } from '../../utils/department';

interface BookingInfo {
  id: string;
  queueNumber: string;
  doctor: string;
  department: string;
  hospital: string;
  date: string;
  time: string;
}

export function CheckInScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const passed = (location.state as any)?.booking as BookingInfo | undefined;

  const [bookingData, setBookingData] = useState<BookingInfo | null>(passed || null);
  const [qrScanned, setQrScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  useEffect(() => {
    // ไม่ redirect อัตโนมัติ — ให้ผู้ใช้ใส่รหัสมือได้แม้เข้ามาโดยไม่มี state
  }, []);

  const displayBooking = bookingData;

  const handleSimulateQRScan = () => {
    setIsLoading(true);
    setTimeout(() => {
      setQrScanned(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleManualCodeSubmit = async () => {
    const code = manualCode.trim();
    if (!code) return;
    setIsLoading(true);
    try {
      const validated = await import('../../api/checkins').then(m => m.validateCheckInCode(code));
      setBookingData({
        id: validated.id,
        queueNumber: validated.queueNumber,
        doctor: validated.doctorName || validated.doctor,
        department: validated.department || '',
        hospital: validated.hospital || 'Central City Hospital',
        date: validated.date,
        time: validated.time || (validated.timeSlot === 'morning' ? '08.00-12.00' : '13.00-17.00'),
      });
      setQrScanned(true);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่พบการจอง',
        text: err?.message || 'รหัสไม่ถูกต้องหรือการจองไม่สามารถเช็คอินได้',
        confirmButtonColor: '#1E88E5',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!bookingData) return;
    setIsLoading(true);
    try {
      await import('../../api/checkins').then(m => m.createCheckIn({
        bookingId: bookingData.id,
        method: qrScanned ? 'qr' : 'manual',
        notes: ''
      }));
      setCheckInSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('checkin error', err);
      Swal.fire({ icon: 'error', title: 'Check-in Failed', text: 'Please try again or contact staff.', confirmButtonColor: '#1E88E5' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Check-In</h1>
          <p className="text-gray-600 mt-1">Verify your booking before consultation</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {checkInSuccess ? (
          // Success State
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-In Successful!</h2>
            <p className="text-gray-600 mb-6">
              You are checked in for your appointment. Please wait for your turn to be called.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Your Queue Number</p>
              <p className="text-3xl font-bold text-blue-600">{displayBooking?.queueNumber ?? "—"}</p>
            </div>
            <button
              onClick={() => {
                setCheckInSuccess(false);
                setQrScanned(false);
                setManualCode('');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        ) : qrScanned && bookingData ? (
          // Verification State
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">QR Code Verified</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Queue Number</p>
                  <p className="text-2xl font-bold text-gray-900">{displayBooking?.queueNumber ?? "—"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Doctor</p>
                    <p className="text-lg font-semibold text-gray-900">{displayBooking?.doctor ?? "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Department</p>
                    <p className="text-lg font-semibold text-gray-900">{getDepartmentName((displayBooking as any)?.department) || "—"}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Hospital</p>
                  <p className="text-lg font-semibold text-gray-900">{displayBooking?.hospital ?? "—"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Date</p>
                    <p className="text-lg font-semibold text-gray-900">{displayBooking?.date ?? "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Time</p>
                    <p className="text-lg font-semibold text-gray-900">{displayBooking?.time ?? "—"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Please verify your information</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Make sure all details are correct before confirming your check-in
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setQrScanned(false);
                    setManualCode('');
                  }}
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmCheckIn}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Confirm Check-In'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // QR Scan & Manual Entry State
          <div className="space-y-6">
            {/* QR Code Scanner */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan QR Code</h2>

              <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-lg aspect-square flex items-center justify-center mb-4 relative overflow-hidden">
                {/* Camera placeholder */}
                <div className="text-center">
                  <QrCode className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Point camera at QR code</p>
                  <p className="text-sm text-gray-500 mt-1">Or use manual entry below</p>
                </div>

                {/* Corner indicators */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
              </div>

              <button
                onClick={handleSimulateQRScan}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Scanning...' : 'Simulate QR Scan'}
              </button>
            </div>

            {/* Or Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 font-medium">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Manual Entry */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Entry</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Queue Booking Code
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q-001 หรือหมายเลขการจอง"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-2">
                  You can find this code in your booking confirmation email
                </p>
              </div>

              <button
                onClick={handleManualCodeSubmit}
                disabled={isLoading || !manualCode.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
