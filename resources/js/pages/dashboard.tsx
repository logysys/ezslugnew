import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes,
    faGlobe,
    faFunnelDollar,
    faReceipt,
    faCoins,
    faArrowUp,
    faArrowDown,
    faHistory,
    faExchangeAlt,
    faDollarSign,
    faCalendarAlt,
    faCheckCircle,
    faSpinner,
    faPlus,
    faHourglassHalf,
    faSyncAlt,
    faUsers,
    faEnvelopeOpenText,
    faSitemap,
    faUserPlus,
    faFileInvoiceDollar,
    faCalendarDay,
    faPalette,
    faWallet,
    faProjectDiagram,
    faShoppingCart,
    faLink,
    faChartLine,
    faChartPie,
    faWrench,
    faMinus,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import 'react-tooltip/dist/react-tooltip.css';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';

interface DashboardProps {
    userBalance: {
        bee_points_balance: number;
    };
    stats: {
        funnels: { value: number; change: number | string; trend: string };
        templates: { value: number; change: number | string; trend: string };
        transactions: { value: number; change: number | string; trend: string };
        token_balance: { value: string; change: number | string; trend: string };
    };
    recentActivity: Array<{
        icon: string;
        color: string;
        bgColor: string;
        title: string;
        description: string;
        time: string;
    }>;
    domains: Array<{
        name: string;
        status: string;
        expires: string;
    }>;
    funnelStats: {
        domains: { value: number; change: number | string; trend: string };
        custom_domains: { value: number; change: number | string; trend: string };
        total_sales: { value: string; change: number | string; trend: string };
        pending_sales: { value: string; change: number | string; trend: string };
    };
    transactions: Array<{
        date: string;
        type: string;
        amount: number;
        status: string;
    }>;
}

