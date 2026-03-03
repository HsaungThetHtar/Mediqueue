import { useEffect, useState } from 'react';
import { doctorApi } from '../../services/api';

export function DoctorDashboard() {
  const [doctor, setDoctor] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Log out handler
  function handleLogout() {
    localStorage.removeItem('authToken');
    window.location.href = '/'; // Redirect to home or login page
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // Get doctor profile (assume /doctors/profile returns doctor info)
        const profile = await doctorApi.getDoctorProfile();
          console.log('[DoctorDashboard] doctor profile:', profile);
          setDoctor(profile);
        // Get today's queue
        const res = await doctorApi.getTodayQueue();
        setQueue(res.bookings || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-10">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png" alt="Hospital Logo" className="w-12 h-12" />
            <h1 className="text-3xl font-extrabold text-white">Doctor Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">Online</span>
            <button
              onClick={handleLogout}
              className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-full shadow hover:bg-blue-100 transition"
            >
              Log Out
            </button>
          </div>
        </div>
        <div className="px-10 py-8">
          {loading ? (
            <div className="text-lg text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-red-600 font-semibold">{error}</div>
          ) : (
            <>
              {/* Doctor Info Card */}
              {doctor && (
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between bg-blue-50 rounded-xl p-6 shadow">
                  <div className="flex items-center gap-4">
                    {doctor.imageUrl ? (
                      <img src={doctor.imageUrl} alt="Doctor" className="w-20 h-20 rounded-full object-cover border-2 border-blue-300" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-3xl text-blue-700 font-bold border-2 border-blue-300">{doctor.name?.charAt(0) || 'D'}</div>
                    )}
                    <div>
                      <div className="text-2xl font-bold text-blue-800 mb-1">Dr. {doctor.name}</div>
                      <div className="text-blue-600 font-medium">Specialization: {doctor.specialization}</div>
                      {doctor.department && (
                        <div className="text-blue-500 font-medium">Department: {doctor.department.name || doctor.department}</div>
                      )}
                      {doctor.qualifications && doctor.qualifications.length > 0 && (
                        <div className="text-gray-700 text-sm mt-1">Qualifications: {doctor.qualifications.join(', ')}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-600">ID: <span className="font-mono text-blue-700">{doctor._id}</span></div>
                  </div>
                </div>
              )}
              {!doctor && (
                <div className="mb-8 text-red-600 font-semibold">Doctor profile not found. Please check your backend or login status.</div>
              )}
              {/* Summary Section */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-blue-100 rounded-xl p-6 flex flex-col items-center shadow-sm">
                  <div className="text-2xl font-bold text-blue-700 mb-1">{queue.length}</div>
                  <div className="text-gray-600">Patients in Queue</div>
                </div>
                <div className="bg-white border border-blue-100 rounded-xl p-6 flex flex-col items-center shadow-sm">
                  <div className="text-2xl font-bold text-blue-700 mb-1">{queue[0]?.patient?.name || '—'}</div>
                  <div className="text-gray-600">Next Patient</div>
                </div>
                <div className="bg-white border border-blue-100 rounded-xl p-6 flex flex-col items-center shadow-sm">
                  <div className="text-2xl font-bold text-blue-700 mb-1">{queue[0]?.queueNumber || '—'}</div>
                  <div className="text-gray-600">Current Queue Number</div>
                </div>
              </div>
              {/* Divider */}
              <div className="border-t border-blue-100 my-8"></div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span>📋</span> Today's Queue
              </h2>
              {queue.length === 0 ? (
                <div className="text-gray-500 text-lg text-center py-8 flex flex-col items-center">
                  <img src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png" alt="No Patients" className="w-16 h-16 mb-4 opacity-60" />
                  <div>No patients in queue for today.</div>
                  <div className="mt-2 text-sm text-blue-500">Tip: Encourage patients to book online for faster service!</div>
                </div>
              ) : (
                <div className="grid gap-6">
                  {queue.map((booking, idx) => (
                    <div key={booking._id} className="bg-white rounded-xl shadow border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between transition hover:shadow-lg">
                      <div className="flex-1">
                        <div className="text-xl font-bold text-blue-700 mb-1 flex items-center gap-2">
                          <span>🧑‍🤝‍🧑</span> {booking.patient?.name || 'Unknown Patient'}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">Email: {booking.patient?.email}</div>
                        <div className="text-sm text-gray-600 mb-1">Phone: {booking.patient?.phone}</div>
                        <div className="flex gap-2 mt-2">
                          <span className={`font-semibold px-2 py-1 rounded ${booking.session === 'MORNING' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'}`}>{booking.session}</span>
                          <span className="font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800">Queue #{booking.queueNumber}</span>
                          <span className={`font-semibold px-2 py-1 rounded ${booking.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' : booking.status === 'COMPLETED' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'}`}>{booking.status}</span>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 text-lg text-gray-800 font-semibold flex items-center gap-2">
                        <span>⏰</span> {new Date(booking.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
