import { LayoutDashboard, Activity, List, BookOpen, CheckSquare, Zap, Settings, HelpCircle, X } from 'lucide-react';

interface SidebarProps {
    activePage: string;
    setActivePage: (page: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ activePage, setActivePage, isOpen, onClose }: SidebarProps) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'queue', label: 'Queue', icon: Activity },
        { id: 'waiting', label: 'Waiting List', icon: List },
        { id: 'bookings', label: 'Bookings', icon: BookOpen },
        { id: 'checkins', label: 'Check-ins', icon: CheckSquare },
        { id: 'completed', label: 'Completed', icon: Zap },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className={`
            fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
                    <div>
                        <div className="font-bold text-gray-900 leading-tight">MediQueue</div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Admin Portal</div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-50 rounded-lg lg:hidden text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="p-4 space-y-2">
                {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="absolute bottom-6 left-6 right-6 border-t border-gray-200 pt-6">
                <div className="text-xs text-gray-600 mb-4 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Need help?
                </div>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Contact Support</button>
            </div>
        </aside>
    );
}
