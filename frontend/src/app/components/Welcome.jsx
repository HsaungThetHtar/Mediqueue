import { useNavigate } from 'react-router-dom';
import svgPaths from '../../imports/svg-c3y431orpb';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-8">
        {/* Hero Illustration */}
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
        <h1 className="font-extrabold text-4xl text-blue-700 mb-2 text-center drop-shadow-lg">Welcome to MediQueue</h1>
        <p className="text-lg text-gray-700 text-center mb-4 max-w-md">Book your medical queue online and get notified when it’s your turn. Fast, easy, and stress-free.</p>
        <button
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold text-xl rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
          onClick={() => navigate('/signup')}
        >
          Get Started
        </button>
        <div className="mt-2 text-center">
          <span className="text-gray-600">Already have an account? </span>
          <button className="text-blue-600 font-semibold hover:underline" onClick={() => navigate('/signin')}>Sign In</button>
        </div>
      </div>
    </div>
  );
}
