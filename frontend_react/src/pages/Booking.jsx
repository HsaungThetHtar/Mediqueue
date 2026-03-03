import { useEffect, useState } from "react";
import api from "../api/axios";
import { data} from "react-router";
import { useNavigate } from "react-router-dom";

export default function SimpleBooking() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [session, setSession] = useState("MORNING");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const res = await api.get("/patients/departments");
    setDepartments(res.data);
  };

  const fetchDoctors = async (deptId) => {
    setDoctorLoading(true);
    setDoctorError("");
    if (!deptId) {
      setDoctors([]);
      setDoctorLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const res = await api.get(`/patients/departments/${deptId}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(res.data);
      if (res.data.length === 0) {
        setDoctorError("No doctors available in this department.");
      }
    } catch (err) {
      setDoctors([]);
      setDoctorError("Failed to load doctors. Please try again.");
    } finally {
      setDoctorLoading(false);
    }
  };

  const handleDepartmentChange = async (e) => {
    const id = e.target.value;
    setDepartmentId(id);
    setDoctorId("");
    fetchDoctors(id);
  };

  const handleBooking = async () => {
  if (!departmentId || !doctorId || !date || !session) {
    setMessage("Please fill all fields");
    return;
  }

  try {
    const res = await api.post("/patients/book-queue", {
      departmentId,
      doctorId,
      appointmentDate: date,
      session
    });

    navigate("/confirmation", { state: res.data });

  } catch (err) {
    setMessage(err.response?.data?.msg || "Booking failed");
  }
};

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-10">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">
        Book Appointment
      </h2>

      {/* Department */}
      <select
        value={departmentId}
        onChange={handleDepartmentChange}
        className="w-full mb-4 p-3 border rounded-lg"
      >
        <option value="">Select Department</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>

      {/* Doctor */}
      <select
        value={doctorId}
        onChange={(e) => setDoctorId(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg"
        disabled={!departmentId || doctorLoading}
      >
        <option value="">{doctorLoading ? "Loading..." : "Select Doctor"}</option>
        {doctors.map((doc) => (
          <option key={doc._id} value={doc._id}>
            {doc.name} {doc.specialization ? `(${doc.specialization})` : ""}
          </option>
        ))}
      </select>
      {doctorError && (
        <div className="mb-4 text-red-600 text-center font-medium">{doctorError}</div>
      )}

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg"
      />

      {/* Session */}
      <select
        value={session}
        onChange={(e) => setSession(e.target.value)}
        className="w-full mb-6 p-3 border rounded-lg"
      >
        <option value="MORNING">Morning</option>
        <option value="AFTERNOON">Afternoon</option>
      </select>

      {/* Button */}
      <button
        onClick={handleBooking}
        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
      >
        Confirm Booking
      </button>

      {message && (
        <div className="mt-4 text-center font-medium text-green-600">
          {message}
        </div>
      )}
    </div>
  );
}