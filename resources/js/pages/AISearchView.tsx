import React from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef, FormEvent, KeyboardEvent, useMemo, useCallback } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGlobe,
    faSpinner,
    faCheckCircle,
    faExclamationTriangle,
    faTimes,
    faFingerprint,
    faHandshake,
    faBullhorn,
    faStore,
    faCopy,
    faLock,
    faEyeSlash,
    faUserLock,
    faFilePdf,
    faFileImage,
    faFileWord,
    faFileAlt,
    faComment,
    faUpload,
    faRobot,
    faUser,
    faDownload,
    faImage,
    faFilePdf as faFilePdfSolid,
    faFileWord as faFileWordSolid,
    faFileArchive,
    faFileCode,
    faFileExcel,
    faFilePowerpoint,
    faFileVideo,
    faFileAudio,
    faFile,
    faMusic,
    faChevronUp,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faBars,
    faEnvelope,
    faKey,
    faGift,
    faStar,
    faExternalLink,
    faHtml5,
    faArrowRight,
    faShareNodes,
    faCode,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import InlineEmbedBuilder from '@/components/InlineEmbedBuilder';
import EmbedRowModal from '@/components/EmbedRowModal'; // <-- NEW IMPORT
import DraggableMenu from '@/components/DraggableMenu';
import SocialMediaComposer from '@/components/SocialMediaComposer';
import MessageReactionsBar from '@/components/MessageReactionsBar';
import { SocialShareModal } from '@/components/SocialShareModal';
import { HtmlDocPreview } from '@/components/HtmlDocPreview';
import { detectAndProcessHtml } from '@/utils/htmlHelper';
import Masonry from 'react-masonry-css';

const commentMasonryBreakpoints = {
    default: 3,
    1024: 2,
    640: 1
};

import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

// Model interface
interface ModelOption {
    id: string;
    name: string;
    description: string;
    isNew?: boolean;
    type: 'flagship';
}

// Comprehensive model options - Updated with new Kimi models
const modelOptions: ModelOption[] = [
    {
        id: 'kimi-k3',
        name: 'Kimi K3',
        description: '2.8T params, native vision, 1M context, frontier intelligence',
        isNew: true,
        type: 'flagship'
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'OpenAI\'s most advanced multimodal model',
        isNew: true,
        type: 'flagship'
    },
    {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'Advanced conversational AI with 128K context',
        isNew: true,
        type: 'flagship'
    },
    {
        id: 'sonar-pro',
        name: 'Sonar Pro',
        description: 'Enhanced search capabilities with better accuracy',
        isNew: true,
        type: 'flagship'
    },
    {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash Preview',
        description: 'Latest preview version of Gemini 3 Flash with enhanced capabilities',
        isNew: true,
        type: 'flagship'
    },
];

interface FileData {
    original_name: string;
    size: number;
    mime_type: string;
    extension: string;
    path: string;
    url: string;
    access_token: string;
    uploaded_at: string;
    storage_disk: string;
    width?: number;
    height?: number;
}

interface ConversationMessage {
    id: number;
    slug: string;
    message_role: 'user' | 'assistant' | 'system';
    content_type: 'ai' | 'comment' | 'conversationcomment' | 'upload' | 'social' | 'social_media' | 'landing_page' | 'embed';
    query: string;
    response: string | null;
    file_data: FileData | null;
    file_metadata?: Record<string, any> | null;
    created_at: string;
    formatted_created_at: string;
    thinking_enabled: boolean;
    model: string;
    temperature: number;
    max_tokens: number;
    total_tokens: number;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    finish_reason: string | null;
    sources: string[];
    share_url: string;
    parent_id?: number;
    position?: number | null;
    ip_address?: string;
    status?: 'public' | 'private' | 'hidden';
    user_id?: number;
    session_id?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
    };
    content_warning?: string;
    media_count?: number;
    format?: 'markdown' | 'html';
    social_media_metadata?: Record<string, any>;
    reaction_counts?: Record<string, number>;
    reaction_total?: number;
    hashtag?: string[] | string | null;
    hashtag_display?: string;
}

interface SearchData {
    id: number;
    slug: string;
    conversation_id: string;
    thread_id: string;
    conversation_title: string;
    message_role: string;
    content_type: 'ai' | 'comment' | 'conversationcomment' | 'upload' | 'social' | 'social_media' | 'landing_page' | 'embed';
    query: string;
    response: string;
    sources: string[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    thinking_enabled: boolean;
    model: string;
    temperature: number;
    max_tokens: number;
    finish_reason: string;
    created_at: string;
    created_at_formatted: string;
    updated_at: string;
    share_url: string;
    conversation_url: string;
    total_tokens: number;
    conversation_tokens: number;
    conversation_cost: number;
    status?: 'public' | 'private' | 'hidden';
    hashtag?: string[] | string | null;
    hashtag_display?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
    };
    landing_page_url?: string | null;
}

interface RelatedSearch {
    slug: string;
    query: string;
    conversation_title: string;
    created_at: string;
    share_url: string;
    message_count: number;
    status?: 'public' | 'private' | 'hidden';
    hashtag?: string[] | string | null;
    hashtag_display?: string;
}

interface PinnedConversation {
    id: number;
    slug: string;
    conversation_id: string;
    conversation_title: string;
    query_preview: string;
    message_count: number;
    created_at: string;
    formatted_created_at: string;
    share_url: string;
    status: string;
    hashtag?: string[] | string | null;
    hashtag_display?: string;
}

interface Domain {
    id: number;
    domain: string;
}

interface AiSettings {
    guest_ai_enabled: boolean;
    guest_char_limit: number;
    user_ai_enabled: boolean;
    user_char_limit: number;
}

interface PageProps {
    search: SearchData;
    conversation_messages: ConversationMessage[];
    message_count: number;
    share_url: string;
    related_searches: RelatedSearch[];
    domains?: Domain[];
    checkDomainUrl?: string;
    checkStandardDomainUrl?: string;
    tooltips?: any;
    tokenInfo?: any;
    promoprice?: number;
    aiSettings?: AiSettings;
    auth?: {
        user: {
            id: number;
            name: string;
            email: string;
            avatar: string | null;
        } | null;
    };
    guestInteractionDisabled?: boolean;
    requiresLogin?: boolean;
    needsPrivateAccess?: boolean;
    conversationStatus?: 'public' | 'private' | 'hidden';
    hasPrivateAccess?: boolean;
    codepage?: string;
    initial_comments?: any[];
}

interface SavedTheme {
    id: number;
    unique_id: string;
    title: number;
    price: number;
    description: string;
    status: string;
}

interface UploadedFile {
    name: string;
    size: number;
    type: string;
    data: string;
    file?: File;
}

// Sort conversation messages by position and created_at in ascending order
const sortConversationMessages = (messages: ConversationMessage[]): ConversationMessage[] => {
    if (!messages || messages.length === 0) return messages;

    return [...messages].sort((a, b) => {
        const aPos = a.position !== undefined && a.position !== null ? a.position : Number.MAX_SAFE_INTEGER;
        const bPos = b.position !== undefined && b.position !== null ? b.position : Number.MAX_SAFE_INTEGER;

        if (aPos !== bPos) {
            return aPos - bPos;
        }

        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return aDate - bDate;
    });
};

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-white" />
                </div>
            );
        }
        return this.props.children;
    }
}

// Allowed file types for upload - 100MB limit
const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
    'application/pdf',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav',
    'text/html',
    'application/xhtml+xml',
];

const ALLOWED_FILE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    '.pdf',
    '.mp4', '.webm', '.ogg', '.mov', '.avi',
    '.mp3', '.wav', '.ogg', '.m4a',
    '.html', '.htm',
];

const getUnsupportedFileTypes = (): string[] => {
    return [
        '.md', '.markdown',
        '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
        '.exe', '.msi', '.dmg',
        '.bat', '.sh', '.cmd',
        '.apk', '.ipa',
        '.iso', '.img',
        '.torrent',
        '.psd', '.ai', '.eps',
        '.csv', '.xls', '.xlsx',
        '.ppt', '.pptx',
        '.json', '.xml', '.yaml', '.yml',
        '.sql', '.db', '.sqlite',
        '.log',
        '.tmp', '.temp',
        '.ini', '.cfg', '.conf', '.config',
        '.key', '.pem', '.crt', '.p12',
        '.ttf', '.otf', '.woff', '.woff2',
        '.eot',
        '.ico',
        '.cur',
        '.webp', '.bmp', '.tiff', '.tif',
        '.avi', '.mov', '.wmv', '.flv', '.mkv',
        '.flac', '.aac', '.wma',
        '.numbers',
        '.pages',
        '.keynote',
        '.cdr',
        '.svg',
    ];
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
                <div className="flex-1 text-sm font-medium break-words">
                    {message}
                </div>
                <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const stripHtmlTags = (html: string): string => {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string, extension: string) => {
    if (mimeType.startsWith('image/')) {
        return faImage;
    } else if (mimeType === 'application/pdf') {
        return faFilePdfSolid;
    } else if (mimeType.includes('word') || extension.match(/doc|docx/)) {
        return faFileWordSolid;
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || extension.match(/xls|xlsx|csv/)) {
        return faFileExcel;
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || extension.match(/ppt|pptx/)) {
        return faFilePowerpoint;
    } else if (mimeType.includes('video/')) {
        return faFileVideo;
    } else if (mimeType.includes('audio/')) {
        return faFileAudio;
    } else if (mimeType.includes('zip') || mimeType.includes('compressed') || extension.match(/zip|rar|7z|tar|gz/)) {
        return faFileArchive;
    } else if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('html') || mimeType.includes('javascript') || extension.match(/js|ts|py|java|cpp|php/)) {
        return faFileCode;
    } else {
        return faFile;
    }
};

const hasMarkdownSyntax = (content: string): boolean => {
    const headerPattern = /^#{1,6}\s+/m;
    const markdownPatterns = [
        headerPattern,
        /\*\*.+\*\*/,
        /_{2}.+_{2}/,
        /\*.+\*/,
        /\[.+\]\(.+\)/,
        /^- /,
        /^\d+\. /,
        /```/,
        /`[^`]+`/,
        />\s/,
        /!\[.*\]\(.*\)/,
        /^\|/,
        /^---$/,
    ];
    return markdownPatterns.some(pattern => pattern.test(content));
};

const markdownStyles: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#1f2937',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: '16px',
    lineHeight: '1.7',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
};

const validateFileType = (file: File): { valid: boolean; error?: string } => {
    if (file.size > 100 * 1024 * 1024) {
        return {
            valid: false,
            error: `❌ File size exceeds 100MB limit. Current size: ${formatFileSize(file.size)}. Maximum allowed: 100MB.`
        };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const fileName = file.name.toLowerCase();
        const ext = '.' + fileName.split('.').pop();

        const unsupportedTypes = getUnsupportedFileTypes();
        if (unsupportedTypes.includes(ext)) {
            return {
                valid: false,
                error: `❌ File type "${ext}" is not supported. Please upload images (JPG, PNG, GIF, WEBP), PDF, video (MP4, WEBM, OGG), audio (MP3, WAV, OGG), or HTML files only. Max size: 100MB.`
            };
        }

        return {
            valid: false,
            error: `❌ File type "${file.type || 'unknown'}" is not supported. Please upload images (JPG, PNG, GIF, WEBP), PDF, video (MP4, WEBM, OGG), audio (MP3, WAV, OGG), or HTML files only. Max size: 100MB.`
        };
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
        const ext = '.' + fileName.split('.').pop();
        const unsupportedTypes = getUnsupportedFileTypes();
        if (unsupportedTypes.includes(ext)) {
            return {
                valid: false,
                error: `❌ File extension "${ext}" is not supported. Please upload images (JPG, PNG, GIF, WEBP), PDF, video (MP4, WEBM, OGG), audio (MP3, WAV, OGG), or HTML files only. Max size: 100MB.`
            };
        }
        return {
            valid: false,
            error: `❌ File extension "${ext}" is not supported. Please upload images (JPG, PNG, GIF, WEBP), PDF, video (MP4, WEBM, OGG), audio (MP3, WAV, OGG), or HTML files only. Max size: 100MB.`
        };
    }

    return { valid: true };
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
    tooltips?: any;
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
                    <span data-tooltip-id="main-tooltip" data-tooltip-content={tooltips?.ai_search_view_error_notification || "Error notification"}>
                        {error}
                    </span>
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
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content={!stripe ? "Payment system loading..." : !isPaymentElementReady ? "Payment form loading..." : isProcessing ? "Processing payment..." : `Complete payment of US${price.toFixed(2)}`}
                >
                    {isProcessing ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            {tooltips?.ai_search_view_processing || "Processing..."}
                        </>
                    ) : `Pay US${price.toFixed(2)}`}
                </button>
            </div>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-yellow-400 hover:underline"
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content={tooltips?.ai_search_view_cancel || "Go back to email entry"}
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

