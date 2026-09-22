import { useEffect, useState, useRef, useMemo } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DraggableMenu from '@/components/DraggableMenu';
import AppLogoIcon from '@/components/app-logo-icon';
import axios from 'axios';
import Draggable from 'react-draggable';
import MarketplaceListings from '@/components/MarketplaceListings';
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

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_test_51IyCo8Dpr0bpQPacr3v1TYpEaU5tpZKkGo9U0x5IHlt0lCZEeqqAltwkPAMuMBwifNgq2gfMbqCN0zR6ZWe9G2UN00Qj78PNYg');

type DomainItem = {
    id: number;
    domain: string;
    domainselected: string;
    type: 'CUSTOM' | 'DOMAIN';
    hashtag?: string;
    email?: string;
    sells?: {
        price: number | string;
        created_at?: string;
    }[];
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
                    ) : `Purchase for US$${price.toFixed(2)}`}
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

export default function Marketplace() {
    const { auth, domains: initialDomains, filters: initialFilters, template, pagination: initialPagination } = usePage<{
        auth: AuthData;
        domains: DomainItem[];
        filters: Filters;
        template?: Template;
        pagination: Pagination;
    }>().props;

    const [domains, setDomains] = useState<DomainItem[]>(initialDomains);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [balance, setBalance] = useState(auth.balance?.balance || 0);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Payment modal states
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<DomainItem | null>(null);
    const [email, setEmail] = useState(auth.user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userExists, setUserExists] = useState<boolean | null>(null);

    // Stripe payment states
    const [paymentStep, setPaymentStep] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntentId, setPaymentIntentId] = useState('');

    const dragRef = useRef(null);

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

    const fetchFilteredDomains = async (newFilters: Filters) => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('marketplace.loadmore'), {
                params: {
                    ...newFilters,
                    page: 1 // Always start from page 1 when filtering
                }
            });

            setDomains(response.data.domains);
            setPagination(response.data.pagination);
            setFilters(newFilters);
        } catch (error) {
            console.error('Error fetching filtered domains:', error);
            setErrorMessage('Failed to apply filters. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (newFilters: Filters) => {
        fetchFilteredDomains(newFilters);
    };

    const loadMoreDomains = async () => {
        if (isLoading || pagination.current_page >= pagination.last_page) return;
        
        setIsLoading(true);
        try {
            const response = await axios.get(route('marketplace.loadmore'), {
                params: {
                    ...filters,
                    page: pagination.current_page + 1
                }
            });

            setDomains([...domains, ...response.data.domains]);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error loading more domains:', error);
            setErrorMessage('Failed to load more domains. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Add domain purchase function with Stripe
    const handleDomainPurchase = async () => {
        if (!selectedDomain) return;
        
        setIsPurchasing(true);
        setErrorMessage('');
        
        try {
            const price = Number(selectedDomain.sells?.[0]?.price || 0);
            
            // Use Stripe payment for domain purchase
            const response = await axios.post('/marketplace/initiate-domain-payment', {
                email,
                password: (!auth.user && !userExists) ? password : undefined,
                domain_id: selectedDomain.id,
                domain_type: selectedDomain.type,
                price: price,
                promo_price: price,
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
        } catch (error) {
            let errorMessage = 'An error occurred during purchase';
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

    // Handle Stripe payment success for domain
    const handleStripePaymentSuccess = async () => {
        setIsPurchasing(true);
        try {
            const response = await axios.post('/marketplace/domain-payment-success', {
                payment_intent_id: paymentIntentId,
                domain_id: selectedDomain?.id,
                domain_type: selectedDomain?.type,
            });
            
            if (response.data.success) {
                setSuccessMessage('Domain purchased successfully!');
                setIsPaymentModalOpen(false);
                setSelectedDomain(null);
                setPaymentStep(1);
                
                // Remove purchased domain from list
                if (selectedDomain) {
                    setDomains(prev => prev.filter(d => !(d.id === selectedDomain.id && d.type === selectedDomain.type)));
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
                <title>Marketplace - Buy and Sell Domains</title>
                <meta name="description" content="Marketplace for buying and selling domains with Stripe" />
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
                                data-tooltip-content="Purchase and Own a Branded Staging Portal in WiKi 2.0, Supported by Crowdsourcing"
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

            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">
                
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
                                    Insufficient Balance
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
                                You don't have enough EZ$ to complete this purchase. Please purchase more EZ$ to continue.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowBalanceModal(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Cancel purchase"
                                >
                                    Cancel
                                </button>
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
                            </div>
                        </div>
                    </div>
                )}

                {/* Stripe Payment Modal for Domain Purchase */}
                {isPaymentModalOpen && selectedDomain && (
                    <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                        <div className="bg-[#235A72] border border-[#3a7a94] text-white p-8 rounded-lg shadow-lg max-w-md w-full relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => {
                                    setIsPaymentModalOpen(false);
                                    setSelectedDomain(null);
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
                                            Domain Purchase
                                        </h2>
                                        <p className="text-[#a8d0e6] mt-2">
                                            {selectedDomain.type === 'CUSTOM' 
                                                ? `${selectedDomain.domainselected}/${selectedDomain.domain}`
                                                : `${selectedDomain.domain}.${selectedDomain.domainselected}`
                                            }
                                        </p>
                                        
                                        <div className="bg-[#2a6b87] p-4 rounded-lg mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-300">Domain Price:</span>
                                                <span className="text-yellow-400">US${Number(selectedDomain.sells?.[0]?.price || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-2 border-t border-gray-600 pt-2">
                                                <span className="text-gray-300 font-bold">Total:</span>
                                                <span className="text-green-400 font-bold">US${Number(selectedDomain.sells?.[0]?.price || 0).toFixed(2)}</span>
                                            </div>
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
                                        onClick={handleDomainPurchase}
                                        disabled={
                                            isPurchasing || 
                                            !email || 
                                            (!auth.user && !userExists && (!password || !confirmPassword || password !== confirmPassword))
                                        }
                                        className="w-full bg-[#FFD700] text-gray-900 font-bold py-3 px-4 rounded-full hover:bg-[#FFC000] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isPurchasing ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : (
                                            `Purchase Domain for US$${Number(selectedDomain.sells?.[0]?.price || 0).toFixed(2)}`
                                        )}
                                    </button>

                                    <div className="text-center text-xs text-[#a8d0e6]">
                                        <p>Payment secured by STRIPE. You'll receive the domain immediately after purchase.</p>
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
                                            price={Number(selectedDomain.sells?.[0]?.price || 0)}
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
                    <div className={`relative bg-gray-900 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl ${
                      auth.user ? 'mt-4' : 'mt-17'
                    }`}>
                        {/* Marketplace listings - accessible to all users without login requirement */}
                        <MarketplaceListings 
                            auth={auth}
                            initialDomains={domains}
                            initialPagination={pagination}
                            initialFilters={filters}
                            onFilterChange={handleFilterChange}
                            onLoadMore={loadMoreDomains}
                            isLoading={isLoading}
                            onPurchase={async (domainId, type, price, domainItem) => {
                                const domainToPurchase = domainItem || domains.find(d => d.id === domainId && d.type === type);
                                if (!domainToPurchase) return;

                                // Set the selected domain and open payment modal
                                setSelectedDomain(domainToPurchase);
                                setIsPaymentModalOpen(true);
                                
                                // Pre-fill email if user is logged in
                                if (auth.user?.email) {
                                    setEmail(auth.user.email);
                                }
                            }}
                        />
                    </div>
                )}
            </main>
        </>
    );
}