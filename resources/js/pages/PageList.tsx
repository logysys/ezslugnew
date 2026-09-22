import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import DraggableMenu from '@/components/DraggableMenu';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faGlobe, 
    faSpinner, 
    faCheckCircle, 
    faExclamationTriangle,
    faTimes,
    faFileAlt,
    faEye,
    faEdit,
    faTrash,
    faLock,
    faFileCode,
    faPlus,
    faCopy,
    faCalendarAlt,
    faUpload,
    faCode,
    faSave,
    faUndo,
    faChevronLeft,
    faChevronRight,
    faStore,
    faEyeSlash,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// ==================== Type Definitions ====================

interface PageData {
    id: number;
    slug: string;
    title: string;
    hasSecrets: boolean;
    created_at: string;
    created_at_formatted: string;
    updated_at: string;
    updated_at_formatted: string;
    ezFunnelToken?: number | null;
    ezFunnelId?: number | null;
    customDomains?: any[];
    handleDomains?: any[];
}

interface PageDetail extends PageData {
    html_content: string | null;
    processed_html: string | null;
    restored_html: string | null;
    secrets: any[];
    customDomains?: any[];
    handleDomains?: any[];
}

interface PaginatedResponse {
    success: boolean;
    data: PageData[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface PageListProps {
    pages: {
        data: PageData[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    totalPages: number;
    currentPage: number;
    lastPage: number;
    perPage: number;
    domains: Domain[];
    auth?: { user: any };
}

interface Domain {
    id: number;
    domain: string;
}

type ViewMode = 'page' | 'ai' | 'naked' | 'dressed';

// ==================== Constants ====================

const SORT_OPTIONS = [
    { value: 'recent', label: 'Most recent' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['value'];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

// ==================== Utility Functions ====================

const stripHtmlTags = (html: string): string => {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

// ==================== Subcomponents ====================

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

// Modern Status Badge Component - matches AIHistory design
const StatusBadge: React.FC<{ status: string; hasSecrets?: boolean }> = ({ status, hasSecrets }) => {
    if (hasSecrets) {
        return (
            <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full" />
                <span className="truncate">Has Secrets</span>
            </span>
        );
    }
    
    return (
        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
            <span className="truncate">Public</span>
        </span>
    );
};

// Custom Alert Component
const CustomAlert: React.FC<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    };

    const icons = {
        success: (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    };

    return (
        <div className={`fixed top-20 right-4 z-[200] p-4 rounded-xl border shadow-lg ${styles[type]} animate-slide-left max-w-md`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="flex-1 text-sm font-medium break-words">{message}</div>
                <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Copy URL Button Component
const CopyUrlButton: React.FC<{ slug: string }> = ({ slug }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/page/${slug}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-green-600 transition-colors"
            data-tooltip-id="main-tooltip"
            data-tooltip-content={copied ? "Copied!" : "Copy URL"}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
        </button>
    );
};

// Stripe Checkout Form Component
const StripeCheckoutForm = ({
    price,
    clientSecret,
    onSuccess,
    onBack,
    onError,
    email
}: {
    price: number;
    clientSecret: string;
    onSuccess: () => void;
    onBack: () => void;
    onError: (message: string) => void;
    email?: string;
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
                    payment_method_data: {
                        billing_details: {
                            email: email,
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
                    <span data-tooltip-id="main-tooltip" data-tooltip-content="Error notification">
                        {error}
                    </span>
                </div>
            )}

            <div className="mt-4 text-sm text-gray-300">
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
                                email: 'never',
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
                    ) : `Pay US${price.toFixed(2)}`}
                </button>
            </div>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-yellow-400 hover:underline"
                >
                    Back
                </button>
                <p className="mt-2 text-xs text-gray-500">
                    Payment secured by STRIPE. You'll be redirected after payment.
                </p>
            </div>
        </form>
    );
};

// HTML Content Editor Component
const HtmlContentEditor: React.FC<{
    htmlContent: string;
    onContentChange: (content: string) => void;
    onExtractTitle: () => void;
}> = ({ htmlContent, onContentChange, onExtractTitle }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('paste');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        if (!file.name.endsWith('.html') && file.type !== 'text/html') {
            alert('Please upload an HTML file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            onContentChange(content);
        };
        reader.onerror = () => {
            alert('Error reading file');
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'upload'
                            ? 'bg-white text-green-600 border-b-2 border-green-600'
                            : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.5861.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    File Upload
                </button>
                <button
                    onClick={() => setActiveTab('paste')}
                    className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'paste'
                            ? 'bg-white text-green-600 border-b-2 border-green-600'
                            : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Paste Code
                </button>
            </div>

            {activeTab === 'upload' && (
                <div className="p-4">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                            ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 bg-gray-50/50'}
                            ${htmlContent ? 'border-green-400 bg-green-50/30' : ''}
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".html,.htm,text/html"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                            {htmlContent ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.5861.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )}
                        </div>
                        {htmlContent ? (
                            <div>
                                <p className="font-medium text-green-700 mb-1">
                                    File loaded successfully!
                                </p>
                                <p className="text-sm text-gray-500">
                                    Click or drop to replace
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-gray-700 mb-1">
                                    Drop your HTML file here
                                </p>
                                <p className="text-sm text-gray-500">
                                    or click to browse
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Supports .html, .htm
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'paste' && (
                <div className="p-4">
                    <textarea
                        value={htmlContent}
                        onChange={(e) => onContentChange(e.target.value)}
                        placeholder={`<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>Hello World</h1>
  <p>Your content here...</p>
</body>
</html>`}
                        className="w-full min-h-[300px] px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 resize-y"
                    />
                </div>
            )}
        </div>
    );
};

// Right Side Edit Panel Component
const EditPanel: React.FC<{
    page: PageDetail | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (page: PageDetail, title: string, slug: string, htmlContent?: string) => Promise<void>;
    onUpdateContent: (pageId: number, htmlContent: string) => Promise<boolean>;
    onCheckSlug: (slug: string, pageId?: number) => Promise<boolean>;
    isUpdating?: boolean;
    onShowAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}> = ({ page, isOpen, onClose, onUpdate, onUpdateContent, onCheckSlug, isUpdating = false, onShowAlert }) => {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [originalHtmlContent, setOriginalHtmlContent] = useState('');
    const [originalTitle, setOriginalTitle] = useState('');
    const [originalSlug, setOriginalSlug] = useState('');
    const [slugError, setSlugError] = useState('');
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugSuccess, setSlugSuccess] = useState('');
    const [titleSuccess, setTitleSuccess] = useState('');
    const [contentSaved, setContentSaved] = useState(false);
    const [activeEditTab, setActiveEditTab] = useState<'details' | 'content'>('details');
    const [isSavingContent, setIsSavingContent] = useState(false);
    const [titleError, setTitleError] = useState('');
    const slugTimeoutRef = useRef<NodeJS.Timeout>();
    const saveTimeoutRef = useRef<NodeJS.Timeout>();

    // Reset all states when page changes
    useEffect(() => {
        if (page) {
            setTitle(page.title);
            setSlug(page.slug);
            setOriginalTitle(page.title);
            setOriginalSlug(page.slug);
            const originalContent = page.html_content || '';
            setHtmlContent(originalContent);
            setOriginalHtmlContent(originalContent);
            setSlugError('');
            setSlugSuccess('');
            setTitleSuccess('');
            setTitleError('');
            setContentSaved(false);
        }
    }, [page]);

    useEffect(() => {
        if (slug && slug !== originalSlug && slug.length >= 3) {
            if (slugTimeoutRef.current) {
                clearTimeout(slugTimeoutRef.current);
            }
            
            slugTimeoutRef.current = setTimeout(async () => {
                setSlugChecking(true);
                const available = await onCheckSlug(slug, page?.id);
                if (available) {
                    setSlugError('');
                    setSlugSuccess('Slug is available!');
                } else {
                    setSlugError('Slug is already taken');
                    setSlugSuccess('');
                }
                setSlugChecking(false);
            }, 500);
        } else if (slug === originalSlug) {
            setSlugError('');
            setSlugSuccess('');
        }
        
        return () => {
            if (slugTimeoutRef.current) {
                clearTimeout(slugTimeoutRef.current);
            }
        };
    }, [slug, originalSlug, page, onCheckSlug]);

    // Auto-save HTML content
    useEffect(() => {
        if (htmlContent !== originalHtmlContent && page) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            
            saveTimeoutRef.current = setTimeout(() => {
                handleSaveContent();
            }, 2000);
        }
        
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [htmlContent, originalHtmlContent, page]);

    const handleSaveContent = async () => {
        if (!page || htmlContent === originalHtmlContent) return;
        
        setIsSavingContent(true);
        try {
            const success = await onUpdateContent(page.id, htmlContent);
            if (success) {
                setOriginalHtmlContent(htmlContent);
                setContentSaved(true);
                if (onShowAlert) onShowAlert('Content saved automatically!', 'success');
                setTimeout(() => setContentSaved(false), 3000);
            } else {
                if (onShowAlert) onShowAlert('Failed to save content', 'error');
            }
        } catch (error) {
            console.error('Failed to save content:', error);
            if (onShowAlert) onShowAlert('Failed to save content', 'error');
        } finally {
            setIsSavingContent(false);
        }
    };

    const handleTitleUpdate = async () => {
        if (!page || !title.trim()) {
            setTitleError('Title cannot be empty');
            return;
        }
        
        setTitleError('');
        try {
            await onUpdate(page, title, slug, undefined);
            setOriginalTitle(title);
            setTitleSuccess('Title updated successfully!');
            if (onShowAlert) onShowAlert('Title updated successfully!', 'success');
            setTimeout(() => setTitleSuccess(''), 3000);
        } catch (error) {
            console.error('Failed to update title:', error);
            setTitleError('Failed to update title');
            if (onShowAlert) onShowAlert('Failed to update title', 'error');
        }
    };

    const handleSlugUpdate = async () => {
        if (!page || !slug.trim()) {
            setSlugError('Slug cannot be empty');
            return;
        }
        
        if (slug === originalSlug) return;
        
        if (slugError) {
            if (onShowAlert) onShowAlert('Please fix the slug error before saving', 'error');
            return;
        }
        
        try {
            await onUpdate(page, title, slug, undefined);
            setOriginalSlug(slug);
            setSlugSuccess('Slug updated successfully!');
            if (onShowAlert) onShowAlert('Slug updated successfully!', 'success');
            setTimeout(() => setSlugSuccess(''), 3000);
        } catch (error: any) {
            setSlugError(error.message || 'Failed to update slug');
            if (onShowAlert) onShowAlert(error.message || 'Failed to update slug', 'error');
        }
    };

    const extractTitleFromHtml = () => {
        const match = htmlContent.match(/<title[^>]*>([^<]*)<\/title>/i);
        if (match?.[1]?.trim()) {
            setTitle(match[1].trim());
            if (onShowAlert) onShowAlert('Title extracted from HTML!', 'success');
        } else {
            if (onShowAlert) onShowAlert('No title tag found in HTML', 'warning');
        }
    };

    if (!isOpen || !page) return null;

    return (
        <div className="w-full bg-white border border-gray-200 rounded-3xl shadow-xl flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Page
                </h2>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="px-6 flex border-b border-gray-200">
                <button
                    onClick={() => setActiveEditTab('details')}
                    className={`py-4 px-2 text-sm font-bold ${
                        activeEditTab === 'details'
                            ? 'text-green-600 border-b-2 border-green-500'
                            : 'text-gray-400 hover:text-gray-600'
                    } transition-colors`}
                >
                    Page Details
                </button>
                <button
                    onClick={() => setActiveEditTab('content')}
                    className={`py-4 px-6 text-sm font-medium ${
                        activeEditTab === 'content'
                            ? 'text-green-600 border-b-2 border-green-500'
                            : 'text-gray-400 hover:text-gray-600'
                    } transition-colors`}
                >
                    HTML Content
                </button>
            </div>

            <div className="p-6 space-y-7 overflow-y-auto custom-scrollbar flex-1">
                {activeEditTab === 'details' ? (
                    <>
                        {/* Title Section */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Title</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setTitleError('');
                                    }}
                                    className={`flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-green-400 outline-none text-sm font-medium bg-gray-50/30 ${
                                        titleError ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                    placeholder="Page title"
                                />
                                <button
                                    onClick={handleTitleUpdate}
                                    disabled={isUpdating || !title.trim() || title === originalTitle}
                                    className="bg-[#A7F3D0] text-green-800 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-200 transition shadow-sm disabled:opacity-50"
                                >
                                    {isUpdating ? <LoadingSpinner size={16} /> : 'Update'}
                                </button>
                            </div>
                            {titleError && (
                                <p className="text-xs text-red-600 mt-1">{titleError}</p>
                            )}
                            {titleSuccess && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    {titleSuccess}
                                </p>
                            )}
                        </div>

                        {/* Slug Section */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Slug</label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <div className="flex items-center">
                                        <span className="inline-flex items-center px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                            /page/
                                        </span>
                                        <input
                                            type="text"
                                            value={slug}
                                            onChange={(e) => {
                                                const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                                                setSlug(newSlug);
                                            }}
                                            className={`flex-1 px-4 py-2.5 border rounded-r-xl focus:ring-2 focus:ring-green-500/30 focus:border-green-400 outline-none text-sm font-medium bg-gray-50/30 ${
                                                slugError ? 'border-red-300' : slugSuccess ? 'border-green-300' : 'border-gray-200'
                                            }`}
                                            placeholder="url-slug"
                                        />
                                    </div>
                                    {slugChecking && (
                                        <div className="absolute right-3 top-3.5">
                                            <LoadingSpinner size={16} />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSlugUpdate}
                                    disabled={isUpdating || !slug.trim() || slug === originalSlug || slugError !== ''}
                                    className="bg-[#A7F3D0] text-green-800 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-200 transition shadow-sm disabled:opacity-50"
                                >
                                    {isUpdating ? <LoadingSpinner size={16} /> : 'Update'}
                                </button>
                            </div>
                            {slugError && (
                                <p className="text-xs text-red-600 mt-1">{slugError}</p>
                            )}
                            {slugSuccess && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    {slugSuccess}
                                </p>
                            )}
                            <p className="text-[11px] text-gray-400 mt-2 font-mono italic">
                                🔗 Current URL: /page/{originalSlug}
                            </p>
                        </div>

                        {/* Secrets Info */}
                        {page.hasSecrets && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <span className="text-sm font-bold">Page contains secrets</span>
                                </div>
                                <p className="text-xs text-yellow-600">
                                    {page.secrets?.length || 0} secret(s) detected and will be automatically handled when viewing the page.
                                </p>
                            </div>
                        )}

                        {/* Stats Section */}
                        <div className="pt-2">
                            <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wider">Page Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Created</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800">{page.created_at_formatted}</p>
                                </div>
                                <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Last Updated</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800">{page.updated_at_formatted}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions Section */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex gap-3">
                                <a
                                    href={`/page/${page.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold transition"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    View Page
                                </a>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/page/${page.slug}`;
                                        navigator.clipboard.writeText(url);
                                        if (onShowAlert) onShowAlert('URL copied to clipboard!', 'success');
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    Copy URL
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-2 text-center text-gray-400 text-[10px] font-medium">
                            Page ID: {page.id}
                        </div>
                    </>
                ) : (
                    <>
                        {/* HTML Content Editor */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-bold text-gray-700">
                                    HTML Content
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={extractTitleFromHtml}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        Extract Title
                                    </button>
                                    {contentSaved && (
                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                            Saved
                                        </span>
                                    )}
                                    {isSavingContent && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <LoadingSpinner size={12} />
                                            Saving...
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <HtmlContentEditor
                                htmlContent={htmlContent}
                                onContentChange={setHtmlContent}
                                onExtractTitle={extractTitleFromHtml}
                            />
                            
                            <div className="flex items-center justify-between mt-3">
                                <p className="text-[11px] text-gray-400">
                                    {htmlContent.length.toLocaleString()} characters
                                </p>
                                {htmlContent !== originalHtmlContent && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setHtmlContent(originalHtmlContent);
                                                if (onShowAlert) onShowAlert('Changes reverted', 'info');
                                            }}
                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                <path d="M3 3v5h5" />
                                            </svg>
                                            Revert
                                        </button>
                                        <button
                                            onClick={handleSaveContent}
                                            disabled={isSavingContent}
                                            className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                <polyline points="17 21 17 13 7 13 7 21" />
                                                <polyline points="7 3 7 8 15 8" />
                                            </svg>
                                            Save Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* HTML Preview */}
                        {htmlContent && (
                            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                            <polyline points="2 17 12 22 22 17" />
                                            <polyline points="2 12 12 17 22 12" />
                                        </svg>
                                        <span className="text-sm font-medium text-gray-700">HTML Preview</span>
                                    </div>
                                    <span className="text-xs bg-white text-gray-600 px-2 py-1 rounded-md shadow-sm">
                                        {htmlContent.length.toLocaleString()} characters
                                    </span>
                                </div>
                                <div className="p-4">
                                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto text-gray-600 font-mono">
                                        {htmlContent.substring(0, 2000)}
                                        {htmlContent.length > 2000 && '\n\n<!-- ... truncated ... -->'}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Preview Modal Component
const PreviewModal: React.FC<{
    page: PageData | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ page, isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (isOpen && page) {
            setLoading(true);
            setError(null);
            
            if (iframeRef.current) {
                iframeRef.current.src = `/page-preview/${page.slug}`;
            }
        }
    }, [isOpen, page]);

    const handleIframeLoad = () => {
        setLoading(false);
    };

    const handleIframeError = () => {
        setLoading(false);
        setError('Failed to load page preview');
    };

    if (!isOpen || !page) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                            <p className="text-xs text-gray-500">/page/{page.slug}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <LoadingSpinner size={40} />
                                <p className="mt-2 text-sm text-gray-500">Loading preview...</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center text-red-500">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <p className="mt-2">{error}</p>
                            </div>
                        </div>
                    )}
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full border-0 rounded-b-xl"
                        title="Page Preview"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                    />
                </div>

                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
                    <a
                        href={`/page/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Open in new tab
                    </a>
                </div>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
const DeleteModal: React.FC<{
    page: PageData | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isDeleting?: boolean;
}> = ({ page, isOpen, onClose, onConfirm, isDeleting = false }) => {
    if (!isOpen || !page) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Page</h3>
                            <p className="text-sm text-gray-500">This action cannot be undone.</p>
                        </div>
                    </div>

                    <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete <strong>{page.title}</strong>?
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Slug: /page/{page.slug}
                        </p>
                        {page.hasSecrets && (
                            <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                This page contains secrets that will be permanently deleted.
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <LoadingSpinner size={16} />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    <span>Delete</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== Main Component ====================
export default function PageList({
    pages: initialPages,
    totalPages,
    currentPage,
    lastPage,
    perPage,
    domains: initialDomains,
    auth,
}: PageListProps) {
    const [pages, setPages] = useState<PageData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(currentPage < lastPage);
    const [page, setPage] = useState(currentPage);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPages, setFilteredPages] = useState<PageData[]>([]);
    const [currentSort, setCurrentSort] = useState<SortOption>('recent');
    const [domains, setDomains] = useState<Domain[]>(initialDomains || []);

    // Panel states
    const [editPanelOpen, setEditPanelOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
    const [selectedPageDetail, setSelectedPageDetail] = useState<PageDetail | null>(null);
    
    // Action states
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});
    
    // Alert state
    const [customAlert, setCustomAlert] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({ show: false, message: '', type: 'info' });

    // Express Domain states (replacing buyDomainModal)
    const [isExpressDomainOpen, setIsExpressDomainOpen] = useState(false);
    const [domainPage, setDomainPage] = useState<PageData | null>(null);
    const [currentConversationSlug, setCurrentConversationSlug] = useState('');
    const [currentConversationTitle, setCurrentConversationTitle] = useState('');
    const [currentConversationEzFunnelId, setCurrentConversationEzFunnelId] = useState<number | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('page');
    const [brandInput, setBrandInput] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [activeOption, setActiveOption] = useState<'handle' | 'domain'>('domain');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [termsAgreed, setTermsAgreed] = useState(false);
    
    // Error and success messages
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Availability status (like AIHistory)
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
    
    const [couponStatus, setCouponStatus] = useState<{
        valid: boolean | null;
        message: string;
        discount: number;
        domain_discount?: number;
    }>({
        valid: null,
        message: '',
        discount: 0
    });
    const [lastCheckedInput, setLastCheckedInput] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntentId, setPaymentIntentId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState<{
        success: boolean;
        message: string;
        url?: string;
    }>({
        success: false,
        message: '',
        url: ''
    });
    const [priceCalculationKey, setPriceCalculationKey] = useState(0);
    const [purchaseFormType, setPurchaseFormType] = useState<'handle' | 'domain' | null>(null);

    const loaderRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    // Cache for domain data to preserve during updates
    const domainDataCache = useRef<Map<number, { ezFunnelToken?: number | null; customDomains?: any[]; handleDomains?: any[] }>>(new Map());

    const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'error') => {
        setCustomAlert({ show: true, message, type });
    }, []);

    // Auto-clear error message after 60 seconds
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
            }, 60000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    // Auto-clear success message after 60 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 60000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Auto-close purchase success modal after 60 seconds
    useEffect(() => {
        if (purchaseSuccess.success) {
            const timer = setTimeout(() => {
                handleCloseExpressDomain();
            }, 60000);
            return () => clearTimeout(timer);
        }
    }, [purchaseSuccess.success]);

    // Initialize domains from props
    useEffect(() => {
        if (initialDomains && initialDomains.length > 0) {
            setDomains(initialDomains);
            setSelectedDomain(initialDomains[0].domain);
        } else {
            console.warn('No domains received from backend, using fallback');
            const fallbackDomains = [
                { id: 1, domain: 'com' },
                { id: 2, domain: 'io' },
                { id: 3, domain: 'net' },
                { id: 4, domain: 'org' },
            ];
            setDomains(fallbackDomains);
            setSelectedDomain(fallbackDomains[0].domain);
        }
    }, [initialDomains]);

    // Initialize pages from props and cache domain data
    useEffect(() => {
        const pageData = initialPages?.data || [];
        setPages(pageData);
        pageData.forEach(page => {
            if (page.ezFunnelToken || (page.customDomains?.length) || (page.handleDomains?.length)) {
                domainDataCache.current.set(page.id, {
                    ezFunnelToken: page.ezFunnelToken,
                    customDomains: page.customDomains,
                    handleDomains: page.handleDomains,
                });
            }
        });
    }, [initialPages]);

    // Filter and sort pages
    useEffect(() => {
        let filtered = [...pages];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (pageItem) =>
                    pageItem.title.toLowerCase().includes(query) ||
                    pageItem.slug.toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => {
            switch (currentSort) {
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                case 'recent':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        setFilteredPages(filtered);
    }, [pages, searchQuery, currentSort]);

    // Check availability with debounce
    useEffect(() => {
        if (brandInput.trim() && selectedDomain && isExpressDomainOpen) {
            const timer = setTimeout(() => {
                checkDomainAvailability();
            }, 800);
            
            return () => clearTimeout(timer);
        }
    }, [brandInput, selectedDomain, isExpressDomainOpen]);

    // Validate coupon with debounce
    useEffect(() => {
        if (couponCode.trim() && brandInput.trim() && isExpressDomainOpen) {
            const timer = setTimeout(() => {
                validateCoupon();
            }, 800);
            
            return () => clearTimeout(timer);
        } else {
            setCouponStatus({
                valid: null,
                message: '',
                discount: 0,
                domain_discount: 0
            });
        }
    }, [couponCode, brandInput, isExpressDomainOpen]);

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.5, rootMargin: '100px' }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [hasMore, loading]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const response = await axios.get<PaginatedResponse>('/pages-list/load-more', {
                params: { page: page + 1, per_page: perPage },
            });

            if (response.data.success) {
                const newPages = response.data.data;
                newPages.forEach(p => {
                    if (p.ezFunnelToken || (p.customDomains?.length) || (p.handleDomains?.length)) {
                        domainDataCache.current.set(p.id, {
                            ezFunnelToken: p.ezFunnelToken,
                            customDomains: p.customDomains,
                            handleDomains: p.handleDomains,
                        });
                    }
                });
                setPages((prev) => [...prev, ...newPages]);
                setPage(response.data.meta.current_page);
                setHasMore(response.data.meta.current_page < response.data.meta.last_page);
            }
        } catch (error) {
            console.error('Failed to load more pages:', error);
            showAlert('Failed to load more pages', 'error');
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, perPage, showAlert]);

    // Refresh page data function - preserves domain data from cache
    const refreshPageData = useCallback(async (pageId: number) => {
        try {
            const response = await axios.get(`/pages-list/${pageId}`);
            if (response.data.success && response.data.page) {
                const freshData = response.data.page;
                
                const cachedDomainData = domainDataCache.current.get(pageId);
                
                setPages(prev =>
                    prev.map(p =>
                        p.id === pageId
                            ? {
                                ...p,
                                title: freshData.title || p.title,
                                slug: freshData.slug || p.slug,
                                hasSecrets: freshData.hasSecrets ?? p.hasSecrets,
                                updated_at: freshData.updated_at || p.updated_at,
                                updated_at_formatted: freshData.updated_at_formatted || p.updated_at_formatted,
                                ezFunnelToken: cachedDomainData?.ezFunnelToken ?? freshData.ezFunnelToken ?? p.ezFunnelToken,
                                ezFunnelId: freshData.ezFunnelId ?? p.ezFunnelId,
                                customDomains: cachedDomainData?.customDomains ?? freshData.customDomains ?? p.customDomains ?? [],
                                handleDomains: cachedDomainData?.handleDomains ?? freshData.handleDomains ?? p.handleDomains ?? [],
                            }
                            : p
                    )
                );
                
                if (selectedPageDetail && selectedPageDetail.id === pageId) {
                    setSelectedPageDetail(prev => prev ? {
                        ...prev,
                        title: freshData.title || prev.title,
                        slug: freshData.slug || prev.slug,
                        hasSecrets: freshData.hasSecrets ?? prev.hasSecrets,
                        updated_at: freshData.updated_at || prev.updated_at,
                        updated_at_formatted: freshData.updated_at_formatted || prev.updated_at_formatted,
                        html_content: freshData.html_content ?? prev.html_content,
                        processed_html: freshData.processed_html ?? prev.processed_html,
                        restored_html: freshData.restored_html ?? prev.restored_html,
                        secrets: freshData.secrets ?? prev.secrets,
                        ezFunnelToken: cachedDomainData?.ezFunnelToken ?? prev.ezFunnelToken,
                        ezFunnelId: freshData.ezFunnelId ?? prev.ezFunnelId,
                        customDomains: cachedDomainData?.customDomains ?? prev.customDomains ?? [],
                        handleDomains: cachedDomainData?.handleDomains ?? prev.handleDomains ?? [],
                    } : null);
                }
            }
        } catch (error) {
            console.error('Failed to refresh page data:', error);
        }
    }, [selectedPageDetail]);

    const fetchPageDetail = async (pageData: PageData): Promise<PageDetail | null> => {
        setLoadingDetails(prev => ({ ...prev, [pageData.id]: true }));
        try {
            const response = await axios.get(`/pages-list/${pageData.id}`);
            if (response.data.success) {
                const pageDetail = response.data.page;
                domainDataCache.current.set(pageData.id, {
                    ezFunnelToken: pageDetail.ezFunnelToken,
                    customDomains: pageDetail.customDomains,
                    handleDomains: pageDetail.handleDomains,
                });
                return pageDetail;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch page details:', error);
            showAlert('Failed to load page details', 'error');
            return null;
        } finally {
            setLoadingDetails(prev => ({ ...prev, [pageData.id]: false }));
        }
    };

    const handleEditClick = async (pageData: PageData) => {
        setSelectedPage(pageData);
        const detail = await fetchPageDetail(pageData);
        if (detail) {
            setSelectedPageDetail(detail);
            setEditPanelOpen(true);
        }
    };

    const handleCloseEditPanel = () => {
        setEditPanelOpen(false);
        setSelectedPage(null);
        setSelectedPageDetail(null);
    };

    const handlePreviewClick = (pageData: PageData) => {
        setSelectedPage(pageData);
        setPreviewModalOpen(true);
    };

    const handleDeleteClick = (pageData: PageData) => {
        setSelectedPage(pageData);
        setDeleteModalOpen(true);
    };

    const handleBuyDomainClick = (page: PageData) => {
        setDomainPage(page);
        setCurrentConversationSlug(page.slug);
        setCurrentConversationTitle(page.title);
        const ezId = page.ezFunnelId ? page.ezFunnelId : null;
        setCurrentConversationEzFunnelId(ezId);
        setIsExpressDomainOpen(true);
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
            domain_discount: 0
        });
        setTermsAgreed(false);
        setPurchaseSuccess({ success: false, message: '', url: '' });
        setErrorMessage('');
        setSuccessMessage('');
        setActiveOption('domain');
    };

    const handleCloseExpressDomain = () => {
        setIsExpressDomainOpen(false);
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
            domain_discount: 0
        });
        setTermsAgreed(false);
        setPurchaseSuccess({ success: false, message: '', url: '' });
        setErrorMessage('');
        setSuccessMessage('');
        setIsPaymentModalOpen(false);
        setPaymentStep(1);
        setClientSecret('');
        setPaymentIntentId('');
        setPurchaseFormType(null);
        setIsLoading(false);
        setDomainPage(null);
        setCurrentConversationSlug('');
        setCurrentConversationTitle('');
        setCurrentConversationEzFunnelId(null);
    };

    const checkDomainAvailability = async () => {
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
            const response = await axios.post('/ezai/check-ezpressstandard-domain', {
                handle: brandInput.trim(),
                domain: selectedDomain
            });
            
            setPurchaseSuccess({
                success: false,
                message: '',
                url: ''
            });
            
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

    const validateCoupon = async () => {
        if (!couponCode.trim() || !brandInput.trim()) {
            setCouponStatus({
                valid: false,
                message: 'Please enter a coupon code and brand name',
                discount: 0,
                domain_discount: 0
            });
            return;
        }

        try {
            setCouponStatus({
                valid: null,
                message: 'Validating coupon...',
                discount: 0,
                domain_discount: 0
            });
            
            const response = await axios.post('/ezai/couponcodecustomdomain', {
                couponcode: couponCode.trim(),
                domainurl: brandInput.trim(),
                type: activeOption
            });

            if (response.data.valid) {
                const discountedPrice = response.data.offprice !== undefined ? response.data.offprice : response.data.original_price;
                
                const cleanMessage = stripHtmlTags(response.data.title || 'Coupon applied successfully!');
                
                setCouponStatus({
                    valid: true,
                    message: cleanMessage,
                    discount: Number(discountedPrice),
                    domain_discount: Number(discountedPrice)
                });
                
                setPriceCalculationKey(prev => prev + 1);
                showAlert('Coupon applied successfully!', 'success');
            } else {
                const cleanMessage = stripHtmlTags(response.data.title || 'Invalid coupon code');
                
                setCouponStatus({
                    valid: false,
                    message: cleanMessage,
                    discount: 0,
                    domain_discount: 0
                });
                showAlert(cleanMessage, 'error');
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            setCouponStatus({
                valid: false,
                message: 'Error validating coupon. Please try again.',
                discount: 0,
                domain_discount: 0
            });
            showAlert('Error validating coupon. Please try again.', 'error');
        }
    };

    const displayFinalPrices = useMemo(() => {
        const baseDomainPrice = availabilityStatus.promoPrice && availabilityStatus.promoPrice > 0 ? 
            (Number(availabilityStatus.promoPrice) || 0) : 
            (Number(availabilityStatus.price) || 0);
        
        let finalDomainPrice = baseDomainPrice;

        if (couponStatus.valid && couponStatus.domain_discount !== undefined) {
            finalDomainPrice = Number(couponStatus.domain_discount);
        }
        
        if (finalDomainPrice > 0 && finalDomainPrice < 1) {
            finalDomainPrice = 1;
        }
        
        return {
            domainPrice: Number(finalDomainPrice),
            totalPrice: Number(finalDomainPrice)
        };
    }, [availabilityStatus, couponStatus, priceCalculationKey]);

    const handlePurchase = () => {
        const currentInput = `${brandInput.trim()}-${selectedDomain}-${activeOption}`;
        
        if (!brandInput.trim() || !selectedDomain || availabilityStatus.available === false || lastCheckedInput !== currentInput) {
            setErrorMessage('Please check availability first');
            showAlert('Please check availability first', 'error');
            return;
        }

        if (!termsAgreed) {
            setErrorMessage('Please agree to the terms and conditions');
            showAlert('Please agree to the terms and conditions', 'error');
            return;
        }

        const slugToUse = domainPage?.slug || '';
        const titleToUse = domainPage?.title || '';
        
        if (!slugToUse) {
            setErrorMessage('No page selected for domain purchase');
            showAlert('No page selected for domain purchase', 'error');
            return;
        }

        setCurrentConversationSlug(slugToUse);
        setCurrentConversationTitle(titleToUse || '');
        setPurchaseFormType(activeOption);
        initiateHandlePayment();
    };

    const initiateHandlePayment = async () => {
        let finalPrice = Number(displayFinalPrices.totalPrice);

        if (finalPrice > 0 && finalPrice < 1) {
            finalPrice = 1;
        }

        const pageSlug = currentConversationSlug;
        const pageTitle = currentConversationTitle;
        
        if (!pageSlug) {
            setErrorMessage('No page selected for domain purchase');
            showAlert('No page selected for domain purchase', 'error');
            return;
        }
		
        if (finalPrice === 0) {
            setErrorMessage('');
            setIsLoading(true);
            try {
                const response = await axios.post('/ezai/free-purchase-after-login', {
                    custom_handle: brandInput.trim(),
                    domain: selectedDomain,
                    type: activeOption,
                    coupon_code: couponCode,
                    slug: pageSlug,
                    slug_id: domainPage?.id,
                    title: pageTitle,
                    view_mode: viewMode,
                    ezFunnelId: currentConversationEzFunnelId,
                }, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    }
                });
                
                if (response.data.success) {
                    const url = `https://${brandInput.trim()}.${selectedDomain}`;
                        
                    setPurchaseSuccess({
                        success: true,
                        message: 'Purchase successful! Your new URL: ',
                        url: url
                    });
                    
                    showAlert(`Purchase successful! Your new URL: ${url}`, 'success');
                    
                    setIsPaymentModalOpen(false);
                    setPurchaseFormType(null);
                    setErrorMessage('');
                    
                    // Refresh the page data to show the new domain
                    if (domainPage) {
                        await refreshPageData(domainPage.id);
                    }
                    
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
                            domain_discount: 0
                        });
                        setTermsAgreed(false);
                    }, 60000);
                } else {
                    const errorMsg = response.data.error || response.data.message || 'Free purchase failed';
                    setErrorMessage(errorMsg);
                    showAlert(errorMsg, 'error');
                }
            } catch (error: any) {
                console.error('Free purchase error:', error);
                
                let errorMessageText = 'Failed to process free purchase';
                
                if (axios.isAxiosError(error)) {
                    if (error.response) {
                        errorMessageText = error.response.data?.error || 
                                          error.response.data?.message || 
                                          `Error ${error.response.status}: ${error.response.statusText}`;
                    } else if (error.request) {
                        errorMessageText = 'No response from server. Please check your connection.';
                    } else {
                        errorMessageText = error.message || 'Failed to process free purchase';
                    }
                } else if (error instanceof Error) {
                    errorMessageText = error.message;
                }
                
                setErrorMessage(errorMessageText);
                showAlert(errorMessageText, 'error');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (finalPrice < 1 && finalPrice !== 0) {
            setErrorMessage('Minimum payment amount is $1');
            showAlert('Minimum payment amount is $1', 'error');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);
        
        try {
            const endpoint = '/ezai/initiate-domain-homepayment-after-login';
            
            const response = await axios.post(endpoint, {
                price: Number(displayFinalPrices.domainPrice),
                custom_handle: brandInput.trim(),
                domain: selectedDomain,
                promo_price: Number(finalPrice),
                coupon_code: couponCode,
                selling_price: 0,
                payment_method: 'usd',
                view_mode: viewMode,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });
            
            setClientSecret(response.data.clientSecret);
            setPaymentIntentId(response.data.payment_intent_id);
            setPurchaseFormType(activeOption);
            setPaymentStep(2);
            setIsPaymentModalOpen(true);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMsg = error.response?.data?.error || 'Failed to initialize payment';
                setErrorMessage(errorMsg);
                showAlert(errorMsg, 'error');
            } else {
                const errorMsg = 'Failed to connect to payment service';
                setErrorMessage(errorMsg);
                showAlert(errorMsg, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await axios.post('/ezai/home-domain-handle-success-after-login', {
                payment_intent_id: paymentIntentId,
                slug: currentConversationSlug,
                title: currentConversationTitle,
                view_mode: viewMode,
                slug_id: domainPage?.id,
                ezFunnelId: currentConversationEzFunnelId,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });
            if (response.data.success) {
                const url = `https://${brandInput.trim()}.${selectedDomain}`;
                    
                setPurchaseSuccess({
                    success: true,
                    message: 'Purchase successful! Your new URL: ',
                    url: url
                });
                
                showAlert(`Payment successful! Your new URL: ${url}`, 'success');
                
                setIsPaymentModalOpen(false);
                setPurchaseFormType(null);
                
                setPaymentStep(1);
                setClientSecret('');
                setPaymentIntentId('');
                setErrorMessage('');
                
                // Refresh the page data to show the new domain
                if (domainPage) {
                    await refreshPageData(domainPage.id);
                }
                
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
                        domain_discount: 0
                    });
                    setTermsAgreed(false);
                }, 60000);
            } else {
                const errorMsg = response.data.error || 'Payment verification failed';
                setErrorMessage(errorMsg);
                showAlert(errorMsg, 'error');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Payment verification failed';
            setErrorMessage(errorMsg);
            showAlert(errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePage = useCallback(async (pageDetail: PageDetail, title: string, slug: string, htmlContent?: string) => {
        setIsUpdating(true);
        
        const cachedDomainData = domainDataCache.current.get(pageDetail.id);
        
        setPages(prev =>
            prev.map(p =>
                p.id === pageDetail.id
                    ? { 
                        ...p, 
                        title: title, 
                        slug: slug,
                        ezFunnelToken: cachedDomainData?.ezFunnelToken ?? p.ezFunnelToken,
                        customDomains: cachedDomainData?.customDomains ?? p.customDomains ?? [],
                        handleDomains: cachedDomainData?.handleDomains ?? p.handleDomains ?? [],
                    }
                    : p
            )
        );
        
        if (selectedPageDetail) {
            setSelectedPageDetail({
                ...selectedPageDetail,
                title: title,
                slug: slug,
                ezFunnelToken: cachedDomainData?.ezFunnelToken ?? selectedPageDetail.ezFunnelToken,
                customDomains: cachedDomainData?.customDomains ?? selectedPageDetail.customDomains ?? [],
                handleDomains: cachedDomainData?.handleDomains ?? selectedPageDetail.handleDomains ?? [],
            });
        }
        
        try {
            const response = await axios.put(`/pages-list/${pageDetail.id}`, { 
                title, 
                slug,
            });
            
            if (response.data.success) {
                await refreshPageData(pageDetail.id);
                showAlert('Page updated successfully!', 'success');
                return Promise.resolve();
            } else {
                await refreshPageData(pageDetail.id);
                throw new Error(response.data.message || 'Failed to update page');
            }
        } catch (error: any) {
            await refreshPageData(pageDetail.id);
            const message = error.response?.data?.message || error.message || 'Failed to update page';
            showAlert(message, 'error');
            return Promise.reject(new Error(message));
        } finally {
            setIsUpdating(false);
        }
    }, [refreshPageData, showAlert, selectedPageDetail]);

    const handleUpdateContent = useCallback(async (pageId: number, htmlContent: string): Promise<boolean> => {
        try {
            const response = await axios.put(`/pages-list/${pageId}/content`, { 
                html_content: htmlContent 
            });
            
            if (response.data.success) {
                await refreshPageData(pageId);
                return true;
            } else {
                throw new Error(response.data.message || 'Failed to update content');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to update content';
            showAlert(message, 'error');
            return false;
        }
    }, [refreshPageData, showAlert]);

    const handleDeletePage = async () => {
        if (!selectedPage) return;
        
        setIsDeleting(true);
        try {
            const response = await axios.delete(`/pages-list/${selectedPage.id}`);
            
            if (response.data.success) {
                domainDataCache.current.delete(selectedPage.id);
                setPages(prev => prev.filter(p => p.id !== selectedPage.id));
                setDeleteModalOpen(false);
                setSelectedPage(null);
                if (editPanelOpen) {
                    setEditPanelOpen(false);
                    setSelectedPageDetail(null);
                }
                showAlert('Page deleted successfully!', 'success');
            } else {
                throw new Error(response.data.message || 'Failed to delete page');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to delete page';
            showAlert(message, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const checkSlugAvailability = useCallback(async (slug: string, pageId?: number): Promise<boolean> => {
        try {
            const response = await axios.get('/pages-list/check-slug', {
                params: { slug, page_id: pageId },
            });
            return response.data.available;
        } catch (error) {
            console.error('Failed to check slug:', error);
            return false;
        }
    }, []);

    const handleNewPage = () => {
        router.get('/pagegen/generate-page');
    };

    const totalStats = useMemo(() => {
        const totalSecrets = pages.filter(p => p.hasSecrets).length;
        return { totalSecrets };
    }, [pages]);

    return (
        <>
            <Head title="Page Management" />

            <Tooltip id="main-tooltip" place="top" className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[100] !shadow-xl" effect="solid" />

            <DraggableMenu auth={auth} />

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-in-from-bottom-2 {
                    from { transform: translateY(0.5rem); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slide-left {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-in {
                    animation-duration: 0.3s;
                    animation-fill-mode: both;
                }
                .fade-in {
                    animation-name: fade-in;
                }
                .slide-in-from-bottom-2 {
                    animation-name: slide-in-from-bottom-2;
                }
                .animate-slide-left {
                    animation: slide-left 0.3s ease-out;
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                .page-card {
                    transition: all 0.2s ease;
                }
                .page-card:hover {
                    border-color: #86efac;
                    box-shadow: 0 8px 20px -6px rgba(34, 197, 94, 0.15);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>

            <div className="flex min-h-screen bg-[#F9FAFB] text-gray-800 antialiased">
                <main className="flex-1 flex flex-col p-8 overflow-hidden bg-[#F9FAFB]">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Page Management</h1>
                            <div className="flex gap-4 mt-2 items-center">
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    {totalPages} page{totalPages !== 1 ? 's' : ''}
                                </span>
                                <span className="text-gray-400 text-xs">• {totalStats.totalSecrets} with secrets</span>
                            </div>
                        </div>
                        <button
                            onClick={handleNewPage}
                            className="bg-[#22C55E] hover:bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm transition shadow-sm shadow-green-200"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create New Page
                        </button>
                    </div>

                    {/* Two Column Layout */}
                    <div className="flex flex-1 gap-7 overflow-hidden">
                        {/* Left Column - Page List */}
                        <div className="w-[40%] flex flex-col">
                            {/* Stats Row - Like AIHistory */}
                            <div className="flex justify-between items-center mb-4 px-1">
                                <p className="text-xs text-gray-500 font-medium">
                                    Showing {filteredPages.length} of {totalPages} pages
                                </p>
                                <select
                                    value={currentSort}
                                    onChange={(e) => setCurrentSort(e.target.value as SortOption)}
                                    className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 bg-white text-xs font-semibold cursor-pointer shadow-sm hover:bg-gray-50 outline-none"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search Bar */}
                            <div className="mb-6">
                                <div className="relative w-full">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="m21 21-4.3-4.3" />
                                        </svg>
                                    </span>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search pages by title or slug..."
                                        className="w-full pl-11 pr-5 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500/30 focus:border-green-400 outline-none bg-white shadow-sm transition"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Pages List - Modern card design like AIHistory */}
                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-280px)]">
                                {filteredPages.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
                                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {searchQuery ? 'No pages found' : 'No pages yet'}
                                        </h3>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                            {searchQuery
                                                ? `No pages match "${searchQuery}". Try different keywords.`
                                                : 'Create your first HTML page by uploading content.'}
                                        </p>
                                        <button
                                            onClick={handleNewPage}
                                            className="inline-flex items-center px-6 py-3 bg-[#22C55E] hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-green-200"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2">
                                                <path d="M12 5v14M5 12h14" />
                                            </svg>
                                            Create Your First Page
                                        </button>
                                    </div>
                                ) : (
                                    filteredPages.map((pageItem) => (
                                        <div
                                            key={pageItem.id}
                                            className={`page-card bg-white border-2 rounded-2xl p-4 shadow-sm relative transition cursor-pointer ${
                                                selectedPage?.id === pageItem.id 
                                                    ? 'border-green-500 bg-green-50/30' 
                                                    : 'border-gray-200 hover:border-green-400'
                                            }`}
                                            onClick={() => handleEditClick(pageItem)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-800 text-base truncate">
                                                            {pageItem.title}
                                                        </h3>
                                                        <div className="flex gap-2.5 text-gray-300 ml-3 flex-shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePreviewClick(pageItem);
                                                                }}
                                                                className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-gray-500 hover:text-blue-600"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content="Preview page"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditClick(pageItem);
                                                                }}
                                                                className="p-2 hover:bg-green-50 rounded-xl transition-colors text-gray-500 hover:text-green-600"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content="Edit page"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleBuyDomainClick(pageItem);
                                                                }}
                                                                className="relative group overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-purple-500/30 flex items-center gap-1.5 border border-purple-400/20"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content="✨ Get a custom domain for this page"
                                                            >
                                                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                                                <svg 
                                                                    width="16" 
                                                                    height="16" 
                                                                    viewBox="0 0 24 24" 
                                                                    fill="none" 
                                                                    stroke="currentColor" 
                                                                    strokeWidth="2.2"
                                                                    className="relative z-10 group-hover:rotate-12 transition-transform duration-300"
                                                                >
                                                                    <circle cx="12" cy="12" r="10" />
                                                                    <line x1="2" y1="12" x2="22" y2="12" />
                                                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                                                </svg>
                                                                <span className="relative z-10">Buy domain</span>
                                                                <span className="relative z-10 flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                                                                </span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(pageItem);
                                                                }}
                                                                className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-500 hover:text-red-600"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content="Delete page"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-[11px] text-gray-400 mb-2">
                                                        {pageItem.created_at_formatted} • {auth?.user?.email || 'Anonymous'}
                                                    </p>
                                                    
                                                    {/* URL Row - Clean design like AIHistory */}
                                                    <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                                        <a 
                                                            href={`/page/${pageItem.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-mono text-gray-600 hover:text-green-600 truncate flex items-center gap-1 transition-colors group"
                                                            title={`Click to open /page/${pageItem.slug} in new tab`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span className="text-gray-400 group-hover:text-green-500 transition-colors">🔗</span>
                                                            <span className="flex-1 truncate">/page/{pageItem.slug}</span>
                                                            <svg 
                                                                width="14" 
                                                                height="14" 
                                                                viewBox="0 0 24 24" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                strokeWidth="2"
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-green-500"
                                                            >
                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <line x1="10" y1="14" x2="21" y2="3" />
                                                            </svg>
                                                        </a>
                                                    </div>
                                                    
                                                    {/* EzFunnel Token Row - Like AIHistory */}
                                                    {pageItem.ezFunnelToken && (
                                                        <div className="mt-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg px-3 py-2 border border-purple-200">
                                                            <a 
                                                                href={`https://ez.wiki/${pageItem.ezFunnelToken}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs font-mono text-purple-700 hover:text-purple-600 truncate flex items-center gap-1 transition-colors group"
                                                                title={`Click to open https://ez.wiki/${pageItem.ezFunnelToken} in new tab`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="text-purple-500 group-hover:text-purple-600 transition-colors">✨</span>
                                                                <span className="flex-1 truncate font-semibold">https://ez.wiki/{pageItem.ezFunnelToken}</span>
                                                                <svg 
                                                                    width="14" 
                                                                    height="14" 
                                                                    viewBox="0 0 24 24" 
                                                                    fill="none" 
                                                                    stroke="currentColor" 
                                                                    strokeWidth="2"
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-500"
                                                                >
                                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                    <polyline points="15 3 21 3 21 9" />
                                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Custom Domain Row */}
                                                    {pageItem.customDomains && pageItem.customDomains.length > 0 && (
                                                        <div className="mt-2 space-y-2">
                                                            {pageItem.customDomains.map((customDomain: any) => (
                                                                <div key={customDomain.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-3 py-2 border border-blue-200">
                                                                    <a 
                                                                        href={`https://${customDomain.domainselected}/${customDomain.domain}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs font-mono text-blue-700 hover:text-blue-600 truncate flex items-center gap-1 transition-colors group"
                                                                        title={`Click to open https://${customDomain.domainselected}/${customDomain.domain} in new tab`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <span className="text-blue-500 group-hover:text-blue-600 transition-colors">🌐</span>
                                                                        <span className="flex-1 truncate font-semibold">https://{customDomain.domainselected}/{customDomain.domain}</span>
                                                                        <svg 
                                                                            width="14" 
                                                                            height="14" 
                                                                            viewBox="0 0 24 24" 
                                                                            fill="none" 
                                                                            stroke="currentColor" 
                                                                            strokeWidth="2"
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500"
                                                                        >
                                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                            <polyline points="15 3 21 3 21 9" />
                                                                            <line x1="10" y1="14" x2="21" y2="3" />
                                                                        </svg>
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Handle Domains Row */}
                                                    {pageItem.handleDomains && pageItem.handleDomains.length > 0 && (
                                                        <div className="mt-2 space-y-2">
                                                            {pageItem.handleDomains.map((handleDomain: any) => (
                                                                <div key={handleDomain.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg px-3 py-2 border border-purple-200">
                                                                    <a 
                                                                        href={`https://${handleDomain.domain}.${handleDomain.domainselected}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs font-mono text-purple-700 hover:text-purple-600 truncate flex items-center gap-1 transition-colors group"
                                                                        title={`Click to open https://${handleDomain.domain}.${handleDomain.domainselected} in new tab`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <span className="text-purple-500 group-hover:text-purple-600 transition-colors">🔗</span>
                                                                        <span className="flex-1 truncate font-semibold">https://{handleDomain.domain}.{handleDomain.domainselected}</span>
                                                                        <svg 
                                                                            width="14" 
                                                                            height="14" 
                                                                            viewBox="0 0 24 24" 
                                                                            fill="none" 
                                                                            stroke="currentColor" 
                                                                            strokeWidth="2"
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-500"
                                                                        >
                                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                            <polyline points="15 3 21 3 21 9" />
                                                                            <line x1="10" y1="14" x2="21" y2="3" />
                                                                        </svg>
                                                                    </a>
                                                                    {handleDomain.hashtag && (
                                                                        <div className="mt-1 text-[10px] text-purple-400 flex items-center gap-1">
                                                                            <span>#</span>
                                                                            <span>{handleDomain.hashtag}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Load More Trigger */}
                            <div ref={loaderRef} className="py-12 text-center">
                                {loading && (
                                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                                        <LoadingSpinner size={22} />
                                        <span className="text-sm font-medium text-gray-700">Loading more pages...</span>
                                    </div>
                                )}
                                {!hasMore && pages.length > 0 && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                        <div className="w-12 h-px bg-gradient-to-r from-transparent to-gray-300" />
                                        <span>You've reached the end</span>
                                        <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-300" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Edit Panel */}
                        <div className="w-[60%]">
                            {editPanelOpen && selectedPageDetail ? (
                                <EditPanel
                                    key={selectedPageDetail.updated_at}
                                    page={selectedPageDetail}
                                    isOpen={editPanelOpen}
                                    onClose={handleCloseEditPanel}
                                    onUpdate={handleUpdatePage}
                                    onUpdateContent={handleUpdateContent}
                                    onCheckSlug={checkSlugAvailability}
                                    isUpdating={isUpdating}
                                    onShowAlert={showAlert}
                                />
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-3xl shadow-xl flex flex-col h-full">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Edit Page
                                        </h2>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl flex items-center justify-center">
                                            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                                No Page Selected
                                            </h3>
                                            <p className="text-gray-500 max-w-sm">
                                                Select a page from the list to edit its title, slug, and HTML content.
                                            </p>
                                        </div>

                                        <div className="w-full max-w-sm space-y-4 mt-4">
                                            <div className="flex items-start gap-3 text-left">
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 text-sm">Edit Title & Slug</h4>
                                                    <p className="text-xs text-gray-500">Customize the page URL and display name</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 text-left">
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 text-sm">Edit HTML Content</h4>
                                                    <p className="text-xs text-gray-500">Upload or paste HTML code</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 text-left">
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 text-sm">Auto-save</h4>
                                                    <p className="text-xs text-gray-500">Changes are saved automatically</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="M12 16v-4M12 8h.01" />
                                                </svg>
                                                <span>Click on any page card to start editing</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 border-t border-gray-200">
                                        <p className="text-[10px] text-gray-400 text-center">
                                            Changes are saved automatically when you update
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Preview Modal */}
            <PreviewModal
                page={selectedPage}
                isOpen={previewModalOpen}
                onClose={() => {
                    setPreviewModalOpen(false);
                    setSelectedPage(null);
                }}
            />

            {/* Delete Modal */}
            <DeleteModal
                page={selectedPage}
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedPage(null);
                }}
                onConfirm={handleDeletePage}
                isDeleting={isDeleting}
            />

            {/* Express Domain Modal */}
            {isExpressDomainOpen && domainPage && (
                <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full relative max-h-[90vh] overflow-y-auto border border-gray-200">
                        <button
                            onClick={handleCloseExpressDomain}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Close express domain modal"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                        </button>

                        <div className="p-8">
                            <div className="text-center mb-10">
                                <div 
                                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-4"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Express Domain Service"
                                >
                                    <FontAwesomeIcon icon={faStore} className="text-2xl text-green-600" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-3">Get Your Express Domain</h3>
                                <p className="text-gray-600 text-lg">Choose your preferred option to establish your Web3 presence</p>
                            </div>

                            {purchaseSuccess.success && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl relative">
                                    <button
                                        onClick={() => setPurchaseSuccess({ success: false, message: '', url: '' })}
                                        className="absolute top-4 right-4 text-green-600 hover:text-green-800 transition-colors"
                                        aria-label="Close alert"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Close success notification"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12"/>
                                        </svg>
                                    </button>
                                    <div className="flex items-center justify-center gap-3 text-green-600 mb-2">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
                                        <span className="text-lg font-semibold">Purchase Successful!</span>
                                    </div>
                                    <div className="text-center text-gray-700 mb-3">
                                        {purchaseSuccess.message}
                                        <a 
                                            href={purchaseSuccess.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 hover:underline font-medium ml-1"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Visit your new domain"
                                        >
                                            {purchaseSuccess.url}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl relative">
                                    <button
                                        onClick={() => setErrorMessage('')}
                                        className="absolute top-4 right-4 text-red-600 hover:text-red-800 transition-colors"
                                        aria-label="Close error"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12"/>
                                        </svg>
                                    </button>
                                    <div className="flex items-center justify-center gap-3 text-red-600 mb-2">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl" />
                                        <span className="text-lg font-semibold">Error</span>
                                    </div>
                                    <div className="text-center text-gray-700">
                                        {errorMessage}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center items-center gap-4 mb-10">
                                <button 
                                    onClick={() => setActiveOption('domain')}
                                    className={`flex items-center justify-center py-3 px-8 rounded-xl shadow-sm font-semibold transition-all ${
                                        activeOption === 'domain' 
                                            ? 'bg-green-500 text-white shadow-md shadow-green-200' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Get a full domain name (yourbrand.domain)"
                                >
                                    <FontAwesomeIcon icon={faGlobe} className="mr-2" /> 
                                    Brand Domain
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-3xl mx-auto mb-8">
                                <div className="relative w-full md:w-2/5">
                                    <input 
                                        type="text" 
                                        placeholder="Enter your brand name"
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                                        value={brandInput}
                                        onChange={(e) => setBrandInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                checkDomainAvailability();
                                            }
                                        }}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Enter your desired brand name or handle"
                                    />
                                </div>
                                
                                <div className="relative w-full md:w-2/5">
                                    <select 
                                        className="w-full bg-gray-50 text-gray-900 py-4 px-6 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value)}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Select a domain extension"
                                    >
                                        {domains?.map((domain: Domain) => (
                                            <option key={domain.id} value={domain.domain}>
                                                .{domain.domain}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={checkDomainAvailability}
                                    className={`w-full md:w-1/5 font-bold py-4 px-6 rounded-xl shadow-sm flex items-center justify-center transition-all ${
                                        availabilityStatus.checking 
                                            ? 'bg-gray-100 text-gray-500' 
                                            : availabilityStatus.available !== null 
                                                ? (availabilityStatus.available 
                                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200' 
                                                    : 'bg-red-500 text-white hover:bg-red-600')
                                                : 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200'
                                    }`}
                                    disabled={isSubmitting || !brandInput || availabilityStatus.checking}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={
                                        !brandInput ? "Enter a brand name first" :
                                        availabilityStatus.checking ? "Checking availability..." :
                                        availabilityStatus.available ? "Domain is available!" :
                                        "Check if your domain is available"
                                    }
                                >
                                    <span>
                                        {availabilityStatus.checking 
                                            ? 'Checking...'
                                            : availabilityStatus.available !== null 
                                                ? (availabilityStatus.available 
                                                    ? 'Available ✓'
                                                    : 'Unavailable ✗')
                                                : 'Check Availability'
                                        }
                                    </span>
                                </button>
                            </div>

                            {!purchaseSuccess.success && availabilityStatus.message && (
                                <div className={`text-center mb-4 transition-all duration-300 ${availabilityStatus.checking ? 'opacity-70' : 'opacity-100'}`}>
                                    <div className={`flex items-center justify-center gap-2 text-sm font-medium mb-4 ${
                                        availabilityStatus.available ? 'text-green-600' : 
                                        availabilityStatus.available === false ? 'text-red-500' : 
                                        'text-yellow-600'
                                    }`}>
                                        {availabilityStatus.checking ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                {availabilityStatus.message || "Checking availability..."}
                                            </>
                                        ) : (
                                            <>
                                                {availabilityStatus.available ? (
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                                                )}
                                                {availabilityStatus.message}
                                            </>
                                        )}
                                    </div>

                                    {availabilityStatus.available && availabilityStatus.price !== undefined && (
                                        <div className="mt-8 max-w-2xl mx-auto">
                                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 mb-6">
                                                <div className="flex items-center justify-between flex-wrap gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Your domain will be:</p>
                                                        <p 
                                                            className="text-2xl font-bold text-gray-900"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content="Your new domain"
                                                        >
                                                            {brandInput.trim()}.{selectedDomain}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span 
                                                            className="text-sm text-gray-500"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={`${availabilityStatus.charCount || 0} characters in your brand name`}
                                                        >
                                                            {availabilityStatus.charCount} characters
                                                        </span>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">Price</p>
                                                            <p 
                                                                className="text-2xl font-bold text-green-600"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content="Final price after any discounts"
                                                            >
                                                                US${Number(displayFinalPrices.domainPrice).toFixed(2)}
                                                                {couponStatus.valid && (
                                                                    <span className="text-green-400 text-sm ml-2">🎉</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {couponStatus.valid && (
                                                <div className="flex flex-col sm:flex-row gap-3 mt-4 items-stretch mb-4">
                                                    <div className="flex-1 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl text-center flex flex-col justify-center shadow-sm">
                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-emerald-700 text-sm font-semibold">
                                                                {(() => {
                                                                    const originalPrice = availabilityStatus.promoPrice && availabilityStatus.promoPrice > 0 ? 
                                                                        (Number(availabilityStatus.promoPrice) || 0) : 
                                                                        (Number(availabilityStatus.price) || 0);
                                                                    const discount = couponStatus.discount || 0;
                                                                    const savings = originalPrice - discount;
                                                                    
                                                                    if (savings > 0) {
                                                                        return `You save US${savings.toFixed(2)}!`;
                                                                    } else if (discount > 0) {
                                                                        return "Discount applied!";
                                                                    }
                                                                    
                                                                    return "Coupon applied!";
                                                                })()}
                                                            </p>
                                                        </div>
                                                        {(() => {
                                                            const originalPrice = availabilityStatus.promoPrice && availabilityStatus.promoPrice > 0 ? 
                                                                (Number(availabilityStatus.promoPrice) || 0) : 
                                                                (Number(availabilityStatus.price) || 0);
                                                            const discount = couponStatus.discount || 0;
                                                            const savings = originalPrice - discount;
                                                            if (savings > 0) {
                                                                return (
                                                                    <p className="text-xs text-gray-500 line-through">
                                                                        Original: US${originalPrice.toFixed(2)}
                                                                    </p>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                    
                                                    <div className="flex-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl text-center flex flex-col justify-center shadow-sm">
                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-amber-700 font-semibold text-base">
                                                                Final Price
                                                            </p>
                                                        </div>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            US${Number(displayFinalPrices.domainPrice).toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Including all fees
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {!couponStatus.valid && Number(availabilityStatus.promoPrice) > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                                                    <p 
                                                        className="text-blue-700 font-semibold flex items-center justify-center gap-2"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content="Pre-launch promotional price"
                                                    >
                                                        <span className="text-xl">✨</span>
                                                        Pre-launch Price: US${Number(availabilityStatus.promoPrice).toFixed(2)}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Have a coupon code?
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Enter coupon code"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content="Enter a coupon code for discounts"
                                                    />
                                                </div>
                                                {couponCode && (
                                                    <div className={`mt-2 text-sm ${
                                                        couponStatus.valid ? 'text-green-600' : 
                                                        couponStatus.valid === false ? 'text-red-500' : 'text-yellow-600'
                                                    }`}>
                                                        {couponStatus.message || 'Validating coupon...'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    View Mode
                                                </label>
                                                <select
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                                                    value={viewMode}
                                                    onChange={(e) => setViewMode(e.target.value as ViewMode)}
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content="Choose how you want to view this content"
                                                >
                                                    <option value="page">Page View</option>
                                                    <option value="ai">AI View</option>
                                                    <option value="naked">HYBRID View</option>
                                                    <option value="dressed">EZ View</option>
                                                </select>
                                            </div>

                                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700 font-medium">Total Amount:</span>
                                                    <span 
                                                        className="text-2xl font-bold text-green-600"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content="Final amount to pay"
                                                    >
                                                        US${Number(displayFinalPrices.totalPrice).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="flex items-start">
                                                    <input
                                                        type="checkbox"
                                                        id="terms-checkbox"
                                                        required
                                                        className="mt-1 mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                        checked={termsAgreed}
                                                        onChange={(e) => setTermsAgreed(e.target.checked)}
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content="You must agree to the terms to continue"
                                                    />
                                                    <label htmlFor="terms-checkbox" className="text-sm text-gray-600">
                                                        By claiming your domain you agree to the{' '}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => window.open('/terms-and-conditions', '_blank')}
                                                            className="text-green-600 hover:text-green-700 hover:underline focus:outline-none"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content="View terms and conditions"
                                                        >
                                                            Terms and Conditions
                                                        </button>{' '}
                                                        and{' '}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => window.open('/privacy-policy', '_blank')}
                                                            className="text-green-600 hover:text-green-700 hover:underline focus:outline-none"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content="View privacy policy"
                                                        >
                                                            Privacy Policy
                                                        </button>
                                                    </label>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handlePurchase}
                                                disabled={isSubmitting || !termsAgreed || isLoading}
                                                className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                                                    isSubmitting || !termsAgreed || isLoading
                                                        ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                                        : Number(displayFinalPrices.totalPrice) === 0
                                                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'
                                                            : 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'
                                                }`}
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={
                                                    !termsAgreed ? "Please agree to terms first" :
                                                    isSubmitting ? "Processing your purchase..." :
                                                    isLoading ? "Please wait..." :
                                                    Number(displayFinalPrices.totalPrice) === 0 ? "Claim your free domain" : "Proceed to payment"
                                                }
                                            >
                                                {(isSubmitting || isLoading) ? (
                                                    <>
                                                        <LoadingSpinner size={20} />
                                                        <span>Processing...</span>
                                                    </>
                                                ) : Number(displayFinalPrices.totalPrice) === 0 ? (
                                                    'Claim Free Domain'
                                                ) : (
                                                    `Purchase Domain for US${Number(displayFinalPrices.totalPrice).toFixed(2)}`
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal - Step 2 */}
            {isPaymentModalOpen && paymentStep === 2 && (
                <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto border border-gray-200">
                        <button
                            onClick={() => {
                                setIsPaymentModalOpen(false);
                                setPaymentStep(1);
                                setErrorMessage('');
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                            disabled={isLoading}
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                        </button>

                        <div className="p-6">
                            {errorMessage && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    <span data-tooltip-id="main-tooltip" data-tooltip-content="Error notification">
                                        {errorMessage}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-4">
                                    <img
                                        src="https://ez.wiki/logo.gif"
                                        className="w-8 h-8 rounded-full object-cover"
                                        alt="ez.wiki Logo"
                                    />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Domain Purchase
                                </h2>
                                <p className="text-green-600 font-medium mt-1">
                                    {`${brandInput.trim()}.${selectedDomain}`}
                                </p>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Domain Price:</span>
                                    <span className="text-gray-900 font-semibold">US${Number(displayFinalPrices.domainPrice).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span className="text-gray-900 font-bold">Total:</span>
                                    <span className="text-green-600 font-bold text-xl">
                                        US${Number(displayFinalPrices.totalPrice).toFixed(2)}
                                    </span>
                                </div>
                                {couponStatus.valid && (
                                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                                        <span className="text-green-600 text-sm">Coupon applied: {couponStatus.message}</span>
                                    </div>
                                )}
                            </div>

                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret: clientSecret,
                                    appearance: {
                                        theme: 'stripe',
                                        variables: {
                                            colorPrimary: '#22c55e',
                                            colorBackground: '#ffffff',
                                            colorText: '#1f2937',
                                            colorDanger: '#ef4444',
                                            fontFamily: 'Inter, system-ui, sans-serif',
                                            borderRadius: '12px'
                                        }
                                    }
                                }}
                            >
                                {clientSecret ? (
                                    <StripeCheckoutForm
                                        price={Number(displayFinalPrices.totalPrice)}
                                        clientSecret={clientSecret}
                                        onSuccess={handlePaymentSuccess}
                                        onBack={() => setPaymentStep(1)}
                                        onError={(msg) => setErrorMessage(msg)}
                                        email={auth?.user?.email}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center py-8">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-green-500" />
                                    </div>
                                )}
                            </Elements>

                            <div className="text-center text-xs text-gray-500 mt-4">
                                <p>Payment secured by STRIPE.</p>
                                <p className="mt-1">
                                    <a href="/terms" className="text-green-600 hover:underline">Terms</a> and{' '}
                                    <a href="/privacy" className="text-green-600 hover:underline">Privacy</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Toast */}
            {customAlert.show && (
                <CustomAlert
                    message={customAlert.message}
                    type={customAlert.type}
                    onClose={() => setCustomAlert({ show: false, message: '', type: 'info' })}
                />
            )}
        </>
    );
}