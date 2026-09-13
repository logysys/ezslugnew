import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEnvelopeOpenText,
    faLock,
    faCalculator,
    faCheck,
    faArrowLeft,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

interface EmailVerificationProps {
    onVerificationComplete?: () => void;
    onOpenBox?: () => void;
    funnel?: any;
}

const EmailVerification = ({ onVerificationComplete, onOpenBox, funnel }: EmailVerificationProps) => {
    const [email, setEmail] = useState('');
    const [timer, setTimer] = useState(592); // 9 minutes 52 seconds
    const [otp, setOtp] = useState(['', '', '', '']);
    const [emailError, setEmailError] = useState(false);
    const [currentView, setCurrentView] = useState<'email' | 'otp' | 'verified'>('email');
    const [isResending, setIsResending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitType, setSubmitType] = useState<'code' | 'subscribe' | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (currentView === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [currentView, timer]);

    const isValidEmail = (email: string) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const handleOtpChange = (index: number, value: string) => {
        if (/^\d*$/.test(value) && value.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            
            if (value && index < 3) {
                const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
            if (prevInput) prevInput.focus();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (type: 'code' | 'subscribe') => {
        if (!isValidEmail(email)) {
            setEmailError(true);
            return;
        }
        setEmailError(false);
        setErrorMessage('');
        setIsSubmitting(true);
        setSubmitType(type);
        
        try {
            const response = await axios.post('/send-otp', {
                email,
                type,
                funnel_id: funnel
            });
			
            if (response.data.success) {
                setCurrentView('otp');
                setTimer(592);
            } else {
                setErrorMessage('error:' + (response.data.message || 'Failed to send OTP'));
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            setErrorMessage('error:An error occurred while sending the OTP');
        } finally {
            setIsSubmitting(false);
            setSubmitType(null);
        }
    };

    const verifyCode = async () => {
        const code = otp.join('');
        if (code.length !== 4) return;

        try {
            const response = await axios.post('/verify-otp', {
                email,
                otp: code,
                funnel_id: funnel
            });

            if (response.data.verified) {
                setCurrentView('verified');
            } else {
                setErrorMessage('error:Invalid verification code');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            setErrorMessage('error:An error occurred while verifying the code');
        }
    };

    const resendCode = async () => {
        if (isResending) return;
        setIsResending(true);
        setErrorMessage('');
        
        try {
            const response = await axios.post('/resend-otp', { 
                email,
                funnel_id: funnel
            });
            
            if (response.data.success) {
                setTimer(592);
                setErrorMessage('success:New code sent successfully!');
            } else {
                setErrorMessage('error:' + (response.data.message || 'Failed to resend code'));
            }
        } catch (error) {
            console.error('Error resending code:', error);
            setErrorMessage('error:An error occurred while resending the code');
        } finally {
            setTimeout(() => setIsResending(false), 30000); // 30 second cooldown
        }
    };

    const handleBackToEmail = () => {
        setCurrentView('email');
        setOtp(['', '', '', '']);
        setErrorMessage('');
    };

    const handleOpenBoxClick = () => {
        onVerificationComplete?.();
        onOpenBox?.();
        setCurrentView('email');
        setEmail('');
        setOtp(['', '', '', '']);
    };

    return (
        <>
            <Head>
                <title>Email Verification</title>
            </Head>

            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-yellow-400 rounded-2xl shadow-lg max-w-sm w-full overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-auto opacity-80" aria-hidden="true">
                        <svg viewBox="0 0 500 150" xmlns="http://www.w3.org/2000/svg" className="w-full">
                            <path d="M-5,150 C40,20 80,40 150,50 S250,60 300,40 S400,20 505,80 L505,0 L-5,0 Z" fill="#fbbf24" />
                            <path d="M-5,150 C40,20 80,40 150,50 S250,60 300,40 S400,20 505,80 L505,0 L-5,0 Z" fill="#fbbf24" transform="translate(0, 20)" opacity="0.7"/>
                            <path d="M-5,150 C40,20 80,40 150,50 S250,60 300,40 S400,20 505,80 L505,0 L-5,0 Z" fill="#fbbf24" transform="translate(0, 40)" opacity="0.5"/>
                        </svg>
                    </div>
                    
                    <div className="relative p-8 text-center z-10">
                        {errorMessage && (
                            <div className={`mb-4 p-2 rounded-md ${
                                errorMessage.startsWith('success:') 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {errorMessage.replace(/^(success|error):/, '')}
                            </div>
                        )}

                        {currentView === 'email' && (
                            <>
                                <div className="relative inline-block mb-4">
                                    <div className="w-24 h-24 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                                        <FontAwesomeIcon icon={faEnvelopeOpenText} className="text-5xl" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-4 bg-yellow-400 p-2 rounded-full flex items-center justify-center border-4 border-yellow-500">
                                        <FontAwesomeIcon icon={faLock} className="text-3xl text-gray-800" />
                                    </div>
                                </div>
                                <h1 className="text-white text-4xl font-bold mt-2">Verify your email</h1>
                                <p className="text-white text-opacity-90 mt-4 mb-8">Please enter your email address to receive a 4-digit code.</p>
                                
                                <div className="mb-4 flex flex-col items-center">
                                    <div className="mb-4">
                                        <label htmlFor="email" className="sr-only">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="yourmail@example.com" 
                                            className={`w-full px-4 py-3 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 ${emailError ? 'ring-2 ring-red-500' : 'focus:ring-green-400'}`}
                                        />
                                        {emailError && <p className="text-red-500 text-sm mt-1">Please enter a valid email address</p>}
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleSubmit('code')}
                                        disabled={isSubmitting}
                                        className={`bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg mb-4 w-auto hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center ${
                                            isSubmitting && submitType === 'code' ? 'opacity-70 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {isSubmitting && submitType === 'code' ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Get Key Code'
                                        )}
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleSubmit('subscribe')}
                                        disabled={isSubmitting}
                                        className={`w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center ${
                                            isSubmitting && submitType === 'subscribe' ? 'opacity-70 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {isSubmitting && submitType === 'subscribe' ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Get Key Code and<br />Subscribe
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {currentView === 'otp' && (
                            <>
                                <button 
                                    onClick={handleBackToEmail}
                                    className="absolute top-4 left-4 text-white hover:text-gray-200"
                                    aria-label="Back to email input"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="h-6 w-6" />
                                </button>
                                
                                <div className="inline-block mb-4 p-4 bg-gray-700 bg-opacity-80 rounded-lg">
                                    <FontAwesomeIcon icon={faCalculator} className="text-4xl text-white" />
                                </div>
                                
                                <h2 className="text-white text-3xl font-bold leading-tight">
                                    Please enter the<br />4-digit code.
                                </h2>
                                
                                <p className="text-white text-opacity-90 mt-2">
                                    Sent to <strong>{email}</strong>
                                </p>
                                
                                <div className="my-6">
                                    <p className="text-white text-opacity-80">Enter the Code</p>
                                    <p className={`text-lg font-bold ${timer <= 0 ? 'text-red-600' : 'text-white'}`}>
                                        {timer <= 0 ? 'Expired' : formatTime(timer)}
                                    </p>
                                </div>
                                
                                <div className="flex justify-center space-x-3">
                                    {[0, 1, 2, 3].map((index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength={1}
                                            value={otp[index]}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className="w-12 h-14 text-center text-2xl border-2 border-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
                                            inputMode="numeric"
                                        />
                                    ))}
                                </div>
                                
                                <p className="text-white text-opacity-80 mt-6">
                                    Didn't receive?{' '}
                                    <button 
                                        className={`text-blue-400 font-semibold hover:underline ${isResending || timer <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={resendCode}
                                        disabled={isResending || timer <= 0}
                                    >
                                        {isResending ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
                                                Resending...
                                            </>
                                        ) : 'Resend Pin Code'}
                                    </button>
                                </p>
                                
                                <button 
                                    onClick={verifyCode}
                                    disabled={otp.join('').length !== 4}
                                    className={`w-full mt-6 bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center ${
                                        otp.join('').length !== 4 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    Confirm
                                </button>
                            </>
                        )}

                        {currentView === 'verified' && (
                            <>
                                <button 
                                    onClick={handleBackToEmail}
                                    className="absolute top-4 left-4 text-white hover:text-gray-200"
                                    aria-label="Back to OTP input"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="h-6 w-6" />
                                </button>
                                
                                <FontAwesomeIcon icon={faCheck} className="text-6xl text-green-600 mb-6" />
                                
                                <h2 className="text-white text-4xl font-bold">Verified!</h2>
                                
                                <p className="text-white text-opacity-90 mt-4 mb-8">
                                    Your email has been successfully verified.
                                </p>
                                
                                <button 
                                    onClick={handleOpenBoxClick}
                                    className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                                >
                                    Open Box
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmailVerification;