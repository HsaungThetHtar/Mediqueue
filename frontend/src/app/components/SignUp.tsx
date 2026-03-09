import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import svgPaths from '../../imports/svg-c3y431orpb';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

export function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    identificationNumber: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Passwords do not match', text: 'Please make sure both passwords are the same.', confirmButtonColor: '#1E88E5' });

      return;
    }
    try {
      const signUpData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        identificationNumber: formData.identificationNumber || undefined,
        password: formData.password,
      };
      const result = await import('../../api/auth').then(m => m.signUp(signUpData));
      import('../../api/auth').then(m => m.saveSession(result.token, result.user));
      // after signup, go to select date/department to start booking
      navigate('/app/select-date');
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Registration Failed', text: err.message || 'Failed to create account', confirmButtonColor: '#1E88E5' });
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
                  d={svgPaths.p2e1c0dd8} 
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
            Create Your Account
          </p>
        </div>

        {/* Sign Up Form Card */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] border border-[#f3f4f6] p-10 mb-6">
          {/* Back Button */}
          <Link to="/signin">
            <button className="flex items-center gap-2 mb-6 text-[#4a5565] hover:text-[#1e88e5] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-[14px] leading-[20px]">Back to Sign In</span>
            </button>
          </Link>

          <h2 className="font-semibold text-[20px] leading-[28px] text-[#101828] mb-5">
            Create Account
          </h2>

          <form onSubmit={handleCreateAccount} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={svgPaths.p2e952fc0} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d={svgPaths.p2e029080} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full h-12 pl-10 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={svgPaths.p38955500} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d={svgPaths.p3bc71800} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full h-12 pl-10 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={svgPaths.p392e0e40} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type="tel"
                  placeholder="0123456789"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full h-12 pl-10 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Gender
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full h-12 pl-10 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] text-[#364153] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                >
                  <option value="">— Gender —</option>
                  <option value="male">Male (Male)</option>
                  <option value="female">Female (Female)</option>
                  <option value="other">Other (Other)</option>
                </select>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d="M6.66509 1.66627V4.99882" 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d="M13.3302 1.66627V4.99882" 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d={svgPaths.pacb6380} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d="M2.49941 8.33137H17.4959" 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full h-12 pl-10 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Identification Number */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Identification Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={svgPaths.p2e952fc0} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d={svgPaths.p2e029080} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter your identification number"
                  value={formData.identificationNumber}
                  onChange={(e) => handleInputChange('identificationNumber', e.target.value)}
                  className="w-full h-12 pl-10 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={svgPaths.p9853340} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d={svgPaths.p2daa8800} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
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

            {/* Confirm Password */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 20 20">
                    <path 
                      d={svgPaths.p9853340} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                    <path 
                      d={svgPaths.p2daa8800} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="1.66627" 
                    />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full h-12 pl-10 pr-12 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4a5565] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms and Policy */}
            <div className="pt-1">
              <p className="font-normal text-[12px] leading-[16px] text-[#6a7282]">
                By signing up, you agree to our{' '}
                <button type="button" className="font-medium text-[#1e88e5] hover:underline">
                  Terms of Service
                </button>
                {' '}and{' '}
                <button type="button" className="font-medium text-[#1e88e5] hover:underline">
                  Privacy Policy
                </button>
              </p>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full h-12 bg-[#1e88e5] text-white font-semibold text-[14px] leading-[20px] rounded-[10px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] hover:bg-[#1976d2] transition-colors mt-1"
            >
              Create Account
            </button>
          </form>
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