import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { Calendar, Clock, User, Plus, Eye, X, AlertCircle, CheckCircle, Clock3, Building2, LogOut, Bell, FileText } from 'lucide-react';
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

interface PatientDashboardProps {}

export function PatientDashboard({}: PatientDashboardProps) {

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

      const data = await import('../../api/bookings').then(m =>
        m.getMyBookings(user.id)
      );

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

  useEffect(() => {

    const loadUnread = async () => {
      try {

        const list = await import('../../api/notifications').then(m =>
          m.getNotifications()
        );

        const unread = (list || []).filter((n: { isRead?: boolean }) => !n.isRead).length;

        setUnreadNotificationCount(unread);

      } catch {}

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

      {/* Header */}

      <div className="bg-white border-b border-gray-200">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>

              <p className="text-gray-600">
                Welcome back, {patientName || '—'}
              </p>

            </div>

            <div className="flex items-center gap-4">

              <Link to="/notifications" className="relative">

                <Bell className="w-5 h-5 text-gray-600" />

                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                    {unreadNotificationCount}
                  </span>
                )}

              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-600 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>

              <button
                onClick={() => navigate('/app')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
              >
                <Plus className="w-5 h-5" />
                New Booking
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* Upcoming Bookings */}

      <div className="max-w-6xl mx-auto px-4 py-8">

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your Bookings
        </h2>

        <div className="space-y-4">

          {bookings.map(booking => (

            <div
              key={booking.id}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >

              <div className="flex items-start justify-between">

                <div className="flex gap-4">

                  <div className="p-3 bg-blue-50 rounded-lg">
                    {getStatusIcon(booking.status)}
                  </div>

                  <div>

                    <div className="flex items-center gap-3 mb-2">

                      <h3 className="text-lg font-semibold text-gray-900">
                        Queue #{booking.queueNumber}
                      </h3>

                      {getStatusBadge(booking.status)}

                    </div>

                    <p className="text-gray-600 font-medium mb-2">
                      {booking.doctor}
                    </p>

                    <div className="flex gap-4 text-sm text-gray-600">

                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {booking.department}
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {booking.date}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.time}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="flex gap-2">

                  {/* Slip Button */}

                    <button
                      onClick={() => navigate('/app/slip', { state: { booking } })}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Slip
                    </button>

                  {/* View Details */}

                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Eye className="w-5 h-5 text-gray-400" />
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );
}