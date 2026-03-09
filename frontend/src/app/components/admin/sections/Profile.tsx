import { User } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router';

interface ProfileProps {
    userEmail: string;
    userName: string;
}

export function Profile() {
    const { userEmail, userName } = useOutletContext<ProfileProps>();
    const navigate = useNavigate();

    return (
        <div className="px-4 md:px-6 py-8 w-full max-w-[800px] mx-auto">
            <h2 className="text-[24px] font-black text-gray-900 tracking-tight mb-8">Profile</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                        <User className="w-10 h-10" />
                    </div>
                    <div>
                        <p className="text-[18px] font-bold text-gray-900">{userName || 'Admin User'}</p>
                        <p className="text-[14px] text-gray-500 font-medium">{userEmail}</p>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
                        <p className="text-[15px] font-medium text-gray-900">{userName || 'Admin User'}</p>
                    </div>
                    <div>
                        <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                        <p className="text-[15px] font-medium text-gray-900">{userEmail}</p>
                    </div>
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/settings')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[14px] transition-colors"
                        >
                            Account Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
