
import { useState, useEffect } from 'react';
import { doctorApi } from '../../services/api';
import { Link, useNavigate } from 'react-router';
import svgPaths from '../../imports/svg-c3y431orpb';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';


export function DoctorSignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    departmentId: '',
    qualifications: '',
    password: '',
    confirmPassword: ''
  });
  const [departments, setDepartments] = useState<{_id: string, name: string}[]>([]);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await doctorApi.getAllDepartments();
        setDepartments(res);
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchDepartments();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!formData.name || !formData.email || !formData.specialization || !formData.departmentId || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const response = await doctorApi.register(
        formData.name,
        formData.email,
        formData.specialization,
        formData.departmentId,
        formData.qualifications,
        formData.password
      );
      if (response._id) {
        navigate('/doctor/signin');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            Doctor Registration
          </p>
        </div>

        {/* Sign Up Form Card */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] border border-[#f3f4f6] p-10 mb-6">
          {/* Back Button */}
          <Link to="/doctor/signin">
            <button className="flex items-center gap-2 mb-6 text-[#4a5565] hover:text-[#1e88e5] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-[14px] leading-[20px]">Back to Sign In</span>
            </button>
          </Link>

          <h2 className="font-semibold text-[20px] leading-[28px] text-[#101828] mb-5">
            Create Doctor Account
          </h2>

          <form onSubmit={handleCreateAccount} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Name
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
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
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

            {/* Specialization */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Specialization
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Cardiologist"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  className="w-full h-12 pl-4 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Department Dropdown */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Department
              </label>
              <div className="relative">
                <select
                  value={formData.departmentId}
                  onChange={e => handleInputChange('departmentId', e.target.value)}
                  className="w-full h-12 pl-4 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dep => (
                    <option key={dep._id} value={dep._id}>{dep.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Qualifications
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. MBBS, MD"
                  value={formData.qualifications}
                  onChange={(e) => handleInputChange('qualifications', e.target.value)}
                  className="w-full h-12 pl-4 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-medium text-[14px] leading-[14px] text-[#364153] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full h-12 pl-4 pr-12 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4a5565] transition-colors"
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
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full h-12 pl-4 pr-12 bg-[#f3f3f5] border border-[#d1d5dc] rounded-[10px] text-[14px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4a5565] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#1e88e5] text-white font-semibold text-[18px] leading-[24px] rounded-xl shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] hover:bg-[#1976d2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7 border-t border-[#e5e7eb]">
            <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 font-normal text-[16px] leading-[22px] text-[#4a5565]">
              Or
            </p>
          </div>

          {/* Sign In Button */}
          <Link to="/doctor/signin">
            <button className="w-full h-12 bg-white text-[#1e88e5] font-semibold text-[18px] leading-[24px] rounded-xl border-2 border-[#1e88e5] hover:bg-[#e3f2fd] transition-colors">
              Sign In
            </button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="font-normal text-[16px] leading-[22px] text-[#6a7282]">
            Need help?{' '}
            <button className="font-medium text-[#1e88e5] hover:underline">
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
