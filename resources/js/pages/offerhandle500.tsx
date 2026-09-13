import { useEffect, useState, useCallback } from 'react';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import { 
    faDownload, 
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
    faHashtag,
    faAt,
    faArrowRight,
    faFingerprint,
    faHandshake,
    faBullhorn,
    faStar,
    faSpinner,
    faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Domain = {
    id: number;
    domain: string;
};

type Funnel = {
    id: number;
    name: string;
};

type PromotionMessage = {
    message: string;
    coupon?: {
        coupon: string;
    };
};

type SharedDataWithPromotion = SharedData & {
    promotionmessage?: PromotionMessage;
    defaultCouponCode?: string;
    clean_domain?: string;
    codepage?: string;
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

// Safe tooltip helper function
const getTooltipContent = (tooltips: any, reference: string, index: number = 0): string => {
    if (!tooltips || !tooltips[reference]) {
        return '';
    }
    
    try {
        const tooltipValue = tooltips[reference];
        
        if (typeof tooltipValue === 'string') {
            if (tooltipValue.trim().startsWith('[') && tooltipValue.trim().endsWith(']')) {
                try {
                    const parsed = JSON.parse(tooltipValue);
                    if (Array.isArray(parsed)) {
                        return parsed[index] || parsed[0] || '';
                    }
                    return tooltipValue;
                } catch {
                    return tooltipValue;
                }
            }
            return tooltipValue;
        }
        
        if (Array.isArray(tooltipValue)) {
            return tooltipValue[index] || tooltipValue[0] || '';
        }
        
        if (typeof tooltipValue === 'object' && tooltipValue !== null) {
            return tooltipValue[index] || tooltipValue[0] || '';
        }
        
        return '';
    } catch (error) {
        console.error('Error parsing tooltip:', error);
        return '';
    }
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
                console.error('Payment form validation failed:', submitError);
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
                console.error('Stripe payment error:', stripeError);
                setError(stripeError.message || 'Payment failed');
                return;
            }

            if (!paymentIntent) {
                console.error('No payment intent returned');
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
                default:
                    setError(`Payment failed. Status: ${paymentIntent.status}`);
            }
        } catch (err) {
            console.error('Unexpected error during payment processing:', err);
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
                    <span className="text-yellow-400">US${typeof price === 'number' ? price.toFixed(2) : '0.00'}</span>
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
                    className={`w-full bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors ${
                        isProcessing || !stripe || !isPaymentElementReady ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                >
                    {isProcessing ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            Processing...
                        </>
                    ) : `Pay US$${typeof price === 'number' ? price.toFixed(2) : '0.00'}`}
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

// Helper function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

// Helper function to safely format price
const safeFormatPrice = (price: any): number => {
    const num = Number(price);
    return isNaN(num) ? 0 : num;
};

export default function Home() {
    const { 
        auth, 
        initialFunnels, 
        domains, 
        subdomain,
        checkDomainUrl, 
        checkStandardDomainUrl, 
        tooltips,
        promotionmessage,
        defaultCouponCode = '',
        clean_domain = '',
        codepage = ''
    } = usePage<SharedDataWithPromotion>().props;
    
    useEffect(() => {
        console.log('clean_domain from server:', clean_domain);
        console.log('domains available:', domains);
        console.log('codepage available:', !!codepage);
    }, [clean_domain, domains, codepage]);
    
    const promotionMessageText = promotionmessage?.message || 'Get Your Brand Domain';
    
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy' | 'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
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
    const [isLoading, setIsLoading] = useState(false);
    const [userExists, setUserExists] = useState<boolean | null>(null);

    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [lastCheckedInput, setLastCheckedInput] = useState('');
    const [purchaseFormType, setPurchaseFormType] = useState<'handle' | 'domain' | null>(null);

    const [couponCode, setCouponCode] = useState('');
    const [couponStatus, setCouponStatus] = useState<{
        valid: boolean | null;
        message: string;
        discount: number;
    }>({
        valid: null,
        message: '',
        discount: 0
    });

    const [purchaseSuccess, setPurchaseSuccess] = useState<{
        success: boolean;
        message: string;
        url?: string;
    }>({
        success: false,
        message: '',
        url: ''
    });

    const [termsAgreed, setTermsAgreed] = useState(false);

    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    const getTooltip = useCallback((reference: string, index: number = 0): string => {
        return getTooltipContent(tooltips, reference, index);
    }, [tooltips]);

    useEffect(() => {
        if (defaultCouponCode && !couponCode) {
            setCouponCode(defaultCouponCode);
        }
    }, [defaultCouponCode]);

    useEffect(() => {
        if (initialFunnels) {
            setFunnels(initialFunnels.data);
            setHasMore(initialFunnels.next_page_url !== null);
        }
        
        if (domains && domains.length > 0) {
            if (clean_domain && clean_domain.trim() && domains.some(domain => domain.domain === clean_domain)) {
                console.log('Setting selected domain to clean_domain:', clean_domain);
                setSelectedDomain(clean_domain);
            } else {
                console.log('Falling back to first domain:', domains[0].domain);
                setSelectedDomain(domains[0].domain);
            }
            
            if (subdomain && subdomain.trim()) {
                setBrandInput(subdomain.trim());
                
                setTimeout(() => {
                    checkAvailability();
                }, 500);
            }
        }
    }, [initialFunnels, domains, subdomain, clean_domain]);

    useEffect(() => {
        if (subdomain && subdomain.trim() && domains && domains.length > 0 && selectedDomain) {
            const autoCheckTimer = setTimeout(() => {
                if (subdomain.trim() && selectedDomain && !availabilityStatus.checking) {
                    console.log('Auto-checking availability for:', subdomain.trim(), selectedDomain);
                    checkAvailability();
                }
            }, 1000);
            
            return () => clearTimeout(autoCheckTimer);
        }
    }, [subdomain, domains, selectedDomain]);

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

    useEffect(() => {
        if (defaultCouponCode && brandInput.trim() && couponCode === defaultCouponCode) {
            const timer = setTimeout(() => {
                validateCoupon();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [brandInput, defaultCouponCode, couponCode]);

    const validateCoupon = async () => {
        if (!couponCode.trim() || !brandInput.trim()) {
            setCouponStatus({
                valid: false,
                message: 'Please enter a coupon code and brand name',
                discount: 0
            });
            return;
        }

        try {
            setCouponStatus({
                valid: null,
                message: 'Validating coupon...',
                discount: 0
            });
            
            const response = await axios.post('/couponcodecustomdomain', {
                couponcode: couponCode.trim(),
                domainurl: brandInput.trim(),
                type: activeOption
            });

            if (response.data.valid) {
                let discountedPrice = safeFormatPrice(response.data.offprice);
                if (discountedPrice > 0 && discountedPrice < 1) {
                    discountedPrice = 1;
                }
                
                const cleanMessage = stripHtmlTags(response.data.title || 'Coupon applied successfully!');
                
                setCouponStatus({
                    valid: true,
                    message: cleanMessage,
                    discount: discountedPrice
                });

                setPaymentInfo(prev => ({
                    ...prev,
                    buyingPrice: discountedPrice,
                    couponCode: couponCode.trim()
                }));
            } else {
                const cleanMessage = stripHtmlTags(response.data.title || 'Invalid coupon code');
                
                setCouponStatus({
                    valid: false,
                    message: cleanMessage,
                    discount: 0
                });
            }
        } catch (error) {
            console.error('Coupon validation error:', error);
            setCouponStatus({
                valid: false,
                message: 'Error validating coupon. Please try again.',
                discount: 0
            });
        }
    };

    useEffect(() => {
        if (couponCode.trim() && brandInput.trim()) {
            const timer = setTimeout(() => {
                validateCoupon();
            }, 800);
            
            return () => clearTimeout(timer);
        }
    }, [couponCode, brandInput]);

    const handleOptionChange = (option: 'handle' | 'domain') => {
        setActiveOption(option);
        setAvailabilityStatus({
            checking: false,
            available: null,
            message: ''
        });
        setTermsAgreed(false);
    };

    const checkAvailability = async () => {
        const brandToCheck = brandInput.trim() || (subdomain ? subdomain.trim() : '');
        
        if (!brandToCheck || !selectedDomain) {
            setAvailabilityStatus({
                checking: false,
                available: false,
                message: 'Please enter a brand name and select a domain'
            });
            return;
        }

        const currentInput = `${brandToCheck}-${selectedDomain}-${activeOption}`;
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
                handle: brandToCheck,
                domain: selectedDomain
            });
            setPurchaseSuccess({
                success: false,
                message: '',
                url: ''
            });
            
            const price = safeFormatPrice(response.data.price);
            const promoPrice = safeFormatPrice(response.data.promoPrice);
            const charCount = response.data.charCount || 0;

            setAvailabilityStatus({
                checking: false,
                available: response.data.available,
                message: response.data.message,
                price: price,
                promoPrice: promoPrice,
                charCount: charCount
            });

            if (response.data.available) {
                let buyingPrice = promoPrice > 0 ? promoPrice : price;
                if (buyingPrice > 0 && buyingPrice < 1) {
                    buyingPrice = 1;
                }
                
                setPaymentInfo(prev => ({
                    ...prev,
                    price: price,
                    promoPrice: promoPrice,
                    buyingPrice: buyingPrice
                }));
            }

        } catch (error: any) {
            console.error('Error checking domain availability:', error);
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

    useEffect(() => {
        if (brandInput.trim() && selectedDomain) {
            const timer = setTimeout(() => {
                checkAvailability();
            }, 800);
            
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

        if (userExists === null) {
            setErrorMessage('Checking user account...');
            return;
        }

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

        let finalPrice = safeFormatPrice(paymentInfo.buyingPrice);
        if (finalPrice > 0 && finalPrice < 1) {
            finalPrice = 1;
        }
        
        if (finalPrice === 0) {
            setErrorMessage('');
            setIsLoading(true);
            try {
                const response = await axios.post('/free-purchase', {
                    email: email,
                    password: (!auth.user && !userExists) ? password : undefined,
                    custom_handle: brandInput.trim(),
                    domain: selectedDomain,
                    type: activeOption,
                    coupon_code: couponCode,
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
                        message: `Purchase successful! Your new URL: `,
                        url: url
                    });
                    
                    setIsPaymentModalOpen(false);
                    setPurchaseFormType(null);
                    setErrorMessage('');
                    
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
                            discount: 0
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

        if (finalPrice < 1 && finalPrice !== 0) {
            setErrorMessage('Minimum payment amount is $1');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);
        try {
            const endpoint = activeOption === 'handle' ? '/initiate-handle-homepayment' : '/initiate-domain-homepayment';
            const response = await axios.post(endpoint, {
                price: safeFormatPrice(paymentInfo.price),
                email: email,
                password: (!auth.user && !userExists) ? password : undefined,
                custom_handle: brandInput.trim(),
                domain: selectedDomain,
                promo_price: safeFormatPrice(paymentInfo.promoPrice),
                coupon_code: couponCode,
                selling_price: 0,
                payment_method: 'usd',
                funnelId: 0
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
            const endpoint = activeOption === 'handle' ? '/home-handle-success' : '/home-domain-handle-success';
            const response = await axios.post(endpoint, {
                payment_intent_id: paymentIntentId
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
                    message: `Purchase successful! Your new URL: `,
                    url: url
                });
                
                setIsPaymentModalOpen(false);
                setPurchaseFormType(null);
                
                setPaymentStep(1);
                setClientSecret('');
                setPaymentIntentId('');
                setErrorMessage('');
                
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
                        discount: 0
                    });
                    setTermsAgreed(false);
                    setPassword('');
                    setConfirmPassword('');
                }, 5000);
            } else {
                setErrorMessage(response.data.error || 'Payment verification failed');
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            if (axios.isAxiosError(error)) {
                setErrorMessage(error.response?.data?.error || 'Payment verification failed');
            } else {
                setErrorMessage('Failed to verify payment. Please contact support.');
            }
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

        if (!termsAgreed) {
            setErrorMessage('Please agree to the terms and conditions');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        setPurchaseFormType(activeOption);
        
        const price = safeFormatPrice(availabilityStatus.price);
        const promoPrice = safeFormatPrice(availabilityStatus.promoPrice);
        let buyingPrice = couponStatus.valid ? safeFormatPrice(couponStatus.discount) : (promoPrice > 0 ? promoPrice : price);
        
        if (buyingPrice > 0 && buyingPrice < 1) {
            buyingPrice = 1;
        }
        
        setPaymentInfo({
            show: true,
            price: price,
            promoPrice: promoPrice,
            couponCode: couponCode,
            buyingPrice: buyingPrice
        });
        setIsPaymentModalOpen(true);
    };

    const processPurchase = async () => {
        setIsSubmitting(true);
        setShowPurchaseModal(false);
        
        try {
            const response = await axios.post('/api/purchase', {
                brand: brandInput.trim(),
                domain: selectedDomain,
                type: activeOption
            });
            
            setSuccessMessage(`Success! Your ${activeOption === 'handle' ? 'brand handle' : 'domain'} has been reserved.`);
            setTimeout(() => setSuccessMessage(''), 5000);
            
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
                discount: 0
            });
            setTermsAgreed(false);
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

    return (
        <>
            <Head>
                <title>EZ.wiki - Get Your Brand Domain</title>
                <meta name="description" content="Get your unique brand domain and establish your Web3 presence" />
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
                `}</style>
            </Head>
            
            <Tooltip id="nav-tooltip" />
            <Tooltip id="action-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="modal-tooltip" />
            <DraggableMenu auth={auth} />
            <main className="relative flex justify-center items-center p-4 min-h-screen overflow-hidden">
                {errorMessage && (
                    <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-500">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-500">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                        {successMessage}
                    </div>
                )}
                
                {isPaymentModalOpen && purchaseFormType && (() => {
                    let basePrice = couponStatus.valid ? safeFormatPrice(couponStatus.discount) : safeFormatPrice(paymentInfo.buyingPrice);
                    let finalDisplayPrice = basePrice;
                    if (finalDisplayPrice > 0 && finalDisplayPrice < 1) {
                        finalDisplayPrice = 1;
                    }

                    return (
                        <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                            <div className="bg-gray-800 border border-gray-700 text-white p-8 rounded-xl shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
                                <button
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setPurchaseFormType(null);
                                        setErrorMessage('');
                                    }}
                                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
                                    disabled={isLoading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

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
                                            {purchaseFormType === 'handle' ? 'Handle Purchase' : 'Domain Purchase'}
                                        </h2>
                                        <p className="text-gray-300 mt-2">
                                            {purchaseFormType === 'handle' 
                                                ? `${selectedDomain}/${brandInput.trim()}`
                                                : `${brandInput.trim()}.${selectedDomain}`
                                            }
                                        </p>
                                        <p className="text-gray-300">
                                            {purchaseFormType === 'handle' 
                                                ? `${brandInput.trim().length} letters – US$${finalDisplayPrice.toFixed(2)}`
                                                : `US$${finalDisplayPrice.toFixed(2)}`
                                            }
                                            {couponStatus.valid && (
                                                <span className="text-green-400 ml-2">
                                                    (Coupon applied!)
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="bg-gray-700/50 p-4 rounded-xl">
                                        {!auth.user && !userExists && (
                                            <div className="mb-4">
                                                <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
                                                    Create Account
                                                </h3>
                                            </div>
                                        )}
                                        
                                        <div className="mb-4">
                                            <label className="block text-yellow-400 font-medium mb-1">
                                                {auth.user ? 'Email Address' : 'Email Address *'}
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                                className="w-full bg-gray-700 text-white py-3 px-4 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                                                    <label className="block text-yellow-400 font-medium mb-1">Password *</label>
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Create your password"
                                                        className="w-full bg-gray-700 text-white py-3 px-4 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block text-yellow-400 font-medium mb-1">Confirm Password *</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm your password"
                                                        className="w-full bg-gray-700 text-white py-3 px-4 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                                        onClick={initiateHandlePayment}
                                        disabled={isLoading || !email || (!auth.user && !userExists && (!password || !confirmPassword || password !== confirmPassword))}
                                        className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : finalDisplayPrice === 0 ? 
                                            `Claim Free ${purchaseFormType === 'handle' ? 'Handle' : 'Domain'}` : 
                                            `Buy ${purchaseFormType === 'handle' ? 'Handle' : 'Domain'} for US$${finalDisplayPrice.toFixed(2)}`
                                        }
                                    </button>

                                    <div className="text-center text-xs text-gray-400">
                                        <p>Payment secured by STRIPE. You'll be taken to a thank you page after the payment.</p>
                                        <p className="mt-1">
                                            <Link href="/terms" className="hover:underline text-yellow-400">Terms</Link> and{' '}
                                            <Link href="/privacy" className="hover:underline text-yellow-400">Privacy</Link>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {isPaymentModalOpen && paymentStep === 2 && (() => {
                    let stripeFormPrice = safeFormatPrice(paymentInfo.buyingPrice);
                    if (stripeFormPrice > 0 && stripeFormPrice < 1) {
                        stripeFormPrice = 1;
                    }

                    return (
                        <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                            <div className="bg-gray-800 border border-gray-700 text-white p-8 rounded-xl shadow-2xl max-w-sm w-full relative max-h-[90vh] overflow-y-auto">
                                <button
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setPaymentStep(1);
                                        setErrorMessage('');
                                    }}
                                    className="sticky top-0 right-0 ml-auto text-white/70 hover:text-white transition-colors z-10"
                                    disabled={isLoading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <div className="space-y-6">
                                    {errorMessage && (
                                        <div className="bg-red-500/90 text-white p-3 rounded-xl flex items-center gap-2">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            {errorMessage}
                                        </div>
                                    )}

                                    {isLoading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
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
                                                    colorBackground: '#1f2937',
                                                    colorText: 'white',
                                                    colorDanger: '#ff6b6b',
                                                    fontFamily: 'Inter, system-ui, sans-serif',
                                                }
                                            }
                                        }}
                                    >
                                        {clientSecret ? (
                                            <StripeCheckoutForm
                                                price={stripeFormPrice}
                                                email={email}
                                                clientSecret={clientSecret}
                                                onSuccess={handlePaymentSuccess}
                                                onBack={() => setPaymentStep(1)}
                                                onError={setErrorMessage}
                                                tooltips={tooltips}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center py-8">
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
                                            </div>
                                        )}
                                    </Elements>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {showPurchaseModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-1000">
                        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-green-400">
                            <h3 className="text-xl font-bold text-white mb-4">Confirm Purchase</h3>
                            <p className="text-gray-300 mb-2">
                                You're about to purchase: 
                                <span className="text-green-400 font-medium ml-1">
                                    {activeOption === 'handle' 
                                        ? `@${brandInput.trim()}.${selectedDomain}`
                                        : `${brandInput.trim()}.${selectedDomain}`
                                    }
                                </span>
                            </p>
                            <p className="text-gray-400 text-sm mb-6">
                                This action cannot be undone. Please confirm to proceed.
                            </p>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPurchaseModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processPurchase}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />}
                                    Confirm Purchase
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isPanelVisible && (
                    <div className={`relative mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-4xl mt-4`}>
                        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 space-y-6">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    {promotionMessageText}
                                </h3>
                                <p className="text-gray-300">Choose your preferred option below</p>
                            </div>
                            
                            <div className="flex justify-center items-center gap-4">
                                <button 
                                    onClick={() => handleOptionChange('domain')}
                                    className={`flex items-center justify-center py-3 px-8 rounded-xl font-bold transition-all ${
                                        activeOption === 'domain' 
                                            ? 'bg-yellow-500 text-black border-2 border-yellow-400' 
                                            : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faGlobe} className="mr-2" /> Brand Domain
                                </button>
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-2xl mx-auto">
                                <div className="relative w-full md:w-2/5">
                                    <input 
                                        type="text" 
                                        placeholder="Enter your brand domain"
                                        className="w-full bg-gray-700 border border-gray-600 text-white py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        value={brandInput}
                                        onChange={(e) => {
                                            setBrandInput(e.target.value);
                                            if (couponCode === defaultCouponCode) {
                                                setCouponCode('');
                                                setCouponStatus({
                                                    valid: null,
                                                    message: '',
                                                    discount: 0
                                                });
                                            }
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                checkAvailability();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="relative w-full md:w-2/5">
                                    <select 
                                        className="w-full bg-gray-700 text-white py-4 px-6 pr-10 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none"
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value)}
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
                                
                                <button 
                                    onClick={checkAvailability}
                                    className={`w-full md:w-1/5 text-white font-bold py-4 px-6 rounded-xl shadow-md flex items-center justify-center transition-all ${
                                        availabilityStatus.checking 
                                            ? 'bg-gray-600 text-gray-300' 
                                            : availabilityStatus.available !== null 
                                                ? (availabilityStatus.available 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-red-600 text-white')
                                                : 'bg-yellow-500 text-black'
                                    }`}
                                    disabled={isSubmitting || !brandInput || availabilityStatus.checking}
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

                            {purchaseSuccess.success && (
                                <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-xl backdrop-blur-sm">
                                    <div className="flex items-center justify-center gap-3 text-green-400 mb-2">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
                                        <span className="text-lg font-semibold">Purchase Successful!</span>
                                    </div>
                                    <div className="text-center text-white mb-3">
                                        {purchaseSuccess.message}
                                        <a 
                                            href={purchaseSuccess.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:underline font-medium ml-1"
                                        >
                                            {purchaseSuccess.url}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {!purchaseSuccess.success && availabilityStatus.message && (
                                <div className={`text-center transition-all duration-300 ${availabilityStatus.checking ? 'opacity-70' : 'opacity-100'}`}>
                                    <div className={`flex items-center justify-center gap-2 text-sm font-medium mb-2 ${
                                        availabilityStatus.available ? 'text-green-400' : 
                                        availabilityStatus.available === false ? 'text-red-400' : 
                                        'text-yellow-400'
                                    }`}>
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

                                    {availabilityStatus.available && codepage && (
                                        <div className="relative mb-8 overflow-hidden rounded-2xl">
                                            <div 
                                                dangerouslySetInnerHTML={{ __html: codepage }} 
                                                className="w-full [&_*]:max-w-full [&_img]:w-full [&_img]:h-auto [&_img]:object-contain [&_iframe]:w-full [&_iframe]:h-auto [&_iframe]:aspect-video"
                                            />
                                        </div>
                                    )}

                                    {availabilityStatus.available && availabilityStatus.price !== undefined && (() => {
                                        let basePriceForButton = couponStatus.valid ? safeFormatPrice(couponStatus.discount) : safeFormatPrice(paymentInfo.buyingPrice);
                                        let finalPriceForButton = basePriceForButton;
                                        if (finalPriceForButton > 0 && finalPriceForButton < 1) {
                                            finalPriceForButton = 1;
                                        }

                                        const initialPrice = availabilityStatus.promoPrice > 0 ? (availabilityStatus.promoPrice ?? 0) : (availabilityStatus.price ?? 0);
                                        let gridDisplayPrice = couponStatus.valid ? safeFormatPrice(couponStatus.discount) : initialPrice;

                                        if (gridDisplayPrice > 0 && gridDisplayPrice < 1) {
                                            gridDisplayPrice = 1;
                                        }

                                        let promoDisplayPrice = availabilityStatus.promoPrice ?? 0;
                                        if (promoDisplayPrice > 0 && promoDisplayPrice < 1) {
                                            promoDisplayPrice = 1;
                                        }

                                        return (
                                            <div className="mt-6 bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                    <div className="bg-gray-700 p-3 rounded-xl border border-gray-600 flex items-center justify-center">
                                                        <p className="text-white font-mono">
                                                            <span className="text-yellow-400">{brandInput.trim()}</span>.{selectedDomain}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-700 p-3 rounded-xl border border-gray-600 flex items-center justify-center gap-4">
                                                        <span className="text-gray-300">{availabilityStatus.charCount} letters</span>
                                                        <span className="text-yellow-400 font-semibold">
                                                            US${gridDisplayPrice.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-700 p-3 rounded-xl border border-gray-600 flex items-center justify-center">
                                                        <p className="text-yellow-400 font-mono">
                                                            coupon code {couponCode}
                                                            {couponCode === defaultCouponCode && (
                                                                <span className="ml-2 text-xs text-yellow-300 bg-yellow-400/20 px-2 py-0.5 rounded-full">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {couponStatus.valid && (
                                                    <div className="flex flex-col sm:flex-row gap-2 mt-4 items-stretch mb-4">
                                                        <div className="flex-1 bg-blue-900/50 p-3 rounded-xl text-center flex flex-col justify-center">
                                                            <p className="text-yellow-300 text-sm font-semibold">
                                                                {(() => {
                                                                    const originalPrice = availabilityStatus.promoPrice || availabilityStatus.price || 0;
                                                                    const discountedPrice = safeFormatPrice(couponStatus.discount);
                                                                    
                                                                    const savings = originalPrice - discountedPrice;
                                                                    
                                                                    let displayOriginalPrice = originalPrice;
                                                                    if (displayOriginalPrice > 0 && displayOriginalPrice < 1) {
                                                                        displayOriginalPrice = 1;
                                                                    }
                                                                    
                                                                    if (couponCode === defaultCouponCode) {
                                                                        if (savings > 0) {
                                                                            return (
                                                                                <>
                                                                                    <span className="line-through text-gray-400 mr-2">
                                                                                        US${displayOriginalPrice.toFixed(2)}
                                                                                    </span>
                                                                                    <span className="text-green-400">
                                                                                        Save US${savings.toFixed(2)} with default coupon!
                                                                                    </span>
                                                                                </>
                                                                            );
                                                                        } else if (originalPrice === 0) {
                                                                            return "✨ Free domain with default coupon! ✨";
                                                                        } else {
                                                                            return "Default promotion applied!";
                                                                        }
                                                                    }
                                                                    
                                                                    if (savings > 0) {
                                                                        return (
                                                                            <>
                                                                                <span className="line-through text-gray-400 mr-2">
                                                                                    US${displayOriginalPrice.toFixed(2)}
                                                                                </span>
                                                                                <span className="text-green-400">
                                                                                    Save US${savings.toFixed(2)}!
                                                                                </span>
                                                                            </>
                                                                        );
                                                                    } else if (discountedPrice > 0 && discountedPrice < originalPrice) {
                                                                        return `Special price: US$${displayOriginalPrice.toFixed(2)} → US$${discountedPrice.toFixed(2)}`;
                                                                    }
                                                                    
                                                                    return "Coupon applied!";
                                                                })()}
                                                            </p>
                                                        </div>
                                                        <div className="flex-1 bg-green-900/50 p-3 rounded-xl text-center flex flex-col justify-center">
                                                            <p className="text-yellow-300 font-semibold">
                                                                You pay : US${gridDisplayPrice.toFixed(2)}
                                                            </p>
                                                            {couponCode === defaultCouponCode && couponStatus.valid && (
                                                                <p className="text-green-300 text-sm mt-1">
                                                                    ✓ Default promotion coupon applied
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {!couponStatus.valid && availabilityStatus.promoPrice > 0 && (
                                                    <div className="bg-blue-900/30 p-3 rounded-xl my-4">
                                                        <p className="text-green-400 font-semibold">
                                                            Pre-launch Price: US${promoDisplayPrice.toFixed(2)}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex flex-col md:flex-row gap-3 mt-4">
                                                    <div className="flex-1">
                                                        <label className="text-gray-300 text-sm">
                                                            Coupon Code
                                                            {couponCode === defaultCouponCode && (
                                                                <span className="ml-2 text-xs text-yellow-400 bg-yellow-400/20 px-2 py-0.5 rounded-full">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                            placeholder="Enter coupon code"
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value)}
                                                        />
                                                        {couponCode && (
                                                            <div className={`mt-1 text-xs ${
                                                                couponStatus.valid ? 'text-green-400' : 
                                                                couponStatus.valid === false ? 'text-red-400' : 'text-yellow-400'
                                                            }`}>
                                                                {couponStatus.message || 'Validating coupon...'}
                                                                {couponCode === defaultCouponCode && couponStatus.valid && (
                                                                    <span className="ml-2 text-green-300">✓ Default promotion coupon</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-gray-300 text-sm">NYP (optional)</label>
                                                        <input
                                                            type="number"
                                                            className="input-no-spinner w-full bg-gray-700 text-white px-4 py-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                            min="0"
                                                            step="1"
                                                            placeholder="Set price for marketplace"
                                                            onChange={(e) => {
                                                                console.log('NYP value:', e.target.value);
                                                            }}
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
                                                        />
                                                        <label htmlFor="terms-checkbox" className="text-sm leading-normal text-gray-300 ml-1">
                                                            By claiming your {activeOption === 'handle' ? 'handle' : 'domain'} you agree to the current user{' '}
                                                            <button 
                                                                type="button" 
                                                                onClick={() => window.open('/terms-and-conditions', '_blank')}
                                                                className="text-yellow-400 hover:underline focus:outline-none focus:underline"
                                                            >
                                                                Terms and Conditions
                                                            </button>{' '}
                                                            and{' '}
                                                            <button 
                                                                type="button" 
                                                                onClick={() => window.open('/privacy-policy', '_blank')}
                                                                className="text-yellow-400 hover:underline focus:outline-none focus:underline"
                                                            >
                                                                Privacy Policy
                                                            </button>
                                                        </label>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        if (finalPriceForButton === 0) {
                                                            setPurchaseFormType(activeOption);
                                                            setIsPaymentModalOpen(true);
                                                        } else {
                                                            handlePurchase();
                                                        }
                                                    }}
                                                    className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isSubmitting || !termsAgreed}
                                                >
                                                    {isSubmitting ? 'Processing...' : 
                                                        finalPriceForButton === 0 ? 
                                                            `Claim Free ${activeOption === 'handle' ? 'Handle' : 'Domain'}` : 
                                                            `Buy ${activeOption === 'handle' ? 'Handle' : 'Domain'} for US$${finalPriceForButton.toFixed(2)}`
                                                    }
                                                    {!termsAgreed && !isSubmitting && (
                                                        <span className="block text-xs mt-1 text-yellow-300">Please agree to terms & conditions</span>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="text-center text-sm text-gray-400">
                                <p>Secure your unique identity in the Web3 space today</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-600 transition-all duration-700 hover:border-yellow-400/30 hover:translate-y-[-5px]">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-xl mb-4">
                                    <FontAwesomeIcon icon={faFingerprint} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Digital Identity</h3>
                                <p className="text-gray-300">Establish your unique presence in the decentralized web with a verifiable identity.</p>
                            </div>
                            
                            <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-600 transition-all duration-700 hover:border-yellow-400/30 hover:translate-y-[-5px]" style={{transitionDelay: '0.1s'}}>
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-xl mb-4">
                                    <FontAwesomeIcon icon={faHandshake} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Co-Branding</h3>
                                <p className="text-gray-300">Leverage partnerships and collaborative opportunities through our promotional services.</p>
                            </div>
                            
                            <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-600 transition-all duration-700 hover:border-yellow-400/30 hover:translate-y-[-5px]" style={{transitionDelay: '0.2s'}}>
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-xl mb-4">
                                    <FontAwesomeIcon icon={faBullhorn} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Brand Advocacy</h3>
                                <p className="text-gray-300">Turn your audience into brand advocates with integrated Web3 solutions.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}