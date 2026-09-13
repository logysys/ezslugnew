import { useEffect, useState, useRef, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { 
    faCreditCard,
    faInfoCircle,
    faTrashAlt,
    faTimes,
    faCheckCircle,
    faExclamationTriangle,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Template = {
    id: number;
    user_id: number;
    image: string;
    option?: string;
};

type TokenInfo = {
    token_name: string;
    total_supply: number;
    circulating_supply: number;
    current_price: number;
    last_updated: string;
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

const StripeCheckoutForm = ({ 
    points, 
    price, 
    email, 
    clientSecret,
    onSuccess, 
    onBack, 
    onError 
}: {
    points: number;
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
        // 1. First call elements.submit()
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || 'Payment form validation failed');
            return;
        }

        // 2. Then call confirmPayment with the email in payment_method_data
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
        } else if (paymentIntent?.status === 'succeeded') {
            onSuccess();
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
                <div className="flex items-center justify-between">
                    <span>Points:</span>
                    <span className="text-yellow-400">EZ${points.toFixed(2)}</span>
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
                    data-tooltip-id="buybee-tooltip"
                    data-tooltip-content="Complete the purchase using the selected payment method."
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
                    data-tooltip-id="buybee-tooltip"
                    data-tooltip-content="Go back to change your email address."
                >
                    Back to email
                </button>
                <p 
                    className="mt-2 text-xs text-gray-500"
                    data-tooltip-id="buybee-tooltip"
                    data-tooltip-content="Your payment information is securely handled by Stripe and is not stored on our servers."
                >
                    Payment secured by STRIPE. You'll be redirected after payment.
                </p>
            </div>
        </form>
    );
};

export default function BuyBee() {
    const { auth, template, tokenInfo } = usePage<SharedData>().props;
    const [points, setPoints] = useState(1);
    const [price, setPrice] = useState(1);
    const [availablePoints, setAvailablePoints] = useState(0);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [email, setEmail] = useState(auth.user?.email || '');
    const [paymentStep, setPaymentStep] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState('');
    const [pointPurchaseId, setPointPurchaseId] = useState(0);
    const htmlBlobRef = useRef<Blob | null>(null);
    const htmlUrlRef = useRef<string | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
			try {
				const response = await axios.get('/buy-bee/balance');
				// Ensure we always set a number, defaulting to 0 if undefined/null
				setAvailablePoints(Number(response.data.balance) || 0);
			} catch (error) {
				console.error('Failed to fetch balance:', error);
				setAvailablePoints(0); // Reset to 0 on error
				if (axios.isAxiosError(error)) {
					setErrorMessage(error.response?.data?.message || 'Failed to fetch balance');
				} else {
					setErrorMessage('Failed to fetch balance');
				}
			}
		};

        fetchBalance();
    }, []);

    const handleIncrement = () => {
        const newPoints = points + 1;
        setPoints(newPoints);
        setPrice(newPoints);
    };

    const handleDecrement = () => {
        if (points > 1) {
            const newPoints = points - 1;
            setPoints(newPoints);
            setPrice(newPoints);
        }
    };

    const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty string or a string of digits for user input flexibility
        if (/^\d*$/.test(value)) {
            const numValue = value === '' ? 0 : parseInt(value, 10);
            setPoints(numValue);
            setPrice(numValue);
        }
    };

    const handlePointsBlur = () => {
        // Ensure points are at least 1 when the input loses focus
        if (points < 1) {
            setPoints(1);
            setPrice(1);
        }
    };

    const handlePurchase = () => {
        setIsModalOpen(true);
        setPaymentStep(1);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleClear = () => {
        setPoints(1);
        setPrice(1);
        setSuccessMessage('Items cleared successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleEmailSubmit = async () => {
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
            const response = await axios.post('/buy-bee/initiate', {
                points: points,
                price: price,
                email: email,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            setClientSecret(response.data.clientSecret);
            setPaymentIntentId(response.data.payment_intent_id);
            setPointPurchaseId(response.data.point_purchase_id);
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
            const response = await axios.post('/buy-bee/success', {
                payment_intent_id: paymentIntentId,
                point_purchase_id: pointPurchaseId,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            setSuccessMessage(`Purchase successful! EZ$${points.toFixed(2)} added to your account.`);
            setAvailablePoints(prev => prev + points);
            setIsModalOpen(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(error.response?.data?.error || 'Payment verification failed');
            } else {
                setErrorMessage('Failed to verify payment. Please contact support.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Buy Bee Points - EZ3D</title>
                <meta name="description" content="Purchase Bee Points to create tags, slidgets, and widgets" />
            </Head>
            <Tooltip id="buybee-tooltip" />
             <style>{`
                .react-tooltip {
                    z-index: 99999 !important;
                    opacity: 1 !important;
                    font-size: 12px;
                    padding: 4px 8px;
                }
            `}</style>
            <DraggableMenu auth={auth} />
            
            <main className="relative flex justify-center items-center min-h-screen p-4 overflow-hidden">
                
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-6 rounded-xl border border-white-700 overflow-y-auto shadow-2xl max-w-4xl w-full">
                        <h1 
                            className="text-2xl md:text-3xl font-bold text-center text-yellow-400 mb-6"
                            data-tooltip-id="buybee-tooltip"
                            data-tooltip-content="EZ$ are used to unlock premium features and create content on the platform."
                        >
                            Buy EZ$ for Ai Use and Domains.
                        </h1>
						{successMessage && (
							<div className="bg-green-500/90 text-white p-3 mb-2 rounded-lg flex items-center gap-2">
								<FontAwesomeIcon icon={faCheckCircle} />
								{successMessage}
							</div>
						)}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Purchase Form */}
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-yellow-400 mb-2">EZ$</label>
                                        <div className="flex items-center">
                                            <button 
                                                className="bg-green-600 text-white font-bold text-xl px-4 py-2 rounded-l-md hover:bg-green-700 transition-colors focus:outline-none"
                                                onClick={handleDecrement}
                                                data-tooltip-id="buybee-tooltip"
                                                data-tooltip-content="Decrease the number of points to buy"
                                            >
                                                -
                                            </button>
                                            <input 
                                                type="text" 
                                                inputMode="numeric"
                                                value={points === 0 ? '' : points}
                                                onChange={handlePointsChange}
                                                onBlur={handlePointsBlur}
                                                className="w-full bg-white text-gray-800 text-center font-bold text-lg py-2.5 border-none focus:outline-none"
                                                data-tooltip-id="buybee-tooltip"
                                                data-tooltip-content="The number of points you wish to purchase. You can type a number manually."
                                            />
                                            <button 
                                                className="bg-green-600 text-white font-bold text-xl px-4 py-2 rounded-r-md hover:bg-green-700 transition-colors focus:outline-none"
                                                onClick={handleIncrement}
                                                data-tooltip-id="buybee-tooltip"
                                                data-tooltip-content="Increase the number of points to buy"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <label className="block text-sm font-bold text-yellow-400 mb-2">Amount to Pay</label>
                                        <div 
                                            className="inline-block bg-green-600 text-white font-bold px-8 py-3 rounded-full text-lg shadow-md"
                                            data-tooltip-id="buybee-tooltip"
                                            data-tooltip-content="The total cost in US Dollars. The price is $1.00 per point."
                                        >
                                            US${price.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <label className="block text-sm font-bold text-yellow-400 mb-2 uppercase">Payment Method</label>
                                        <div 
                                            className="text-5xl font-extrabold text-indigo-500 italic"
                                            data-tooltip-id="buybee-tooltip"
                                            data-tooltip-content="We use Stripe for secure payment processing."
                                        >
                                            stripe
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Balance Info */}
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                                <div 
                                    className="bg-purple-800/80 text-white p-4 rounded-lg text-center border border-purple-600"
                                    data-tooltip-id="buybee-tooltip"
                                    data-tooltip-content="This is your current balance of EZ$."
                                >
                                    <div className="text-sm text-purple-300 flex items-center justify-center gap-2">
                                        <span>AVAILABLE EZ$</span>
                                        <FontAwesomeIcon 
                                            icon={faInfoCircle} 
                                            className="text-purple-300"
                                            data-tooltip-id="buybee-tooltip"
                                            data-tooltip-content="Your current point balance"
                                        />
                                    </div>
                                    <div className="text-3xl font-bold mt-1">EZ${availablePoints.toFixed(2)}</div>
                                </div>

                                <div 
                                    className="text-center bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-600"
                                    data-tooltip-id="buybee-tooltip"
                                    data-tooltip-content="Using EZ$ unlocks powerful tools to enhance your online presence."
                                >
                                    <h3 className="text-yellow-400 font-semibold mb-3 text-lg">Points Benefits:</h3>
                                    <ul className="text-gray-300 text-sm space-y-2 text-left">
                                        <li className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                            <span>Create unlimited tags and widgets</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                            <span>Access premium features</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                            <span>Enhance your marketing tools</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                                            <span>Boost engagement and conversions</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-center items-center gap-4">
                            <button 
                                onClick={handleClear}
                                className="bg-red-600/90 text-white font-bold py-2.5 px-6 md:px-8 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                                data-tooltip-id="buybee-tooltip"
                                data-tooltip-content="Reset the purchase quantity to 1"
                            >
                                <FontAwesomeIcon icon={faTrashAlt} />
                                <span>Clear</span>
                            </button>
                            <button 
                                onClick={handlePurchase}
                                className="bg-yellow-400 text-black font-bold py-2.5 px-6 md:px-8 rounded-md flex items-center gap-3 hover:bg-yellow-500 transition-colors"
                                data-tooltip-id="buybee-tooltip"
                                data-tooltip-content="Proceed to checkout to complete your purchase"
                            >
                                <FontAwesomeIcon icon={faCreditCard} />
                                <span>Buy Now</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Stripe Payment Modal */}
                {isModalOpen && (
    <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
        <div className="bg-[#235A72] border border-[#3a7a94] text-white p-8 rounded-lg shadow-lg max-w-sm w-full relative max-h-[90vh] overflow-y-auto">
            <button 
                onClick={() => {
                    setIsModalOpen(false);
                    setPaymentStep(1);
                    setErrorMessage('');
                    setSuccessMessage('');
                }}
                className="sticky top-0 right-0 ml-auto text-white/70 hover:text-white transition-colors z-10"
                disabled={isLoading}
                data-tooltip-id="buybee-tooltip"
                data-tooltip-content="Cancel purchase and close this window"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <div className="space-y-6">
                {successMessage && (
                    <div className="bg-green-500/90 text-white p-3 rounded-lg flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        {successMessage}
                    </div>
                )}

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
                            <h2 className="text-xl font-bold mt-4 text-white">Buy EZ${points.toFixed(2)}</h2>
                            <p className="text-[#a8d0e6]">You'll be charged US${price.toFixed(2)}</p>
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
                                    data-tooltip-id="buybee-tooltip"
                                    data-tooltip-content="Your payment receipt will be sent to this email address."
                                />
                            </div>
                            
                            {errorMessage && (
                                <div className="mt-2 text-[#ff6b6b] text-sm">{errorMessage}</div>
                            )}
                        </div>
                        
                        <div className="mt-6">
                            <button 
                                onClick={handleEmailSubmit}
                                disabled={isLoading}
                                className="w-full bg-[#FFD700] text-gray-900 font-bold py-3 px-4 rounded-full hover:bg-[#FFC000] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                data-tooltip-id="buybee-tooltip"
                                data-tooltip-content="Verify your email and proceed to the payment form."
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
                                points={points}
                                price={price}
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