import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHistory,
    faReceipt,
    faCoins,
    faDollarSign,
    faCalendarAlt,
    faCheckCircle,
    faTimes,
    faSpinner,
    faArrowLeft,
    faPlus,
    faFileInvoice,
    faPalette,
    faCube
} from '@fortawesome/free-solid-svg-icons';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Purchase = {
    id: number;
    amount: number | string;
    currency: string;
    payment_method: string;
    status: string;
    processed_at: string;
    transaction_id: string;
    invoice: {
        number: string;
        date: string;
        amount: number;
    } | null;
    theme: {
        title: string;
        price: number;
        unique_id: string;
    } | null;
};

export default function ThemePurchaseHistory() {
    const { auth, template, purchases } = usePage<SharedData>().props;
    const [loading, setLoading] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(purchases.current_page || 1);
    const [allPurchases, setAllPurchases] = useState<Purchase[]>(purchases.data);
    const [hasMore, setHasMore] = useState(purchases.current_page < purchases.last_page);

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

    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }, []);

    const getStatusIcon = useCallback((status: string) => {
        switch (status) {
            case 'completed':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
            case 'failed':
                return <FontAwesomeIcon icon={faTimes} className="text-red-500" />;
            case 'pending':
                return <FontAwesomeIcon icon={faSpinner} className="text-yellow-500 animate-spin" />;
            default:
                return <FontAwesomeIcon icon={faSpinner} className="text-gray-500" />;
        }
    }, []);

    const loadMorePurchases = useCallback(async () => {
        if (!hasMore || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/themepurchasehistory`, {
                params: { page: nextPage }
            });
            
            if (response.data.data && response.data.data.length > 0) {
                setAllPurchases(prev => [...prev, ...response.data.data]);
                setCurrentPage(nextPage);
                setHasMore(response.data.current_page < response.data.last_page);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more purchases:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMore, loading]);

    const formatAmount = useCallback((amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(num) ? '0.00' : num.toFixed(2);
    }, []);

    const formatCurrency = useCallback((amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `EZ$${formatAmount(num)}`;
    }, [formatAmount]);

    return (
        <>
            <Head>
                <title>Theme Purchase History - Your Theme Transactions</title>
                <meta name="description" content="View your theme purchase history and transactions" />
                {blurStyle}
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>
            <Tooltip id="history-tooltip" />
            <DraggableMenu auth={auth} />
            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image && isImageExtension(getImageExtension(template.image)) ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {renderTemplateContent}
                </div>
                
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl">
                        <button 
                            onClick={() => setIsPanelVisible(false)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center z-50 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Close panel"
                            data-tooltip-id="history-tooltip"
                            data-tooltip-content="Close this panel"
                        >
                            <FontAwesomeIcon 
                                icon={faTimes} 
                                className="text-white text-lg" 
                                style={{ textShadow: '0.7px 0.7px 0 rgb(255,0,0), -0.7px -0.7px 0 rgb(0,255,255)' }}
                            />
                        </button>

                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faHistory} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">Theme Purchase History</h1>
                                </div>
                                <Link 
                                    href="/themes" 
                                    className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition-colors"
                                    data-tooltip-id="history-tooltip"
                                    data-tooltip-content="Browse and purchase more themes"
                                >
                                    <FontAwesomeIcon icon={faPalette} />
                                    Browse Themes
                                </Link>
                            </div>

                            {loading && allPurchases.length === 0 ? (
                                <div className="flex justify-center items-center h-64">
                                    <FontAwesomeIcon icon={faSpinner} className="text-yellow-400 text-4xl animate-spin" />
                                </div>
                            ) : allPurchases.length === 0 ? (
                                <div className="text-center py-12">
                                    <FontAwesomeIcon icon={faReceipt} className="text-gray-400 text-5xl mb-4" />
                                    <h3 className="text-xl font-medium text-gray-300 mb-2">No theme purchases yet</h3>
                                    <p className="text-gray-400 mb-6">Your theme purchase history will appear here</p>
                                    <Link 
                                        href="/themes" 
                                        className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors"
                                        data-tooltip-id="history-tooltip"
                                        data-tooltip-content="Go to the themes marketplace"
                                    >
                                        <FontAwesomeIcon icon={faPalette} />
                                        Browse Themes
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-900/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="The purchased theme details">
                                                    Theme
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Link to the transaction invoice">
                                                    Invoice
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Total amount paid">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Payment method used">
                                                    Method
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Current status of the transaction">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Date and time of the transaction">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                            {allPurchases.map((purchase) => (
                                                <tr key={purchase.id} className="hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {purchase.theme ? (
                                                            <div className="flex items-center">
                                                                <FontAwesomeIcon 
                                                                    icon={faCube} 
                                                                    className="mr-2 text-purple-400" 
                                                                />
                                                                <div>
                                                                    <div className="text-sm font-medium text-white">
                                                                        {purchase.theme.title}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400">
                                                                        ID: {purchase.theme.unique_id}
                                                                    </div>
                                                                    <div className="text-xs text-gray-300">
                                                                        Price: {formatCurrency(purchase.theme.price)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {purchase.invoice ? (
                                                            <Link 
                                                                href={`/theme-invoice/${purchase.invoice.number}`} 
                                                                target="_blank"
                                                                className="flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                                                data-tooltip-id="history-tooltip"
                                                                data-tooltip-content="View invoice details in a new tab"
                                                            >
                                                                <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                                                                {purchase.invoice.number}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="text-sm font-medium text-white">
                                                                {formatCurrency(purchase.amount)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-300 capitalize">
                                                            {purchase.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center" data-tooltip-id="history-tooltip" data-tooltip-content={`Transaction status: ${purchase.status}`}>
                                                            {getStatusIcon(purchase.status)}
                                                            <span className="ml-2 text-sm text-gray-300 capitalize">
                                                                {purchase.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-400 mr-2" />
                                                            <span className="text-sm text-gray-300">
                                                                {formatDate(purchase.processed_at)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="mt-6 flex flex-col items-center space-y-4">
                                        <button 
                                            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            data-tooltip-id="history-tooltip"
                                            data-tooltip-content="Scroll to the top of the page"
                                        >
                                            <FontAwesomeIcon icon={faArrowLeft} />
                                            Back to Top
                                        </button>
                                        {hasMore && (
                                            <button
                                                onClick={loadMorePurchases}
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                                data-tooltip-id="history-tooltip"
                                                data-tooltip-content={hasMore ? "Load the next page of purchase history" : "No more purchases to load"}
                                            >
                                                {loading ? (
                                                    <>
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                        Loading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faPlus} />
                                                        Load More
                                                    </>
                                                )}
                                            </button>
                                        )}
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