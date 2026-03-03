import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 10);
  });

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userType");
    navigate("/");
  }

  async function fetchData(dateOverride) {
    setLoading(true);
    try {
      // 🔹 Get doctor profile
      const profileRes = await api.get("/doctors/profile");
      setDoctor(profileRes.data);

      // 🔹 Get queue for selected date
      const dateToFetch = dateOverride || selectedDate;
      const queueRes = await api.get(`/doctors/queue?date=${dateToFetch}`);
      setQueue(queueRes.data.bookings || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.msg ||
        "Failed to load dashboard. Please login again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-10">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-blue-700 px-10 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">
            Doctor Dashboard
          </h1>

          <div className="flex gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white text-blue-700 px-4 py-2 rounded-full font-semibold border border-blue-200 mr-2"
              disabled={loading}
              max={new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0,10)}
            />
            <button
              onClick={() => fetchData()}
              className="bg-white text-blue-700 px-4 py-2 rounded-full font-semibold hover:bg-blue-100"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Queue"}
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-blue-700 px-4 py-2 rounded-full font-semibold hover:bg-blue-100"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="px-10 py-8">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-red-600 font-semibold">{error}</p>
          ) : (
            <>
              {/* Doctor Info */}
              {doctor && (
                <div className="mb-8 bg-blue-50 p-6 rounded-xl shadow">
                  <h2 className="text-2xl font-bold text-blue-800">
                    Dr. {doctor.name}
                  </h2>
                  <p className="text-blue-600">
                    Specialization: {doctor.specialization}
                  </p>
                  {doctor.department && (
                    <p className="text-blue-500">
                      Department:{" "}
                      {doctor.department.name || doctor.department}
                    </p>
                  )}
                </div>
              )}

              {/* Queue Summary */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border p-6 rounded-xl shadow text-center">
                  <h3 className="text-2xl font-bold text-blue-700">
                    {queue.length}
                  </h3>
                  <p>Patients in Queue</p>
                </div>

                <div className="bg-white border p-6 rounded-xl shadow text-center">
                  <h3 className="text-2xl font-bold text-blue-700">
                    {queue[0]?.patient?.name || "-"}
                  </h3>
                  <p>Next Patient</p>
                </div>

                <div className="bg-white border p-6 rounded-xl shadow text-center">
                  <h3 className="text-2xl font-bold text-blue-700">
                    {queue[0]?.queueNumber || "-"}
                  </h3>
                  <p>Current Queue</p>
                </div>
              </div>

              {/* Queue List */}
              <h2 className="text-xl font-bold mb-4">
                Today's Queue
              </h2>

              {queue.length === 0 ? (
                <p className="text-gray-500">
                  No patients today.
                </p>
              ) : (
                <div className="space-y-4">
                  {queue.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white border rounded-xl p-6 shadow flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-blue-700">
                          {booking.patient?.name || "Unknown Patient"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.session} | Queue #{booking.queueNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {booking.status}
                        </p>
                      </div>

                      <div className="text-gray-700">
                        {new Date(
                          booking.appointmentDate
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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