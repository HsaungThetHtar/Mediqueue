import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

// SVG paths for icons (placeholder, update as needed)
const svgPaths = {
  p1a422480: "M24 4C13.0589 4 4 13.0589 4 24C4 34.9411 13.0589 44 24 44C34.9411 44 44 34.9411 44 24C44 13.0589 34.9411 4 24 4Z",
  p67f12c8: "M12 4C6.47715 4 2 8.47715 2 14C2 19.5228 6.47715 24 12 24C17.5228 24 22 19.5228 22 14C22 8.47715 17.5228 4 12 4Z",
  p2c19cb00: "M12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8Z",
  p2dfab7c0: "M12 4C6.47715 4 2 8.47715 2 14C2 19.5228 6.47715 24 12 24C17.5228 24 22 19.5228 22 14C22 8.47715 17.5228 4 12 4Z",
  p2c300c0: "M12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8Z"
};

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      if (res.data && res.data.token) {
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('userType', res.data.userType);
        navigate('/booking');
        }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { email: 'demo@mediqueue.com', password: 'demo1234' });
      if (res.data && res.data.token) {
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('userType', res.data.userType);
        if (res.data.userType === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/booking');
        }
      } else {
        setError('Demo login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-8 px-4"
      style={{ 
        backgroundImage: "linear-gradient(rgb(255, 255, 255) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" 
      }}
    >
      <div className="w-full max-w-[672px]">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#1e88e5] rounded-full w-20 h-20 flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 40 40">
                <path 
                  d={svgPaths.p1a422480} 
                  stroke="white" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="4.16568" 
                />
              </svg>
            </div>
          </div>
          <h1 className="font-bold text-[36px] leading-[40px] text-[#101828] mb-2">
            MediQueue
          </h1>
          <p className="font-normal text-[18px] leading-[28px] text-[#4a5565]">
            Sign In to Your Account
          </p>
        </div>

        {/* Sign In Form Card */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] border border-[#f3f4f6] p-10 mb-6">
          <h2 className="font-semibold text-[20px] leading-[28px] text-[#101828] mb-5">
            Sign In
          </h2>

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={svgPaths.p67f12c8} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d={svgPaths.p2c19cb00} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-10 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={svgPaths.p2dfab7c0} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d={svgPaths.p2c300c0} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-10 pr-12 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4a5565] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                className="font-medium text-[12px] leading-[16px] text-[#1e88e5] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#1e88e5] text-white font-semibold text-[14px] leading-[20px] rounded-[10px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] hover:bg-[#1976d2] transition-colors mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            {/* Already have account link */}
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="text-sm text-[#1e88e5] font-medium hover:underline">Create New Account</Link>
            </div>
          </form>
        </div>

        {/* Demo Account Card */}
        <div className="bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] rounded-2xl shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] border border-[#4CAF50] p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white text-center md:text-left">
              <h3 className="font-semibold text-[20px] leading-[26px] mb-1.5">
                Try Demo Account
              </h3>
              <p className="font-normal text-[15px] leading-[20px] opacity-90">
                Instantly explore MediQueue without creating an account
              </p>
            </div>
            <button
              onClick={handleDemoLogin}
              className="w-full md:w-auto px-7 h-11 bg-white text-[#2E7D32] font-semibold text-[16px] leading-[24px] rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap"
            >
              Continue as Demo
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="font-normal text-[12px] leading-[16px] text-[#99a1af]">
            © 2024 MediQueue. All rights reserved.
          </p>
          <p className="font-normal text-[12px] leading-[16px] text-[#99a1af]">
            For medical emergencies, please call 911 or visit the nearest ER.
          </p>
        </div>
      </div>
    </div>
  );
}