export default function AISearchView({
    search,
    conversation_messages,
    message_count,
    share_url,
    related_searches,
    domains: initialDomains = [],
    checkDomainUrl = '/check-handle-availability',
    checkStandardDomainUrl = '/ezai/check-ezpressstandard-domain',
    tooltips = {},
    tokenInfo,
    promoprice = 0,
    aiSettings,
    auth = { user: null },
    guestInteractionDisabled = false,
    requiresLogin = false,
    needsPrivateAccess = false,
    conversationStatus = 'public',
    hasPrivateAccess = false,
    codepage = '',
    initial_comments = []
}: PageProps) {
    const [dbComments, setDbComments] = useState<any[]>(initial_comments || []);
    const [isLoadingDbComments, setIsLoadingDbComments] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareModalTab, setShareModalTab] = useState<'share' | 'embed'>('share');
    const [newQuestion, setNewQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [currentConversationTitle, setCurrentConversationTitle] = useState(search.conversation_title);
    const [conversationCost, setConversationCost] = useState(search.conversation_cost);
    const [conversationTokens, setConversationTokens] = useState(search.conversation_tokens);
    const [isEzthemeLoading, setIsEzthemeLoading] = useState(false);
    const [successAlert, setSuccessAlert] = useState<React.ReactNode>(null);
    const [savedTheme, setSavedTheme] = useState<SavedTheme | null>(null);

    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(false);

    const [charCountWarning, setCharCountWarning] = useState('');
    const [charCountError, setCharCountError] = useState('');

    const [hasAccess, setHasAccess] = useState<boolean>(false);
    const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);
    const [accessDeniedMessage, setAccessDeniedMessage] = useState<string>('');
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isPrivateAccessGranted, setIsPrivateAccessGranted] = useState<boolean>(false);

    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
    const [isCopyAllCopied, setIsCopyAllCopied] = useState(false);

    const [isExpressDomainOpen, setIsExpressDomainOpen] = useState(false);
    const [activeOption, setActiveOption] = useState<'handle' | 'domain'>('domain');
    const [brandInput, setBrandInput] = useState('');
    const [selectedDomain, setSelectedDomain] = useState<string>('');
    const [domains, setDomains] = useState<Domain[]>(initialDomains);
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [termsAgreed, setTermsAgreed] = useState(false);
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
    const [purchaseFormType, setPurchaseFormType] = useState<'handle' | 'domain' | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntentId, setPaymentIntentId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userExists, setUserExists] = useState<boolean | null>(null);
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
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [priceCalculationKey, setPriceCalculationKey] = useState(0);

    const [isCheckingOwnership, setIsCheckingOwnership] = useState(false);
    const [ownershipVerified, setOwnershipVerified] = useState(false);

    const fetchDbComments = useCallback(async () => {
        if (!search?.conversation_id && !search?.id && !search?.slug) return;
        setIsLoadingDbComments(true);
        try {
            const params: Record<string, any> = {};
            if (search.conversation_id) {
                params.conversation_id = search.conversation_id;
            } else if (search.id) {
                params.message_id = search.id;
            } else if (search.slug) {
                params.message_slug = search.slug;
            }
            const res = await axios.get('/comments', { params });
            if (res.data?.success && Array.isArray(res.data?.data)) {
                setDbComments(res.data.data);
            } else if (Array.isArray(res.data?.comments)) {
                setDbComments(res.data.comments);
            } else if (Array.isArray(res.data)) {
                setDbComments(res.data);
            }
        } catch (e) {
            console.warn('Failed to load comments:', e);
        } finally {
            setIsLoadingDbComments(false);
        }
    }, [search?.conversation_id, search?.id, search?.slug]);

    useEffect(() => {
        fetchDbComments();
    }, [fetchDbComments]);

    const handleDeleteDbComment = async (commentId: number) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        try {
            const res = await axios.delete(`/comments/${commentId}`);
            if (res.data?.success) {
                setDbComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
                showAlert('Comment deleted successfully', 'success');
            } else {
                showAlert(res.data?.message || 'Failed to delete comment', 'error');
            }
        } catch (e: any) {
            console.error('Failed to delete comment:', e);
            showAlert(e?.response?.data?.message || 'Failed to delete comment', 'error');
        }
    };
    const [ownershipCheckDone, setOwnershipCheckDone] = useState(false);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailError, setEmailError] = useState('');

    const [activeTab, setActiveTab] = useState<'social' | 'text'>('social');
    const [contentSubTab, setContentSubTab] = useState<'composer' | 'upload' | 'embed'>('composer');

    const [commentContent, setCommentContent] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [viewMode, setViewMode] = useState<'naked' | 'dressed' | 'ai'>('ai');

    const [showPrivateAccessModal, setShowPrivateAccessModal] = useState(false);
    const [accessEmail, setAccessEmail] = useState('');
    const [accessNumber, setAccessNumber] = useState('');
    const [accessRequestStep, setAccessRequestStep] = useState<'request' | 'verify'>('request');
    const [isRequestingAccess, setIsRequestingAccess] = useState(false);
    const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);
    const [accessRequestSent, setAccessRequestSent] = useState(false);
    const [requestedEmail, setRequestedEmail] = useState('');

    const [customAlert, setCustomAlert] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({
        show: false,
        message: '',
        type: 'info'
    });

    const [pinnedConversations, setPinnedConversations] = useState<PinnedConversation[]>([]);
    const [isLoadingPinned, setIsLoadingPinned] = useState(false);

    const hasOpenedLandingRef = useRef(false);

    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    /**
     * FIX: Access check guard — prevent the access-check effect
     * from re-running on every `conversation_messages` change.
     * We only want to check access once per slug/status/currentUser combination.
     */
    const accessCheckKeyRef = useRef<string>('');
    const accessCheckInFlightRef = useRef<boolean>(false);

    const [selectedModel, setSelectedModel] = useState<ModelOption>({
        id: 'kimi-k3',
        name: 'Kimi K3',
        description: '2.8T params, native vision, 1M context, frontier intelligence',
        isNew: true,
        type: 'flagship'
    });
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    const [contentFormat, setContentFormat] = useState<'markdown' | 'html'>('markdown');

    // NEW STATE for the embed modal
    const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const conversationContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentUser = auth?.user || null;

    /**
     * ============================================================
     * FIX #1: canInteract now correctly allows guests
     * ------------------------------------------------------------
     * Previously this returned `false` for all guests, which broke
     * comment "Ask AI" (handleReplyAskAI early-returned).
     * Now guests are allowed to interact unless the conversation
     * owner has explicitly disabled guest interaction.
     * ============================================================
     */
    const canInteract = useMemo(() => {
        if (currentUser) return true;
        if (guestInteractionDisabled) return false;
        return true;
    }, [currentUser, guestInteractionDisabled]);

    /**
     * Central helper for applying conversation messages with access-based filtering.
     * Use this in place of ad-hoc filtering + sortConversationMessages calls.
     */
    const applyConversationMessages = useCallback((raw: ConversationMessage[]) => {
        let filtered = raw;
        if (!isOwner && !isPrivateAccessGranted) {
            filtered = filtered.filter(m => m.status !== 'hidden');
        }
        setConversation(sortConversationMessages(filtered));
    }, [isOwner, isPrivateAccessGranted]);

    const parseHashtags = useCallback((hashtag: string[] | string | null | undefined): string[] => {
        if (!hashtag) return [];
        if (Array.isArray(hashtag)) {
            return hashtag
                .filter(Boolean)
                .map(t => String(t).replace(/^#+/, '').trim())
                .filter(Boolean);
        }
        if (typeof hashtag === 'string' && hashtag.trim()) {
            try {
                const parsed = JSON.parse(hashtag);
                if (Array.isArray(parsed)) {
                    return parsed
                        .filter(Boolean)
                        .map(t => String(t).replace(/^#+/, '').trim())
                        .filter(Boolean);
                }
            } catch (e) {
                // normal text string
            }
            return hashtag
                .split(/[\s,]+/)
                .map(t => t.replace(/^#+/, '').trim())
                .filter(Boolean);
        }
        return [];
    }, []);

    const conversationHashtags = useMemo(() => {
        const tagsSet = new Set<string>();
        parseHashtags(search?.hashtag).forEach(t => tagsSet.add(t));
        if (search?.hashtag_display) {
            parseHashtags(search.hashtag_display).forEach(t => tagsSet.add(t));
        }
        if (conversation && Array.isArray(conversation)) {
            conversation.forEach(msg => {
                parseHashtags(msg.hashtag).forEach(t => tagsSet.add(t));
                if (msg.hashtag_display) {
                    parseHashtags(msg.hashtag_display).forEach(t => tagsSet.add(t));
                }
            });
        }
        return Array.from(tagsSet);
    }, [search?.hashtag, search?.hashtag_display, conversation, parseHashtags]);

    useEffect(() => {
        return () => {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                img.onerror = null;
            });
        };
    }, []);

    const getAvatarUrl = (avatar: string | null | undefined): string | null => {
        if (!avatar) return null;
        if (avatar.startsWith('http')) return avatar;
        if (avatar.startsWith('/avatar/')) return avatar;
        if (avatar.startsWith('/storage/')) return avatar;
        return `/storage/${avatar}`;
    };

    const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'error') => {
        setCustomAlert({ show: true, message, type });
    };

    const handleOpenLandingPage = useCallback(() => {
        const landingUrl = search?.landing_page_url;
        if (landingUrl && landingUrl.trim() !== '') {
            window.open(landingUrl, '_blank');
            showAlert(`Opening landing page: ${landingUrl}`, 'info');
        }
    }, [search?.landing_page_url]);

    useEffect(() => {
        const landingUrl = search?.landing_page_url;

        if (landingUrl && landingUrl.trim() !== '' && !hasOpenedLandingRef.current) {
            hasOpenedLandingRef.current = true;

            const timer = setTimeout(() => {
                window.open(landingUrl, '_blank');
                showAlert(`Landing page opened in new tab: ${landingUrl}`, 'info');
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [search?.landing_page_url]);

    const fetchPinnedConversations = async () => {
        setIsLoadingPinned(true);
        try {
            const response = await axios.get('/ai/pinned-conversations-all');
            if (response.data.success) {
                setPinnedConversations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching pinned conversations:', error);
        } finally {
            setIsLoadingPinned(false);
        }
    };

    useEffect(() => {
        if (showPrivateAccessModal && currentUser?.email) {
            setAccessEmail(currentUser.email);
        }
    }, [showPrivateAccessModal, currentUser?.email]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setShowModelDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        fetchPinnedConversations();
    }, []);

    const maxChars = useMemo(() => {
        if (!aiSettings) {
            return currentUser ? 2000 : 300;
        }

        if (currentUser) {
            return aiSettings.user_ai_enabled ? aiSettings.user_char_limit : 0;
        }
        return aiSettings.guest_ai_enabled ? aiSettings.guest_char_limit : 0;
    }, [currentUser, aiSettings]);

    const isAiDisabled = useMemo(() => {
        if (!aiSettings) return false;

        if (currentUser) {
            return !aiSettings.user_ai_enabled;
        }
        return !aiSettings.guest_ai_enabled;
    }, [currentUser, aiSettings]);

    useEffect(() => {
        if (domains && domains.length > 0) {
            setSelectedDomain(domains[0].domain);
        }
    }, [domains]);

    /**
     * ============================================================
     * FIX: Access check guarded with a stable key + in-flight ref
     * ------------------------------------------------------------
     * Previously this effect re-ran on every `conversation_messages`
     * change (e.g., after asking a new question), which caused
     * redundant access-check API calls and possible UI flicker.
     *
     * Now we only re-run when the meaningful access-related inputs
     * change: slug, status, currentUser.id. The conversation_messages
     * are only used to derive initial owner/status — that is done
     * once inside the guarded block.
     * ============================================================
     */
    useEffect(() => {
        const firstMessage = conversation_messages.find(msg => !msg.parent_id) || conversation_messages[0];
        const status = firstMessage?.status || search.status || 'public';
        const userId = currentUser?.id || 'guest';

        const checkKey = `${search.slug}|${status}|${userId}`;
        if (accessCheckInFlightRef.current) return;
        if (accessCheckKeyRef.current === checkKey && hasAccess) return;

        accessCheckKeyRef.current = checkKey;
        accessCheckInFlightRef.current = true;

        const checkAccess = async () => {
            setIsCheckingAccess(true);

            let userIsOwner = false;

            if (currentUser) {
                userIsOwner = conversation_messages.some(msg => msg.user_id === currentUser.id) ||
                             (search.user?.id === currentUser.id);
            }

            setIsOwner(userIsOwner);

            let privateAccessGranted = false;
            if (status === 'private') {
                try {
                    const checkPrivateResponse = await axios.get(`/searchai/private/check-access`, {
                        params: { slug: search.slug }
                    });
                    if (checkPrivateResponse.data.has_access) {
                        privateAccessGranted = true;
                    }
                } catch (error) {
                    console.error('Error checking private access:', error);
                }
            }

            if (privateAccessGranted) {
                setHasAccess(true);
                setIsPrivateAccessGranted(true);
                setIsCheckingAccess(false);
                accessCheckInFlightRef.current = false;
                return;
            }

            if (status === 'public') {
                setHasAccess(true);
                setIsCheckingAccess(false);
                accessCheckInFlightRef.current = false;
                return;
            }

            if (status === 'private') {
                if (userIsOwner) {
                    setHasAccess(true);
                    setIsCheckingAccess(false);
                    accessCheckInFlightRef.current = false;
                    return;
                }

                setHasAccess(false);
                setShowPrivateAccessModal(true);
                setAccessDeniedMessage('This is a private conversation. Please enter your email to get an access code.');
                setIsCheckingAccess(false);
                accessCheckInFlightRef.current = false;
                return;
            }

            if (status === 'hidden') {
                if (userIsOwner) {
                    setHasAccess(true);
                } else {
                    setHasAccess(false);
                    setAccessDeniedMessage(tooltips?.ai_search_view_hidden_conversation || 'This conversation has been hidden and is not available for viewing.');
                }
                setIsCheckingAccess(false);
                accessCheckInFlightRef.current = false;
                return;
            }

            setHasAccess(true);
            setIsCheckingAccess(false);
            accessCheckInFlightRef.current = false;
        };

        checkAccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search.slug, search.status, search.user?.id, currentUser?.id, tooltips]);

    useEffect(() => {
        let visibleMessages = conversation_messages;

        if (!isOwner && !isPrivateAccessGranted) {
            visibleMessages = conversation_messages.filter(msg =>
                msg.status !== 'hidden'
            );
        }

        setConversation(sortConversationMessages(visibleMessages));
    }, [conversation_messages, isOwner, isPrivateAccessGranted]);

    useEffect(() => {
        const uploadMessages = conversation_messages.filter(msg => msg.content_type === 'upload');
        if (uploadMessages.length > 0) {
            console.log('Upload messages found:', uploadMessages.length);
        }
    }, [conversation_messages]);

    useEffect(() => {
        const checkUserExists = async () => {
            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                try {
                    const response = await axios.post('/ezai/check-user-exists', {
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

    const checkEmailOwnership = useCallback(async (emailToCheck: string) => {
        if (!emailToCheck || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) {
            setOwnershipVerified(false);
            setOwnershipCheckDone(false);
            return;
        }

        setIsCheckingOwnership(true);
        setOwnershipVerified(false);
        setOwnershipCheckDone(false);
        try {
            const response = await axios.post('/searchai/check-email-ownership', {
                email: emailToCheck,
                slug: search.id,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (response.data.success) {
                setOwnershipVerified(response.data.is_owner);
                setOwnershipCheckDone(true);

                if (!response.data.is_owner) {
                    const warningMsg = 'This email doesn\'t belong to this conversation. You can not purchase the domain.';
                    setErrorMessage(warningMsg);
                    showAlert(warningMsg, 'warning');
                    return;
                } else {
                    setErrorMessage('');
                    showAlert('Email verified! You are the owner of this conversation.', 'success');
                }
            } else {
                setOwnershipCheckDone(true);
                setOwnershipVerified(false);
            }
        } catch (error) {
            console.error('Error checking email ownership:', error);
            setOwnershipCheckDone(true);
            setOwnershipVerified(false);
            return;
        } finally {
            setIsCheckingOwnership(false);
        }
    }, [search.slug]);

    useEffect(() => {
        if (showEmailModal && emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, [showEmailModal]);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
            }, 60000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 60000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (brandInput.trim() && selectedDomain && isExpressDomainOpen) {
            const timer = setTimeout(() => {
                checkAvailability();
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [brandInput, selectedDomain, activeOption, isExpressDomainOpen]);

    useEffect(() => {
        if (maxChars === 0) {
            setCharCountWarning(tooltips?.ai_search_view_disabled || 'Ask AI is currently disabled');
            setCharCountError(tooltips?.ai_search_view_disabled || 'Ask AI is disabled. Please try again later.');
        } else if (newQuestion.length > maxChars) {
            setCharCountWarning(`Character limit exceeded (${newQuestion.length}/${maxChars})`);
            setCharCountError((tooltips?.ai_search_view_question_too_long || "Maximum {max} characters allowed. You have {count} too many.")
                .replace('{max}', maxChars.toString())
                .replace('{count}', (newQuestion.length - maxChars).toString()));
        } else {
            setCharCountWarning('');
            setCharCountError('');
        }
    }, [newQuestion, maxChars, tooltips]);

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
                const originalPrice = response.data.original_price;

                const cleanMessage = stripHtmlTags(response.data.title || 'Coupon applied successfully!');

                setCouponStatus({
                    valid: true,
                    message: cleanMessage,
                    discount: Number(discountedPrice),
                    domain_discount: Number(discountedPrice)
                });

                setPriceCalculationKey(prev => prev + 1);
            } else {
                const cleanMessage = stripHtmlTags(response.data.title || 'Invalid coupon code');

                setCouponStatus({
                    valid: false,
                    message: cleanMessage,
                    discount: 0,
                    domain_discount: 0
                });
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            setCouponStatus({
                valid: false,
                message: 'Error validating coupon. Please try again.',
                discount: 0,
                domain_discount: 0
            });
        }
    };

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
    }, [couponCode, brandInput, isExpressDomainOpen, activeOption]);

    const [autoScrollDirection, setAutoScrollDirection] = useState<'up' | 'down' | null>(null);
    const autoScrollAnimationRef = useRef<number | null>(null);
    const lastScrollTimestampRef = useRef<number | null>(null);

    const stopAutoScroll = useCallback(() => {
        if (autoScrollAnimationRef.current !== null) {
            cancelAnimationFrame(autoScrollAnimationRef.current);
            autoScrollAnimationRef.current = null;
        }
        lastScrollTimestampRef.current = null;
        setAutoScrollDirection(null);
    }, []);

    const startSlowAutoScroll = useCallback((direction: 'up' | 'down') => {
        // Toggle off if already scrolling in that direction
        if (autoScrollDirection === direction) {
            stopAutoScroll();
            return;
        }

        if (autoScrollAnimationRef.current !== null) {
            cancelAnimationFrame(autoScrollAnimationRef.current);
            autoScrollAnimationRef.current = null;
        }
        lastScrollTimestampRef.current = null;
        setAutoScrollDirection(direction);

        // Smooth slow motion speed in pixels per second (~240px/s)
        const pixelsPerSecond = 240;

        const step = (timestamp: number) => {
            if (lastScrollTimestampRef.current === null) {
                lastScrollTimestampRef.current = timestamp;
            }
            const deltaMs = Math.min(timestamp - lastScrollTimestampRef.current, 50);
            lastScrollTimestampRef.current = timestamp;

            const scrollDistance = (pixelsPerSecond * deltaMs) / 1000;
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

            if (direction === 'up') {
                if (currentScroll <= 0) {
                    stopAutoScroll();
                    return;
                }
                const target = Math.max(0, currentScroll - scrollDistance);
                window.scrollTo(0, target);
                if (target <= 0) {
                    stopAutoScroll();
                    return;
                }
            } else {
                if (currentScroll >= maxScroll - 1) {
                    stopAutoScroll();
                    return;
                }
                const target = Math.min(maxScroll, currentScroll + scrollDistance);
                window.scrollTo(0, target);
                if (target >= maxScroll - 1) {
                    stopAutoScroll();
                    return;
                }
            }

            autoScrollAnimationRef.current = requestAnimationFrame(step);
        };

        autoScrollAnimationRef.current = requestAnimationFrame(step);
    }, [autoScrollDirection, stopAutoScroll]);

    // Cancel auto-scroll if user manually scrolls or touches
    useEffect(() => {
        if (!autoScrollDirection) return;

        const handleUserInterrupt = () => {
            stopAutoScroll();
        };

        window.addEventListener('wheel', handleUserInterrupt, { passive: true });
        window.addEventListener('touchmove', handleUserInterrupt, { passive: true });
        window.addEventListener('keydown', handleUserInterrupt, { passive: true });

        return () => {
            window.removeEventListener('wheel', handleUserInterrupt);
            window.removeEventListener('touchmove', handleUserInterrupt);
            window.removeEventListener('keydown', handleUserInterrupt);
        };
    }, [autoScrollDirection, stopAutoScroll]);

    useEffect(() => {
        return () => {
            if (autoScrollAnimationRef.current !== null) {
                cancelAnimationFrame(autoScrollAnimationRef.current);
            }
        };
    }, []);

    const scrollToBottom = () => {
        stopAutoScroll();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToTop = () => {
        stopAutoScroll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToMessage = (slug: string) => {
        const messageElement = document.getElementById(`message-${slug}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('bg-yellow-50', 'transition-colors', 'duration-1000');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-50');
            }, 2000);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(share_url);
        setIsCopied(true);

        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    const copyMessageToClipboard = (messageId: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(messageId);
        showAlert('Copied to clipboard!', 'success');
        setTimeout(() => {
            setCopiedMessageId(null);
        }, 2000);
    };

    const copyAllConversation = () => {
        const conversationText = conversation
            .filter(msg => msg.message_role !== 'system')
            .map(msg => {
                const isUser = msg.message_role === 'user';
                const role = isUser ? 'User' : 'AI Assistant';
                const content = isUser ? msg.query : msg.response;
                const timestamp = formatDate(msg.created_at);

                let contentPrefix = '';
                if (msg.content_type === 'upload') {
                    contentPrefix = '[File Upload] ';
                } else if (msg.content_type === 'comment') {
                    contentPrefix = '[Comment] ';
                } else if (msg.content_type === 'conversationcomment') {
                    contentPrefix = '[Conversation Comment] ';
                } else if (msg.content_type === 'social' || msg.content_type === 'social_media') {
                    contentPrefix = '[Social Media] ';
                } else if (msg.content_type === 'embed') {
                    contentPrefix = '[Embed] ';
                }

                return `${role} (${timestamp})${contentPrefix ? ' - ' + contentPrefix : ''}:\n${content}\n`;
            })
            .join('\n---\n\n');

        navigator.clipboard.writeText(conversationText);
        setIsCopyAllCopied(true);
        showAlert('Entire conversation copied to clipboard!', 'success');

        setTimeout(() => {
            setIsCopyAllCopied(false);
        }, 2000);
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

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return tooltips?.ai_search_view_email_required || 'Email is required';
        }
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    const handleEzthemeClick = () => {
        if (!hasAccess) {
            setErrorMessage('You do not have permission to save this conversation.');
            return;
        }
        setEmail('');
        setEmailError('');
        setShowEmailModal(true);
    };

    const handleCloseModal = () => {
        setShowEmailModal(false);
        setEmail('');
        setEmailError('');
    };

    const handleEmailSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const error = validateEmail(email);
        if (error) {
            setEmailError(error);
            return;
        }

        setIsEzthemeLoading(true);
        setEmailError('');

        try {
            const response = await axios.post('/theme/create', {
                slug: search.slug,
                url: window.location.href,
                title: currentConversationTitle,
                email: email
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                handleCloseModal();
                setSavedTheme(response.data.theme);

                const successMessage = (
                    <span className="flex items-center gap-4">
                        Theme saved successfully!{' '}
                        <span className="inline-flex items-center gap-2 bg-gray-900/70 border border-gray-700 rounded-xl px-3 py-2 hover:shadow-lg hover:border-yellow-400/50 transition-all">
                            <span className="text-white text-md font-medium">{response.data.theme?.title || 'Untitled Theme'}</span>
                            <span className="text-md text-gray-400">ID: {response.data.theme?.unique_id || 'N/A'}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-md font-medium bg-yellow-400/20 text-yellow-300">
                                EZ$ {response.data.theme?.price || '0'}
                            </span>
                            <a
                                href={`https://ez.wiki/${response.data.theme?.unique_id || '#'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 text-md bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                            >
                                Preview
                            </a>
                        </span>
                    </span>
                );

                setSuccessAlert(successMessage);
            } else {
                alert(response.data.message || 'Failed to save theme');
            }
        } catch (error) {
            console.error('Error saving theme:', error);

            if (axios.isAxiosError(error) && error.response) {
                alert(error.response.data.message || 'An error occurred while saving the theme');
            } else {
                alert('An error occurred. Please try again.');
            }
        } finally {
            setIsEzthemeLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value && /^\d$/.test(value)) {
            const newAccessNumber = accessNumber.split('');
            newAccessNumber[index] = value;
            setAccessNumber(newAccessNumber.join(''));

            if (index < 3) {
                otpInputRefs.current[index + 1]?.focus();
            }
        } else if (!value) {
            const newAccessNumber = accessNumber.split('');
            newAccessNumber[index] = '';
            setAccessNumber(newAccessNumber.join(''));

            if (index > 0) {
                otpInputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !accessNumber[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') {
            handleVerifyPrivateAccess();
        }
    };

    const handleRequestPrivateAccess = async () => {
        if (!accessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accessEmail)) {
            setErrorMessage('Please enter a valid email address');
            return;
        }

        setIsRequestingAccess(true);
        setErrorMessage('');

        try {
            const response = await axios.post('/searchai/private/request-access', {
                slug: search.slug,
                email: accessEmail,
            });

            if (response.data.success) {
                setRequestedEmail(accessEmail);
                setAccessRequestSent(true);
                setAccessRequestStep('verify');
                setSuccessMessage('Access code sent! Please check your email.');
                setAccessNumber('');
                setTimeout(() => {
                    otpInputRefs.current[0]?.focus();
                }, 100);
            } else {
                setErrorMessage(response.data.message);
            }
        } catch (error: any) {
            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage('Failed to request access. Please try again.');
            }
        } finally {
            setIsRequestingAccess(false);
        }
    };

    const handleVerifyPrivateAccess = async () => {
        if (!accessNumber || accessNumber.length !== 4) {
            setErrorMessage('Please enter a valid 4-digit access code');
            return;
        }

        setIsVerifyingAccess(true);
        setErrorMessage('');

        try {
            const response = await axios.post('/searchai/private/verify-access', {
                slug: search.slug,
                access_number: accessNumber,
                email: requestedEmail,
            });

            if (response.data.success) {
                setShowPrivateAccessModal(false);
                window.location.href = response.data.conversation_url;
            } else {
                setErrorMessage(response.data.message);
            }
        } catch (error: any) {
            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage('Invalid access code. Please try again.');
            }
        } finally {
            setIsVerifyingAccess(false);
        }
    };

    const handleClosePrivateAccessModal = () => {
        setShowPrivateAccessModal(false);
        setAccessEmail('');
        setAccessNumber('');
        setAccessRequestStep('request');
        setAccessRequestSent(false);
        setRequestedEmail('');
        setErrorMessage('');
    };

    const handleExpressDomainClick = () => {
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
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUserExists(null);
        setOwnershipVerified(false);
        setOwnershipCheckDone(false);
        setIsCheckingOwnership(false);
    };

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
            message: tooltips?.ai_search_view_checking || 'Checking availability...'
        });

        try {
            const endpoint = activeOption === 'handle' ? checkDomainUrl : '/ezai/check-ezpressstandard-domain';
            const response = await axios.post(endpoint, {
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

    const initiateHandlePayment = async () => {
        setErrorMessage('');

        if (!email) {
            setErrorMessage('Please enter your email address');
            showAlert('Please enter your email address', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMessage('Please enter a valid email address');
            showAlert('Please enter a valid email address', 'error');
            return;
        }

        if (userExists === null) {
            setErrorMessage('Checking user account...');
            showAlert('Checking user account...', 'info');
            return;
        }

        if (userExists === true) {
            try {
                const ownershipResponse = await axios.post('/searchai/check-email-ownership', {
                    email: email,
                    slug: search.id,
                }, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    }
                });

                if (ownershipResponse.data.success && !ownershipResponse.data.is_owner) {
                    const warningMsg = 'Note: This email doesn\'t match the conversation owner. You can not purchase the domain.';
                    showAlert(warningMsg, 'warning');
                    return;
                }
            } catch (error) {
                console.error('Error checking ownership:', error);
                return;
            }
        }

        if (!userExists) {
            if (!password) {
                setErrorMessage('Please enter a password');
                showAlert('Please enter a password', 'error');
                return;
            }

            if (password.length < 8) {
                setErrorMessage('Password must be at least 8 characters long');
                showAlert('Password must be at least 8 characters long', 'error');
                return;
            }

            if (!confirmPassword) {
                setErrorMessage('Please confirm your password');
                showAlert('Please confirm your password', 'error');
                return;
            }

            if (password !== confirmPassword) {
                setErrorMessage('Passwords do not match');
                showAlert('Passwords do not match', 'error');
                return;
            }
        }

        let finalPrice = Number(displayFinalPrices.totalPrice);

        if (finalPrice > 0 && finalPrice < 1) {
            finalPrice = 1;
        }

        if (finalPrice === 0) {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const response = await axios.post('/ezai/free-purchase', {
                    email: email,
                    password: !userExists ? password : undefined,
                    custom_handle: brandInput.trim(),
                    domain: selectedDomain,
                    type: activeOption,
                    coupon_code: couponCode,
                    slug: search.slug,
                    slug_id: search.id,
                    url: window.location.href,
                    title: currentConversationTitle,
                    view_mode: 'ai',
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
                        message: 'Purchase successful! Your new URL: ',
                        url: url
                    });

                    showAlert(`Purchase successful! Your new URL: ${url}`, 'success');

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
                            discount: 0,
                            domain_discount: 0
                        });
                        setTermsAgreed(false);
                        setPassword('');
                        setConfirmPassword('');
                    }, 60000);
                } else {
                    const errorMsg = response.data.error || response.data.message || 'Free purchase failed';
                    setErrorMessage(errorMsg);
                    showAlert(errorMsg, 'error');
                }
            } catch (error) {
                console.error('Free purchase error:', error);

                let errorMessageText = 'Failed to process free purchase';

                if (axios.isAxiosError(error)) {
                    if (error.response) {
                        const responseData = error.response.data;
                        errorMessageText = responseData?.error ||
                                          responseData?.message ||
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

        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = activeOption === 'handle' ? '/ezai/initiate-domain-homepayment' : '/ezai/initiate-domain-homepayment';

            const response = await axios.post(endpoint, {
                price: Number(displayFinalPrices.domainPrice),
                email: email,
                password: !userExists ? password : undefined,
                custom_handle: brandInput.trim(),
                domain: selectedDomain,
                promo_price: Number(finalPrice),
                coupon_code: couponCode,
                selling_price: 0,
                payment_method: 'usd',
                funnelId: 0,
                view_mode: 'ai',
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (response.data.clientSecret) {
                setClientSecret(response.data.clientSecret);
                setPaymentIntentId(response.data.payment_intent_id);
                setPaymentStep(2);
                setIsLoading(false);
            } else {
                throw new Error('No client secret received from payment service');
            }
        } catch (error) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                const errorMsg = error.response?.data?.error || 'Failed to initialize payment';
                setErrorMessage(errorMsg);
                showAlert(errorMsg, 'error');
            } else {
                const errorMsg = 'Failed to connect to payment service';
                setErrorMessage(errorMsg);
                showAlert(errorMsg, 'error');
            }
        }
    };

    const handlePaymentSuccess = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = activeOption === 'handle' ? '/ezai/home-domain-handle-success' : '/ezai/home-domain-handle-success';
            const response = await axios.post(endpoint, {
                payment_intent_id: paymentIntentId,
                slug: search.slug,
                slug_id: search.id,
                url: window.location.href,
                title: currentConversationTitle,
                view_mode: 'ai',
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
                    message: 'Payment successful! Your new URL: ',
                    url: url
                });

                showAlert(`Payment successful! Your new URL: ${url}`, 'success');

                setIsPaymentModalOpen(false);
                setPurchaseFormType(null);
                setPaymentStep(1);
                setClientSecret('');
                setPaymentIntentId('');
                setErrorMessage('');
                setIsLoading(false);

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
                    setPassword('');
                    setConfirmPassword('');
                    setIsExpressDomainOpen(false);
                }, 3000);
            } else {
                setIsLoading(false);
                const errorMsg = response.data.error || 'Payment verification failed';
                setErrorMessage(errorMsg);
                showAlert(errorMsg, 'error');
            }
        } catch (error: any) {
            setIsLoading(false);
            const errorMsg = error.response?.data?.error || 'Payment verification failed';
            setErrorMessage(errorMsg);
            showAlert(errorMsg, 'error');
        }
    };

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

        setPurchaseFormType(activeOption);
        setIsPaymentModalOpen(true);
    };

    const processPurchase = async () => {
        setIsSubmitting(true);
        try {
            console.log('Processing purchase with view mode:', viewMode);
        } catch (error) {
            console.error('Error processing purchase:', error);
        } finally {
            setIsSubmitting(false);
            setShowPurchaseModal(false);
        }
    };

    const processFiles = (fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        setUploadError(null);
        const newValidFiles: File[] = [];
        const errors: string[] = [];

        files.forEach((file) => {
            if (file.size > 100 * 1024 * 1024) {
                errors.push(`❌ "${file.name}" exceeds 100MB limit (${formatFileSize(file.size)}).`);
                return;
            }

            const validation = validateFileType(file);
            if (!validation.valid) {
                errors.push(`❌ "${file.name}": ${validation.error || 'Invalid file type'}`);
                return;
            }

            newValidFiles.push(file);
        });

        if (errors.length > 0) {
            const errorMsg = errors.join('\n');
            setUploadError(errorMsg);
            showAlert(errorMsg, 'error');
        }

        if (newValidFiles.length === 0) {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        Promise.all(
            newValidFiles.map((file) => {
                return new Promise<UploadedFile>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        resolve({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            data: (event.target?.result as string) || '',
                            file: file,
                        });
                    };
                    reader.onerror = () => {
                        resolve({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            data: '',
                            file: file,
                        });
                    };
                    reader.readAsDataURL(file);
                });
            })
        ).then((readFiles) => {
            setSelectedFiles((prev) => {
                const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
                const toAdd = readFiles.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
                return [...prev, ...toAdd];
            });
            setUploadError(null);
        });
    };

    // ============================================================
    // FILE UPLOAD HANDLER - For bottom page editor (Conversation Upload Media)
    // Uses /content/upload endpoint
    // ============================================================
    const handleFileUploadForConversation = async () => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        if (!selectedFiles || selectedFiles.length === 0) return;

        setUploadError(null);

        // Validate all files
        for (const fileObj of selectedFiles) {
            if (fileObj.file) {
                const validation = validateFileType(fileObj.file);
                if (!validation.valid) {
                    const errorMsg = validation.error || 'Invalid file type';
                    setUploadError(errorMsg);
                    showAlert(errorMsg, 'error');
                    return;
                }
            }
        }

        setIsUploading(true);

        const formData = new FormData();
        selectedFiles.forEach((fileObj) => {
            if (fileObj.file) {
                formData.append('files[]', fileObj.file);
            }
        });
        if (selectedFiles[0]?.file) {
            formData.append('file', selectedFiles[0].file);
        }
        formData.append('description', commentContent);
        formData.append('conversation_id', search.conversation_id);

        try {
            const response = await axios.post('/content/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                if (response.data.conversation_messages) {
                    applyConversationMessages(response.data.conversation_messages);
                }

                setSelectedFiles([]);
                setCommentContent('');
                setUploadError(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                setTimeout(() => {
                    scrollToBottom();
                }, 100);

                fetchPinnedConversations();

                showAlert(`${selectedFiles.length > 1 ? 'Files' : 'File'} uploaded successfully!`, 'success');
            } else {
                const errorMsg = response.data.message || 'Failed to upload file';
                setUploadError(errorMsg);
                showAlert(errorMsg, 'error');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.message || 'Failed to upload file';
                setUploadError(errorMessage);
                showAlert(errorMessage, 'error');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                const errorMessage = 'Failed to upload file. Please try again.';
                setUploadError(errorMessage);
                showAlert(errorMessage, 'error');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } finally {
            setIsUploading(false);
        }
    };

    // ============================================================
    // FILE UPLOAD HANDLER - For comments (Conversation Comments Upload Media)
    // Uses /comments endpoint (saves to comments database table)
    // ============================================================
    const handleFileUploadForComments = async () => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        if (!selectedFiles || selectedFiles.length === 0) return;

        setUploadError(null);

        // Validate all files
        for (const fileObj of selectedFiles) {
            if (fileObj.file) {
                const validation = validateFileType(fileObj.file);
                if (!validation.valid) {
                    const errorMsg = validation.error || 'Invalid file type';
                    setUploadError(errorMsg);
                    showAlert(errorMsg, 'error');
                    return;
                }
            }
        }

        setIsUploading(true);

        const formData = new FormData();
        selectedFiles.forEach((fileObj) => {
            if (fileObj.file) {
                formData.append('files[]', fileObj.file);
            }
        });
        if (selectedFiles[0]?.file) {
            formData.append('file', selectedFiles[0].file);
        }
        formData.append('content', commentContent || '');
        formData.append('description', commentContent || '');
        formData.append('conversation_id', search.conversation_id);
        if (search.slug) {
            formData.append('message_slug', search.slug);
        }
        if (search.id) {
            formData.append('message_id', String(search.id));
        }
        formData.append('content_type', 'upload');
        formData.append('format', 'markdown');

        try {
            // Save directly into the comments database table
            const response = await axios.post('/comments', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                if (response.data.data) {
                    setDbComments(prev => [response.data.data, ...prev]);
                }
                fetchDbComments();

                setSelectedFiles([]);
                setCommentContent('');
                setUploadError(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                // Switch to comments tab to display the newly posted media comment
                setContentSubTab('embed');

                showAlert(`${selectedFiles.length > 1 ? 'Files' : 'File'} uploaded and saved to comments successfully!`, 'success');
            } else {
                const errorMsg = response.data.message || 'Failed to upload file';
                setUploadError(errorMsg);
                showAlert(errorMsg, 'error');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.message || 'Failed to upload file';
                setUploadError(errorMessage);
                showAlert(errorMessage, 'error');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                const errorMessage = 'Failed to upload file. Please try again.';
                setUploadError(errorMessage);
                showAlert(errorMessage, 'error');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    };

    // ============================================================
    // COMMENT HANDLER - UPDATED to route content types explicitly
    // ============================================================
    const handleCommentSubmit = useCallback(async (parentSlug?: string, contentOverride?: string, contentTypeOverride?: string) => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        const textToSend = contentOverride !== undefined ? contentOverride : commentContent;
        if (!textToSend.trim()) return;

        setIsCommenting(true);

        try {
            // ============================================
            // 1. CONVERSATION COMMENT — explicitly requested
            // ============================================
            if (contentTypeOverride === 'conversationcomment') {
                const response = await axios.post('/content/comment', {
                    content: textToSend,
                    conversation_id: search.conversation_id,
                    parent_slug: search.slug,
                    content_type: 'conversationcomment',
                }, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });

                if (response.data.success) {
                    if (response.data.conversation_messages) {
                        applyConversationMessages(response.data.conversation_messages);
                    }

                    if (contentOverride === undefined) {
                        setCommentContent('');
                    }

                    setTimeout(() => {
                        scrollToBottom();
                    }, 100);
                    setTimeout(() => {
                        scrollToBottom();
                    }, 450);

                    fetchPinnedConversations();

                    showAlert('Comment posted successfully!', 'success');
                } else {
                    const errorMsg = response.data.message || 'Failed to post comment';
                    showAlert(errorMsg, 'error');
                    alert(errorMsg);
                }
                return;
            }

            // ============================================
            // 2. EMBED — explicit type OR auto-detected from content
            // ============================================
            const isEmbed = (contentTypeOverride === 'embed') ||
                (contentOverride !== undefined && (contentOverride.includes('embed-row') || contentOverride.includes('embed-carousel') || contentOverride.includes('embed-masonry') || contentOverride.includes('masonry-wrapper')));

            // ============================================
            // 3. PLAIN COMMENT — default when nothing else matches
            // ============================================
            if (!isEmbed) {
                // User directive: comments only store in comment table in the db not in conversation
                const commentPayload = {
                    content: textToSend,
                    message_id: search?.id || null,
                    message_slug: parentSlug || search?.slug || null,
                    conversation_id: search?.conversation_id || null,
                    format: 'markdown',
                    content_type: 'comment',
                };

                const response = await axios.post('/comments', commentPayload);
                if (response.data.success) {
                    if (contentOverride === undefined) {
                        setCommentContent('');
                    }
                    showAlert('Comment posted successfully!', 'success');
                } else {
                    const errorMsg = response.data.message || 'Failed to post comment';
                    showAlert(errorMsg, 'error');
                    alert(errorMsg);
                }
                return;
            }

            // ============================================
            // 4. EMBED — post to /content/comment with content_type: 'embed'
            // ============================================
            const payload: Record<string, any> = {
                content: textToSend,
                conversation_id: search.conversation_id,
                parent_slug: isEmbed ? null : (parentSlug || null),
            };
            if (contentTypeOverride) {
                payload.content_type = contentTypeOverride;
            } else if (isEmbed) {
                payload.content_type = 'embed';
            }

            const response = await axios.post('/content/comment', payload, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                if (response.data.conversation_messages) {
                    applyConversationMessages(response.data.conversation_messages);
                }

                if (contentOverride === undefined) {
                    setCommentContent('');
                }

                setTimeout(() => {
                    scrollToBottom();
                }, 100);
                setTimeout(() => {
                    scrollToBottom();
                }, 450);

                fetchPinnedConversations();

                showAlert(isEmbed ? 'Embed added to conversation successfully!' : (parentSlug ? 'Child conversation added successfully!' : 'Comment posted successfully!'), 'success');
            } else {
                const errorMsg = response.data.message || 'Failed to post comment';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Comment error:', error);
            if (axios.isAxiosError(error) && error.response) {
                const errorMsg = error.response.data.message || 'Failed to post comment';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            } else {
                const errorMsg = 'Failed to post comment. Please try again.';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            }
        } finally {
            setIsCommenting(false);
        }
    }, [canInteract, commentContent, search.conversation_id, search.slug, applyConversationMessages]);

    // ============================================================
    // SOCIAL POST HANDLER - For bottom page editor (conversation markdown/html to save)
    // Uses /content/social endpoint
    // ============================================================
    const handleSocialPost = useCallback(async (content: string, mediaFiles: string[], cw: string | null) => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        try {
            const response = await axios.post('/content/social', {
                content: content,
                media: mediaFiles,
                content_warning: cw,
                conversation_id: search.conversation_id,
                parent_slug: null,
                format: contentFormat,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                if (response.data.conversation_messages) {
                    applyConversationMessages(response.data.conversation_messages);
                }

                setTimeout(() => {
                    scrollToBottom();
                }, 100);

                fetchPinnedConversations();

                showAlert('Social media post created successfully!', 'success');
            } else {
                const errorMsg = response.data.message || 'Failed to create social media post';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Social media post error:', error);
            if (axios.isAxiosError(error) && error.response) {
                const errorMsg = error.response.data.message || 'Failed to create social media post';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            } else {
                const errorMsg = 'Failed to create social media post. Please try again.';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            }
        }
    }, [search.conversation_id, applyConversationMessages, canInteract, contentFormat, fetchPinnedConversations, scrollToBottom]);

    // ============================================================
    // REPLY HANDLERS - For the enhanced reply composer
    // ============================================================
    const handleReplySocialPost = useCallback(async (
        content: string,
        mediaFiles: string[],
        cw: string | null,
        parentMessage: ConversationMessage
    ) => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        try {
            const response = await axios.post('/comments', {
                content: content,
                media: mediaFiles,
                content_warning: cw,
                conversation_id: search.conversation_id,
                message_id: parentMessage.id || search.id || null,
                message_slug: parentMessage.slug || search.slug || null,
                parent_id: null,
                format: contentFormat,
                content_type: 'comment',
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                if (response.data.data) {
                    setDbComments(prev => [response.data.data, ...prev]);
                }
                fetchDbComments();

                fetchPinnedConversations();

                showAlert('Comment reply posted successfully!', 'success');
            } else {
                const errorMsg = response.data.message || 'Failed to post reply';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Reply post error:', error);
            if (axios.isAxiosError(error) && error.response) {
                const errorMsg = error.response.data.message || 'Failed to post reply';
                showAlert(errorMsg, 'error');
            } else {
                showAlert('Failed to post reply. Please try again.', 'error');
            }
        }
    }, [search.conversation_id, search.id, search.slug, canInteract, contentFormat, fetchDbComments, fetchPinnedConversations]);

    const handleReplyFileUpload = useCallback(async (
        file: File,
        description: string,
        parentMessage: ConversationMessage
    ) => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        const validation = validateFileType(file);
        if (!validation.valid) {
            const errorMsg = validation.error || 'Invalid file type';
            showAlert(errorMsg, 'error');
            throw new Error(errorMsg);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('content', description || `Attachment: ${file.name}`);
        formData.append('description', description || `Attachment: ${file.name}`);
        formData.append('conversation_id', search.conversation_id);
        formData.append('message_slug', parentMessage.slug);
        if (parentMessage.id) {
            formData.append('message_id', String(parentMessage.id));
        }
        formData.append('content_type', 'upload');
        formData.append('format', 'markdown');

        try {
            // Save directly into the comments database table
            const response = await axios.post('/comments', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                if (response.data.data) {
                    setDbComments(prev => [response.data.data, ...prev]);
                }

                fetchDbComments();

                showAlert('File uploaded successfully to comments!', 'success');
            } else {
                const errorMsg = response.data.message || 'Failed to upload file';
                showAlert(errorMsg, 'error');
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error('Reply upload error:', error);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.message || 'Failed to upload file';
                showAlert(errorMessage, 'error');
                throw new Error(errorMessage);
            } else {
                const errorMessage = error?.message || 'Failed to upload file. Please try again.';
                showAlert(errorMessage, 'error');
                throw error;
            }
        }
    }, [search.conversation_id, canInteract, fetchDbComments]);

    /**
     * ============================================================
     * FIX #2: Comment "Ask AI" - Hardened handler
     * ------------------------------------------------------------
     * Previously this function was blocked for guests because of
     * the strict `canInteract` check and because the backend
     * `as_comment` flow was not being hit reliably. Now:
     *   - We only block when AI is disabled (aiSettings says so)
     *   - We never early-return on guest canInteract
     *   - We explicitly send message_id + message_slug + as_comment
     *   - We optimistically append the AI comment to dbComments
     * ============================================================
     */
    const handleReplyAskAI = useCallback(async (
        question: string,
        parentMessage: ConversationMessage
    ) => {
        // Only block if AI is globally disabled for the current audience
        if (isAiDisabled) {
            showAlert(tooltips?.ai_search_view_disabled || 'Ask AI is currently disabled.', 'error');
            return;
        }

        if (question.length > maxChars) {
            showAlert(`Question exceeds maximum length of ${maxChars} characters.`, 'error');
            return;
        }

        if (!question.trim()) return;

        setIsAsking(true);

        try {
            const response = await fetch('/searchai/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    query: question,
                    conversation_id: search.conversation_id,
                    thread_id: search.thread_id,
                    parent_slug: parentMessage.slug,
                    message_id: parentMessage.id,
                    as_comment: true,
                    enable_thinking: false,
                    model: selectedModel.id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Comment replies are stored ONLY in comments table
                if (data.is_comment || data.user_comment || data.ai_comment) {
                    const newComments: any[] = [];
                    if (data.user_comment) newComments.push(data.user_comment);
                    if (data.ai_comment) newComments.push(data.ai_comment);
                    if (newComments.length > 0) {
                        setDbComments(prev => [...prev, ...newComments]);
                    }
                    // Refresh from server to ensure consistency
                    fetchDbComments();
                    showAlert('AI response added to comments!', 'success');
                } else if (data.conversation_messages && Array.isArray(data.conversation_messages)) {
                    applyConversationMessages(data.conversation_messages);
                    showAlert('AI response received!', 'success');
                } else {
                    fetchDbComments();
                    showAlert('AI response added to comments!', 'success');
                }

                if (data.conversation_cost !== undefined) {
                    setConversationCost(data.conversation_cost);
                }
                if (data.conversation_tokens !== undefined) {
                    setConversationTokens(data.conversation_tokens);
                }

                fetchPinnedConversations();
            } else {
                const errorMsg = data.message || 'Failed to get AI response';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Error asking AI:', error);
            showAlert('An error occurred. Please try again.', 'error');
            alert('An error occurred. Please try again.');
        } finally {
            setIsAsking(false);
        }
    }, [search.conversation_id, search.thread_id, applyConversationMessages, isAiDisabled, maxChars, tooltips, selectedModel, fetchDbComments, fetchPinnedConversations]);

    const handleAskQuestion = async (e?: FormEvent) => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        if (e) {
            e.preventDefault();
        }

        if (isAiDisabled) {
            setErrorMessage(tooltips?.ai_search_view_disabled || 'Ask AI is currently disabled. Please try again later.');
            showAlert(tooltips?.ai_search_view_disabled || 'Ask AI is currently disabled. Please try again later.', 'error');
            return;
        }

        if (!hasAccess) {
            setErrorMessage('You do not have permission to continue this conversation.');
            showAlert('You do not have permission to continue this conversation.', 'error');
            return;
        }

        if (newQuestion.length > maxChars) {
            setErrorMessage((tooltips?.ai_search_view_question_too_long || "Question exceeds maximum length of {max} characters. Please shorten your question.")
                .replace('{max}', maxChars.toString()));
            showAlert((tooltips?.ai_search_view_question_too_long || "Question exceeds maximum length of {max} characters. Please shorten your question.")
                .replace('{max}', maxChars.toString()), 'error');
            return;
        }

        if (!newQuestion.trim() || isAsking) return;

        setIsAsking(true);

        try {
            const response = await fetch('/searchai/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    query: newQuestion,
                    conversation_id: search.conversation_id,
                    thread_id: search.thread_id,
                    parent_slug: null,
                    enable_thinking: false,
                    model: selectedModel.id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                if (data.conversation_messages && Array.isArray(data.conversation_messages)) {
                    applyConversationMessages(data.conversation_messages);
                }
                setNewQuestion('');

                if (data.conversation_cost !== undefined) {
                    setConversationCost(data.conversation_cost);
                }
                if (data.conversation_tokens !== undefined) {
                    setConversationTokens(data.conversation_tokens);
                }

                setTimeout(() => {
                    scrollToBottom();
                }, 100);

                fetchPinnedConversations();
            } else {
                const errorMsg = data.message || 'Failed to get response';
                showAlert(errorMsg, 'error');
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Error asking question:', error);
            showAlert('An error occurred. Please try again.', 'error');
            alert('An error occurred. Please try again.');
        } finally {
            setIsAsking(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAskQuestion();
        }
        else if (e.key === 'Escape') {
            setNewQuestion('');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getCostEstimate = (tokens: number) => {
        return ((tokens / 1000) * 0.01).toFixed(4);
    };

    const maskIPAddress = (ip: string): string => {
        if (!ip) return '';

        const ipParts = ip.split('.');
        if (ipParts.length === 4) {
            return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.***`;
        } else {
            const lastColonIndex = ip.lastIndexOf(':');
            if (lastColonIndex !== -1) {
                return ip.substring(0, lastColonIndex + 1) + '***';
            }
            const halfLength = Math.floor(ip.length / 2);
            return ip.substring(0, halfLength) + '*'.repeat(ip.length - halfLength);
        }
    };

    const renderFileUpload = (fileData: FileData) => {
        const isImage = fileData.mime_type.startsWith('image/');
        const isVideo = fileData.mime_type.startsWith('video/');
        const isAudio = fileData.mime_type.startsWith('audio/');
        const isPdf = fileData.mime_type === 'application/pdf';
        const isHtml = fileData.mime_type === 'text/html' || fileData.extension === 'html' || fileData.extension === 'htm';

        const getMarkdownContent = () => {
            if (isImage) {
                return `![${fileData.original_name}](${fileData.url})\n\n*${fileData.original_name}*`;
            }

            if (isVideo) {
                return null;
            }

            if (isAudio) {
                return null;
            }

            if (isPdf) {
                const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileData.url)}&embedded=true`;
                return `<div class="pdf-viewer-container">
                    <div class="pdf-viewer-toolbar">
                        <a href="${fileData.url}" target="_blank" rel="noopener noreferrer" class="pdf-download-btn">
                            📄 Open PDF in New Tab
                        </a>
                        <a href="${fileData.url}" download class="pdf-download-btn">
                            💾 Download PDF
                        </a>
                    </div>
                    <iframe
                        src="${googleViewerUrl}"
                        class="pdf-iframe"
                        style="width: 100%; height: 600px; border: 1px solid #e5e7eb; border-radius: 0.5rem; background-color: #f9fafb;"
                        title="${fileData.original_name}"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation allow-top-navigation-by-user-activation"
                    >
                        <div class="pdf-fallback">
                            <p>Your browser cannot display PDF files inline.</p>
                            <a href="${fileData.url}" target="_blank">Click here to open the PDF</a>
                        </div>
                    </iframe>
                </div>`;
            }

            if (isHtml) {
                return `<div style="width: 100%;">
                    <iframe src="${fileData.url}" style="width: 100%; height: 500px; border: 1px solid #e5e7eb; border-radius: 0.5rem; display: block;" title="${fileData.original_name}" sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation allow-top-navigation-by-user-activation">
                        Your browser does not support iframes.
                    </iframe>
                    <div style="margin-top: 12px; text-align: center;">
                        <a href="${fileData.url}" target="_blank" rel="noopener noreferrer" style="color: #22c55e; text-decoration: underline;">📄 View permanent link</a>
                    </div>
                </div>`;
            }

            return `**File:** [${fileData.original_name}](${fileData.url}) (${formatFileSize(fileData.size)})`;
        };

        if (isImage) {
            return (
                <div className="w-full">
                    <div className="rounded-lg overflow-hidden border border-gray-200/80 bg-gray-50 flex items-center justify-center relative group/img shadow-2xs">
                        <img
                            src={fileData.url}
                            alt={fileData.original_name}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-lg transition-transform duration-200 group-hover/img:scale-[1.01]"
                            loading="lazy"
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate font-medium text-gray-700" title={fileData.original_name}>
                            📷 {fileData.original_name}
                        </span>
                        <span className="text-gray-400 shrink-0 ml-2 text-[11px] font-mono">{formatFileSize(fileData.size)}</span>
                    </div>
                </div>
            );
        }

        if (isVideo) {
            return (
                <div className="w-full break-words">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">🎬 {fileData.original_name}</span>
                        <span className="text-xs text-gray-400">({formatFileSize(fileData.size)})</span>
                    </div>
                    <div className="flex justify-center w-full bg-black/5 rounded-lg overflow-hidden">
                        <video
                            src={fileData.url}
                            controls
                            className="w-full max-h-[70vh] rounded-lg"
                            style={{ maxWidth: '100%', height: 'auto' }}
                            preload="metadata"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div className="mt-3 text-center">
                        <a
                            href={fileData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                            <FontAwesomeIcon icon={faExternalLink} />
                            Open video in new tab
                        </a>
                    </div>
                </div>
            );
        }

        if (isAudio) {
            return (
                <div className="w-full break-words">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">🎵 {fileData.original_name}</span>
                        <span className="text-xs text-gray-400">({formatFileSize(fileData.size)})</span>
                    </div>
                    <div className="flex justify-center w-full bg-black/5 rounded-lg p-4">
                        <audio
                            src={fileData.url}
                            controls
                            className="w-full max-w-2xl"
                            style={{ width: '100%' }}
                            preload="metadata"
                        >
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                    <div className="mt-3 text-center">
                        <a
                            href={fileData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                            <FontAwesomeIcon icon={faExternalLink} />
                            Open audio in new tab
                        </a>
                    </div>
                </div>
            );
        }

        if (isPdf) {
            const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileData.url)}&embedded=true`;
            return (
                <div className="w-full break-words">
                    <div className="flex gap-3 mb-3 flex-wrap">
                        <a
                            href={fileData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                            <FontAwesomeIcon icon={faExternalLink} />
                            Open PDF in New Tab
                        </a>
                        <a
                            href={fileData.url}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                            Download PDF
                        </a>
                    </div>
                    <iframe
                        src={googleViewerUrl}
                        className="w-full h-[600px] rounded-lg border border-gray-200"
                        title={fileData.original_name}
                        style={{ backgroundColor: '#f9fafb' }}
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                    />
                </div>
            );
        }

        if (isHtml) {
            const raw = getMarkdownContent();
            const processed = detectAndProcessHtml(raw);
            return (
                <div className="w-full break-words" style={{ width: '100%' }}>
                    <HtmlDocPreview content={raw} title="HTML Preview" filename="preview.html" />
                </div>
            );
        }

        return (
            <div className="break-words w-full" style={{ width: '100%' }}>
                <MarkdownPreview
                    source={getMarkdownContent()}
                    style={{
                        ...markdownStyles,
                        backgroundColor: 'transparent',
                        fontSize: '15px',
                        color: '#1f2937',
                        width: '100%',
                    }}
                    wrapperElement={{
                        'data-color-mode': 'light',
                    }}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                />
            </div>
        );
    };

    const renderComment = (content: string) => {
        const processed = detectAndProcessHtml(content);
        if (processed.isHtml) {
            return (
                <div className="break-words w-full">
                    <HtmlDocPreview content={content} title="HTML Preview" filename="preview.html" />
                </div>
            );
        }

        const hasMarkdown = /^#{1,6}\s+/m.test(content) || hasMarkdownSyntax(content);

        return (
            <div className="break-words w-full">
                {hasMarkdown || content.includes('```') || content.includes('#') || content.includes('**') ? (
                    <div className="comment-content markdown-body">
                        <MarkdownPreview
                            source={content}
                            style={{
                                ...markdownStyles,
                                backgroundColor: 'transparent',
                                fontSize: '15px',
                                color: '#1f2937',
                            }}
                            wrapperElement={{
                                'data-color-mode': 'light',
                            }}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            disallowedElements={[]}
                        />
                    </div>
                ) : (
                    <div className="comment-content text-gray-800 whitespace-pre-wrap">
                        {content}
                    </div>
                )}
            </div>
        );
    };

    const renderSocialPost = (message: ConversationMessage) => {
    const content = message.query;
    const format = message.social_media_metadata?.format || message.format || 'markdown';
    const processed = detectAndProcessHtml(content);

    const formatDisplay = format === 'markdown' ? '📝 Markdown' : '🌐 HTML';

    return (
        <div className="break-words w-full">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
                {message.content_warning && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                        ⚠️ CW: {message.content_warning}
                    </span>
                )}
                {message.media_count !== undefined && message.media_count !== null && message.media_count > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                        📷 {message.media_count} media
                    </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                    {formatDisplay}
                </span>
            </div>

            {format === 'html' ? (
                <HtmlDocPreview content={content} title="HTML Preview" filename="preview.html" />
            ) : format === 'markdown' ? (
                <div className="social-post-content markdown-body">
                    <MarkdownPreview
                        source={content}
                        style={{
                            ...markdownStyles,
                            backgroundColor: 'transparent',
                            fontSize: '15px',
                            color: '#1f2937',
                        }}
                        wrapperElement={{
                            'data-color-mode': 'light',
                        }}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    />
                </div>
            ) : (
                <div className="social-post-content text-gray-800 whitespace-pre-wrap">
                    {content}
                </div>
            )}
        </div>
		);
	};

    const renderAIMessage = (message: ConversationMessage) => {
        if (message.message_role === 'user') {
            return (
                <div className="rounded-2xl px-4 py-3 bg-[#22c55e] text-white break-words">
                    <MarkdownPreview
                        source={message.query}
                        style={{
                            ...markdownStyles,
                            backgroundColor: 'transparent',
                            fontSize: '15px',
                            color: 'white',
                        }}
                        wrapperElement={{
                            'data-color-mode': 'light',
                        }}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    />
                </div>
            );
        } else {
            return (
                <div className="break-words markdown-body">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                        {message.model && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                Model: {message.model}
                            </span>
                        )}
                    </div>
                    <MarkdownPreview
                        source={message.response || ''}
                        style={{
                            ...markdownStyles,
                            backgroundColor: 'transparent',
                            fontSize: '15px',
                            color: '#1f2937',
                        }}
                        wrapperElement={{
                            'data-color-mode': 'light',
                        }}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    />
                </div>
            );
        }
    };

    const getMaskedUserInfo = (msg: ConversationMessage) => {
        let displayInfo = '';
        let ipDisplay = '';

        const ip = msg.ip_address || search.ip_address || '';
        if (ip) {
            ipDisplay = maskIPAddress(ip);
        }

        const userObj = msg.user || search.user || (currentUser?.id ? currentUser : null);
        if (userObj && userObj.email) {
            const email = userObj.email;
            const [localPart, domain] = email.split('@');
            const maskedLocal = (localPart || 'us').substring(0, 2) + '***';
            const domainParts = domain ? domain.split('.') : ['com'];
            const domainExt = domainParts[domainParts.length - 1] || 'com';
            const maskedDomain = '***' + domainExt;
            displayInfo = `${maskedLocal}@${maskedDomain}`;
        } else if (msg.user_name || search.user_name) {
            const name = msg.user_name || search.user_name || 'Guest';
            displayInfo = name.length > 2 ? name.substring(0, 2) + '***' : name;
        } else {
            displayInfo = 'Guest';
        }

        return { displayInfo, ipDisplay };
    };

    const renderMessage = (
        message: ConversationMessage,
        isCommentCard: boolean = false,
        isUserMsgRenderedSeparately: boolean = false
    ) => {
        if (message.status === 'hidden' && !isOwner && !isPrivateAccessGranted) {
            return null;
        }

        const isUser = message.message_role === 'user';
        const isCopied = copiedMessageId === message.id;
        const isSpecialContent =
            message.content_type === 'upload' ||
            message.content_type === 'comment' ||
            message.content_type === 'conversationcomment' ||
            message.content_type === 'embed' ||
            message.content_type === 'social' ||
            message.content_type === 'social_media';

        const { displayInfo, ipDisplay } = getMaskedUserInfo(message);
        const tokensCount = message.total_tokens || message.usage?.total_tokens || (message.response ? Math.max(100, Math.round(((message.query?.length || 0) + (message.response?.length || 0)) / 3.5)) : 0);
        const modelName = message.model || 'kimi-k3';

        // 1. Comment Card Format (for masonry grid)
        if (isCommentCard) {
            const isAi = message.content_type === 'ai' || !isUser;
            return (
                <div
                    id={`message-${message.slug}`}
                    key={message.id}
                    className="w-full scroll-mt-24 transition-all duration-200 group relative flex flex-col justify-between bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-gray-300 p-4 min-h-[220px] mb-6"
                >
                    <div className="flex items-start gap-3 mb-3">
                        <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-2xs ring-2 ring-white ${
                                isAi ? 'bg-[#a855f7] text-white' : 'bg-[#22c55e] text-white'
                            }`}
                        >
                            <FontAwesomeIcon icon={isAi ? faRobot : faUser} className="w-4 h-4 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="font-mono flex items-center gap-1.5 flex-wrap">
                                <span className="text-gray-400 text-[11px] font-sans">{isAi ? 'Model:' : 'User:'}</span>
                                <span className="font-semibold text-gray-800 text-[12px] truncate max-w-[130px]">
                                    {isAi ? modelName : (displayInfo || 'Guest')}
                                </span>
                            </div>
                            {ipDisplay && !isAi && (
                                <div className="font-mono text-gray-400 text-[11px]">
                                    <span className="text-gray-300">IP:</span> {ipDisplay}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => copyMessageToClipboard(message.id, message.response || message.query || '')}
                            className="text-gray-400 hover:text-[#22c55e] transition-colors p-1 rounded focus:outline-none cursor-pointer"
                            title="Copy"
                        >
                            <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex-1 min-w-0 mb-3 text-xs text-gray-800 leading-relaxed break-words">
                        {isAi ? (
                            <MarkdownPreview
                                source={message.response || message.query || ''}
                                style={{
                                    ...markdownStyles,
                                    backgroundColor: 'transparent',
                                    fontSize: '13px',
                                    color: '#1f2937',
                                }}
                                wrapperElement={{ 'data-color-mode': 'light' }}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            />
                        ) : (
                            <div className="whitespace-pre-wrap">{message.query}</div>
                        )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-100 w-full">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span>{formatDate(message.created_at)}</span>
                            {tokensCount > 0 && <span>{tokensCount} tokens</span>}
                        </div>

                        <MessageReactionsBar
                            messageId={message.id}
                            messageSlug={message.slug}
                            initialLikes={message.reaction_total || 0}
                            initialReactions={message.reaction_counts || {}}
                            initialComments={dbComments.filter(c => c.message_id === message.id || c.message_slug === message.slug).length}
                            onAddComment={async (text) => {
                                await handleCommentSubmit(message.slug, text);
                                fetchDbComments();
                            }}
                            onCommentAdded={() => {
                                fetchDbComments();
                            }}
                            onCommentDeleted={(commentId) => {
                                setDbComments(prev => prev.filter(c => c.id !== commentId));
                            }}
                            onReplyPost={async (content, mediaFiles, cw) => {
                                await handleReplySocialPost(content, mediaFiles, cw, message);
                                fetchDbComments();
                            }}
                            onReplyAskAI={async (question) => {
                                await handleReplyAskAI(question, message);
                                fetchDbComments();
                            }}
                            onReplyUpload={async (file, description) => {
                                await handleReplyFileUpload(file, description, message);
                                fetchDbComments();
                            }}
                            conversationId={search.conversation_id}
                            parentSlug={message.slug}
                            tooltips={tooltips}
                            currentUser={currentUser}
                            messageQuery={message.query}
                            messageResponse={message.response}
                            shareUrl={message.share_url}
                        />
                    </div>
                </div>
            );
        }

        // 2. Special Content Format (Upload, Social, Embed, Comment, Conversation Comment)
        if (isSpecialContent) {
            return (
                <div
                    id={`message-${message.slug}`}
                    key={message.id}
                    className="w-full scroll-mt-24 transition-all duration-200 group relative flex flex-col justify-between mb-6"
                >
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-2xs ring-2 ring-white bg-blue-500 text-white">
                            {message.content_type === 'upload' ? (
                                <FontAwesomeIcon icon={faImage} className="w-4 h-4 text-white" />
                            ) : message.content_type === 'embed' ? (
                                <FontAwesomeIcon icon={faCode} className="w-4 h-4 text-white" />
                            ) : message.content_type === 'conversationcomment' ? (
                                <FontAwesomeIcon icon={faComment} className="w-4 h-4 text-white" />
                            ) : message.content_type === 'comment' ? (
                                <FontAwesomeIcon icon={faComment} className="w-4 h-4 text-white" />
                            ) : (
                                <FontAwesomeIcon icon={faShareNodes} className="w-4 h-4 text-white" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            {displayInfo && (
                                <div className="text-xs text-gray-500 mb-1 font-mono">
                                    User: {displayInfo}
                                </div>
                            )}
                            <div className="flex-1 min-w-0 w-full mb-3">
                                {message.content_type === 'upload' && message.file_data ? (
                                    renderFileUpload(message.file_data)
                                ) : message.content_type === 'conversationcomment' ? (
                                    renderComment(message.query)
                                ) : message.content_type === 'comment' ? (
                                    renderComment(message.query)
                                ) : message.content_type === 'embed' ? (
                                    <div className="break-words w-full">
                                        <HtmlDocPreview content={message.query} title="Embed Row / Masonry Layout" filename="embed.html" />
                                    </div>
                                ) : (
                                    renderSocialPost(message)
                                )}
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                <span>{formatDate(message.created_at)}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => window.open(`/X/${encodeURIComponent(message.slug)}`, '_blank')}
                                        className="text-gray-400 hover:text-[#22c55e] transition-colors p-1 rounded focus:outline-none cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faExternalLink} className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => copyMessageToClipboard(message.id, message.query)}
                                        className={`text-gray-400 hover:text-[#22c55e] transition-colors p-1 rounded focus:outline-none cursor-pointer ${isCopied ? 'text-green-500' : ''}`}
                                    >
                                        <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <MessageReactionsBar
                                messageId={message.id}
                                messageSlug={message.slug}
                                initialLikes={message.reaction_total || 0}
                                initialReactions={message.reaction_counts || {}}
                                initialComments={dbComments.filter(c => c.message_id === message.id || c.message_slug === message.slug).length}
                                onAddComment={async (text) => {
                                    await handleCommentSubmit(message.slug, text);
                                    fetchDbComments();
                                }}
                                onCommentAdded={() => {
                                    fetchDbComments();
                                }}
                                onCommentDeleted={(commentId) => {
                                    setDbComments(prev => prev.filter(c => c.id !== commentId));
                                }}
                                onReplyPost={async (content, mediaFiles, cw) => {
                                    await handleReplySocialPost(content, mediaFiles, cw, message);
                                    fetchDbComments();
                                }}
                                onReplyAskAI={async (question) => {
                                    await handleReplyAskAI(question, message);
                                    fetchDbComments();
                                }}
                                onReplyUpload={async (file, description) => {
                                    await handleReplyFileUpload(file, description, message);
                                    fetchDbComments();
                                }}
                                conversationId={search.conversation_id}
                                parentSlug={message.slug}
                                tooltips={tooltips}
                                currentUser={currentUser}
                                messageQuery={message.query}
                                messageResponse={message.response}
                                shareUrl={message.share_url}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // 3. Main AI Conversation Format
        const shouldRenderUserPrompt = (isUser || !isUserMsgRenderedSeparately) && Boolean(message.query);
        const shouldRenderAIResponse = !isUser || Boolean(message.response);

        return (
            <div
                id={`message-${message.slug}`}
                key={message.id}
                className="w-full scroll-mt-24 transition-all duration-200"
            >
                {/* User Prompt Turn */}
                {shouldRenderUserPrompt && (
                    <div className="flex items-start gap-3 w-full">
                        {/* Green circular avatar */}
                        <div className="shrink-0 w-9 h-9 rounded-full bg-[#22c55e] flex items-center justify-center text-white shadow-2xs">
                            <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-white" />
                        </div>

                        {/* User info & Green Bubble */}
                        <div className="flex-1 min-w-0">
                            <div className="text-xs mb-1.5 space-y-0.5 select-none font-mono">
                                {displayInfo && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400 font-sans">User:</span>
                                        <span className="font-medium text-gray-700">{displayInfo}</span>
                                    </div>
                                )}
                                {ipDisplay && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400 font-sans">IP:</span>
                                        <span className="text-gray-500">{ipDisplay}</span>
                                    </div>
                                )}
                            </div>

                            {/* Green pill bubble */}
                            <div className="w-full bg-[#22c55e] text-white rounded-2xl px-5 py-3.5 break-words shadow-2xs">
                                <div className="text-white text-base sm:text-[15px] leading-relaxed [&_*]:text-white!">
                                    <MarkdownPreview
                                        source={message.query}
                                        style={{
                                            ...markdownStyles,
                                            backgroundColor: 'transparent',
                                            fontSize: '15px',
                                            color: '#ffffff',
                                        }}
                                        wrapperElement={{
                                            'data-color-mode': 'light',
                                        }}
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Response Turn */}
                {shouldRenderAIResponse && (
                    <div className={`border-l-2 border-gray-200/80 pl-4 sm:pl-5 ml-4.5 ${shouldRenderUserPrompt ? 'mt-6' : ''}`}>
                        <div className="flex items-start gap-3">
                            {/* Purple robot avatar */}
                            <div className="shrink-0 w-9 h-9 rounded-full bg-[#a855f7] flex items-center justify-center text-white shadow-2xs">
                                <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-white" />
                            </div>

                            {/* Content & Reactions */}
                            <div className="flex-1 min-w-0">
                                {/* Model Info Header */}
                                <div className="flex items-center gap-1 mb-1 select-none">
                                    <span className="text-xs text-gray-400 font-sans">Model:</span>
                                    <span className="text-xs font-mono font-medium text-gray-500">{modelName}</span>
                                </div>

                                {/* Response Markdown Text */}
                                <div className="text-gray-900 text-[15px] sm:text-base leading-relaxed break-words markdown-body mt-1">
                                    <MarkdownPreview
                                        source={message.response || ''}
                                        style={{
                                            ...markdownStyles,
                                            backgroundColor: 'transparent',
                                            fontSize: '15px',
                                            color: '#111827',
                                        }}
                                        wrapperElement={{
                                            'data-color-mode': 'light',
                                        }}
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                    />
                                </div>

                                {/* Message Hashtags */}
                                {parseHashtags(message.hashtag).length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                        {parseHashtags(message.hashtag).map((tag) => (
                                            <a
                                                key={tag}
                                                href={`/public/ai/history?searchhashtag=%23${encodeURIComponent(tag)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-full transition-colors"
                                            >
                                                #{tag}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Metadata Row */}
                                <div className="flex items-center justify-between text-xs text-gray-400 mt-4 mb-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-gray-400">
                                            {formatDate(message.created_at)}
                                        </span>
                                        {tokensCount > 0 && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-gray-400">
                                                    {tokensCount} tokens
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-gray-400 font-mono">
                                                    ${getCostEstimate(tokensCount)}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => window.open(`/X/${encodeURIComponent(message.slug)}`, '_blank')}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none cursor-pointer"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_permalink || "Open permanent link in new tab"}
                                        >
                                            <FontAwesomeIcon icon={faExternalLink} className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => copyMessageToClipboard(message.id, message.response || '')}
                                            className={`text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none cursor-pointer ${
                                                isCopied ? 'text-green-500' : ''
                                            }`}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={isCopied ? (tooltips?.ai_search_view_message_copied || "Copied!") : (tooltips?.ai_search_view_copy_message || "Copy this response")}
                                        >
                                            {isCopied ? (
                                                <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-green-500" />
                                            ) : (
                                                <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Message Reactions Bar */}
                                <MessageReactionsBar
                                    messageId={message.id}
                                    messageSlug={message.slug}
                                    initialLikes={message.reaction_total || 0}
                                    initialReactions={message.reaction_counts || {}}
                                    initialComments={dbComments.filter(c => c.message_id === message.id || c.message_slug === message.slug).length}
                                    onAddComment={async (text) => {
                                        await handleCommentSubmit(message.slug, text);
                                        fetchDbComments();
                                    }}
                                    onCommentAdded={() => {
                                        fetchDbComments();
                                    }}
                                    onCommentDeleted={(commentId) => {
                                        setDbComments(prev => prev.filter(c => c.id !== commentId));
                                    }}
                                    onReplyPost={async (content, mediaFiles, cw) => {
                                        await handleReplySocialPost(content, mediaFiles, cw, message);
                                        fetchDbComments();
                                    }}
                                    onReplyAskAI={async (question) => {
                                        await handleReplyAskAI(question, message);
                                        fetchDbComments();
                                    }}
                                    onReplyUpload={async (file, description) => {
                                        await handleReplyFileUpload(file, description, message);
                                        fetchDbComments();
                                    }}
                                    conversationId={search.conversation_id}
                                    parentSlug={message.slug}
                                    tooltips={tooltips}
                                    currentUser={currentUser}
                                    messageQuery={message.query}
                                    messageResponse={message.response}
                                    shareUrl={message.share_url}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const normalizeToFileData = (item: any): FileData => {
        if (typeof item === 'object' && item !== null && item.url) {
            const ext = item.extension || item.url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
            let mime = item.mime_type || '';
            if (!mime) {
                if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) mime = 'video/mp4';
                else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) mime = 'audio/mpeg';
                else if (ext === 'pdf') mime = 'application/pdf';
                else if (['html', 'htm'].includes(ext)) mime = 'text/html';
                else mime = 'image/jpeg';
            }
            return {
                original_name: item.original_name || item.name || `file.${ext || 'bin'}`,
                size: item.size || 0,
                mime_type: mime,
                extension: ext || 'bin',
                path: item.path || item.url,
                url: item.url,
                access_token: item.access_token,
                uploaded_at: item.uploaded_at,
                storage_disk: item.storage_disk || 'local',
                width: item.width,
                height: item.height,
            };
        }
        const urlStr = String(item || '');
        const ext = urlStr.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
        let mime = 'image/jpeg';
        if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) mime = 'video/mp4';
        else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) mime = 'audio/mpeg';
        else if (ext === 'pdf') mime = 'application/pdf';
        else if (['html', 'htm'].includes(ext)) mime = 'text/html';
        else if (urlStr.startsWith('data:video/')) mime = 'video/mp4';
        else if (urlStr.startsWith('data:audio/')) mime = 'audio/mpeg';
        else if (urlStr.startsWith('data:application/pdf')) mime = 'application/pdf';
        else if (urlStr.startsWith('data:image/')) mime = urlStr.substring(5, urlStr.indexOf(';'));

        const filename = urlStr.split('/').pop()?.split('?')[0] || `attachment.${ext || 'jpg'}`;
        return {
            original_name: filename,
            size: 0,
            mime_type: mime,
            extension: ext || 'jpg',
            path: urlStr,
            url: urlStr,
            storage_disk: 'local',
        };
    };

    const renderDbCommentCard = (c: any) => {
        const isAi = c.content_type === 'ai';
        const aiReply = c.ai_reply || dbComments.find((item: any) => item.parent_id === c.id && item.content_type === 'ai');
        const isAskAiCard = isAi || Boolean(aiReply);

        let userName = '';
        let userAvatar = '';
        let userTime = '';
        let userContent = '';
        let aiTime = '';
        let aiResponseContent = '';

        if (isAi && !aiReply) {
            if (c.parent) {
                userName = c.parent.user_name || 'Anonymous';
                userAvatar = c.parent.user_avatar;
                userTime = c.parent.created_at_formatted || 'Just now';
                userContent = c.parent.content || '';
            } else if (c.query) {
                userName = currentUser?.name || 'User';
                userAvatar = currentUser?.avatar;
                userTime = c.created_at_formatted || 'Just now';
                userContent = c.query;
            } else {
                userName = '';
                userContent = '';
            }
            aiTime = c.created_at_formatted || 'Just now';
            aiResponseContent = c.content || '';
        } else {
            userName = c.user_name || c.user?.name || 'Anonymous';
            userAvatar = c.user_avatar || c.user?.avatar;
            userTime = c.created_at_formatted || 'Just now';
            userContent = c.content || '';

            if (aiReply) {
                aiTime = aiReply.created_at_formatted || c.created_at_formatted || 'Just now';
                aiResponseContent = aiReply.content || '';
            }
        }

        const userInitial = (userName || 'U').charAt(0).toUpperCase();

        const copyFullExchange = () => {
            let textToCopy = '';
            if (isAskAiCard && (userContent || aiResponseContent)) {
                if (userContent && aiResponseContent) {
                    textToCopy = `User: ${userContent}\n\nAI Assistant: ${aiResponseContent}`;
                } else if (aiResponseContent) {
                    textToCopy = aiResponseContent;
                } else {
                    textToCopy = userContent;
                }
            } else {
                textToCopy = c.content || '';
            }
            copyMessageToClipboard(c.id, textToCopy);
        };

        return (
            <div
                key={`db-${c.id}`}
                className={`w-full rounded-2xl p-4 sm:p-5 border shadow-2xs hover:shadow-xs transition-all mb-4 group ${
                    c.is_owner
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-gray-200/90 hover:border-gray-300'
                }`}
            >
                {(userName || userContent || !isAi) && (
                    <>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                                {userAvatar ? (
                                    <img
                                        src={userAvatar}
                                        alt={userName}
                                        className="w-9 h-9 rounded-full object-cover border border-green-200 shrink-0"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-[#dcfce7] border border-[#86efac] text-[#15803d] flex items-center justify-center text-sm font-semibold shrink-0">
                                        {userInitial}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm tracking-tight truncate">
                                        {userName}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {userTime}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                                <button
                                    type="button"
                                    onClick={copyFullExchange}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded focus:outline-none cursor-pointer"
                                    title="Copy"
                                >
                                    <FontAwesomeIcon icon={copiedMessageId === c.id ? faCheckCircle : faCopy} className="w-3.5 h-3.5" />
                                </button>
                                {(c.is_owner || isOwner) && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteDbComment(c.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded focus:outline-none cursor-pointer"
                                        title="Delete Comment"
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Format, Media & Content Warning Badges */}
                        <div className="mb-2.5 flex items-center gap-2 flex-wrap">
                            {c.content_warning && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    ⚠️ CW: {c.content_warning}
                                </span>
                            )}
                            {Array.isArray(c.media) && c.media.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    📎 {c.media.length} {c.media.length === 1 ? 'file' : 'files'}
                                </span>
                            )}
                            {c.content_type === 'upload' && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    📁 Uploaded Media
                                </span>
                            )}
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {c.format === 'html' ? '🌐 HTML' : '📝 Markdown'}
                            </span>
                        </div>

                        {userContent && (
                            <div className="break-words w-full mb-3">
                                {(() => {
                                    const processed = detectAndProcessHtml(userContent);
                                    const isHtmlContent = c.format === 'html' || processed.isHtml;

                                    if (isHtmlContent && !isAskAiCard) {
                                        return (
                                            <HtmlDocPreview
                                                content={userContent}
                                                title="HTML Preview"
                                                filename="comment.html"
                                            />
                                        );
                                    }

                                    return (
                                        <div className="social-post-content markdown-body">
                                            <MarkdownPreview
                                                source={userContent}
                                                style={{
                                                    ...markdownStyles,
                                                    backgroundColor: 'transparent',
                                                    fontSize: '15px',
                                                    color: '#1f2937',
                                                }}
                                                wrapperElement={{
                                                    'data-color-mode': 'light',
                                                }}
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                            />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Uploaded Media & Attachments Preview (Same as Conversation) */}
                        {Array.isArray(c.media) && c.media.length > 0 && (
                            <div className="space-y-3 mb-4 w-full">
                                {c.media.map((mediaItem: any, mIdx: number) => {
                                    const fileData = normalizeToFileData(mediaItem);
                                    return (
                                        <div key={mIdx} className="w-full">
                                            {renderFileUpload(fileData)}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {!Array.isArray(c.media) && c.file_data && (
                            <div className="mb-4 w-full">
                                {renderFileUpload(c.file_data)}
                            </div>
                        )}
                    </>
                )}

                {isAskAiCard && (
                    <div className={userName || userContent ? "pt-1" : ""}>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[#a855f7] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900 text-sm tracking-tight">
                                            AI Assistant
                                        </span>
                                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#f3e8ff] text-[#9333ea] rounded-full inline-flex items-center">
                                            AI
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {aiTime}
                                    </p>
                                </div>
                            </div>

                            {!(userName || userContent) && (
                                <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                                    <button
                                        type="button"
                                        onClick={copyFullExchange}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded focus:outline-none cursor-pointer"
                                        title="Copy"
                                    >
                                        <FontAwesomeIcon icon={copiedMessageId === c.id ? faCheckCircle : faCopy} className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="text-sm text-gray-800 leading-relaxed break-words">
                            <MarkdownPreview
                                source={aiResponseContent}
                                style={{
                                    ...markdownStyles,
                                    backgroundColor: 'transparent',
                                    fontSize: '14px',
                                    color: '#1f2937',
                                }}
                                wrapperElement={{ 'data-color-mode': 'light' }}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Model Option Item Component
    const ModelOptionItem = ({ model, selectedModel, onSelect }: {
        model: ModelOption;
        selectedModel: ModelOption;
        onSelect: () => void;
    }) => {
        return (
            <button
                onClick={onSelect}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedModel.id === model.id ? 'bg-[#22c55e]/5' : ''
                }`}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                                selectedModel.id === model.id ? 'text-[#22c55e]' : 'text-gray-900'
                            }`}>
                                {model.name}
                            </span>
                            {model.isNew && (
                                <span className="text-[10px] font-semibold text-white bg-[#22c55e] px-1.5 py-0.5 rounded-full">
                                    NEW
                                </span>
                            )}
                        </div>
                        {model.description && (
                            <p className="text-xs text-gray-500 mt-0.5 max-w-[200px]">{model.description}</p>
                        )}
                    </div>
                    {selectedModel.id === model.id && (
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="flex-shrink-0 mt-1"
                        >
                            <path d="M20 6 9 17l-5-5"/>
                        </svg>
                    )}
                </div>
            </button>
        );
    };

    const ModelDropdown = () => (
        <div className="relative" ref={modelDropdownRef}>
            <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30"
                data-tooltip-id="main-tooltip"
                data-tooltip-content="Select AI model for your conversation"
            >
                <span className="text-sm font-medium text-gray-700">{selectedModel.name}</span>
                {selectedModel.isNew && (
                    <span className="text-[10px] font-semibold text-white bg-[#22c55e] px-1.5 py-0.5 rounded-full">
                        NEW
                    </span>
                )}
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-gray-500 transition-transform duration-200 ${showModelDropdown ? 'rotate-180' : ''}`}
                >
                    <path d="m6 9 6 6 6-6"/>
                </svg>
            </button>

            {showModelDropdown && (
                <div className="absolute left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Model</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {modelOptions.map((model) => (
                            <ModelOptionItem
                                key={model.id}
                                model={model}
                                selectedModel={selectedModel}
                                onSelect={() => {
                                    setSelectedModel(model);
                                    setShowModelDropdown(false);
                                }}
                            />
                        ))}
                    </div>

                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            Powered by Moonshot AI, OpenAI, DeepSeek, Perplexity & Google Gemini • {modelOptions.length} models available
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderUploadDropZone = () => {
        if (!canInteract) {
            return (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-2">Login required to upload files</p>
                    <button
                        onClick={() => setShowLoginPrompt(true)}
                        className="inline-block px-6 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors text-sm font-medium"
                    >
                        Login to Access
                    </button>
                </div>
            );
        }

        const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-[#22c55e]"
                        >
                            <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Upload Media to Conversation</span>
                        <button
                            type="button"
                            onClick={() => {
                                const unsupported = getUnsupportedFileTypes().join(', ');
                                showAlert(`❌ Unsupported file types: ${unsupported}\n\n✅ Supported: Images (JPG, PNG, GIF, WEBP), PDF, Video (MP4, WEBM, OGG), Audio (MP3, WAV, OGG), HTML files only.\n📦 Max size: 100MB per file`, 'info');
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
                        >
                            What's supported?
                        </button>
                    </div>
                    <span className="text-xs text-gray-400">Up to 100MB per file</span>
                </div>

                {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 flex items-center gap-2 whitespace-pre-wrap">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 flex-shrink-0" />
                            <span>{uploadError}</span>
                        </p>
                    </div>
                )}

                {selectedFiles.length === 0 ? (
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                            isDragging
                                ? 'border-[#22c55e] bg-green-50/50 scale-[0.99]'
                                : 'border-gray-300 hover:border-[#22c55e] bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(false);
                            if (e.dataTransfer.files?.length) {
                                processFiles(e.dataTransfer.files);
                            }
                        }}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content="Click to upload multiple files or drag & drop"
                    >
                        <div className="flex flex-col items-center">
                            <svg className={`w-12 h-12 mb-3 transition-colors ${isDragging ? 'text-[#22c55e]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-[#22c55e]">Click to upload multiple files</span> or drag & drop
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                ✅ Images (JPG, PNG, GIF, WEBP) • PDF • Video (MP4, WEBM, OGG) • Audio (MP3, WAV, OGG) • HTML
                            </p>
                            <p className="text-xs text-red-400 mt-1">
                                ❌ Not supported: Markdown (.md), Archives (.zip, .rar), Executables, Spreadsheets, etc.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Select one or multiple files at once (up to 100MB each)
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <div className="text-xs font-medium text-gray-600">
                                <span className="text-[#22c55e] font-semibold">{selectedFiles.length}</span> {selectedFiles.length === 1 ? 'file' : 'files'} selected ({formatFileSize(totalSize)})
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs font-medium text-[#22c55e] hover:text-[#16a34a] flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-green-50"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    Add More
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFiles([]);
                                        setUploadError(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        <div
                            className={`max-h-64 overflow-y-auto space-y-2 p-2 bg-gray-50/80 rounded-xl border ${
                                isDragging ? 'border-[#22c55e] bg-green-50/30' : 'border-gray-200'
                            }`}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragging(false);
                                if (e.dataTransfer.files?.length) {
                                    processFiles(e.dataTransfer.files);
                                }
                            }}
                        >
                            {selectedFiles.map((fileObj, idx) => (
                                <div
                                    key={`${fileObj.name}-${idx}`}
                                    className="relative flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm transition-all"
                                >
                                    <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex-shrink-0 overflow-hidden">
                                            {fileObj.type.startsWith('image/') && fileObj.data ? (
                                                <img
                                                    src={fileObj.data}
                                                    alt={fileObj.name}
                                                    className="w-10 h-10 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <FontAwesomeIcon icon={getFileIcon(fileObj.type, fileObj.name)} className="text-white text-lg" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-gray-900 truncate" title={fileObj.name}>
                                                {fileObj.name}
                                            </p>
                                            <p className="text-[11px] text-gray-400">
                                                {formatFileSize(fileObj.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors flex-shrink-0"
                                        title="Remove file"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <input
                            type="text"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder="Add an optional description for these files..."
                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                        />

                        <button
                            onClick={handleFileUploadForConversation}
                            disabled={isUploading || selectedFiles.length === 0}
                            className="w-full px-4 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Upload files to the conversation"
                        >
                            {isUploading ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    <span>Uploading {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faUpload} />
                                    <span>Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,.pdf,video/*,audio/*,.mp4,.webm,.ogg,.mp3,.wav,.mov,.avi,.m4a,.html,.htm"
                    onChange={handleFileChange}
                />
            </div>
        );
    };

    /**
     * ══════════════════════════════════════════════════════════════
     * 🔽 EMBED CONTENT TAB — Now uses InlineEmbedBuilder
     * ══════════════════════════════════════════════════════════════
     * The EmbedRow builder previously lived inside a modal popup.
     * Here we render it inline — replacing the previous EnhancedMDEditor
     * usage — so the whole builder (slots, layout, live preview, code
     * generator, "Convo" button) is visible directly on the page.
     * ══════════════════════════════════════════════════════════════
     */
    const renderCommentsSection = () => {
        if (!canInteract) {
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-2">Login required to add comments</p>
                    <button
                        onClick={() => setShowLoginPrompt(true)}
                        className="inline-block px-6 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors text-sm font-medium"
                    >
                        Login to Access
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Button to open the popup modal instead of inline builder */}
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <FontAwesomeIcon icon={faCode} className="text-2xl text-[#22c55e]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Embed Row & Masonry Builder</h3>
                    <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                        Create beautiful rows, carousels, or masonry layouts with your embed snippets.
                    </p>
                    <button
                        onClick={() => setIsEmbedModalOpen(true)}
                        className="px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faCode} />
                        Open Embed Builder
                    </button>
                </div>
            </div>
        );
    };

    const renderSocialMediaComposer = () => {
        return (
            <SocialMediaComposer
                onPost={handleSocialPost}
                className="w-full"
                conversationId={search.conversation_id}
                contentFormat={contentFormat}
            />
        );
    };

    const renderSocialPanel = () => {
        if (!canInteract) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M4 4v16h16V4H4z M8 9h8 M8 13h6 M8 17h4"/>
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {tooltips?.ai_search_view_login_required || "Login Required"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {tooltips?.ai_search_view_login_to_post || "Please log in to create content posts"}
                    </p>
                    <button
                        onClick={() => setShowLoginPrompt(true)}
                        className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors font-medium"
                    >
                        {tooltips?.ai_search_view_login || "Log In"}
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 mb-3 border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => {
                                setContentFormat('markdown');
                                setContentSubTab('composer');
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                contentFormat === 'markdown'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Use Markdown formatting"
                        >
                            Markdown
                        </button>
                        <button
                            onClick={() => {
                                setContentFormat('html');
                                setContentSubTab('composer');
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                contentFormat === 'html'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Use HTML formatting"
                        >
                            HTML
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200" />

                    <button
                        onClick={() => setContentSubTab('upload')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                            contentSubTab === 'upload'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content="Upload files (Images, PDF, Video, Audio, HTML up to 100MB)"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Upload Media
                    </button>

                    <button
                        onClick={() => setContentSubTab('embed')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                            contentSubTab === 'embed'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content="Post Embed Content"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Embed Content
                    </button>
                </div>

                <div className="mt-3">
                    {contentSubTab === 'upload' ? renderUploadDropZone() :
                     contentSubTab === 'embed' ? renderCommentsSection() :
                     renderSocialMediaComposer()}
                </div>
            </div>
        );
    };

    const renderInputTabs = () => {
        const canInteractWithFeatures = hasAccess && canInteract;

        if (!hasAccess) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faLock} className="text-2xl text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {conversationStatus === 'private'
                            ? (tooltips?.ai_search_view_private_conversation || "Private Conversation")
                            : (tooltips?.ai_search_view_access_required || "Access Required")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {conversationStatus === 'private'
                            ? "This is a private conversation. Please request access to continue."
                            : "You don't have permission to interact with this conversation."}
                    </p>
                    {conversationStatus === 'private' && (
                        <button
                            onClick={() => setShowPrivateAccessModal(true)}
                            className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors font-medium"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={tooltips?.ai_search_view_request_access || "Request access to this private conversation"}
                        >
                            Request Access
                        </button>
                    )}
                </div>
            );
        }

        if (!canInteract) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 8v4"/>
                            <path d="M12 16h.01"/>
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {tooltips?.ai_search_view_login_required || "Login Required"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {tooltips?.ai_search_view_login_to_interact || "Please log in to ask AI, post comments, upload files, and create content posts."}
                    </p>
                    <button
                        onClick={() => setShowLoginPrompt(true)}
                        className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors font-medium"
                    >
                        {tooltips?.ai_search_view_login || "Log In"}
                    </button>
                    <button
                        onClick={() => setShowLoginPrompt(false)}
                        className="ml-3 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                        {tooltips?.ai_search_view_cancel || "Cancel"}
                    </button>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 p-2 sm:p-4 border-b border-gray-200 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap">
                    <button
                        onClick={() => {
                            setActiveTab('social');
                            setContentSubTab('composer');
                        }}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                            activeTab === 'social'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={tooltips?.ai_search_view_social_post || "Create content with Markdown or HTML"}
                    >
                        <div className="flex items-center space-x-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                            </svg>
                            <span>Social & Upload</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('text')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                            activeTab === 'text'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={tooltips?.ai_search_view_ask_ai || "Ask AI a question"}
                    >
                        <div className="flex items-center space-x-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v8H3v-8a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-1.01-1-1.73a2 2 0 0 1 2-2Z"/>
                                <path d="M9 12h6"/>
                                <path d="M12 9v6"/>
                            </svg>
                            <span>Ask AI</span>
                        </div>
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'social' && renderSocialPanel()}

                    {activeTab === 'text' && (
                        <form onSubmit={(e) => handleAskQuestion(e)}>
                            {isAiDisabled ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M12 8v4"/>
                                            <path d="M12 16h.01"/>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">{tooltips?.ai_search_view_disabled || "Ask AI Disabled"}</h3>
                                    <p className="text-yellow-700">
                                        Ask AI is currently disabled for {currentUser ? 'logged-in users' : 'guests'}.
                                        Please try again later.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <textarea
                                            ref={textareaRef}
                                            value={newQuestion}
                                            onChange={(e) => {
                                                const text = e.target.value;
                                                if (maxChars === 0) {
                                                    setCharCountError(tooltips?.ai_search_view_disabled || 'Ask AI is disabled');
                                                } else if (text.length <= maxChars) {
                                                    setNewQuestion(text);
                                                    setCharCountError('');
                                                } else {
                                                    setCharCountError((tooltips?.ai_search_view_question_too_long || "Maximum {max} characters allowed").replace('{max}', maxChars.toString()));
                                                }
                                            }}
                                            onKeyDown={handleKeyDown}
                                            placeholder={maxChars === 0 ? (tooltips?.ai_search_view_disabled || "Ask AI is disabled") : (tooltips?.ai_search_view_question_placeholder || "Ask a follow-up question... (Max {max} chars, Press Enter to send, Shift+Enter for new line)").replace('{max}', maxChars.toString())}
                                            className={`w-full bg-gray-50 border ${
                                                newQuestion.length > maxChars || charCountError
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-gray-200 focus:ring-[#22c55e]'
                                            } rounded-lg py-3 px-4 pr-32 text-sm focus:outline-none focus:ring-2 focus:border-transparent min-h-[100px] resize-y`}
                                            disabled={isAsking || maxChars === 0}
                                            rows={3}
                                            maxLength={maxChars === 0 ? 0 : maxChars}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={maxChars === 0 ? (tooltips?.ai_search_view_disabled || "Ask AI is disabled") : (tooltips?.ai_search_view_characters_remaining || "Maximum {max} characters. You have {remaining} remaining.").replace('{max}', maxChars.toString()).replace('{remaining}', (maxChars - newQuestion.length).toString())}
                                        />

                                        {maxChars > 0 && (
                                            <div className="absolute bottom-3 right-3 text-xs">
                                                <span className={`${newQuestion.length > maxChars ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                    {newQuestion.length}/{maxChars}
                                                </span>
                                            </div>
                                        )}

                                        <div className="absolute bottom-3 right-16">
                                            <button
                                                type="submit"
                                                disabled={!newQuestion.trim() || isAsking || newQuestion.length > maxChars || maxChars === 0}
                                                className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={
                                                    maxChars === 0 ? (tooltips?.ai_search_view_disabled || "Ask AI is disabled") :
                                                    !newQuestion.trim() ? (tooltips?.ai_search_view_type_question || "Type a question first") :
                                                    newQuestion.length > maxChars ? (tooltips?.ai_search_view_question_too_long || "Question too long (max {max} chars)").replace('{max}', maxChars.toString()) :
                                                    isAsking ? (tooltips?.ai_search_view_ai_thinking || "AI is thinking...") :
                                                    (tooltips?.ai_search_view_send_question || "Send your question to AI")
                                                }
                                            >
                                                {isAsking ? (
                                                    <>
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                        <span>Asking...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faRobot} />
                                                        <span>Ask AI</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                                        <div className="flex items-center space-x-4">
                                            <span
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={tooltips?.ai_search_view_press_enter || "Press Enter to send your message"}
                                            >
                                                Press Enter to send
                                            </span>
                                            <span>•</span>
                                            <span
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={tooltips?.ai_search_view_shift_enter || "Use Shift+Enter to add a new line"}
                                            >
                                                Shift+Enter for new line
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span
                                                className={`${newQuestion.length > maxChars ? 'text-red-500 font-semibold' : ''}`}
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={
                                                    maxChars === 0 ? (tooltips?.ai_search_view_disabled || "Ask AI is disabled") :
                                                    currentUser
                                                        ? (tooltips?.ai_search_view_char_remaining || "You have {remaining} characters remaining").replace('{remaining}', (maxChars - newQuestion.length).toString())
                                                        : (tooltips?.ai_search_view_login_for_more || "Login for up to {limit} characters").replace('{limit}', (aiSettings?.user_char_limit || 2000).toString())
                                                }
                                            >
                                                {maxChars === 0 ? 'Disabled' :
                                                    newQuestion.length > maxChars
                                                        ? (tooltips?.ai_search_view_exceeded_by || "⚠️ Exceeded by {count}").replace('{count}', (newQuestion.length - maxChars).toString())
                                                        : (tooltips?.ai_search_view_char_count || "{current}/{max} chars").replace('{current}', newQuestion.length.toString()).replace('{max}', maxChars.toString())}
                                            </span>
                                        </div>
                                    </div>

                                    {charCountError && (
                                        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4" />
                                            {charCountError}
                                        </div>
                                    )}
                                </>
                            )}
                        </form>
                    )}
                </div>
            </div>
        );
    };

    const renderPrivateAccessModal = () => {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={handleClosePrivateAccessModal}
                />

                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
                        <button
                            onClick={handleClosePrivateAccessModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Close"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FontAwesomeIcon icon={faLock} className="text-2xl text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Private Conversation
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {accessRequestStep === 'request'
                                    ? 'This conversation is private. Enter your email to request access.'
                                    : 'Check your email for the access code.'}
                            </p>
                        </div>

                        {accessRequestStep === 'request' ? (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={accessEmail}
                                        onChange={(e) => setAccessEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleRequestPrivateAccess();
                                            }
                                        }}
                                        disabled={isRequestingAccess}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Enter your email address to receive access code"
                                    />
                                </div>

                                <button
                                    onClick={handleRequestPrivateAccess}
                                    disabled={isRequestingAccess || !accessEmail}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={!accessEmail ? "Please enter your email" : "Request access code"}
                                >
                                    {isRequestingAccess ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faEnvelope} />
                                            Request Access
                                        </>
                                    )}
                                </button>

                                <div className="relative mt-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">
                                            Already have an access code?
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (!accessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accessEmail)) {
                                            setErrorMessage('Please enter your email address first');
                                            return;
                                        }
                                        setRequestedEmail(accessEmail);
                                        setAccessRequestStep('verify');
                                        setAccessNumber('');
                                        setErrorMessage('');
                                        setTimeout(() => {
                                            otpInputRefs.current[0]?.focus();
                                        }, 100);
                                    }}
                                    disabled={!accessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accessEmail)}
                                    className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={!accessEmail ? "Please enter your email first" : "Enter your access code"}
                                >
                                    <FontAwesomeIcon icon={faKey} />
                                    I already have an access code
                                </button>

                                <p className="text-xs text-center text-gray-500 mt-4">
                                    We'll send a 4-digit access code to your email.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Access Code
                                    </label>
                                    <div className="flex gap-3 justify-center">
                                        {[0, 1, 2, 3].map((index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (otpInputRefs.current[index] = el)}
                                                type="text"
                                                value={accessNumber[index] || ''}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="•"
                                                maxLength={1}
                                                className="w-16 h-20 text-3xl text-center bg-white border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors font-mono"
                                                disabled={isVerifyingAccess}
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Enter the 4-digit code sent to your email"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-3 text-center">
                                        Code sent to: <span className="font-medium">{requestedEmail || accessEmail}</span>
                                    </p>
                                </div>

                                <button
                                    onClick={handleVerifyPrivateAccess}
                                    disabled={isVerifyingAccess || accessNumber.length !== 4}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={accessNumber.length !== 4 ? "Please enter the 4-digit code" : "Verify your access code"}
                                >
                                    {isVerifyingAccess ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faKey} />
                                            Verify Access
                                        </>
                                    )}
                                </button>

                                <div className="flex gap-3 mt-3">
                                    <button
                                        onClick={() => {
                                            setAccessRequestStep('request');
                                            setAccessNumber('');
                                            setErrorMessage('');
                                        }}
                                        className="flex-1 text-sm text-purple-600 hover:text-purple-700 font-medium py-2"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Request a new access code"
                                    >
                                        Didn't receive code?
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAccessRequestStep('request');
                                            setAccessEmail('');
                                            setAccessNumber('');
                                            setErrorMessage('');
                                            setRequestedEmail('');
                                        }}
                                        className="flex-1 text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Use a different email"
                                    >
                                        Use different email
                                    </button>
                                </div>
                            </>
                        )}

                        {errorMessage && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                {errorMessage}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
                                {successMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isCheckingAccess) {
        return (
            <>
                <Head title="Checking Access..." />
                <div className="min-h-screen bg-[#FCFCFC] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#22c55e] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">{tooltips?.ai_search_view_loading_more || "Checking access permissions..."}</p>
                    </div>
                </div>
            </>
        );
    }

    if (!hasAccess && !showPrivateAccessModal) {
        return (
            <>
                <Head title="Access Denied | Ez.wiki" />
                <div className="min-h-screen bg-[#FCFCFC] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-md w-full p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            {conversationStatus === 'hidden' ? (
                                <FontAwesomeIcon icon={faEyeSlash} className="text-3xl text-red-600" />
                            ) : (
                                <FontAwesomeIcon icon={faUserLock} className="text-3xl text-red-600" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            {conversationStatus === 'hidden' ? (tooltips?.ai_search_view_hidden_conversation || 'Conversation Hidden') :
                             requiresLogin ? (tooltips?.ai_search_view_login_required || 'Login Required') :
                             (tooltips?.ai_search_view_private_conversation || 'Access Denied')}
                        </h1>
                        <p className="text-gray-600 mb-6">
                            {accessDeniedMessage ||
                             (requiresLogin ? 'The owner of this conversation has disabled guest interaction. Please log in to continue.' :
                              conversationStatus === 'hidden' ? 'This conversation has been hidden and is not available for viewing.' :
                              'You do not have permission to view this conversation.')}
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/"
                                className="block w-full px-4 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors font-medium"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={tooltips?.ai_search_view_go_homepage || "Go to homepage"}
                            >
                                Go to Homepage
                            </Link>
                            {(conversationStatus === 'private' || requiresLogin) && !currentUser && (
                                <Link
                                    href="/login"
                                    className="block w-full px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={tooltips?.ai_search_view_login || "Log In"}
                                >
                                    Log In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`${currentConversationTitle} | Ez.wiki AI Conversation`} />
            <Tooltip
                id="main-tooltip"
                place="top"
                className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[100] !shadow-xl"
                effect="solid"
            />

            {auth?.user && (
                <DraggableMenu
                    auth={auth}
                    parentSlug={search.slug}
                    conversationId={search.conversation_id}
                    onChildConvoCreated={async (html: string, contentType?: string) => {
                        await handleCommentSubmit(undefined, html, contentType || 'embed');
                    }}
                />
            )}

            <div className="min-h-screen bg-[#FCFCFC] text-slate-800">
                {showPrivateAccessModal && renderPrivateAccessModal()}

                {successAlert && (
                    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-4xl w-full px-4 animate-slideDown">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-xl shadow-lg p-4 backdrop-blur-sm relative pr-12">
                            <button
                                onClick={() => {
                                    setSuccessAlert(null);
                                    setSavedTheme(null);
                                }}
                                className="absolute top-4 right-4 text-green-600 hover:text-green-800 transition-colors"
                                aria-label="Close alert"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={tooltips?.ai_search_view_close_alert || "Close notification"}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                            {successAlert}
                        </div>
                    </div>
                )}

                {errorMessage && !customAlert.show && (
                    <div
                        className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={tooltips?.ai_search_view_error_notification || "Error notification"}
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {errorMessage}
                    </div>
                )}

                {successMessage && !showPrivateAccessModal && !customAlert.show && (
                    <div
                        className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={tooltips?.ai_search_view_success_notification || "Success notification"}
                    >
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                        {successMessage}
                    </div>
                )}

                {showLoginPrompt && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div
                            className="fixed inset-0 bg-black/50 transition-opacity"
                            onClick={() => setShowLoginPrompt(false)}
                        />

                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
                                <button
                                    onClick={() => setShowLoginPrompt(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={tooltips?.ai_search_view_login_prompt_close || "Close"}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </button>

                                <div className="mb-6 text-center">
                                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M12 8v4"/>
                                            <path d="M12 16h.01"/>
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {tooltips?.ai_search_view_login_required || "Login Required"}
                                    </h3>
                                    <p className="text-gray-600">
                                        {tooltips?.ai_search_view_login_to_interact || "Please log in to ask AI, post comments, upload files, and create content posts."}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Link
                                        href="/login"
                                        className="block w-full px-4 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors font-medium text-center"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_login || "Log In"}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block w-full px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium text-center"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_create_account || "Create Account"}
                                    >
                                        Create Account
                                    </Link>
                                    <button
                                        onClick={() => setShowLoginPrompt(false)}
                                        className="block w-full px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors font-medium text-center"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_login_prompt_close || "Close"}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <header className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm w-full">
                    <div className="w-full mx-auto px-2 lg:px-4 py-2 sm:py-4">
                        <div className="flex items-center justify-between w-full">

                            <div className="flex items-center space-x-1 sm:space-x-4 lg:ml-[15%]">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                                        className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm"
                                    >
                                        <FontAwesomeIcon icon={isSidebarVisible ? faChevronLeft : faChevronRight} className="text-[10px]" />
                                    </button>

                                    <button
                                        onClick={() => setIsBannerVisible(!isBannerVisible)}
                                        className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm"
                                    >
                                        <FontAwesomeIcon icon={isBannerVisible ? faChevronUp : faChevronDown} className="text-[10px]" />
                                    </button>
                                </div>

                                <a
                                    href="https://ez.wiki/aihome"
                                    className="flex items-center space-x-1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img src="/ezlogo.png" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                                    <span className="text-sm sm:text-xl font-bold text-gray-900">
                                        Ez<span className="hidden sm:inline">.wiki</span>
                                    </span>
                                </a>
                            </div>

                            <div className="flex items-center space-x-1 sm:space-x-3">
                                <div className="transform scale-90 sm:scale-100 origin-right">
                                    <ModelDropdown />
                                </div>

                                <button
                                    onClick={handleExpressDomainClick}
                                    className="w-9 h-9 sm:w-auto sm:px-4 sm:py-2 bg-green-500 text-white rounded-lg flex items-center justify-center sm:space-x-2 shadow-sm"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="EXPRESS DOMAIN"
                                >
                                    <FontAwesomeIcon icon={faStore} className="text-sm" />
                                    <span className="hidden sm:inline text-xs font-bold">EXPRESS DOMAIN</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setShareModalTab('share');
                                        setShowShareModal(true);
                                    }}
                                    className="w-9 h-9 sm:w-auto sm:px-4 sm:py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center justify-center sm:space-x-2 border border-gray-200"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Share conversation"
                                >
                                    <FontAwesomeIcon icon={faShareNodes} className="text-sm text-green-600" />
                                    <span className="hidden sm:inline text-xs font-medium">Share</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setShareModalTab('embed');
                                        setShowShareModal(true);
                                    }}
                                    className="w-9 h-9 sm:w-auto sm:px-4 sm:py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg flex items-center justify-center sm:space-x-2 border border-indigo-200"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Get Embed Code"
                                >
                                    <FontAwesomeIcon icon={faCode} className="text-sm text-indigo-600" />
                                    <span className="hidden sm:inline text-xs font-medium">Embed</span>
                                </button>

                                <button
                                    onClick={copyToClipboard}
                                    className="w-9 h-9 sm:w-auto sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center sm:space-x-2 border border-gray-200"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Copy Link"
                                >
                                    <FontAwesomeIcon icon={faCopy} className="text-sm" />
                                    <span className="hidden sm:inline text-xs font-medium">{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>

                                <button
                                    onClick={() => setIsEmbedModalOpen(true)}
                                    className="w-9 h-9 sm:w-auto sm:px-4 sm:py-2 bg-[#22c55e] text-white rounded-lg flex items-center justify-center sm:space-x-2 shadow-sm"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Create New Embed Conversation"
                                >
                                    <FontAwesomeIcon icon={faStar} className="text-sm" />
                                    <span className="hidden sm:inline text-xs font-medium">New</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {showEmailModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div
                            className="fixed inset-0 bg-black/50 transition-opacity"
                            onClick={handleCloseModal}
                        />

                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative bg-white rounded-xl shadow-xl max-md w-full p-6 transform transition-all">
                                <button
                                    onClick={handleCloseModal}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={tooltips?.ai_search_view_close_modal || "Close modal"}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </button>

                                <div className="mb-6">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                                            <circle cx="12" cy="12" r="3"/>
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.05.05A10 10 0 0 0 12 17.66a10 10 0 0 0 6.24-2.28l.05-.05Z"/>
                                            <path d="M6.3 8.7 7.7 7.3"/>
                                            <path d="M17.7 8.7 16.3 7.3"/>
                                            <path d="M9 5 8 3"/>
                                            <path d="M15 5 16 3"/>
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {tooltips?.ai_search_view_save_theme || "Save to eztheme"}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Enter your email address to save this conversation to your eztheme collection.
                                    </p>
                                </div>

                                <form onSubmit={handleEmailSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            ref={emailInputRef}
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setEmailError('');
                                            }}
                                            placeholder="you@example.com"
                                            className={`w-full px-4 py-2.5 border ${
                                                emailError ? 'border-red-500' : 'border-gray-300'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors`}
                                            disabled={isEzthemeLoading}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_save_theme_email || "Enter your email to receive theme access"}
                                        />
                                        {emailError && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {emailError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                            disabled={isEzthemeLoading}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_cancel || "Cancel and close"}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isEzthemeLoading || !email.trim()}
                                            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center space-x-2"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={!email.trim() ? (tooltips?.ai_search_view_theme_email_required || "Email is required") : (tooltips?.ai_search_view_save_theme_button || "Save this conversation as a theme")}
                                        >
                                            {isEzthemeLoading ? (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                                                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                                    </svg>
                                                    <span>{tooltips?.ai_search_view_saving_theme || "Saving..."}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"/>
                                                    </svg>
                                                    <span>{tooltips?.ai_search_view_save_theme || "Save Theme"}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>

                                <p className="mt-4 text-xs text-center text-gray-500">
                                    We'll send you a confirmation email. You can unsubscribe at any time.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isExpressDomainOpen && (
                    <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full relative max-h-[90vh] overflow-y-auto border border-gray-200">
                            <button
                                onClick={handleCloseExpressDomain}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={tooltips?.ai_search_view_close_express || "Close express domain modal"}
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                            </button>

                            <div className="p-8">
                                <div className="text-center mb-10">
                                    <div
                                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-4"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_express_domain_service || "Express Domain Service"}
                                    >
                                        <FontAwesomeIcon icon={faStore} className="text-2xl text-green-600" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-3">{tooltips?.ai_search_view_express_domain || "Get Your Express Domain"}</h3>
                                    <p className="text-gray-600 text-lg">{tooltips?.ai_search_view_express_domain_description || "Choose your preferred option to establish your Web3 presence"}</p>
                                </div>

                                {purchaseSuccess.success && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl relative">
                                        <button
                                            onClick={() => setPurchaseSuccess({ success: false, message: '', url: '' })}
                                            className="absolute top-4 right-4 text-green-600 hover:text-green-800 transition-colors"
                                            aria-label="Close alert"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_close_success || "Close success notification"}
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
                                                data-tooltip-content={tooltips?.ai_search_view_purchase_successful || "Visit your new domain"}
                                            >
                                                {purchaseSuccess.url}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center items-center gap-4 mb-10">
                                    <button
                                        onClick={() => handleOptionChange('domain')}
                                        className={`flex items-center justify-center py-3 px-8 rounded-xl shadow-sm font-semibold transition-all ${
                                            activeOption === 'domain'
                                                ? 'bg-green-500 text-white shadow-md shadow-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_brand_domain || "Get a full domain name (yourbrand.domain)"}
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
                                                    checkAvailability();
                                                }
                                            }}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_enter_brand || "Enter your desired brand name or handle"}
                                        />
                                    </div>

                                    <div className="relative w-full md:w-2/5">
                                        <select
                                            className="w-full bg-gray-50 text-gray-900 py-4 px-6 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                                            value={selectedDomain}
                                            onChange={(e) => setSelectedDomain(e.target.value)}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_select_domain || "Select a domain extension"}
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
                                        onClick={checkAvailability}
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
                                            !brandInput ? (tooltips?.ai_search_view_enter_brand_first || "Enter a brand name first") :
                                            availabilityStatus.checking ? (tooltips?.ai_search_view_checking || "Checking availability...") :
                                            availabilityStatus.available ? (tooltips?.ai_search_view_available || "Domain is available!") :
                                            (tooltips?.ai_search_view_check_availability || "Check if your domain is available")
                                        }
                                    >
                                        <span>
                                            {availabilityStatus.checking
                                                ? (tooltips?.ai_search_view_checking || 'Checking...')
                                                : availabilityStatus.available !== null
                                                    ? (availabilityStatus.available
                                                        ? (tooltips?.ai_search_view_available || 'Available ✓')
                                                        : (tooltips?.ai_search_view_unavailable || 'Unavailable ✗'))
                                                    : (tooltips?.ai_search_view_check_availability || 'Check Availability')
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
                                                    {availabilityStatus.message || (tooltips?.ai_search_view_checking || "Checking availability...")}
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

                                        {availabilityStatus.available && codepage && (
                                            <div className="relative mb-8 overflow-hidden rounded-2xl">
                                                <div
                                                    dangerouslySetInnerHTML={{ __html: codepage }}
                                                    className="w-full [&_*]:max-w-full [&_img]:w-full [&_img]:h-auto [&_img]:object-contain [&_iframe]:w-full [&_iframe]:h-auto [&_iframe]:aspect-video"
                                                />
                                            </div>
                                        )}

                                        {availabilityStatus.available && availabilityStatus.price !== undefined && (
                                            <div className="mt-8 max-w-2xl mx-auto">
                                                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 mb-6">
                                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500 mb-1">Your domain will be:</p>
                                                            <p
                                                                className="text-2xl font-bold text-gray-900"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content={tooltips?.ai_search_view_your_domain || "Your new domain"}
                                                            >
                                                                {brandInput.trim()}.{selectedDomain}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span
                                                                className="text-sm text-gray-500"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content={(tooltips?.ai_search_view_characters || "{count} characters in your brand name").replace('{count}', availabilityStatus.charCount?.toString() || '0')}
                                                            >
                                                                {availabilityStatus.charCount} characters
                                                            </span>
                                                            <div className="text-right">
                                                                <p className="text-sm text-gray-500">Price</p>
                                                                <p
                                                                    className="text-2xl font-bold text-green-600"
                                                                    data-tooltip-id="main-tooltip"
                                                                    data-tooltip-content={tooltips?.ai_search_view_final_price || "Final price after any discounts"}
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
                                                                        const originalPrice = availabilityStatus.promoPrice || availabilityStatus.price || 0;
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
                                                                const originalPrice = availabilityStatus.promoPrice || availabilityStatus.price || 0;
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
                                                            data-tooltip-content={tooltips?.ai_search_view_promo_price || "Pre-launch promotional price"}
                                                        >
                                                            <span className="text-xl">✨</span>
                                                            {tooltips?.ai_search_view_promo_price || "Pre-launch Price"}: US${Number(availabilityStatus.promoPrice).toFixed(2)}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {tooltips?.ai_search_view_enter_coupon || "Have a coupon code?"}
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                            placeholder="Enter coupon code"
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value)}
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={tooltips?.ai_search_view_enter_coupon || "Enter a coupon code for discounts"}
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

                                                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-700 font-medium">Total Amount:</span>
                                                        <span
                                                            className="text-2xl font-bold text-green-600"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={tooltips?.ai_search_view_payment_amount || "Final amount to pay"}
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
                                                            data-tooltip-content={tooltips?.ai_search_view_agree_terms || "You must agree to the terms to continue"}
                                                        />
                                                        <label htmlFor="terms-checkbox" className="text-sm text-gray-600">
                                                            By claiming your domain you agree to the{' '}
                                                            <button
                                                                type="button"
                                                                onClick={() => window.open('/terms-and-conditions', '_blank')}
                                                                className="text-green-600 hover:text-green-700 hover:underline focus:outline-none"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content={tooltips?.ai_search_view_view_terms || "View terms and conditions"}
                                                            >
                                                                {tooltips?.ai_search_view_terms || "Terms and Conditions"}
                                                            </button>{' '}
                                                            and{' '}
                                                            <button
                                                                type="button"
                                                                onClick={() => window.open('/privacy-policy', '_blank')}
                                                                className="text-green-600 hover:text-green-700 hover:underline focus:outline-none"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content={tooltips?.ai_search_view_view_privacy || "View privacy policy"}
                                                            >
                                                                {tooltips?.ai_search_view_privacy || "Privacy Policy"}
                                                            </button>
                                                        </label>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        if (Number(displayFinalPrices.totalPrice) === 0) {
                                                            setPurchaseFormType(activeOption);
                                                            setIsPaymentModalOpen(true);
                                                        } else {
                                                            handlePurchase();
                                                        }
                                                    }}
                                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
                                                    disabled={isSubmitting || !termsAgreed}
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={
                                                        !termsAgreed ? (tooltips?.ai_search_view_agree_terms || "Please agree to terms first") :
                                                        isSubmitting ? "Processing your purchase..." :
                                                        Number(displayFinalPrices.totalPrice) === 0 ? (tooltips?.ai_search_view_claim_free || "Claim your free domain") : (tooltips?.ai_search_view_proceed_payment || "Proceed to payment")
                                                    }
                                                >
                                                    {isSubmitting ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                            {tooltips?.ai_search_view_processing || "Processing..."}
                                                        </span>
                                                    ) : Number(displayFinalPrices.totalPrice) === 0 ? (
                                                        tooltips?.ai_search_view_claim_free || 'Claim Free Domain'
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

                {isPaymentModalOpen && purchaseFormType && (
                    <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto border border-gray-200">
                            <button
                                onClick={() => {
                                    setIsPaymentModalOpen(false);
                                    setPurchaseFormType(null);
                                    setErrorMessage('');
                                    setOwnershipVerified(false);
                                    setOwnershipCheckDone(false);
                                    setIsCheckingOwnership(false);
                                }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                                disabled={isLoading}
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={tooltips?.ai_search_view_close_modal || "Close payment modal"}
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                            </button>

                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <div
                                        className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-4"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="ez.wiki payment"
                                    >
                                        <img
                                            src="https://ez.wiki/logo.gif"
                                            className="w-8 h-8 rounded-full object-cover"
                                            alt="ez.wiki Logo"
                                        />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {purchaseFormType === 'handle' ? 'Handle Purchase' : 'Domain Purchase'}
                                    </h2>
                                    <p
                                        className="text-green-600 font-medium mt-1"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_your_domain || "Your selected domain"}
                                    >
                                        {purchaseFormType === 'handle'
                                            ? `${selectedDomain}/${brandInput.trim()}`
                                            : `${brandInput.trim()}.${selectedDomain}`
                                        }
                                    </p>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Domain Price:</span>
                                        <span className="text-gray-900 font-semibold">US${Number(displayFinalPrices.domainPrice).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span className="text-gray-900 font-bold">Total:</span>
                                        <span
                                            className="text-green-600 font-bold text-xl"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_payment_amount || "Final payment amount"}
                                        >
                                            US${Number(displayFinalPrices.totalPrice).toFixed(2)}
                                        </span>
                                    </div>
                                    {couponStatus.valid && (
                                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                                            <span className="text-green-600 text-sm">Coupon applied: {couponStatus.message}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                                    {!userExists && (
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Create Account
                                        </h3>
                                    )}

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setOwnershipVerified(false);
                                                setOwnershipCheckDone(false);
                                                setErrorMessage('');
                                            }}
                                            onBlur={(e) => {
                                                if (e.target.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                                                    checkEmailOwnership(e.target.value);
                                                }
                                            }}
                                            placeholder="Enter your email address"
                                            className="w-full bg-white border border-gray-200 text-gray-900 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_payment_email || "Enter your email for purchase confirmation"}
                                        />

                                        {!isCheckingOwnership && ownershipCheckDone && !ownershipVerified && email && userExists === true && (
                                            <div className="flex items-center gap-2 text-sm text-amber-600 mt-1">
                                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                                ⚠️ This email doesn't belong to this conversation. You can still purchase the domain.
                                            </div>
                                        )}

                                        {!isCheckingOwnership && ownershipCheckDone && ownershipVerified && email && (
                                            <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                ✓ Verified: This email matches the conversation owner.
                                            </div>
                                        )}

                                        {userExists !== null && !isCheckingOwnership && ownershipCheckDone && (
                                            <p className={`text-xs mt-1 ${
                                                userExists ? 'text-green-600' : 'text-yellow-600'
                                            }`}>
                                                {userExists
                                                    ? (tooltips?.ai_search_view_account_exists || '✓ Account exists - no password needed')
                                                    : (tooltips?.ai_search_view_new_account || 'New account - password required')
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {!userExists && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Create your password"
                                                    className="w-full bg-white border border-gray-200 text-gray-900 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    required
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={tooltips?.ai_search_view_create_password || "Create a password for your new account"}
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm your password"
                                                    className="w-full bg-white border border-gray-200 text-gray-900 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    required
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={tooltips?.ai_search_view_confirm_password || "Confirm your password"}
                                                />
                                                {password !== confirmPassword && confirmPassword && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {tooltips?.ai_search_view_password_mismatch || "Passwords do not match"}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={initiateHandlePayment}
                                    disabled={
                                        isLoading ||
                                        !email ||
                                        (!userExists && (!password || !confirmPassword || password !== confirmPassword))
                                    }
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-green-200"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={
                                        isLoading ? (tooltips?.ai_search_view_processing || "Processing payment...") :
                                        !email ? (tooltips?.ai_search_view_email_required || "Email is required") :
                                        !userExists && !password ? (tooltips?.ai_search_view_password_required || "Password is required for new account") :
                                        (tooltips?.ai_search_view_proceed_payment || "Proceed with payment")
                                    }
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            {tooltips?.ai_search_view_processing || "Processing payment..."}
                                        </span>
                                    ) : Number(displayFinalPrices.totalPrice) === 0 ?
                                        (tooltips?.ai_search_view_claim_free_item || "Claim Free {item}").replace('{item}', purchaseFormType === 'handle' ? 'Handle' : 'Domain') :
                                        `Pay US${Number(displayFinalPrices.totalPrice).toFixed(2)}`
                                    }
                                </button>

                                <div className="text-center text-xs text-gray-500 mt-4">
                                    <p>Payment secured by STRIPE. You'll be taken to a thank you page after the payment.</p>
                                    <p className="mt-1">
                                        <Link href="/terms" className="text-green-600 hover:underline">{tooltips?.ai_search_view_terms || "Terms"}</Link> and{' '}
                                        <Link href="/privacy" className="text-green-600 hover:underline">{tooltips?.ai_search_view_privacy || "Privacy"}</Link>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isPaymentModalOpen && paymentStep === 2 && (
                    <div className="fixed inset-0 bg-black/70 min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative max-h-[90vh] overflow-y-auto border border-gray-200">
                            <button
                                onClick={() => {
                                    setIsPaymentModalOpen(false);
                                    setPaymentStep(1);
                                    setErrorMessage('');
                                }}
                                className="sticky top-0 right-0 ml-auto text-gray-400 hover:text-gray-600 transition-colors z-10 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center m-2"
                                disabled={isLoading}
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={tooltips?.ai_search_view_close_modal || "Close payment modal"}
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
                            </button>

                            <div className="p-6">
                                {errorMessage && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                        <span data-tooltip-id="main-tooltip" data-tooltip-content={tooltips?.ai_search_view_error_notification || "Error notification"}>
                                            {errorMessage}
                                        </span>
                                    </div>
                                )}

                                {isLoading && (
                                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-green-500" />
                                    </div>
                                )}

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
                                            email={email}
                                            clientSecret={clientSecret}
                                            onSuccess={handlePaymentSuccess}
                                            onBack={() => setPaymentStep(1)}
                                            onError={setErrorMessage}
                                            tooltips={tooltips}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-green-500" />
                                        </div>
                                    )}
                                </Elements>
                            </div>
                        </div>
                    </div>
                )}

                {showPurchaseModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-1000">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Purchase</h3>
                            <p className="text-gray-600 mb-2">
                                You're about to purchase:
                                <span className="text-green-600 font-medium ml-1">
                                    {activeOption === 'handle'
                                        ? `@${brandInput.trim()}.${selectedDomain}`
                                        : `${brandInput.trim()}.${selectedDomain}`
                                    }
                                </span>
                            </p>
                            <p className="text-gray-500 text-sm mb-6">
                                This action cannot be undone. Please confirm to proceed.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPurchaseModal(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    disabled={isSubmitting}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={tooltips?.ai_search_view_cancel_purchase || "Cancel purchase"}
                                >
                                    {tooltips?.ai_search_view_cancel || "Cancel"}
                                </button>
                                <button
                                    onClick={processPurchase}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                                    disabled={isSubmitting}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={tooltips?.ai_search_view_confirm_purchase || "Confirm and complete purchase"}
                                >
                                    {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />}
                                    {tooltips?.ai_search_view_confirm || "Confirm Purchase"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <main className="container mx-auto w-full relative">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className={`lg:col-span-1 mt-2 transition-all duration-300 ${isSidebarVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full hidden'}`}>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-24">
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h1
                                            className="text-lg font-semibold text-gray-900 break-words whitespace-normal overflow-hidden"
                                            style={{ wordBreak: 'break-word', hyphens: 'auto' }}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_conversation_title || "Conversation title"}
                                        >
                                            {currentConversationTitle}
                                        </h1>
                                        {conversationStatus === 'private' && (
                                            <span
                                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={tooltips?.ai_search_view_private_conversation || "Private conversation - requires access code"}
                                            >
                                                <FontAwesomeIcon icon={faLock} className="w-3 h-3" />
                                                Private
                                            </span>
                                        )}
                                        {conversationStatus === 'hidden' && isOwner && (
                                            <span
                                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={tooltips?.ai_search_view_hidden_conversation || "Hidden conversation - only visible to you"}
                                            >
                                                <FontAwesomeIcon icon={faEyeSlash} className="w-3 h-3" />
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    {conversationHashtags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                                            {conversationHashtags.map((tag) => (
                                                <a
                                                    key={tag}
                                                    href={`/public/ai/history?searchhashtag=%23${encodeURIComponent(tag)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full transition-colors shadow-2xs"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={`Explore #${tag}`}
                                                >
                                                    #{tag}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center text-sm text-gray-600 space-x-2">
                                        <span
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_total_messages || "Total messages in this conversation"}
                                        >
                                            {conversation.length} messages
                                        </span>
                                        <span>•</span>
                                        <span
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_total_tokens || "Total tokens used in this conversation"}
                                        >
                                            {conversationTokens} tokens
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            AI: {conversation.filter(m => m.content_type === 'ai').length}
                                        </span>
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                            Comments: {conversation.filter(m => m.content_type === 'comment').length}
                                        </span>
                                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                                            Conv. Comments: {conversation.filter(m => m.content_type === 'conversationcomment').length}
                                        </span>
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                            Embeds: {conversation.filter(m => m.content_type === 'embed').length}
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            Uploads: {conversation.filter(m => m.content_type === 'upload').length}
                                        </span>
                                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                            Social: {conversation.filter(m => m.content_type === 'social' || m.content_type === 'social_media').length}
                                        </span>
                                    </div>
                                </div>

                                {pinnedConversations.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FontAwesomeIcon icon={faStar} className="text-yellow-500 w-4 h-4" />
                                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                {tooltips?.ai_search_view_pinned || "Pinned Conversations"}
                                            </h2>
                                        </div>

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                                            {isLoadingPinned ? (
                                                <div className="flex justify-center py-4">
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
                                                </div>
                                            ) : (
                                                pinnedConversations.map((pinned) => (
                                                    <Link
                                                        key={pinned.id}
                                                        href={`/X/${encodeURIComponent(pinned.slug)}`}
                                                        className="block p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group border border-yellow-200"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content={pinned.conversation_title}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <FontAwesomeIcon icon={faStar} className="text-yellow-500 w-3 h-3 flex-shrink-0" />
                                                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#22c55e] transition-colors">
                                                                        {pinned.conversation_title}
                                                                    </p>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                                    {pinned.query_preview}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <span
                                                                        className="text-xs text-gray-400"
                                                                        data-tooltip-id="main-tooltip"
                                                                        data-tooltip-content={`${pinned.message_count} messages`}
                                                                    >
                                                                        {pinned.message_count} msgs
                                                                    </span>
                                                                    <span
                                                                        className="text-xs text-gray-400"
                                                                        data-tooltip-id="main-tooltip"
                                                                        data-tooltip-content={`Pinned on ${pinned.formatted_created_at}`}
                                                                    >
                                                                        {formatDate(pinned.created_at)}
                                                                    </span>
                                                                    {pinned.status === 'private' && (
                                                                        <FontAwesomeIcon icon={faLock} className="text-purple-400 w-3 h-3" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>

                                        {pinnedConversations.length > 0 && (
                                            <Link
                                                href="/ai/dashboard"
                                                className="block text-center text-xs text-[#22c55e] hover:text-[#16a34a] mt-3"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="View all pinned conversations"
                                            >
                                                View all pinned →
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {conversationHashtags.length > 0 && (
                                    <div className="mb-6 bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[#22c55e] font-black text-sm">#</span>
                                                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Hashtags
                                                </h2>
                                            </div>
                                            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                                {conversationHashtags.length}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {conversationHashtags.map((tag) => (
                                                <a
                                                    key={tag}
                                                    href={`/public/ai/history?searchhashtag=%23${encodeURIComponent(tag)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-medium bg-white text-emerald-800 hover:text-white hover:bg-[#22c55e] border border-emerald-200 px-2.5 py-1 rounded-full transition-colors shadow-2xs"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={`Search for #${tag}`}
                                                >
                                                    #{tag}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                        {tooltips?.ai_search_view_stats || "Conversation Stats"}
                                    </h2>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                            className="bg-gray-50 p-3 rounded-lg"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_total_messages || "Number of messages exchanged"}
                                        >
                                            <span className="text-xs text-gray-500 block">Total Messages</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {conversation.length}
                                            </span>
                                        </div>
                                        <div
                                            className="bg-gray-50 p-3 rounded-lg"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_total_tokens || "Total tokens used (prompt + completion)"}
                                        >
                                            <span className="text-xs text-gray-500 block">Total Tokens</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {conversationTokens}
                                            </span>
                                        </div>
                                        <div
                                            className="bg-gray-50 p-3 rounded-lg"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_ai_model || "AI model used for responses"}
                                        >
                                            <span className="text-xs text-gray-500 block">AI Model</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {search.model}
                                            </span>
                                        </div>
                                        <div
                                            className="bg-gray-50 p-3 rounded-lg"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_conversation_cost_tooltip || "Total cost of this conversation"}
                                        >
                                            <span className="text-xs text-gray-500 block">Total Cost</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                ${conversationCost.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="space-y-3">
                                        {conversation.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                                                    {tooltips?.ai_search_view_jump_to_message_title || "Jump to Message"}
                                                </h3>

                                                <div className="max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-gray-100">
                                                    {conversation.filter(msg => msg.message_role === 'user').length > 0 && (
                                                        <div className="mb-3">
                                                            <h4 className="text-xs font-medium text-gray-400 mb-1 px-2 sticky top-0 bg-gray-50 py-1">User Messages</h4>
                                                            <ul className="space-y-1">
                                                                {conversation
                                                                    .filter(msg => msg.message_role === 'user')
                                                                    .map((msg, idx) => {
                                                                        let preview = msg.query;
                                                                        if (msg.content_type === 'upload') {
                                                                            preview = `[File] ${msg.file_data?.original_name || msg.query}`;
                                                                        } else if (msg.content_type === 'comment') {
                                                                            preview = `[Comment] ${msg.query}`;
                                                                        } else if (msg.content_type === 'conversationcomment') {
                                                                            preview = `[Conv. Comment] ${msg.query}`;
                                                                        } else if (msg.content_type === 'embed') {
                                                                            preview = `[Embed] Layout`;
                                                                        } else if (msg.content_type === 'social' || msg.content_type === 'social_media') {
                                                                            preview = `[Social] ${stripHtmlTags(msg.query).substring(0, 40)}`;
                                                                        }
                                                                        return (
                                                                            <li key={msg.id}>
                                                                                <button
                                                                                    onClick={() => scrollToMessage(msg.slug)}
                                                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-[#22c55e] rounded-lg transition-colors truncate"
                                                                                    title={preview}
                                                                                    data-tooltip-id="main-tooltip"
                                                                                    data-tooltip-content={(tooltips?.ai_search_view_jump_to_message || "Jump to: {preview}").replace('{preview}', preview.substring(0, 50))}
                                                                                >
                                                                                    <span className="inline-block w-6 text-gray-400">{idx + 1}.</span>
                                                                                    {preview.substring(0, 40)}{preview.length > 40 ? '...' : ''}
                                                                                </button>
                                                                            </li>
                                                                        );
                                                                    })
                                                                }
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {conversation.filter(msg => msg.message_role === 'assistant').length > 0 && (
                                                        <div>
                                                            <h4 className="text-xs font-medium text-gray-400 mb-1 px-2 sticky top-0 bg-gray-50 py-1">AI Responses</h4>
                                                            <ul className="space-y-1">
                                                                {conversation
                                                                    .filter(msg => msg.message_role === 'assistant')
                                                                    .map((msg, idx) => {
                                                                        const preview = stripHtmlTags(msg.response || '').substring(0, 40);
                                                                        return (
                                                                            <li key={msg.id}>
                                                                                <button
                                                                                    onClick={() => scrollToMessage(msg.slug)}
                                                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-[#22c55e] rounded-lg transition-colors truncate"
                                                                                    title={stripHtmlTags(msg.response || '')}
                                                                                    data-tooltip-id="main-tooltip"
                                                                                    data-tooltip-content={(tooltips?.ai_search_view_jump_to_message || "Jump to: {preview}").replace('{preview}', preview)}
                                                                                >
                                                                                    <span className="inline-block w-6 text-gray-400">{idx + 1}.</span>
                                                                                    {preview}{preview.length > 40 ? '...' : ''}
                                                                                </button>
                                                                            </li>
                                                                        );
                                                                    })
                                                                }
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                                            <div className="flex items-center justify-between mb-1">
                                                <span>AI messages:</span>
                                                <span className="font-medium text-gray-900">
                                                    {conversation.filter(m => m.content_type === 'ai').length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span>Comments:</span>
                                                <span className="font-medium text-gray-900">
                                                    {conversation.filter(m => m.content_type === 'comment').length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span>Conv. Comments:</span>
                                                <span className="font-medium text-gray-900">
                                                    {conversation.filter(m => m.content_type === 'conversationcomment').length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span>Embeds:</span>
                                                <span className="font-medium text-gray-900">
                                                    {conversation.filter(m => m.content_type === 'embed').length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span>File uploads:</span>
                                                <span className="font-medium text-gray-900">
                                                    {conversation.filter(m => m.content_type === 'upload').length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Social media posts:</span>
                                                <span className="font-medium text-gray-900">
                                                    {conversation.filter(m => m.content_type === 'social' || m.content_type === 'social_media').length}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => window.print()}
                                            className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 flex items-center justify-center space-x-2 transition-colors"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_save_pdf || "Save this conversation as a PDF file"}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="6 9 6 2 18 2 18 9"/>
                                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1-2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                                <rect width="12" height="8" x="6" y="14"/>
                                            </svg>
                                            <span>{tooltips?.ai_search_view_save_pdf || "Save as PDF"}</span>
                                        </button>
                                    </div>
                                </div>

                                {related_searches.length > 0 && (
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                            {tooltips?.ai_search_view_related || "Related Conversations"}
                                        </h2>

                                        <div className="space-y-3">
                                            {related_searches
                                                .filter(related => related.status === 'public')
                                                .map((related, index) => (
                                                <Link
                                                    key={index}
                                                    href={`/X/${encodeURIComponent(related.slug)}`}
                                                    className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={`View related conversation: ${related.conversation_title}`}
                                                >
                                                    <p className="text-sm text-gray-900 line-clamp-2 group-hover:text-[#22c55e] transition-colors">
                                                        {related.conversation_title}
                                                    </p>
                                                    {parseHashtags(related.hashtag).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {parseHashtags(related.hashtag).slice(0, 3).map((tag) => (
                                                                <a
                                                                    key={tag}
                                                                    href={`/public/ai/history?searchhashtag=%23${encodeURIComponent(tag)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-[10px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors"
                                                                    data-tooltip-id="main-tooltip"
                                                                    data-tooltip-content={`Explore #${tag}`}
                                                                >
                                                                    #{tag}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span
                                                            className="text-xs text-gray-500"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={(tooltips?.ai_search_view_total_messages || "{count} messages in this conversation").replace('{count}', related.message_count.toString())}
                                                        >
                                                            {related.message_count} msgs
                                                        </span>
                                                        <span
                                                            className="text-xs text-gray-500"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={`Created on ${formatDate(related.created_at)}`}
                                                        >
                                                            {formatDate(related.created_at)}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`${isSidebarVisible ? 'lg:col-span-3' : 'lg:col-span-4'} transition-all duration-300`}>

                            <div className={`relative rounded-xl text-white mt-2 mb-2 transition-all duration-500 ease-in-out overflow-hidden ${
                                isBannerVisible ? 'max-h-[500px] p-6 opacity-100' : 'max-h-0 p-0 opacity-0 mb-2'
                            } ${
                                conversationStatus === 'private' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                conversationStatus === 'hidden' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                                'bg-gradient-to-r from-purple-500 to-purple-600'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                                            {conversationStatus === 'private' && <FontAwesomeIcon icon={faLock} className="text-white/80" />}
                                            {conversationStatus === 'hidden' && <FontAwesomeIcon icon={faEyeSlash} className="text-white/80" />}
                                            AI Conversation
                                        </h1>
                                        <p className="text-purple-100">
                                            {hasAccess ? 'Continue chatting with AI in this conversation' : 'Viewing conversation'}
                                        </p>
                                        {conversationHashtags.length > 0 && (
                                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                                <span className="text-xs font-medium text-purple-200 mr-1">Hashtags:</span>
                                                {conversationHashtags.map((tag) => (
                                                    <a
                                                        key={tag}
                                                        href={`/public/ai/history?searchhashtag=%23${encodeURIComponent(tag)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center text-xs font-medium bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/30 transition-colors"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content={`Search for #${tag}`}
                                                    >
                                                        #{tag}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right mr-8">
                                        <div
                                            className="text-sm text-purple-200"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Unique conversation identifier"
                                        >
                                            ID: {search.conversation_id.substring(0, 8)}...
                                        </div>
                                        <div
                                            className="text-sm text-purple-200"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={`Started on ${formatDate(search.created_at)}`}
                                        >
                                            Started: {formatDate(search.created_at)}
                                        </div>
                                        <div
                                            className="text-sm text-purple-200 mt-1 font-bold"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_conversation_cost_tooltip || "Total cost of this conversation"}
                                        >
                                            Total Cost: ${conversationCost.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!isBannerVisible && (
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                                    {conversationHashtags.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1">
                                                <span className="text-[#22c55e] font-bold">#</span> Hashtags:
                                            </span>
                                            {conversationHashtags.map((tag) => (
                                                <a
                                                    key={tag}
                                                    href={`/public/ai/history?searchhashtag=%23${encodeURIComponent(tag)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full transition-colors shadow-2xs"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={`Search for #${tag}`}
                                                >
                                                    #{tag}
                                                </a>
                                            ))}
                                        </div>
                                    ) : <div />}
                                    <button
                                        onClick={() => setIsBannerVisible(true)}
                                        className="text-xs font-bold text-gray-400 hover:text-[#22c55e] flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full transition-all border border-gray-200 shadow-sm ml-auto"
                                    >
                                        <FontAwesomeIcon icon={faChevronDown} /> SHOW CONVERSATION INFO
                                    </button>
                                </div>
                            )}

                            <div
                                ref={conversationContainerRef}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6"
                            >
                                <div className="p-6">
                                    {conversation.length > 0 ? (
                                        (() => {
                                            // Separate primary conversation messages from comments/replies
                                            const isCommentItem = (msg: ConversationMessage): boolean => {
                                                if (msg.content_type === 'comment') return true;
                                                if (msg.parent_id !== null && msg.parent_id !== undefined) {
                                                    // AI assistant turns in multi-turn conversation are part of conversation flow
                                                    if (msg.message_role === 'assistant' && msg.content_type !== 'upload' && msg.content_type !== 'social' && msg.content_type !== 'social_media') {
                                                        return false;
                                                    }
                                                    return conversation.some(m => m.id === msg.parent_id);
                                                }
                                                return false;
                                            };

                                            const conversationMessages = conversation.filter(msg => !isCommentItem(msg));
                                            const allComments = conversation.filter(msg => isCommentItem(msg));

                                            const effectiveConversationMessages = conversationMessages.length > 0 ? conversationMessages : [conversation[0]];
                                            const effectiveComments = conversationMessages.length > 0 ? allComments : conversation.slice(1);
                                            const convMessageIds = new Set(effectiveConversationMessages.map(m => m.id));
                                            const convMessageSlugs = new Set(effectiveConversationMessages.map(m => m.slug).filter(Boolean));

                                            type CombinedCommentItem =
                                                | { kind: 'msg'; data: ConversationMessage; key: string | number }
                                                | { kind: 'db'; data: any; key: string | number };

                                            const getCommentsForMessage = (convMsg: ConversationMessage, index: number) => {
                                                const directMsgComments = effectiveComments.filter(c => c.parent_id === convMsg.id);
                                                const directDbComments = dbComments.filter(c =>
                                                    c.message_id === convMsg.id ||
                                                    c.parent_id === convMsg.id ||
                                                    (c.message_slug && convMsg.slug && c.message_slug === convMsg.slug)
                                                );

                                                // Track child AI comments that are paired into parent comment card
                                                const pairedAiCommentIds = new Set<number>();

                                                const processedDbComments = directDbComments.map(c => {
                                                    if (c.content_type !== 'ai') {
                                                        const matchingAi = c.ai_reply
                                                            || directDbComments.find((item: any) => item.parent_id === c.id && item.content_type === 'ai')
                                                            || dbComments.find((item: any) => item.parent_id === c.id && item.content_type === 'ai');
                                                        if (matchingAi) {
                                                            if (matchingAi.id) pairedAiCommentIds.add(matchingAi.id);
                                                            return {
                                                                ...c,
                                                                ai_reply: matchingAi,
                                                            };
                                                        }
                                                    }
                                                    return c;
                                                });

                                                // Mark child AI comments whose parent is present in directDbComments
                                                processedDbComments.forEach(c => {
                                                    if (c.content_type === 'ai' && c.parent_id) {
                                                        const hasParent = directDbComments.some((item: any) => item.id === c.parent_id);
                                                        if (hasParent) {
                                                            pairedAiCommentIds.add(c.id);
                                                        }
                                                    }
                                                });

                                                const activeDbComments = processedDbComments.filter(c => !pairedAiCommentIds.has(c.id));

                                                let items: CombinedCommentItem[] = [
                                                    ...directMsgComments.map(m => ({ kind: 'msg' as const, data: m, key: `msg-${m.id}` })),
                                                    ...activeDbComments.map(c => ({ kind: 'db' as const, data: c, key: `db-${c.id}` }))
                                                ];

                                                if (index === 0) {
                                                    const orphanMsgComments = effectiveComments.filter(c => !c.parent_id || !convMessageIds.has(c.parent_id));
                                                    const orphanDbComments = dbComments.filter(c => {
                                                        const targetsKnown = (c.message_id && convMessageIds.has(c.message_id)) ||
                                                            (c.parent_id && convMessageIds.has(c.parent_id)) ||
                                                            (c.message_slug && convMessageSlugs.has(c.message_slug));
                                                        return !targetsKnown;
                                                    });

                                                    const orphanPairedAiIds = new Set<number>();
                                                    const processedOrphanDb = orphanDbComments.map(c => {
                                                        if (c.content_type !== 'ai') {
                                                            const matchingAi = c.ai_reply
                                                                || orphanDbComments.find((item: any) => item.parent_id === c.id && item.content_type === 'ai')
                                                                || dbComments.find((item: any) => item.parent_id === c.id && item.content_type === 'ai');
                                                            if (matchingAi) {
                                                                if (matchingAi.id) orphanPairedAiIds.add(matchingAi.id);
                                                                return {
                                                                    ...c,
                                                                    ai_reply: matchingAi,
                                                                };
                                                            }
                                                        }
                                                        return c;
                                                    });

                                                    processedOrphanDb.forEach(c => {
                                                        if (c.content_type === 'ai' && c.parent_id) {
                                                            if (orphanDbComments.some((item: any) => item.id === c.parent_id)) {
                                                                orphanPairedAiIds.add(c.id);
                                                            }
                                                        }
                                                    });

                                                    const activeOrphanDb = processedOrphanDb.filter(c => !orphanPairedAiIds.has(c.id));

                                                    items = [
                                                        ...items,
                                                        ...orphanMsgComments.map(m => ({ kind: 'msg' as const, data: m, key: `msg-${m.id}` })),
                                                        ...activeOrphanDb.map(c => ({ kind: 'db' as const, data: c, key: `db-${c.id}` }))
                                                    ];
                                                }

                                                // Deduplicate items
                                                const seenKeys = new Set();
                                                return items.filter(item => {
                                                    if (seenKeys.has(item.key)) return false;
                                                    seenKeys.add(item.key);
                                                    return true;
                                                });
                                            };

                                            return (
                                                <div className="space-y-10">
                                                    {effectiveConversationMessages.map((convMsg, index) => {
                                                        const commentsForThisMsg = getCommentsForMessage(convMsg, index);
                                                        const prevMsg = index > 0 ? effectiveConversationMessages[index - 1] : null;
                                                        const isContinuationOfExchange = convMsg.message_role === 'assistant' && prevMsg?.message_role === 'user';
                                                        const isUserMsgRenderedSeparately = Boolean(prevMsg && prevMsg.message_role === 'user' && prevMsg.query === convMsg.query);

                                                        return (
                                                            <div
                                                                key={convMsg.id}
                                                                className={isContinuationOfExchange ? "mt-6" : (index > 0 ? "pt-10 border-t border-gray-200/80" : "")}
                                                            >
                                                                {/* Conversation Message Row */}
                                                                {renderMessage(convMsg, false, isUserMsgRenderedSeparately)}

                                                                {/* Comments on this conversation message */}
                                                                {commentsForThisMsg.length > 0 && (
                                                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-semibold text-gray-800">Comments & Replies</span>
                                                                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                                                                    {commentsForThisMsg.length}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <Masonry
                                                                            breakpointCols={commentMasonryBreakpoints}
                                                                            className="my-masonry-grid"
                                                                            columnClassName="my-masonry-grid_column"
                                                                        >
                                                                            {commentsForThisMsg.map((item) =>
                                                                                item.kind === 'msg'
                                                                                    ? renderMessage(item.data, true)
                                                                                    : renderDbCommentCard(item.data)
                                                                            )}
                                                                        </Masonry>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            No messages to display in this conversation.
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {conversation.length > 0 && (
                                    <div className="flex justify-center pt-2 pb-6">
                                        <button
                                            onClick={copyAllConversation}
                                            className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-full transition-all flex items-center space-x-2 text-sm font-medium border border-gray-300/80 shadow-2xs hover:shadow-sm"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={isCopyAllCopied ? (tooltips?.ai_search_view_message_copied || "Copied!") : (tooltips?.ai_search_view_copy_entire_conversation || "Copy the entire conversation to clipboard")}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                            </svg>
                                            <span>{isCopyAllCopied ? (tooltips?.ai_search_view_message_copied || 'Copied! ✓') : 'Copy the entire conversation to clipboard'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {renderInputTabs()}
                        </div>
                    </div>
                </main>

                <footer className="border-t border-gray-200 bg-white mt-12">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="flex items-center space-x-2 mb-4 md:mb-0">
                                <img
                                    src="/ezlogo.png"
                                    alt="Ez.wiki Logo"
                                    className="w-6 h-6 object-contain rounded"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Ez.wiki"
                                />
                                <span className="text-lg font-semibold text-gray-900">Ez.wiki</span>
                            </div>

                            <div className="text-sm text-gray-600 text-center md:text-right">
                                <p className="mb-1">
                                    AI Conversation •
                                    <span
                                        className="mx-1"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_total_messages || "Total messages"}
                                    >
                                        {conversation.length} messages
                                    </span>
                                    •
                                    <span
                                        className="mx-1"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_total_tokens || "Total tokens used"}
                                    >
                                        {conversationTokens} tokens
                                    </span>
                                    •
                                    <span
                                        className="mx-1"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_conversation_cost_tooltip || "Total cost"}
                                    >
                                        ${conversationCost.toFixed(4)} cost
                                    </span>
                                </p>
                                <p>
                                    © {new Date().getFullYear()} Ez.wiki •
                                    <span
                                        className="ml-1"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Conversation identifier"
                                    >
                                        Conversation ID: {search.conversation_id}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>

                <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[60]">
                    <button
                        onClick={() => startSlowAutoScroll('up')}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-md hover:shadow-lg transition-all text-white active:scale-95 ${
                            autoScrollDirection === 'up'
                                ? 'bg-blue-600 border-blue-700 ring-4 ring-blue-300 scale-105 animate-pulse'
                                : 'bg-blue-500 border-blue-600 hover:bg-blue-600'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={
                            autoScrollDirection === 'up'
                                ? "Auto-scrolling up in slow motion (Click to stop)"
                                : (tooltips?.ai_search_view_scroll_top || "Auto scroll to top (Slow motion)")
                        }
                        aria-label="Auto scroll to top in slow motion"
                    >
                        <FontAwesomeIcon icon={faChevronUp} />
                    </button>
                    <button
                        onClick={() => startSlowAutoScroll('down')}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-md hover:shadow-lg transition-all text-white active:scale-95 ${
                            autoScrollDirection === 'down'
                                ? 'bg-green-600 border-green-700 ring-4 ring-green-300 scale-105 animate-pulse'
                                : 'bg-green-500 border-green-600 hover:bg-green-600'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={
                            autoScrollDirection === 'down'
                                ? "Auto-scrolling down in slow motion (Click to stop)"
                                : (tooltips?.ai_search_view_scroll_bottom || "Auto scroll to bottom (Slow motion)")
                        }
                        aria-label="Auto scroll to bottom in slow motion"
                    >
                        <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                </div>
            </div>

            {customAlert.show && (
                <CustomAlert
                    message={customAlert.message}
                    type={customAlert.type}
                    onClose={() => setCustomAlert({ show: false, message: '', type: 'info' })}
                />
            )}

            <SocialShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                slug={search.slug}
                url={share_url || (typeof window !== 'undefined' ? `${window.location.origin}/X/${encodeURIComponent(search.slug)}` : '')}
                title={search.conversation_title || search.query || 'Ez.wiki AI Search'}
                description={search.query || ''}
                initialTab={shareModalTab}
            />

            {/* NEW: Embed Builder Modal */}
            <EmbedRowModal
                isOpen={isEmbedModalOpen}
                onClose={() => setIsEmbedModalOpen(false)}
                parentSlug={search.slug}
                conversationId={search.conversation_id}
                onChildConvoCreated={async (html, contentType) => {
                    await handleCommentSubmit(undefined, html, contentType || 'embed');
                    setIsEmbedModalOpen(false); // Close modal after save
                }}
                onCommentCreated={(messages) => {
                    applyConversationMessages(messages);
                    fetchDbComments();
                }}
            />

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -20px);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }

                @keyframes slide-left {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-left {
                    animation: slide-left 0.3s ease-out;
                }

                @keyframes gradient-x {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 1.5s ease-in-out infinite;
                }

                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }

                .comment-content iframe,
                .comment-content embed,
                .comment-content object,
                .comment-content video {
                    display: block;
                    margin: 1.5rem auto;
                    max-width: 100%;
                }

                .comment-content iframe {
                    max-width: 100%;
                    height: auto !important;
                    min-height: 400px;
                    aspect-ratio: unset !important;
                }

                .comment-content div:has(iframe),
                .comment-content div:has(embed) {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }

                .comment-content .iframe-wrapper,
                .comment-content .embed-wrapper {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }

                .comment-html-preview,
                .social-post-html-preview {
                    width: 100%;
                    border-radius: 0.75rem;
                }

                .comment-html-preview iframe,
                .social-post-html-preview iframe {
                    display: block;
                    width: 100%;
                    max-width: 100%;
                }

                .social-post-content {
                    max-width: 100%;
                    overflow-x: auto;
                }

                .social-post-content img {
                    max-width: 100%;
                    height: auto;
                }

                .social-post-content video {
                    max-width: 100%;
                    height: auto;
                }

                .social-post-content iframe {
                    max-width: 100%;
                    display: block;
                    margin: 0 auto;
                }

                .social-post-content iframe[src*="facebook"],
                .social-post-content iframe[src*="youtube"],
                .social-post-content iframe[src*="vimeo"],
                .social-post-content iframe[src*="instagram"],
                .social-post-content iframe[src*="twitter"] {
                    display: block;
                    margin: 0 auto;
                    max-width: 100%;
                }

                .comment-content {
                    max-width: 100%;
                    overflow-x: auto;
                }

                .comment-content img {
                    max-width: 100%;
                    height: auto;
                }

                .comment-content video {
                    max-width: 100%;
                    height: auto;
                }

                .comment-content iframe {
                    max-width: 100%;
                    display: block;
                    margin: 0 auto;
                }

                .comment-content iframe[src*="facebook"],
                .comment-content iframe[src*="youtube"],
                .comment-content iframe[src*="vimeo"],
                .comment-content iframe[src*="instagram"],
                .comment-content iframe[src*="twitter"] {
                    display: block;
                    margin: 0 auto;
                    max-width: 100%;
                }

                .markdown-body {
                    all: unset;
                    display: block;
                }

                .markdown-body > *:first-child {
                    margin-top: 0;
                }

                .markdown-body > *:last-child {
                    margin-bottom: 0;
                }

                .markdown-body h1,
                .markdown-body h2,
                .markdown-body h3,
                .markdown-body h4,
                .markdown-body h5,
                .markdown-body h6 {
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    color: #111827;
                    line-height: 1.3;
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
                }

                .markdown-body h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 0.5rem;
                }

                .markdown-body h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                }

                .markdown-body h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .markdown-body h4 {
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .markdown-body h5 {
                    font-size: 1rem;
                    font-weight: 600;
                }

                .markdown-body h6 {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #6b7280;
                }

                /* Inline Embed Builder container styling */
                .inline-embed-builder {
                    width: 100%;
                    border-radius: 0.75rem;
                    overflow: hidden;
                    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
                    border: 1px solid #e5e7eb;
                    background: #f3f4f1;
                }
            `}</style>
        </>
    );
}