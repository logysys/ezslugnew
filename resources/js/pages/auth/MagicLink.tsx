import { Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import axios from 'axios';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import TermsAndConditionsContent from '@/components/TermsAndConditionsContent';
import PrivacyPolicyContent from '@/components/PrivacyPolicyContent';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface MagicLinkProps {
    tooltips?: {
        'auth-tooltip'?: string[];
    };
}

export default function MagicLink({ tooltips }: MagicLinkProps) {
    const [email, setEmail] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; agree_to_terms?: string }>({});
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Get tooltips from props or use defaults
    const authTooltips = tooltips?.['auth-tooltip'] || [
        "Enter your registered email address",
        "Click to reset your password",
        "Enter your account password",
        "Keep me logged in on this device",
        "Read the Terms and Conditions",
        "Read the Privacy Policy",
        "Access your account",
        "Receive a login link in your email",
        "Create a new account",
        "Enter the email associated with your account",
        "Request a password reset link",
        "Go back to the login page",
        "Enter your full name",
        "Enter a valid email address",
        "Choose a strong password",
        "Re-enter your password to confirm",
        "Complete registration and create your account",
        "Go to the login page",
        "Enter the email for your account",
        "Request a one-time login link",
        "Go back to log in with your password"
    ];

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        
        if (!agreeToTerms) {
            setErrors({ agree_to_terms: 'You must agree to the Terms and Conditions and Privacy Policy' });
            return;
        }
        
        setIsProcessing(true);
        setStatus(null);
        setErrors({});

        try {
            const response = await axios.post(route('magic-link.send'), { 
                email,
                redirect_url: 'https://ez.wiki/home'
            });

            if (response.status === 200) {
                setStatus({
                    type: 'success',
                    message: 'We\'ve sent a magic link to your email address!',
                });
                setEmail('');
                setAgreeToTerms(false);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 422) {
                    setErrors(error.response.data.errors);
                } else {
                    setStatus({
                        type: 'error',
                        message: error.response?.data.message || 'Failed to send magic link. Please try again.',
                    });
                }
            } else {
                setStatus({
                    type: 'error',
                    message: 'An unexpected error occurred. Please try again.',
                });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const openTermsModal = () => setShowTermsModal(true);
    const closeTermsModal = () => setShowTermsModal(false);
    
    const openPrivacyModal = () => setShowPrivacyModal(true);
    const closePrivacyModal = () => setShowPrivacyModal(false);

    return (
        <AuthLayout
            title="Magic Link Login"
            description="Enter your email address and we'll send you a magic link to login."
        >
            <Head title="Magic Link Login">
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                            .react-tooltip {
                                z-index: 99999 !important;
                                opacity: 1 !important;
                                font-size: 12px;
                                padding: 4px 8px;
                            }
                            .enhanced-checkbox {
                                border: 2px solid rgb(156 163 175) !important;
                                border-radius: 4px;
                            }
                            .enhanced-checkbox[data-state="checked"] {
                                background-color: hsl(142.1 76.2% 36.3%);
                                border-color: hsl(142.1 76.2% 36.3%) !important;
                            }
                        `,
                    }}
                />
            </Head>

            <Tooltip id="auth-tooltip" />
            
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="relative max-w-4xl max-h-[80vh] overflow-y-auto">
                        <TermsAndConditionsContent onClose={closeTermsModal} />
                    </div>
                </div>
            )}
            
            {showPrivacyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="relative max-w-4xl max-h-[80vh] overflow-y-auto">
                        <PrivacyPolicyContent onClose={closePrivacyModal} />
                    </div>
                </div>
            )}

            {status && (
                <div className={`mb-4 rounded-md p-4 ${status.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-center text-sm font-medium ${
                        status.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                        {status.message}
                    </p>
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        autoFocus
                        className={errors.email ? 'border-red-300' : ''}
                        data-tooltip-id="auth-tooltip"
                        data-tooltip-content={authTooltips[18]} // "Enter the email for your account"
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="flex items-start space-x-3 py-2">
                    <Checkbox
                        id="agree_to_terms"
                        name="agree_to_terms"
                        className="enhanced-checkbox"
                        required
                        checked={agreeToTerms}
                        onClick={() => setAgreeToTerms(!agreeToTerms)}
                        tabIndex={2}
                    />
                    <Label htmlFor="agree_to_terms" className="text-sm leading-normal">
                        I agree to the{' '}
                        <button 
                            type="button" 
                            onClick={openTermsModal}
                            className="text-primary text-yellow-400  hover:underline focus:outline-none focus:underline"
                            tabIndex={3}
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={authTooltips[4]} // "Read the Terms and Conditions"
                        >
                            Terms and Conditions
                        </button>{' '}
                        and{' '}
                        <button 
                            type="button" 
                            onClick={openPrivacyModal}
                            className="text-primary text-yellow-400  hover:underline focus:outline-none focus:underline"
                            tabIndex={4}
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={authTooltips[5]} // "Read the Privacy Policy"
                        >
                            Privacy Policy
                        </button>
                    </Label>
                </div>
                <InputError message={errors.agree_to_terms} />

                <Button 
                    className="w-full" 
                    disabled={isProcessing} 
                    tabIndex={5}
                    data-tooltip-id="auth-tooltip"
                    data-tooltip-content={authTooltips[19]} // "Request a one-time login link"
                >
                    {isProcessing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Send Magic Link
                </Button>

                <div className="text-muted-foreground text-center text-sm">
                    Or, <TextLink 
                            href={route('login')} 
                            tabIndex={6}
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={authTooltips[20]} // "Go back to log in with your password"
                        >
                            log in with password
                        </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}