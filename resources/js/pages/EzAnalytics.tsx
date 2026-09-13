import { useEffect, useState, useRef, useMemo } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import '@google/model-viewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import { 
    faDownload, 
    faSignInAlt, 
    faUserPlus, 
    faLayerGroup,
    faCloudDownloadAlt,
    faHandPointer,
    faHome, 
    faTrashAlt, 
    faPlusCircle, 
    faColumns, 
    faGlobeAmericas,
    faGlobe,
    faSignOutAlt,
    faPlay,
    faMapPin,
    faInfoCircle,
    faSave,
    faTimes,
    faEdit,
    faCreditCard,
    faSearch,
    faCheckCircle,
    faExclamationTriangle,
    faPalette,
    faImage,
    faHashtag,
    faChartLine,
    faChartBar,
    faCalendarAlt,
    faUsers,
    faEye,
    faMapMarkerAlt,
    faDesktop,
    faMobileAlt,
    faGlobeAmericas as faGlobeAmericasSolid
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

type Funnel = {
    id: number;
    token: string;
    created_at: string;
    fly_sign: boolean;
    eye_tracking: boolean;
    theme: string;
    mode: string;
    custom_domains?: Array<{
        id: number;
        domain: string;
        domainselected: string;
    }>;
    handle_domains?: Array<{
        id: number;
        domain: string;
        domainselected: string;
    }>;
    fields: Array<{
        emoji_marker: string;
        url: string;
    }>;
};

type VisitorAnalytic = {
    id: number;
    user_id: number;
    ip_address: string;
    method: string;
    url: string;
    referer: string;
    user_agent: string;
    location_data: {
        country?: string;
        city?: string;
        region?: string;
        timezone?: string;
    };
    created_at: string;
};

type AnalyticsData = {
    total_visitors: number;
    unique_visitors: number;
    page_views: number;
    bounce_rate: number;
    avg_session_duration: number;
    daily_visits: Array<{
        date: string;
        visits: number;
        page_views: number;
    }>;
    traffic_sources: Array<{
        source: string;
        visitors: number;
        percentage: number;
    }>;
    devices: Array<{
        device: string;
        visitors: number;
        percentage: number;
    }>;
    locations: Array<{
        country: string;
        city: string;
        visitors: number;
    }>;
    top_pages: Array<{
        url: string;
        visitors: number;
        avg_duration: number;
    }>;
};

