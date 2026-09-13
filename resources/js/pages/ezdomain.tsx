import AppLogoIcon from '@/components/app-logo-icon';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import '@google/model-viewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import Draggable from 'react-draggable';
import { useDebounce } from 'use-debounce';
import {
    faDownload,
    faSignInAlt,
    faLayerGroup,
    faCloudDownloadAlt,
    faHandPointer,
    faGlobe,
    faSignOutAlt,
    faUserPlus,
    faHome,
    faTrashAlt,
    faPlusCircle,
    faColumns,
    faGlobeAmericas,
    faPlay,
    faMapPin,
    faInfoCircle,
    faSave,
    faTimes,
    faEdit,
    faCreditCard,
    faPalette,
    faSearch,
    faImage,
    faHashtag,
    faCheckCircle,
    faExclamationTriangle,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Domain = {
    id: number;
    domain: string;
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

const StripeCheckoutForm = ({
    price,
    email,
    clientSecret,
    onSuccess,
    onBack,
    onError
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
                <div className="mb-4 p-3 bg-red-500/90 text-white rounded-lg flex items-center gap-2" data-tooltip-id="modal-tooltip" data-tooltip-content="An error occurred during payment.">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {error}
                </div>
            )}

            <div className="mt-4 text-sm text-gray-300">
                <div className="flex items-center justify-between mb-2">
                    <span data-tooltip-id="modal-tooltip" data-tooltip-content="Your email for the receipt.">Email:</span>
                    <span className="text-yellow-400">{email}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span data-tooltip-id="modal-tooltip" data-tooltip-content="Total amount to be paid.">Amount:</span>
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
                    data-tooltip-content="Complete your secure payment"
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
                    data-tooltip-content="Go back to the previous step"
                >
                    Back to email
                </button>
                <p className="mt-2 text-xs text-gray-500" data-tooltip-id="modal-tooltip" data-tooltip-content="Your payment is securely processed by Stripe.">
                    Payment secured by STRIPE. You'll be redirected after payment.
                </p>
            </div>
        </form>
    );
};

