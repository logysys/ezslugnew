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
    faEye // Add this
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
    // Add other funnel properties as needed
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

// Tooltip helper function
const getTooltipContent = (tooltips: any, reference: string, index: number = 0): string => {
    if (!tooltips || !tooltips[reference]) {
        console.warn(`Tooltip reference '${reference}' not found`);
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

            console.log('Payment form validated successfully');

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

            console.log('Payment confirmation result:', { stripeError, paymentIntent });

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

            console.log('Payment intent status:', paymentIntent.status);

            switch (paymentIntent.status) {
                case 'succeeded':
                    console.log('Payment succeeded!');
                    onSuccess();
                    break;
                case 'requires_action':
                    console.log('Payment requires additional action');
                    setError('Payment requires additional authentication. Please complete the verification.');
                    break;
                case 'processing':
                    console.log('Payment processing');
                    setError('Payment is processing. Please wait for confirmation.');
                    break;
                case 'requires_payment_method':
                case 'canceled':
                case 'requires_confirmation':
                default:
                    console.error('Payment failed with status:', paymentIntent.status);
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

export default function Home() {
    const { auth, template, initialFunnels, domains, checkDomainUrl, checkStandardDomainUrl, tooltips } = usePage<SharedData>().props;
    const dragRef = useRef<HTMLDivElement>(null);
    const htmlBlobRef = useRef<Blob | null>(null);
    const htmlUrlRef = useRef<string | null>(null);
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

    // Coupon code state
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

    // Link-in-bio state
    const [link, setLink] = useState('');

    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Memoize the tooltip function to prevent unnecessary re-renders
    const getTooltip = useCallback((reference: string, index: number = 0): string => {
        return getTooltipContent(tooltips, reference, index);
    }, [tooltips]);

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

    // Add useEffect to automatically fill brandInput when link handle is entered
    useEffect(() => {
        if (link.trim()) {
            // Extract handle from link (the part after the last slash)
            const handle = link.split('/').pop();
            if (handle && handle.trim() && !brandInput) {
                // Only auto-fill if brandInput is empty
                setBrandInput(handle.trim());
            }
        }
    }, [link, brandInput]);

    // Add coupon validation function
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
                let discountedPrice = response.data.offprice;
                // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                if (discountedPrice > 0 && discountedPrice < 1) {
                    discountedPrice = 1;
                }
                // Allow $0 to remain $0
                
                // Strip HTML tags from the response message
                const cleanMessage = stripHtmlTags(response.data.title || 'Coupon applied successfully!');
                
                setCouponStatus({
                    valid: true,
                    message: cleanMessage,
                    discount: discountedPrice
                });

                // Update payment info with discounted price
                setPaymentInfo(prev => ({
                    ...prev,
                    buyingPrice: Number(discountedPrice),
                    couponCode: couponCode.trim()
                }));
            } else {
                // Strip HTML tags from the error message too
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

    // Add useEffect to automatically validate coupon when code changes
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
                price: price,
                promoPrice: promoPrice,
                charCount: charCount
            });

            // If available, update payment info with pricing
            if (response.data.available) {
                let buyingPrice = promoPrice > 0 ? promoPrice : price;
                // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                if (buyingPrice > 0 && buyingPrice < 1) {
                    buyingPrice = 1;
                }
                // Allow $0 to remain $0
                
                setPaymentInfo(prev => ({
                    ...prev,
                    price: Number(price),
                    promoPrice: Number(promoPrice),
                    buyingPrice: Number(buyingPrice)
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

        // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
        let finalPrice = paymentInfo.buyingPrice;
        if (finalPrice > 0 && finalPrice < 1) {
            finalPrice = 1;
        }
        // Allow $0 to remain $0
        
        // If price is $0, use free purchase endpoint
        if (finalPrice === 0) {
            setErrorMessage('');
            setIsLoading(true);
            try {
                const response = await axios.post('/free-purchase', {
                    email: email,
                    password: (!auth.user && !userExists) ? password : undefined, // Include password only for new users
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

        // Existing Stripe payment logic for non-zero prices
        if (finalPrice < 1 && finalPrice !== 0) {
            setErrorMessage('Minimum payment amount is $1');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);
        try {
            const endpoint = activeOption === 'handle' ? '/initiate-handle-homepayment' : '/initiate-domain-homepayment';
            const response = await axios.post(endpoint, {
                price: paymentInfo.price,
                email: email,
                password: (!auth.user && !userExists) ? password : undefined, // Include password only for new users
                custom_handle: brandInput.trim(),
                domain: selectedDomain,
                promo_price: paymentInfo.promoPrice,
                coupon_code: couponCode, // Include coupon code
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
                    
                // Set purchase success state
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
                        discount: 0
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

        // Check if terms are agreed
        if (!termsAgreed) {
            setErrorMessage('Please agree to the terms and conditions');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        // Set the purchase form type based on active option
        setPurchaseFormType(activeOption);
        
        // Set payment info based on availability check and coupon discount
        const price = availabilityStatus.price || 0;
        const promoPrice = availabilityStatus.promoPrice || 0;
        let buyingPrice = couponStatus.valid ? couponStatus.discount : (promoPrice > 0 ? promoPrice : price);
        
        // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
        if (buyingPrice > 0 && buyingPrice < 1) {
            buyingPrice = 1;
        }
        // Allow $0 to remain $0
        
        setPaymentInfo({
            show: true,
            price: Number(price),
            promoPrice: Number(promoPrice),
            couponCode: couponCode,
            buyingPrice: Number(buyingPrice)
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
                discount: 0
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

    return (
        <>
            <Head>
                <title>EZ.wiki - Get Your Brand Domain</title>
                {blurStyle}
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
            
            {/* Tooltip components */}
            <Tooltip id="nav-tooltip" />
            <Tooltip id="action-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="modal-tooltip" />

            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image.split('.').pop()?.toLowerCase() && 
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
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
                                        data-tooltip-content={getTooltip('nav-tooltip', 0)}
                                    >
                                        <AppLogoIcon className="size-8 fill-current text-[#8EF587]" />
                                        <span className="ml-2 text-[#8EF587]">ez.wiki</span>
                                    </Link>
                                    <Link href={route('demodesign')} className="group no-drag" data-tooltip-id="nav-tooltip" data-tooltip-content={getTooltip('nav-tooltip', 1)}>
                                        <span className="flex items-center gap-2 bg-orange-500 text-white font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-orange-600 cursor-pointer">
                                            <FontAwesomeIcon icon={faBuilding} className="text-white" />
                                            <span className="hidden group-hover:inline">EXPRESS DOMAIN</span>
                                        </span>
                                    </Link>
                                    <Link href={route('login')} className="group no-drag" data-tooltip-id="nav-tooltip" data-tooltip-content={getTooltip('nav-tooltip', 2)}>
                                        <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                            <FontAwesomeIcon icon={faSignInAlt} className="text-[#8EF587]" />
                                            <span className="hidden group-hover:inline">SIGN IN</span>
                                        </span>
                                    </Link>

                                    <Link href={route('register')} className="group no-drag" data-tooltip-id="nav-tooltip" data-tooltip-content={getTooltip('nav-tooltip', 3)}>
                                        <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                            <FontAwesomeIcon icon={faUserPlus} className="text-[#8EF587]" />
                                            <span className="hidden group-hover:inline">SIGN UP</span>
                                        </span>
                                    </Link>
                                    <Link href={route('marketplace')} className="group no-drag" data-tooltip-id="nav-tooltip" data-tooltip-content={getTooltip('nav-tooltip', 4)}>
                                        <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                            <FontAwesomeIcon icon={faStore} className="text-[#8EF587]" />
                                            <span className="hidden group-hover:inline">DOMAIN MART</span>
                                        </span>
                                    </Link>
									<Link href={route('templatemarketplace')} className="group no-drag" data-tooltip-id="login-tooltip" data-tooltip-content={getTooltipContent('login-tooltip', 6)}>
										<span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
											<FontAwesomeIcon icon={faPalette} className="text-[#8EF587]" />
											<span className="hidden group-hover:inline">THEME RENTAL</span>
										</span>
									</Link>
                                </div>
                            </div>
                        </Draggable>
                    )}
                    {templateContent}
                </div>
                
                {/* Notification Messages */}
                {errorMessage && (
                    <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-500" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 15)}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-500" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltip('action-tooltip', 16)}>
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                        {successMessage}
                    </div>
                )}
                
                {/* Purchase Form Modal */}
                {isPaymentModalOpen && purchaseFormType && (() => {
                    // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                    let basePrice = couponStatus.valid ? couponStatus.discount : paymentInfo.buyingPrice;
                    let finalDisplayPrice = basePrice;
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
                                        <p className="text-[#a8d0e6]" data-tooltip-id="modal-tooltip" data-tooltip-content={getTooltip('modal-tooltip', 10)}>
                                            {purchaseFormType === 'handle' 
                                                ? `${brandInput.trim().length} letters – US$${Number(finalDisplayPrice).toFixed(2)}`
                                                : `US$${Number(finalDisplayPrice).toFixed(2)}`
                                            }
                                            {couponStatus.valid && (
                                                <span className="text-green-400 ml-2">
                                                    (Coupon applied!)
                                                </span>
                                            )}
                                        </p>
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
                                        data-tooltip-content={getTooltip('modal-tooltip', finalDisplayPrice === 0 ? 13 : 14)}
                                    >
                                        {isLoading ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : finalDisplayPrice === 0 ? 
                                            `Claim Free ${purchaseFormType === 'handle' ? 'Handle' : 'Domain'}` : 
                                            `Buy ${purchaseFormType === 'handle' ? 'Handle' : 'Domain'} for US$${Number(finalDisplayPrice).toFixed(2)}`
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
                    // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                    let stripeFormPrice = paymentInfo.buyingPrice;
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
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-1000">
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
							
						{/* Link-in-Bio URL Section - ADDED THIS SECTION */}
							<div className="flex items-center justify-between gap-4 max-w-2xl mx-auto mb-3">
								<label className="block text-sm font-semibold text-gray-300">Link-in-Bio URL</label>
								<span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">Optional</span>
							</div>
							<div className="flex gap-4 max-w-2xl mx-auto mb-3">
								<select
									value={link.split('/').slice(0, -1).join('/') + '/'}
									onChange={(e) => {
										const baseUrl = e.target.value;
										if (baseUrl) {
											const currentHandle = link.split('/').pop() || '';
											setLink(baseUrl + currentHandle);
										} else {
											setLink('');
										}
									}}
									className="flex-1 px-3 py-2 bg-gray-800/60 border-2 border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:bg-gray-800/80 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 text-sm"
								>
									<option value="">Select a Link-in-Bio Service</option>
									<option value="https://lnk.bio/">lnk.bio</option>
									<option value="https://campsite.bio/">campsite.bio</option>
									<option value="https://bio.site/">bio.site</option>
									<option value="https://hoo.be/">hoo.be</option>
									<option value="https://linktr.ee/">linktr.ee</option>
									<option value="https://portaly.cc/">portaly.cc</option>
									<option value="https://link3.cc/">link3.cc</option>
								</select>
								<input
									type="text"
									value={link.split('/').pop() || ''}
									onChange={(e) => {
										const handle = e.target.value;
										const baseUrl = link.split('/').slice(0, -1).join('/') + '/';
										if (baseUrl === '/') {
											setLink('https://linktr.ee/' + handle);
										} else {
											setLink(baseUrl + handle);
										}
										if (handle.trim() && !brandInput.trim()) {
											setBrandInput(handle.trim());
										}
									}}
									placeholder="yourhandle"
									className="flex-1 px-3 py-2 bg-gray-800/60 border-2 border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-800/80 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 text-sm"
								/>
								<button
									onClick={() => {
										const previewModal = document.createElement('div');
										previewModal.id = 'link-preview-modal';
										previewModal.style.position = 'fixed';
										previewModal.style.top = '0';
										previewModal.style.left = '0';
										previewModal.style.width = '100%';
										previewModal.style.height = '100%';
										previewModal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
										previewModal.style.display = 'flex';
										previewModal.style.alignItems = 'center';
										previewModal.style.justifyContent = 'center';
										previewModal.style.zIndex = '10000';
										previewModal.style.backdropFilter = 'blur(8px)';
										const modalContent = document.createElement('div');
										modalContent.style.backgroundColor = '#1a202c';
										modalContent.style.borderRadius = '16px';
										modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
										modalContent.style.width = '35%';
										modalContent.style.height = '80%';
										modalContent.style.maxWidth = '500px';
										modalContent.style.minWidth = '400px';
										modalContent.style.border = '1px solid #4a5568';
										modalContent.style.overflow = 'hidden';
										modalContent.style.display = 'flex';
										modalContent.style.flexDirection = 'column';
										const header = document.createElement('div');
										header.style.display = 'flex';
										header.style.justifyContent = 'space-between';
										header.style.alignItems = 'center';
										header.style.padding = '16px 20px';
										header.style.backgroundColor = '#2d3748';
										header.style.borderBottom = '1px solid #4a5568';
										const title = document.createElement('h3');
										title.textContent = 'Link Preview';
										title.style.color = 'white';
										title.style.fontSize = '18px';
										title.style.fontWeight = 'bold';
										title.style.margin = '0';
										const closeBtn = document.createElement('button');
										closeBtn.innerHTML = '×';
										closeBtn.style.background = 'none';
										closeBtn.style.border = 'none';
										closeBtn.style.color = 'white';
										closeBtn.style.fontSize = '24px';
										closeBtn.style.cursor = 'pointer';
										closeBtn.style.width = '32px';
										closeBtn.style.height = '32px';
										closeBtn.style.borderRadius = '50%';
										closeBtn.style.display = 'flex';
										closeBtn.style.alignItems = 'center';
										closeBtn.style.justifyContent = 'center';
										closeBtn.style.transition = 'background-color 0.2s';
										closeBtn.onmouseenter = () => closeBtn.style.backgroundColor = '#4a5568';
										closeBtn.onmouseleave = () => closeBtn.style.backgroundColor = 'transparent';
										closeBtn.onclick = () => {
											if (previewModal.parentNode) {
												document.body.removeChild(previewModal);
											}
										};
										header.appendChild(title);
										header.appendChild(closeBtn);
										const previewInfo = document.createElement('div');
										previewInfo.style.padding = '12px 20px';
										previewInfo.style.backgroundColor = '#2d3748';
										previewInfo.style.borderBottom = '1px solid #4a5568';
										previewInfo.style.fontSize = '14px';
										previewInfo.style.color = '#cbd5e0';
										const previewUrl = document.createElement('div');
										previewUrl.textContent = `Previewing: ${link.trim()}`;
										previewUrl.style.fontFamily = 'monospace';
										previewUrl.style.fontSize = '12px';
										previewUrl.style.color = '#90cdf4';
										previewUrl.style.wordBreak = 'break-all';
										previewInfo.appendChild(previewUrl);
										const iframeContainer = document.createElement('div');
										iframeContainer.style.flex = '1';
										iframeContainer.style.padding = '0';
										iframeContainer.style.position = 'relative';
										iframeContainer.style.overflow = 'hidden';
										const iframe = document.createElement('iframe');
										iframe.src = `/previewlink?url=${encodeURIComponent(link.trim())}`;
										iframe.style.width = '100%';
										iframe.style.height = '100%';
										iframe.style.border = 'none';
										iframe.style.borderRadius = '0 0 16px 16px';
										iframe.style.background = 'white';
										iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
										iframe.allowFullscreen = true;
										iframeContainer.appendChild(iframe);
										modalContent.appendChild(header);
										modalContent.appendChild(previewInfo);
										modalContent.appendChild(iframeContainer);
										previewModal.appendChild(modalContent);
										previewModal.onclick = (e) => {
											if (e.target === previewModal) {
												if (previewModal.parentNode) {
													document.body.removeChild(previewModal);
												}
											}
										};
										const handleEscape = (e: KeyboardEvent) => {
											if (e.key === 'Escape' && previewModal.parentNode) {
												document.body.removeChild(previewModal);
												document.removeEventListener('keydown', handleEscape);
											}
										};
										document.addEventListener('keydown', handleEscape);
										document.body.appendChild(previewModal);
									}}
									disabled={!link.trim()}
									className={`px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm ${!link.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-blue-700'}`}
								>
									<FontAwesomeIcon icon={faEye} className="text-sm" />
									Preview
								</button>
							</div>
							{link.trim() && (
								<div className="text-xs text-gray-400 flex items-center gap-2 p-2 bg-gray-800/30 rounded-md max-w-2xl mx-auto mt-2">
									<FontAwesomeIcon icon={faCheckCircle} className="text-lime-400" />
									Valid link ready
								</div>
							)}
							{/* End of Link-in-Bio URL Section */}

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
                                        // Calculate final purchase price for button
                                        let basePriceForButton = couponStatus.valid ? couponStatus.discount : paymentInfo.buyingPrice;
                                        let finalPriceForButton = basePriceForButton;
                                        // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                                        if (finalPriceForButton > 0 && finalPriceForButton < 1) {
                                            finalPriceForButton = 1;
                                        }
                                        // Allow $0 to remain $0

                                        // START: MODIFIED SECTION
                                        // Calculate price for grid display
                                        const initialPrice = availabilityStatus.promoPrice > 0 ? (availabilityStatus.promoPrice ?? 0) : (availabilityStatus.price ?? 0);
                                        let gridDisplayPrice = couponStatus.valid ? couponStatus.discount : initialPrice;

                                        // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                                        if (gridDisplayPrice > 0 && gridDisplayPrice < 1) {
                                            gridDisplayPrice = 1;
                                        }
                                        // Allow $0 to remain $0
                                        // END: MODIFIED SECTION

                                        // Calculate price for promo display
                                        let promoDisplayPrice = availabilityStatus.promoPrice ?? 0;
                                        // Apply minimum price rule: if > 0 and < 1, set to 1 (but allow 0)
                                        if (promoDisplayPrice > 0 && promoDisplayPrice < 1) {
                                            promoDisplayPrice = 1;
                                        }
                                        // Allow $0 to remain $0

                                        return (
                                            <div className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                    <div className="bg-[#1f2937] p-2 rounded-md border border-gray-700 flex items-center justify-center" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 11)}>
                                                        <p className="text-white font-mono">
                                                            <span className="text-green-400">{brandInput.trim()}</span>.{selectedDomain}
                                                        </p>
                                                    </div>
                                                    <div className="bg-[#1f2937] p-2 rounded-md border border-gray-700 flex items-center justify-center gap-4" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 12)}>
                                                        <span className="text-gray-300">{availabilityStatus.charCount} letters</span>
                                                        <span className="text-yellow-400 font-semibold">
                                                            US${Number(gridDisplayPrice).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="bg-[#1f2937] p-2 rounded-md border border-gray-700 flex items-center justify-center" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 13)}>
                                                        <p className="text-yellow-400 font-mono">coupon code {couponCode}</p>
                                                    </div>
                                                </div>

                                                {/* START: MODIFIED SECTION (Original code, but kept for context) */}
                                                {/* Show savings and final price if coupon is valid */}
                                                {couponStatus.valid && (
                                                    <div className="flex flex-col sm:flex-row gap-2 mt-4 items-stretch mb-4">
                                                        {couponStatus.discount < (availabilityStatus.promoPrice || availabilityStatus.price) && (
                                                            <div className="flex-1 bg-blue-900/50 p-3 rounded-lg text-center flex flex-col justify-center" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 14)}>
                                                                <p className="text-yellow-300 text-sm font-semibold">
                                                                    You save US${((availabilityStatus.promoPrice || availabilityStatus.price) - couponStatus.discount).toFixed(2)}!
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 bg-green-900/50 p-3 rounded-lg text-center flex flex-col justify-center" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 15)}>
                                                            <p className="text-yellow-300 font-semibold">
                                                                You pay : US${Number(gridDisplayPrice).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Show promo price if it exists AND no valid coupon is applied */}
                                                {!couponStatus.valid && availabilityStatus.promoPrice > 0 && (
                                                    <div className="bg-blue-900/30 p-3 rounded-lg my-4" data-tooltip-id="form-tooltip" data-tooltip-content={getTooltip('form-tooltip', 16)}>
                                                        <p className="text-green-400 font-semibold">
                                                            Pre-launch Price: US$${Number(promoDisplayPrice).toFixed(2)}
                                                        </p>
                                                    </div>
                                                )}

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
                                                            onChange={(e) => {
                                                                console.log('NYP value:', e.target.value);
                                                            }}
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content={getTooltip('form-tooltip', 21)}
                                                        />
                                                    </div>
                                                </div>
                                                {/* END: MODIFIED SECTION (Original code, but kept for context) */}

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

                                                <button
                                                    onClick={() => {
                                                        if (finalPriceForButton === 0) {
                                                            // For $0 purchases, just show email input modal
                                                            setPurchaseFormType(activeOption);
                                                            setIsPaymentModalOpen(true);
                                                        } else {
                                                            // For paid purchases, show the full payment flow
                                                            handlePurchase();
                                                        }
                                                    }}
                                                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isSubmitting || !termsAgreed}
                                                    data-tooltip-id="action-tooltip"
                                                    data-tooltip-content={getTooltip('action-tooltip', finalPriceForButton === 0 ? 19 : 20)}
                                                >
                                                    {isSubmitting ? 'Processing...' : 
                                                        finalPriceForButton === 0 ? 
                                                            `Claim Free ${activeOption === 'handle' ? 'Handle' : 'Domain'}` : 
                                                            `Buy ${activeOption === 'handle' ? 'Handle' : 'Domain'} for US$${Number(finalPriceForButton).toFixed(2)}`
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