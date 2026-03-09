import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, CheckCircle, AlertCircle, ArrowLeft, Camera, CameraOff } from 'lucide-react';
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

const QR_READER_ID = 'qr-reader-viewport';

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
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup nav timeout on unmount (M5)
  useEffect(() => () => { if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current); }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scanningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {}
      scanningRef.current = false;
    }
  };

  const handleScannedCode = async (code: string) => {
    await stopScanner();
    setShowCamera(false);
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
        title: 'Booking Not Found',
        text: err?.message || 'QR code is invalid or booking cannot be checked in.',
        confirmButtonColor: '#1E88E5',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!showCamera) return;

    setCameraError(null);
    const scanner = new Html5Qrcode(QR_READER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!scanningRef.current) return;
          handleScannedCode(decodedText);
        },
        () => {} // per-frame failure is expected — ignore
      )
      .then(() => {
        scanningRef.current = true;
      })
      .catch((err: Error) => {
        setCameraError(err?.message || 'Camera access denied. Please allow camera permission and try again.');
        setShowCamera(false);
      });

    return () => {
      stopScanner();
    };
  }, [showCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => () => { stopScanner(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualCodeSubmit = async () => {
    const code = manualCode.trim();
    if (!code) return;
    await handleScannedCode(code);
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
      navTimeoutRef.current = setTimeout(() => {
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
              <p className="text-3xl font-bold text-blue-600">{bookingData?.queueNumber ?? '—'}</p>
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
                <h2 className="text-xl font-semibold text-gray-900">Booking Verified</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Queue Number</p>
                  <p className="text-2xl font-bold text-gray-900">{bookingData.queueNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Doctor</p>
                    <p className="text-lg font-semibold text-gray-900">{bookingData.doctor}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Department</p>
                    <p className="text-lg font-semibold text-gray-900">{getDepartmentName((bookingData as any).department) || '—'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Hospital</p>
                  <p className="text-lg font-semibold text-gray-900">{bookingData.hospital}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Date</p>
                    <p className="text-lg font-semibold text-gray-900">{bookingData.date}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Time</p>
                    <p className="text-lg font-semibold text-gray-900">{bookingData.time}</p>
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

              {/* Camera error message */}
              {cameraError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {cameraError}
                </div>
              )}

              {/* Scanner viewport — html5-qrcode mounts into this div */}
              <div
                id={QR_READER_ID}
                className={`rounded-lg overflow-hidden mb-4 ${showCamera ? 'min-h-[300px]' : 'hidden'}`}
              />

              {/* Placeholder shown when camera is off */}
              {!showCamera && (
                <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-lg aspect-square flex items-center justify-center mb-4 relative overflow-hidden">
                  <div className="text-center">
                    <QrCode className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Point camera at QR code</p>
                    <p className="text-sm text-gray-500 mt-1">Or use manual entry below</p>
                  </div>
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
                </div>
              )}

              <button
                onClick={async () => {
                  if (showCamera) {
                    await stopScanner();
                    setShowCamera(false);
                  } else {
                    setShowCamera(true);
                  }
                }}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {showCamera
                  ? <><CameraOff className="w-5 h-5" /> Stop Camera</>
                  : <><Camera className="w-5 h-5" /> Start Camera</>
                }
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
                  placeholder="e.g., M-001 or booking ID"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualCodeSubmit()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
