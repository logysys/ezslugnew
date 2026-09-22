import { Head, usePage, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef, FormEvent, KeyboardEvent, useMemo } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
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
    faEarth
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Masonry from 'react-masonry-css';

const commentMasonryBreakpoints = {
    default: 3,
    1024: 2,
    640: 1
};
// Import the EnhancedMDEditor component
import EnhancedMDEditor from '@/components/EnhancedMDEditor';

// Import local fonts
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

// Types
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
    content_type: 'ai' | 'comment' | 'upload' | 'embed';
    query: string;
    response: string | null;
    file_data: FileData | null;
    file_metadata?: {
        web_search?: boolean;
    };
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
    ip_address?: string;
    status?: 'public' | 'private' | 'hidden';
    user_id?: number;
    session_id?: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface SearchData {
    id: number;
    slug: string;
    conversation_id: string;
    thread_id: string;
    conversation_title: string;
    message_role: string;
    content_type: 'ai' | 'comment' | 'upload' | 'embed';
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
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface RelatedSearch {
    slug: string;
    query: string;
    conversation_title: string;
    created_at: string;
    share_url: string;
    message_count: number;
    status?: 'public' | 'private' | 'hidden';
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
        } | null;
    };
    guestInteractionDisabled?: boolean;
    requiresLogin?: boolean;
}

interface SavedTheme {
    id: number;
    unique_id: string;
    title: string;
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

// Helper function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon based on mime type
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

// Allowed file types for upload
const ALLOWED_FILE_TYPES = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
    // PDF
    'application/pdf',
    // Videos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    // Audio
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav'
];

const ALLOWED_FILE_EXTENSIONS = [
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    // PDF
    '.pdf',
    // Videos
    '.mp4', '.webm', '.ogg', '.mov', '.avi',
    // Audio
    '.mp3', '.wav', '.ogg', '.m4a'
];

