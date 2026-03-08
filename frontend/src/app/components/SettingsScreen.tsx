import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User, Lock, Bell, Camera, Save, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getProfile, updateProfile, changePassword, UserProfile } from '../../api/user';
import Swal from 'sweetalert2';

type SettingsTab = 'profile' | 'security' | 'notifications';

export function SettingsScreen() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    // Profile Form State
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [idNumber, setIdNumber] = useState('');

    // Password Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await getProfile();
                setProfile(data);
                setFullName(data.fullName);
                setPhone(data.phone || '');
                setDob(data.dateOfBirth || '');
                setIdNumber(data.identificationNumber || '');
            } catch (err) {
                console.error('Failed to load profile', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load profile data',
                });
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile({
                fullName,
                phone,
                dateOfBirth: dob,
                identificationNumber: idNumber,
            });
            Swal.fire({
                icon: 'success',
                title: 'Profile Updated',
                text: 'Your profile information has been saved successfully.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.message || 'Something went wrong',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'New passwords do not match' });
            return;
        }
        setSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            Swal.fire({
                icon: 'success',
                title: 'Password Changed',
                text: 'Your password has been updated.',
                timer: 2000,
                showConfirmButton: false,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: err.message || 'Incorrect current password',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="md:col-span-1 space-y-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'profile'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            <User className="w-5 h-5" />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'security'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            <Lock className="w-5 h-5" />
                            Security
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'notifications'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            <Bell className="w-5 h-5" />
                            Notifications
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {activeTab === 'profile' && (
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="relative">
                                            <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                                                <User className="w-12 h-12 text-blue-600" />
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md border border-gray-100 text-blue-600 hover:bg-blue-50 transition-colors">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{profile?.fullName}</h2>
                                            <p className="text-gray-500">{profile?.email}</p>
                                            <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                                {profile?.role}
                                            </span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                    placeholder="+66 81 234 5678"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={dob}
                                                    onChange={(e) => setDob(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700">Identification Number</label>
                                                <input
                                                    type="text"
                                                    value={idNumber}
                                                    onChange={(e) => setIdNumber(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                    placeholder="1-2345-67890-12-3"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:bg-gray-400 disabled:shadow-none shadow-lg shadow-blue-200"
                                            >
                                                {saving ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Save className="w-5 h-5" />
                                                )}
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="p-6 md:p-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Change Password</h3>
                                    <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:bg-gray-400 shadow-lg shadow-blue-200"
                                            >
                                                {saving ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Lock className="w-5 h-5" />
                                                )}
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="p-6 md:p-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-900">Email Notifications</p>
                                                <p className="text-sm text-gray-500">Receive booking confirmations via email</p>
                                            </div>
                                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                                <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-900">Push Notifications</p>
                                                <p className="text-sm text-gray-500">Real-time queue alerts on your device</p>
                                            </div>
                                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                                <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-900">SMS Alerts</p>
                                                <p className="text-sm text-gray-500">Urgent reminders and queue calls</p>
                                            </div>
                                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                                                <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white transition" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Helpful Tips */}
                        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-blue-900">Safe & Secure</h4>
                                    <p className="text-sm text-blue-800 mt-1">
                                        Your personal information is encrypted and protected. We never share your data with 3rd parties without your explicit consent.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
