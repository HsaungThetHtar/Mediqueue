import { Search, ChevronDown, User, Settings, LogOut, Menu, RotateCcw } from 'lucide-react';
import { clearSession } from '../../../api/auth';
import { useNavigate, useLocation } from 'react-router';

interface HeaderProps {
    activePage: string;
    userEmail: string;
    userName: string;
    isProfileOpen: boolean;
    setIsProfileOpen: (isOpen: boolean) => void;
    onMenuClick?: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function Header({ activePage, userEmail, userName, isProfileOpen, setIsProfileOpen, onMenuClick, onRefresh, isRefreshing }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = () => {
        setIsProfileOpen(false);
        clearSession();
        navigate('/signin');
    };

    const getPageTitle = (id: string) => {
        if (location.pathname.includes('/admin/bookings/')) return 'Booking Details';
        switch (id) {
            case 'dashboard': return 'Dashboard';
            case 'queue': return 'Queue Management';
            case 'waiting': return 'Waiting List';
            case 'profile': return 'Profile';
            default: return id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 w-full">
            <div className="flex items-center gap-4 min-w-0">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-gray-50 rounded-lg lg:hidden text-gray-500 shrink-0"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 truncate">
                    {getPageTitle(activePage)}
                </h1>
            </div>

            <div className="flex items-center gap-4 md:gap-6 shrink-0">
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        title="Refresh queue"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                    >
                        <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                )}
                <div className="hidden sm:block relative w-[200px] md:w-[240px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 h-10 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-gray-50 text-sm text-gray-600 placeholder:text-gray-400"
                    />
                </div>
                <div className="flex items-center gap-2 border-l border-gray-100 pl-4 md:pl-6">
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 py-1.5 pr-1 transition-all rounded-lg hover:bg-gray-50"
                    >
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-[13px] font-bold text-gray-900 leading-tight">{userName || 'Admin User'}</p>
                            <p className="text-[12px] text-gray-500 font-medium truncate max-w-[180px]">{userEmail}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} aria-hidden="true" />
                            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                <button
                                    onClick={() => { setIsProfileOpen(false); navigate('/admin/profile'); }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <User className="w-4 h-4 text-gray-500" /> Profile
                                </button>
                                <button
                                    onClick={() => { setIsProfileOpen(false); navigate('/admin/settings'); }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-gray-500" /> Settings
                                </button>
                                <div className="h-px bg-gray-100 my-1" />
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
                </div>
            </div>
        </header>
    );
}
