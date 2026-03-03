import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../api/axios";

export default function DoctorLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/doctors/login", {
        email,
        password,
      });

      if (res.data && res.data.token) {
        localStorage.setItem("authToken", res.data.token);
        localStorage.setItem("userType", "doctor");

        navigate("/dashboard");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Doctor login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">
            Doctor Portal
          </h1>
          <p className="text-gray-500">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleDoctorLogin} className="space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Doctor Email
            </label>
            <input
              type="email"
              placeholder="Enter doctor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Doctor Sign In"}
          </button>

          {/* Switch to Patient */}
          <div className="text-center mt-4 text-sm">
            <span className="text-gray-600">
              Are you a patient?{" "}
            </span>
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Patient Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}