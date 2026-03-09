import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { Calendar, Clock, MapPin, User, Plus, Eye, X, AlertCircle, CheckCircle, Clock3, Building2, LogOut, Bell } from 'lucide-react';
import { getSession, clearSession } from '../../api/auth';
import { getDepartmentName } from '../../utils/department';
import { useRealtimeEvent } from '../context/RealtimeContext';

interface Booking {
  id: string;
  queueNumber: string;
  hospital: string;
  department: string;
  doctor: string;
  date: string;
  time: string;
  status: 'upcoming' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled';
  estimatedWaitTime: number;
}

interface PatientDashboardProps { }

export function PatientDashboard({ }: PatientDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [patientName, setPatientName] = useState('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const navigate = useNavigate();

  const loadBookings = useCallback(async () => {
    try {
      const user = getSession();
      if (!user) {
        clearSession();
        navigate('/signin');
        return;
      }
      setPatientName(user.fullName);
      const data = await import('../../api/bookings').then(m => m.getMyBookings(user.id));
      const statusMap: Record<string, Booking['status']> = {
        waiting: 'upcoming',
        confirmed: 'upcoming',
        'checked-in': 'checked-in',
        'in-progress': 'in-progress',
        completed: 'completed',
        canceled: 'cancelled',
        cancelled: 'cancelled',
      };
      const ui: Booking[] = data.map(b => ({
        id: b._id,
        queueNumber: b.queueNumber,
        hospital: b.hospital,
        department: getDepartmentName((b as any).department),
        doctor: b.doctorName,
        date: b.date,
        time: b.timeSlot === 'morning' ? 'Morning' : 'Afternoon',
        status: statusMap[b.status] || 'upcoming',
        estimatedWaitTime: (b as any).queueStatus?.estimatedWaitMinutes ?? 0,
      }));
      setBookings(ui);
    } catch (err) {
      console.error('failed load bookings', err);
    }
  }, [navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useRealtimeEvent('booking-update', loadBookings);
  useRealtimeEvent('queue-update', loadBookings);

  // fetch unread notification count for red badge
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const list = await import('../../api/notifications').then(m => m.getNotifications());
        const unread = (list || []).filter((n: { isRead?: boolean }) => !n.isRead).length;
        setUnreadNotificationCount(unread);
      } catch {
        // ignore (e.g. not logged in or API error)
      }
    };
    loadUnread();
  }, []);

  const getStatusBadge = (status: Booking['status']) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-700',
      'checked-in': 'bg-yellow-100 text-yellow-700',
      'in-progress': 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    const labels = {
      upcoming: 'Upcoming',
      'checked-in': 'Checked In',
      'in-progress': 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'checked-in':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'in-progress':
        return <Clock3 className="w-5 h-5 text-purple-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === 'upcoming');
  const pastBookings = bookings.filter(b => b.status !== 'upcoming');

  const handleLogout = () => {
    clearSession();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header - รองรับทุกหน้าจอ */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Dashboard</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <p className="text-gray-600 text-sm sm:text-base truncate">Welcome back, {patientName || '—'}</p>
                <Link
                  to="/notifications"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 shrink-0"
                >
                  <span className="relative inline-flex">
                    <Bell className="w-4 h-4 shrink-0" />
                    {unreadNotificationCount > 0 && (
                      <span
                        className="absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full"
                        aria-label={`${unreadNotificationCount} unread`}
                      >
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </span>
                  Notifications
                </Link>
                <Link
                  to="/settings"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 shrink-0"
                >
                  <User className="w-4 h-4 shrink-0" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 shrink-0 transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate('/app')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition-colors shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">New Booking</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - รองรับทุกหน้าจอ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Upcoming Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{upcomingBookings.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-100 rounded-lg p-2 bg-blue-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed Visits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-100 rounded-lg p-2 bg-green-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{bookings.length}</p>
              </div>
              <User className="w-12 h-12 text-purple-100 rounded-lg p-2 bg-purple-50" />
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Bookings</h2>
            <div className="space-y-4">
              {upcomingBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        {getStatusIcon(booking.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Queue #{booking.queueNumber}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-gray-600 font-medium mb-3">{booking.doctor}</p>
                        {booking.status === 'upcoming' && (
                          <button
                            onClick={async () => {
                              try {
                                await import('../../api/bookings').then(m => m.cancelBooking(booking.id));
                                setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
                              } catch (e) {
                                console.error('cancel', e);
                              }
                            }}
                            className="text-red-600 text-sm hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{booking.department}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{booking.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{booking.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-orange-600 font-medium">
                            <Clock3 className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{booking.estimatedWaitTime} min wait</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Bookings</h2>
            <div className="space-y-4">
              {pastBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {getStatusIcon(booking.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Queue #{booking.queueNumber}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-gray-600 font-medium mb-2">{booking.doctor}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{booking.department}</span>
                          <span>{booking.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Create your first booking to get started</p>
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Booking
            </button>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Queue Number</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBooking.queueNumber}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium">Doctor</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBooking.doctor}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium">Department</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBooking.department}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium">Hospital</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBooking.hospital}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Date</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBooking.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Time</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedBooking.time}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium">Status</p>
                <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
              </div>
            </div>

            <div className="flex gap-3">
              {selectedBooking.status === 'upcoming' && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await import('../../api/bookings').then(m => m.cancelBooking(selectedBooking.id));
                        setBookings(bookings.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b));
                        setSelectedBooking(null);
                      } catch (e) {
                        console.error('cancel', e);
                      }
                    }}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-lg transition-colors"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => {
                      navigate('/check-in', { state: { booking: selectedBooking } });
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    Check In
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
