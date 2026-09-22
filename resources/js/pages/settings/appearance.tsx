import { Head, usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPalette } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

import AppearanceTabs from '@/components/appearance-tabs';
import { type SharedData } from '@/types';
import SettingsLayout from '@/layouts/settings/layout';
import DraggableMenu from '@/components/DraggableMenu';
import '@google/model-viewer';

export default function Appearance() {
    const { auth, template } = usePage<SharedData>().props;
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [htmlUrl, setHtmlUrl] = useState('');

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
                <title>Appearance Settings</title>
                {blurStyle}
            </Head>
            <Tooltip id="appearance-tooltip" />
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
                                        <h2 
                                            className="text-xl font-bold text-white"
                                            data-tooltip-id="appearance-tooltip"
                                            data-tooltip-content="Change the look and feel of your profile."
                                        >
                                            <FontAwesomeIcon icon={faPalette} className="mr-2" />
                                            Appearance Settings
                                        </h2>
                                    </div>
                                    <p 
                                        className="text-sm text-gray-400"
                                        data-tooltip-id="appearance-tooltip"
                                        data-tooltip-content="Select a tab to modify different visual aspects of your account."
                                    >
                                       Customize your account's appearance and theme settings.
                                    </p>
                                    <div 
                                        className="pt-4 border-t border-gray-700"
                                        data-tooltip-id="appearance-tooltip"
                                        data-tooltip-content="Use these tabs to upload a background, choose a theme, or apply custom CSS."
                                    >
                                        <AppearanceTabs />
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