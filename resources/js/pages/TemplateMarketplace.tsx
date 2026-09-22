import { useEffect, useState, useRef, useMemo } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DraggableMenu from '@/components/DraggableMenu';
import AppLogoIcon from '@/components/app-logo-icon';
import axios from 'axios';
import Draggable from 'react-draggable';
import TemplateListings from '@/components/TemplateListings';
import { 
    faSearch, 
    faCheckCircle, 
    faExclamationTriangle,
    faTimes,
    faEdit,
    faGlobe,
    faLink,
    faShoppingCart,
    faCoins,
    faBolt,
    faHashtag,
    faImage,
    faPalette,
    faReceipt,
    faSignInAlt,
    faUserPlus,
    faBuilding,
    faStore,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

type TemplateItem = {
    id: number;
    title: string;
    image: string;
    unique_id: string;
    description?: string;
    price: number;
    status: string;
    option?: string;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        email: string;
    };
};

type AuthData = {
    user?: {
        id: number;
        name: string;
        email: string;
    };
    balance?: {
        balance: number;
    };
};

type Filters = {
    min_price?: number;
    max_price?: number;
    search?: string;
};

type Template = {
    image: string;
    user_id: number;
    option?: string;
};

type Pagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

// Stripe Checkout Form Component
const StripeCheckoutForm = ({
    price,
    email,
    clientSecret,
    onSuccess,
    onBack,
    onError,
}: {
    price: number;
    email: string;
    clientSecret: string;
    onSuccess: () => void;
    onBack: () => void;
    onError: (message: string) => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (!stripe || !elements) {
            setError('Payment system not ready. Please try again.');
            return;
        }

        setIsProcessing(true);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message || 'Payment form validation failed');
                return;
            }

            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                    receipt_email: email,
                    payment_method_data: {
                        billing_details: {
                            email: email
                        }
                    }
                },
                clientSecret,
                redirect: 'if_required',
            });

            if (stripeError) {
                setError(stripeError.message || 'Payment failed');
                return;
            }

            if (!paymentIntent) {
                setError('Payment processing failed. No payment intent received.');
                return;
            }

            switch (paymentIntent.status) {
                case 'succeeded':
                    onSuccess();
                    break;
                case 'requires_action':
                    setError('Payment requires additional authentication. Please complete the verification.');
                    break;
                case 'processing':
                    setError('Payment is processing. Please wait for confirmation.');
                    break;
                case 'requires_payment_method':
                case 'canceled':
                case 'requires_confirmation':
                default:
                    setError(`Payment failed. Status: ${paymentIntent.status}`);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Payment processing failed. Please try again.';
            setError(message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div className="mb-4 p-3 bg-red-500/90 text-white rounded-lg flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {error}
                </div>
            )}

            <div className="mt-4 text-sm text-gray-300">
                <div className="flex items-center justify-between mb-2">
                    <span>Email:</span>
                    <span className="text-yellow-400">{email}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span>Amount:</span>
                    <span className="text-yellow-400">US${price.toFixed(2)}</span>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        fields: {
                            billingDetails: {
                                email: 'auto',
                            }
                        }
                    }}
                    onReady={() => setIsPaymentElementReady(true)}
                />
            </div>

            <div className="mt-6">
                <button
                    type="submit"
                    disabled={isProcessing || !stripe || !isPaymentElementReady}
                    className={`w-full bg-yellow-400 text-black font-bold py-3 px-4 rounded-full hover:bg-yellow-500 transition-colors ${
                        isProcessing || !stripe || !isPaymentElementReady ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                >
                    {isProcessing ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            Processing...
                        </>
                    ) : `Rent for US$${price.toFixed(2)}`}
                </button>
            </div>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-yellow-400 hover:underline"
                >
                    Back to email
                </button>
                <p className="mt-2 text-xs text-gray-500">
                    Payment secured by STRIPE. You'll be redirected after payment.
                </p>
            </div>
        </form>
    );
};

export default function TemplateMarketplace() {
    const { auth, templates: initialTemplates, filters: initialFilters, template, pagination: initialPagination } = usePage<{
        auth: AuthData;
        templates: TemplateItem[];
        filters: Filters;
        template?: Template;
        pagination: Pagination;
    }>().props;

    const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [balance, setBalance] = useState(auth.balance?.balance || 0);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Payment modal states
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
    const [email, setEmail] = useState(auth.user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userExists, setUserExists] = useState<boolean | null>(null);

    // Stripe payment states
    const [paymentStep, setPaymentStep] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntentId, setPaymentIntentId] = useState('');

    // Theme collection states
    const [themeCollections, setThemeCollections] = useState<{[key: number]: {isInCollection: boolean, isThemeOwner: boolean}}>({});

    const htmlBlobRef = useRef<Blob | null>(null);
    const htmlUrlRef = useRef<string | null>(null);
    const dragRef = useRef(null);

    // Add this function to check theme collection by email
    const checkThemeCollectionByEmail = async (email: string, templateId: number) => {
        if (!email || !templateId) return { isInCollection: false, isThemeOwner: false };
        
        try {
            const response = await axios.post('/theme/check-collection-by-email', {
                email: email,
                theme_id: templateId
            });
            return {
                isInCollection: response.data.isInCollection || false,
                isThemeOwner: response.data.is_theme_owner || false
            };
        } catch (error) {
            console.error('Error checking theme collection by email:', error);
            return { isInCollection: false, isThemeOwner: false };
        }
    };

    // Add this function to refresh collections for all templates
    const refreshAllCollections = async () => {
        if (!email) return;
        
        const collections: {[key: number]: {isInCollection: boolean, isThemeOwner: boolean}} = {};
        for (const template of templates) {
            try {
                const { isInCollection, isThemeOwner } = await checkThemeCollectionByEmail(email, template.id);
                collections[template.id] = { isInCollection, isThemeOwner };
            } catch (error) {
                collections[template.id] = { isInCollection: false, isThemeOwner: false };
            }
        }
        setThemeCollections(collections);
    };

    // Check user existence when email changes
    useEffect(() => {
        const checkUserExists = async () => {
            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                try {
                    const response = await axios.post('/check-user-exists', {
                        email: email
                    }, {
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        }
                    });
                    setUserExists(response.data.exists);
                } catch (error) {
                    console.error('Error checking user existence:', error);
                    setUserExists(null);
                }
            } else {
                setUserExists(null);
            }
        };

        const timer = setTimeout(() => {
            checkUserExists();
        }, 500);

        return () => clearTimeout(timer);
    }, [email]);

    // Check collections when email changes or when templates update
    useEffect(() => {
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            refreshAllCollections();
        }
    }, [email, templates]);

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

    const fetchFilteredTemplates = async (newFilters: Filters) => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('templatemarketplace.loadmore'), {
                params: {
                    ...newFilters,
                    page: 1
                }
            });

            setTemplates(response.data.templates);
            setPagination(response.data.pagination);
            setFilters(newFilters);
        } catch (error) {
            console.error('Error fetching filtered Themes:', error);
            setErrorMessage('Failed to apply filters. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (newFilters: Filters) => {
        fetchFilteredTemplates(newFilters);
    };

    const loadMoreTemplates = async () => {
        if (isLoading || pagination.current_page >= pagination.last_page) return;
        
        setIsLoading(true);
        try {
            const response = await axios.get(route('templatemarketplace.loadmore'), {
                params: {
                    ...filters,
                    page: pagination.current_page + 1
                }
            });

            setTemplates([...templates, ...response.data.templates]);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error loading more Themes:', error);
            setErrorMessage('Failed to load more Themes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const templateContent = useMemo(() => {
        if (!template) return null;

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

    useEffect(() => {
        return () => {
            if (htmlUrlRef.current) {
                URL.revokeObjectURL(htmlUrlRef.current);
            }
        };
    }, []);

    const getCurrencySymbol = () => {
        return auth.user ? 'EZ$' : 'US$';
    };

    // Handle template rental with Stripe
    const handleTemplateRental = async () => {
        if (!selectedTemplate) return;
        
        setIsPurchasing(true);
        setErrorMessage('');
        
        try {
            // Check theme collection by email
            let themeInCollectionByEmail = false;
            let themeOwnerStatus = false;
            
            if (!auth.user) {
                const { isInCollection: collectionStatus, isThemeOwner: ownerStatus } = 
                    await checkThemeCollectionByEmail(email, selectedTemplate.id);
                themeInCollectionByEmail = collectionStatus;
                themeOwnerStatus = ownerStatus;
            } else {
                themeOwnerStatus = themeCollections[selectedTemplate.id]?.isThemeOwner || false;
                themeInCollectionByEmail = themeCollections[selectedTemplate.id]?.isInCollection || false;
            }

            // If user already owns or has the theme in collection, show alert and return
            if (themeOwnerStatus || themeInCollectionByEmail) {
                setErrorMessage('You already own or have this theme in your collection!');
                setIsPurchasing(false);
                return;
            }

            // If template is free, use free rental
            if (selectedTemplate.price === 0) {
                const response = await axios.post('/theme/free-template-purchase', {
                    email,
                    password: (!auth.user && !userExists) ? password : undefined,
                    template_id: selectedTemplate.id,
                    coupon_code: ''
                });

                if (response.data.success) {
                    setSuccessMessage('Theme rented successfully!');
                    setIsPaymentModalOpen(false);
                    setSelectedTemplate(null);
                    
                    // Update theme collections
                    setThemeCollections(prev => ({
                        ...prev,
                        [selectedTemplate.id]: {
                            isInCollection: true,
                            isThemeOwner: response.data.is_theme_owner
                        }
                    }));

                    // Remove rented template from list
                    setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
                } else {
                    throw new Error(response.data.error || 'Free rental failed');
                }
            } else {
                // Use Stripe payment for non-free templates
                const response = await axios.post('/theme/initiate-template-payment', {
                    email,
                    password: (!auth.user && !userExists) ? password : undefined,
                    template_id: selectedTemplate.id,
                    price: selectedTemplate.price,
                    promo_price: selectedTemplate.price,
                    coupon_code: '',
                    payment_method: 'usd'
                });

                if (response.data.clientSecret) {
                    setClientSecret(response.data.clientSecret);
                    setPaymentIntentId(response.data.payment_intent_id);
                    setPaymentStep(2);
                } else {
                    throw new Error('Failed to initialize payment');
                }
            }
        } catch (error) {
            let errorMessage = 'An error occurred during rental';
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.error || error.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            setErrorMessage(errorMessage);
        } finally {
            setIsPurchasing(false);
        }
    };

    // Handle Stripe payment success
    const handleStripePaymentSuccess = async () => {
        setIsPurchasing(true);
        try {
            const response = await axios.post('/theme/template-payment-success', {
                payment_intent_id: paymentIntentId,
                template_id: selectedTemplate?.id,
            });

            if (response.data.success) {
                setSuccessMessage('Theme rented successfully!');
                setIsPaymentModalOpen(false);
                setSelectedTemplate(null);
                setPaymentStep(1);
                
                // Update theme collections
                if (selectedTemplate) {
                    setThemeCollections(prev => ({
                        ...prev,
                        [selectedTemplate.id]: {
                            isInCollection: true,
                            isThemeOwner: response.data.is_theme_owner
                        }
                    }));

                    // Remove rented template from list
                    setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
                }
            } else {
                throw new Error(response.data.error || 'Payment verification failed');
            }
        } catch (error) {
            const message = axios.isAxiosError(error) 
                ? error.response?.data?.error || error.message
                : 'Payment verification failed';
            setErrorMessage(message);
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <>
            <Head>
                <title>Theme Marketplace - Rent Themes</title>
                {blurStyle}
                <meta name="description" content="Marketplace for renting Themes with EZ$" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>

            {/* Tooltip components */}
            <Tooltip id="nav-tooltip" />
            <Tooltip id="action-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="modal-tooltip" />

            {auth.user ? (
                <DraggableMenu auth={auth} />   
            ) : (
                <Draggable 
                    nodeRef={dragRef}
                    bounds="parent"
                    cancel=".no-drag"
                    defaultPosition={{x: window.innerWidth - 650, y: 0}}
                >
                    <div ref={dragRef} className="space-x-4 z-10 absolute mt-5 cursor-move touch-none">
                        <div className="flex items-center gap-4">
                            <Link 
                                href={route('home')}
                                className="flex items-center px-2 py-0 rounded-full bg-[#235A72] no-drag transition-colors duration-300 hover:bg-[#1C4A5E]"
                                data-tooltip-id="nav-tooltip"
                                data-tooltip-content="Go to Homepage"
                            >
                                <AppLogoIcon className="size-8 fill-current text-[#8EF587]" />
                                <span className="ml-2 text-[#8EF587]">ez.wiki</span>
                            </Link>
                            <Link 
                                href={route('demodesign')} 
                                className="group no-drag" 
                                data-tooltip-id="nav-tooltip" 
                                data-tooltip-content="Rent and Own a Branded Staging Portal in WiKi 2.0, Supported by Crowdsourcing"
                            >
                                <span className="flex items-center gap-2 bg-orange-500 text-white font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-orange-600 cursor-pointer">
                                    <FontAwesomeIcon icon={faBuilding} className="text-white" />
                                    <span className="hidden group-hover:inline">EXPRESS DOMAIN</span>
                                </span>
                            </Link>
                            <Link 
                                href={route('login')} 
                                className="group no-drag" 
                                data-tooltip-id="nav-tooltip" 
                                data-tooltip-content="Sign in to your account"
                            >
                                <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                    <FontAwesomeIcon icon={faSignInAlt} className="text-[#8EF587]" />
                                    <span className="hidden group-hover:inline">SIGN IN</span>
                                </span>
                            </Link>

                            <Link 
                                href={route('register')} 
                                className="group no-drag" 
                                data-tooltip-id="nav-tooltip" 
                                data-tooltip-content="Create a new account"
                            >
                                <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                    <FontAwesomeIcon icon={faUserPlus} className="text-[#8EF587]" />
                                    <span className="hidden group-hover:inline">SIGN UP</span>
                                </span>
                            </Link>
                           <Link 
                                href={route('marketplace')} 
                                className="group no-drag" 
                                data-tooltip-id="nav-tooltip" 
                                data-tooltip-content="Browse the marketplace"
                            >
                                <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                    <FontAwesomeIcon icon={faStore} className="text-[#8EF587]" />
                                    <span className="hidden group-hover:inline">DOMAIN MART</span>
                                </span>
                            </Link>
							<Link 
                                href={route('templatemarketplace')} 
                                className="group no-drag" 
                                data-tooltip-id="nav-tooltip" 
                                data-tooltip-content="Browse the theme marketplace"
                            >
                                <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                    <FontAwesomeIcon icon={faPalette} className="text-[#8EF587]" />
                                    <span className="hidden group-hover:inline">THEME RENTAL</span>
                                </span>
                            </Link>
                        </div>
                    </div>
                </Draggable>
            )}

            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image.split('.').pop()?.toLowerCase() && 
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {templateContent}
                </div>
                
                {errorMessage && (
                    <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-1000 flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {errorMessage}
                    </div>
                )}
                
                {successMessage && (
                    <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-1000 flex items-center">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                        {successMessage}
                        {successMessage.includes('Invoice') && (
                            <FontAwesomeIcon icon={faReceipt} className="ml-2" />
                        )}
                    </div>
                )}

                {showBalanceModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-100 p-4">
                        <div className="backdrop-blur-sm rounded-xl p-6 max-w-md w-full border border-yellow-500">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                                    {auth.user ? 'Insufficient Balance' : 'Login Required'}
                                </h3>
                                <button 
                                    onClick={() => setShowBalanceModal(false)}
                                    className="text-gray-400 hover:text-white"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Close"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <p className="text-gray-300 mb-6">
                                {auth.user 
                                    ? "You don't have enough EZ$ to complete this rental. Please purchase more EZ$ to continue."
                                    : "You need to be logged in to rent Themes with EZ$. Please login or register to continue."
                                }
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowBalanceModal(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Cancel rental"
                                >
                                    Cancel
                                </button>
                                {auth.user ? (
                                    <a
                                        href={route('purchase')}
                                        target="_blank"
                                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white font-semibold flex items-center"
                                        data-tooltip-id="modal-tooltip"
                                        data-tooltip-content="Go to the purchase page to add funds"
                                    >
                                        <FontAwesomeIcon icon={faCoins} className="mr-2" />
                                        Purchase EZ$
                                    </a>
                                ) : (
                                    <a
                                        href={route('login')}
                                        target="_blank"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold flex items-center"
                                        data-tooltip-id="modal-tooltip"
                                        data-tooltip-content="Proceed to the login page"
                                    >
                                        <FontAwesomeIcon icon={faGlobe} className="mr-2" />
                                        Go to Login
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showLoginModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-100 p-4">
                        <div className="backdrop-blur-sm rounded-xl p-6 max-w-md w-full border border-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-blue-400 flex items-center">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                                    Login Required
                                </h3>
                                <button 
                                    onClick={() => setShowLoginModal(false)}
                                    className="text-gray-400 hover:text-white"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Close"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <p className="text-gray-300 mb-6">
                                You need to be logged in to rent Themes. Please login or register to continue.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowLoginModal(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Dismiss this message"
                                >
                                    Cancel
                                </button>
                                <a
                                    href={route('login')}
                                    target="_blank"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold flex items-center"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Proceed to the login page"
                                >
                                    <FontAwesomeIcon icon={faGlobe} className="mr-2" />
                                    Go to Login
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stripe Payment Modal */}
                {isPaymentModalOpen && selectedTemplate && (
                    <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                        <div className="bg-[#235A72] border border-[#3a7a94] text-white p-8 rounded-lg shadow-lg max-w-md w-full relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => {
                                    setIsPaymentModalOpen(false);
                                    setSelectedTemplate(null);
                                    setErrorMessage('');
                                    setPaymentStep(1);
                                    setClientSecret('');
                                }}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
                                disabled={isPurchasing}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {paymentStep === 1 ? (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/20 bg-gradient-to-br from-white/15 to-transparent shadow-lg mx-auto">
                                            <img
                                                src="https://ez.wiki/logo.gif"
                                                className="w-10 h-10 rounded-full object-cover"
                                                alt="ez.wiki Logo"
                                            />
                                        </div>
                                        <h2 className="text-xl font-bold mt-4 text-white">
                                            Theme Rental
                                        </h2>
                                        <p className="text-[#a8d0e6] mt-2">
                                            {selectedTemplate.title}
                                        </p>
                                        
                                        {/* Theme ownership status */}
                                        {themeCollections[selectedTemplate.id]?.isThemeOwner && (
                                            <p className="text-green-400 text-sm mt-1">
                                                ✓ You own this theme
                                            </p>
                                        )}
                                        {themeCollections[selectedTemplate.id]?.isInCollection && !themeCollections[selectedTemplate.id]?.isThemeOwner && (
                                            <p className="text-green-400 text-sm mt-1">
                                                ✓ Already in your collection
                                            </p>
                                        )}
                                        
                                        <div className="bg-[#2a6b87] p-4 rounded-lg mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-300">Theme Price:</span>
                                                <span className="text-yellow-400">US${Number(selectedTemplate.price).toFixed(2)}</span>
                                            </div>
                                            {(themeCollections[selectedTemplate.id]?.isThemeOwner || themeCollections[selectedTemplate.id]?.isInCollection) && (
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-300">Final Price:</span>
                                                    <span className="text-green-400 font-bold">US$0.00</span>
                                                </div>
                                            )}
                                            {!themeCollections[selectedTemplate.id]?.isThemeOwner && !themeCollections[selectedTemplate.id]?.isInCollection && (
                                                <div className="flex justify-between items-center mb-2 border-t border-gray-600 pt-2">
                                                    <span className="text-gray-300 font-bold">Total:</span>
                                                    <span className="text-green-400 font-bold">US${Number(selectedTemplate.price).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-[#2a6b87] p-4 rounded-lg">
                                        {!auth.user && !userExists && (
                                            <div className="mb-4">
                                                <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
                                                    Create Account
                                                </h3>
                                            </div>
                                        )}
                                        
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-1">
                                                {auth.user ? 'Email Address' : 'Email Address *'}
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                                className="w-full bg-gray-700 text-white py-2 px-4 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                required
                                            />
                                            {userExists !== null && !auth.user && (
                                                <p className={`text-xs mt-1 ${
                                                    userExists ? 'text-green-400' : 'text-yellow-400'
                                                }`}>
                                                    {userExists 
                                                        ? '✓ Account exists - no password needed' 
                                                        : 'New account - password required'
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        
                                        {!auth.user && !userExists && (
                                            <>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium mb-1">Password *</label>
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Create your password"
                                                        className="w-full bg-gray-700 text-white py-2 px-4 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm your password"
                                                        className="w-full bg-gray-700 text-white py-2 px-4 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                        required
                                                    />
                                                    {password !== confirmPassword && confirmPassword && (
                                                        <p className="text-red-400 text-xs mt-1">
                                                            Passwords do not match
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleTemplateRental}
                                        disabled={
                                            isPurchasing || 
                                            !email || 
                                            (!auth.user && !userExists && (!password || !confirmPassword || password !== confirmPassword)) ||
                                            themeCollections[selectedTemplate.id]?.isInCollection ||
                                            themeCollections[selectedTemplate.id]?.isThemeOwner
                                        }
                                        className="w-full bg-[#FFD700] text-gray-900 font-bold py-3 px-4 rounded-full hover:bg-[#FFC000] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isPurchasing ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : themeCollections[selectedTemplate.id]?.isThemeOwner ? (
                                            "✓ You own this theme"
                                        ) : themeCollections[selectedTemplate.id]?.isInCollection ? (
                                            "✓ Already in your collection"
                                        ) : selectedTemplate.price === 0 ? (
                                            `Claim Free Theme`
                                        ) : (
                                            `Rent Theme for US$${Number(selectedTemplate.price).toFixed(2)}`
                                        )}
                                    </button>

                                    <div className="text-center text-xs text-[#a8d0e6]">
                                        <p>Payment secured by STRIPE. You'll receive the theme immediately after rental.</p>
                                        <p className="mt-1">
                                            <Link href="/terms" className="hover:underline text-white">Terms</Link> and{' '}
                                            <Link href="/privacy" className="hover:underline text-white">Privacy</Link>.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret: clientSecret,
                                        appearance: {
                                            theme: 'night',
                                            variables: {
                                                colorPrimary: '#FFD700',
                                                colorBackground: '#235A72',
                                                colorText: 'white',
                                                colorDanger: '#ff6b6b',
                                                fontFamily: 'Inter, system-ui, sans-serif',
                                            }
                                        }
                                    }}
                                >
                                    {clientSecret ? (
                                        <StripeCheckoutForm
                                            price={Number(selectedTemplate.price)}
                                            email={email}
                                            clientSecret={clientSecret}
                                            onSuccess={handleStripePaymentSuccess}
                                            onBack={() => setPaymentStep(1)}
                                            onError={setErrorMessage}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
                                        </div>
                                    )}
                                </Elements>
                            )}
                        </div>
                    </div>
                )}

                {isPanelVisible && (
                    <div className={`relative mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl ${
                      auth.user ? 'mt-4' : 'mt-17'
                    }`}>
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
                        <TemplateListings 
                            auth={auth}
                            initialTemplates={templates}
                            initialPagination={pagination}
                            initialFilters={filters}
                            themeCollections={themeCollections}
                            onCheckCollection={checkThemeCollectionByEmail}
                            onRental={async (templateId, price) => {
                                const templateToRent = templates.find(t => t.id === templateId);
                                if (!templateToRent) return;

                                // Check collection status first
                                let collectionStatus = themeCollections[templateId] || { isInCollection: false, isThemeOwner: false };
                                
                                // If we don't have collection data for this template, check it
                                if (!collectionStatus.isInCollection && !collectionStatus.isThemeOwner && email) {
                                    collectionStatus = await checkThemeCollectionByEmail(email, templateId);
                                    // Update the local state
                                    setThemeCollections(prev => ({
                                        ...prev,
                                        [templateId]: collectionStatus
                                    }));
                                }

                                // If already in collection or user is owner, show alert and return
                                if (collectionStatus.isInCollection || collectionStatus.isThemeOwner) {
                                    setErrorMessage('You already own or have this theme in your collection!');
                                    setTimeout(() => setErrorMessage(''), 3000);
                                    return;
                                }

                                // Set the selected template and open payment modal
                                setSelectedTemplate(templateToRent);
                                setIsPaymentModalOpen(true);
                                
                                // Pre-fill email if user is logged in
                                if (auth.user?.email) {
                                    setEmail(auth.user.email);
                                }
                            }}
                            showFilters={true}
                            currencySymbol={getCurrencySymbol()}
                        />
                    </div>
                )}
            </main>
        </>
    );
}