// Stripe Checkout Form Component
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
                    data-tooltip-content={!stripe ? "Payment system loading..." : !isPaymentElementReady ? "Payment form loading..." : isProcessing ? "Processing payment..." : `Complete payment of US$${price.toFixed(2)}`}
                >
                    {isProcessing ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            {tooltips?.ai_search_view_processing || "Processing..."}
                        </>
                    ) : `Pay US$${price.toFixed(2)}`}
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
    requiresLogin = false
}: PageProps) {
    const [isCopied, setIsCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [currentConversationTitle, setCurrentConversationTitle] = useState(search.conversation_title);
    const [conversationCost, setConversationCost] = useState(search.conversation_cost);
    const [conversationTokens, setConversationTokens] = useState(search.conversation_tokens);
    const [isEzthemeLoading, setIsEzthemeLoading] = useState(false);
    const [successAlert, setSuccessAlert] = useState<React.ReactNode>(null);
    const [savedTheme, setSavedTheme] = useState<SavedTheme | null>(null);
    
    const [charCountWarning, setCharCountWarning] = useState('');
    const [charCountError, setCharCountError] = useState('');
    
    const [hasAccess, setHasAccess] = useState<boolean>(false);
    const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);
    const [accessDeniedMessage, setAccessDeniedMessage] = useState<string>('');
    const [conversationStatus, setConversationStatus] = useState<'public' | 'private' | 'hidden'>('public');
    const [isOwner, setIsOwner] = useState<boolean>(false);
    
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
    const [isCopyAllCopied, setIsCopyAllCopied] = useState(false);
    
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailError, setEmailError] = useState('');
    
    const [activeInputTab, setActiveInputTab] = useState<'text' | 'comment' | 'upload'>('text');
    const [commentContent, setCommentContent] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [email, setEmail] = useState('');
    
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const conversationContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const currentUser = auth?.user || null;
    
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
        const checkAccess = async () => {
            setIsCheckingAccess(true);
            
            const firstMessage = conversation_messages.find(msg => !msg.parent_id) || conversation_messages[0];
            const status = firstMessage?.status || search.status || 'public';
            
            setConversationStatus(status as 'public' | 'private' | 'hidden');
            
            console.log('Conversation status:', status);
            console.log('Current user:', currentUser);
            console.log('Guest interaction disabled:', guestInteractionDisabled);
            console.log('Requires login:', requiresLogin);
            
            let userIsOwner = false;
            
            if (currentUser) {
                userIsOwner = conversation_messages.some(msg => msg.user_id === currentUser.id) || 
                             (search.user?.id === currentUser.id);
            }
            
            setIsOwner(userIsOwner);
            
            if (status === 'public') {
                // For public conversations, check if guests are allowed
                if (!currentUser && guestInteractionDisabled) {
                    setHasAccess(false);
                    setAccessDeniedMessage(tooltips?.ai_search_view_guest_disabled || 'The owner of this conversation has disabled guest interaction. Please log in to continue.');
                    setIsCheckingAccess(false);
                    return;
                }
                
                setHasAccess(true);
                setIsCheckingAccess(false);
                return;
            }
            
            if (status === 'hidden') {
                setHasAccess(false);
                setAccessDeniedMessage(tooltips?.ai_search_view_hidden_conversation || 'This conversation has been hidden and is not available for viewing.');
                setIsCheckingAccess(false);
                return;
            }
            
            if (status === 'private') {
                if (userIsOwner) {
                    setHasAccess(true);
                } else {
                    setHasAccess(false);
                    setAccessDeniedMessage(tooltips?.ai_search_view_private_conversation || 'This is a private conversation. You do not have permission to view it.');
                    if (!currentUser) {
                        setShowLoginPrompt(true);
                    }
                }
                setIsCheckingAccess(false);
                return;
            }
            
            setHasAccess(true);
            setIsCheckingAccess(false);
        };
        
        checkAccess();
    }, [search, conversation_messages, currentUser, tooltips, guestInteractionDisabled, requiresLogin]);

    useEffect(() => {
        let visibleMessages = conversation_messages;
        
        if (!isOwner) {
            visibleMessages = conversation_messages.filter(msg => 
                msg.status !== 'hidden'
            );
        }
        
        setConversation(visibleMessages);
    }, [conversation_messages, isOwner]);

    useEffect(() => {
        const uploadMessages = conversation_messages.filter(msg => msg.content_type === 'upload');
        if (uploadMessages.length > 0) {
            console.log('Upload messages found:', uploadMessages.length);
            uploadMessages.forEach((msg, index) => {
                console.log(`Upload message ${index + 1}:`, {
                    id: msg.id,
                    slug: msg.slug,
                    query: msg.query,
                    file_data: msg.file_data,
                    file_data_type: typeof msg.file_data,
                    file_data_keys: msg.file_data ? Object.keys(msg.file_data) : null
                });
            });
        }
    }, [conversation_messages]);

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);
    
    useEffect(() => {
        if (showEmailModal && emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, [showEmailModal]);

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
        conversationContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    
    const markdownStyles = {
        backgroundColor: 'transparent',
        color: '#1f2937',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        lineHeight: '1.7',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        '& h1, & h2, & h3, & h4, & h5, & h6': {
            borderBottom: 'none',
            marginTop: '1.5rem',
            marginBottom: '0.75rem',
            fontWeight: 600,
            color: '#111827',
            wordBreak: 'break-word',
        },
        '& h1': { fontSize: '1.75rem' },
        '& h2': { fontSize: '1.5rem' },
        '& h3': { fontSize: '1.25rem' },
        '& h4': { fontSize: '1.125rem' },
        '& p': {
            marginBottom: '1rem',
            wordBreak: 'break-word',
        },
        '& a': {
            color: '#22c55e',
            textDecoration: 'underline',
            wordBreak: 'break-word',
        },
        '& code': {
            backgroundColor: '#f3f4f6',
            color: '#dc2626',
            padding: '0.2em 0.4em',
            borderRadius: '0.25rem',
            fontSize: '0.875em',
            wordBreak: 'break-word',
        },
        '& pre': {
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem',
            padding: '1rem',
            overflow: 'auto',
            wordBreak: 'break-word',
        },
        '& blockquote': {
            borderLeft: '4px solid #e5e7eb',
            paddingLeft: '1.5rem',
            color: '#6b7280',
            fontStyle: 'italic',
            margin: '1.5rem 0',
            wordBreak: 'break-word',
        },
        '& ul, & ol': {
            paddingLeft: '1.5rem',
            marginBottom: '1rem',
            wordBreak: 'break-word',
        },
        '& li': {
            marginBottom: '0.5rem',
            wordBreak: 'break-word',
        },
        '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            marginBottom: '1.5rem',
            wordBreak: 'break-word',
        },
        '& th, & td': {
            border: '1px solid #e5e7eb',
            padding: '0.75rem',
            wordBreak: 'break-word',
        },
        '& th': {
            backgroundColor: '#f9fafb',
            fontWeight: 600,
        },
    };

    // UPDATED: Copy the current window URL instead of share_url
    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    const copyMessageToClipboard = (messageId: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(messageId);
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
                }
                
                const webSearchNote = msg.file_metadata?.web_search ? '[Web Search Enabled] ' : '';
                
                return `${role} (${timestamp})${contentPrefix ? ' - ' + contentPrefix : ''}${webSearchNote}:\n${content}\n`;
            })
            .join('\n---\n\n');
        
        navigator.clipboard.writeText(conversationText);
        setIsCopyAllCopied(true);
        
        setTimeout(() => {
            setIsCopyAllCopied(false);
        }, 2000);
    };

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

    // Updated file upload validation function
    const validateFileType = (file: File): { valid: boolean; error?: string } => {
        // Check MIME type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return {
                valid: false,
                error: tooltips?.ai_search_view_file_types || 'File type not allowed. Only images, PDF, video, and audio files are permitted.'
            };
        }

        // Check file extension as a fallback
        const fileName = file.name.toLowerCase();
        const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
            return {
                valid: false,
                error: tooltips?.ai_search_view_file_types || 'File extension not allowed. Only images, PDF, video, and audio files are permitted.'
            };
        }

        return { valid: true };
    };

    const handleFileUpload = async () => {
        if (!selectedFile?.file) return;

        // Clear previous errors
        setUploadError(null);

        // Validate file type one more time before upload
        const validation = validateFileType(selectedFile.file);
        if (!validation.valid) {
            setUploadError(validation.error || 'Invalid file type');
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile.file);
        formData.append('description', commentContent);
        formData.append('conversation_id', search.conversation_id);
        formData.append('parent_slug', search.slug);

        try {
            const response = await axios.post('/content/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            
            if (response.data.success) {
                if (response.data.conversation_messages) {
                    let newMessages = response.data.conversation_messages;
                    if (!isOwner) {
                        newMessages = newMessages.filter((msg: any) => msg.status !== 'hidden');
                    }
                    setConversation(newMessages);
                }
                
                setSelectedFile(null);
                setCommentContent('');
                setActiveInputTab('text');
                setUploadError(null);
                
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
                
                if (response.data.slug) {
                    window.history.replaceState(
                        { slug: response.data.slug },
                        '',
                        `/X/${encodeURIComponent(response.data.slug)}`
                    );
                }
                
            } else {
                alert(response.data.message || 'Failed to upload file');
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.message || 'Failed to upload file';
                setUploadError(errorMessage);
                alert(errorMessage);
            } else {
                const errorMessage = 'Failed to upload file. Please try again.';
                setUploadError(errorMessage);
                alert(errorMessage);
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Updated file change handler with client-side validation
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Clear previous errors
        setUploadError(null);

        // Check file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
            const errorMsg = 'File size must be less than 100MB';
            setUploadError(errorMsg);
            alert(errorMsg);
            return;
        }

        // Validate file type
        const validation = validateFileType(file);
        if (!validation.valid) {
            setUploadError(validation.error || 'Invalid file type');
            alert(validation.error);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedFile({
                name: file.name,
                size: file.size,
                type: file.type,
                data: event.target?.result as string,
                file: file,
            });
        };
        reader.onerror = () => {
            const errorMsg = 'Error reading file';
            setUploadError(errorMsg);
            alert(errorMsg);
        };
        reader.readAsDataURL(file);
    };

    const handleCommentSubmit = async () => {
        if (!commentContent.trim()) return;

        setIsCommenting(true);

        try {
            const response = await axios.post('/content/comment', {
                content: commentContent,
                conversation_id: search.conversation_id,
                parent_slug: search.slug,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.data.success) {
                if (response.data.conversation_messages) {
                    let newMessages = response.data.conversation_messages;
                    if (!isOwner) {
                        newMessages = newMessages.filter((msg: any) => msg.status !== 'hidden');
                    }
                    setConversation(newMessages);
                }
                
                setCommentContent('');
                setActiveInputTab('text');
                
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
                
                if (response.data.slug) {
                    window.history.replaceState(
                        { slug: response.data.slug },
                        '',
                        `/X/${encodeURIComponent(response.data.slug)}`
                    );
                }
            } else {
                alert(response.data.message || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Comment error:', error);
            if (axios.isAxiosError(error) && error.response) {
                alert(error.response.data.message || 'Failed to post comment');
            } else {
                alert('Failed to post comment. Please try again.');
            }
        } finally {
            setIsCommenting(false);
        }
    };

    const handleAskQuestion = async (e?: FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        
        if (isAiDisabled) {
            setErrorMessage(tooltips?.ai_search_view_disabled || 'Ask AI is currently disabled. Please try again later.');
            return;
        }
        
        if (!hasAccess) {
            setErrorMessage('You do not have permission to continue this conversation.');
            if (!currentUser && (conversationStatus === 'private' || guestInteractionDisabled)) {
                setShowLoginPrompt(true);
            }
            return;
        }
        
        if (newQuestion.length > maxChars) {
            setErrorMessage((tooltips?.ai_search_view_question_too_long || "Question exceeds maximum length of {max} characters. Please shorten your question.")
                .replace('{max}', maxChars.toString()));
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
                    parent_slug: search.slug,
                    enable_thinking: false,
                    web_search: webSearchEnabled,
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.conversation_messages && Array.isArray(data.conversation_messages)) {
                    let newMessages = data.conversation_messages;
                    if (!isOwner) {
                        newMessages = newMessages.filter((msg: any) => msg.status !== 'hidden');
                    }
                    setConversation(newMessages);
                }
                setNewQuestion('');
                
                if (data.conversation_cost !== undefined) {
                    setConversationCost(data.conversation_cost);
                }
                if (data.conversation_tokens !== undefined) {
                    setConversationTokens(data.conversation_tokens);
                }
                
                if (data.slug) {
                    window.history.replaceState(
                        { slug: data.slug }, 
                        '', 
                        `/X/${encodeURIComponent(data.slug)}`
                    );
                }
                
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            } else {
                alert(data.message || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error asking question:', error);
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

    // UPDATED RENDER FUNCTIONS FOR CONSISTENT LEFT-ALIGNED MARKDOWN RENDERING

    const renderFileUpload = (fileData: FileData) => {
        const isImage = fileData.mime_type.startsWith('image/');
        const isVideo = fileData.mime_type.startsWith('video/');
        const isAudio = fileData.mime_type.startsWith('audio/');
        const isPdf = fileData.mime_type === 'application/pdf';
        
        if (isImage) {
            return (
                <div className="w-full">
                    <div className="rounded-lg overflow-hidden border border-gray-200/80 bg-gray-50 flex items-center justify-center relative group/img max-h-64 shadow-2xs">
                        <img 
                            src={fileData.url} 
                            alt={fileData.original_name} 
                            className="max-h-64 w-full object-cover rounded-lg transition-transform duration-200 group-hover/img:scale-[1.02]"
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
        
        // Function to generate markdown content based on file type
        const getMarkdownContent = () => {
            if (isImage) {
                return `![${fileData.original_name}](${fileData.url})\n\n*${fileData.original_name}*`;
            }
            
            if (isVideo) {
                return `**Video:** ${fileData.original_name}\n\n<video src="${fileData.url}" controls style="max-width: 100%; border-radius: 0.5rem;">\n  Your browser does not support the video tag.\n</video>`;
            }
            
            if (isAudio) {
                return `**Audio:** ${fileData.original_name}\n\n<audio src="${fileData.url}" controls style="width: 100%;">\n  Your browser does not support the audio element.\n</audio>`;
            }
            
            if (isPdf) {
                return `**PDF Document:** ${fileData.original_name}\n\n<iframe src="${fileData.url}" style="width: 100%; height: 500px; border: none; border-radius: 0.5rem;" title="${fileData.original_name}">\n  Your browser does not support PDFs. [Download PDF](${fileData.url})\n</iframe>`;
            }
            
            // For other file types
            return `**File:** [${fileData.original_name}](${fileData.url}) (${formatFileSize(fileData.size)})`;
        };
        
        return (
            <div className="break-words">
                <MarkdownPreview
                    source={getMarkdownContent()}
                    style={{
                        ...markdownStyles,
                        backgroundColor: 'transparent',
                        fontSize: '15px',
                        color: '#1f2937',
                    }}
                />
            </div>
        );
    };

    const renderComment = (content: string) => {
        return (
            <div className="break-words">
                <MarkdownPreview
                    source={content}
                    style={{
                        ...markdownStyles,
                        backgroundColor: 'transparent',
                        fontSize: '15px',
                        color: '#1f2937',
                    }}
                />
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
                    />
                </div>
            );
        } else {
            return (
                <div className="break-words">
                    <div className="mb-2 flex items-center gap-2">
                        {message.file_metadata?.web_search && (
                            <span 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content="This response includes real-time web search results"
                            >
                                <FontAwesomeIcon icon={faEarth} className="w-3 h-3" />
                                Web Search
                            </span>
                        )}
                        {message.model && (
                            <span className="text-xs text-gray-400">
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
                    />
                </div>
            );
        }
    };

    const renderMessage = (message: ConversationMessage, isCommentCard: boolean = false) => {
        if (message.status === 'hidden' && !isOwner) {
            return null;
        }
        
        const isUser = message.message_role === 'user';
        const isCopied = copiedMessageId === message.id;
        
        let displayInfo = '';
        let ipDisplay = '';
        
        if (isUser) {
            if (message.ip_address) {
                ipDisplay = maskIPAddress(message.ip_address);
            }
            
            if (message.user && message.user.email) {
                const email = message.user.email;
                const [localPart, domain] = email.split('@');
                
                const maskedLocal = localPart.substring(0, 2) + '*'.repeat(3);
                const maskedDomain = '*'.repeat(3) + domain.substring(domain.length - 3);
                
                displayInfo = `${maskedLocal}@${maskedDomain}`;
            } else {
                displayInfo = 'Guest';
            }
        }
        
        const showHiddenBadge = message.status === 'hidden' && isOwner;
        
        const getContentTypeIcon = () => {
            if (showHiddenBadge) return <FontAwesomeIcon icon={faEyeSlash} className="w-4 h-4 text-white" />;
            
            if (message.content_type === 'upload') {
                const fileData = message.file_data;
                if (fileData) {
                    if (fileData.mime_type.startsWith('image/')) {
                        return <FontAwesomeIcon icon={faImage} className="w-4 h-4 text-white" />;
                    } else if (fileData.mime_type === 'application/pdf') {
                        return <FontAwesomeIcon icon={faFilePdfSolid} className="w-4 h-4 text-white" />;
                    } else if (fileData.mime_type.includes('video/')) {
                        return <FontAwesomeIcon icon={faFileVideo} className="w-4 h-4 text-white" />;
                    } else if (fileData.mime_type.includes('audio/')) {
                        return <FontAwesomeIcon icon={faFileAudio} className="w-4 h-4 text-white" />;
                    } else {
                        return <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 text-white" />;
                    }
                }
                return <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 text-white" />;
            } else if (message.content_type === 'comment') {
                return <FontAwesomeIcon icon={faComment} className="w-4 h-4 text-white" />;
            } else if (message.content_type === 'embed') {
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <rect x="3" y="3" width="8" height="8" rx="1.5"></rect>
                        <rect x="13" y="3" width="8" height="8" rx="1.5"></rect>
                        <rect x="3" y="13" width="8" height="8" rx="1.5"></rect>
                        <rect x="13" y="13" width="8" height="8" rx="1.5"></rect>
                    </svg>
                );
            } else if (isUser) {
                return <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-white" />;
            } else {
                return <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-white" />;
            }
        };
        
        const getAvatarBgColor = () => {
            if (showHiddenBadge) return 'bg-gray-400';
            if (message.content_type === 'upload') return 'bg-blue-500';
            if (message.content_type === 'comment') return 'bg-purple-500';
            if (message.content_type === 'embed') return 'bg-emerald-600';
            if (isUser) return 'bg-[#22c55e]';
            return 'bg-purple-500';
        };
        
        return (
            <div 
                id={`message-${message.slug}`}
                key={message.id} 
                className={`w-full scroll-mt-24 transition-all duration-200 group relative flex flex-col justify-between ${
                    isCommentCard 
                        ? 'bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-gray-300 p-4 min-h-[220px] mb-6' 
                        : 'mb-6 max-w-full'
                }`}
            >
                {showHiddenBadge && (
                    <div className={`${isCommentCard ? 'mb-2 inline-flex self-start' : 'absolute -left-24 top-1/2 transform -translate-y-1/2'} bg-gray-800 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm`}>
                        <FontAwesomeIcon icon={faEyeSlash} className="w-3 h-3" />
                        <span>Hidden</span>
                    </div>
                )}
                
                {!isCommentCard && (
                    <button
                        onClick={() => {
                            let textToCopy = '';
                            if (message.content_type === 'upload') {
                                textToCopy = `[File: ${message.file_data?.original_name}] ${message.file_data?.url}`;
                            } else if (message.content_type === 'comment' || message.content_type === 'embed') {
                                textToCopy = message.query;
                            } else {
                                textToCopy = isUser ? message.query : (message.response || '');
                            }
                            copyMessageToClipboard(message.id, textToCopy);
                        }}
                        className="absolute -left-10 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white border border-gray-200 rounded-lg p-2 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={isCopied ? (tooltips?.ai_search_view_message_copied || "Copied!") : (tooltips?.ai_search_view_copy_message || "Copy this message")}
                    >
                        {isCopied ? (
                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 w-4 h-4" />
                        ) : (
                            <FontAwesomeIcon icon={faCopy} className="text-gray-600 w-4 h-4" />
                        )}
                    </button>
                )}
                
                <div className={`flex ${isCommentCard ? 'flex-col flex-1 justify-between h-full' : 'gap-3'}`}>
                    <div className={isCommentCard ? 'flex items-start gap-3 mb-3' : 'contents'}>
                        <div 
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-2xs ring-2 ring-white ${getAvatarBgColor()}`}
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={
                                showHiddenBadge ? (tooltips?.ai_search_view_hidden_conversation || 'Hidden message (only visible to you)') : 
                                message.content_type === 'upload' ? (tooltips?.ai_search_view_upload_file || 'File upload') :
                                message.content_type === 'comment' ? (tooltips?.ai_search_view_add_comment || 'Comment') :
                                message.content_type === 'embed' ? 'Embed Row / Masonry' :
                                (isUser ? (tooltips?.ai_search_view_user_message || 'User message') : (tooltips?.ai_search_view_assistant_message || 'AI assistant response'))
                            }
                        >
                            {getContentTypeIcon()}
                        </div>
                        
                        {isCommentCard && isUser && (
                            <div className="flex-1 min-w-0">
                                {displayInfo && (
                                    <div 
                                        className="font-mono flex items-center gap-1.5 flex-wrap"
                                        title={message.user?.email || message.ip_address}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={message.user?.email ? 'Masked user email' : 'Guest user'}
                                    >
                                        <span className="text-gray-400 text-[11px]">User:</span> 
                                        <span className="font-semibold text-gray-800 text-[12px] truncate max-w-[130px]">{displayInfo}</span>
                                        {message.content_type === 'upload' && (
                                            <span className="text-blue-600 font-medium bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[10px]">(Upload)</span>
                                        )}
                                        {message.content_type === 'comment' && (
                                            <span className="text-purple-600 font-medium bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded text-[10px]">(Comment)</span>
                                        )}
                                        {message.content_type === 'embed' && (
                                            <span className="text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px]">(Embed)</span>
                                        )}
                                    </div>
                                )}
                                {ipDisplay && (
                                    <div 
                                        className="font-mono text-gray-400 text-[11px]"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={`IP Address: ${message.ip_address}`}
                                    >
                                        <span className="text-gray-300">IP:</span> {ipDisplay}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className={`flex-1 min-w-0 ${isCommentCard ? 'w-full flex flex-col justify-between' : ''}`}>
                        {!isCommentCard && isUser && (
                            <div className="text-xs text-gray-500 mb-1 space-y-0.5">
                                {displayInfo && (
                                    <div 
                                        className="font-mono flex items-center gap-2 flex-wrap"
                                        title={message.user?.email || message.ip_address}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={message.user?.email ? 'Masked user email' : 'Guest user'}
                                    >
                                        <span className="opacity-75">User:</span> 
                                        <span className="font-semibold">{displayInfo}</span>
                                        {message.content_type === 'upload' && (
                                            <span className="ml-2 text-blue-500">(Upload)</span>
                                        )}
                                        {message.content_type === 'comment' && (
                                            <span className="ml-2 text-purple-500">(Comment)</span>
                                        )}
                                        {message.content_type === 'embed' && (
                                            <span className="ml-2 text-emerald-600 font-semibold">(Embed)</span>
                                        )}
                                    </div>
                                )}
                                
                                {ipDisplay && (
                                    <div 
                                        className="font-mono text-gray-400"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={`IP Address: ${message.ip_address}`}
                                    >
                                        <span className="opacity-75">IP:</span> {ipDisplay}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className={`flex-1 min-w-0 w-full ${isCommentCard ? 'mb-3' : ''}`}>
                            {showHiddenBadge ? (
                                <div className="rounded-2xl px-4 py-3 bg-gray-200 text-gray-500 italic break-words">
                                    [This message has been hidden]
                                </div>
                            ) : message.content_type === 'upload' && message.file_data ? (
                                renderFileUpload(message.file_data)
                            ) : message.content_type === 'comment' ? (
                                renderComment(message.query)
                            ) : message.content_type === 'embed' ? (
                                <div className="break-words w-full">
                                    <HtmlDocPreview content={message.query} title="Embed Row / Masonry Layout" filename="embed.html" />
                                </div>
                            ) : (
                                renderAIMessage(message)
                            )}
                        </div>
                        
                        <div className={isCommentCard ? 'mt-auto pt-3 border-t border-gray-100 w-full' : ''}>
                            <div className={`flex items-center justify-between text-xs text-gray-400 ${isCommentCard ? 'mb-1' : 'mt-2'}`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span 
                                        className="text-gray-500"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={(tooltips?.ai_search_view_message_sent || "Message sent at {time}").replace('{time}', formatDate(message.created_at))}
                                    >
                                        {formatDate(message.created_at)}
                                    </span>
                                    
                                    {message.content_type === 'ai' && !isUser && message.total_tokens > 0 && !showHiddenBadge && (
                                        <>
                                            <span className="text-gray-400">•</span>
                                            <span 
                                                className="text-gray-500"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={(tooltips?.ai_search_view_tokens_used || "{count} total tokens used (prompt + completion)").replace('{count}', message.total_tokens.toString())}
                                            >
                                                {message.total_tokens} tokens
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span 
                                                className="text-gray-500"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={(tooltips?.ai_search_view_estimated_cost || "Estimated cost: ${cost}").replace('{cost}', getCostEstimate(message.total_tokens))}
                                            >
                                                ${getCostEstimate(message.total_tokens)}
                                            </span>
                                        </>
                                    )}
                                    
                                    {showHiddenBadge && (
                                        <>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-gray-500">Hidden</span>
                                        </>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link 
                                        href={`/X/${encodeURIComponent(message.slug)}`}
                                        className="text-gray-400 hover:text-[#22c55e] transition-colors p-1 rounded focus:outline-none"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_permalink || "View permanent link to this message"}
                                    >
                                        <FontAwesomeIcon icon={faExternalLink} className="w-3.5 h-3.5" />
                                    </Link>
                                    
                                    <button
                                        onClick={() => {
                                            let textToCopy = '';
                                            if (message.content_type === 'upload') {
                                                textToCopy = `[File: ${message.file_data?.original_name}] ${message.file_data?.url}`;
                                            } else if (message.content_type === 'comment') {
                                                textToCopy = message.query;
                                            } else {
                                                textToCopy = isUser ? message.query : (message.response || '');
                                            }
                                            copyMessageToClipboard(message.id, textToCopy);
                                        }}
                                        className={`text-gray-400 hover:text-[#22c55e] transition-colors p-1 rounded focus:outline-none ${isCopied ? 'text-green-500' : ''}`}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={isCopied ? (tooltips?.ai_search_view_message_copied || "Copied!") : (tooltips?.ai_search_view_copy_message || "Copy this message")}
                                    >
                                        {isCopied ? (
                                            <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5" />
                                        ) : (
                                            <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderInputTabs = () => {
        if (!hasAccess || (guestInteractionDisabled && !currentUser)) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faLock} className="text-2xl text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {requiresLogin 
                            ? (tooltips?.ai_search_view_login_required || "Login Required")
                            : (conversationStatus === 'private' 
                                ? (tooltips?.ai_search_view_private_conversation || "Private Conversation")
                                : (tooltips?.ai_search_view_guest_disabled || "Guest Interaction Disabled"))}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {requiresLogin
                            ? "The owner of this conversation has disabled guest interaction. Please log in to continue."
                            : conversationStatus === 'private'
                                ? "This is a private conversation. Please log in to continue."
                                : "The owner of this conversation has disabled guest interaction. Please log in to continue."}
                    </p>
                    <div className="flex justify-center gap-3">
                        <Link
                            href="/login"
                            className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors font-medium"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={tooltips?.ai_search_view_login || "Log In"}
                        >
                            Log In
                        </Link>
                        <Link
                            href="/register"
                            className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={tooltips?.ai_search_view_create_account || "Sign Up"}
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {/* Tab Navigation - Updated to match ezbar.tsx style */}
                <div className="flex items-center gap-2 p-4 border-b border-gray-200">
                    {/* Ask AI Tab */}
                    <button
                        onClick={() => setActiveInputTab('text')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                            activeInputTab === 'text'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={tooltips?.ai_search_view_ask_ai || "Ask AI a question"}
                    >
                        Ask AI
                    </button>
                    
                    {/* Upload Tab */}
                    <button
                        onClick={() => setActiveInputTab('upload')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                            activeInputTab === 'upload'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={tooltips?.ai_search_view_upload_file || "Upload files (Images, PDF, Video, Audio)"}
                    >
                        Upload Media {conversation.filter(m => m.content_type === 'upload').length > 0 && `(${conversation.filter(m => m.content_type === 'upload').length})`}
                    </button>
                    
                    {/* Comments Tab */}
                    <button
                        onClick={() => setActiveInputTab('comment')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                            activeInputTab === 'comment'
                                ? 'bg-[#22c55e] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={tooltips?.ai_search_view_add_comment || "Add a comment"}
                    >
                        Human Touch {conversation.filter(m => m.content_type === 'comment').length > 0 && `(${conversation.filter(m => m.content_type === 'comment').length})`}
                    </button>
                </div>

                <div className="p-6">
                    {activeInputTab === 'text' && (
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
                                    {/* Web Search Toggle */}
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center space-x-3">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer"
                                                    checked={webSearchEnabled}
                                                    onChange={(e) => setWebSearchEnabled(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#22c55e]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                                                <span className="ms-3 text-sm font-medium text-gray-700 flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faEarth} className="text-blue-500" />
                                                    Web Search
                                                </span>
                                            </label>
                                            
                                            {webSearchEnabled && (
                                                <span 
                                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content="Get real-time information from the internet"
                                                >
                                                    <FontAwesomeIcon icon={faEarth} className="w-3 h-3" />
                                                    Using kimi-k2-turbo-preview
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div 
                                            className="text-xs text-gray-400 cursor-help"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Enable web search to get real-time information from the internet"
                                        >
                                            ⓘ
                                        </div>
                                    </div>

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

                    {activeInputTab === 'comment' && (
                        <div className="space-y-4">
                            {/* Comment Input */}
                            <EnhancedMDEditor
                                value={commentContent}
                                onChange={(value) => setCommentContent(value || '')}
                                placeholder="Write your comment here... (Markdown supported)"
                                minHeight={300}
                            />
                            
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={!commentContent.trim() || isCommenting}
                                    className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={!commentContent.trim() ? (tooltips?.ai_search_view_type_comment || "Type a comment first") : (tooltips?.ai_search_view_post_comment || "Post your comment")}
                                >
                                    {isCommenting ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            <span>Posting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faComment} />
                                            <span>Post Comment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeInputTab === 'upload' && (
                        <div className="space-y-4">
                            {uploadError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                                    <span className="text-sm">{uploadError}</span>
                                    <button
                                        onClick={() => setUploadError(null)}
                                        className="ml-auto text-red-500 hover:text-red-700"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_close_alert || "Close notification"}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                            )}
                            
                            {!selectedFile ? (
                                <div
                                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={tooltips?.ai_search_view_click_upload || "Click to upload or drag & drop"}
                                >
                                    <div className="flex flex-col items-center justify-center">
                                        <FontAwesomeIcon icon={faUpload} className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag & drop
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {tooltips?.ai_search_view_file_types || "Images, PDF, Video, Audio files up to 100MB"}
                                        </p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.pdf,video/*,audio/*,.mp4,.webm,.ogg,.mp3,.wav,.mov,.avi"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative group bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setUploadError(null);
                                            }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_remove_file || "Remove file"}
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                        </button>
                                        
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded flex items-center justify-center bg-blue-500">
                                                {selectedFile.type.startsWith('image/') ? (
                                                    <img 
                                                        src={selectedFile.data} 
                                                        alt={selectedFile.name}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                ) : selectedFile.type.startsWith('video/') ? (
                                                    <FontAwesomeIcon icon={faFileVideo} className="text-white text-xl" />
                                                ) : selectedFile.type.startsWith('audio/') ? (
                                                    <FontAwesomeIcon icon={faFileAudio} className="text-white text-xl" />
                                                ) : selectedFile.type === 'application/pdf' ? (
                                                    <FontAwesomeIcon icon={faFilePdfSolid} className="text-white text-xl" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faFileAlt} className="text-white text-xl" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="Add a description (optional)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleFileUpload}
                                            disabled={isUploading}
                                            className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_upload_file_button || "Upload your file"}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                    <span>Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faUpload} />
                                                    <span>Upload File</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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

    if (!hasAccess) {
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
            <div className="min-h-screen bg-[#FCFCFC] text-slate-800">
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

                {errorMessage && (
                    <div 
                        className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={tooltips?.ai_search_view_error_notification || "Error notification"}
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
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
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FontAwesomeIcon icon={faUserLock} className="text-2xl text-purple-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {requiresLogin 
                                            ? (tooltips?.ai_search_view_login_required || "Login Required")
                                            : (tooltips?.ai_search_view_private_conversation || "Private Conversation")}
                                    </h3>
                                    <p className="text-gray-600">
                                        {requiresLogin
                                            ? "The owner of this conversation has disabled guest interaction. Please log in to continue the conversation."
                                            : "This is a private conversation. Please log in to continue the conversation."}
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

                <header className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Link href="/" className="flex items-center space-x-2">
                                    <img 
                                        src="/ezlogo.png" 
                                        alt="Ez.wiki Logo" 
                                        className="w-8 h-8 object-contain rounded"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_go_homepage || "Go to homepage"}
                                    />
                                    <span className="text-xl font-semibold text-gray-900">Ez.wiki</span>
                                </Link>
                                
                                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                                    <span 
                                        className="px-2 py-1 bg-gray-100 rounded flex items-center gap-1"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={
                                            conversationStatus === 'public' ? (tooltips?.ai_search_view_public_conversation || 'Public conversation - anyone can view') :
                                            conversationStatus === 'private' ? (tooltips?.ai_search_view_private_conversation || 'Private conversation - only you can view') :
                                            (tooltips?.ai_search_view_hidden_conversation || 'Hidden conversation')
                                        }
                                    >
                                        {conversationStatus === 'private' && <FontAwesomeIcon icon={faLock} className="w-3 h-3" />}
                                        {conversationStatus === 'hidden' && <FontAwesomeIcon icon={faEyeSlash} className="w-3 h-3" />}
                                        AI Conversation
                                    </span>
                                    <span>•</span>
                                    <span
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={tooltips?.ai_search_view_total_messages || "Total messages in this conversation"}
                                    >
                                        {conversation.length} messages
                                    </span>
                                    <span>•</span>
                                    <span
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={`Conversation started on ${formatDate(search.created_at)}`}
                                    >
                                        {formatDate(search.created_at)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={copyToClipboard}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2 text-sm relative"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={isCopied ? (tooltips?.ai_search_view_link_copied || "Link copied!") : (tooltips?.ai_search_view_copy_link || "Copy conversation link to clipboard")}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                    </svg>
                                    <span>{isCopied ? (tooltips?.ai_search_view_link_copied || 'Copied!') : 'Copy Link'}</span>
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
                            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
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

                <main className="container mx-auto px-4 py-8 max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-24">
                                <div className="mb-6">
                                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                        {tooltips?.ai_search_view_quick_actions || "Quick Actions"}
                                    </h2>
                                    <div className="space-y-3 mb-2">
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => startSlowAutoScroll('up')}
                                                    className={`flex-1 px-3 py-2 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 ${
                                                        autoScrollDirection === 'up'
                                                            ? 'bg-blue-600 ring-2 ring-blue-300 animate-pulse'
                                                            : 'bg-blue-500 hover:bg-blue-600'
                                                    }`}
                                                    title={autoScrollDirection === 'up' ? "Click to stop auto-scrolling" : (tooltips?.ai_search_view_scroll_top || "Auto scroll to top in slow motion")}
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={autoScrollDirection === 'up' ? "Auto-scrolling up (Click to stop)" : (tooltips?.ai_search_view_scroll_top || "Auto scroll to top in slow motion")}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="m5 17 7-7 7 7"/>
                                                        <path d="m5 7 7-7 7 7"/>
                                                    </svg>
                                                    <span>Top</span>
                                                </button>

                                                <button 
                                                    onClick={() => startSlowAutoScroll('down')}
                                                    className={`flex-1 px-3 py-2 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 ${
                                                        autoScrollDirection === 'down'
                                                            ? 'bg-green-600 ring-2 ring-green-300 animate-pulse'
                                                            : 'bg-green-500 hover:bg-green-600'
                                                    }`}
                                                    title={autoScrollDirection === 'down' ? "Click to stop auto-scrolling" : (tooltips?.ai_search_view_scroll_bottom || "Auto scroll to bottom in slow motion")}
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={autoScrollDirection === 'down' ? "Auto-scrolling down (Click to stop)" : (tooltips?.ai_search_view_scroll_bottom || "Auto scroll to bottom in slow motion")}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="m19 12-7-5-7 5"/>
                                                        <path d="m5 7 7 5 7-5"/>
                                                    </svg>
                                                    <span>Bottom</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                                                data-tooltip-content={tooltips?.ai_search_view_private_conversation || "Private conversation - only visible to you"}
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
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                            Embeds: {conversation.filter(m => m.content_type === 'embed').length}
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            Uploads: {conversation.filter(m => m.content_type === 'upload').length}
                                        </span>
                                    </div>
                                </div>
                                
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
                                                                        } else if (msg.content_type === 'embed') {
                                                                            preview = `[Embed] Layout`;
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
                                                <span>Embeds:</span>
                                                <span className="font-medium text-gray-900">
                                                    {conversation.filter(m => m.content_type === 'embed').length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>File uploads:</span>
                                                <span className="font-medium text-gray-900">
                                                    {conversation.filter(m => m.content_type === 'upload').length}
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
                        
                        <div className="lg:col-span-3">
                            <div className={`rounded-xl p-6 text-white mb-6 ${
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
                                    </div>
                                    <div className="text-right">
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
                                            className="text-sm text-purple-200 mt-1"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={tooltips?.ai_search_view_conversation_cost_tooltip || "Total cost of this conversation"}
                                        >
                                            Total Cost: ${conversationCost.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div 
                                ref={conversationContainerRef}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6"
                            >
                                <div className="p-6">
                                    {conversation.length > 0 ? (
                                        (() => {
                                            const rootMessage = conversation.find(msg => !msg.parent_id) || conversation[0];
                                            const comments = conversation.filter(msg => msg.id !== rootMessage?.id);

                                            return (
                                                <div>
                                                    {/* Main Root Conversation Message */}
                                                    {rootMessage && renderMessage(rootMessage, false)}

                                                    {/* Conversation Comments - Side-by-side Grid matching Image 2 */}
                                                    {comments.length > 0 && (
                                                        <div className="mt-8 pt-6 border-t border-gray-100">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-gray-800">Comments & Replies</span>
                                                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                                                        {comments.length}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Masonry
                                                                breakpointCols={commentMasonryBreakpoints}
                                                                className="my-masonry-grid"
                                                                columnClassName="my-masonry-grid_column"
                                                            >
                                                                {comments.map((comment) => renderMessage(comment, true))}
                                                            </Masonry>
                                                        </div>
                                                    )}
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
                            
                            {hasAccess && !(guestInteractionDisabled && !currentUser) && renderInputTabs()}
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
            </div>

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
            `}</style>
        </>
    );
}