import { useEffect, useState, useRef, useMemo } from 'react';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import '@google/model-viewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { 
    faSearch, 
    faCheckCircle, 
    faExclamationTriangle,
    faTimes,
    faEdit,
    faGlobe,
    faLink
} from '@fortawesome/free-solid-svg-icons';

type SellItem = {
    id: number;
    price: number;
    created_at: string;
};

type DomainItem = {
    id: number;
    domain: string;
    domainselected: string;
    sells?: SellItem[];
};

type Funnel = {
    id: number;
    token: string;
    created_at: string;
    custom_domains?: DomainItem[];
    handle_domains?: DomainItem[];
};

export default function EzSellPrice() {
    const { auth, template, initialFunnels } = usePage<SharedData>().props;
    const htmlBlobRef = useRef<Blob | null>(null);
    const htmlUrlRef = useRef<string | null>(null);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy' | 'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingPrice, setEditingPrice] = useState<{id: number, type: 'CUSTOM' | 'DOMAIN', value: number} | null>(null);
    
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

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

    const templateContent = useMemo(() => {
        if (!template) return null;

        // Clean up previous blob URLs
        if (htmlUrlRef.current) {
            URL.revokeObjectURL(htmlUrlRef.current);
            htmlUrlRef.current = null;
        }

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

        // Create HTML blob for fallback content
        htmlBlobRef.current = new Blob([template.image], { type: 'text/html' });
        htmlUrlRef.current = URL.createObjectURL(htmlBlobRef.current);

        return (
            <iframe
                src={htmlUrlRef.current}
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
    }, [template]);

    // Clean up blob URLs on unmount
    useEffect(() => {
        return () => {
            if (htmlUrlRef.current) {
                URL.revokeObjectURL(htmlUrlRef.current);
            }
        };
    }, []);

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
            const response = await axios.get('/search-ez-funnelsell', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: 1,
                    with: 'customDomains.sells,handleDomains.sells'
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
            const response = await axios.get('/search-ez-funnelsell', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: currentPage + 1,
                    with: 'customDomains.sells,handleDomains.sells'
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

    const handleSavePrice = async (domainId: number, type: 'CUSTOM' | 'DOMAIN', value: number) => {
        try {
            setIsSubmitting(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
			await axios.post('/save-domain-price', {
                domain_id: domainId,
                type: type,
                price: value
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            setEditingPrice(null);
            setSuccessMessage('Price updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            
            setFunnels(prevFunnels => prevFunnels.map(funnel => {
                const updateDomain = (domains: DomainItem[] | undefined) => 
                    domains?.map(domain => {
                        if (domain.id === domainId) {
                            const newSells = domain.sells && domain.sells.length > 0 
                                ? [{...domain.sells[0], price: value}]
                                : [{id: Date.now(), price: value, created_at: new Date().toISOString()}];
                            return {...domain, sells: newSells};
                        }
                        return domain;
                    });

                return {
                    ...funnel,
                    custom_domains: type === 'CUSTOM' ? updateDomain(funnel.custom_domains) : funnel.custom_domains,
                    handle_domains: type === 'DOMAIN' ? updateDomain(funnel.handle_domains) : funnel.handle_domains
                };
            }));
        } catch (error) {
            console.error('Error saving price:', error);
            setErrorMessage('Failed to save price. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit', 
            year: 'numeric'
        });
    };

    return (
        <>
            <Head>
                <title>EZ Sell Price - Manage Domain Prices</title>
                {blurStyle}
                <meta name="description" content="Manage your domain selling prices" />
                <style>{`
                    .react-tooltip {
                        z-index: 9999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>
            <Tooltip id="sell-tooltip" />
            <DraggableMenu auth={auth} /> 
            
            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image.split('.').pop()?.toLowerCase() && 
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {templateContent}
                </div>
                
                {/* Notification Messages */}
                {errorMessage && (
                    <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-100">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {errorMessage}
                    </div>
                )}
                
                {successMessage && (
                    <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-100">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                        {successMessage}
                    </div>
                )}

                <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-4xl">
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
                                    data-tooltip-id="sell-tooltip"
                                    data-tooltip-content="Search for your domains or funnels"
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
                                    data-tooltip-id="sell-tooltip"
                                    data-tooltip-content="Fuzzy search finds partial and similar matches"
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
                                    data-tooltip-id="sell-tooltip"
                                    data-tooltip-content="Exact search requires a perfect match"
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
                                    <div key={funnel.id} className="flex items-start p-4 gap-3 rounded-lg transition-all bg-[#5d0f6e] hover:bg-purple-800/80">
                                        <span className="text-4xl select-none mt-1">
                                            🍀
                                        </span>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-col gap-2">
                                                <a 
                                                    href={`https://ez.wiki/${encodeURIComponent(funnel.token)}`} 
                                                    target="_blank" 
                                                    className="text-yellow-400 font-semibold truncate hover:underline"
                                                    rel="noopener noreferrer"
                                                    data-tooltip-id="sell-tooltip"
                                                    data-tooltip-content={`Default funnel link: ez.wiki/${funnel.token}`}
                                                >
                                                    https://ez.wiki/{funnel.token}
                                                </a>
                                                
                                                {funnel.handle_domains?.map((domain) => (
                                                    <div key={domain.id} className="flex flex-col gap-1 bg-gray-900/50 p-2 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faGlobe} className="text-blue-400" />
                                                            <a 
                                                                href={`https://${domain.domain}.${domain.domainselected}`} 
                                                                target="_blank" 
                                                                className="text-yellow-400 font-semibold truncate hover:underline"
                                                                rel="noopener noreferrer"
                                                                data-tooltip-id="sell-tooltip"
                                                                data-tooltip-content={`Open ${domain.domain}.${domain.domainselected} in a new tab`}
                                                            >
                                                                https://{domain.domain}.{domain.domainselected}
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-300 whitespace-nowrap">Price:</span>
                                                            {editingPrice?.id === domain.id && editingPrice.type === 'DOMAIN' ? (
                                                                <div className="flex items-center gap-2 flex-grow">
                                                                    <div className="relative flex-grow">
                                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">EZ$</span>
                                                                        <input 
                                                                            type="number"
                                                                            step="0.01"
                                                                            defaultValue={domain.sells?.[0]?.price || 0}
                                                                            ref={input => input?.focus()}
                                                                            className="bg-gray-700/50 border border-gray-600 rounded px-2 py-1 pl-12 text-white focus:outline-none focus:border-yellow-400 flex-grow w-full"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    const rawValue = parseFloat(e.currentTarget.value);
                                                                                    handleSavePrice(domain.id, 'DOMAIN', !isNaN(rawValue) ? Math.round(rawValue * 100) / 100 : 0);
                                                                                } else if (e.key === 'Escape') {
                                                                                    setEditingPrice(null);
                                                                                }
                                                                            }}
                                                                            onBlur={(e) => {
                                                                                const rawValue = parseFloat(e.target.value);
                                                                                handleSavePrice(domain.id, 'DOMAIN', !isNaN(rawValue) ? Math.round(rawValue * 100) / 100 : 0);
                                                                            }}
                                                                            data-tooltip-id="sell-tooltip"
                                                                            data-tooltip-content="Enter new price. Press Enter or click away to save."
                                                                        />
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => setEditingPrice(null)}
                                                                        className="text-gray-300 hover:text-white"
                                                                        data-tooltip-id="sell-tooltip"
                                                                        data-tooltip-content="Cancel editing"
                                                                    >
                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div 
                                                                    className="bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-white cursor-text flex-grow flex items-center gap-2"
                                                                    onClick={() => setEditingPrice({id: domain.id, type: 'DOMAIN', value: domain.sells?.[0]?.price || 0})}
                                                                    data-tooltip-id="sell-tooltip"
                                                                    data-tooltip-content="Click to edit sell price"
                                                                >
                                                                    <span className="text-yellow-400">EZ${domain.sells?.[0]?.price || 0}</span>
                                                                    <FontAwesomeIcon icon={faEdit} className="text-gray-400 hover:text-white ml-auto" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {domain.sells?.[0]?.created_at && (
                                                            <p className="text-gray-400 text-xs">
                                                                Last updated: {formatDate(domain.sells[0].created_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                                
                                                {funnel.custom_domains?.map((domain) => (
                                                    <div key={domain.id} className="flex flex-col gap-1 bg-gray-900/50 p-2 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faLink} className="text-green-400" />
                                                            <a 
                                                                href={`https://${domain.domainselected}/${domain.domain}`} 
                                                                target="_blank" 
                                                                className="text-yellow-400 font-semibold truncate hover:underline"
                                                                rel="noopener noreferrer"
                                                                data-tooltip-id="sell-tooltip"
                                                                data-tooltip-content={`Open ${domain.domainselected}/${domain.domain} in a new tab`}
                                                            >
                                                                https://{domain.domainselected}/{domain.domain}
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-300 whitespace-nowrap">Price:</span>
                                                            {editingPrice?.id === domain.id && editingPrice.type === 'CUSTOM' ? (
                                                                <div className="flex items-center gap-2 flex-grow">
                                                                    <div className="relative flex-grow">
                                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">EZ$</span>
                                                                        <input 
                                                                            type="number" 
                                                                            step="0.01"
                                                                            defaultValue={domain.sells?.[0]?.price || 0}
                                                                            ref={input => input?.focus()}
                                                                            className="bg-gray-700/50 border border-gray-600 rounded px-2 py-1 pl-12 text-white focus:outline-none focus:border-yellow-400 flex-grow w-full"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    const rawValue = parseFloat(e.currentTarget.value);
                                                                                    handleSavePrice(domain.id, 'CUSTOM', !isNaN(rawValue) ? Math.round(rawValue * 100) / 100 : 0);
                                                                                } else if (e.key === 'Escape') {
                                                                                    setEditingPrice(null);
                                                                                }
                                                                            }}
                                                                            onBlur={(e) => {
                                                                                const rawValue = parseFloat(e.target.value);
                                                                                handleSavePrice(domain.id, 'CUSTOM', !isNaN(rawValue) ? Math.round(rawValue * 100) / 100 : 0);
                                                                            }}
                                                                            data-tooltip-id="sell-tooltip"
                                                                            data-tooltip-content="Enter new price. Press Enter or click away to save."
                                                                        />
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => setEditingPrice(null)}
                                                                        className="text-gray-300 hover:text-white"
                                                                        data-tooltip-id="sell-tooltip"
                                                                        data-tooltip-content="Cancel editing"
                                                                    >
                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div 
                                                                    className="bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-white cursor-text flex-grow flex items-center gap-2"
                                                                    onClick={() => setEditingPrice({id: domain.id, type: 'CUSTOM', value: domain.sells?.[0]?.price || 0})}
                                                                    data-tooltip-id="sell-tooltip"
                                                                    data-tooltip-content="Click to edit sell price"
                                                                >
                                                                    <span className="text-yellow-400">EZ${domain.sells?.[0]?.price || 0}</span>
                                                                    <FontAwesomeIcon icon={faEdit} className="text-gray-400 hover:text-white ml-auto" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {domain.sells?.[0]?.created_at && (
                                                            <p className="text-gray-400 text-xs">
                                                                Last updated: {formatDate(domain.sells[0].created_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                                
                                                <p className="text-purple-300 text-sm whitespace-nowrap">
                                                    Created: {formatDate(funnel.created_at)}
                                                </p>
                                            </div>
                                        </div>
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
                                    data-tooltip-id="sell-tooltip"
                                    data-tooltip-content="Load the next page of results"
                                >
                                    {isSubmitting ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}