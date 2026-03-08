import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import svgPaths from '../../imports/svg-hiih1kv4yo';
import { Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

export function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await import('../../api/auth').then(m => m.signIn(emailOrPhone, password));
      // save token and user
      import('../../api/auth').then(m => m.saveSession(result.token, result.user));
      // navigate based on role
      switch (result.user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'doctor':
          navigate('/doctor');
          break;
        default:
          navigate('/app/select-date');
          break;
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Sign In Failed', text: err.message || 'Failed to sign in', confirmButtonColor: '#1E88E5' });
    }
  };

  const handleDemoLogin = () => {
    // Fill in demo credentials instead of auto-login
    setEmailOrPhone('admin@mediqueue.com');
    setPassword('password123');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-8 px-4"
      style={{ 
        backgroundImage: "linear-gradient(rgb(255, 255, 255) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" 
      }}
    >
      <div className="w-full max-w-[620px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="bg-[#1e88e5] rounded-full w-20 h-20 flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 48 48">
                <path 
                  d={svgPaths.p1a422480} 
                  stroke="white" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="5" 
                />
              </svg>
            </div>
          </div>
          <h1 className="font-bold text-[42px] leading-[46px] text-[#101828] mb-2.5">
            MediQueue
          </h1>
          <p className="font-normal text-[19px] leading-[27px] text-[#4a5565]">
            Digital Queue Management System
          </p>
        </div>

        {/* Sign In Form Card */}
        <div className="bg-white rounded-2xl shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] border border-[#f3f4f6] p-11 mb-8">
          <h2 className="font-semibold text-[30px] leading-[36px] text-[#101828] mb-8">
            Sign In
          </h2>

          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email or Phone Field */}
            <div>
              <label className="block font-medium text-[17px] leading-[24px] text-[#364153] mb-2">
                Email or Phone
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
                    <path 
                      d={svgPaths.p67f12c8} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                    />
                    <path 
                      d={svgPaths.p2c19cb00} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter your email or phone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full h-12 pl-12 pr-3 bg-[#f3f3f5] border border-[#d1d5dc] rounded-xl text-[16px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-medium text-[17px] leading-[24px] text-[#364153] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
                    <path 
                      d={svgPaths.p2dfab7c0} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                    />
                    <path 
                      d={svgPaths.p2c300c0} 
                      stroke="#99A1AF" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-12 bg-[#f3f3f5] border border-[#d1d5dc] rounded-xl text-[16px] placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#1e88e5] focus:border-transparent"
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

            {/* Forgot Password */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                className="font-medium text-[16px] leading-[22px] text-[#1e88e5] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full h-12 bg-[#1e88e5] text-white font-semibold text-[18px] leading-[24px] rounded-xl shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] hover:bg-[#1976d2] transition-colors"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7 border-t border-[#e5e7eb]">
            <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 font-normal text-[16px] leading-[22px] text-[#4a5565]">
              Don't have an account?
            </p>
          </div>

          {/* Create Account Button */}
          <Link to="/signup">
            <button className="w-full h-12 bg-white text-[#1e88e5] font-semibold text-[18px] leading-[24px] rounded-xl border-2 border-[#1e88e5] hover:bg-[#e3f2fd] transition-colors">
              Create New Account
            </button>
          </Link>
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
        <div className="text-center">
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