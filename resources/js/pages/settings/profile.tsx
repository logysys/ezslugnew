import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faEnvelope,
    faSave,
    faCheckCircle,
    faInfoCircle,
    faTimes,
    faRobot,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import DeleteUser from '@/components/delete-user';
import SettingsLayout from '@/layouts/settings/layout';
import DraggableMenu from '@/components/DraggableMenu';
import '@google/model-viewer';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    name: string;
    email: string;
}

interface AIUserSetting {
    id: number;
    user_id: number;
    guest_ai_enabled: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth, template, aiSettings } = usePage<SharedData & { 
        aiSettings?: AIUserSetting;
    }>().props;
    const [isPanelVisible, setIsPanelVisible] = useState(true);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<Required<ProfileForm>>({
        name: auth.user.name,
        email: auth.user.email,
    });

    const [htmlUrl, setHtmlUrl] = useState('');
    
    // Avatar state
    const [avatarPreview, setAvatarPreview] = useState<string | null>(auth.user.avatar || null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // AI Settings state
    const [guestAiEnabled, setGuestAiEnabled] = useState(aiSettings?.guest_ai_enabled ?? false);
    const [isSavingAiSettings, setIsSavingAiSettings] = useState(false);
    const [aiSettingsMessage, setAiSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    // Avatar handlers
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
        if (!allowedTypes.includes(file.type)) {
            setAvatarMessage({
                type: 'error',
                text: 'Please upload a valid image file (JPEG, PNG, GIF, WEBP, or BMP)'
            });
            setTimeout(() => setAvatarMessage(null), 3000);
            return;
        }
        
        // Validate file size
        if (file.size > 100 * 1024 * 1024) {
            setAvatarMessage({
                type: 'error',
                text: 'Image size must be less than 100MB'
            });
            setTimeout(() => setAvatarMessage(null), 3000);
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
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');
        
        setIsUploadingAvatar(true);
        setAvatarMessage(null);
        
        try {
            const response = await fetch('/ai/user-settings/update-profile', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: formData,
            });
            
            // Check if response is ok
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`Server error: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            if (responseData.success) {
                if (responseData.user?.avatar) {
                    setAvatarPreview(responseData.user.avatar);
                    setAvatarMessage({
                        type: 'success',
                        text: 'Avatar updated successfully'
                    });
                    setTimeout(() => setAvatarMessage(null), 3000);
                    // Refresh page after a delay to update all instances
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } else {
                setAvatarMessage({
                    type: 'error',
                    text: responseData.message || 'Failed to update avatar'
                });
                setTimeout(() => setAvatarMessage(null), 3000);
                // Revert preview
                setAvatarPreview(auth.user.avatar || null);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setAvatarMessage({
                type: 'error',
                text: 'An error occurred. Please try again.'
            });
            setTimeout(() => setAvatarMessage(null), 3000);
            // Revert preview
            setAvatarPreview(auth.user.avatar || null);
        } finally {
            setIsUploadingAvatar(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
                    'Accept': 'application/json',
                },
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`Server error: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            if (responseData.success) {
                setAvatarPreview(null);
                setAvatarMessage({
                    type: 'success',
                    text: 'Avatar removed successfully'
                });
                setTimeout(() => setAvatarMessage(null), 3000);
                // Refresh page after a delay to update all instances
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setAvatarMessage({
                    type: 'error',
                    text: responseData.message || 'Failed to remove avatar'
                });
                setTimeout(() => setAvatarMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error removing avatar:', error);
            setAvatarMessage({
                type: 'error',
                text: 'An error occurred. Please try again.'
            });
            setTimeout(() => setAvatarMessage(null), 3000);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // AI Settings handler
    const handleToggleGuestAI = async () => {
        const newValue = !guestAiEnabled;
        
        setIsSavingAiSettings(true);
        setAiSettingsMessage(null);
        
        try {
            const response = await fetch('/ai/user-settings/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    guest_ai_enabled: newValue
                }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setGuestAiEnabled(newValue);
                setAiSettingsMessage({
                    type: 'success',
                    text: data.message || 'AI settings updated successfully'
                });
                setTimeout(() => setAiSettingsMessage(null), 3000);
            } else {
                setAiSettingsMessage({
                    type: 'error',
                    text: data.message || 'Failed to update AI settings'
                });
            }
        } catch (error) {
            console.error('Error updating AI settings:', error);
            setAiSettingsMessage({
                type: 'error',
                text: 'An error occurred. Please try again.'
            });
        } finally {
            setIsSavingAiSettings(false);
        }
    };

    const isValidUrl = useCallback((url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }, []);

    const getImageExtension = useCallback((url: string) => {
        if (!url) return '';
        const cleanUrl = url.split('?')[0];
        return cleanUrl.split('.').pop()?.toLowerCase() || '';
    }, []);

    const isImageExtension = useCallback((extension?: string) => {
        if (!extension) return false;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        return imageExtensions.includes(extension);
    }, []);

    const blurStyle = useMemo(() => {
        if (template?.image && isImageExtension(getImageExtension(template.image))) {
            return (
                <style>{`
                    .blur-bg {
                        background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                        background-size: cover;
                    }
                `}</style>
            );
        }
        return null;
    }, [template, getImageExtension, isImageExtension]);

    useEffect(() => {
        if (template?.image) {
            const isHtmlContent = /<[a-z][\s\S]*>/i.test(template.image);
            if (isHtmlContent && !isValidUrl(template.image)) {
                const htmlBlob = new Blob([template.image], { type: 'text/html' });
                const url = URL.createObjectURL(htmlBlob);
                setHtmlUrl(url);

                return () => {
                    URL.revokeObjectURL(url);
                };
            }
        }
    }, [template, isValidUrl]);

    useEffect(() => {
        if (template?.image && (template.image.includes('facebook.com') || template.image.includes('fb.watch'))) {
            const script = document.createElement('script');
            script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            document.body.appendChild(script);

            return () => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            };
        }
    }, [template]);

    return (
        <>
            <Head>
                <title>Profile Settings</title>
                {blurStyle}
            </Head>
            <Tooltip id="profile-tooltip" />
            <style>{`
                .react-tooltip {
                    z-index: 99999 !important;
                    opacity: 1 !important;
                    font-size: 12px;
                    padding: 4px 8px;
                }
            `}</style>
            <DraggableMenu auth={auth} />
            <main className="relative flex justify-center items-center p-4 min-h-screen overflow-hidden">
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-h-[90vh]">
                        <SettingsLayout>
                            <div className="relative">
                                <div className="bg-gray-800/80 border-gray-700 rounded-lg p-6 space-y-6 backdrop-blur-sm">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-white" data-tooltip-id="profile-tooltip" data-tooltip-content="Update your personal details here.">
                                            <FontAwesomeIcon icon={faUser} className="mr-2" />
                                            Profile Information
                                        </h2>
                                    </div>

                                    {recentlySuccessful && (
                                        <div className="p-4 bg-green-600/20 border border-green-400 text-green-100 rounded-lg">
                                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                            Profile updated successfully!
                                        </div>
                                    )}

                                    <form onSubmit={submit} className="space-y-6">
                                        {/* Avatar Section */}
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                            {/* Avatar Image */}
                                            <div className="relative flex-shrink-0">
                                                {avatarPreview ? (
                                                    <img
                                                        src={avatarPreview.startsWith('http') || avatarPreview.startsWith('/storage') 
                                                            ? avatarPreview 
                                                            : avatarPreview.startsWith('/avatar') 
                                                                ? avatarPreview 
                                                                : `/storage/avatar/${avatarPreview.split('/').pop()}`}
                                                        alt="Avatar"
                                                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                                        onError={(e) => {
                                                            console.error('Avatar image failed to load:', avatarPreview);
                                                            setAvatarPreview(null);
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-3xl font-semibold">
                                                        {auth.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                {isUploadingAvatar && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                                        <FontAwesomeIcon icon={faSpinner} className="text-white text-2xl animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Controls */}
                                            <div className="flex flex-col items-center sm:items-start space-y-3">
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="px-4 py-2 text-sm font-medium text-black bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors whitespace-nowrap"
                                                        data-tooltip-id="profile-tooltip"
                                                        data-tooltip-content="Upload a new profile picture"
                                                        disabled={isUploadingAvatar}
                                                    >
                                                        Change Avatar
                                                    </button>
                                                    {avatarPreview && (
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveAvatar}
                                                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                                            data-tooltip-id="profile-tooltip"
                                                            data-tooltip-content="Remove your profile picture"
                                                            disabled={isUploadingAvatar}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 text-center sm:text-left">
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

                                        {avatarMessage && (
                                            <div className={`p-3 rounded-lg text-sm ${
                                                avatarMessage.type === 'success' 
                                                    ? 'bg-green-600/20 border border-green-400 text-green-100' 
                                                    : 'bg-red-600/20 border border-red-400 text-red-100'
                                            }`}>
                                                {avatarMessage.text}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-yellow-400 font-medium flex items-center">
                                                <FontAwesomeIcon icon={faUser} className="mr-2" />
                                                Full Name
                                            </label>
                                            <input
                                                id="name"
                                                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                                autoComplete="name"
                                                placeholder="Enter your full name"
                                                data-tooltip-id="profile-tooltip"
                                                data-tooltip-content="Your name as it will appear on your profile."
                                            />
                                            {errors.name && (
                                                <p className="text-red-400 text-sm">{errors.name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-yellow-400 font-medium flex items-center">
                                                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                                                Email Address
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                                autoComplete="email"
                                                placeholder="Enter your email address"
                                                data-tooltip-id="profile-tooltip"
                                                data-tooltip-content="The email address associated with your account. Used for login and notifications."
                                            />
                                            {errors.email && (
                                                <p className="text-red-400 text-sm">{errors.email}</p>
                                            )}
                                        </div>

                                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                                            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
                                                <p className="text-blue-300">
                                                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                                                    Your email address is unverified.
                                                    <Link
                                                        href={route('verification.send')}
                                                        method="post"
                                                        as="button"
                                                        className="ml-2 text-yellow-400 hover:underline"
                                                        data-tooltip-id="profile-tooltip"
                                                        data-tooltip-content="Click to send a new verification link to your email."
                                                    >
                                                        Click here to resend the verification email.
                                                    </Link>
                                                </p>

                                                {status === 'verification-link-sent' && (
                                                    <p className="mt-2 text-green-400">
                                                        A new verification link has been sent to your email address.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 pt-4">
                                            <button
                                                type="submit"
                                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg transition-colors flex items-center"
                                                disabled={processing}
                                                data-tooltip-id="profile-tooltip"
                                                data-tooltip-content="Save the changes made to your name and email."
                                            >
                                                {processing ? (
                                                    <>
                                                        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </button>

                                            <Transition
                                                show={recentlySuccessful}
                                                enter="transition ease-in-out"
                                                enterFrom="opacity-0"
                                                leave="transition ease-in-out"
                                                leaveTo="opacity-0"
                                            >
                                                <p className="text-green-400 text-sm">Saved successfully!</p>
                                            </Transition>
                                        </div>
                                    </form>

                                    {/* AI Settings Section */}
                                    <div className="pt-6 border-t border-gray-700">
                                        <div className="flex items-center mb-4">
                                            <FontAwesomeIcon icon={faRobot} className="text-yellow-400 mr-2" />
                                            <h3 className="text-lg font-semibold text-white">AI Settings</h3>
                                        </div>
                                        
                                        <div className="bg-gray-700/50 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">
                                                        Allow guest users to use AI
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        When enabled, non-logged-in users can access AI features. 
                                                        When disabled, only authenticated users can use AI.
                                                    </p>
                                                </div>
                                                
                                                <div className="ml-4">
                                                    <button
                                                        onClick={handleToggleGuestAI}
                                                        disabled={isSavingAiSettings}
                                                        className={`
                                                            relative inline-flex h-6 w-11 items-center rounded-full 
                                                            transition-colors focus:outline-none focus:ring-2 
                                                            focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-800
                                                            ${guestAiEnabled ? 'bg-yellow-500' : 'bg-gray-500'}
                                                            ${isSavingAiSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                        `}
                                                        role="switch"
                                                        aria-checked={guestAiEnabled}
                                                        data-tooltip-id="profile-tooltip"
                                                        data-tooltip-content={guestAiEnabled ? "Click to disable guest AI access" : "Click to enable guest AI access"}
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
                                                <div className={`w-2 h-2 rounded-full ${guestAiEnabled ? 'bg-yellow-400' : 'bg-gray-400'} mr-2`} />
                                                <span className="text-sm text-gray-400">
                                                    Guest AI is currently <span className="font-semibold text-white">{guestAiEnabled ? 'enabled' : 'disabled'}</span>
                                                </span>
                                            </div>
                                            
                                            {isSavingAiSettings && (
                                                <div className="mt-4 flex items-center text-sm text-gray-400">
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                    Saving AI settings...
                                                </div>
                                            )}
                                            
                                            {aiSettingsMessage && (
                                                <div className={`mt-4 p-3 rounded-lg text-sm ${
                                                    aiSettingsMessage.type === 'success' 
                                                        ? 'bg-green-600/20 border border-green-400 text-green-100' 
                                                        : 'bg-red-600/20 border border-red-400 text-red-100'
                                                }`}>
                                                    {aiSettingsMessage.text}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-700" data-tooltip-id="profile-tooltip" data-tooltip-content="This section allows you to permanently delete your account. This action cannot be undone.">
                                        <DeleteUser />
                                    </div>
                                </div>
                            </div>
                        </SettingsLayout>
                    </div>
                )}
            </main>
        </>
    );
}