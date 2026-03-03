import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";


export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    try{
        setLoading(true);
        await api.put(`/patients/booking/${booking._id}/cancel`);
        alert("Booking cancelled successfully");
        navigate("/");

    } catch(err) {
        alert(err.response?.data?.msg || "Cancellation failed");
    }
  }

  if (!booking) {
    return (
      <div className="text-center mt-20 text-gray-600">
        No booking data
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Success Banner */}
        <div className="bg-green-600 text-white p-5 rounded-xl mb-6">
          <h2 className="text-lg font-semibold">Booking Successful!</h2>
          <p className="text-sm opacity-90">
            Your queue booking has been confirmed. Please arrive before your estimated service time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Left Card */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-blue-600 text-white p-6 text-center">
              <h3 className="text-lg font-semibold">
                {booking.hospital || "Hospital"}
              </h3>
              <p className="text-sm opacity-80">Digital Queue Slip</p>
            </div>

            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">Your Queue Number</p>
              <h1 className="text-5xl font-bold text-blue-600">
                Q-{booking.queueNumber}
              </h1>
              <p className="text-xs text-gray-400 mt-2">
                Please keep this number for reference
              </p>
            </div>

            <div className="p-6 border-t space-y-2 text-sm">

              <p>
                <strong>Department:</strong>{" "}
                {booking.department?.name || booking.department}
              </p>

              <p>
                <strong>Doctor:</strong>{" "}
                {booking.doctor?.name || booking.doctor}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {booking.appointmentDate
                  ? new Date(booking.appointmentDate).toDateString()
                  : booking.date}
              </p>

              {booking.session && (
                <p>
                  <strong>Session:</strong> {booking.session}
                </p>
              )}

            </div>
          </div>

          {/* Right Card */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Live Queue Status</h3>

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Now Serving</p>
              <h2 className="text-2xl font-bold text-blue-600">
                {booking.currentlyServing || "Q-1"}
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Estimated Waiting Time
              </p>
              <p className="text-xl font-semibold">
                {booking.estimatedWaitingTime || 30} minutes
              </p>
            </div>

            <div className="bg-yellow-100 text-yellow-800 text-sm p-3 rounded mb-4">
              Please arrive at least 15 minutes before your estimated service time.
            </div>

            <button
  onClick={() => setShowCancelModal(true)}
  className="w-full bg-red-600 text-white py-3 rounded-lg mb-3 hover:bg-red-700"
>
  Cancel Booking
</button>

            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-200 py-3 rounded-lg"
            >
              Back to Home
            </button>

          </div>

        </div>
      </div>

      {showCancelModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-80">
      <h3 className="text-lg font-semibold mb-3">
        Cancel Booking?
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to cancel this booking? This action cannot be undone.
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowCancelModal(false)}
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          No
        </button>

        <button
          onClick={() => {
            // 👉 Call your cancel API here
            console.log("Booking cancelled");

            setShowCancelModal(false);
            navigate("/booking");
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Yes, Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}