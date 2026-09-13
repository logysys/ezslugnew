import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import TermsAndConditionsContent from '@/components/TermsAndConditionsContent';
import PrivacyPolicyContent from '@/components/PrivacyPolicyContent';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    agree_to_terms: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    tooltips?: {
        'auth-tooltip'?: string[];
    };
}

export default function Login({ status, canResetPassword, tooltips }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
        agree_to_terms: false,
    });

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
        "Continue with Google account",
        "Continue with LinkedIn account"
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (!data.agree_to_terms) {
            // You might want to show an error message here
            return;
        }
        
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const openTermsModal = () => setShowTermsModal(true);
    const closeTermsModal = () => setShowTermsModal(false);
    
    const openPrivacyModal = () => setShowPrivacyModal(true);
    const closePrivacyModal = () => setShowPrivacyModal(false);

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in">
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
            
            {/* Tooltip component */}
            <Tooltip id="auth-tooltip" />
            
            {/* Terms and Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative max-w-4xl max-h-[90vh] overflow-y-auto">
                        <TermsAndConditionsContent onClose={closeTermsModal} />
                    </div>
                </div>
            )}
            
            {/* Privacy Policy Modal */}
            {showPrivacyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative max-w-4xl max-h-[90vh] overflow-y-auto">
                        <PrivacyPolicyContent onClose={closePrivacyModal} />
                    </div>
                </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={authTooltips[0]}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink 
                                    href={route('password.request')} 
                                    className="ml-auto text-sm" 
                                    tabIndex={6}
                                    data-tooltip-id="auth-tooltip"
                                    data-tooltip-content={authTooltips[1]}
                                >
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={authTooltips[2]}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            className="enhanced-checkbox"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={authTooltips[3]}
                        />
                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    <div className="flex items-start space-x-3 py-2">
                        <Checkbox
                            id="agree_to_terms"
                            name="agree_to_terms"
                            className="enhanced-checkbox"
                            required
                            checked={data.agree_to_terms}
                            onClick={() => setData('agree_to_terms', !data.agree_to_terms)}
                            tabIndex={4}
                        />
                        <Label htmlFor="agree_to_terms" className="text-sm leading-normal">
                            I agree to the{' '}
                            <button 
                                type="button" 
                                onClick={openTermsModal}
                                className="text-primary text-yellow-400 hover:underline focus:outline-none focus:underline"
                                tabIndex={5}
                                data-tooltip-id="auth-tooltip"
                                data-tooltip-content={authTooltips[4]}
                            >
                                Terms and Conditions
                            </button>{' '}
                            and{' '}
                            <button 
                                type="button" 
                                onClick={openPrivacyModal}
                                className="text-primary text-yellow-400 hover:underline focus:outline-none focus:underline"
                                tabIndex={6}
                                data-tooltip-id="auth-tooltip"
                                data-tooltip-content={authTooltips[5]}
                            >
                                Privacy Policy
                            </button>
                        </Label>
                    </div>
                    <InputError message={errors.agree_to_terms} />

                    <Button 
                        type="submit" 
                        className="mt-2 w-full" 
                        tabIndex={7} 
                        disabled={processing}
                        data-tooltip-id="auth-tooltip"
                        data-tooltip-content={authTooltips[6]}
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Log in
                    </Button>

                    {/* Social Login Buttons */}
                    <div className="space-y-3">
                        {/* Google Login Button */}
                        <Button 
                            asChild 
                            variant="outline" 
                            className="w-full"
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={authTooltips[9]}
                        >
                            <a href={route('auth.google')}>
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Login with Google
                            </a>
                        </Button>

                        {/* LinkedIn Login Button */}
                        <Button 
                            asChild 
                            variant="outline" 
                            className="w-full"
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content="Login with LinkedIn"
                        >
                            <a href={route('login.linkedin')}>
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                Login with LinkedIn
                            </a>
                        </Button>
						{/* Reddit Login Button */}
                        <Button 
                            asChild 
                            variant="outline" 
                            className="w-full"
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content="Login with Reddit"
                        >
                            <a href={route('auth.reddit')}>
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                                </svg>
                                Login with Reddit
                            </a>
                        </Button>
                    </div>

                    <div className="text-muted-foreground text-center text-sm">
                        Or, <TextLink 
                                href={route('magic-link.show')} 
                                tabIndex={8}
                                data-tooltip-id="auth-tooltip"
                                data-tooltip-content={authTooltips[7]}
                            >
                                log in with magic link
                            </TextLink>
                    </div>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Don't have an account?{' '}
                    <TextLink 
                        href={route('register')} 
                        tabIndex={9}
                        data-tooltip-id="auth-tooltip"
                        data-tooltip-content={authTooltips[8]}
                    >
                        Sign up
                    </TextLink>
                </div>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}