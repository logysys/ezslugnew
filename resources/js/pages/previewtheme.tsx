import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
    faImage,
    faPalette,
    faHashtag,
    faAt,
    faArrowRight,
    faFingerprint,
    faHandshake,
    faBullhorn,
    faStar,
    faSpinner,
    faExternalLinkAlt,
    faStore,
    faBuilding,
    faShoppingCart,
    faCrown
} from '@fortawesome/free-solid-svg-icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import MarkdownPreview from '@uiw/react-markdown-preview';

type Domain = {
    id: number;
    domain: string;
};

type Funnel = {
    id: number;
    name: string;
    // Add other funnel properties as needed
};

type Template = {
    id: number;
    title: string;
    image: string;
    user_id: number;
    unique_id: string;
    description: string;
    price: number;
    leftwidth: number;
    rightwidth: number;
    status: string;
    option: string;
    created_at: string;
    updated_at: string;
    bgcolour?: string;
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

// Tooltip helper function
const getTooltipContent = (tooltips: any, reference: string, index: number = 0): string => {
    if (!tooltips || !tooltips[reference]) {
        return '';
    }
    
    try {
        const tooltipArray = tooltips[reference];
        // Handle both string (JSON) and array formats
        const tips = Array.isArray(tooltipArray) ? tooltipArray : JSON.parse(tooltipArray as any);
        
        const content = tips[index] || tips[0] || '';
        
        // Replace dynamic placeholders if needed
        return content;
    } catch (error) {
        return '';
    }
};

// Helper function to calculate "time ago" from a date string
const timeAgo = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return ''; // Return empty string for invalid dates
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'just now';

    const intervals: { label: string; seconds: number }[] = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
};

