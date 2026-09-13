import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faCheckCircle, faTimes, faLock, faKey } from '@fortawesome/free-solid-svg-icons';
import SettingsLayout from '@/layouts/settings/layout';
import DraggableMenu from '@/components/DraggableMenu';
import '@google/model-viewer';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

export default function Password() {
    const { auth, template } = usePage<SharedData>().props;
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [htmlUrl, setHtmlUrl] = useState('');

    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
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
                <title>Password Settings</title>
                {blurStyle}
            </Head>
            <Tooltip id="password-tooltip" />
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
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full">
                        <SettingsLayout>
                            <div className="relative">
                                <div className="bg-gray-800/80 border-gray-700 rounded-lg p-6 space-y-6 backdrop-blur-sm">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-white" data-tooltip-id="password-tooltip" data-tooltip-content="Secure your account by updating your password regularly.">
                                            <FontAwesomeIcon icon={faLock} className="mr-2" />
                                            Update Password
                                        </h2>
                                    </div>
                                    <p className="text-sm text-gray-400" data-tooltip-id="password-tooltip" data-tooltip-content="For best security, your new password should be at least 8 characters long and include a mix of letters, numbers, and symbols.">
                                        Ensure your account is using a long, random password to stay secure.
                                    </p>

                                    {recentlySuccessful && (
                                        <div className="p-4 bg-green-600/20 border border-green-400 text-green-100 rounded-lg">
                                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                            Password updated successfully!
                                        </div>
                                    )}

                                    <form onSubmit={updatePassword} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-yellow-400 font-medium flex items-center">
                                                <FontAwesomeIcon icon={faKey} className="mr-2" />
                                                Current Password
                                            </label>
                                            <input
                                                id="current_password"
                                                ref={currentPasswordInput}
                                                value={data.current_password}
                                                onChange={(e) => setData('current_password', e.target.value)}
                                                type="password"
                                                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                autoComplete="current-password"
                                                placeholder="Enter your current password"
                                                data-tooltip-id="password-tooltip"
                                                data-tooltip-content="Enter your existing password to authorize the change."
                                            />
                                            {errors.current_password && (
                                                <p className="text-red-400 text-sm">{errors.current_password}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-yellow-400 font-medium flex items-center">
                                                <FontAwesomeIcon icon={faLock} className="mr-2" />
                                                New Password
                                            </label>
                                            <input
                                                id="password"
                                                ref={passwordInput}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                type="password"
                                                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                autoComplete="new-password"
                                                placeholder="Enter your new password"
                                                data-tooltip-id="password-tooltip"
                                                data-tooltip-content="Choose a strong, new password that you haven't used before."
                                            />
                                            {errors.password && (
                                                <p className="text-red-400 text-sm">{errors.password}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-yellow-400 font-medium flex items-center">
                                                <FontAwesomeIcon icon={faLock} className="mr-2" />
                                                Confirm Password
                                            </label>
                                            <input
                                                id="password_confirmation"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                type="password"
                                                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                autoComplete="new-password"
                                                placeholder="Confirm your new password"
                                                data-tooltip-id="password-tooltip"
                                                data-tooltip-content="Re-enter your new password to ensure it's correct."
                                            />
                                            {errors.password_confirmation && (
                                                <p className="text-red-400 text-sm">{errors.password_confirmation}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 pt-4">
                                            <button
                                                type="submit"
                                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg transition-colors flex items-center"
                                                disabled={processing}
                                                data-tooltip-id="password-tooltip"
                                                data-tooltip-content="Click to save your new password."
                                            >
                                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                                {processing ? 'Saving...' : 'Save Password'}
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
                                </div>
                            </div>
                        </SettingsLayout>
                    </div>
                )}
            </main>
        </>
    );
}