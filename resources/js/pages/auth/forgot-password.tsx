import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface Props {
    status?: string;
    tooltips?: {
        [key: string]: string[];
    };
}

export default function ForgotPassword({ status, tooltips }: Props) {
    const { data, setData, post, processing, errors } = useForm<Required<{ email: string }>>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    // Get auth tooltips from props or use defaults
    const authTooltips = tooltips?.['auth-tooltip'] || [];
    
    // Define default tooltip messages as fallback
    const defaultTooltips = {
        email: 'Enter the email associated with your account',
        button: 'Request a password reset link',
        loginLink: 'Go back to the login page'
    };

    // Use database tooltips or defaults
    const emailTooltip = authTooltips[9] || authTooltips[0] || defaultTooltips.email;
    const buttonTooltip = authTooltips[10] || defaultTooltips.button;
    const loginTooltip = authTooltips[11] || defaultTooltips.loginLink;

    return (
        <AuthLayout title="Forgot password" description="Enter your email to receive a password reset link">
            <Head title="Forgot password">
                {/* This style block ensures tooltips are visible above other elements */}
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                            .react-tooltip {
                                z-index: 99999 !important;
                                opacity: 1 !important;
                                font-size: 12px;
                                padding: 4px 8px;
                            }
                        `,
                    }}
                />
            </Head>

            {/* Tooltip component */}
            <Tooltip id="auth-tooltip" />

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

            <div className="space-y-6">
                <form onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="off"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={emailTooltip}
                        />

                        <InputError message={errors.email} />
                    </div>

                    <div className="my-6 flex items-center justify-start">
                        <Button 
                            className="w-full" 
                            disabled={processing}
                            data-tooltip-id="auth-tooltip"
                            data-tooltip-content={buttonTooltip}
                        >
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Email password reset link
                        </Button>
                    </div>
                </form>

                <div className="text-muted-foreground space-x-1 text-center text-sm">
                    <span>Or, return to</span>
                    <TextLink 
                        href={route('login')}
                        data-tooltip-id="auth-tooltip"
                        data-tooltip-content={loginTooltip}
                    >
                        log in
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}