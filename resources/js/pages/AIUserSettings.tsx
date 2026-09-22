import { Head, usePage, router } from '@inertiajs/react';
import type { SharedData } from '@/types';
import { useState, useRef } from 'react';
import DraggableMenu from '@/components/DraggableMenu';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface Props {
    settings: {
        id: number;
        user_id: number;
        guest_ai_enabled: boolean;
        created_at: string | null;
        updated_at: string | null;
    };
    user: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
        created_at: string;
    };
}

type TabType = 'profile' | 'password' | 'settings';

export default function AIUserSettings({ settings, user }: Props) {
    const { auth, tooltips = {} } = usePage<SharedData & { 
        tooltips?: Record<string, string>;
    }>().props;
    
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [guestAiEnabled, setGuestAiEnabled] = useState(settings.guest_ai_enabled);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: user.name,
        email: user.email,
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const handleNewSearch = () => {
        router.visit('/');
    };

    const openComingSoonModal = (feature: string, description: string, iconColor: string, icon: JSX.Element) => {
        alert(`${feature} is coming soon!`);
    };

    // Profile handlers
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileForm({
            ...profileForm,
            [e.target.name]: e.target.value
        });
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
        if (!allowedTypes.includes(file.type)) {
            setSaveMessage({
                type: 'error',
                text: 'Please upload a valid image file (JPEG, PNG, GIF, WEBP, or BMP)'
            });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }
        
        if (file.size > 100 * 1024 * 1024) {
            setSaveMessage({
                type: 'error',
                text: 'Image size must be less than 100MB'
            });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Upload the file
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('name', profileForm.name);
        formData.append('email', profileForm.email);
        
        setIsUploadingAvatar(true);
        setSaveMessage(null);
        
        try {
            const response = await fetch('/ai/user-settings/update-profile', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.user?.avatar) {
                    setAvatarPreview(data.user.avatar);
                }
                setSaveMessage({
                    type: 'success',
                    text: 'Profile updated successfully'
                });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({
                    type: 'error',
                    text: data.message || 'Failed to update avatar'
                });
                setTimeout(() => setSaveMessage(null), 3000);
                // Revert preview
                setAvatarPreview(user.avatar || null);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setSaveMessage({
                type: 'error',
                text: 'An error occurred. Please try again.'
            });
            setTimeout(() => setSaveMessage(null), 3000);
            // Revert preview
            setAvatarPreview(user.avatar || null);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Are you sure you want to remove your avatar?')) return;
        
        setIsUploadingAvatar(true);
        
        try {
            const response = await fetch('/ai/user-settings/remove-avatar', {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            const data = await response.json();
            
            if (data.success) {
                setAvatarPreview(null);
                setSaveMessage({
                    type: 'success',
                    text: 'Avatar removed successfully'
                });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({
                    type: 'error',
                    text: data.message || 'Failed to remove avatar'
                });
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error removing avatar:', error);
            setSaveMessage({
                type: 'error',
                text: 'An error occurred. Please try again.'
            });
            setTimeout(() => setSaveMessage(null), 3000);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage(null);
        
        try {
            const formData = new FormData();
            formData.append('name', profileForm.name);
            formData.append('email', profileForm.email);
            
            const response = await fetch('/ai/user-settings/update-profile', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSaveMessage({
                    type: 'success',
                    text: data.message || 'Profile updated successfully'
                });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({
                    type: 'error',
                    text: data.message || 'Failed to update profile'
                });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setSaveMessage({
                type: 'error',
                text: 'An error occurred. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Password handlers
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordForm({
            ...passwordForm,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
            setSaveMessage({
                type: 'error',
                text: 'New passwords do not match'
            });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }
        
        if (passwordForm.new_password.length < 8) {
            setSaveMessage({
                type: 'error',
                text: 'New password must be at least 8 characters'
            });
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }
        
        setIsSaving(true);
        setSaveMessage(null);
        
        try {
            const response = await fetch('/ai/user-settings/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(passwordForm),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSaveMessage({
                    type: 'success',
                    text: data.message || 'Password updated successfully'
                });
                setPasswordForm({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: '',
                });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({
                    type: 'error',
                    text: data.message || 'Failed to update password'
                });
            }
        } catch (error) {
            console.error('Error updating password:', error);
            setSaveMessage({
                type: 'error',
                text: 'An error occurred. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Settings handlers
    const handleToggleGuestAI = async () => {
        const newValue = !guestAiEnabled;
        
        setIsSaving(true);
        setSaveMessage(null);
        
        try {
            const response = await fetch('/ai/user-settings/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    guest_ai_enabled: newValue
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setGuestAiEnabled(newValue);
                setSaveMessage({
                    type: 'success',
                    text: data.message || 'Settings updated successfully'
                });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({
                    type: 'error',
                    text: data.message || 'Failed to update settings'
                });
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            setSaveMessage({
                type: 'error',
                text: 'An error occurred. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'profile' as TabType, label: 'Profile', icon: '👤' },
        { id: 'password' as TabType, label: 'Change Password', icon: '🔒' },
        { id: 'settings' as TabType, label: 'Settings', icon: '⚙️' },
    ];

    return (
        <>
            <Head title="Account Settings" />
            
            <Tooltip 
                id="main-tooltip"
                place="top"
                className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[100] !shadow-xl"
                effect="solid"
            />
            <DraggableMenu auth={auth} />
            <div className="flex min-h-screen flex-col bg-[#FCFCFC] text-slate-800">
                <div className="flex-1 w-full flex">
                    
                    {/* Main Content */}
                    <main className="flex-1 min-h-screen overflow-y-auto">
                        <div className="flex flex-col px-4 pt-1 pb-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
                            <p className="text-gray-600 mb-8">Manage your account preferences and security</p>
                            
                            {/* Tabs */}
                            <div className="border-b border-gray-200 mb-6">
                                <nav className="-mb-px flex space-x-8">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                                ${activeTab === tab.id
                                                    ? 'border-[#22c55e] text-[#22c55e]'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            <span className="mr-2">{tab.icon}</span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            
                            {/* Tab Content */}
                            <div className="mt-6">
                                {/* Profile Tab */}
                                {activeTab === 'profile' && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                                            <p className="text-sm text-gray-500 mt-1">Update your account information and avatar</p>
                                        </div>
                                        
                                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                                            {/* Avatar Section */}
											<div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
													{/* Avatar Image */}
													<div className="relative flex-shrink-0">
														{avatarPreview ? (
															<img
																src={avatarPreview}
																alt="Avatar"
																className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
																onError={() => setAvatarPreview(null)}
															/>
														) : (
															<div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white text-3xl font-semibold">
																{user.name.charAt(0).toUpperCase()}
															</div>
														)}
														{isUploadingAvatar && (
															<div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
																<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
															</div>
														)}
													</div>
													
													{/* Controls */}
													<div className="flex flex-col items-center sm:items-start space-y-3">
														<div className="flex flex-wrap justify-center sm:justify-start gap-2">
															<button
																type="button"
																onClick={() => fileInputRef.current?.click()}
																className="px-4 py-2 text-sm font-medium text-white bg-[#22c55e] rounded-lg hover:bg-[#16a34a] transition-colors whitespace-nowrap"
															>
																Change Avatar
															</button>
															{avatarPreview && (
																<button
																	type="button"
																	onClick={handleRemoveAvatar}
																	className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
																>
																	Remove
																</button>
															)}
														</div>
														<p className="text-xs text-gray-500 text-center sm:text-left max-w-[200px] sm:max-w-none">
															JPG, GIF, PNG, WEBP, or BMP. Max size 100MB.
														</p>
													</div>

													<input
														ref={fileInputRef}
														type="file"
														accept="image/jpeg,image/png,image/jpg,image/gif,image/webp,image/bmp"
														onChange={handleAvatarChange}
														className="hidden"
													/>
												</div>
                                            
                                            {/* Name Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={profileForm.name}
                                                    onChange={handleProfileChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            
                                            {/* Email Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={profileForm.email}
                                                    onChange={handleProfileChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            
                                            {/* Member Since */}
                                            <div className="pt-4 border-t border-gray-200">
                                                <p className="text-sm text-gray-500">
                                                    Member since: {new Date(user.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            
                                            {saveMessage && saveMessage.type !== 'error' && (
                                                <div className={`p-3 rounded-lg text-sm ${
                                                    saveMessage.type === 'success' 
                                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                    {saveMessage.text}
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="px-6 py-2 bg-[#22c55e] text-white font-medium rounded-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                                
                                {/* Change Password Tab */}
                                {activeTab === 'password' && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                                            <p className="text-sm text-gray-500 mt-1">Update your password to keep your account secure</p>
                                        </div>
                                        
                                        <form onSubmit={handleUpdatePassword} className="p-6 space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    name="current_password"
                                                    value={passwordForm.current_password}
                                                    onChange={handlePasswordChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    name="new_password"
                                                    value={passwordForm.new_password}
                                                    onChange={handlePasswordChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                                                    required
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    name="new_password_confirmation"
                                                    value={passwordForm.new_password_confirmation}
                                                    onChange={handlePasswordChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            
                                            {saveMessage && (
                                                <div className={`p-3 rounded-lg text-sm ${
                                                    saveMessage.type === 'success' 
                                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                    {saveMessage.text}
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="px-6 py-2 bg-[#22c55e] text-white font-medium rounded-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSaving ? 'Updating...' : 'Update Password'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                                
                                {/* Settings Tab */}
                                {activeTab === 'settings' && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                            <h2 className="text-lg font-semibold text-gray-900">AI Settings</h2>
                                            <p className="text-sm text-gray-500 mt-1">Manage your AI preferences and permissions</p>
                                        </div>
                                        
                                        <div className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-base font-medium text-gray-900">
                                                        Allow guest users to use AI
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        When enabled, non-logged-in users can access AI features. 
                                                        When disabled, only authenticated users can use AI.
                                                    </p>
                                                </div>
                                                
                                                <div className="ml-4">
                                                    <button
                                                        onClick={handleToggleGuestAI}
                                                        disabled={isSaving}
                                                        className={`
                                                            relative inline-flex h-6 w-11 items-center rounded-full 
                                                            transition-colors focus:outline-none focus:ring-2 
                                                            focus:ring-[#22c55e] focus:ring-offset-2
                                                            ${guestAiEnabled ? 'bg-[#22c55e]' : 'bg-gray-300'}
                                                            ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                        `}
                                                        role="switch"
                                                        aria-checked={guestAiEnabled}
                                                    >
                                                        <span
                                                            className={`
                                                                inline-block h-4 w-4 transform rounded-full 
                                                                bg-white shadow-lg transition-transform
                                                                ${guestAiEnabled ? 'translate-x-6' : 'translate-x-1'}
                                                            `}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 flex items-center">
                                                <div className={`w-2 h-2 rounded-full ${guestAiEnabled ? 'bg-[#22c55e]' : 'bg-gray-400'} mr-2`} />
                                                <span className="text-sm text-gray-600">
                                                    Guest AI is currently <span className="font-semibold">{guestAiEnabled ? 'enabled' : 'disabled'}</span>
                                                </span>
                                            </div>
                                            
                                            {saveMessage && (
                                                <div className={`mt-4 p-3 rounded-lg text-sm ${
                                                    saveMessage.type === 'success' 
                                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                    {saveMessage.text}
                                                </div>
                                            )}
                                            
                                            {isSaving && (
                                                <div className="mt-4 flex items-center text-sm text-gray-500">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#22c55e] mr-2"></div>
                                                    Saving...
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                            <div className="flex">
                                                <svg className="h-5 w-5 text-blue-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <p className="ml-3 text-sm text-blue-700">
                                                    <span className="font-medium">Note:</span> More AI settings will be added here in the future.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}