export default function Dashboard() {
    const { auth, template, userBalance, stats, recentActivity, domains, funnelStats, transactions } = usePage<SharedData & DashboardProps>().props;
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [loading, setLoading] = useState(false);

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            
            if (response.ok) {
                // Redirect to login page or home page
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    }, []);

    // Refresh dashboard data
    const refreshDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/dashboard/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                // In a real implementation, you would update the state with the new data
                // For now, we'll just reload the page to get fresh data
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const isValidUrl = useCallback((url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }, []);

    const getImageExtension = useCallback((url: string) => {
        const cleanUrl = url.split('?')[0];
        return cleanUrl.split('.').pop()?.toLowerCase();
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

    const formatBeePoints = useCallback((amount: number) => {
        return `EZ$${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }, []);

    const formatWithBeePrefix = useCallback((value: string) => {
        // Remove any existing commas and convert to number
        const numericValue = parseFloat(value.replace(/,/g, ''));
        
        // Check if the value is a valid number
        if (isNaN(numericValue)) {
            return `EZ$${value}`;
        }
        
        // Format with 2 decimal places
        return `EZ$${numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }, []);

    const parseAndFormatNumber = useCallback((value: string | number) => {
        // If it's already a number, format it directly
        if (typeof value === 'number') {
            return value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
        
        // If it's a string, remove commas and parse
        const numericValue = parseFloat(value.replace(/,/g, ''));
        
        // Check if the value is a valid number
        if (isNaN(numericValue)) {
            return value;
        }
        
        // Format with 2 decimal places
        return numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }, []);

    const renderTemplateContent = useMemo(() => {
        if (!template) return null;

        const extension = template.image.split('.').pop()?.toLowerCase() || '';
        const imgPath = template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        const fullImageUrl = `${imgPath}${template.image}`;

        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        const validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];

        const youtubeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
        const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^/]+:[^"&?/ ]+)/i;
        const vimeoRegex = /^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im;
        const fbWatchRegex = /^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/;
        const facebookRegex = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/;
        const iframeRegex = /<iframe.*?src=["'](.*?)["'].*?>.*?<\/iframe>/is;
        const blockquoteRegex = /<blockquote/;

        const youtubeMatch = template.image.match(youtubeRegex);
        const linkedinMatch = template.image.match(linkedinRegex);
        const vimeoMatch = template.image.match(vimeoRegex);
        const fbWatchMatch = template.image.match(fbWatchRegex);
        const facebookMatch = template.image.match(facebookRegex);
        const iframeMatch = template.image.match(iframeRegex) || blockquoteRegex.test(template.image);
        const htmlBlob = new Blob([template.image], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);

        if (validImageExtensions.includes(extension)) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <img 
                        key={`image-${template.image}`}
                        src={fullImageUrl} 
                        alt="Background" 
                        className="absolute inset-0 max-w-full max-h-full m-auto z-0 rounded-lg"
                        onError={(e) => console.error('Image failed to load', e)}
                    />
                </>
            );
        }

        if (validDocumentExtensions.includes(extension)) {
            return (
                <iframe
                    key={`doc-${template.image}`}
                    src={`https://docs.google.com/viewer?url=${fullImageUrl}&embedded=true`}
                    className="fixed top-0 left-0 w-full h-full"
                    frameBorder="0"
                    loading="lazy"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin"
                    title="Document Viewer"
                    scrolling="yes"
                />
            );
        }

        if (iframeMatch) {
            const processedHtml = template.image
                .replace(/<(iframe|blockquote)([^>]*)\s(height|width|style)=["'][^"']*["']([^>]*)>/gi, '<$1$2$4 class="fixed top-0 left-0 w-full h-full" scrolling="yes">')
                .replace(/class="([^"]*)"/g, 'class="$1 absolute inset-0 m-auto"');

            const finalHtml = !/<(iframe|blockquote)[^>]*class="/i.test(processedHtml)
                ? processedHtml.replace(/<(iframe|blockquote)/g, '<$1 scrolling="yes" class="absolute w-full h-full inset-0 m-auto"')
                : processedHtml;

            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                        .twitter-tweet {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            object-fit: cover;
                            z-index: 0;
                            border: none;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <div 
                        key={`iframe-${template.image}`}
                        className="fixed top-0 left-0 w-full h-full object-cover"
                        dangerouslySetInnerHTML={{ __html: finalHtml }}
                    />
                </>
            );
        }

        if (youtubeMatch) {
            const autoplayParam = template.option === 'autoplay' ? 'autoplay=1' : 
                                template.option === 'mute' ? 'autoplay=1&mute=1' : 'mute=1';
            
            return (
                <>
                    <div className="fixed top-0 left-0 w-full h-full z-[-2]">
                        <iframe 
                            key={`youtube-1-${youtubeMatch[1]}`}
                            loading="lazy"
                            src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${autoplayParam}&loop=1&playlist=${youtubeMatch[1]}&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3`}
                            className="w-full h-full object-cover"
                            frameBorder="0"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                        />
                    </div>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe 
                        key={`youtube-2-${youtubeMatch[1]}`}
                        id="bgVideo" 
                        loading="lazy" 
                        className="fixed top-0 left-0 w-full h-full object-cover" 
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${template.option}=1&mute=1&loop=1&playlist=${youtubeMatch[1]}`}
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                    />
                </>
            );
        }

        if (linkedinMatch) {
            let linkedinUrl = template.image;
            if (!linkedinUrl.includes('?compact=1')) {
                linkedinUrl += (linkedinUrl.includes('?') ? '&' : '?') + 'compact=1';
            }

            return (
                <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black">
                    <iframe 
                        key={`linkedin-${linkedinUrl}`}
                        id="bgVideo"
                        src={linkedinUrl}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title="Embedded LinkedIn Post"
                        scrolling="yes"
                    />
                </div>
            );
        }

        if (vimeoMatch) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe 
                        key={`vimeo-${vimeoMatch[3]}`}
                        loading="lazy" 
                        id="bgVideo" 
                        allow="camera; microphone; fullscreen; display-capture; autoplay" 
                        src={`https://player.vimeo.com/video/${vimeoMatch[3]}?h=33160d1512&color=de0101`} 
                        className="fixed top-0 left-0 w-full h-full object-cover" 
                        frameBorder="0" 
                        allowFullScreen
                    />
                </>
            );
        }

        if (fbWatchMatch || (facebookMatch && !template.image.includes('groups'))) {
            return (
                <div className="fixed top-0 left-0 w-full h-full">
                    <div 
                        key={`fb-${template.image}`}
                        className="fb-post" 
                        data-href={template.image} 
                        data-width="1400" 
                        data-show-text="true"
                    />
                </div>
            );
        }

        if (extension === 'mp4') {
            return (
                <>
                    <video 
                        key={`video-bg-${template.image}`}
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="fixed top-0 left-0 w-full h-full object-cover z-[-3]"
                    >
                        <source src={fullImageUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <video 
                        key={`video-main-${template.image}`}
                        id="bgVideo" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="absolute inset-0 max-w-full max-h-full m-auto" 
                        controls
                    >
                        <source src={fullImageUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </>
            );
        }

        if (extension === 'glb') {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <model-viewer 
                        key={`model-${template.image}`}
                        src={fullImageUrl}
                        alt="3D model"
                        className="fixed top-0 left-0 w-full h-full"
                        ar
                        auto-rotate
                        camera-controls
                        shadow-intensity="1"
                    />
                </>
            );
        }

        if (isValidUrl(template.image)) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe 
                        key={`iframe-url-${template.image}`}
                        loading="lazy" 
                        id="bgVideo" 
                        allow="camera; microphone; fullscreen; display-capture; autoplay" 
                        src={template.image} 
                        className="fixed top-0 left-0 w-full h-full" 
                        frameBorder="0" 
                        allowFullScreen
                        scrolling="yes"
                    />
                </>
            );
        }

        return (
            <iframe
                key={`html-${template.image}`}
                src={htmlUrl}
                className="fixed top-0 left-0 w-full h-full border-none"
                allow="microphone *; camera *; autoplay *; fullscreen *; display-capture *;"
                sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock 
                        allow-popups allow-popups-to-escape-sandbox allow-presentation 
                        allow-same-origin allow-scripts allow-top-navigation 
                        allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation"
                allowFullScreen
                loading="lazy"
                name="binauralMixerFrame"
                allowTransparency="true"
                scrolling="yes"
            />
        );
    }, [template, isValidUrl]);

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'completed':
                return 'bg-emerald-100 text-emerald-800';
            case 'pending':
                return 'bg-amber-100 text-amber-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'completed':
                return faCheckCircle;
            case 'pending':
                return faHourglassHalf;
            default:
                return faSpinner;
        }
    };

    const getTransactionTypeInfo = (type: string) => {
        switch (type.toLowerCase()) {
            case 'purchase':
                return { icon: faShoppingCart, color: 'text-sky-400' };
            case 'invoice paid':
                return { icon: faFileInvoiceDollar, color: 'text-teal-400' };
            case 'funnel usage':
                return { icon: faWrench, color: 'text-orange-400' };
            case 'domain renewal':
                return { icon: faSyncAlt, color: 'text-purple-400' };
            case 'domain purchase':
                return { icon: faGlobe, color: 'text-blue-400' };
            case 'token transfer':
                return { icon: faExchangeAlt, color: 'text-indigo-400' };
            case 'commission':
                return { icon: faCoins, color: 'text-yellow-400' };
            default:
                return { icon: faExchangeAlt, color: 'text-gray-400' };
        }
    };

    // Map FontAwesome icons from string names to actual icons
    const getIconFromName = (iconName: string) => {
        const iconMap: { [key: string]: any } = {
            'faProjectDiagram': faProjectDiagram,
            'faShoppingCart': faShoppingCart,
            'faLink': faLink,
            'faUserPlus': faUserPlus,
            // Add more mappings as needed
        };
        return iconMap[iconName] || faLink; // Default to faLink if not found
    };

    // Helper function to format change values
    const formatChangeValue = (change: number | string) => {
        if (change === 'N/A') return 'N/A';
        return `${change}%`;
    };

    // Helper function to get trend color
    const getTrendColor = (change: number | string, trend: string) => {
        if (change === 'N/A') return 'text-gray-400';
        return trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-gray-400';
    };

    return (
        <>
            <Head>
                <title>Dashboard - Analytics Overview</title>
                <meta name="description" content="Your comprehensive dashboard with analytics and insights" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
                {blurStyle}
            </Head>
            
            <Tooltip id="action-tooltip" />
            <Tooltip id="dashboard-tooltip" />
            
            <div data-tooltip-id="action-tooltip" data-tooltip-content="Drag to move the main menu">
                <DraggableMenu auth={auth} />
            </div>

            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image && isImageExtension(getImageExtension(template.image)) ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {renderTemplateContent}
                </div>
                
                {isPanelVisible && (
                    <div 
                        className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white/20 overflow-y-auto shadow-2xl w-full max-w-6xl bg-gray-900/80"
                        data-tooltip-id="dashboard-tooltip"
                        data-tooltip-content="This panel displays your comprehensive dashboard overview"
                    >
                        <button 
                            onClick={() => setIsPanelVisible(false)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center z-50 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Close panel"
                            data-tooltip-id="action-tooltip"
                            data-tooltip-content="Close this panel"
                        >
                            <FontAwesomeIcon 
                                icon={faTimes} 
                                className="text-white text-lg" 
                                style={{ textShadow: '0.7px 0.7px 0 rgb(255,0,0), -0.7px -0.7px 0 rgb(0,255,255)' }}
                            />
                        </button>

                        <div className="space-y-6">
                            {/* Header Section */}
                            <div className="flex items-center justify-between mb-6">
                                <div 
                                    className="flex items-center space-x-3"
                                    data-tooltip-id="dashboard-tooltip"
                                    data-tooltip-content="Your comprehensive dashboard overview"
                                >
                                    <FontAwesomeIcon icon={faChartPie} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">
                                        Dashboard Overview
                                    </h1>
                                </div>
                                <div className="flex items-center gap-2 mr-12">
                                    <Link
                                        href="/ai/dashboard"
                                        className="group relative inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="AI Dashboard"
                                    >
                                        {/* Background shine effect */}
                                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                        
                                        {/* Animated icon */}
                                        <svg 
                                            className="relative w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-200" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            {/* Brain/Circuit pattern representing AI */}
                                            <path d="M12 4v16M4 12h16" className="opacity-75"/>
                                            <circle cx="12" cy="12" r="8" strokeWidth="1.5"/>
                                            <path d="M8 8l8 8M16 8l-8 8" strokeWidth="1.5"/>
                                            {/* Animated dots */}
                                            <circle cx="12" cy="12" r="1.5" fill="currentColor" className="opacity-75 group-hover:animate-pulse"/>
                                        </svg>
                                        
                                        <span className="relative">AI Dashboard</span>
                                        
                                        {/* Small decorative element */}
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                    </Link>
                                    
                                    <button
                                        onClick={refreshDashboard}
                                        className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2.5 px-5 rounded-xl hover:bg-yellow-500 transition-colors cursor-pointer shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 hover:-translate-y-0.5 duration-200"
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Refresh dashboard data"
                                        disabled={loading}
                                    >
                                        <FontAwesomeIcon icon={faSyncAlt} className={loading ? 'animate-spin' : ''} />
                                        Refresh
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all duration-200"
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Logout from your account"
                                    >
                                        <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>

                            {/* Stats Overview */}
                            <section aria-labelledby="stats-overview-heading" className="mb-8">
                                <h2 id="stats-overview-heading" className="sr-only">Stats Overview</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Funnels Stat */}
                                    <div 
                                        className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border border-gray-700"
                                        data-tooltip-id="dashboard-tooltip"
                                        data-tooltip-content={`Funnels: ${stats.funnels.value} total`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-gray-400 font-medium text-sm uppercase tracking-wide">Funnels</p>
                                                <h3 className="text-3xl font-bold text-white mt-1">{stats.funnels.value}</h3>
                                            </div>
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md">
                                                <FontAwesomeIcon icon={faSitemap} className="text-2xl" />
                                            </div>
                                        </div>
                                        <p 
                                            className={`text-sm mt-4 font-semibold flex items-center ${getTrendColor(stats.funnels.change, stats.funnels.trend)}`}
                                            data-tooltip-id="dashboard-tooltip"
                                            data-tooltip-content={
                                                stats.funnels.change === 'N/A' 
                                                    ? 'No data available for comparison' 
                                                    : `Change of ${stats.funnels.change}% compared to the previous 30 days`
                                            }
                                        >
                                            {stats.funnels.change !== 'N/A' && (
                                                <FontAwesomeIcon 
                                                    icon={stats.funnels.trend === 'up' ? faArrowUp : stats.funnels.trend === 'down' ? faArrowDown : faMinus} 
                                                    className="mr-1.5 text-xs" 
                                                />
                                            )}
                                            {stats.funnels.change === 'N/A' ? 'No data available' : `${stats.funnels.change}% from last month`}
                                        </p>
                                    </div>

                                    {/* Templates Stat */}
                                    <div 
                                        className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border border-gray-700"
                                        data-tooltip-id="dashboard-tooltip"
                                        data-tooltip-content={`Templates: ${stats.templates.value} total`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-gray-400 font-medium text-sm uppercase tracking-wide">Templates</p>
                                                <h3 className="text-3xl font-bold text-white mt-1">{stats.templates.value}</h3>
                                            </div>
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                                                <FontAwesomeIcon icon={faPalette} className="text-2xl" />
                                            </div>
                                        </div>
                                        <p 
                                            className={`text-sm mt-4 font-semibold flex items-center ${getTrendColor(stats.templates.change, stats.templates.trend)}`}
                                            data-tooltip-id="dashboard-tooltip"
                                            data-tooltip-content={
                                                stats.templates.change === 'N/A' 
                                                    ? 'No data available for comparison' 
                                                    : `Change of ${stats.templates.change}% compared to the previous 30 days`
                                            }
                                        >
                                            {stats.templates.change !== 'N/A' && (
                                                <FontAwesomeIcon 
                                                    icon={stats.templates.trend === 'up' ? faArrowUp : stats.templates.trend === 'down' ? faArrowDown : faMinus} 
                                                    className="mr-1.5 text-xs" 
                                                />
                                            )}
                                            {stats.templates.change === 'N/A' ? 'No data available' : `${stats.templates.change}% from last month`}
                                        </p>
                                    </div>

                                    {/* Transactions Stat */}
                                    <div 
                                        className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border border-gray-700"
                                        data-tooltip-id="dashboard-tooltip"
                                        data-tooltip-content={`Transactions: ${stats.transactions.value} total`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-gray-400 font-medium text-sm uppercase tracking-wide">Transactions</p>
                                                <h3 className="text-3xl font-bold text-white mt-1">{stats.transactions.value}</h3>
                                            </div>
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white shadow-md">
                                                <FontAwesomeIcon icon={faExchangeAlt} className="text-2xl" />
                                            </div>
                                        </div>
                                        <p 
                                            className={`text-sm mt-4 font-semibold flex items-center ${getTrendColor(stats.transactions.change, stats.transactions.trend)}`}
                                            data-tooltip-id="dashboard-tooltip"
                                            data-tooltip-content={
                                                stats.transactions.change === 'N/A' 
                                                    ? 'No data available for comparison' 
                                                    : `Change of ${stats.transactions.change}% compared to the previous 30 days`
                                            }
                                        >
                                            {stats.transactions.change !== 'N/A' && (
                                                <FontAwesomeIcon 
                                                    icon={stats.transactions.trend === 'up' ? faArrowUp : stats.transactions.trend === 'down' ? faArrowDown : faMinus} 
                                                    className="mr-1.5 text-xs" 
                                                />
                                            )}
                                            {stats.transactions.change === 'N/A' ? 'No data available' : `${stats.transactions.change}% from last month`}
                                        </p>
                                    </div>

                                    {/* Token Balance Stat */}
                                    <div 
                                        className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border border-gray-700"
                                        data-tooltip-id="dashboard-tooltip"
                                        data-tooltip-content={`Token Balance: ${stats.token_balance.value} total`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-gray-400 font-medium text-sm uppercase tracking-wide">Token Balance</p>
                                                <h3 className="text-3xl font-bold text-white mt-1">
                                                    {formatWithBeePrefix(stats.token_balance.value)}
                                                </h3>
                                            </div>
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-md">
                                                <FontAwesomeIcon icon={faWallet} className="text-2xl" />
                                            </div>
                                        </div>
                                        <p 
                                            className={`text-sm mt-4 font-semibold flex items-center ${getTrendColor(stats.token_balance.change, stats.token_balance.trend)}`}
                                            data-tooltip-id="dashboard-tooltip"
                                            data-tooltip-content={
                                                stats.token_balance.change === 'N/A' 
                                                    ? 'No data available for comparison' 
                                                    : `Change of ${stats.token_balance.change}% compared to the previous 30 days`
                                            }
                                        >
                                            {stats.token_balance.change !== 'N/A' && (
                                                <FontAwesomeIcon 
                                                    icon={stats.token_balance.trend === 'up' ? faArrowUp : stats.token_balance.trend === 'down' ? faArrowDown : faMinus} 
                                                    className="mr-1.5 text-xs" 
                                                />
                                            )}
                                            {stats.token_balance.change === 'N/A' ? 'No data available' : `${stats.token_balance.change}% from last month`}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Recent Activity & Domains */}
                            <section aria-labelledby="activity-domains-heading" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                {/* Recent Activity */}
                                <div 
                                    className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border border-gray-700"
                                    data-tooltip-id="dashboard-tooltip"
                                    data-tooltip-content="Your recent activity and events"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <FontAwesomeIcon icon={faHistory} className="text-sky-400 text-xl" />
                                            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                                        </div>
                                        <FontAwesomeIcon icon={faPlus} className="text-gray-400 text-sm cursor-pointer hover:text-white" />
                                    </div>
                                    
                                    <div className="space-y-4 max-h-80 overflow-y-auto">
                                        {recentActivity.map((activity, index) => (
                                            <div 
                                                key={index} 
                                                className="flex items-start space-x-4 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                                                data-tooltip-id="dashboard-tooltip"
                                                data-tooltip-content={`Activity: ${activity.title}`}
                                            >
                                                <div 
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.bgColor}`}
                                                    data-tooltip-id="dashboard-tooltip"
                                                    data-tooltip-content={`Activity type: ${activity.title}`}
                                                >
                                                    <FontAwesomeIcon 
                                                        icon={getIconFromName(activity.icon)} 
                                                        className={`${activity.color} text-lg`} 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">{activity.title}</p>
                                                    <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                                                    <p className="text-gray-500 text-xs mt-2">{activity.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Domains */}
                                <div 
                                    className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border border-gray-700"
                                    data-tooltip-id="dashboard-tooltip"
                                    data-tooltip-content="Your registered domains"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <FontAwesomeIcon icon={faGlobe} className="text-emerald-400 text-xl" />
                                            <h3 className="text-lg font-bold text-white">Your Domains</h3>
                                        </div>
                                        <FontAwesomeIcon icon={faPlus} className="text-gray-400 text-sm cursor-pointer hover:text-white" />
                                    </div>
                                    
                                    <div className="space-y-4 max-h-80 overflow-y-auto">
                                        {domains.map((domain, index) => (
                                            <div 
                                                key={index} 
                                                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                                                data-tooltip-id="dashboard-tooltip"
                                                data-tooltip-content={`Domain: ${domain.name}`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                        <FontAwesomeIcon icon={faGlobe} className="text-white text-lg" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{domain.name}</p>
                                                        <p className="text-gray-400 text-sm">Created at: {domain.expires}</p>
                                                    </div>
                                                </div>
                                                <span 
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(domain.status)}`}
                                                    data-tooltip-id="dashboard-tooltip"
                                                    data-tooltip-content={`Domain status: ${domain.status}`}
                                                >
                                                    {domain.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Funnel Performance Stats */}
                            <section aria-labelledby="funnel-stats-heading" className="mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {/* Domains */}
                                        <div 
                                            className="text-center p-4 rounded-lg bg-gray-800/50"
                                            data-tooltip-id="dashboard-tooltip"
                                            data-tooltip-content={`Total domains: ${funnelStats.domains.value}`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                                                <FontAwesomeIcon icon={faGlobe} className="text-white text-xl" />
                                            </div>
                                            <h4 className="text-2xl font-bold text-white">{funnelStats.domains.value}</h4>
                                            <p className="text-gray-400 text-sm">Domains</p>
                                            <p 
                                                className={`text-xs mt-2 font-semibold flex items-center justify-center ${getTrendColor(funnelStats.domains.change, funnelStats.domains.trend)}`}
                                                data-tooltip-id="dashboard-tooltip"
                                                data-tooltip-content={
                                                    funnelStats.domains.change === 'N/A' 
                                                        ? 'No data available for comparison' 
                                                        : `Change of ${funnelStats.domains.change}% compared to the previous 30 days`
                                                }
                                            >
                                                {funnelStats.domains.change !== 'N/A' && (
                                                    <FontAwesomeIcon 
                                                        icon={funnelStats.domains.trend === 'up' ? faArrowUp : funnelStats.domains.trend === 'down' ? faArrowDown : faMinus} 
                                                        className="mr-1 text-xs" 
                                                    />
                                                )}
                                                {formatChangeValue(funnelStats.domains.change)}
                                            </p>
                                        </div>

                                        {/* Custom Domains */}
                                        <div 
                                            className="text-center p-4 rounded-lg bg-gray-800/50"
                                            data-tooltip-id="dashboard-tooltip"
                                            data-tooltip-content={`Custom domains: ${funnelStats.custom_domains.value}`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto mb-3">
                                                <FontAwesomeIcon icon={faLink} className="text-white text-xl" />
                                            </div>
                                            <h4 className="text-2xl font-bold text-white">{funnelStats.custom_domains.value}</h4>
                                            <p className="text-gray-400 text-sm">Custom Domains</p>
                                            <p 
                                                className={`text-xs mt-2 font-semibold flex items-center justify-center ${getTrendColor(funnelStats.custom_domains.change, funnelStats.custom_domains.trend)}`}
                                                data-tooltip-id="dashboard-tooltip"
                                                data-tooltip-content={
                                                    funnelStats.custom_domains.change === 'N/A' 
                                                        ? 'No data available for comparison' 
                                                        : `Change of ${funnelStats.custom_domains.change}% compared to the previous 30 days`
                                                }
                                            >
                                                {funnelStats.custom_domains.change !== 'N/A' && (
                                                    <FontAwesomeIcon 
                                                        icon={funnelStats.custom_domains.trend === 'up' ? faArrowUp : funnelStats.custom_domains.trend === 'down' ? faArrowDown : faMinus} 
                                                        className="mr-1 text-xs" 
                                                    />
                                                )}
                                                {formatChangeValue(funnelStats.custom_domains.change)}
                                            </p>
                                        </div>

                                        {/* Total Sales */}
                                        <div 
                                            className="text-center p-4 rounded-lg bg-gray-800/50"
                                            data-tooltip-id="dashboard-tooltip"
                                            data-tooltip-content={`Total sales: ${funnelStats.total_sales.value}`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-3">
                                                <FontAwesomeIcon icon={faDollarSign} className="text-white text-xl" />
                                            </div>
                                            <h4 className="text-2xl font-bold text-white">
                                                {formatWithBeePrefix(funnelStats.total_sales.value)}
                                            </h4>
                                            <p className="text-gray-400 text-sm">Total Sales</p>
                                            <p 
                                                className={`text-xs mt-2 font-semibold flex items-center justify-center ${getTrendColor(funnelStats.total_sales.change, funnelStats.total_sales.trend)}`}
                                                data-tooltip-id="dashboard-tooltip"
                                                data-tooltip-content={
                                                    funnelStats.total_sales.change === 'N/A' 
                                                        ? 'No data available for comparison' 
                                                        : `Change of ${funnelStats.total_sales.change}% compared to the previous 30 days`
                                                }
                                            >
                                                {funnelStats.total_sales.change !== 'N/A' && (
                                                    <FontAwesomeIcon 
                                                        icon={funnelStats.total_sales.trend === 'up' ? faArrowUp : funnelStats.total_sales.trend === 'down' ? faArrowDown : faMinus} 
                                                        className="mr-1 text-xs" 
                                                    />
                                                )}
                                                {formatChangeValue(funnelStats.total_sales.change)}
                                            </p>
                                        </div>

                                        {/* Pending Sales */}
                                        <div 
                                            className="text-center p-4 rounded-lg bg-gray-800/50"
                                            data-tooltip-id="dashboard-tooltip"
                                            data-tooltip-content={`Pending sales: ${funnelStats.pending_sales.value}`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mx-auto mb-3">
                                                <FontAwesomeIcon icon={faHourglassHalf} className="text-white text-xl" />
                                            </div>
                                            <h4 className="text-2xl font-bold text-white">
                                                {formatWithBeePrefix(funnelStats.pending_sales.value)}
                                            </h4>
                                            <p className="text-gray-400 text-sm">Pending Sales</p>
                                            <p 
                                                className={`text-xs mt-2 font-semibold flex items-center justify-center ${getTrendColor(funnelStats.pending_sales.change, funnelStats.pending_sales.trend)}`}
                                                data-tooltip-id="dashboard-tooltip"
                                                data-tooltip-content={
                                                    funnelStats.pending_sales.change === 'N/A' 
                                                        ? 'No data available for comparison' 
                                                        : `Change of ${funnelStats.pending_sales.change}% compared to the previous 30 days`
                                                }
                                            >
                                                {funnelStats.pending_sales.change !== 'N/A' && (
                                                    <FontAwesomeIcon 
                                                        icon={funnelStats.pending_sales.trend === 'up' ? faArrowUp : funnelStats.pending_sales.trend === 'down' ? faArrowDown : faMinus} 
                                                        className="mr-1 text-xs" 
                                                    />
                                                )}
                                                {formatChangeValue(funnelStats.pending_sales.change)}
                                            </p>
                                        </div>
                                    </div>
                            </section>

                            {/* Recent Transactions */}
                            <section aria-labelledby="transactions-heading">
                                <h2 id="transactions-heading" className="sr-only">Recent Transactions</h2>
                                <div 
                                    className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border border-gray-700"
                                    data-tooltip-id="dashboard-tooltip"
                                    data-tooltip-content="Your recent transactions"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <FontAwesomeIcon icon={faReceipt} className="text-amber-400 text-xl" />
                                            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
                                        </div>
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-sm" />
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-700">
                                                    <th className="text-left text-gray-400 font-medium pb-3">Date</th>
                                                    <th className="text-left text-gray-400 font-medium pb-3">Type</th>
                                                    <th className="text-right text-gray-400 font-medium pb-3">Amount</th>
                                                    <th className="text-center text-gray-400 font-medium pb-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map((transaction, index) => {
                                                    const typeInfo = getTransactionTypeInfo(transaction.type);
                                                    return (
                                                        <tr 
                                                            key={index} 
                                                            className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50 transition-colors"
                                                            data-tooltip-id="dashboard-tooltip"
                                                            data-tooltip-content={`Transaction: ${transaction.type} - ${transaction.date}`}
                                                        >
                                                            <td className="py-4 text-white">{transaction.date}</td>
                                                            <td className="py-4">
                                                                <div className="flex items-center space-x-2">
                                                                    <FontAwesomeIcon icon={typeInfo.icon} className={`${typeInfo.color} text-sm`} />
                                                                    <span className="text-white">{transaction.type}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-right">
                                                                <span className={`font-semibold ${transaction.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {transaction.amount >= 0 ? '+' : ''}{formatBeePoints(Math.abs(transaction.amount))}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-center">
                                                                <span 
                                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(transaction.status)}`}
                                                                    data-tooltip-id="dashboard-tooltip"
                                                                    data-tooltip-content={`Transaction status: ${transaction.status}`}
                                                                >
                                                                    {transaction.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}