export default function EzAnalytics() {
    const { auth, template, initialFunnels } = usePage<SharedData>().props;
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy' | 'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [selectedFunnel, setSelectedFunnel] = useState<null | {
        id: number;
        token: string;
    }>(null);
    
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Debounce search query
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Create HTML URL for iframe content
    const [htmlUrl, setHtmlUrl] = useState<string | null>(null);
    useEffect(() => {
        if (template?.image) {
            const htmlBlob = new Blob([template.image], { type: 'text/html' });
            const url = URL.createObjectURL(htmlBlob);
            setHtmlUrl(url);
            
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [template?.image]);

    useEffect(() => {
        if (initialFunnels) {
            setFunnels(initialFunnels.data);
            setHasMore(initialFunnels.next_page_url !== null);
        }
    }, [initialFunnels]);

    useEffect(() => {
        if (debouncedSearchQuery) {
            handleSearch();
        }
    }, [debouncedSearchQuery, searchType]);

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('/search-ez-funnels-analytics', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: 1
                }
            });
            
            setFunnels(response.data.data);
            setCurrentPage(1);
            setHasMore(response.data.next_page_url !== null);
        } catch (error) {
            console.error('Search error:', error);
            setErrorMessage('Failed to search funnels. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        try {
            setIsLoading(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await axios.get('/search-ez-funnels-analytics', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: currentPage + 1,
                    with: 'customDomains,handleDomains'
                },
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data && response.data.data) {
                setFunnels(prevFunnels => [...prevFunnels, ...response.data.data]);
                setCurrentPage(currentPage + 1);
                setHasMore(response.data.next_page_url !== null);
            }
        } catch (error) {
            console.error('Load more error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to load more items. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewAnalytics = async (funnel: { id: number; token: string }) => {
        setSelectedFunnel(funnel);
        setLoadingAnalytics(true);
        
        try {
            const response = await axios.get(`/get-funnel-analytics/${funnel.id}`, {
                params: {
                    time_range: timeRange
                }
            });
            
            setAnalyticsData(response.data);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            setErrorMessage('Failed to load analytics data. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
            setAnalyticsData(null);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getImageExtension = (url: string) => {
        const cleanUrl = url.split('?')[0];
        return cleanUrl.split('.').pop()?.toLowerCase();
    };

    const isImageExtension = (extension?: string) => {
        if (!extension) return false;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        return imageExtensions.includes(extension);
    };

    const blurStyle = template?.image && isImageExtension(getImageExtension(template.image)) ? (
        <style>{`
            .blur-bg {
                background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                background-size: cover;
            }
        `}</style>
    ) : null;

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

        if (htmlUrl) {
            return (
                <iframe
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
        }

        return null;
    }, [template, htmlUrl]);

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num);
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${Math.round(remainingSeconds)}s`;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    return (
        <>
            <Head>
                <title>EZ Analytics - Funnel Visitor Analytics</title>
                {blurStyle}
                <meta name="description" content="View detailed analytics for your funnels including visitor statistics, traffic sources, and more" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                    .chart-container {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        padding: 20px;
                        margin-bottom: 20px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    .stat-card {
                        background: linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(59, 130, 246, 0.2));
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                        transition: transform 0.3s ease;
                    }
                    .stat-card:hover {
                        transform: translateY(-2px);
                    }
                    .custom-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: #4b5563 #1f2937;
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #1f2937;
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #4b5563;
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #6b7280;
                    }
                    .recharts-tooltip-wrapper {
                        background-color: #1f2937 !important;
                        border: 1px solid #4b5563 !important;
                        border-radius: 6px !important;
                    }
                    .recharts-tooltip-label {
                        color: #d1d5db !important;
                    }
                    .recharts-tooltip-item {
                        color: #9ca3af !important;
                    }
                `}</style>
            </Head>
            
            <Tooltip id="action-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="modal-tooltip" />

            <DraggableMenu auth={auth} /> 
            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image.split('.').pop()?.toLowerCase() && 
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {renderTemplateContent}
                </div>
                {isPanelVisible && (
                <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-7xl">
                    <button 
                        onClick={() => setIsPanelVisible(false)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center z-50 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Close panel"
                        data-tooltip-id="action-tooltip"
                        data-tooltip-content="Hide Control Panel"
                    >
                        <FontAwesomeIcon 
                            icon={faTimes} 
                            className="text-white text-lg" 
                            style={{ textShadow: '0.7px 0.7px 0 rgb(255,0,0), -0.7px -0.7px 0 rgb(0,255,255)' }}
                        />
                    </button>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left side - Search results */}
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative flex-grow">
                                    <input 
                                        type="text" 
                                        placeholder="Search by token or domain" 
                                        className="w-full bg-white text-gray-900 px-3 py-2 pl-10 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-0"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        data-tooltip-id="form-tooltip"
                                        data-tooltip-content="Search your funnels"
                                    />
                                    <FontAwesomeIcon 
                                        icon={faSearch} 
                                        className="absolute left-3 top-3 text-gray-500"
                                    />
                                </div>
                                
                                <div className="flex items-center">
                                    <button 
                                        className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-l-md border-r transition-colors ${
                                            searchType === 'fuzzy' 
                                                ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' 
                                                : 'bg-gray-600 text-gray-300 border-gray-700 hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                            setSearchType('fuzzy');
                                            handleSearch();
                                        }}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Use fuzzy (approximate) search"
                                    >
                                        <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                                        Fuzzy
                                    </button>
                                    <button 
                                        className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-r-md transition-colors ${
                                            searchType === 'exact' 
                                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                                : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                            setSearchType('exact');
                                            handleSearch();
                                        }}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Use exact match search"
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />
                                        Exact
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar space-y-2">
                                {funnels.length === 0 ? (
                                    <div className="text-center py-8 text-gray-300">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl mb-2" />
                                        <p>No funnels found. Create one to get started!</p>
                                    </div>
                                ) : (
                                    funnels.map((funnel) => (
                                        <div key={funnel.id} className={`flex items-center p-4 gap-1 rounded-lg transition-all ${selectedFunnel?.id === funnel.id ? 'bg-purple-900/80 border-2 border-yellow-400' : 'bg-[#5d0f6e] hover:bg-purple-800/80'}`}>
                                            <span className="text-4xl select-none">
                                                📊
                                            </span>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex flex-col gap-y-2">
                                                    {/* Default URL */}
                                                    <a 
                                                        href={`https://ez.wiki/${encodeURIComponent(funnel.token)}`} 
                                                        target="_blank" 
                                                        className="text-yellow-400 font-semibold truncate hover:underline"
                                                        rel="noopener noreferrer"
                                                        data-tooltip-id="action-tooltip"
                                                        data-tooltip-content="Open funnel link in new tab"
                                                    >
                                                        https://ez.wiki/{funnel.token}
                                                    </a>
                                                    {/* Sub domains */}
                                                    {funnel.handle_domains?.map((domain) => (
                                                        <a 
                                                            key={domain.id}
                                                            href={`https://${domain.domain}.${domain.domainselected}`} 
                                                            target="_blank" 
                                                            className="text-yellow-400 font-semibold truncate hover:underline"
                                                            rel="noopener noreferrer"
                                                            data-tooltip-id="action-tooltip"
                                                            data-tooltip-content="Open handle domain in new tab"
                                                        >
                                                            https://{domain.domain}.{domain.domainselected}
                                                        </a>
                                                    ))}
                                                    {/* Custom domains */}
                                                    {funnel.custom_domains?.map((domain) => (
                                                        <a 
                                                            key={domain.id}
                                                            href={`https://${domain.domainselected}/${domain.domain}`} 
                                                            target="_blank" 
                                                            className="text-yellow-400 font-semibold truncate hover:underline"
                                                            rel="noopener noreferrer"
                                                            data-tooltip-id="action-tooltip"
                                                            data-tooltip-content="Open custom domain in new tab"
                                                        >
                                                            https://{domain.domainselected}/{domain.domain}
                                                        </a>
                                                    ))}
                                                    
                                                    <p className="text-purple-300 text-sm whitespace-nowrap">
                                                        {formatDate(funnel.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                className={`font-bold py-1 px-5 rounded-md text-sm transition-colors whitespace-nowrap ${
                                                    selectedFunnel?.id === funnel.id 
                                                        ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                                                        : 'bg-yellow-400 text-black hover:bg-yellow-500'
                                                }`}
                                                onClick={() => handleViewAnalytics(funnel)}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="View analytics for this funnel"
                                                disabled={loadingAnalytics}
                                            >
                                                {selectedFunnel?.id === funnel.id ? 'Viewing Analytics' : 'View Analytics'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {hasMore && (
                                <div className="flex justify-center mt-4">
                                    <button 
                                        className="bg-black text-white border border-white px-8 py-2 rounded-md font-semibold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                                        onClick={loadMore}
                                        disabled={isLoading}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Load more of your funnels"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Loading...
                                            </span>
                                        ) : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right side - Show either Analytics or placeholder */}
                        {selectedFunnel ? (
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                                {errorMessage && (
                                    <div className="bg-red-500/90 text-white p-3 rounded-lg mb-4 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <h2 className="text-yellow-400 text-xl font-bold">
                                        Analytics for: <span className="text-white">{selectedFunnel.token}</span>
                                    </h2>
                                    <div className="flex gap-2">
                                        <div className="flex bg-gray-700 rounded-md overflow-hidden border border-gray-600">
                                            <button 
                                                onClick={() => {
                                                    setTimeRange('7d');
                                                    if (selectedFunnel) {
                                                        handleViewAnalytics(selectedFunnel);
                                                    }
                                                }}
                                                className={`px-3 py-1 ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-600'}`}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Last 7 days"
                                            >
                                                7D
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setTimeRange('30d');
                                                    if (selectedFunnel) {
                                                        handleViewAnalytics(selectedFunnel);
                                                    }
                                                }}
                                                className={`px-3 py-1 ${timeRange === '30d' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-600'}`}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Last 30 days"
                                            >
                                                30D
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setTimeRange('90d');
                                                    if (selectedFunnel) {
                                                        handleViewAnalytics(selectedFunnel);
                                                    }
                                                }}
                                                className={`px-3 py-1 ${timeRange === '90d' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-600'}`}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Last 90 days"
                                            >
                                                90D
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedFunnel(null);
                                                setAnalyticsData(null);
                                            }}
                                            className="text-gray-300 hover:text-white bg-gray-700 p-2 rounded-md hover:bg-gray-600 border border-gray-600"
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Close analytics"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                </div>
                                <hr className="border-t border-gray-700" />

                                {loadingAnalytics ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                                            <p className="text-gray-300">Loading analytics data...</p>
                                        </div>
                                    </div>
                                ) : analyticsData ? (
                                    <div className="space-y-6">
                                        {/* Summary Statistics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="stat-card">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FontAwesomeIcon icon={faUsers} className="text-blue-400" />
                                                    <h3 className="text-gray-300 text-sm">Total Visitors</h3>
                                                </div>
                                                <p className="text-2xl font-bold text-white">
                                                    {formatNumber(analyticsData.total_visitors)}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Unique: {formatNumber(analyticsData.unique_visitors)}
                                                </p>
                                            </div>
                                            <div className="stat-card">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FontAwesomeIcon icon={faEye} className="text-green-400" />
                                                    <h3 className="text-gray-300 text-sm">Page Views</h3>
                                                </div>
                                                <p className="text-2xl font-bold text-white">
                                                    {formatNumber(analyticsData.page_views)}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Views per visitor: {(analyticsData.page_views / analyticsData.total_visitors).toFixed(1)}
                                                </p>
                                            </div>
                                            <div className="stat-card">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FontAwesomeIcon icon={faChartLine} className="text-purple-400" />
                                                    <h3 className="text-gray-300 text-sm">Avg. Duration</h3>
                                                </div>
                                                <p className="text-2xl font-bold text-white">
                                                    {formatDuration(analyticsData.avg_session_duration)}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Session length
                                                </p>
                                            </div>
                                            <div className="stat-card">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FontAwesomeIcon icon={faChartBar} className="text-red-400" />
                                                    <h3 className="text-gray-300 text-sm">Bounce Rate</h3>
                                                </div>
                                                <p className="text-2xl font-bold text-white">
                                                    {analyticsData.bounce_rate.toFixed(1)}%
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Single-page visits
                                                </p>
                                            </div>
                                        </div>

                                        {/* Visitors Chart */}
                                        <div className="chart-container">
                                            <h3 className="text-yellow-400 text-lg font-semibold mb-4 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faChartLine} />
                                                Visitors Over Time
                                            </h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={analyticsData.daily_visits}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        stroke="#9ca3af"
                                                        tick={{ fill: '#9ca3af' }}
                                                    />
                                                    <YAxis 
                                                        stroke="#9ca3af"
                                                        tick={{ fill: '#9ca3af' }}
                                                    />
                                                    <RechartsTooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: '#1f2937', 
                                                            borderColor: '#4b5563',
                                                            borderRadius: '6px',
                                                            color: '#d1d5db'
                                                        }}
                                                        labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                                                        formatter={(value: number) => [value, 'Visitors']}
                                                    />
                                                    <Legend 
                                                        wrapperStyle={{ color: '#9ca3af' }}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="visits" 
                                                        stroke="#8884d8" 
                                                        strokeWidth={3}
                                                        name="Visitors"
                                                        dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Traffic Sources & Devices */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Traffic Sources */}
                                            <div className="chart-container">
                                                <h3 className="text-yellow-400 text-lg font-semibold mb-4 flex items-center gap-2">
                                                    <FontAwesomeIcon icon={faGlobe} />
                                                    Traffic Sources
                                                </h3>
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <PieChart>
                                                        <Pie
                                                            data={analyticsData.traffic_sources}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="visitors"
                                                        >
                                                            {analyticsData.traffic_sources.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip 
                                                            formatter={(value: number, name: string, props: any) => {
                                                                const percentage = props.payload.percentage || 0;
                                                                return [`${value} visitors (${percentage.toFixed(1)}%)`, name];
                                                            }}
                                                            contentStyle={{ 
                                                                backgroundColor: '#1f2937', 
                                                                borderColor: '#4b5563',
                                                                borderRadius: '6px',
                                                                color: '#d1d5db'
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Devices */}
                                            <div className="chart-container">
                                                <h3 className="text-yellow-400 text-lg font-semibold mb-4 flex items-center gap-2">
                                                    <FontAwesomeIcon icon={faDesktop} />
                                                    Device Usage
                                                </h3>
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={analyticsData.devices}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                        <XAxis 
                                                            dataKey="device" 
                                                            stroke="#9ca3af"
                                                            tick={{ fill: '#9ca3af' }}
                                                        />
                                                        <YAxis 
                                                            stroke="#9ca3af"
                                                            tick={{ fill: '#9ca3af' }}
                                                        />
                                                        <RechartsTooltip 
                                                            formatter={(value: number, name: string, props: any) => {
                                                                const percentage = props.payload.percentage || 0;
                                                                return [`${value} visitors (${percentage.toFixed(1)}%)`, name];
                                                            }}
                                                            contentStyle={{ 
                                                                backgroundColor: '#1f2937', 
                                                                borderColor: '#4b5563',
                                                                borderRadius: '6px',
                                                                color: '#d1d5db'
                                                            }}
                                                        />
                                                        <Bar 
                                                            dataKey="visitors" 
                                                            fill="#82ca9d" 
                                                            radius={[4, 4, 0, 0]}
                                                            name="Visitors"
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Top Locations - FIXED */}
                                        <div className="chart-container">
                                            <h3 className="text-yellow-400 text-lg font-semibold mb-4 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                                                Top Visitor Locations
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-gray-300">
                                                    <thead>
                                                        <tr className="border-b border-gray-700">
                                                            <th className="text-left py-3 px-4 text-sm font-semibold">Country</th>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold">City</th>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold">Visitors</th>
                                                            <th className="text-left py-3 px-4 text-sm font-semibold">Percentage</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {analyticsData.locations.slice(0, 5).map((location, index) => (
                                                            <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors">
                                                                <td className="py-3 px-4 flex items-center gap-2">
                                                                    <FontAwesomeIcon icon={faGlobeAmericasSolid} className="text-blue-400" />
                                                                    {location.country || 'Unknown'}
                                                                </td>
                                                                <td className="py-3 px-4">{location.city || 'Unknown'}</td>
                                                                <td className="py-3 px-4 font-semibold">{location.visitors}</td>
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-24 bg-gray-700 rounded-full h-2">
                                                                            <div 
                                                                                className="bg-yellow-500 h-2 rounded-full" 
                                                                                style={{ 
                                                                                    width: `${(location.visitors / analyticsData.total_visitors) * 100}%` 
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="text-sm">
                                                                            {analyticsData.total_visitors > 0 
                                                                                ? ((location.visitors / analyticsData.total_visitors) * 100).toFixed(1)
                                                                                : '0.0'
                                                                            }%
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Top Pages */}
                                        <div className="chart-container">
                                            <h3 className="text-yellow-400 text-lg font-semibold mb-4">Top Pages</h3>
                                            <div className="space-y-3">
                                                {analyticsData.top_pages.map((page, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-gray-300 truncate text-sm">{page.url}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-white font-semibold">{page.visitors} visitors</span>
                                                            <span className="text-gray-400 text-sm">{formatDuration(page.avg_duration)} avg</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl mb-4" />
                                        <p>No analytics data available for this funnel in the selected time range.</p>
                                        <button 
                                            onClick={() => selectedFunnel && handleViewAnalytics(selectedFunnel)}
                                            className="mt-4 bg-yellow-500 text-black font-semibold px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Placeholder panel when no funnel is selected
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6 flex flex-col items-center justify-center h-full">
                                <div className="text-center">
                                    <FontAwesomeIcon 
                                        icon={faChartLine} 
                                        className="text-yellow-400 text-5xl mb-4"
                                    />
                                    <h2 className="text-yellow-400 text-xl font-bold mb-2">Select a Funnel to View Analytics</h2>
                                    <p className="text-gray-300 mb-6">
                                        Click the "View Analytics" button on any funnel to see detailed visitor statistics
                                    </p>
                                    <div className="bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-600 max-w-md">
                                        <h3 className="text-yellow-400 font-semibold mb-3 text-lg">Analytics Features:</h3>
                                        <ul className="text-gray-300 text-sm space-y-2 text-left">
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Visitor counts and trends over time</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Traffic source analysis (Direct, Search, Social, Referral)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Device and browser breakdown (Desktop vs Mobile)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Geographic visitor locations (Country & City)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Session duration and bounce rates</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Interactive charts and visualizations</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="mt-6 text-xs text-gray-400">
                                        <p>Data is collected from the <code>visitor_analytics</code> table matching funnel URLs</p>
                                        <p>Time ranges: 7 days, 30 days, or 90 days</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </main>
        </>
    );
}