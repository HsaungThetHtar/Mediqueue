import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function DoctorSignUp() {

  const [departments, setDepartments] = useState([]); // ✅ moved inside

  const [form, setForm] = useState({
    name: "",
    email: "",
    specialization: "",
    departmentId: "",
    qualifications: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ moved inside
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await api.get("/doctors/departments/all");
        setDepartments(res.data);
      } catch (err) {
        setDepartments([]);
      }
    }

    fetchDepartments();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/doctors/register", {
        name: form.name,
        email: form.email,
        specialization: form.specialization,
        departmentId: form.departmentId,
        qualifications: form.qualifications,
        password: form.password,
      });

      setSuccess("Registration successful! You can now log in.");
      setTimeout(() => navigate("/doctor/login"), 1500);

    } catch (err) {
      setError(
        err.response?.data?.msg ||
        "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <form
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-blue-700">
          Doctor Sign Up
        </h2>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}

        <input
          className="w-full mb-3 p-2 border rounded"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          className="w-full mb-3 p-2 border rounded"
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          className="w-full mb-3 p-2 border rounded"
          name="specialization"
          placeholder="Specialization"
          value={form.specialization}
          onChange={handleChange}
          required
        />

        <select
          className="w-full mb-3 p-2 border rounded"
          name="departmentId"
          value={form.departmentId}
          onChange={handleChange}
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>

        <input
          className="w-full mb-3 p-2 border rounded"
          name="qualifications"
          placeholder="Qualifications (comma separated)"
          value={form.qualifications}
          onChange={handleChange}
        />

        <input
          className="w-full mb-3 p-2 border rounded"
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <input
          className="w-full mb-4 p-2 border rounded"
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <button
          className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800"
          type="submit"
          disabled={loading}
        >
          {loading ? "Registering..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}