export default function EzHandle() {
    const pageProps = usePage<SharedData>().props;
    const dragRef = useRef<HTMLDivElement>(null);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const { auth, template, initialFunnels, domains, tokenInfo, promoprice } = usePage<SharedData>().props;
    const beePrice = tokenInfo?.current_price || 1.00;
    const [funnels, setFunnels] = useState<Array<{
        id: number;
        token: string;
        created_at: string;
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
    }>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy' | 'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedFunnel, setSelectedFunnel] = useState<null | {
        id: number;
        token: string;
    }>(null);
    const [customHandle, setCustomHandle] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('ez.wiki');
    const [isHandleFormOpen, setIsHandleFormOpen] = useState(false);
    const [debouncedHandle] = useDebounce(customHandle, 500);
    const [availabilityStatus, setAvailabilityStatus] = useState<{
        checking: boolean;
        available: boolean | null;
        message: string;
    }>({
        checking: false,
        available: null,
        message: ''
    });
    const [paymentMethod, setPaymentMethod] = useState<'bee' | 'usd'>('bee');
    const [paymentInfo, setPaymentInfo] = useState<{
        show: boolean;
        charCount: number;
        price: number;
        promoPrice: number;
        handle: string;
        domain: string;
        couponCode: string;
        buyingPrice: number;
        sellingPrice: number;
        couponValid?: boolean;
        couponMessage?: string;
    }>({
        show: false,
        charCount: 0,
        price: 0.00,
        promoPrice: promoprice || 0,
        handle: '',
        domain: selectedDomain,
        couponCode: '',
        buyingPrice: promoprice || 0,
        sellingPrice: 0
    });
    const [htmlUrl, setHtmlUrl] = useState('');

    // Payment modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntentId, setPaymentIntentId] = useState('');
    const [handlePurchaseId, setHandlePurchaseId] = useState(0);
    const [email, setEmail] = useState(auth.user?.email || '');
    const [isLoading, setIsLoading] = useState(false);

    const priceToShowInBee = useMemo(() => {
        return (paymentInfo.promoPrice === 0 && !paymentInfo.couponValid)
            ? paymentInfo.price
            : paymentInfo.buyingPrice;
    }, [paymentInfo.price, paymentInfo.promoPrice, paymentInfo.buyingPrice, paymentInfo.couponValid]);

    const finalUsdPrice = useMemo(() => {
        const usdPrice = priceToShowInBee * beePrice;
        if (usdPrice > 0 && usdPrice < 1) {
            return 1.00;
        }
        return usdPrice;
    }, [priceToShowInBee, beePrice]);

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

    useEffect(() => {
        if (template?.image) {
            const htmlBlob = new Blob([template.image], { type: 'text/html' });
            const url = URL.createObjectURL(htmlBlob);
            setHtmlUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [template]);

    useEffect(() => {
        if (template?.image.includes('facebook.com') || template?.image.includes('fb.watch')) {
            const script = document.createElement('script');
            script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, [template]);

    useEffect(() => {
        if (pageProps.initialFunnels) {
            setFunnels(pageProps.initialFunnels.data);
            setHasMore(pageProps.initialFunnels.next_page_url !== null);
        }
    }, [pageProps.initialFunnels]);

    useEffect(() => {
        if (initialFunnels) {
            setFunnels(initialFunnels.data);
            setHasMore(initialFunnels.next_page_url !== null);
        }
    }, [initialFunnels]);

    useEffect(() => {
        if (paymentInfo.couponCode) {
            const timer = setTimeout(() => {
                validateCoupon();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [paymentInfo.couponCode]);

    useEffect(() => {
        if (debouncedHandle && selectedFunnel) {
            checkHandleAvailability();
        }
    }, [debouncedHandle, selectedDomain]);

    const validateCoupon = async () => {
        if (!paymentInfo.couponCode || !customHandle) return;

        try {
            const response = await axios.post('/couponcodecustom', {
                couponcode: paymentInfo.couponCode,
                domainurl: customHandle,
				type: 'domain'
            });

            const offprice = parseFloat(response.data.offprice);
            setPaymentInfo(prev => ({
                ...prev,
                buyingPrice: offprice,
                couponValid: response.data.valid,
                couponMessage: response.data.valid ? response.data.title : 'Invalid coupon code'
            }));
        } catch (error) {
            setPaymentInfo(prev => ({
                ...prev,
                couponValid: false,
                couponMessage: 'Error validating coupon code'
            }));
        }
    };

    const checkHandleAvailability = async () => {
        if (!customHandle || !selectedFunnel) return;

        try {
            setAvailabilityStatus({
                checking: true,
                available: null,
                message: 'Checking availability...'
            });
            setPaymentInfo({...paymentInfo, show: false});

            const response = await axios.post('/check-domain-availability', {
                domain: selectedDomain,
                handle: customHandle,
                current_funnel_id: selectedFunnel.id
            });

            if (response.data.available) {
                const regularPrice = Number(response.data.price) || 0;
                const promoPrice = Number(response.data.promoPrice) || 0;

                setPaymentInfo({
                    show: true,
                    charCount: response.data.charCount || 0,
                    price: regularPrice,
                    promoPrice: promoPrice,
                    handle: response.data.handle || '',
                    domain: selectedDomain,
                    couponCode: '',
                    buyingPrice: promoPrice > 0 ? promoPrice : regularPrice,
                    sellingPrice: 0
                });
            }

            setAvailabilityStatus({
                checking: false,
                available: response.data.available,
                message: response.data.message
            });

        } catch (error) {
            console.error('Availability check error:', error);
            setAvailabilityStatus({
                checking: false,
                available: false,
                message: error.response?.data?.message || 'Failed to check availability'
            });
            setErrorMessage(error.response?.data?.message || 'Failed to check availability');
        }
    };

    const initiateHandlePayment = async () => {
        if (!email) {
            setErrorMessage('Please enter your email address');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMessage('Please enter a valid email address');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);
        try {
            const payload = {
                price: paymentInfo.price,
                email: email,
                custom_handle: customHandle,
                domain: selectedDomain,
                promo_price: paymentInfo.promoPrice,
                coupon_code: paymentInfo.couponCode,
                selling_price: paymentInfo.sellingPrice,
                payment_method: paymentMethod,
                funnelId: selectedFunnel?.id
            };
            
            const originalUsdPrice = priceToShowInBee * beePrice;
            if (paymentMethod === 'usd' && originalUsdPrice > 0 && originalUsdPrice < 1) {
                const requiredBeePrice = 1.00 / beePrice;
                // Force backend to calculate a price that results in US$1.00
                if (paymentInfo.promoPrice > 0 || paymentInfo.couponValid) {
                    payload.promo_price = requiredBeePrice;
                } else {
                    payload.price = requiredBeePrice;
                }
            }

            const response = await axios.post('/initiate-domain-payment', payload, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });
            
            setClientSecret(response.data.clientSecret);
            setPaymentIntentId(response.data.payment_intent_id);
            setHandlePurchaseId(response.data.handle_purchase_id);
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
            const response = await axios.post('/domain-handle-success', {
                payment_intent_id: paymentIntentId
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (response.data.success) {
                setSuccessMessage(`Handle purchased successfully! Your new URL: https://${customHandle}.${selectedDomain}`);
                setIsPaymentModalOpen(false);
                
                // Update the funnels list to show the new handle
                setFunnels(funnels.map(f => {
                    if (f.id === selectedFunnel?.id) {
                        const newDomain = {
                            id: Date.now(),
                            domain: customHandle,
                            domainselected: selectedDomain
                        };
                        return {
                            ...f,
                            handle_domains: [
                                ...(f.handle_domains || []),
                                newDomain
                            ]
                        };
                    }
                    return f;
                }));
				
				setPaymentStep(1);
				setClientSecret('');
				setPaymentIntentId('');
				setHandlePurchaseId(0);
				setErrorMessage('');
				
				setTimeout(() => {
                    setSuccessMessage('');
                    setSelectedFunnel(null);
                    setCustomHandle('');
                    setIsHandleFormOpen(false);
                    setSelectedDomain('ez.wiki');
                    setPaymentInfo({
                        show: false,
                        charCount: 0,
                        price: 0.00,
                        promoPrice: promoprice || 0,
                        handle: '',
                        domain: selectedDomain,
                        couponCode: '',
                        buyingPrice: promoprice || 0,
                        sellingPrice: 0
                    });
                }, 3000);
                // Refresh the data
                await handleSearch();
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
                    with: 'customDomains'
                },
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                setFunnels(prevFunnels => {
                    const newFunnels = [...prevFunnels];
                    response.data.data.forEach(newFunnel => {
                        const existingIndex = newFunnels.findIndex(f => f.id === newFunnel.id);
                        if (existingIndex >= 0) {
                            newFunnels[existingIndex] = {
                                ...newFunnels[existingIndex],
                                ...newFunnel,
                                handle_domains: [
                                    ...(newFunnels[existingIndex].handle_domains || []),
                                    ...(newFunnel.handle_domains || [])
                                ],
                                custom_domains: [
                                    ...(newFunnels[existingIndex].custom_domains || []),
                                    ...(newFunnel.custom_domains || [])
                                ]
                            };
                        } else {
                            newFunnels.push(newFunnel);
                        }
                    });
                    return newFunnels;
                });

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

    const handleSubmitCustomHandle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFunnel || !customHandle) return;

        if (paymentMethod === 'usd') {
            const usdPrice = priceToShowInBee * beePrice;
            if (usdPrice > 0) {
                setIsPaymentModalOpen(true);
                return;
            }
        }

        try {
            setIsSubmitting(true);
            setErrorMessage('');
            setSuccessMessage('');

            const payload = {
                current_funnel_id: selectedFunnel.id,
                custom_handle: customHandle,
                domain: selectedDomain,
                price: paymentInfo.price,
                promo_price: paymentInfo.promoPrice,
                coupon_code: paymentInfo.couponCode,
                selling_price: paymentInfo.sellingPrice,
                payment_method: paymentMethod
            };

            const response = await axios.post(`/update-ezdomain-funnel-handle/${selectedFunnel.id}`, payload);

            if (response.data.success) {
                setSuccessMessage(`Handle purchased successfully! Your new URL: ${response.data.url}`);
                
                setFunnels(funnels.map(f => {
                    if (f.id === selectedFunnel.id) {
                        const newDomain = {
                            id: Date.now(),
                            domain: customHandle,
                            domainselected: selectedDomain
                        };
                        return {
                            ...f,
                            handle_domains: [
                                ...(f.handle_domains || []),
                                newDomain
                            ]
                        };
                    }
                    return f;
                }));

                setTimeout(() => {
                    setSuccessMessage('');
                    setSelectedFunnel(null);
                    setCustomHandle('');
                    setIsHandleFormOpen(false);
                    setSelectedDomain('ez.wiki');
                    setPaymentInfo({
                        show: false,
                        charCount: 0,
                        price: 0.00,
                        promoPrice: promoprice || 0,
                        handle: '',
                        domain: selectedDomain,
                        couponCode: '',
                        buyingPrice: promoprice || 0,
                        sellingPrice: 0
                    });
                }, 3000);

                if (paymentMethod === 'bee') {
                    await axios.get('/buy-bee/balance');
                }
            } else {
                setErrorMessage(response.data.error || 'Failed to complete the purchase. Please try again.');
            }
        } catch (error) {
            console.error('Handle purchase error:', error);

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    switch (error.response.status) {
                        case 409:
                            setErrorMessage(error.response.data?.error || 'This handle is already taken by another user.');
                            break;
                        case 400:
                            if (error.response.data?.messages) {
                                setErrorMessage(Object.values(error.response.data.messages).join(' '));
                            } else {
                                setErrorMessage(error.response.data?.error || 'Invalid request. Please check your input.');
                            }
                            break;
                        case 403:
                            setErrorMessage(error.response.data?.error || 'Insufficient balance for this purchase.');
                            break;
                        case 422:
                            const errors = error.response.data?.errors;
                            if (errors) {
                                setErrorMessage(Object.values(errors).flat().join(' '));
                            } else {
                                setErrorMessage(error.response.data?.message || 'Validation failed. Please check your input.');
                            }
                            break;
                        default:
                            setErrorMessage(error.response.data?.message ||
                                          error.response.data?.error ||
                                          'An unexpected error occurred. Please try again.');
                    }
                } else if (error.request) {
                    setErrorMessage('Network error. Please check your connection and try again.');
                } else {
                    setErrorMessage('Request setup error. Please try again.');
                }
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCustomHandleClick = (funnel: {
        id: number;
        token: string;
    }) => {
        setSelectedFunnel(funnel);
        setCustomHandle(funnel.token);
        setSelectedDomain('ez.wiki');
        setIsHandleFormOpen(true);
        setPaymentInfo({
            show: false,
            charCount: 0,
            price: 0.00,
            promoPrice: promoprice || 0,
            handle: '',
            domain: 'ez.wiki',
            couponCode: '',
            buyingPrice: promoprice || 0,
            sellingPrice: 0
        });
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

    const renderTemplateContent = useCallback(() => {
        if (!template) return null;

        const extension = getImageExtension(template.image) || '';
        const imgPath = template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        const fullImageUrl = `${imgPath}${template.image}`;

        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        const validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];

        const youtubeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
        const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^/]+:[^"&?/ ]+)/i;
        const vimeoRegex = /^https?:\/\/(?:www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im;
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
    }, [template, htmlUrl, getImageExtension, isValidUrl]);

    return (
        <>
            <Head>
                <title>EZ Handle - Domain URLs for Your Funnels</title>
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

            <Tooltip id="nav-tooltip" />
            <Tooltip id="action-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="modal-tooltip" />
            
            <DraggableMenu auth={auth} />
            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image && isImageExtension(getImageExtension(template.image)) ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {renderTemplateContent()}
                </div>
                {isPanelVisible && (
                <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl">
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
                    <div className="grid grid-cols-2 gap-4">
                        {/* Left side - Search results */}
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Search by token"
                                    className="flex-grow bg-white text-gray-900 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    data-tooltip-id="form-tooltip"
                                    data-tooltip-content="Enter a funnel token to search"
                                />

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
                                        data-tooltip-id="form-tooltip"
                                        data-tooltip-content="Fuzzy search finds similar matches"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
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
                                        data-tooltip-id="form-tooltip"
                                        data-tooltip-content="Exact search finds only perfect matches"
                                    >
                                        <span className="text-sm">🏀</span>
                                        Exact
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar space-y-2">
                                {funnels.map((funnel) => (
                                    <div key={funnel.id} className="flex items-center p-4 gap-1 bg-[#5d0f6e] rounded-lg">
                                        <span className="text-4xl select-none">
                                            🍀
                                        </span>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-col gap-y-2">
                                                {/* Default URL */}
                                                <a
                                                    href={`https://ez.wiki/${encodeURIComponent(funnel.token)}`}
                                                    target="_blank"
                                                    className="text-yellow-400 font-semibold truncate"
                                                    rel="noopener noreferrer"
                                                    data-tooltip-id="action-tooltip"
                                                    data-tooltip-content={`Visit default URL: https://ez.wiki/${funnel.token}`}
                                                >
                                                    https://ez.wiki/{funnel.token}
                                                </a>
                                                {/* Sub domains */}
                                                {funnel.handle_domains?.map((domain) => (
                                                    <a
                                                        key={domain.id}
                                                        href={`https://${domain.domain}.${domain.domainselected}`}
                                                        target="_blank"
                                                        className="text-yellow-400 font-semibold truncate"
                                                        rel="noopener noreferrer"
                                                        data-tooltip-id="action-tooltip"
                                                        data-tooltip-content={`Visit sub-domain: https://${domain.domain}.${domain.domainselected}`}
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
                                                        className="text-yellow-400 font-semibold truncate"
                                                        rel="noopener noreferrer"
                                                        data-tooltip-id="action-tooltip"
                                                        data-tooltip-content={`Visit custom domain: https://${domain.domainselected}/${domain.domain}`}
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
                                            className="bg-yellow-400 text-black font-bold py-1 px-5 rounded-md text-sm hover:bg-yellow-500 transition-colors whitespace-nowrap"
                                            onClick={() => handleAddCustomHandleClick(funnel)}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Configure a custom domain handle for this funnel"
                                        >
                                            Add Domain Handle
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {hasMore && (
                                <div className="flex justify-center mt-4">
                                    <button
                                        className="bg-black text-white border border-white px-8 py-2 rounded-md font-semibold hover:bg-white hover:text-black transition-colors"
                                        onClick={loadMore}
                                        disabled={isSubmitting}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Load more funnels"
                                    >
                                        {isSubmitting ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right side - Handle form */}
                        <div className="col-span-1 space-y-4">
                            {isHandleFormOpen ? (
                                <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-white">
                                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                                            Domain Handle for: {selectedFunnel?.token}
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setIsHandleFormOpen(false);
                                                setSelectedDomain('ez.wiki');
                                                setPaymentInfo({
                                                    show: false,
                                                    charCount: 0,
                                                    price: 0.00,
                                                    promoPrice: promoprice || 0,
                                                    handle: '',
                                                    domain: 'ez.wiki',
                                                    couponCode: '',
                                                    buyingPrice: promoprice || 0,
                                                    sellingPrice: 0
                                                });
                                            }}
                                            className="text-gray-400 hover:text-white transition-colors"
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Cancel and close this form"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>

                                    {successMessage && (
                                        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                            {successMessage}
                                        </div>
                                    )}
                                    {errorMessage && (
                                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmitCustomHandle} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-yellow-400 font-medium">New Domain Handle</label>
                                            <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                                                <input
                                                    type="text"
                                                    value={customHandle}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setCustomHandle(value);
                                                        setPaymentInfo({...paymentInfo, show: false});
                                                    }}
                                                    className="flex-grow px-4 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                    placeholder="your-custom-handle"
                                                    required
                                                    title="Only letters, numbers, and hyphens are allowed"
                                                    data-tooltip-id="form-tooltip"
                                                    data-tooltip-content="Enter your desired handle (e.g., 'my-brand')"
                                                />
												<select
                                                    className="px-4 py-2 bg-gray-600 text-gray-300 border-r border-gray-500 focus:outline-none"
                                                    value={selectedDomain}
                                                    onChange={(e) => {
                                                        setSelectedDomain(e.target.value);
                                                        setPaymentInfo({...paymentInfo, domain: e.target.value, show: false});
                                                    }}
                                                    data-tooltip-id="form-tooltip"
                                                    data-tooltip-content="Select the domain extension for your handle"
                                                >
                                                    {domains?.map((domain) => (
                                                        <option key={domain.id} value={domain.domain}>
                                                            .{domain.domain}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className={`px-4 py-2 ${
                                                        availabilityStatus.checking
                                                            ? 'bg-gray-600 text-gray-300'
                                                            : availabilityStatus.available
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-red-600 text-white'
                                                    }`}
                                                    onClick={checkHandleAvailability}
                                                    disabled={availabilityStatus.checking}
                                                    data-tooltip-id="action-tooltip"
                                                    data-tooltip-content="Check if this handle is available"
                                                >
                                                    {availabilityStatus.checking ? 'Checking...' : availabilityStatus.available ? 'Available' : 'Unavailable'}
                                                </button>
                                            </div>
                                            {availabilityStatus.message && (
                                                <p className={`text-sm ${
                                                    availabilityStatus.available ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                    {availabilityStatus.message}
                                                </p>
                                            )}
                                        </div>

                                        {paymentInfo.show && (
                                            <div className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                                <h3 className="text-yellow-400 font-medium mb-2">
                                                    <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                                                    Handle Purchase
                                                </h3>

                                                <div className="mb-4">
                                                    <p className="text-white">
                                                        {paymentInfo.handle}.{paymentInfo.domain}
                                                    </p>
                                                    <p className="text-gray-300 text-sm">
                                                        {paymentInfo.charCount} letters = EZ${(Number(paymentInfo.price) || 0).toFixed(2)}
                                                    </p>
                                                </div>

                                                {/* Payment Method Selector */}
                                                <div className="mb-4">
                                                    <label className="text-gray-300 text-sm">Payment Method</label>
                                                    <div className="flex gap-2 mt-1">
                                                        <button
                                                            type="button"
                                                            className={`flex-1 py-2 rounded-md border ${paymentMethod === 'bee' ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-gray-700 text-gray-300 border-gray-600'}`}
                                                            onClick={() => setPaymentMethod('bee')}
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content="Pay with EZ$ tokens"
                                                        >
                                                            EZ$
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`flex-1 py-2 rounded-md border ${paymentMethod === 'usd' ? 'bg-green-500 text-white border-green-600' : 'bg-gray-700 text-gray-300 border-gray-600'}`}
                                                            onClick={() => setPaymentMethod('usd')}
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content="Pay with USD via Stripe"
                                                        >
                                                            US$
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Show different pricing based on payment method */}
                                                {paymentMethod === 'bee' ? (
                                                    <>
                                                        {paymentInfo.couponValid ? (
                                                            <div className="bg-purple-900/30 p-3 rounded-lg mb-4">
                                                                <p className="text-green-400 font-semibold">
                                                                    Special Offer: Lifetime Ownership for EZ${paymentInfo.buyingPrice.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        ) : paymentInfo.promoPrice > 0 && (
                                                            <div className="bg-purple-900/30 p-3 rounded-lg mb-4">
                                                                <p className="text-green-400 font-semibold">
                                                                    Pre-launch Price: EZ${paymentInfo.promoPrice.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {paymentInfo.couponValid && paymentInfo.buyingPrice < paymentInfo.promoPrice && paymentInfo.promoPrice > 0 && (
                                                            <div className="bg-purple-900/30 p-3 rounded-lg mb-4">
                                                                <p className="text-yellow-300 text-sm mt-1">
                                                                    You're saving EZ${(paymentInfo.promoPrice - paymentInfo.buyingPrice).toFixed(2)}!
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {paymentInfo.couponValid ? (
                                                            <div className="bg-blue-900/30 p-3 rounded-lg mb-4">
                                                                <p className="text-green-400 font-semibold">
                                                                    Special Offer: Lifetime Ownership for US${(paymentInfo.buyingPrice * beePrice).toFixed(2)}
                                                                </p>
                                                            </div>
                                                        ) : paymentInfo.promoPrice > 0 && (
                                                            <div className="bg-blue-900/30 p-3 rounded-lg mb-4">
                                                                <p className="text-green-400 font-semibold">
                                                                    Pre-launch Price: US${(paymentInfo.promoPrice * beePrice).toFixed(2)}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {paymentInfo.couponValid && paymentInfo.buyingPrice < paymentInfo.promoPrice && paymentInfo.promoPrice > 0 && (
                                                            <div className="bg-blue-900/30 p-3 rounded-lg mb-4">
                                                                <p className="text-yellow-300 text-sm mt-1">
                                                                    You're saving US${((paymentInfo.promoPrice - paymentInfo.buyingPrice) * beePrice).toFixed(2)}!
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-gray-300 text-sm">Coupon Code</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                            placeholder="Enter coupon code"
                                                            value={paymentInfo.couponCode}
                                                            onChange={(e) => setPaymentInfo({...paymentInfo, couponCode: e.target.value})}
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content="Enter a coupon code for a discount"
                                                        />
                                                    </div>
                                                    {paymentInfo.couponCode && (
                                                        <div className={`mt-2 text-sm ${
                                                            paymentInfo.couponValid ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                            {paymentInfo.couponMessage || 'Validating coupon...'}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="text-gray-300 text-sm">NYP (optional)</label>
                                                        <input
                                                            type="number"
                                                            className="input-no-spinner w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                            value={paymentInfo.sellingPrice ?? ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setPaymentInfo({
                                                                    ...paymentInfo,
                                                                    sellingPrice: value === '' ? undefined : parseFloat(value)
                                                                });
                                                            }}
                                                            min="0"
                                                            step="1"
                                                            placeholder="Set price if you want to list in marketplace"
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content="Name Your Price: Set a price to list this on the marketplace after purchase."
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
                                                            data-tooltip-id="form-tooltip"
                                                            data-tooltip-content="You must agree to the terms to proceed"
                                                        />
                                                        <label htmlFor="terms-checkbox">
                                                            By claiming your handle you agree to the current user T&C and future changes of the T&C
                                                        </label>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                                                    disabled={isSubmitting}
                                                    data-tooltip-id="action-tooltip"
                                                    data-tooltip-content="Finalize your handle purchase"
                                                >
                                                    {isSubmitting ? 'Processing...' : (() => {
                                                        if (paymentMethod === 'bee') {
                                                            return `Buy Handle for EZ$${priceToShowInBee.toFixed(2)}`;
                                                        } else {
                                                            return `Buy Handle for US$${finalUsdPrice.toFixed(2)}`;
                                                        }
                                                    })()}
                                                </button>
                                            </div>
                                        )}
                                    </form>

                                    {!paymentInfo.show && (
                                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                            <h3 className="text-yellow-400 font-medium mb-2">
                                                <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                                                About Domain Handles
                                            </h3>
                                            <ul className="text-gray-300 text-sm space-y-2 list-disc pl-5">
                                                <li>Create memorable, branded URLs for your funnels</li>
                                                <li>Improve sharing and marketing of your content</li>
                                                <li>Handle must be unique across all users</li>
                                                <li>Only letters, numbers, and hyphens allowed</li>
                                                <li>Minimum 3 characters, maximum 32 characters</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center h-full">
                                    <div className="text-center max-w-md">
                                        <FontAwesomeIcon
                                            icon={faGlobeAmericas}
                                            className="text-6xl text-yellow-400 mb-4"
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="Domain Handle Management Area"
                                        />
                                        <h2 className="text-2xl font-bold text-white mb-2" data-tooltip-id="form-tooltip" data-tooltip-content="Create memorable URLs for your funnels">
                                            Domain Handle Management
                                        </h2>
                                        <p className="text-gray-300 mb-6">
                                            Select a funnel from the list to assign or update its Domain handle.
                                            Domain handles make your funnel URLs more memorable and branded.
                                        </p>
                                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-left">
                                            <h3 className="text-yellow-400 font-medium mb-2">
                                                <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                                                Example Handles:
                                            </h3>
                                            <ul className="text-gray-300 text-sm space-y-1">
                                                <li>• <span className="text-white">yourbrand</span>.ez.wiki</li>
                                                <li>• <span className="text-white">product-name</span>.ez.wiki</li>
                                                <li>• <span className="text-white">company-2023</span>.ez.wiki</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* Stripe Payment Modal */}
                {isPaymentModalOpen && (
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
                                data-tooltip-content="Close payment window"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="space-y-6">
                                {errorMessage && (
                                    <div className="bg-red-500/90 text-white p-3 rounded-lg flex items-center gap-2">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                        {errorMessage}
                                    </div>
                                )}

                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-white" />
                                    </div>
                                )}

                                {paymentStep === 1 ? (
                                    <>
                                        <div className="text-center">
                                            <div className="w-14 h-14 rounded-full backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/20 bg-gradient-to-br from-white/15 to-transparent shadow-lg mx-auto">
                                                <img
                                                    src="https://ez.wiki/logo.gif"
                                                    className="w-10 h-10 rounded-full object-cover"
                                                    alt="ez.wiki Logo"
                                                />
                                            </div>
                                            <h2 className="text-xl font-bold mt-4 text-white">Purchase Handle</h2>
                                            <p className="text-[#a8d0e6]">You'll be charged US${finalUsdPrice.toFixed(2)}</p>
                                        </div>

                                        <div className="mt-6">
                                            <div className="flex items-center bg-white rounded-md">
                                                <div className="p-3 bg-[#4CAF50] rounded-l-md">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full p-3 bg-white text-gray-800 outline-none rounded-r-md"
                                                    placeholder="Email"
                                                    required
                                                    disabled={isLoading}
                                                    data-tooltip-id="modal-tooltip"
                                                    data-tooltip-content="Your receipt will be sent to this email address"
                                                />
                                            </div>

                                            {errorMessage && (
                                                <div className="mt-2 text-[#ff6b6b] text-sm">{errorMessage}</div>
                                            )}
                                        </div>

                                        <div className="mt-6">
                                            <button
                                                onClick={initiateHandlePayment}
                                                disabled={isLoading}
                                                className="w-full bg-[#FFD700] text-gray-900 font-bold py-3 px-4 rounded-full hover:bg-[#FFC000] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                                data-tooltip-id="modal-tooltip"
                                                data-tooltip-content="Proceed to the secure payment form"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                        Processing...
                                                    </>
                                                ) : 'Continue to Payment'}
                                            </button>
                                        </div>

                                        <div className="mt-4 text-center">
                                            <p className="text-xs text-[#a8d0e6]">
                                                Payment secured by STRIPE. You'll be taken to a thank you page after the payment.
                                            </p>
                                            <p className="mt-1 text-xs text-[#a8d0e6]">
                                                <Link href="/terms" className="hover:underline text-white">Terms</Link> and{' '}
                                                <Link href="/privacy" className="hover:underline text-white">Privacy</Link>.
                                            </p>
                                        </div>
                                    </>
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
                                                price={finalUsdPrice}
                                                email={email}
                                                clientSecret={clientSecret}
                                                onSuccess={handlePaymentSuccess}
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
                    </div>
                )}
            </main>
        </>
    );
}