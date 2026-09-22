import { useEffect, useState, useRef, useMemo } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import '@google/model-viewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import Draggable from 'react-draggable';
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
    faHashtag
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

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
    effect_settings?: Array<{
        id: number;
        moving_effect: string;
        moving_pattern: string;
        brand_message: string;
        avatar_link: string;
        landing_page: string;
    }>;
    seo_settings?: {
        meta_title: string;
        meta_keywords: string;
        meta_description: string;
        meta_logo: string;
        meta_site_name: string;
        meta_site_url: string;
    };
};

type SeoData = {
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
    metaLogo: string;
    metaSiteName: string;
    metaSiteUrl: string;
};

export default function EzSEO() {
    const { auth, template, initialFunnels } = usePage<SharedData>().props;
    const dragRef = useRef<HTMLDivElement>(null);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy' | 'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [seoPreview, setSeoPreview] = useState(false);
    const [htmlUrl, setHtmlUrl] = useState<string | null>(null);
    
    const [selectedFunnel, setSelectedFunnel] = useState<null | {
        id: number;
        token: string;
    }>(null);
    
    const [seoData, setSeoData] = useState<SeoData>({
        metaTitle: '',
        metaKeywords: '',
        metaDescription: '',
        metaLogo: '',
        metaSiteName: '',
        metaSiteUrl: ''
    });

    // Debounce search query
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Create HTML URL for iframe content
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
            const response = await axios.get('/search-ez-funnels', {
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
        }
    };

    const loadMore = async () => {
        try {
            setIsSubmitting(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await axios.get('/search-ez-funnels', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: currentPage + 1,
                    with: 'customDomains,handleDomains,effectSettings,seoSettings'
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
            setIsSubmitting(false);
        }
    };

    const handleEditSEO = async (funnel: { id: number; token: string }) => {
        setSelectedFunnel(funnel);
        setIsSubmitting(true);
        
        try {
            const response = await axios.get(`/get-funnel-seo/${funnel.id}`);
            const existingSeo = response.data;
            
            setSeoData({
                metaTitle: existingSeo.meta_title || '',
                metaKeywords: existingSeo.meta_keywords || '',
                metaDescription: existingSeo.meta_description || '',
                metaLogo: existingSeo.meta_logo || '',
                metaSiteName: existingSeo.meta_site_name || '',
                metaSiteUrl: existingSeo.meta_site_url || `https://ez.wiki/${funnel.token}`
            });
        } catch (error) {
            console.error('Error fetching SEO data:', error);
            setSeoData({
                metaTitle: '',
                metaKeywords: '',
                metaDescription: '',
                metaLogo: '',
                metaSiteName: '',
                metaSiteUrl: `https://ez.wiki/${funnel.token}`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSeoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        if (!selectedFunnel) return;

        try {
            const response = await axios.put('/update-funnel-seo', {
                funnelId: selectedFunnel.id,
                metaTitle: seoData.metaTitle,
                metaKeywords: seoData.metaKeywords,
                metaDescription: seoData.metaDescription,
                metaLogo: seoData.metaLogo,
                metaSiteName: seoData.metaSiteName,
                metaSiteUrl: seoData.metaSiteUrl
            });

            setSuccessMessage('SEO settings updated successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
            
            if (response.data.seo) {
                setSeoData({
                    metaTitle: response.data.seo.meta_title || '',
                    metaKeywords: response.data.seo.meta_keywords || '',
                    metaDescription: response.data.seo.meta_description || '',
                    metaLogo: response.data.seo.meta_logo || '',
                    metaSiteName: response.data.seo.meta_site_name || '',
                    metaSiteUrl: response.data.seo.meta_site_url || `https://ez.wiki/${selectedFunnel.token}`
                });
            }
        } catch (error) {
            console.error('SEO update error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to update SEO settings. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
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

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
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

    const renderSeoPreview = () => {
        return (
            <div className="bg-white text-gray-800 p-4 rounded-lg shadow-lg max-w-md mx-auto mt-4">
                <div className="border-b border-gray-200 pb-2 mb-2">
                    <h3 className="text-blue-600 text-lg font-medium truncate">{seoData.metaTitle || 'Your Page Title'}</h3>
                    <p className="text-green-700 text-sm">{seoData.metaSiteUrl || 'https://example.com'}</p>
                </div>
                <p className="text-gray-600 text-sm">
                    {seoData.metaDescription || 'This is a preview of how your page might appear in search results.'}
                </p>
                {seoData.metaLogo && (
                    <div className="mt-2">
                        <img 
                            src={seoData.metaLogo} 
                            alt="Site Logo" 
                            className="h-16 w-16 object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head>
                <title>EZ SEO - Customize Your Funnel SEO</title>
                {blurStyle}
                <meta name="description" content="Optimize your funnel's SEO settings for better search engine visibility" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
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
                <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl">
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
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                                                🍀
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
                                                onClick={() => handleEditSEO(funnel)}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Edit SEO settings for this funnel"
                                            >
                                                {selectedFunnel?.id === funnel.id ? 'Editing' : 'Edit SEO'}
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
                                        disabled={isSubmitting}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Load more of your funnels"
                                    >
                                        {isSubmitting ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right side - Show either SEO form or placeholder */}
                        {selectedFunnel ? (
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                                {successMessage && (
                                    <div className="bg-green-500/90 text-white p-3 rounded-lg mb-4 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        {successMessage}
                                    </div>
                                )}
                                {errorMessage && (
                                    <div className="bg-red-500/90 text-white p-3 rounded-lg mb-4 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <h2 className="text-yellow-400 text-xl font-bold">
                                        Editing SEO for: <span className="text-white">{selectedFunnel.token}</span>
                                    </h2>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSeoPreview(!seoPreview)}
                                            className="text-gray-300 hover:text-white bg-gray-700 p-2 rounded-md"
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Toggle SEO preview"
                                        >
                                            <FontAwesomeIcon icon={faSearch} />
                                        </button>
                                        <button 
                                            onClick={() => setSelectedFunnel(null)}
                                            className="text-gray-300 hover:text-white bg-gray-700 p-2 rounded-md"
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Close SEO editor"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                </div>
                                <hr className="border-t border-gray-700" />

                                {seoPreview && renderSeoPreview()}

                                <form onSubmit={handleSeoSubmit} className="space-y-6">
                                    {/* Meta Title */}
                                    <div>
                                        <label htmlFor="meta-title" className="block text-yellow-400 mb-2 font-semibold">
                                            Meta Title <span className="text-gray-400 text-xs">(60 characters max)</span>
                                        </label>
                                        <div className="relative">
                                            <input 
                                                id="meta-title" 
                                                type="text" 
                                                placeholder="Page title that appears in search results" 
                                                className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400"
                                                value={seoData.metaTitle}
                                                onChange={(e) => setSeoData({...seoData, metaTitle: e.target.value})}
                                                maxLength={60}
                                                data-tooltip-id="form-tooltip"
                                                data-tooltip-content="This is the main title shown in search engine results."
                                            />
                                            <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                                                {seoData.metaTitle.length}/60
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta Keywords */}
                                    <div>
                                        <label htmlFor="meta-keywords" className="block text-yellow-400 mb-2 font-semibold">
                                            Meta Keywords <span className="text-gray-400 text-xs">(Comma separated)</span>
                                        </label>
                                        <textarea 
                                            id="meta-keywords" 
                                            placeholder="keywords, for, search, engines" 
                                            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 h-24"
                                            value={seoData.metaKeywords}
                                            onChange={(e) => setSeoData({...seoData, metaKeywords: e.target.value})}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="Enter relevant keywords separated by commas."
                                        />
                                    </div>

                                    {/* Meta Description */}
                                    <div>
                                        <label htmlFor="meta-description" className="block text-yellow-400 mb-2 font-semibold">
                                            Meta Description <span className="text-gray-400 text-xs">(160 characters max)</span>
                                        </label>
                                        <div className="relative">
                                            <textarea 
                                                id="meta-description" 
                                                placeholder="Brief description that appears in search results" 
                                                className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 h-24"
                                                value={seoData.metaDescription}
                                                onChange={(e) => setSeoData({...seoData, metaDescription: e.target.value})}
                                                maxLength={160}
                                                data-tooltip-id="form-tooltip"
                                                data-tooltip-content="This summary appears below the title in search results."
                                            />
                                            <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                                                {seoData.metaDescription.length}/160
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta Logo */}
                                    <div>
                                        <label htmlFor="meta-logo" className="block text-yellow-400 mb-2 font-semibold">
                                            Meta Logo URL <span className="text-gray-400 text-xs">(Recommended: 1200x630px)</span>
                                        </label>
                                        <input 
                                            id="meta-logo" 
                                            type="url" 
                                            placeholder="https://example.com/logo.png" 
                                            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400"
                                            value={seoData.metaLogo}
                                            onChange={(e) => setSeoData({...seoData, metaLogo: e.target.value})}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="URL of the image to show in social media shares."
                                        />
                                        {seoData.metaLogo && (
                                            <div className="mt-2">
                                                <img 
                                                    src={seoData.metaLogo} 
                                                    alt="Logo Preview" 
                                                    className="max-h-20 max-w-full object-contain border border-gray-600 rounded"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta Site Name */}
                                    <div>
                                        <label htmlFor="meta-site-name" className="block text-yellow-400 mb-2 font-semibold">
                                            Site/Brand Name
                                        </label>
                                        <input 
                                            id="meta-site-name" 
                                            type="text" 
                                            placeholder="Your brand or company name" 
                                            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400"
                                            value={seoData.metaSiteName}
                                            onChange={(e) => setSeoData({...seoData, metaSiteName: e.target.value})}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="The name of your site or brand."
                                        />
                                    </div>

                                    {/* Meta Site Url */}
                                    <div>
                                        <label htmlFor="meta-site-url" className="block text-yellow-400 mb-2 font-semibold">
                                            Canonical URL
                                        </label>
                                        <input 
                                            id="meta-site-url" 
                                            type="url" 
                                            placeholder="https://example.com" 
                                            className="w-full p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400"
                                            value={seoData.metaSiteUrl}
                                            onChange={(e) => setSeoData({...seoData, metaSiteUrl: e.target.value})}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="The primary URL for this page."
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-between pt-6">
                                        <button 
                                            type="button" 
                                            onClick={() => setSeoPreview(!seoPreview)}
                                            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="See how your SEO info will look in search results"
                                        >
                                            {seoPreview ? 'Hide Preview' : 'Show Preview'}
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="bg-green-600 text-white font-semibold px-8 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            disabled={isSubmitting}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Save your SEO settings"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faSave} />
                                                    Save SEO Settings
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            // Placeholder panel when no funnel is selected
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6 flex flex-col items-center justify-center h-full">
                                <div className="text-center">
                                    <FontAwesomeIcon 
                                        icon={faHandPointer} 
                                        className="text-yellow-400 text-5xl mb-4 animate-bounce"
                                    />
                                    <h2 className="text-yellow-400 text-xl font-bold mb-2">Select a Funnel to Edit SEO</h2>
                                    <p className="text-gray-300 mb-6">
                                        Click the "Edit SEO" button on any funnel to customize its SEO settings
                                    </p>
                                    <div className="bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-600 max-w-md">
                                        <h3 className="text-yellow-400 font-semibold mb-3 text-lg">SEO Benefits:</h3>
                                        <ul className="text-gray-300 text-sm space-y-2 text-left">
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Improve search engine rankings</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Enhance click-through rates</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Better social media sharing</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Increase organic traffic</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                                <span>Boost brand visibility</span>
                                            </li>
                                        </ul>
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