// Helper function to detect markdown content
const isMarkdownContent = (content: string): boolean => {
    if (!content) return false;
    
    // Common markdown patterns
    const markdownPatterns = [
        /^#+\s/,                    // Headers
        /\*\*.+\*\*/,               // Bold text
        /\*.+\*/,                   // Italic text
        /\[.+\]\(.+\)/,             // Links
        /^- .+/m,                   // List items
        /^\d+\. .+/m,               // Numbered lists
        /```[\s\S]*```/,            // Code blocks
        /`[^`]+`/,                  // Inline code
        /^> .+/m,                   // Blockquotes
        /\|.+\|/,                   // Tables
        /!\[.*\]\(.*\)/,            // Images
        /---|\*\*\*|___/,           // Horizontal rules
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
};

// Helper function to check if content is HTML
const isHtmlContent = (content: string): boolean => {
    if (!content) return false;
    const trimmed = content.trim();
    return trimmed.startsWith('<!DOCTYPE') || 
           trimmed.startsWith('<html') ||
           (trimmed.includes('<body') && trimmed.includes('</html>')) ||
           (trimmed.includes('<div') && trimmed.includes('</div>') && trimmed.length > 100);
};

// Helper function to check if URL points to HTML file
const isHtmlFileUrl = (url: string): boolean => {
    const cleanUrl = url.split('?')[0];
    const extension = cleanUrl.split('.').pop()?.toLowerCase();
    return extension === 'html' || extension === 'htm';
};

const StripeCheckoutForm = ({
    price,
    email,
    clientSecret,
    onSuccess,
    onBack,
    onError,
    tooltips
}: {
    price: number;
    email: string;
    clientSecret: string;
    onSuccess: () => void;
    onBack: () => void;
    onError: (message: string) => void;
    tooltips: any;
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
                <div className="mb-4 p-3 bg-red-500/90 text-white rounded-lg flex items-center gap-2" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltipContent(tooltips, 'modal-tooltip', 0)}>
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {error}
                </div>
            )}

            <div className="mt-4 text-sm text-gray-300">
                <div className="flex items-center justify-between mb-2">
                    <span data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltipContent(tooltips, 'modal-tooltip', 1)}>Email:</span>
                    <span className="text-yellow-400">{email}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltipContent(tooltips, 'modal-tooltip', 2)}>Amount:</span>
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
                    data-tooltip-id="modal-tooltip"
                    data-tooltip-content={getTooltipContent(tooltips, 'modal-tooltip', 3)}
                >
                    {isProcessing ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            Processing...
                        </>
                    ) : `Pay US$${price.toFixed(2)}`}
                </button>
            </div>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-yellow-400 hover:underline"
                    data-tooltip-id="modal-tooltip"
                    data-tooltip-content={getTooltipContent(tooltips, 'modal-tooltip', 4)}
                >
                    Back to email
                </button>
                <p className="mt-2 text-xs text-gray-500" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltipContent(tooltips, 'modal-tooltip', 5)}>
                    Payment secured by STRIPE. You'll be redirected after payment.
                </p>
            </div>
        </form>
    );
};

// Helper function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

export default function EzHashtag() {
    const { auth, template, initialFunnels, domains, checkDomainUrl, checkStandardDomainUrl, tooltips } = usePage<SharedData>().props;
    const dragRef = useRef<HTMLDivElement>(null);
    const htmlBlobRef = useRef<Blob | null>(null);
    const htmlUrlRef = useRef<string | null>(null);
    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy' | 'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // States from 123theme.tsx
    const [isInCollection, setIsInCollection] = useState(false);
    const [isThemeOwner, setIsThemeOwner] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [copySuccessAlert, setCopySuccessAlert] = useState(false);

    // Refs for social media embed scripts from 123theme.tsx
    const tiktokScriptRef = useRef<HTMLScriptElement | null>(null);
    const facebookScriptRef = useRef<HTMLScriptElement | null>(null);
    const twitterScriptRef = useRef<HTMLScriptElement | null>(null);
    const redditScriptRef = useRef<HTMLScriptElement | null>(null);

    const [activeOption, setActiveOption] = useState<'handle' | 'domain'>('domain');
    const [brandInput, setBrandInput] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [availabilityStatus, setAvailabilityStatus] = useState<{
        checking: boolean;
        available: boolean | null;
        message: string;
        price?: number;
        promoPrice?: number;
        charCount?: number;
    }>({
        checking: false,
        available: null,
        message: ''
    });

    const [paymentInfo, setPaymentInfo] = useState<{
        show: boolean;
        price: number;
        promoPrice: number;
        couponCode: string;
        buyingPrice: number;
        couponValid?: boolean;
        couponMessage?: string;
    }>({
        show: false,
        price: 0.00,
        promoPrice: 0,
        couponCode: '',
        buyingPrice: 0
    });

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntentId, setPaymentIntentId] = useState('');
    const [email, setEmail] = useState(auth.user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userExists, setUserExists] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [lastCheckedInput, setLastCheckedInput] = useState('');
    const [purchaseFormType, setPurchaseFormType] = useState<'handle' | 'domain' | null>(null);

    // Coupon code state
    const [couponCode, setCouponCode] = useState('');
    const [couponStatus, setCouponStatus] = useState<{
        valid: boolean | null;
        message: string;
        discount: number;
        domain_discount?: number;
        theme_discount?: number;
    }>({
        valid: null,
        message: '',
        discount: 0
    });

    // Purchase success state
    const [purchaseSuccess, setPurchaseSuccess] = useState<{
        success: boolean;
        message: string;
        url?: string;
    }>({
        success: false,
        message: '',
        url: ''
    });

    // Terms agreement state
    const [termsAgreed, setTermsAgreed] = useState(false);

    // Theme purchase states
    const [showThemePurchaseModal, setShowThemePurchaseModal] = useState(false);
    const [isPurchasingTheme, setIsPurchasingTheme] = useState(false);
    const [themePurchaseError, setThemePurchaseError] = useState('');

    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Add force refresh state for price calculations
    const [priceCalculationKey, setPriceCalculationKey] = useState(0);

    // Add window size state for responsive design
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
    });

    // Memoize the tooltip function to prevent unnecessary re-renders
    const getTooltip = useCallback((reference: string, index: number = 0): string => {
        return getTooltipContent(tooltips, reference, index);
    }, [tooltips]);

    // Process template.image to replace {timeago} placeholder
    const processedTemplateImage = useMemo(() => {
        if (!template?.image) return '';
        const timeAgoStr = timeAgo((template as any).created_at);
        return template.image.replace(/{timeago}/g, timeAgoStr);
    }, [template]);

    // Get left margin from template in percentage - with responsive handling
    const leftMargin = useMemo(() => {
        return template?.leftwidth || 0;
    }, [template]);

    // Get right margin from template in percentage
    const rightMargin = useMemo(() => {
        return template?.rightwidth || 0;
    }, [template]);

    // Window resize handler for responsive design
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Check if mobile view
    const isMobile = windowSize.width <= 768;

    // Responsive container style for template content
    const templateContainerStyle = useMemo(() => {
        if (isMobile) {
            // On mobile, remove left margin and use full width
            return {
                marginLeft: '0%',
                marginRight: '0%',
                width: '100%',
            };
        } else {
            // On desktop, apply the left and right margins
            return {
                marginLeft: `${leftMargin}%`,
                marginRight: `${rightMargin}%`,
                width: `calc(100% - ${leftMargin}% - ${rightMargin}%)`,
            };
        }
    }, [leftMargin, rightMargin, isMobile]);

    // Add this function to check theme collection by email
    const checkThemeCollectionByEmail = async (email: string) => {
        if (!email || !template?.id) return { isInCollection: false, isThemeOwner: false };
        
        try {
            const response = await axios.post('/theme/check-collection-by-email', {
                email: email,
                theme_id: template.id
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

    // Calculate final prices - SINGLE SOURCE OF TRUTH WITH DEBUGGING
    const displayFinalPrices = useMemo(() => {
        // If user is theme owner OR theme is in collection OR theme price is 0, then theme is free
        const themePriceUSD = (isThemeOwner || isInCollection || template?.price === 0) ? 0 : (template?.price || 0);
        
        // Get base domain price from availability check
        const baseDomainPrice = availabilityStatus.promoPrice > 0 ? 
            (Number(availabilityStatus.promoPrice) || 0) : 
            (Number(availabilityStatus.price) || 0);
        
        let finalDomainPrice = baseDomainPrice;
        let finalThemePrice = Number(themePriceUSD);

        // Apply coupon discounts if valid
        if (couponStatus.valid && 
            couponStatus.domain_discount !== undefined && 
            couponStatus.theme_discount !== undefined) {
            
            // Use the discounted prices from backend response
            finalDomainPrice = Number(couponStatus.domain_discount);
            // Only apply theme discount if theme is not already free (not owner and not in collection)
            finalThemePrice = (isThemeOwner || isInCollection || template?.price === 0) ? 0 : Number(couponStatus.theme_discount);
        }
        
        // Apply minimum price rule only to domain price (not theme price)
        if (finalDomainPrice > 0 && finalDomainPrice < 1) {
            finalDomainPrice = 1;
        }
        
        // Calculate total - this should be the sum of domain + theme
        const totalPrice = Number(finalDomainPrice) + Number(finalThemePrice);
        
        return {
            domainPrice: Number(finalDomainPrice),
            themePrice: Number(finalThemePrice),
            totalPrice: Number(totalPrice)
        };
    }, [availabilityStatus, couponStatus, template?.price, priceCalculationKey, isInCollection, isThemeOwner]);

    // Update the purchase success message to reflect free theme
    const purchaseSuccessMessage = useMemo(() => {
        if (isThemeOwner || isInCollection || template?.price === 0) {
            return `Purchase successful! Your new URL: (Theme included for free${isThemeOwner ? ' - You own this theme' : ''})`;
        }
        return `Purchase successful! Your new URL: `;
    }, [isInCollection, isThemeOwner, template?.price]);

    // Check if user exists when email changes
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

    // Force refresh when important states change
    useEffect(() => {
        setPriceCalculationKey(prev => prev + 1);
    }, [availabilityStatus.price, availabilityStatus.promoPrice, couponStatus.valid, template?.price, isInCollection, isThemeOwner]);

    // Add this useEffect to check theme collection when email changes for non-logged-in users
    useEffect(() => {
        if (!auth?.user && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && template?.id) {
            const checkCollection = async () => {
                try {
                    const { isInCollection: collectionStatus, isThemeOwner: ownerStatus } = await checkThemeCollectionByEmail(email);
                    setIsInCollection(collectionStatus);
                    setIsThemeOwner(ownerStatus);
                    // Update the price calculation by triggering a refresh
                    setPriceCalculationKey(prev => prev + 1);
                } catch (error) {
                    console.error('Error checking theme collection by email:', error);
                }
            };
            
            const timer = setTimeout(checkCollection, 1000);
            return () => clearTimeout(timer);
        }
    }, [email, auth?.user, template?.id]);

    // For logged-in users, check if they are the theme owner
    useEffect(() => {
        if (auth?.user && template?.id) {
            // User is the owner if their user_id matches template's user_id
            const userIsOwner = auth.user.id === template.user_id;
            setIsThemeOwner(userIsOwner);
            
            // If user is owner, automatically consider theme in collection
            if (userIsOwner) {
                setIsInCollection(true);
            } else {
                // Otherwise check collection normally
                checkThemeInCollection();
            }
        }
    }, [auth?.user, template?.id, template?.user_id]);

    // Script management functions from 123theme.tsx
    const addScript = (url: string, ref: React.MutableRefObject<HTMLScriptElement | null>) => {
        if (ref.current) return; // Already exists
        
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        document.body.appendChild(script);
        ref.current = script;
    };

    const removeScript = (ref: React.MutableRefObject<HTMLScriptElement | null>) => {
        if (ref.current && document.body.contains(ref.current)) {
            document.body.removeChild(ref.current);
        }
        ref.current = null;
    };

    // Twitter embed handler from 123theme.tsx
    useEffect(() => {
        if (processedTemplateImage.includes('twitter.com') || processedTemplateImage.includes('x.com')) {
            addScript("https://platform.twitter.com/widgets.js", twitterScriptRef);
        }

        return () => {
            removeScript(twitterScriptRef);
        };
    }, [processedTemplateImage]);

    // Reddit embed handler from 123theme.tsx
    useEffect(() => {
        if (processedTemplateImage.includes('reddit.com')) {
            addScript("https://embed.reddit.com/widgets.js", redditScriptRef);
        }

        return () => {
            removeScript(redditScriptRef);
        };
    }, [processedTemplateImage]);

    // Facebook SDK loader from 123theme.tsx
    useEffect(() => {
        if (processedTemplateImage.includes('facebook.com') || processedTemplateImage.includes('fb.watch')) {
            addScript("https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0", facebookScriptRef);
        }

        return () => {
            removeScript(facebookScriptRef);
        };
    }, [processedTemplateImage]);

    // TikTok embed handler from 123theme.tsx
    useEffect(() => {
        if (processedTemplateImage.includes('tiktok.com')) {
            addScript("https://www.tiktok.com/embed.js", tiktokScriptRef);
        }

        return () => {
            removeScript(tiktokScriptRef);
        };
    }, [processedTemplateImage]);

    // Logic from 123theme.tsx
    const checkThemeInCollection = async () => {
        if (!auth?.user || !template?.id) return;

        try {
            const response = await axios.get(`/check-theme-collection/${template.id}`);
            setIsInCollection(response.data.isInCollection);
            
            // Also check if user is owner
            const userIsOwner = auth.user.id === template.user_id;
            setIsThemeOwner(userIsOwner);
        } catch (error) {
            console.error('Error checking theme collection:', error);
        }
    };

    // Theme purchase function
    const purchaseTheme = async () => {
        if (!auth?.user) {
            setThemePurchaseError('You must be logged in to purchase themes.');
            setTimeout(() => setThemePurchaseError(''), 3000);
            return;
        }

        if (!template?.id || !template?.price) {
            setThemePurchaseError('Theme information is missing.');
            setTimeout(() => setThemePurchaseError(''), 3000);
            return;
        }

        // Don't allow purchase if user is the owner
        if (isThemeOwner) {
            setThemePurchaseError('You already own this theme!');
            setTimeout(() => setThemePurchaseError(''), 3000);
            return;
        }

        setIsPurchasingTheme(true);
        setThemePurchaseError('');

        try {
            const response = await axios.post('/theme/purchase', {
                theme_id: template.id,
                price: template.price
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (response.data.success) {
                setIsInCollection(true);
                setShowThemePurchaseModal(false);
                setShowSuccessAlert(true);
                setTimeout(() => setShowSuccessAlert(false), 3000);
            } else {
                setThemePurchaseError(response.data.error || 'Purchase failed');
            }
        } catch (error: any) {
            setThemePurchaseError(error.response?.data?.error || 'Failed to purchase theme');
        } finally {
            setIsPurchasingTheme(false);
        }
    };

    // Update addToCollection function to show purchase modal for paid themes
    const addToCollection = async () => {
        if (!auth?.user) {
            setErrorMessage('You must be logged in to add themes to your collection.');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (!template?.id) return;

        // If user is theme owner or theme is already in collection, do nothing
        if (isThemeOwner || isInCollection) return;

        // If theme has a price, show purchase modal
        if (template.price > 0) {
            setShowThemePurchaseModal(true);
        } else {
            // Free theme - add directly to collection
            try {
                await axios.post('/add-to-collection', {
                    theme_id: template.id
                });
                setIsInCollection(true);
                setShowSuccessAlert(true);
                setTimeout(() => setShowSuccessAlert(false), 3000);
            } catch (error) {
                setErrorMessage('Failed to add to collection.');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        }
    };

    const copyThemeUrl = () => {
        if (!template?.unique_id) return;
        
        const url = `https://ez.wiki/${template.unique_id}`;
        navigator.clipboard.writeText(url)
            .then(() => {
                setCopySuccessAlert(true);
                setTimeout(() => setCopySuccessAlert(false), 3000);
            })
            .catch(err => {
                setCopySuccessAlert(false);
                setErrorMessage('Failed to copy URL.');
                setTimeout(() => setErrorMessage(''), 3000);
            });
    };

    useEffect(() => {
        if (initialFunnels) {
            setFunnels(initialFunnels.data);
            setHasMore(initialFunnels.next_page_url !== null);
        }
        
        // Set default selected domain if domains are available
        if (domains && domains.length > 0) {
            setSelectedDomain(domains[0].domain);
        }
    }, [initialFunnels, domains]);

    // Check if theme is in collection (from 123theme.tsx)
    useEffect(() => {
        if (auth?.user && template?.id) {
            checkThemeInCollection();
        }
    }, [auth?.user, template?.id]);

    // Add coupon validation function with debugging
    const validateCoupon = async () => {
        if (!couponCode.trim() || !brandInput.trim()) {
            setCouponStatus({
                valid: false,
                message: 'Please enter a coupon code and brand name',
                discount: 0,
                domain_discount: 0,
                theme_discount: 0
            });
            return;
        }

        try {
            setCouponStatus({
                valid: null,
                message: 'Validating coupon...',
                discount: 0,
                domain_discount: 0,
                theme_discount: 0
            });
            
            // Include theme price in the request (convert EZ$ to USD - 1:1 ratio)
            const themePriceUSD = (isThemeOwner || isInCollection || template?.price === 0) ? 0 : (template?.price || 0);
            
            const response = await axios.post('/theme/couponcodecustomdomain', {
                couponcode: couponCode.trim(),
                domainurl: brandInput.trim(),
                theme_price: themePriceUSD,
                theme_id: template?.id,
                email: email,
                type: activeOption
            });

            if (response.data.valid) {
                // Use the individual discounted prices from backend response
                const domainDiscountedPrice = response.data.domain_discount !== undefined ? response.data.domain_discount : response.data.original_price;
                const themeDiscountedPrice = response.data.theme_discount !== undefined ? response.data.theme_discount : themePriceUSD;
                const totalDiscountedPrice = response.data.offprice;
                
                // Strip HTML tags from the response message
                const cleanMessage = stripHtmlTags(response.data.title || 'Coupon applied successfully!');
                
                setCouponStatus({
                    valid: true,
                    message: cleanMessage,
                    discount: Number(totalDiscountedPrice),
                    domain_discount: Number(domainDiscountedPrice),
                    theme_discount: Number(themeDiscountedPrice)
                });
            } else {
                // Strip HTML tags from the error message too
                const cleanMessage = stripHtmlTags(response.data.title || 'Invalid coupon code');
                
                setCouponStatus({
                    valid: false,
                    message: cleanMessage,
                    discount: 0,
                    domain_discount: 0,
                    theme_discount: 0
                });
            }
        } catch (error) {
            setCouponStatus({
                valid: false,
                message: 'Error validating coupon. Please try again.',
                discount: 0,
                domain_discount: 0,
                theme_discount: 0
            });
        }
    };

    // Update the useEffect for coupon validation to reset coupon status when inputs change
    useEffect(() => {
        if (couponCode.trim() && brandInput.trim()) {
            const timer = setTimeout(() => {
                validateCoupon();
            }, 800);
            
            return () => clearTimeout(timer);
        } else {
            // Reset coupon status when inputs are cleared
            setCouponStatus({
                valid: null,
                message: '',
                discount: 0,
                domain_discount: 0,
                theme_discount: 0
            });
        }
    }, [couponCode, brandInput, template?.price, isInCollection, isThemeOwner, email]);

    // Also reset coupon status when brand input changes significantly
    useEffect(() => {
        if (!brandInput.trim()) {
            setCouponStatus({
                valid: null,
                message: '',
                discount: 0,
                domain_discount: 0,
                theme_discount: 0
            });
        }
    }, [brandInput]);

    const handleOptionChange = (option: 'handle' | 'domain') => {
        setActiveOption(option);
        setAvailabilityStatus({
            checking: false,
            available: null,
            message: ''
        });
        // Reset terms agreement when option changes
        setTermsAgreed(false);
    };

    const checkAvailability = async () => {
        if (!brandInput.trim() || !selectedDomain) {
            setAvailabilityStatus({
                checking: false,
                available: false,
                message: 'Please enter a brand name and select a domain'
            });
            return;
        }

        const currentInput = `${brandInput.trim()}-${selectedDomain}-${activeOption}`;
        setLastCheckedInput(currentInput);

        setIsSubmitting(true);
        setAvailabilityStatus({
            checking: true,
            available: null,
            message: 'Checking availability...'
        });

        try {
            const endpoint = activeOption === 'handle' ? checkDomainUrl : checkStandardDomainUrl;
            const response = await axios.post(endpoint, {
                handle: brandInput.trim(),
                domain: selectedDomain
            });
            setPurchaseSuccess({
                success: false,
                message: '',
                url: ''
            });
            
            // Extract price information from response if available
            const price = response.data.price || 0;
            const promoPrice = response.data.promoPrice || 0;
            const charCount = response.data.charCount || 0;

            setAvailabilityStatus({
                checking: false,
                available: response.data.available,
                message: response.data.message,
                price: Number(price),
                promoPrice: Number(promoPrice),
                charCount: Number(charCount)
            });

        } catch (error: any) {
            setAvailabilityStatus({
                checking: false,
                available: false,
                message: error.response?.data?.message || 'Error checking availability',
                price: 0,
                promoPrice: 0,
                charCount: 0
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this useEffect for real-time availability checking
    useEffect(() => {
        if (brandInput.trim() && selectedDomain) {
            const timer = setTimeout(() => {
                checkAvailability();
            }, 800); // Check after 800ms of no typing
            
            return () => clearTimeout(timer);
        }
    }, [brandInput, selectedDomain, activeOption]);

    const initiateHandlePayment = async () => {
        if (!email) {
            setErrorMessage('Please enter your email address');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMessage('Please enter a valid email address');
            return;
        }

        // Check if user exists first
        if (userExists === null) {
            setErrorMessage('Checking user account...');
            return;
        }

        // Check password for non-logged-in users who don't exist
        if (!auth.user && !userExists) {
            if (!password) {
                setErrorMessage('Please enter a password');
                return;
            }

            if (password.length < 8) {
                setErrorMessage('Password must be at least 8 characters long');
                return;
            }

            if (!confirmPassword) {
                setErrorMessage('Please confirm your password');
                return;
            }

            if (password !== confirmPassword) {
                setErrorMessage('Passwords do not match');
                return;
            }
        }

        // Check theme collection by email for non-logged-in users
        let themeInCollectionByEmail = isInCollection;
        let themeOwnerStatus = isThemeOwner;
        if (!auth?.user) {
            setIsLoading(true);
            try {
                const { isInCollection: collectionStatus, isThemeOwner: ownerStatus } = await checkThemeCollectionByEmail(email);
                themeInCollectionByEmail = collectionStatus;
                themeOwnerStatus = ownerStatus;
                setIsInCollection(collectionStatus);
                setIsThemeOwner(ownerStatus);
            } catch (error) {
                console.error('Error checking theme collection:', error);
            } finally {
                setIsLoading(false);
            }
        }

        // Recalculate prices based on theme collection and owner status
        const themePriceUSD = (themeOwnerStatus || themeInCollectionByEmail || template?.price === 0) ? 0 : (template?.price || 0);
        
        // Get base domain price from availability check
        const baseDomainPrice = availabilityStatus.promoPrice > 0 ? 
            (Number(availabilityStatus.promoPrice) || 0) : 
            (Number(availabilityStatus.price) || 0);
        
        let finalDomainPrice = baseDomainPrice;
        let finalThemePrice = Number(themePriceUSD);

        // Apply coupon discounts if valid
        if (couponStatus.valid && 
            couponStatus.domain_discount !== undefined && 
            couponStatus.theme_discount !== undefined) {
            
            // Use the discounted prices from backend response
            finalDomainPrice = Number(couponStatus.domain_discount);
            // Only apply theme discount if theme is not already free
            finalThemePrice = (themeOwnerStatus || themeInCollectionByEmail || template?.price === 0) ? 0 : Number(couponStatus.theme_discount);
        }
        
        // Apply minimum price rule only to domain price (not theme price)
        if (finalDomainPrice > 0 && finalDomainPrice < 1) {
            finalDomainPrice = 1;
        }
        
        // Calculate total - this should be the sum of domain + theme
        const totalPrice = Number(finalDomainPrice) + Number(finalThemePrice);
        let finalPrice = Number(totalPrice);

        // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
        if (finalPrice > 0 && finalPrice < 1) {
            finalPrice = 1;
        }

        // If price is $0, use free purchase endpoint
        if (finalPrice === 0) {
            setErrorMessage('');
            setIsLoading(true);
            try {
                const response = await axios.post('/theme/free-purchase', {
                    email: email,
                    password: (!auth.user && !userExists) ? password : undefined, // Include password only for new users
                    custom_handle: brandInput.trim(),
                    domain: selectedDomain,
                    type: activeOption,
                    coupon_code: couponCode,
                    template_id: template?.id,
                }, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    }
                });
                
                if (response.data.success) {
                    const url = activeOption === 'handle' 
                        ? `https://${selectedDomain}/${brandInput.trim()}`
                        : `https://${brandInput.trim()}.${selectedDomain}`;
                        
                    setPurchaseSuccess({
                        success: true,
                        message: purchaseSuccessMessage,
                        url: url
                    });
                    
                    setIsPaymentModalOpen(false);
                    setPurchaseFormType(null);
                    setErrorMessage('');
                    
                    // Reset form after 5 seconds
                    setTimeout(() => {
                        setBrandInput('');
                        setAvailabilityStatus({
                            checking: false,
                            available: null,
                            message: ''
                        });
                        setCouponCode('');
                        setCouponStatus({
                            valid: null,
                            message: '',
                            discount: 0,
                            domain_discount: 0,
                            theme_discount: 0
                        });
                        setTermsAgreed(false);
                        setPassword('');
                        setConfirmPassword('');
                    }, 5000);
                } else {
                    setErrorMessage(response.data.error || 'Free purchase failed');
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    setErrorMessage(error.response?.data?.error || 'Failed to process free purchase');
                } else {
                    setErrorMessage('Failed to connect to purchase service');
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Existing Stripe payment logic for non-zero prices
        if (finalPrice < 1 && finalPrice !== 0) {
            setErrorMessage('Minimum payment amount is $1');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);
        
        try {
            const endpoint = activeOption === 'handle' ? '/theme/initiate-handle-homepayment' : '/theme/initiate-domain-homepayment';
            
            // Send the CORRECT prices to backend
            const response = await axios.post(endpoint, {
                price: Number(finalDomainPrice), // Domain price only
                email: email,
                password: (!auth.user && !userExists) ? password : undefined, // Include password only for new users
                custom_handle: brandInput.trim(),
                domain: selectedDomain,
                promo_price: Number(finalPrice), // Final discounted total price
                coupon_code: couponCode,
                selling_price: 0,
                payment_method: 'usd',
                funnelId: 0,
                theme_price: Number(finalThemePrice), // Theme price separately
                template_id: template?.id,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });
            
            setClientSecret(response.data.clientSecret);
            setPaymentIntentId(response.data.payment_intent_id);
            setPaymentStep(2);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(error.response?.data?.error || 'Failed to initialize payment');
            } else {
                setErrorMessage('Failed to connect to payment service');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = activeOption === 'handle' ? '/theme/home-handle-success' : '/theme/home-domain-handle-success';
            const response = await axios.post(endpoint, {
                payment_intent_id: paymentIntentId,
                template_id: template?.id,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });
            if (response.data.success) {
                const url = activeOption === 'handle' 
                    ? `https://${selectedDomain}/${brandInput.trim()}`
                    : `https://${brandInput.trim()}.${selectedDomain}`;
                    
                // Set purchase success state
                setPurchaseSuccess({
                    success: true,
                    message: purchaseSuccessMessage,
                    url: url
                });
                
                setIsPaymentModalOpen(false);
                setPurchaseFormType(null);
                
                setPaymentStep(1);
                setClientSecret('');
                setPaymentIntentId('');
                setErrorMessage('');
                
                // Reset form after 5 seconds
                setTimeout(() => {
                    setBrandInput('');
                    setAvailabilityStatus({
                        checking: false,
                        available: null,
                        message: ''
                    });
                    // Reset coupon state
                    setCouponCode('');
                    setCouponStatus({
                        valid: null,
                        message: '',
                        discount: 0,
                        domain_discount: 0,
                        theme_discount: 0
                    });
                    // Reset terms agreement
                    setTermsAgreed(false);
                    // Reset password fields
                    setPassword('');
                    setConfirmPassword('');
                }, 5000);
            } else {
                setErrorMessage(response.data.error || 'Payment verification failed');
            }
        } catch (error: any) {
            setErrorMessage(error.response?.data?.error || 'Payment verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = () => {
        const currentInput = `${brandInput.trim()}-${selectedDomain}-${activeOption}`;
        
        if (!brandInput.trim() || !selectedDomain || availabilityStatus.available === false || lastCheckedInput !== currentInput) {
            setErrorMessage('Please check availability first');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        // Check if terms are agreed
        if (!termsAgreed) {
            setErrorMessage('Please agree to the terms and conditions');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        // Set the purchase form type based on active option
        setPurchaseFormType(activeOption);
        
        // Set payment info with CORRECT prices
        setPaymentInfo({
            show: true,
            price: Number(displayFinalPrices.domainPrice), // Domain price only
            promoPrice: Number(displayFinalPrices.totalPrice), // Final discounted total
            couponCode: couponCode,
            buyingPrice: Number(displayFinalPrices.totalPrice) // This is what will be charged
        });
        
        setIsPaymentModalOpen(true);
    };

    const processPurchase = async () => {
        setIsSubmitting(true);
        setShowPurchaseModal(false);
        
        try {
            // Replace with your actual purchase API call
            const response = await axios.post('/api/purchase', {
                brand: brandInput.trim(),
                domain: selectedDomain,
                type: activeOption
            });
            
            setSuccessMessage(`Success! Your ${activeOption === 'handle' ? 'brand handle' : 'domain'} has been reserved.`);
            setTimeout(() => setSuccessMessage(''), 5000);
            
            // Reset form
            setBrandInput('');
            setAvailabilityStatus({
                checking: false,
                available: null,
                message: ''
            });
            // Reset coupon state
            setCouponCode('');
            setCouponStatus({
                valid: null,
                message: '',
                discount: 0,
                domain_discount: 0,
                theme_discount: 0
            });
            // Reset terms agreement
            setTermsAgreed(false);
            // Reset password fields
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || 'Purchase failed. Please try again.');
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

    const blurStyle = template?.image && isImageExtension(getImageExtension(processedTemplateImage)) ? (
        <style>{`
            .blur-bg {
                background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${processedTemplateImage}') no-repeat center center;
                background-size: cover;
            }
        `}</style>
    ) : null;

    // MAIN TEMPLATE CONTENT RENDERING WITH HTML SUPPORT
    const templateContent = useMemo(() => {
        if (!template) return null;

        // Check if content is markdown
        if (isMarkdownContent(processedTemplateImage)) {
            return (
                <>
                    <style>{`
                        .markdown-container {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: ${template?.bgcolour || '#000000'};
                            overflow-y: auto;
                            z-index: 0;
                        }
                        .markdown-content {
                            margin: 0 auto;
                            color: white;
                            font-family: system-ui, -apple-system, sans-serif;
                        }
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
                    <div className="markdown-container" style={templateContainerStyle}>
                        <div className="markdown-content">
                            <MarkdownPreview 
                                source={processedTemplateImage}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    fontFamily: 'system-ui, -apple-system, sans-serif'
                                }}
                                wrapperElement={{
                                    'data-color-mode': 'dark'
                                }}
                            />
                        </div>
                    </div>
                </>
            );
        }

        const extension = processedTemplateImage.split('.').pop()?.toLowerCase() || '';
        const imgPath = template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        const fullImageUrl = `${imgPath}${processedTemplateImage}`;

        // Valid extensions
        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        const validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];
        const validHtmlExtensions = ['html', 'htm'];

        // NEW: Check for HTML files FIRST (before other processing)
        if (validHtmlExtensions.includes(extension) || isHtmlFileUrl(processedTemplateImage)) {
            return (
                <>
                    <style>{`
                        .html-container {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: ${template?.bgcolour || '#000000'};
                            z-index: 0;
                            overflow-y: auto;
                        }
                        .html-container iframe {
                            width: 100%;
                            height: 100%;
                            border: none;
                        }
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
                    <div className="html-container">
                        <iframe
                            src={fullImageUrl}
                            title="HTML Content"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads allow-popups-to-escape-sandbox"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; picture-in-picture"
                        />
                    </div>
                </>
            );
        }

        // Check for raw HTML content (string containing HTML)
        if (isHtmlContent(processedTemplateImage) && !validImageExtensions.includes(extension) && !validDocumentExtensions.includes(extension)) {
            // Clean up previous blob URL
            if (htmlUrlRef.current) {
                URL.revokeObjectURL(htmlUrlRef.current);
            }
            
            // Create blob URL for HTML content
            const htmlBlob = new Blob([processedTemplateImage], { type: 'text/html; charset=UTF-8' });
            const htmlUrl = URL.createObjectURL(htmlBlob);
            htmlUrlRef.current = htmlUrl;
            
            return (
                <>
                    <style>{`
                        .html-container {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: ${template?.bgcolour || '#000000'};
                            z-index: 0;
                        }
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
                        src={htmlUrl}
                        className="fixed top-0 left-0 w-full h-full border-none"
                        style={templateContainerStyle}
                        allow="microphone *; camera *; autoplay *; fullscreen *; display-capture *;"
                        sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock 
                                allow-popups allow-popups-to-escape-sandbox allow-presentation 
                                allow-same-origin allow-scripts allow-top-navigation 
                                allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation"
                        allowFullScreen
                        loading="lazy"
                        title="HTML Content"
                    />
                </>
            );
        }

        // Regex patterns
        const youtubeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
        const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^/]+:[^"&?/ ]+)/i;
        const vimeoRegex = /^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im;
        const fbWatchRegex = /^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/;
        const facebookRegex = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/;
        const tiktokRegex = /tiktok\.com\/@[\w-]+\/video\/\d+/i;
        const redditRegex = /reddit\.com\/r\/[\w-]+\/comments\/[\w-]+\/[\w-]+/i;
        const iframeRegex = /<iframe.*?src=["'](.*?)["'].*?>.*?<\/iframe>/is;
        const blockquoteRegex = /<blockquote/;

        // Check matches
        const youtubeMatch = processedTemplateImage.match(youtubeRegex);
        const linkedinMatch = processedTemplateImage.match(linkedinRegex);
        const vimeoMatch = processedTemplateImage.match(vimeoRegex);
        const fbWatchMatch = processedTemplateImage.match(fbWatchRegex);
        const facebookMatch = processedTemplateImage.match(facebookRegex);
        const tiktokMatch = processedTemplateImage.match(tiktokRegex);
        const redditMatch = processedTemplateImage.match(redditRegex);
        const iframeMatch = processedTemplateImage.match(iframeRegex) || blockquoteRegex.test(processedTemplateImage);

        // Apply left and right margin style in percentage - ONLY for template content
        const containerStyle = {
            marginLeft: `${leftMargin}%`,
            marginRight: `${rightMargin}%`
        };

        // 1. TikTok embeds (special handling)
        if (tiktokMatch) {
            return (
                <>
                    <style>{`
                        .tiktok-embed {
                            width: 100%;
                            max-width: 605px;
                            height: 100%;
                            max-height: 800px;
                        }
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
                    <div 
                        className="fixed inset-0 flex items-center justify-center p-4 object-cover"
                        style={containerStyle}
                        dangerouslySetInnerHTML={{ __html: processedTemplateImage }}
                    />
                </>
            );
        }

        // 2. Reddit embeds
        if (redditMatch) {
            return (
                <>
                    <style>{`
                        .reddit-embed-container {
                            width: 100%;
                            max-width: 800px;
                            margin: 0 auto;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                    `}</style>
                    <div className="reddit-embed-container" style={containerStyle}>
                        <div 
                            dangerouslySetInnerHTML={{ __html: processedTemplateImage }}
                        />
                    </div>
                </>
            );
        }

        // 3. Image files
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
                        style={containerStyle}
                        onError={() => {}}
                    />
                </>
            );
        }

        // 4. Document files
        if (validDocumentExtensions.includes(extension)) {
            return (
                <>
                    <style>{`
                        .document-viewer-container {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: #1f1f1f;
                            z-index: -1;
                        }
                    `}</style>
                    <div className="document-viewer-container"></div>
                    <iframe
                        src={`https://docs.google.com/viewer?url=${fullImageUrl}&embedded=true`}
                        className="fixed top-0 left-0 w-full h-full"
                        style={containerStyle}
                        frameBorder="0"
                        loading="lazy"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin"
                        title="Document Viewer"
                        scrolling="yes"
                    />
                </>
            );
        }

        // 5. Embedded iframes or blockquotes
        if (iframeMatch) {
            const isSocialMediaEmbed = /<(iframe|blockquote)[^>]*(facebook|linkedin|tiktok|twitter|reddit)\.com/i.test(processedTemplateImage);
            
            if (isSocialMediaEmbed) {
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
                        <div className="max-h-screen overflow-y-auto" style={containerStyle}>
                            <div 
                                className="inset-0 flex items-center justify-center p-4 overflow-y-auto object-cover"
                                dangerouslySetInnerHTML={{ __html: processedTemplateImage }}
                            />
                        </div>
                    </>
                );
            }

            const processedHtml = processedTemplateImage
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
                    `}</style>
                    <div className="blur-overlay"></div>
                    <div className="max-h-screen overflow-y-auto" style={containerStyle}>
                        <div 
                            className="inset-0 flex items-center justify-center p-4 object-cover overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: finalHtml }}
                        />
                    </div>
                </>
            );
        }

        // 6. YouTube videos
        if (youtubeMatch) {
            const autoplayParam = template.option === 'autoplay' ? 'autoplay=1' : 
                                template.option === 'mute' ? 'autoplay=1&mute=1' : 'mute=1';
            
            return (
                <>
                    <div className="fixed top-0 left-0 w-full h-full z-[-2]" style={containerStyle}>
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
                        style={containerStyle}
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

        // 7. LinkedIn posts
        if (linkedinMatch) {
            let linkedinUrl = processedTemplateImage;
            if (!linkedinUrl.includes('?compact=1')) {
                linkedinUrl += (linkedinUrl.includes('?') ? '&' : '?') + 'compact=1';
            }

            return (
                <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black" style={containerStyle}>
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

        // 8. Vimeo videos
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
                        style={containerStyle}
                        frameBorder="0" 
                        allowFullScreen
                    />
                </>
            );
        }

        // 9. Facebook Watch or posts
        if (fbWatchMatch || (facebookMatch && !processedTemplateImage.includes('groups'))) {
            return (
                <div className="fixed top-0 left-0 w-full h-screen flex justify-center items-center overflow-auto" style={containerStyle}>
                    <div 
                        className="fb-post" 
                        data-href={processedTemplateImage} 
                        data-show-text="true"
                    />
                </div>
            );
        }

        // 10. MP4 videos
        if (extension === 'mp4') {
            return (
                <>
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="fixed top-0 left-0 w-full h-full object-cover z-[-3]"
                        style={containerStyle}
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
                        style={containerStyle}
                        controls
                    >
                        <source src={fullImageUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </>
            );
        }

        // 11. GLB 3D models
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
                        style={containerStyle}
                        ar
                        auto-rotate
                        camera-controls
                        shadow-intensity="1"
                    />
                </>
            );
        }

        // 12. Generic URLs
        if (isValidUrl(processedTemplateImage)) {
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
                        src={processedTemplateImage} 
                        className="fixed top-0 left-0 w-full h-full" 
                        style={containerStyle}
                        frameBorder="0" 
                        allowFullScreen
                        scrolling="yes"
                    />
                </>
            );
        }

        // 13. Fallback - treat as HTML
        // Clean up previous blob URL
        if (htmlUrlRef.current) {
            URL.revokeObjectURL(htmlUrlRef.current);
        }
        
        const htmlBlob = new Blob([processedTemplateImage], { type: 'text/html; charset=UTF-8' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        htmlUrlRef.current = htmlUrl;
        
        return (
            <iframe
                src={htmlUrl}
                className="fixed top-0 left-0 w-full h-full border-none"
                style={containerStyle}
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
                title="HTML Content"
            />
        );
    }, [template, processedTemplateImage, leftMargin, rightMargin, templateContainerStyle]);

    // Clean up blob URLs on unmount
    useEffect(() => {
        return () => {
            if (htmlUrlRef.current) {
                URL.revokeObjectURL(htmlUrlRef.current);
            }
        };
    }, []);

    return (
        <>
            <Head>
                <title>EZ HASHTAG - Manage Funnel SEO Tags</title>
                {blurStyle}
                <meta name="description" content="Manage your funnel's SEO tags for better visibility" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                    .input-no-spinner::-webkit-outer-spin-button,
                    .input-no-spinner::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    .input-no-spinner {
                        -moz-appearance: textfield;
                    }
                    /* Add responsive styles for mobile */
                    @media (max-width: 768px) {
                        .template-content-container {
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            width: 100% !important;
                        }
                        .template-content-container iframe,
                        .template-content-container model-viewer,
                        .template-content-container video,
                        .template-content-container img {
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            width: 100% !important;
                        }
                    }
                `}</style>
            </Head>
            
            {/* Success Alerts from 123theme.tsx */}
            {showSuccessAlert && (
                <div className="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg touch-manipulation">
                    Theme added to your collection!
                </div>
            )}
            {copySuccessAlert && (
                <div className="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg touch-manipulation">
                    Great! The theme URL has been copied to your clipboard.
                </div>
            )}

            {/* Tooltip components */}
            <Tooltip id="nav-tooltip" />
            <Tooltip id="action-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="modal-tooltip" />

            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                processedTemplateImage.split('.').pop()?.toLowerCase() && 
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(processedTemplateImage.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0 bg-black">
                    <Draggable 
                        nodeRef={dragRef}
                        bounds="parent"
                        cancel=".no-drag"
                        defaultPosition={{x: window.innerWidth - 400, y: 0}}
                    >
                        <div ref={dragRef} className="space-x-4 z-10 absolute mt-5 cursor-move touch-none">
                            <div className="flex items-center gap-4">
                                <Link 
                                    href={route('home')}
                                    className="flex items-center px-2 py-0 rounded-full bg-[#235A72] no-drag transition-colors duration-300 hover:bg-[#1C4A5E]"
                                    data-tooltip-id="nav-tooltip"
                                    data-tooltip-content={getTooltip('nav-tooltip', 0)}
                                >
                                    <AppLogoIcon className="size-8 fill-current text-[#8EF587]" />
                                    <span className="ml-2 text-[#8EF587]">ez.wiki</span>
                                </Link>
                                <button
                                    onClick={() => setIsPanelVisible(true)}
                                    className="group no-drag" 
                                    data-tooltip-id="nav-tooltip" 
                                    data-tooltip-content={getTooltip('nav-tooltip', 1)}
                                >
                                    <span className="flex items-center gap-2 bg-orange-500 text-white font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-orange-600 cursor-pointer">
                                        <FontAwesomeIcon icon={faBuilding} className="text-white" />
                                        <span className="hidden group-hover:inline">EXPRESS DOMAIN</span>
                                    </span>
                                </button>
                                <Link href={route('marketplace')} className="group no-drag" data-tooltip-id="nav-tooltip" data-tooltip-content={getTooltip('nav-tooltip', 4)}>
                                    <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                        <FontAwesomeIcon icon={faStore} className="text-[#8EF587]" />
                                        <span className="hidden group-hover:inline">MARKETPLACE</span>
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </Draggable>
                    
                    {/* Theme Information Panel from 123theme.tsx */}
                    <div
                        className="fixed top-[48px] left-[-39px] w-[200px] h-[22px] bg-gray-500/50 text-white text-[12px] font-bold shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation"
                        title={isThemeOwner ? "You own this theme" : isInCollection ? "This theme is in your collection" : template?.price > 0 ? `Purchase for EZ$ ${template.price}` : "Add this theme to your collection"}
                    >
                        <span className="flex items-center justify-center w-full gap-1 touch-manipulation">
                            {template?.unique_id} EZ$ {template?.price}
                            <span
                                onClick={addToCollection}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    addToCollection();
                                }}
                                className="cursor-pointer touch-manipulation"
                                title={isThemeOwner ? "You own this theme" : isInCollection ? "In your collection" : template?.price > 0 ? `Purchase for EZ$ ${template.price}` : "Add to collection"}
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content={isThemeOwner ? "You own this theme" : isInCollection ? "In your collection" : template?.price > 0 ? `Purchase for EZ$ ${template.price}` : "Add to collection"}
                            >
                                {isThemeOwner ? '👑' : isInCollection ? '❤️' : template?.price > 0 ? '💰' : '🤍'}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="w-4 h-4 text-white hover:text-blue-500 cursor-pointer transition-colors touch-manipulation"
                                onClick={copyThemeUrl}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    copyThemeUrl();
                                }}
                                title="Copy theme URL"
                            >
                                <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                            </svg>
                        </span>
                    </div>
                    
                    {/* Template content with responsive container style applied */}
                    <div className="absolute inset-0 z-0 template-content-container" style={{ backgroundColor: template?.bgcolour || '#000000' }}>
                        {templateContent}
                    </div>
                </div>
                
                {/* Notification Messages */}
                {errorMessage && (
                    <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 15)}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 16)}>
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                        {successMessage}
                    </div>
                )}
                
                {/* Theme Purchase Modal */}
                {showThemePurchaseModal && template && (
                    <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4">
                        <div className="bg-[#235A72] border border-[#3a7a94] text-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
                            <button
                                onClick={() => setShowThemePurchaseModal(false)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                                disabled={isPurchasingTheme}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/20 bg-gradient-to-br from-white/15 to-transparent shadow-lg mx-auto">
                                    <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-2xl" />
                                </div>
                                <h2 className="text-xl font-bold mt-4 text-white">Purchase Theme</h2>
                                <p className="text-[#a8d0e6] mt-2">Add this theme to your collection</p>
                            </div>

                            <div className="bg-[#2a6b87] p-4 rounded-lg mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-300">Theme ID:</span>
                                    <span className="font-mono text-white">{template.unique_id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Price:</span>
                                    <span className="text-yellow-400 font-bold text-lg">EZ$ {template.price}</span>
                                </div>
                            </div>

                            {themePurchaseError && (
                                <div className="mb-4 p-3 bg-red-500/90 text-white rounded-lg flex items-center gap-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    {themePurchaseError}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowThemePurchaseModal(false)}
                                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-70"
                                    disabled={isPurchasingTheme}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={purchaseTheme}
                                    disabled={isPurchasingTheme}
                                    className="flex-1 bg-[#FFD700] text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-[#FFC000] transition-colors disabled:opacity-70 flex items-center justify-center"
                                >
                                    {isPurchasingTheme ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay EZ$ ${template.price}`
                                    )}
                                </button>
                            </div>

                            <div className="mt-4 text-center text-xs text-[#a8d0e6]">
                                <p>This theme will be added to your personal collection after payment.</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Purchase Form Modal */}
                {isPaymentModalOpen && purchaseFormType && (() => {
                    // Use the calculated display prices
                    let finalDisplayPrice = Number(displayFinalPrices.totalPrice);
                    
                    // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                    if (finalDisplayPrice > 0 && finalDisplayPrice < 1) {
                        finalDisplayPrice = 1;
                    }
                    // Allow $0 to remain $0

                    return (
                        <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                            <div className="bg-[#235A72] border border-[#3a7a94] text-white p-8 rounded-lg shadow-lg max-w-md w-full relative max-h-[90vh] overflow-y-auto">
                                <button
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setPurchaseFormType(null);
                                        setErrorMessage('');
                                    }}
                                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
                                    disabled={isLoading}
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content={getTooltip('modal-tooltip', 6)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/20 bg-gradient-to-br from-white/15 to-transparent shadow-lg mx-auto" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 7)}>
                                            <img
                                                src="https://ez.wiki/logo.gif"
                                                className="w-10 h-10 rounded-full object-cover"
                                                alt="ez.wiki Logo"
                                            />
                                        </div>
                                        <h2 className="text-xl font-bold mt-4 text-white" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 8)}>
                                            {purchaseFormType === 'handle' ? 'Handle Purchase' : 'Domain Purchase'}
                                        </h2>
                                        <p className="text-[#a8d0e6] mt-2" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 9)}>
                                            {purchaseFormType === 'handle' 
                                                ? `${selectedDomain}/${brandInput.trim()}`
                                                : `${brandInput.trim()}.${selectedDomain}`
                                            }
                                        </p>
                                        <div className="bg-[#2a6b87] p-4 rounded-lg mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-300">Domain Price:</span>
                                                <span className="text-yellow-400">US${Number(displayFinalPrices.domainPrice).toFixed(2)}</span>
                                            </div>
                                            {Number(displayFinalPrices.themePrice) > 0 && (
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-300">Theme Price:</span>
                                                    <span className="text-purple-400">US${Number(displayFinalPrices.themePrice).toFixed(2)}</span>
                                                </div>
                                            )}
                                            {(Number(displayFinalPrices.themePrice) === 0 && template?.price > 0) && (
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-300">Theme Price:</span>
                                                    <span className={`font-semibold ${
                                                        isThemeOwner ? 'text-yellow-400' : 'text-green-400'
                                                    }`}>
                                                        {isThemeOwner ? 'FREE (You own this theme)' : 'FREE (Already in collection)'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mb-2 border-t border-gray-600 pt-2">
                                                <span className="text-gray-300 font-bold">Total:</span>
                                                <span className="text-green-400 font-bold">US${Number(displayFinalPrices.totalPrice).toFixed(2)}</span>
                                            </div>
                                            {couponStatus.valid && (
                                                <div className="mt-2 p-2 bg-green-900/30 rounded text-center">
                                                    <span className="text-green-400 text-sm">Coupon applied: {couponStatus.message}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-[#2a6b87] p-4 rounded-lg">
                                        {/* Show "Create Account" heading only for non-logged-in users who don't exist */}
                                        {!auth.user && !userExists && (
                                            <div className="mb-4">
                                                <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 31)}>
                                                    Create Account
                                                </h3>
                                            </div>
                                        )}
                                        
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-1" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 11)}>
                                                {auth.user ? 'Email Address' : 'Email Address *'}
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                                className="w-full bg-gray-700 text-white py-2 px-4 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                required
                                                data-tooltip-id="modal-tooltip"
                                                data-tooltip-content={getTooltip('modal-tooltip', 12)}
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
                                        
                                        {/* Password fields - only show if user is not logged in AND doesn't exist */}
                                        {!auth.user && !userExists && (
                                            <>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium mb-1" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 26)}>Password *</label>
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Create your password"
                                                        className="w-full bg-gray-700 text-white py-2 px-4 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                        required
                                                        data-tooltip-id="modal-tooltip"
                                                        data-tooltip-content={getTooltip('modal-tooltip', 27)}
                                                    />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium mb-1" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 28)}>Confirm Password *</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm your password"
                                                        className="w-full bg-gray-700 text-white py-2 px-4 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                        required
                                                        data-tooltip-id="modal-tooltip"
                                                        data-tooltip-content={getTooltip('modal-tooltip', 29)}
                                                    />
                                                    {password !== confirmPassword && confirmPassword && (
                                                        <p className="text-red-400 text-xs mt-1" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 30)}>
                                                            Passwords do not match
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={initiateHandlePayment}
                                        disabled={isLoading || !email || (!auth.user && !userExists && (!password || !confirmPassword || password !== confirmPassword))}
                                        className="w-full bg-[#FFD700] text-gray-900 font-bold py-3 px-4 rounded-full hover:bg-[#FFC000] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                        data-tooltip-id="modal-tooltip"
                                        data-tooltip-content={getTooltip('modal-tooltip', Number(finalDisplayPrice) === 0 ? 13 : 14)}
                                    >
                                        {isLoading ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : Number(finalDisplayPrice) === 0 ? 
                                            `Claim Free ${purchaseFormType === 'handle' ? 'Handle' : 'Domain'}${template?.price > 0 ? (isThemeOwner ? ' + Your Theme' : ' + Free Theme') : ''}` : 
                                            `Buy ${purchaseFormType === 'handle' ? 'Handle' : 'Domain'}${Number(displayFinalPrices.themePrice) > 0 ? ' + Theme' : ''} for US$${Number(finalDisplayPrice).toFixed(2)}`
                                        }
                                    </button>

                                    <div className="text-center text-xs text-[#a8d0e6]">
                                        <p data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 5)}>Payment secured by STRIPE. You'll be taken to a thank you page after the payment.</p>
                                        <p className="mt-1">
                                            <Link href="/terms" className="hover:underline text-white" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 15)}>Terms</Link> and{' '}
                                            <Link href="/privacy" className="hover:underline text-white" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 16)}>Privacy</Link>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Stripe Payment Modal */}
                {isPaymentModalOpen && paymentStep === 2 && (() => {
                    // Use the calculated display prices
                    let stripeFormPrice = Number(displayFinalPrices.totalPrice);
                    
                    // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                    if (stripeFormPrice > 0 && stripeFormPrice < 1) {
                        stripeFormPrice = 1;
                    }
                    // Allow $0 to remain $0

                    return (
                        <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                            <div className="bg-[#235A72] border border-[#3a7a94] text-white p-8 rounded-lg shadow-lg max-w-sm w-full relative max-h-[90vh] overflow-y-auto">
                                <button
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setPaymentStep(1);
                                        setErrorMessage('');
                                    }}
                                    className="sticky top-0 right-0 ml-auto text-white/70 hover:text-white transition-colors z-10"
                                    disabled={isLoading}
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content={getTooltip('modal-tooltip', 17)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <div className="space-y-6">
                                    {errorMessage && (
                                        <div className="bg-red-500/90 text-white p-3 rounded-lg flex items-center gap-2" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 18)}>
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            {errorMessage}
                                        </div>
                                    )}

                                    {isLoading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 19)}>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-white" />
                                        </div>
                                    )}

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
                                                price={Number(stripeFormPrice)}
                                                email={email}
                                                clientSecret={clientSecret}
                                                onSuccess={handlePaymentSuccess}
                                                onBack={() => setPaymentStep(1)}
                                                onError={setErrorMessage}
                                                tooltips={tooltips}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center py-8" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 20)}>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
                                            </div>
                                        )}
                                    </Elements>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Purchase Confirmation Modal */}
                {showPurchaseModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000]">
                        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-green-400">
                            <h3 className="text-xl font-bold text-white mb-4" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 21)}>Confirm Purchase</h3>
                            <p className="text-gray-300 mb-2">
                                You're about to purchase: 
                                <span className="text-green-400 font-medium ml-1" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 22)}>
                                    {activeOption === 'handle' 
                                        ? `@${brandInput.trim()}.${selectedDomain}`
                                        : `${brandInput.trim()}.${selectedDomain}`
                                    }
                                </span>
                            </p>
                            <p className="text-gray-400 text-sm mb-6" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 23)}>
                                This action cannot be undone. Please confirm to proceed.
                            </p>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPurchaseModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                                    disabled={isSubmitting}
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content={getTooltip('modal-tooltip', 24)}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processPurchase}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                                    disabled={isSubmitting}
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content={getTooltip('modal-tooltip', 25)}
                                >
                                    {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />}
                                    Confirm Purchase
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isPanelVisible && (
                <div className={`relative mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-4xl ${
  auth.user ? 'mt-4' : 'mt-17'
}`}>
                    <button 
                        onClick={() => setIsPanelVisible(false)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center z-50 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Close panel"
                        data-tooltip-id="action-tooltip"
                        data-tooltip-content={getTooltip('action-tooltip', 18)}
                    >
                        <FontAwesomeIcon 
                            icon={faTimes} 
                            className="text-white text-lg" 
                            style={{ textShadow: '0.7px 0.7px 0 rgb(255,0,0), -0.7px -0.7px 0 rgb(0,255,255)' }}
                        />
                    </button>
                    <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-4">
                        <div className="bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10 border border-gray-700">
                            <div className="text-center mb-10">
                                <h3 className="text-2xl font-bold text-white mb-4" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 0)}>Get Started with Your Web3 Presence</h3>
                                <p className="text-gray-300" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 1)}>Choose your preferred option below</p>
                            </div>

                            {/* Toggle buttons - Only show domain option for now */}
                            <div className="flex justify-center items-center gap-4 mb-10">
                                <button 
                                    onClick={() => handleOptionChange('domain')}
                                    className={`flex items-center justify-center py-3 px-8 rounded-xl shadow-md font-bold transition-all ${
                                        activeOption === 'domain' 
                                            ? 'bg-green-500 text-white border-2 border-green-400' 
                                            : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                                    }`}
                                    data-tooltip-id="form-tooltip"
                                    data-tooltip-content={getTooltip('form-tooltip', 2)}
                                >
                                    <FontAwesomeIcon icon={faGlobe} className="mr-2" /> Brand Domain
                                </button>
                            </div>

                            {/* Input container - Conditionally rendered based on activeOption */}
                            <div className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-2xl mx-auto mb-8">
                                {activeOption === 'handle' ? (
                                    <>
                                        {/* Brand Handle: Select first, then input */}
                                        <div className="relative w-full md:w-2/5">
                                            <select 
                                                className="w-full bg-gray-700 text-white py-4 px-6 pr-10 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent appearance-none"
                                                value={selectedDomain}
                                                onChange={(e) => setSelectedDomain(e.target.value)}
                                                data-tooltip-id="form-tooltip"
                                                data-tooltip-content={getTooltip('form-tooltip', 3)}
                                            >
                                                {domains?.map((domain: Domain) => (
                                                    <option key={domain.id} value={domain.domain}>
                                                        https://{domain.domain}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="relative w-full md:w-2/5">
                                            <input 
                                                type="text" 
                                                placeholder="Enter your brand handle"
                                                className="w-full bg-gray-700 border border-gray-600 text-white py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                                                value={brandInput}
                                                onChange={(e) => setBrandInput(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        checkAvailability();
                                                    }
                                                }}
                                                data-tooltip-id="form-tooltip"
                                                data-tooltip-content={getTooltip('form-tooltip', 4)}
                                            />
                                            {brandInput && (
                                                <button 
                                                    onClick={checkAvailability}
                                                    disabled={isSubmitting || availabilityStatus.checking}
                                                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                                        availabilityStatus.available === false 
                                                            ? 'bg-red-500 hover:bg-red-600' 
                                                            : 'bg-green-500 hover:bg-green-600'
                                                    }`}
                                                    data-tooltip-id="form-tooltip"
                                                    data-tooltip-content={getTooltip('form-tooltip', 5)}
                                                >
                                                    {availabilityStatus.checking ? (
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                    ) : availabilityStatus.available ? (
                                                        <FontAwesomeIcon icon={faCheckCircle} />
                                                    ) : availabilityStatus.available === false ? (
                                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                                    ) : (
                                                        "Check"
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Brand Domain: Input first, then select */}
                                        <div className="relative w-full md:w-2/5">
                                            <input 
                                                type="text" 
                                                placeholder="Enter your brand domain"
                                                className="w-full bg-gray-700 border border-gray-600 text-white py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                                                value={brandInput}
                                                onChange={(e) => setBrandInput(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        checkAvailability();
                                                    }
                                                }}
                                                data-tooltip-id="form-tooltip"
                                                data-tooltip-content={getTooltip('form-tooltip', 6)}
                                            />
                                        </div>
                                        <div className="relative w-full md:w-2/5">
                                            <select 
                                                className="w-full bg-gray-700 text-white py-4 px-6 pr-10 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent appearance-none"
                                                value={selectedDomain}
                                                onChange={(e) => setSelectedDomain(e.target.value)}
                                                data-tooltip-id="form-tooltip"
                                                data-tooltip-content={getTooltip('form-tooltip', 8)}
                                            >
                                                {domains?.map((domain: Domain) => (
                                                    <option key={domain.id} value={domain.domain}>
                                                        .{domain.domain}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </>
                                )}
                                
                                <button 
                                    onClick={checkAvailability}
                                    className={`w-full md:w-1/5 text-white font-bold py-4 px-6 rounded-xl shadow-md flex items-center justify-center transition-all ${
                                        availabilityStatus.checking 
                                            ? 'bg-gray-600 text-gray-300' 
                                            : availabilityStatus.available !== null 
                                                ? (availabilityStatus.available 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-red-600 text-white')
                                                : 'bg-green-600 text-white'
                                    }`}
                                    disabled={isSubmitting || !brandInput || availabilityStatus.checking}
                                    data-tooltip-id="form-tooltip"
                                    data-tooltip-content={getTooltip('form-tooltip', 9)}
                                >
                                    <span>
                                        {availabilityStatus.checking 
                                            ? 'Checking...' 
                                            : availabilityStatus.available !== null 
                                                ? (availabilityStatus.available 
                                                    ? 'Available' 
                                                    : 'Unavailable')
                                                : 'Check'
                                        }
                                    </span>
                                    {!availabilityStatus.checking && availabilityStatus.available !== null && (
                                        <FontAwesomeIcon 
                                            icon={availabilityStatus.available ? faCheckCircle : faExclamationTriangle} 
                                            className="ml-2" 
                                        />
                                    )}
                                </button>
                            </div>

                            {/* Purchase Success Alert */}
                            {purchaseSuccess.success && (
                                <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-xl backdrop-blur-sm">
                                    <div className="flex items-center justify-center gap-3 text-green-400 mb-2" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 24)}>
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
                                        <span className="text-lg font-semibold">Purchase Successful!</span>
                                    </div>
                                    <div className="text-center text-white mb-3" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 25)}>
                                        {purchaseSuccess.message}
                                        <a 
                                            href={purchaseSuccess.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:underline font-medium ml-1"
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content={getTooltip('action-tooltip', 26)}
                                        >
                                            {purchaseSuccess.url}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Availability Status */}
                            {!purchaseSuccess.success && availabilityStatus.message && (
                                <div className={`text-center mb-4 transition-all duration-300 ${availabilityStatus.checking ? 'opacity-70' : 'opacity-100'}`}>
                                    {/* Status Message */}
                                    <div className={`flex items-center justify-center gap-2 text-sm font-medium mb-2 ${
                                        availabilityStatus.available ? 'text-green-400' : 
                                        availabilityStatus.available === false ? 'text-red-400' : 
                                        'text-yellow-400'
                                    }`} data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 10)}>
                                        {availabilityStatus.checking ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                Checking availability...
                                            </>
                                        ) : (
                                            <>
                                                {availabilityStatus.available ? (
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400" />
                                                )}
                                                {availabilityStatus.message}
                                            </>
                                        )}
                                    </div>

                                    {/* Purchase Form (only show when available) */}
                                    {availabilityStatus.available && availabilityStatus.price !== undefined && (() => {
                                        return (
                                            <div className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                                {/* Theme Price Row - Always show if theme has price */}
                                                {template?.price > 0 && (
                                                    <div className={`mb-4 p-3 rounded-lg border ${
                                                        isThemeOwner || isInCollection || template?.price === 0 
                                                            ? 'bg-green-900/30 border-green-500/50' 
                                                            : 'bg-purple-900/30 border-purple-500/50'
                                                    }`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-300">Theme Price:</span>
                                                            <span className={`font-semibold ${
                                                                isThemeOwner || isInCollection || template?.price === 0 
                                                                    ? 'text-green-400' 
                                                                    : 'text-yellow-400'
                                                            }`}>
                                                                {isThemeOwner 
                                                                    ? 'FREE (You own this theme)' 
                                                                    : isInCollection || template?.price === 0 
                                                                        ? 'FREE (Already in collection)' 
                                                                        : `EZ$ ${template?.price} (US$${Number(displayFinalPrices.themePrice).toFixed(2)})`
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            This theme will be included with your domain purchase
                                                            {couponStatus.valid && !isThemeOwner && !isInCollection && template?.price > 0 && (
                                                                <span className="text-green-400 ml-1">
                                                                    • Discount applied: US${(Number(template.price) - Number(displayFinalPrices.themePrice)).toFixed(2)} off!
                                                                </span>
                                                            )}
                                                            {isThemeOwner && (
                                                                <span className="text-green-400 ml-1">
                                                                    • You created this theme - no charge!
                                                                </span>
                                                            )}
                                                            {isInCollection && !isThemeOwner && (
                                                                <span className="text-green-400 ml-1">
                                                                    • Theme already in your collection - no additional charge!
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                    <div className="bg-[#1f2937] p-2 rounded-md border border-gray-700 flex items-center justify-center" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 11)}>
                                                        <p className="text-white font-mono">
                                                            <span className="text-green-400">{brandInput.trim()}</span>.{selectedDomain}
                                                        </p>
                                                    </div>
                                                    <div className="bg-[#1f2937] p-2 rounded-md border border-gray-700 flex items-center justify-center gap-4" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 12)}>
                                                        <span className="text-gray-300">{availabilityStatus.charCount} letters</span>
                                                        <span className="text-yellow-400 font-semibold">
                                                            US${Number(displayFinalPrices.domainPrice).toFixed(2)}
                                                            {couponStatus.valid && Number(displayFinalPrices.domainPrice) < (Number(availabilityStatus.promoPrice) || Number(availabilityStatus.price)) && (
                                                                <span className="text-green-400 text-xs ml-1">↓</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="bg-[#1f2937] p-2 rounded-md border border-gray-700 flex items-center justify-center" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 13)}>
                                                        <p className="text-yellow-400 font-mono">
                                                            {couponCode ? `coupon: ${couponCode}` : 'no coupon'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Show savings breakdown when coupon is applied */}
                                                {couponStatus.valid && (
                                                    <div className="mt-4 space-y-2">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-300">Original Domain Price:</span>
                                                            <span className="text-gray-400 line-through">US${(Number(availabilityStatus.promoPrice) || Number(availabilityStatus.price)).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-300">Discounted Domain Price:</span>
                                                            <span className="text-green-400">US${Number(displayFinalPrices.domainPrice).toFixed(2)}</span>
                                                        </div>
                                                        {template?.price > 0 && !isThemeOwner && !isInCollection && (
                                                            <>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-300">Original Theme Price:</span>
                                                                    <span className="text-gray-400 line-through">US${Number(template.price).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-300">Discounted Theme Price:</span>
                                                                    <span className="text-green-400">US${Number(displayFinalPrices.themePrice).toFixed(2)}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                        <div className="flex justify-between items-center text-sm font-semibold mt-2 pt-2 border-t border-gray-600">
                                                            <span className="text-yellow-300">Total Savings:</span>
                                                            <span className="text-yellow-300">
                                                                US${(
                                                                    (Number(availabilityStatus.promoPrice) || Number(availabilityStatus.price)) + 
                                                                    ((!isThemeOwner && !isInCollection && template?.price > 0) ? Number(template.price) : 0) - 
                                                                    Number(displayFinalPrices.totalPrice)
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Show promo price if it exists AND no valid coupon is applied */}
                                                {!couponStatus.valid && Number(availabilityStatus.promoPrice) > 0 && (
                                                    <div className="bg-blue-900/30 p-3 rounded-lg my-4" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 16)}>
                                                        <p className="text-green-400 font-semibold">
                                                            Pre-launch Price: US${Number(availabilityStatus.promoPrice).toFixed(2)}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Total Price Display */}
                                                <div className="bg-gray-800/50 p-3 mt-4 rounded-lg mb-4 border border-gray-600">
                                                    <div className="flex items-center justify-between text-lg font-bold">
                                                        <span className="text-white">Total Price:</span>
                                                        <span className="text-green-400">
                                                            US${Number(displayFinalPrices.totalPrice).toFixed(2)}
                                                            {couponStatus.valid && (
                                                                <span className="text-green-400 text-sm ml-2">🎉</span>
                                                            )}
                                                            {(isThemeOwner || isInCollection || template?.price === 0) && template?.price > 0 && (
                                                                <span className="text-green-400 text-sm ml-2">🎁</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {template?.price > 0 && (
                                                        <div className="text-xs text-gray-300 mt-1">
                                                            Includes domain (US${Number(displayFinalPrices.domainPrice).toFixed(2)}) + {
                                                                isThemeOwner 
                                                                    ? 'FREE theme (you own this theme)' 
                                                                    : isInCollection 
                                                                        ? 'FREE theme (already in collection)' 
                                                                        : `theme (EZ$ ${template?.price} = US$${Number(displayFinalPrices.themePrice).toFixed(2)})`
                                                            }
                                                            {couponStatus.valid && !isThemeOwner && !isInCollection && (
                                                                <div className="text-green-400 mt-1">
                                                                    Coupon applied: {couponStatus.message}
                                                                </div>
                                                            )}
                                                            {(isThemeOwner || isInCollection) && (
                                                                <div className="text-green-400 mt-1">
                                                                    {isThemeOwner 
                                                                        ? 'You created this theme - no additional charge!' 
                                                                        : 'Theme already in your collection - no additional charge!'
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Always show the input row */}
                                                <div className="flex flex-col md:flex-row gap-3 mt-4">
                                                    <div className="flex-1">
                                                        <label className="text-gray-300 text-sm" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 17)}>Coupon Code</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                            placeholder="Enter coupon code"
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value)}
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content={getTooltip('form-tooltip', 18)}
                                                        />
                                                        {couponCode && (
                                                            <div className={`mt-1 text-xs ${
                                                                couponStatus.valid ? 'text-green-400' : 
                                                                couponStatus.valid === false ? 'text-red-400' : 'text-yellow-400'
                                                            }`} data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 19)}>
                                                                {couponStatus.message || 'Validating coupon...'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-gray-300 text-sm" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 20)}>NYP (optional)</label>
                                                        <input
                                                            type="number"
                                                            className="input-no-spinner w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                            min="0"
                                                            step="1"
                                                            placeholder="Set price for marketplace"
                                                            onChange={() => {}}
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content={getTooltip('form-tooltip', 21)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-4 text-xs text-gray-400">
                                                    <div className="flex items-start">
                                                        <input
                                                            type="checkbox"
                                                            id="terms-checkbox"
                                                            required
                                                            className="mt-1 mr-2"
                                                            checked={termsAgreed}
                                                            onChange={(e) => setTermsAgreed(e.target.checked)}
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content={getTooltip('form-tooltip', 22)}
                                                        />
                                                        <label htmlFor="terms-checkbox" className="text-sm leading-normal text-gray-300 ml-1">
                                                            By claiming your {activeOption === 'handle' ? 'handle' : 'domain'} you agree to the current user{' '}
                                                            <button 
                                                                type="button" 
                                                                onClick={() => window.open('/terms-and-conditions', '_blank')}
                                                                className="text-yellow-400 hover:underline focus:outline-none focus:underline"
                                                                data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 23)}
                                                            >
                                                                Terms and Conditions
                                                            </button>{' '}
                                                            and{' '}
                                                            <button 
                                                                type="button" 
                                                                onClick={() => window.open('/privacy-policy', '_blank')}
                                                                className="text-yellow-400 hover:underline focus:outline-none focus:underline"
                                                                data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 24)}
                                                            >
                                                                Privacy Policy
                                                            </button>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* PURCHASE BUTTON - USING SINGLE SOURCE OF TRUTH */}
                                                <button
                                                    onClick={() => {
                                                        if (Number(displayFinalPrices.totalPrice) === 0) {
                                                            setPurchaseFormType(activeOption);
                                                            setIsPaymentModalOpen(true);
                                                        } else {
                                                            handlePurchase();
                                                        }
                                                    }}
                                                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isSubmitting || !termsAgreed}
                                                    data-tooltip-id="action-tooltip"
                                                    data-tooltip-content={getTooltip('action-tooltip', Number(displayFinalPrices.totalPrice) === 0 ? 19 : 20)}
                                                >
                                                    {isSubmitting ? 'Processing...' : 
                                                        Number(displayFinalPrices.totalPrice) === 0 ? 
                                                            `Claim Free ${activeOption === 'handle' ? 'Handle' : 'Domain'}${template?.price > 0 ? (
                                                                isThemeOwner ? ' + Your Theme' : 
                                                                isInCollection ? ' + Free Theme' : ' + Theme'
                                                            ) : ''}` : 
                                                            `Buy ${activeOption === 'handle' ? 'Handle' : 'Domain'}${template?.price > 0 ? (
                                                                isThemeOwner ? ' + Your Theme' : 
                                                                isInCollection ? ' + Free Theme' : ' + Theme'
                                                            ) : ''} for US$${Number(displayFinalPrices.totalPrice).toFixed(2)}`
                                                    }
                                                    {!termsAgreed && !isSubmitting && (
                                                        <span className="block text-xs mt-1 text-yellow-300" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 21)}>Please agree to terms & conditions</span>
                                                    )}
                                                </button>
                                                
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="text-center text-sm text-gray-400" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 25)}>
                                <p>Secure your unique identity in the Web3 space today</p>
                            </div>
                        </div>

                        {/* Features Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                            <div className="feature-card bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 transition-all duration-700 hover:border-green-400/30 hover:translate-y-[-5px]" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 22)}>
                                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-xl mb-4">
                                    <FontAwesomeIcon icon={faFingerprint} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Digital Identity</h3>
                                <p className="text-gray-300">Establish your unique presence in the decentralized web with a verifiable identity.</p>
                            </div>
                            
                            <div className="feature-card bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 transition-all duration-700 hover:border-green-400/30 hover:translate-y-[-5px]" style={{transitionDelay: '0.1s'}} data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 23)}>
                                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-xl mb-4">
                                    <FontAwesomeIcon icon={faHandshake} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Co-Branding</h3>
                                <p className="text-gray-300">Leverage partnerships and collaborative opportunities through our promotional services.</p>
                            </div>
                            
                            <div className="feature-card bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 transition-all duration-700 hover:border-green-400/30 hover:translate-y-[-5px]" style={{transitionDelay: '0.2s'}} data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 24)}>
                                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-xl mb-4">
                                    <FontAwesomeIcon icon={faBullhorn} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Brand Advocacy</h3>
                                <p className="text-gray-300">Turn your audience into brand advocates with integrated Web3 solutions.</p>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </main>
        </>
    );
}