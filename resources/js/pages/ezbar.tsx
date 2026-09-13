import { Head, usePage, Link, router } from '@inertiajs/react';
import type { SharedData } from '@/types';
import { useState, useCallback, FormEvent, KeyboardEvent, useEffect, useRef, useMemo, memo } from 'react';
import axios, { AxiosError } from 'axios';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { QRCodeCanvas } from 'qrcode.react';
import DraggableMenu from '@/components/DraggableMenu';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
// Import local fonts
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
// Import for file upload icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faLayerGroup, faFileImage, faFileWord, faFileAlt, faTimes, faSpinner, faCheckCircle, faExclamationTriangle, faFileCode } from '@fortawesome/free-solid-svg-icons';
// Import the EnhancedMDEditor component
import EnhancedMDEditor from '@/components/EnhancedMDEditor';
// Import Swiper components and styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
// Import SocialMediaComposer
import SocialMediaComposer from '@/components/SocialMediaComposer';

// Constants and types moved to top for better organization
const DEBOUNCE_DELAY_LINK = 800;
const DEBOUNCE_DELAY_AI = 500;
const TYPING_TIMEOUT = 300;
const MIN_QUERY_LENGTH_FOR_SUGGESTIONS = 2;
const AUTO_REDIRECT_DELAY = 800;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
// Default fallback values if settings aren't loaded
const DEFAULT_GUEST_CHAR_LIMIT = 300;
const DEFAULT_USER_CHAR_LIMIT = 2000;

// Add ModelOption interface with provider
interface ModelOption {
    id: string;
    name: string;
    description: string;
    isNew?: boolean;
    isPrevious?: boolean;
    type: 'flagship' | 'vision' | 'other';
    provider: 'moonshot' | 'openai' | 'deepseek' | 'perplexity' | 'gemini';
}

interface AiSettings {
    guest_ai_enabled: boolean;
    guest_char_limit: number;
    user_ai_enabled: boolean;
    user_char_limit: number;
}

interface SearchResult {
    id: number;
    type: string;
    url: string;
    title: string;
    subtitle?: string;
    score: number;
    created_at?: string;
    domain?: string;
    domainselected?: string;
    unique_id?: string;
    token?: string;
    slug?: string;
    conversation_id?: string;
    conversation_title?: string;
    message_count?: number;
    query_preview?: string;
}

interface AISearchResponse {
    success: boolean;
    answer?: string;
    message?: string;
    query?: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    thinking_enabled?: boolean;
    model?: string;
    sources?: string[];
    conversation_id?: string;
    thread_id?: string;
    conversation_title?: string;
    conversation_messages?: ConversationMessage[];
    message_count?: number;
    conversation_tokens?: number;
    conversation_cost?: number;
    slug?: string;
    parent_slug?: string;
    redirect_to_conversation?: boolean;
    conversation_slug?: string;
    conversation_url?: string;
}

interface ConversationMessage {
    id: number;
    slug: string;
    message_role: 'user' | 'assistant' | 'system';
    content_type: 'ai' | 'comment' | 'upload' | 'social' | 'social_media' | 'landing_page' | 'embed' | 'conversationcomment';
    query: string;
    response: string | null;
    file_data?: {
        original_name: string;
        size: number;
        mime_type: string;
        extension: string;
        path: string;
        url: string;
        access_token: string;
        width?: number;
        height?: number;
    } | null;
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
    user?: {
        id: number;
        name: string;
    };
}

interface LinkSearchResponse {
    results: SearchResult[] | Record<string, SearchResult>;
    suggestions?: string[];
    query: string;
    total: number;
    categories?: Record<string, number>;
    current_page?: number;
    total_pages?: number;
    per_page?: number;
    has_more?: boolean;
    all_results_count?: number;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

interface AISlugSearchResponse {
    success: boolean;
    results: SearchResult[];
    query: string;
    total: number;
    current_page?: number;
    total_pages?: number;
    per_page?: number;
    has_more?: boolean;
    all_results_count?: number;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

interface PopularTopic {
    id: string;
    label: string;
    icon: JSX.Element;
}

interface QrModalState {
    isOpen: boolean;
    url: string;
    title: string;
}

interface ComingSoonModalState {
    isOpen: boolean;
    feature: string;
    description: string;
    iconColor: string;
    icon: JSX.Element | null;
}

// Add new type for content tabs - WIKI REMOVED
type ContentTab = 'content' | 'text';
type ContentSubTab = 'composer' | 'upload' | 'embed' | 'geoslug';

// Add interface for uploaded file
interface UploadedFile {
    name: string;
    size: number;
    type: string;
    data: string; // base64 encoded data
    file?: File; // original file object
}

interface CommentMessage {
    id: number;
    slug: string;
    content: string;
    created_at: string;
    formatted_created_at: string;
    user?: {
        id: number;
        name: string;
    };
    share_url: string;
}

interface Domain {
    id: number;
    domain: string;
}

// Allowed file types for upload
const ALLOWED_FILE_TYPES = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
    // PDF
    'application/pdf',
    // Videos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm', 'audio/x-wav',
    // HTML files
    'text/html',
    'application/xhtml+xml',
];

const ALLOWED_FILE_EXTENSIONS = [
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webm', '.bmp', '.svg',
    // PDF
    '.pdf',
    // Videos
    '.mp4', '.webm', '.ogg', '.mov', '.avi',
    // Audio
    '.mp3', '.wav', '.ogg', '.m4a',
    // HTML files
    '.html', '.htm',
];

// Helper function to detect if content contains markdown syntax
const hasMarkdownSyntax = (content: string): boolean => {
    const markdownPatterns = [
        /^#+\s/,              // Headers
        /\*\*.+\*\*/,         // Bold
        /_{2}.+_{2}/,         // Bold/Italic
        /\*.+\*/,             // Italic
        /\[.+\]\(.+\)/,       // Links
        /^- /,                // List items
        /^\d+\. /,            // Numbered list
        /```/,                // Code blocks
        /`[^`]+`/,            // Inline code
        />\s/,                // Blockquotes
        /!\[.*\]\(.*\)/,      // Markdown Images
        /^\|/,                // Tables
    ];
    return markdownPatterns.some(pattern => pattern.test(content));
};

// Helper function to get tooltip with fallback
const getTooltip = (tooltips: Record<string, string>, key: string, fallback: string): string => {
    return tooltips?.[key] || fallback;
};

// Helper function to replace placeholders in tooltip content
const formatTooltip = (tooltip: string, replacements: Record<string, string | number>): string => {
    let result = tooltip;
    for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
    return result;
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
};

// Helper function to get file icon
const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) {
        return faFileImage;
    } else if (mimeType === 'application/pdf') {
        return faFilePdf;
    } else if (mimeType.includes('word') || fileName.match(/doc|docx/)) {
        return faFileWord;
    } else if (mimeType === 'text/html' || fileName.match(/html|htm/)) {
        return faFileCode;
    } else {
        return faFileAlt;
    }
};

// Helper function to get model provider styles
const getModelProviderStyles = (provider: string) => {
    switch(provider) {
        case 'gemini':
            return { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', badgeBg: 'bg-blue-600', badgeText: 'text-white' };
        case 'deepseek':
            return { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', badgeBg: 'bg-blue-600', badgeText: 'text-white' };
        case 'openai':
            return { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', badgeBg: 'bg-emerald-600', badgeText: 'text-white' };
        case 'perplexity':
            return { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200', badgeBg: 'bg-purple-600', badgeText: 'text-white' };
        case 'moonshot':
            return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', badgeBg: 'bg-green-600', badgeText: 'text-white' };
        default:
            return { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-200', badgeBg: 'bg-gray-600', badgeText: 'text-white' };
    }
};

// Tab Icon Component
const TabIcon = ({ icon, label, count, locked, active }: { 
    icon: React.ReactNode; 
    label: string; 
    count?: number; 
    locked?: boolean;
    active?: boolean;
}) => (
    <div className="flex items-center justify-center space-x-1.5">
        {icon}
        <span className="whitespace-nowrap">
            {label}{count !== undefined && count > 0 && ` (${count})`}
        </span>
        {locked && <span className="text-[9px] ml-0.5">🔒</span>}
    </div>
);

// Memoized Top Content Component with Swiper
const TopContent = memo(({ content }: { content: any[] | string }) => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
        return (
            <div className="flex justify-center items-center mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
                <p className="font-medium tracking-tight text-[#1E3033] text-center max-w-3xl">
                    Caution: We are in the pre-alpha test, all answers are open to the general public.
                </p>
            </div>
        );
    }

    if (typeof content === 'string') {
        const isMarkdown = hasMarkdownSyntax(content);
        
        if (isMarkdown) {
            return (
                <div className="flex justify-center items-center mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
                    <div className="w-full max-w-4xl top-markdown-content">
                        <MarkdownPreview 
                            source={content}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#1E3033',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                fontSize: '14px',
                                lineHeight: '1.6',
                            }}
                            wrapperElement={{
                                'data-color-mode': 'light'
                            }}
                        />
                    </div>
                </div>
            );
        }
        
        return (
            <div className="flex justify-center items-center mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
                <div 
                    className="font-medium tracking-tight text-[#1E3033] text-center max-w-4xl"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        );
    }

    if (Array.isArray(content) && content.length > 0) {
        const hasMultipleSlides = content.length > 1;
        
        return (
            <div className="w-full mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
                <Swiper
                    modules={[Autoplay, Pagination, Navigation, EffectFade]}
                    spaceBetween={30}
                    slidesPerView={1}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    navigation={hasMultipleSlides}
                    loop={hasMultipleSlides}
                    className="top-content-swiper"
                    style={{
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        maxHeight: '400px',
                    }}
                >
                    {content.map((item, index) => {
                        const isMarkdown = hasMarkdownSyntax(item.content);
                        
                        return (
                            <SwiperSlide key={item.id || index}>
                                {isMarkdown ? (
                                    <div className="text-center mx-auto w-full top-markdown-slide">
                                        <MarkdownPreview 
                                            source={item.content}
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: '#1E3033',
                                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                fontSize: '14px',
                                                lineHeight: '1.6',
                                            }}
                                            wrapperElement={{
                                                'data-color-mode': 'light'
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div 
                                        className="text-center mx-auto w-full"
                                        dangerouslySetInnerHTML={{ __html: item.content }}
                                    />
                                )}
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
                
                <style>{`
                    .top-content-swiper .swiper-slide {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .top-content-swiper .swiper-button-next,
                    .top-content-swiper .swiper-button-prev {
                        color: #22c55e;
                        background: rgba(255, 255, 255, 0.95);
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s ease;
                    }
                    .top-content-swiper .swiper-button-next:after,
                    .top-content-swiper .swiper-button-prev:after {
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .top-content-swiper .swiper-button-next:hover,
                    .top-content-swiper .swiper-button-prev:hover {
                        background: #22c55e;
                        color: white;
                        transform: scale(1.05);
                    }
                    .top-content-swiper .swiper-pagination-bullet {
                        background: #cbd5e0;
                        opacity: 0.7;
                        width: 8px;
                        height: 8px;
                        transition: all 0.3s ease;
                    }
                    .top-content-swiper .swiper-pagination-bullet-active {
                        background: #22c55e;
                        width: 24px;
                        border-radius: 4px;
                    }
                    .top-content-swiper .swiper-pagination {
                        bottom: 15px;
                    }
                    
                    .top-markdown-content .wmde-markdown,
                    .top-markdown-slide .wmde-markdown {
                        background-color: transparent !important;
                        color: #1E3033 !important;
                        text-align: center !important;
                    }
                    .top-markdown-content .wmde-markdown table,
                    .top-markdown-slide .wmde-markdown table {
                        border: 1px solid #e2e8f0 !important;
                        background-color: #ffffff !important;
                        border-collapse: collapse !important;
                        width: 100% !important;
                        margin: 1rem 0 !important;
                    }
                    .top-markdown-content .wmde-markdown th,
                    .top-markdown-slide .wmde-markdown th {
                        background-color: #f7fafc !important;
                        border: 1px solid #e2e8f0 !important;
                        padding: 8px 12px !important;
                        font-weight: bold !important;
                    }
                    .top-markdown-content .wmde-markdown td,
                    .top-markdown-slide .wmde-markdown td {
                        border: 1px solid #e2e8f0 !important;
                        padding: 8px 12px !important;
                    }
                    .top-markdown-content .wmde-markdown code,
                    .top-markdown-slide .wmde-markdown code {
                        background-color: #f7fafc !important;
                        color: #22c55e !important;
                        border-radius: 4px !important;
                        padding: 2px 6px !important;
                    }
                    .top-markdown-content .wmde-markdown pre,
                    .top-markdown-slide .wmde-markdown pre {
                        background-color: #f7fafc !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 6px !important;
                        padding: 1rem !important;
                        overflow: auto !important;
                        text-align: left !important;
                    }
                    .top-markdown-content .wmde-markdown blockquote,
                    .top-markdown-slide .wmde-markdown blockquote {
                        border-left: 4px solid #22c55e !important;
                        background-color: #f7fafc !important;
                        padding: 0.5rem 1rem !important;
                        margin: 1rem 0 !important;
                    }
                    .top-markdown-content .wmde-markdown a,
                    .top-markdown-slide .wmde-markdown a {
                        color: #22c55e !important;
                        text-decoration: none !important;
                    }
                    .top-markdown-content .wmde-markdown a:hover,
                    .top-markdown-slide .wmde-markdown a:hover {
                        text-decoration: underline !important;
                    }
                    .top-markdown-content .wmde-markdown h1,
                    .top-markdown-content .wmde-markdown h2,
                    .top-markdown-content .wmde-markdown h3,
                    .top-markdown-content .wmde-markdown h4,
                    .top-markdown-slide .wmde-markdown h1,
                    .top-markdown-slide .wmde-markdown h2,
                    .top-markdown-slide .wmde-markdown h3,
                    .top-markdown-slide .wmde-markdown h4 {
                        color: #1E3033 !important;
                        border-bottom: 1px solid #e2e8f0 !important;
                        padding-bottom: 0.3rem !important;
                        text-align: center !important;
                    }
                    .top-markdown-content .wmde-markdown ul,
                    .top-markdown-content .wmde-markdown ol,
                    .top-markdown-slide .wmde-markdown ul,
                    .top-markdown-slide .wmde-markdown ol {
                        text-align: left !important;
                        display: inline-block !important;
                    }
                    .top-markdown-content .wmde-markdown li,
                    .top-markdown-slide .wmde-markdown li {
                        text-align: left !important;
                    }
                    
                    @media (max-width: 768px) {
                        .top-content-swiper .swiper-button-next,
                        .top-content-swiper .swiper-button-prev {
                            width: 30px;
                            height: 30px;
                        }
                        .top-content-swiper .swiper-button-next:after,
                        .top-content-swiper .swiper-button-prev:after {
                            font-size: 14px;
                        }
                        .top-content-swiper .swiper-pagination-bullet {
                            width: 6px;
                            height: 6px;
                        }
                        .top-content-swiper .swiper-pagination-bullet-active {
                            width: 18px;
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
            <p className="font-medium tracking-tight text-[#1E3033] text-center max-w-3xl">
                Caution: We are in the pre-alpha test, all answers are open to the general public.
            </p>
        </div>
    );
});

TopContent.displayName = 'TopContent';

// Memoized Bottom Content Component with Swiper
const BottomContent = memo(({ content }: { content: any[] | string }) => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
        return (
            <div className="flex justify-center items-center mt-6 md:mt-8 lg:mt-10 mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
                <p className="font-medium tracking-tight text-[#1E3033] text-center max-w-3xl">
                    Caution: We are in the pre-alpha test, all answers are open to the general public.
                </p>
            </div>
        );
    }

    if (typeof content === 'string') {
        const isMarkdown = hasMarkdownSyntax(content);
        
        if (isMarkdown) {
            return (
                <div className="flex justify-center items-center mt-6 md:mt-8 lg:mt-10 mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
                    <div className="w-full max-w-4xl bottom-markdown-content">
                        <MarkdownPreview 
                            source={content}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#1E3033',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                fontSize: '14px',
                                lineHeight: '1.6',
                            }}
                            wrapperElement={{
                                'data-color-mode': 'light'
                            }}
                        />
                    </div>
                </div>
            );
        }
        
        return (
            <div className="flex justify-center items-center mt-6 md:mt-8 lg:mt-10 mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
                <div 
                    className="font-medium tracking-tight text-[#1E3033] text-center max-w-4xl"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        );
    }

    if (Array.isArray(content) && content.length > 0) {
        const hasMultipleSlides = content.length > 1;
        
        return (
            <div className="w-full mt-8 md:mt-12 lg:mt-16 max-h-[400px] overflow-y-auto">
                <Swiper
                    modules={[Autoplay, Pagination, Navigation, EffectFade]}
                    spaceBetween={30}
                    slidesPerView={1}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    navigation={hasMultipleSlides}
                    loop={hasMultipleSlides}
                    className="bottom-content-swiper"
                    style={{
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        maxHeight: '400px',
                    }}
                >
                    {content.map((item, index) => {
                        const isMarkdown = hasMarkdownSyntax(item.content);
                        
                        return (
                            <SwiperSlide key={item.id || index}>
                                {isMarkdown ? (
                                    <div className="text-center mx-auto w-full bottom-markdown-slide">
                                        <MarkdownPreview 
                                            source={item.content}
                                            style={{
                                                backgroundColor: 'transparent',
                                                color: '#1E3033',
                                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                fontSize: '14px',
                                                lineHeight: '1.6',
                                            }}
                                            wrapperElement={{
                                                'data-color-mode': 'light'
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div 
                                        className="text-center mx-auto w-full"
                                        dangerouslySetInnerHTML={{ __html: item.content }}
                                    />
                                )}
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
                
                <style>{`
                    .bottom-content-swiper .swiper-slide {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .bottom-content-swiper .swiper-button-next,
                    .bottom-content-swiper .swiper-button-prev {
                        color: #22c55e;
                        background: rgba(255, 255, 255, 0.95);
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s ease;
                    }
                    .bottom-content-swiper .swiper-button-next:after,
                    .bottom-content-swiper .swiper-button-prev:after {
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .bottom-content-swiper .swiper-button-next:hover,
                    .bottom-content-swiper .swiper-button-prev:hover {
                        background: #22c55e;
                        color: white;
                        transform: scale(1.05);
                    }
                    .bottom-content-swiper .swiper-pagination-bullet {
                        background: #cbd5e0;
                        opacity: 0.7;
                        width: 8px;
                        height: 8px;
                        transition: all 0.3s ease;
                    }
                    .bottom-content-swiper .swiper-pagination-bullet-active {
                        background: #22c55e;
                        width: 24px;
                        border-radius: 4px;
                    }
                    .bottom-content-swiper .swiper-pagination {
                        bottom: 15px;
                    }
                    
                    .bottom-markdown-content .wmde-markdown,
                    .bottom-markdown-slide .wmde-markdown {
                        background-color: transparent !important;
                        color: #1E3033 !important;
                        text-align: center !important;
                    }
                    .bottom-markdown-content .wmde-markdown table,
                    .bottom-markdown-slide .wmde-markdown table {
                        border: 1px solid #e2e8f0 !important;
                        background-color: #ffffff !important;
                        border-collapse: collapse !important;
                        width: 100% !important;
                        margin: 1rem 0 !important;
                    }
                    .bottom-markdown-content .wmde-markdown th,
                    .bottom-markdown-slide .wmde-markdown th {
                        background-color: #f7fafc !important;
                        border: 1px solid #e2e8f0 !important;
                        padding: 8px 12px !important;
                        font-weight: bold !important;
                    }
                    .bottom-markdown-content .wmde-markdown td,
                    .bottom-markdown-slide .wmde-markdown td {
                        border: 1px solid #e2e8f0 !important;
                        padding: 8px 12px !important;
                    }
                    .bottom-markdown-content .wmde-markdown code,
                    .bottom-markdown-slide .wmde-markdown code {
                        background-color: #f7fafc !important;
                        color: #22c55e !important;
                        border-radius: 4px !important;
                        padding: 2px 6px !important;
                    }
                    .bottom-markdown-content .wmde-markdown pre,
                    .bottom-markdown-slide .wmde-markdown pre {
                        background-color: #f7fafc !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 6px !important;
                        padding: 1rem !important;
                        overflow: auto !important;
                        text-align: left !important;
                    }
                    .bottom-markdown-content .wmde-markdown blockquote,
                    .bottom-markdown-slide .wmde-markdown blockquote {
                        border-left: 4px solid #22c55e !important;
                        background-color: #f7fafc !important;
                        padding: 0.5rem 1rem !important;
                        margin: 1rem 0 !important;
                    }
                    .bottom-markdown-content .wmde-markdown a,
                    .bottom-markdown-slide .wmde-markdown a {
                        color: #22c55e !important;
                        text-decoration: none !important;
                    }
                    .bottom-markdown-content .wmde-markdown a:hover,
                    .bottom-markdown-slide .wmde-markdown a:hover {
                        text-decoration: underline !important;
                    }
                    .bottom-markdown-content .wmde-markdown h1,
                    .bottom-markdown-content .wmde-markdown h2,
                    .bottom-markdown-content .wmde-markdown h3,
                    .bottom-markdown-content .wmde-markdown h4,
                    .bottom-markdown-slide .wmde-markdown h1,
                    .bottom-markdown-slide .wmde-markdown h2,
                    .bottom-markdown-slide .wmde-markdown h3,
                    .bottom-markdown-slide .wmde-markdown h4 {
                        color: #1E3033 !important;
                        border-bottom: 1px solid #e2e8f0 !important;
                        padding-bottom: 0.3rem !important;
                        text-align: center !important;
                    }
                    .bottom-markdown-content .wmde-markdown ul,
                    .bottom-markdown-content .wmde-markdown ol,
                    .bottom-markdown-slide .wmde-markdown ul,
                    .bottom-markdown-slide .wmde-markdown ol {
                        text-align: left !important;
                        display: inline-block !important;
                    }
                    .bottom-markdown-content .wmde-markdown li,
                    .bottom-markdown-slide .wmde-markdown li {
                        text-align: left !important;
                    }
                    
                    @media (max-width: 768px) {
                        .bottom-content-swiper .swiper-button-next,
                        .bottom-content-swiper .swiper-button-prev {
                            width: 30px;
                            height: 30px;
                        }
                        .bottom-content-swiper .swiper-button-next:after,
                        .bottom-content-swiper .swiper-button-prev:after {
                            font-size: 14px;
                        }
                        .bottom-content-swiper .swiper-pagination-bullet {
                            width: 6px;
                            height: 6px;
                        }
                        .bottom-content-swiper .swiper-pagination-bullet-active {
                            width: 18px;
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center mt-6 md:mt-8 lg:mt-10 mb-6 md:mb-8 lg:mb-10 max-h-[400px] overflow-y-auto">
            <p className="font-medium tracking-tight text-[#1E3033] text-center max-w-3xl">
                Caution: We are in the pre-alpha test, all answers are open to the general public.
            </p>
        </div>
    );
});

BottomContent.displayName = 'BottomContent';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Custom hook for typing detection
function useTypingDetection(delay: number = TYPING_TIMEOUT) {
    const isTypingRef = useRef(false);
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const startTyping = useCallback(() => {
        isTypingRef.current = true;

        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }

        typingTimerRef.current = setTimeout(() => {
            isTypingRef.current = false;
        }, delay);
    }, [delay]);

    const stopTyping = useCallback(() => {
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }
        isTypingRef.current = false;
    }, []);

    useEffect(() => {
        return () => {
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
            }
        };
    }, []);

    return { isTypingRef, startTyping, stopTyping };
}

// Helper function to extract CSRF token
const getCsrfToken = (): string => {
    const metaElement = document.querySelector('meta[name="csrf-token"]');
    return metaElement?.getAttribute('content') || '';
};

// Helper function to get result type styling
const getResultTypeStyles = (type: string): { bg: string; text: string } => {
    const typeMap: Record<string, { bg: string; text: string }> = {
        custom_domain: { bg: 'bg-green-100', text: 'text-green-600' },
        domain: { bg: 'bg-green-100', text: 'text-green-600' },
        funnel: { bg: 'bg-blue-100', text: 'text-blue-600' },
        field: { bg: 'bg-purple-100', text: 'text-purple-600' },
        theme: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
        ai_conversation: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    };

    return typeMap[type] || { bg: 'bg-gray-100', text: 'text-gray-600' };
};

// Helper function to encode slug for URL
const encodeSlugForUrl = (slug: string): string => {
    return encodeURIComponent(slug);
};

// Helper function to validate file type
const isValidFileType = (file: File): { valid: boolean; message: string } => {
    if (ALLOWED_FILE_TYPES.includes(file.type)) {
        return { valid: true, message: '' };
    }
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (extension && ALLOWED_FILE_EXTENSIONS.includes(extension)) {
        return { valid: true, message: '' };
    }
    
    return { 
        valid: false, 
        message: 'File type not allowed. Only images, PDF, video, audio, and HTML files are permitted.' 
    };
};

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth, topcontent, bottomcontent, aiSettings: initialAiSettings, tooltips = {}, domains = [] } = usePage<SharedData & { 
        topcontent: any[] | string; 
        bottomcontent: any[] | string;
        aiSettings?: AiSettings;
        tooltips?: Record<string, string>;
        domains?: Array<{ id: number; domain: string }>;
    }>().props;
    
    const t = useCallback((key: string, fallback: string, replacements?: Record<string, string | number>): string => {
        let tooltip = tooltips?.[key] || fallback;
        if (replacements) {
            for (const [k, v] of Object.entries(replacements)) {
                tooltip = tooltip.replace(new RegExp(`{${k}}`, 'g'), String(v));
            }
        }
        return tooltip;
    }, [tooltips]);
    
    const aiSettings = useMemo(() => initialAiSettings || {
        guest_ai_enabled: true,
        guest_char_limit: DEFAULT_GUEST_CHAR_LIMIT,
        user_ai_enabled: true,
        user_char_limit: DEFAULT_USER_CHAR_LIMIT,
    }, [initialAiSettings]);
    
    const isAuthenticated = !!auth.user;
    
    const canInteract = useMemo(() => {
        return isAuthenticated;
    }, [isAuthenticated]);
    
    const AI_MAX_CHARS = useMemo(() => {
        if (isAuthenticated) {
            return aiSettings.user_ai_enabled ? aiSettings.user_char_limit : 0;
        }
        return aiSettings.guest_ai_enabled ? aiSettings.guest_char_limit : 0;
    }, [isAuthenticated, aiSettings]);
    
    const AI_WARNING_CHARS = useMemo(() => {
        if (AI_MAX_CHARS === 0) return 0;
        return isAuthenticated 
            ? Math.floor(aiSettings.user_char_limit * 0.9) 
            : Math.floor(aiSettings.guest_char_limit * 0.9);
    }, [isAuthenticated, aiSettings, AI_MAX_CHARS]);
    
    const isAiDisabled = useMemo(() => {
        if (isAuthenticated) {
            return !aiSettings.user_ai_enabled;
        }
        return !aiSettings.guest_ai_enabled;
    }, [isAuthenticated, aiSettings]);

    const [searchMode, setSearchMode] = useState<'ez' | 'ai'>('ez');
    const [linkQuery, setLinkQuery] = useState('');
    const [isSearchingLinks, setIsSearchingLinks] = useState(false);
    const [linkResults, setLinkResults] = useState<SearchResult[]>([]);
    const [showLinkResults, setShowLinkResults] = useState(false);
    const [linkSuggestions, setLinkSuggestions] = useState<string[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [hasMore, setHasMore] = useState(false);
    const [allResultsCount, setAllResultsCount] = useState(0);

    const [aiQuery, setAiQuery] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiUsage, setAiUsage] = useState<AISearchResponse['usage'] | null>(null);
    const [aiThinkingEnabled, setAiThinkingEnabled] = useState(false);
    const [aiConversationId, setAiConversationId] = useState<string | null>(null);
    const [aiThreadId, setAiThreadId] = useState<string | null>(null);
    const [aiConversationTitle, setAiConversationTitle] = useState<string | null>(null);
    const [aiConversationMessages, setAiConversationMessages] = useState<ConversationMessage[]>([]);
    const [aiMessageCount, setAiMessageCount] = useState(0);
    const [aiConversationCost, setAiConversationCost] = useState<number>(0);
    const [aiSlug, setAiSlug] = useState<string | null>(null);
    const [aiParentSlug, setAiParentSlug] = useState<string | null>(null);
    const [showRedirectNotification, setShowRedirectNotification] = useState(false);
    const [redirecting, setRedirecting] = useState(false);

    const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
    const [comments, setComments] = useState<CommentMessage[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);

    const [aiCharCount, setAiCharCount] = useState(0);

    const [qrModal, setQrModal] = useState<QrModalState>({
        isOpen: false,
        url: '',
        title: '',
    });

    const [comingSoonModal, setComingSoonModal] = useState<ComingSoonModalState>({
        isOpen: false,
        feature: '',
        description: '',
        iconColor: '',
        icon: null,
    });

    const [activeTab, setActiveTab] = useState<ContentTab>('content');
    const [contentSubTab, setContentSubTab] = useState<ContentSubTab>('composer');
    const [commentContent, setCommentContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const [landingPageUrl, setLandingPageUrl] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [shortSlug, setShortSlug] = useState('');
    const [nypPrice, setNypPrice] = useState(0);
    const [slugAvailability, setSlugAvailability] = useState<{ checking: boolean; available: boolean | null; message: string }>({
        checking: false,
        available: null,
        message: ''
    });
    const [isCreatingLandingPage, setIsCreatingLandingPage] = useState(false);
    const [landingPageError, setLandingPageError] = useState('');
    const [landingPageSuccess, setLandingPageSuccess] = useState('');

    const [customSlug, setCustomSlug] = useState('');
    const [isCheckingSlug, setIsCheckingSlug] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugAvailabilityMessage, setSlugAvailabilityMessage] = useState('');
    const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null);

    // GEO Slug Save state
    const [isSavingGeoslug, setIsSavingGeoslug] = useState(false);
    const [geoslugError, setGeoslugError] = useState<string | null>(null);
    const [geoslugSuccess, setGeoslugSuccess] = useState<string | null>(null);
    const [geoslugRedirecting, setGeoslugRedirecting] = useState(false);

    const [contentFormat, setContentFormat] = useState<'markdown' | 'html'>('markdown');

    const modelOptions: ModelOption[] = [
        {
            id: 'kimi-k3',
            name: 'Kimi K3',
            description: '2.8T params, 1M context, native multimodal, frontier intelligence',
            isNew: true,
            type: 'flagship',
            provider: 'moonshot'
        },
        {
            id: 'gpt-4o',
            name: 'GPT-4o',
            description: 'OpenAI\'s most advanced multimodal model',
            isNew: true,
            type: 'flagship',
            provider: 'openai'
        },
        {
            id: 'deepseek-chat',
            name: 'DeepSeek Chat',
            description: 'Advanced conversational AI with 128K context',
            isNew: true,
            type: 'flagship',
            provider: 'deepseek'
        },
        {
            id: 'sonar-pro',
            name: 'Sonar Pro',
            description: 'Enhanced search capabilities with better accuracy',
            isNew: true,
            type: 'flagship',
            provider: 'perplexity'
        },
        {
            id: 'gemini-3-flash-preview',
            name: 'Gemini 3 Flash Preview',
            description: 'Latest preview version of Gemini 3 Flash with enhanced capabilities',
            isNew: true,
            type: 'flagship',
            provider: 'gemini'
        }
    ];

    const [selectedModel, setSelectedModel] = useState<ModelOption>(modelOptions[0]);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    const resultsContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const debouncedLinkQuery = useDebounce(linkQuery, DEBOUNCE_DELAY_LINK);
    const debouncedAiQuery = useDebounce(aiQuery, DEBOUNCE_DELAY_AI);
    const debouncedShortSlug = useDebounce(shortSlug, 500);
    const debouncedSelectedDomain = useDebounce(selectedDomain, 500);
    const debouncedCustomSlug = useDebounce(customSlug, 500);

    const { isTypingRef, startTyping, stopTyping } = useTypingDetection();

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
        setAiCharCount(aiQuery.length);
    }, [aiQuery]);

    useEffect(() => {
        if (linkQuery.trim()) {
            startTyping();
        }
        return () => stopTyping();
    }, [linkQuery, startTyping, stopTyping]);

    useEffect(() => {
        const trimmedQuery = debouncedLinkQuery.trim();

        if (trimmedQuery && !isSearchingLinks && !isTypingRef.current && currentPage === 1) {
            performAutoSearch(trimmedQuery, 1);
        }
    }, [debouncedLinkQuery]);

    useEffect(() => {
        const trimmedQuery = linkQuery.trim();

        if (currentPage > 1 && trimmedQuery && !isSearchingLinks && !isTypingRef.current) {
            performAutoSearch(trimmedQuery, currentPage);
        }
    }, [currentPage]);

    useEffect(() => {
        if (searchMode === 'ez' && debouncedLinkQuery.trim().length > MIN_QUERY_LENGTH_FOR_SUGGESTIONS) {
            fetchSuggestions(debouncedLinkQuery);
        } else {
            setLinkSuggestions([]);
        }
    }, [debouncedLinkQuery, searchMode]);

    useEffect(() => {
        if (showLinkResults && linkResults.length > 0 && resultsContainerRef.current && currentPage === 1) {
            resultsContainerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, [showLinkResults, linkResults, currentPage]);

    useEffect(() => {
        if (conversationEndRef.current) {
            conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversationMessages]);

    useEffect(() => {
        if (debouncedShortSlug && debouncedSelectedDomain && debouncedShortSlug.length >= 2) {
            checkSlugAvailability();
        } else if (debouncedShortSlug || debouncedSelectedDomain) {
            setSlugAvailability({
                checking: false,
                available: null,
                message: ''
            });
        }
    }, [debouncedShortSlug, debouncedSelectedDomain]);

    const checkCustomSlugAvailability = useCallback(async (slug: string) => {
        if (!slug || slug.length < 2) {
            setSlugAvailable(null);
            setSlugAvailabilityMessage('');
            return;
        }

        setIsCheckingSlug(true);
        setSlugAvailable(null);
        setSlugAvailabilityMessage('');

        try {
            const response = await axios.get('/ai/conversation/check-slug-availability-home', {
                params: { slug: slug },
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.data.available) {
                setSlugAvailable(true);
                setSlugAvailabilityMessage(t('ezbar_slug_available', '✓ Slug is available!'));
            } else {
                setSlugAvailable(false);
                setSlugAvailabilityMessage(response.data.message || t('ezbar_slug_taken', '✗ This slug is already taken'));
            }
        } catch (error) {
            console.error('Error checking slug:', error);
            setSlugAvailable(false);
            setSlugAvailabilityMessage(t('ezbar_slug_check_error', 'Error checking availability'));
        } finally {
            setIsCheckingSlug(false);
        }
    }, [t]);

    useEffect(() => {
        if (debouncedCustomSlug && debouncedCustomSlug.length >= 2) {
            checkCustomSlugAvailability(debouncedCustomSlug);
        } else {
            setSlugAvailable(null);
            setSlugAvailabilityMessage('');
        }
    }, [debouncedCustomSlug, checkCustomSlugAvailability]);

    const getSlugStatusStyles = useCallback(() => {
        if (isCheckingSlug) {
            return { color: 'text-yellow-500', icon: 'spinner', message: t('ezbar_checking_slug', 'Checking availability...') };
        }
        if (slugAvailable === true) {
            return { color: 'text-green-500', icon: 'check', message: slugAvailabilityMessage };
        }
        if (slugAvailable === false) {
            return { color: 'text-red-500', icon: 'close', message: slugAvailabilityMessage };
        }
        return { color: 'text-gray-400', icon: 'info', message: t('ezbar_slug_hint', 'Custom slug (optional) - any characters allowed, spaces become hyphens') };
    }, [isCheckingSlug, slugAvailable, slugAvailabilityMessage, t]);

    // ============================================================
    // Slug For GEO Section - Enhanced with Save & Redirect
    // UPDATED CONTENT BASED ON https://ez.wiki/X0003284
    // ============================================================
    const handleSaveGeoslug = useCallback(async () => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        if (!customSlug || slugAvailable !== true) {
            setGeoslugError(t('ezbar_slug_not_available', 'Please enter a unique slug first.'));
            return;
        }

        // Don't allow saving if already saving or redirecting
        if (isSavingGeoslug || geoslugRedirecting) {
            return;
        }

        setIsSavingGeoslug(true);
        setGeoslugError(null);
        setGeoslugSuccess(null);

        try {
            let response;

            if (conversationId) {
                // Update existing conversation with GEO slug
                response = await axios.patch(
                    `/ai/conversation/${conversationId}/slug`,
                    {
                        slug: customSlug,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': getCsrfToken(),
                        },
                    }
                );
            } else {
                // Create a new conversation with the custom slug
                response = await axios.post(
                    '/content/geoslug',
                    {
                        slug: customSlug,
                        conversation_id: conversationId,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': getCsrfToken(),
                        },
                    }
                );
            }

            if (response?.data?.success) {
                const savedSlug = response.data.slug || customSlug;
                const convId = response.data.conversation_id || conversationId;
                
                if (convId) {
                    setConversationId(convId);
                }
                
                setGeoslugSuccess(`✅ GEO slug "${savedSlug}" saved successfully! Redirecting to your page...`);
                
                // Start redirecting
                setGeoslugRedirecting(true);
                
                // Redirect to the view page after a short delay
                setTimeout(() => {
                    router.visit(`/X/${encodeURIComponent(savedSlug)}`, {
                        preserveScroll: false,
                        preserveState: false,
                        onSuccess: () => {
                            setGeoslugRedirecting(false);
                            setIsSavingGeoslug(false);
                            console.log('Redirected to GEO slug page successfully');
                        },
                        onError: (errors) => {
                            console.error('Error redirecting:', errors);
                            setGeoslugRedirecting(false);
                            setIsSavingGeoslug(false);
                            setGeoslugError('Error redirecting to page. Please try clicking the link manually.');
                        },
                    });
                }, 1500);
            } else {
                setGeoslugError(response?.data?.message || t('ezbar_slug_save_failed', 'Failed to save GEO slug. Please try again.'));
                setIsSavingGeoslug(false);
            }
        } catch (error) {
            console.error('Error saving GEO slug:', error);
            if (axios.isAxiosError(error) && error.response) {
                setGeoslugError(error.response.data.message || t('ezbar_slug_save_failed', 'Failed to save GEO slug. Please try again.'));
            } else {
                setGeoslugError(t('ezbar_slug_save_failed', 'Failed to save GEO slug. Please try again.'));
            }
            setIsSavingGeoslug(false);
        }
    }, [customSlug, slugAvailable, conversationId, canInteract, t, isSavingGeoslug, geoslugRedirecting]);

    const renderGeoslugSection = () => {
        if (!canInteract) {
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 2a15 15 0 0 1 10 10"/>
                            <path d="M12 22a15 15 0 0 1-10-10"/>
                            <path d="M2 12h20"/>
                            <path d="M12 2v20"/>
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-2">Login required to manage GEO slugs</p>
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
            <div className="space-y-5">
                {/* Custom Slug Input - Matching the image style */}
                <div className="m-0 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Custom Slug (Optional)</span>
                        <span className="text-xs text-gray-400">any characters allowed, spaces become hyphens</span>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <span className="text-sm text-gray-400 font-mono font-medium">ez.wiki/X/</span>
                        </div>
                        <input
                            type="text"
                            value={customSlug}
                            onChange={(e) => {
                                const value = e.target.value.replace(/ /g, '-');
                                setCustomSlug(value);
                                if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
                                // Trigger slug check after typing stops
                                const timeout = setTimeout(() => {
                                    if (value.length >= 2) {
                                        checkCustomSlugAvailability(value);
                                    }
                                }, 500);
                                setSlugCheckTimeout(timeout);
                            }}
                            placeholder="enter-custom-slug"
                            className={`w-full pl-32 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${
                                slugAvailable === true 
                                    ? 'border-green-400 focus:ring-green-500/30 focus:border-green-500 bg-green-50/30' 
                                    : slugAvailable === false
                                    ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500 bg-red-50/30'
                                    : 'border-gray-200 focus:ring-[#22c55e]/30 focus:border-[#22c55e] hover:border-gray-300'
                            }`}
                            maxLength={50}
                            disabled={!canInteract || geoslugRedirecting}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            {isCheckingSlug ? (
                                <svg 
                                    width="18" 
                                    height="18" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5"
                                    className="animate-spin text-yellow-500"
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                            ) : slugAvailable === true ? (
                                <svg 
                                    width="18" 
                                    height="18" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5"
                                    className="text-green-500"
                                >
                                    <path d="M20 6 9 17l-5-5"/>
                                </svg>
                            ) : slugAvailable === false ? (
                                <svg 
                                    width="18" 
                                    height="18" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5"
                                    className="text-red-500"
                                >
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                </svg>
                            ) : null}
                        </div>
                    </div>
                    
                    {/* Status message */}
                    {customSlug && (
                        <div className={`mt-2 flex items-center gap-2 text-xs ${
                            slugAvailable === true ? 'text-green-600' : 
                            slugAvailable === false ? 'text-red-600' : 
                            'text-gray-400'
                        }`}>
                            {isCheckingSlug ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                    </svg>
                                    <span>Checking availability...</span>
                                </>
                            ) : slugAvailable === true ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M20 6 9 17l-5-5"/>
                                    </svg>
                                    <span>✓ Slug is available!</span>
                                </>
                            ) : slugAvailable === false ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M18 6 6 18"/>
                                        <path d="m6 6 12 12"/>
                                    </svg>
                                    <span>✗ This slug is already taken</span>
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 16v-4"/>
                                        <path d="M12 8h.01"/>
                                    </svg>
                                    <span>Enter a unique slug for your GEO content</span>
                                </>
                            )}
                        </div>
                    )}
                    
                    {/* Character counter with optimal length indicator */}
                    {customSlug && (
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-gray-400">
                                Slug length: <strong className="text-gray-600">{customSlug.length}</strong> characters
                            </span>
                            <span className={`flex items-center gap-1.5 ${
                                customSlug.length >= 50 && customSlug.length <= 60 
                                    ? 'text-green-600' 
                                    : customSlug.length > 0 
                                    ? 'text-yellow-600' 
                                    : 'text-gray-400'
                            }`}>
                                {customSlug.length >= 50 && customSlug.length <= 60 ? (
                                    <>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M20 6 9 17l-5-5"/>
                                        </svg>
                                        <span>Optimal length ✓</span>
                                    </>
                                ) : customSlug.length > 0 ? (
                                    <>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M12 8v4"/>
                                            <path d="M12 16h.01"/>
                                        </svg>
                                        <span>Recommended: 50-60 characters</span>
                                    </>
                                ) : null}
                            </span>
                        </div>
                    )}
                </div>

                {/* Info Cards - Updated based on https://ez.wiki/X0003284 */}
                <div className="bg-gradient-to-br from-blue-50 m-0 mb-3 via-green-50 to-purple-50 border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all duration-200 divide-y divide-gray-200/50">
                    
                    {/* Card 1: What is a slug? */}
                    <div className="pb-3 mb-3">
                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">What is a slug?</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            A slug is a URL-friendly version of a string, typically used to identify a resource in a web address. It's a human-readable, lowercase string with spaces replaced by hyphens and special characters removed.
                            <br />
                            <span className="font-mono text-gray-500 text-[11px]">Example: "What Is a Slug?!" → what-is-a-slug</span>
                        </p>
                    </div>

                    {/* Card 2: How is it used in GEO? */}
                    <div className="pb-3 mb-3">
                        <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">How is it used in GEO?</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Slugs are relevant to <strong>Generative Engine Optimization (GEO)</strong> in several key ways:
                        </p>
                        <ul className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1 space-y-0.5">
                            <li><strong>URL Structure:</strong> Clean slugs help search engines and AI crawlers understand page content.</li>
                            <li><strong>AI Training Data:</strong> Large language models use URLs; descriptive slugs provide semantic signals.</li>
                            <li><strong>AI Overview Citations:</strong> When AI search engines cite sources, a clear slug reinforces topical relevance.</li>
                            <li><strong>Retrieval-Augmented Generation (RAG):</strong> Slugs aid in document chunking and retrieval matching.</li>
                        </ul>
                    </div>

                    {/* Card 3: Recommended Length */}
                    <div>
                        <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Recommended Length</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            The optimal slug length is <strong className="text-purple-700 font-semibold">50–60 characters</strong>. 
                            This balance ensures readability, includes primary keywords, fits in search result displays, 
                            and provides strong semantic signals for AI crawlers. Avoid slugs over 75 characters as they 
                            can be truncated and lose focus.
                        </p>
                    </div>
                    
                </div>

                {/* Status messages */}
                {geoslugError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="m15 9-6 6"/>
                                <path d="m9 9 6 6"/>
                            </svg>
                            {geoslugError}
                        </p>
                    </div>
                )}
                
                {geoslugSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6 9 17l-5-5"/>
                            </svg>
                            {geoslugSuccess}
                        </p>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSaveGeoslug}
                    disabled={!customSlug || slugAvailable !== true || !canInteract || isSavingGeoslug || geoslugRedirecting}
                    className={`w-full px-4 py-3.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] ${
                        (isSavingGeoslug || geoslugRedirecting) ? 'opacity-75' : ''
                    }`}
                >
                    {isSavingGeoslug ? (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            <span>Saving GEO Slug...</span>
                        </>
                    ) : geoslugRedirecting ? (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            <span>Redirecting to your page...</span>
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            <span>Save GEO Slug</span>
                        </>
                    )}
                </button>

                {/* Footer note - Updated */}
                <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                    <span>💡</span>
                    <span>A well-crafted GEO slug improves your content's discoverability in AI search results</span>
                </p>
            </div>
        );
    };

    // ============================================================
    // Content Composer Toolbar - From Image 1, 2 & 3
    // ============================================================
    const renderContentComposerToolbar = () => {
        // Helper function to handle format change and switch to composer
        const handleFormatChange = (format: 'markdown' | 'html') => {
            setContentFormat(format);
            setContentSubTab('composer');
        };

        return (
            <div className="flex flex-wrap items-center gap-2 mb-3 mt-3 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => handleFormatChange('markdown')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            contentFormat === 'markdown'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Markdown
                    </button>
                    <button
                        onClick={() => handleFormatChange('html')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            contentFormat === 'html'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
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
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Embed Content
                </button>
                
                <button
                    onClick={() => setContentSubTab('geoslug')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                        contentSubTab === 'geoslug'
                            ? 'bg-[#22c55e] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 2a15 15 0 0 1 10 10"/>
                        <path d="M12 22a15 15 0 0 1-10-10"/>
                        <path d="M2 12h20"/>
                        <path d="M12 2v20"/>
                    </svg>
                    Slug For GEO
                </button>
            </div>
        );
    };

    // ============================================================
    // Upload Drop Zone - From Image 3
    // ============================================================
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
                        <span className="text-sm font-medium text-gray-700">Upload Multiple Files</span>
                    </div>
                    <span className="text-xs text-gray-400">Images, PDF, Video, Audio, HTML up to 100MB</span>
                </div>
                
                {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="m15 9-6 6"/>
                                <path d="m9 9 6 6"/>
                            </svg>
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
                    >
                        <div className="flex flex-col items-center">
                            <svg className={`w-12 h-12 mb-3 transition-colors ${isDragging ? 'text-[#22c55e]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-[#22c55e]">Click to upload multiple files</span> or drag & drop
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                ✅ Images (JPG, PNG, GIF, WEBP) • PDF • Video (MP4, WEBM) • Audio (MP3, WAV) • HTML
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Select one or multiple files at once (up to 100MB each)
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary Header */}
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

                        {/* Files Grid / List */}
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
                            onClick={handleFileUpload}
                            disabled={isUploading || selectedFiles.length === 0}
                            className="w-full px-4 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isUploading ? (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                    </svg>
                                    <span>Uploading {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}...</span>
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
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

    // ============================================================
    // Comments Section
    // ============================================================
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
                <div className="flex items-center gap-2 mb-3">
                    <svg 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5"
                        className="text-[#22c55e]"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Comments</span>
                    {comments.length > 0 && (
                        <span className="text-xs bg-[#22c55e] text-white px-2 py-0.5 rounded-full">
                            {comments.length}
                        </span>
                    )}
                </div>
                
                {comments.length > 0 && (
                    <div className="mb-4 space-y-3 max-h-[300px] overflow-y-auto">
                        {comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <p className="text-sm text-gray-800">{comment.content}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500">
                                        {comment.user?.name || 'Guest'} • {comment.formatted_created_at}
                                    </span>
                                    <a 
                                        href={comment.share_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#22c55e] hover:underline"
                                    >
                                        Permalink
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Use EnhancedMDEditor instead of plain textarea */}
                <EnhancedMDEditor
                    value={commentContent}
                    onChange={(value) => setCommentContent(value || '')}
                    placeholder={t('ezbar_comment_placeholder', 'Write your comment here... (Markdown supported)')}
                    minHeight={300}
                />
                
                <button
                    onClick={handleCommentSubmit}
                    disabled={!commentContent.trim() || isCommenting}
                    className="w-full px-4 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content={t('ezbar_post_comment', 'Post your comment')}
                >
                    {isCommenting ? (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            <span>{t('ezbar_posting_comment', 'Posting...')}</span>
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span>{t('ezbar_post_comment', 'Post Comment')}</span>
                        </>
                    )}
                </button>
            </div>
        );
    };

    // ============================================================
    // Social Panel (used by content composer)
    // ============================================================
    const renderSocialPanel = () => {
        if (!canInteract) {
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M4 4v16h16V4H4z M8 9h8 M8 13h6 M8 17h4"/>
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-2">
                        {t('ezbar_login_required_for_social', 'Login required to create content')}
                    </p>
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
                <SocialMediaComposer
                    onPost={handleSocialPost}
                    className="w-full"
                    conversationId={conversationId}
                    contentFormat={contentFormat}
                />
            </div>
        );
    };

    // ============================================================
    // Content Panel - Combines all sections
    // ============================================================
    const renderContentPanel = () => {
        return (
            <div className="space-y-4">
                {/* Content Composer Toolbar - From Image 1, 2 & 3 */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    {renderContentComposerToolbar()}
                    
                    {/* Composer body */}
                    <div className="mt-3">
                        {contentSubTab === 'composer' && renderSocialPanel()}
                        {contentSubTab === 'upload' && renderUploadDropZone()}
                        {contentSubTab === 'embed' && renderCommentsSection()}
                        {contentSubTab === 'geoslug' && renderGeoslugSection()}
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // Existing functions
    // ============================================================
    
    const renderSlugInput = () => {
        const status = getSlugStatusStyles();
        
        return (
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className="text-gray-400"
                    >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span className="text-xs font-medium text-gray-600">{t('ezbar_custom_slug', 'Custom Slug (Optional)')}</span>
                    <span className="text-xs text-gray-400">• {t('ezbar_slug_format_hint', 'any characters allowed, spaces become hyphens')}</span>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-sm text-gray-400">ez.wiki/X/</span>
                    </div>
                    <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => {
                            const value = e.target.value.replace(/ /g, '-');
                            setCustomSlug(value);
                            if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
                        }}
                        placeholder={t('ezbar_slug_placeholder', 'enter-custom-slug')}
                        className={`w-full pl-32 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            slugAvailable === true 
                                ? 'border-green-300 focus:ring-green-500/30 focus:border-green-500' 
                                : slugAvailable === false
                                ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                                : 'border-gray-200 focus:ring-[#22c55e]/30 focus:border-[#22c55e]'
                        }`}
                        maxLength={50}
                        disabled={!canInteract}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {isCheckingSlug ? (
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5"
                                className="animate-spin text-yellow-500"
                            >
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                        ) : slugAvailable === true ? (
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5"
                                className="text-green-500"
                            >
                                <path d="M20 6 9 17l-5-5"/>
                            </svg>
                        ) : slugAvailable === false ? (
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5"
                                className="text-red-500"
                            >
                                <path d="M18 6 6 18"/>
                                <path d="m6 6 12 12"/>
                            </svg>
                        ) : null}
                    </div>
                </div>
                
                {customSlug && (
                    <p className={`text-xs mt-1.5 flex items-center gap-1 ${status.color}`}>
                        {status.icon === 'spinner' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                        )}
                        {status.icon === 'check' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6 9 17l-5-5"/>
                            </svg>
                        )}
                        {status.icon === 'close' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 6 6 18"/>
                                <path d="m6 6 12 12"/>
                            </svg>
                        )}
                        {status.icon === 'info' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 16v-4M12 8h.01"/>
                            </svg>
                        )}
                        <span>{status.message}</span>
                    </p>
                )}
                
                {customSlug && slugAvailable === true && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        {t('ezbar_slug_url_preview', 'Your content will be available at: ez.wiki/X/{slug}', { slug: customSlug })}
                    </p>
                )}
            </div>
        );
    };

    const toggleSearchMode = useCallback(() => {
        setSearchMode(prev => prev === 'ez' ? 'ai' : 'ez');
        setLinkResults([]);
        setShowLinkResults(false);
        setLinkQuery('');
        setLinkSuggestions([]);
        setCurrentPage(1);
        setAllResultsCount(0);
        setTotalPages(1);
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
        try {
            const response = await axios.get('/searchai/suggestions', {
                params: { query },
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.data.suggestions) {
                setLinkSuggestions(response.data.suggestions);
            }
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        }
    }, []);

    const performAutoSearch = useCallback(async (query: string, page: number = 1) => {
        if (!query.trim()) return;

        setIsSearchingLinks(true);

        if (page === 1) {
            setShowLinkResults(false);
            setLinkSuggestions([]);
        }

        try {
            let response;
            
            if (searchMode === 'ai') {
                response = await axios.get<AISlugSearchResponse>('/searchai/ai-slugs', {
                    params: { 
                        query,
                        page,
                        per_page: perPage
                    },
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
            } else {
                response = await axios.get<LinkSearchResponse>('/searchai/links', {
                    params: { 
                        query,
                        page,
                        per_page: perPage
                    },
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
            }
            
            let results: SearchResult[] = [];
            
            if (Array.isArray(response.data?.results)) {
                results = response.data.results;
            } else if (response.data?.results && typeof response.data.results === 'object') {
                results = Object.values(response.data.results);
            }
            
            const total = response.data?.total || 0;
            const allCount = response.data?.all_results_count || total;
            
            if (page === 1) {
                setLinkResults(results);
            } else {
                setLinkResults(prevResults => [...prevResults, ...results]);
            }
            
            setAllResultsCount(allCount);
            setCurrentPage(page);
            setTotalPages(response.data?.total_pages || 1);
            setPerPage(response.data?.per_page || 10);
            setHasMore(response.data?.has_more || false);
            
            if (results.length > 0 || page === 1) {
                setTimeout(() => {
                    setShowLinkResults(true);
                }, 0);
            }
            
            if (page === 1 && searchMode === 'ez' && aiQuery !== query) {
                setAiQuery(query);
            }
        } catch (error) {
            console.error('Auto-search error:', error);
            
            if (page === 1) {
                setLinkResults([]);
                setAllResultsCount(0);
                setShowLinkResults(true);
            }
            
            if (page === 1 && searchMode === 'ez' && aiQuery !== query) {
                setAiQuery(query);
            }
        } finally {
            setIsSearchingLinks(false);
        }
    }, [aiQuery, perPage, searchMode]);

    const handleLinkSearch = useCallback(async (e?: FormEvent, page: number = 1) => {
        if (e) e.preventDefault();

        const trimmedQuery = linkQuery.trim();
        if (!trimmedQuery) return;

        stopTyping();

        await performAutoSearch(trimmedQuery, page);
    }, [linkQuery, performAutoSearch, stopTyping]);

    const handleAiSearch = useCallback(async (e?: FormEvent) => {
        if (e) e.preventDefault();

        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }

        const trimmedQuery = aiQuery.trim();
        if (!trimmedQuery) return;

        if (isAiDisabled) {
            setAiError(isAuthenticated ? t('ezbar_ai_disabled_user', 'Ask AI is currently disabled for logged-in users.') : t('ezbar_ai_disabled_guest', 'Ask AI is currently disabled for guests. Login to access Ask AI.'));
            return;
        }

        if (aiCharCount > AI_MAX_CHARS) {
            setAiError(t('ezbar_character_limit_exceeded', 'Character limit exceeded ({current}/{max}). {login_message}Please shorten your message.', {
                current: aiCharCount,
                max: AI_MAX_CHARS,
                login_message: !isAuthenticated ? t('ezbar_login_for_higher_limit', 'Login for higher character limit. ') : ''
            }));
            return;
        }

        setIsAiSearching(true);
        setAiResponse(null);
        setAiError(null);
        setAiUsage(null);
        setAiThinkingEnabled(false);
        setShowRedirectNotification(false);

        try {
            const sourceRegex = /@(\w+)/g;
            const matches = trimmedQuery.match(sourceRegex) || [];
            const sources = matches.map(match => match.substring(1));
            
            const enableThinking = trimmedQuery.includes('#think');
            
            const cleanQuery = trimmedQuery
                .replace(sourceRegex, '')
                .replace('#think', '')
                .trim();

            const response = await axios.post<AISearchResponse>(
                '/searchai/ai',
                { 
                    query: cleanQuery,
                    sources: sources,
                    enable_thinking: enableThinking,
                    model: selectedModel.id,
                    temperature: 0.6,
                    max_tokens: 2000,
                    conversation_id: aiConversationId,
                    thread_id: aiThreadId,
                    parent_slug: aiSlug,
                    custom_slug: customSlug && slugAvailable === true && !aiConversationId ? customSlug : undefined,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                }
            );
            
            const data = response.data;
            
            if (data.success && data.answer) {
                setAiResponse(data.answer);
                setAiThinkingEnabled(data.thinking_enabled || false);
                if (data.usage) {
                    setAiUsage(data.usage);
                }
                
                if (data.conversation_id) {
                    setAiConversationId(data.conversation_id);
                    setConversationId(data.conversation_id);
                    setAiThreadId(data.thread_id || null);
                    setAiConversationTitle(data.conversation_title || null);
                    setAiSlug(data.slug || null);
                    setAiParentSlug(data.parent_slug || null);
                    
                    let cost = 0;
                    if (data.conversation_cost !== undefined && data.conversation_cost !== null) {
                        cost = data.conversation_cost;
                    } else if (data.conversation_tokens) {
                        cost = (data.conversation_tokens / 1000) * 0.01;
                    } else if (data.usage?.total_tokens) {
                        cost = (data.usage.total_tokens / 1000) * 0.01;
                    }
                    setAiConversationCost(cost);
                    
                    if (data.conversation_messages) {
                        setAiConversationMessages(data.conversation_messages);
                        setConversationMessages(data.conversation_messages);
                    }
                    
                    if (data.message_count !== undefined) {
                        setAiMessageCount(data.message_count);
                    }
                }
                
                const isNewConversation = !aiConversationId && data.conversation_id && data.slug;
                
                if (isNewConversation) {
                    setCustomSlug('');
                    setSlugAvailable(null);
                    
                    setShowRedirectNotification(true);
                    setRedirecting(true);
                    
                    setTimeout(() => {
                        const conversationSlug = data.conversation_slug || data.slug;
                        if (conversationSlug) {
                            const encodedSlug = encodeURIComponent(conversationSlug);
                            
                            router.visit(`/X/${encodedSlug}`, {
                                preserveScroll: true,
                                preserveState: true,
                                onSuccess: () => {
                                    setRedirecting(false);
                                },
                                onError: () => {
                                    setRedirecting(false);
                                    setShowRedirectNotification(false);
                                },
                            });
                        }
                    }, AUTO_REDIRECT_DELAY);
                }
            } else {
                setAiError(data.message || 'Failed to get AI response');
            }
        } catch (error) {
            console.error('Ask AI error:', error);
            const errorMessage = error instanceof AxiosError 
                ? error.response?.data?.message || 'Network error occurred'
                : 'An error occurred while processing your request. Please try again.';
            setAiError(errorMessage);
        } finally {
            setIsAiSearching(false);
        }
    }, [aiQuery, aiConversationId, aiThreadId, aiSlug, aiCharCount, AI_MAX_CHARS, isAuthenticated, isAiDisabled, selectedModel, customSlug, slugAvailable, t, canInteract]);

    const handleFileUpload = useCallback(async () => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }
        
        if (!selectedFiles || selectedFiles.length === 0) return;

        setUploadError(null);

        // Validate all files
        for (const fileObj of selectedFiles) {
            if (fileObj.size > MAX_FILE_SIZE) {
                setUploadError(t('ezbar_file_size_limit', `File "${fileObj.name}" exceeds 100MB limit.`));
                return;
            }
            if (fileObj.file) {
                const validation = isValidFileType(fileObj.file);
                if (!validation.valid) {
                    setUploadError(validation.message);
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
        if (conversationId) {
            formData.append('conversation_id', conversationId);
        }
        if (customSlug && slugAvailable === true && !conversationId) {
            formData.append('custom_slug', customSlug);
        }

        try {
            const response = await axios.post('/content/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
            
            if (response.data.success) {
                if (response.data.conversation_messages) {
                    setConversationMessages(response.data.conversation_messages);
                }
                setConversationId(response.data.conversation_id);
                
                if (response.data.files && Array.isArray(response.data.files)) {
                    setUploadedFiles(prev => [...prev, ...response.data.files]);
                } else if (response.data.file) {
                    setUploadedFiles(prev => [...prev, response.data.file]);
                }
                
                setSelectedFiles([]);
                setCommentContent('');
                setUploadError(null);
                setActiveTab('content');
                setContentSubTab('composer');
                setCustomSlug('');
                setSlugAvailable(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                
                if (response.data.slug) {
                    router.visit(`/X/${encodeURIComponent(response.data.slug)}`, {
                        preserveScroll: false,
                        preserveState: false,
                        onSuccess: () => {
                            console.log('Redirected to upload page successfully');
                        },
                        onError: (errors) => {
                            console.error('Error redirecting:', errors);
                        },
                    });
                }
                
            } else {
                setUploadError(response.data.message || t('ezbar_upload_failed', 'Failed to upload file. Please try again.'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (axios.isAxiosError(error) && error.response) {
                setUploadError(error.response.data.message || t('ezbar_upload_failed', 'Failed to upload file. Please try again.'));
            } else {
                setUploadError(t('ezbar_upload_failed', 'Failed to upload file. Please try again.'));
            }
        } finally {
            setIsUploading(false);
        }
    }, [selectedFiles, commentContent, conversationId, customSlug, slugAvailable, t, canInteract]);

    const handleCommentSubmit = useCallback(async () => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }
        
        if (!commentContent.trim()) return;

        setIsCommenting(true);

        try {
            const response = await axios.post('/content/comment', {
                content: commentContent,
                conversation_id: conversationId,
                custom_slug: customSlug && slugAvailable === true && !conversationId ? customSlug : undefined,
				content_type: 'conversationcomment',
            }, {
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (response.data.success) {
                if (response.data.conversation_messages) {
                    setConversationMessages(response.data.conversation_messages);
                }
                setConversationId(response.data.conversation_id);
                
                if (response.data.comment) {
                    setComments(prev => [...prev, response.data.comment]);
                }
                
                setCommentContent('');
                setCustomSlug('');
                setSlugAvailable(null);
                                
                if (response.data.slug) {
                    router.visit(`/X/${encodeURIComponent(response.data.slug)}`, {
                        preserveScroll: false,
                        preserveState: false,
                    });
                }
            } else {
                alert(response.data.message || t('ezbar_comment_failed', 'Failed to post comment. Please try again.'));
            }
        } catch (error) {
            console.error('Comment error:', error);
            if (axios.isAxiosError(error) && error.response) {
                alert(error.response.data.message || t('ezbar_comment_failed', 'Failed to post comment. Please try again.'));
            } else {
                alert(t('ezbar_comment_failed', 'Failed to post comment. Please try again.'));
            }
        } finally {
            setIsCommenting(false);
        }
    }, [commentContent, conversationId, customSlug, slugAvailable, t, canInteract]);

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
                conversation_id: conversationId,
                custom_slug: customSlug && slugAvailable === true && !conversationId ? customSlug : undefined,
                format: contentFormat,
            }, {
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (response.data.success) {
                if (response.data.conversation_messages) {
                    setConversationMessages(response.data.conversation_messages);
                }
                setConversationId(response.data.conversation_id);
                setCustomSlug('');
                setSlugAvailable(null);
                
                if (response.data.slug) {
                    router.visit(`/X/${encodeURIComponent(response.data.slug)}`, {
                        preserveScroll: false,
                        preserveState: false,
                        onSuccess: () => {
                            console.log('Redirected to social post page successfully');
                        },
                        onError: (errors) => {
                            console.error('Error redirecting:', errors);
                        },
                    });
                }
            } else {
                alert(response.data.message || 'Failed to post to social media');
            }
        } catch (error) {
            console.error('Social media post error:', error);
            if (axios.isAxiosError(error) && error.response) {
                alert(error.response.data.message || 'Failed to post to social media');
            } else {
                alert('Failed to post to social media. Please try again.');
            }
        }
    }, [conversationId, customSlug, slugAvailable, contentFormat, canInteract]);

    const checkSlugAvailability = useCallback(async () => {
        if (!shortSlug || !selectedDomain) {
            setSlugAvailability({
                checking: false,
                available: null,
                message: 'Please enter a slug and select a domain'
            });
            return;
        }

        setSlugAvailability(prev => ({ ...prev, checking: true, available: null, message: '' }));

        try {
            const response = await axios.post('/ezai/check-ezpressstandard-custom', {
                handle: shortSlug,
                domain: selectedDomain
            });

            setSlugAvailability({
                checking: false,
                available: response.data.available,
                message: response.data.message || (response.data.available ? 'Slug is available' : 'Slug is already taken')
            });
        } catch (error) {
            console.error('Error checking slug availability:', error);
            setSlugAvailability({
                checking: false,
                available: false,
                message: 'Failed to check availability. Please try again.'
            });
        }
    }, [shortSlug, selectedDomain]);

    const handleCreateLandingPage = useCallback(async () => {
        if (!canInteract) {
            setShowLoginPrompt(true);
            return;
        }
        
        if (!landingPageUrl.trim()) {
            setLandingPageError(t('ezbar_enter_url_first', 'Enter a landing page URL first'));
            return;
        }

        let finalUrl = landingPageUrl.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }

        try {
            new URL(finalUrl);
        } catch (error) {
            setLandingPageError('Please enter a valid URL');
            return;
        }

        if (customSlug && slugAvailable !== true) {
            setLandingPageError(t('ezbar_check_slug_first', 'Please check custom slug availability first'));
            return;
        }

        if (shortSlug && selectedDomain && slugAvailability.available !== true) {
            setLandingPageError(t('ezbar_check_slug_first', 'Please check slug availability first'));
            return;
        }

        setIsCreatingLandingPage(true);
        setLandingPageError('');
        setLandingPageSuccess('');

        try {
            const response = await axios.post('/content/landing-page', {
                landing_page_url: finalUrl,
                slug_domain: selectedDomain || null,
                short_slug: shortSlug || null,
                nyp_price: nypPrice,
                custom_slug: customSlug && slugAvailable === true ? customSlug : undefined,
            }, {
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            if (response.data.success) {
                setLandingPageSuccess(`Landing page created successfully! Conversation URL: ${response.data.conversation_url}`);
                
                setLandingPageUrl('');
                setSelectedDomain('');
                setShortSlug('');
                setNypPrice(0);
                setCustomSlug('');
                setSlugAvailable(null);
                setSlugAvailability({ checking: false, available: null, message: '' });
                
                setTimeout(() => {
                    router.visit(response.data.conversation_url, {
                        preserveScroll: false,
                        preserveState: false,
                    });
                }, 2000);
            } else {
                setLandingPageError(response.data.message || 'Failed to create landing page');
            }
        } catch (error) {
            console.error('Error creating landing page:', error);
            if (axios.isAxiosError(error) && error.response) {
                setLandingPageError(error.response.data.message || 'Failed to create landing page');
            } else {
                setLandingPageError('An unexpected error occurred');
            }
        } finally {
            setIsCreatingLandingPage(false);
        }
    }, [landingPageUrl, selectedDomain, shortSlug, slugAvailability.available, nypPrice, customSlug, slugAvailable, t, canInteract]);

    const handleLinkKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            stopTyping();
            handleLinkSearch();
        } else if (e.key === 'Escape') {
            setLinkSuggestions([]);
            setShowLinkResults(false);
        }
    }, [handleLinkSearch, stopTyping]);

    const handleAiKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAiSearch();
        } else if (e.key === 'Escape') {
            setAiResponse(null);
            setAiError(null);
        }
    }, [handleAiSearch]);

    const handleSuggestionClick = useCallback((suggestion: string) => {
        setLinkQuery(suggestion);
        setAiQuery(suggestion);
        stopTyping();

        setCurrentPage(1);

        setAiConversationId(null);
        setAiThreadId(null);
        setAiConversationTitle(null);
        setAiConversationMessages([]);
        setAiMessageCount(0);
        setAiConversationCost(0);
        setAiSlug(null);
        setAiParentSlug(null);
        setConversationId(null);
        setConversationMessages([]);
        setComments([]);
        setUploadedFiles([]);
        setCustomSlug('');
        setSlugAvailable(null);

        setTimeout(() => {
            handleLinkSearch();
        }, 50);
    }, [handleLinkSearch, stopTyping]);

    const clearLinkResults = useCallback(() => {
        setShowLinkResults(false);
        setLinkResults([]);
        setAllResultsCount(0);
        setCurrentPage(1);
        setTotalPages(1);
        setLinkQuery('');
        setAiQuery('');
        setLinkSuggestions([]);
    }, []);

    const clearAiResults = useCallback(() => {
        setAiResponse(null);
        setAiError(null);
        setAiUsage(null);
        setAiThinkingEnabled(false);
        setAiConversationId(null);
        setAiThreadId(null);
        setAiConversationTitle(null);
        setAiConversationMessages([]);
        setAiMessageCount(0);
        setAiConversationCost(0);
        setAiSlug(null);
        setAiParentSlug(null);
        setShowRedirectNotification(false);
        setRedirecting(false);
        setCustomSlug('');
        setSlugAvailable(null);
    }, []);

    const handleNewSearch = useCallback(() => {
        setLinkQuery('');
        setLinkResults([]);
        setLinkSuggestions([]);
        setShowLinkResults(false);

        setAiQuery('');
        setAiResponse(null);
        setAiError(null);
        setAiUsage(null);
        setAiThinkingEnabled(false);

        setAiConversationId(null);
        setAiThreadId(null);
        setAiConversationTitle(null);
        setAiConversationMessages([]);
        setAiMessageCount(0);
        setAiConversationCost(0);
        setAiSlug(null);
        setAiParentSlug(null);
        setConversationId(null);
        setConversationMessages([]);
        setComments([]);
        setUploadedFiles([]);

        setCurrentPage(1);
        setTotalPages(1);
        setAllResultsCount(0);
        setHasMore(false);

        setShowRedirectNotification(false);
        setRedirecting(false);

        setSelectedFile(null);
        setCommentContent('');
        setUploadError(null);
        setCustomSlug('');
        setSlugAvailable(null);
        setSlugAvailabilityMessage('');

        setSearchMode('ez');

        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 100);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        if (page === currentPage || isSearchingLinks) return;

        setCurrentPage(page);
        handleLinkSearch(undefined, page);
    }, [currentPage, isSearchingLinks, handleLinkSearch]);

    const generateQrCode = useCallback((url: string, title: string) => {
        setQrModal({
            isOpen: true,
            url,
            title,
        });
    }, []);

    const closeQrModal = useCallback(() => {
        setQrModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    const downloadQrCode = useCallback(() => {
        if (!qrModal.url) return;

        if (qrCanvasRef.current) {
            const canvas = qrCanvasRef.current;
            const link = document.createElement('a');
            link.download = `ezbar-qr-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    }, [qrModal.url]);

    const openComingSoonModal = useCallback((feature: string, description: string, iconColor: string, icon: JSX.Element) => {
        setComingSoonModal({
            isOpen: true,
            feature,
            description,
            iconColor,
            icon,
        });
    }, []);

    const closeComingSoonModal = useCallback(() => {
        setComingSoonModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    const processFiles = useCallback((fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        setUploadError(null);
        const newValidFiles: File[] = [];
        const errors: string[] = [];

        files.forEach((file) => {
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`"${file.name}" exceeds 100MB limit.`);
                return;
            }

            const validation = isValidFileType(file);
            if (!validation.valid) {
                errors.push(`"${file.name}": ${validation.message}`);
                return;
            }

            newValidFiles.push(file);
        });

        if (errors.length > 0) {
            setUploadError(errors.join(' '));
        }

        if (newValidFiles.length === 0) return;

        // Read files asynchronously
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
        });
    }, [t]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    }, [processFiles]);

    const getCounterColor = useCallback(() => {
        if (AI_MAX_CHARS === 0) return 'text-gray-400';
        if (aiCharCount === 0) return 'text-gray-400';
        if (aiCharCount > AI_MAX_CHARS) return 'text-red-500';
        if (aiCharCount > AI_WARNING_CHARS) return 'text-orange-500';
        return 'text-[#22c55e]';
    }, [aiCharCount, AI_MAX_CHARS, AI_WARNING_CHARS]);

    const getProgressStyles = useCallback(() => {
        if (AI_MAX_CHARS === 0) return { width: '0%', color: 'bg-gray-500' };
        
        const percentage = Math.min((aiCharCount / AI_MAX_CHARS) * 100, 100);
        let color = 'bg-[#22c55e]';

        if (aiCharCount > AI_MAX_CHARS) {
            color = 'bg-red-500';
        } else if (aiCharCount > AI_WARNING_CHARS) {
            color = 'bg-orange-500';
        }

        return { width: `${percentage}%`, color };
    }, [aiCharCount, AI_MAX_CHARS, AI_WARNING_CHARS]);

    // ============================================================
    // Model Dropdown Component
    // ============================================================
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
                            {model.isPrevious && (
                                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                    PREVIOUS
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
                data-tooltip-content={t('ezbar_model_selector', 'Select AI model for your conversation')}
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
                        <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">✨ AI Models</span>
                            </div>
                        </div>
                        {modelOptions.filter(m => m.type === 'flagship').map((model) => (
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
                            Powered by Moonshot AI, OpenAI, DeepSeek, Perplexity & Google Gemini
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    // ============================================================
    // Popular Topics
    // ============================================================
    const popularTopics: PopularTopic[] = useMemo(() => [
        {
            id: 'parenting',
            label: t('ezbar_topic_parenting', 'Parenting'),
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v8H3v-8a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-1.01-1-1.73a2 2 0 0 1 2-2Z"/>
                </svg>
            ),
        },
        {
            id: 'latest-news',
            label: t('ezbar_topic_news', 'Latest News'),
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                </svg>
            ),
        },
        {
            id: 'travel',
            label: t('ezbar_topic_travel', 'Travel'),
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                </svg>
            ),
        },
        {
            id: 'technology',
            label: t('ezbar_topic_technology', 'Technology'),
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7h-9"/>
                    <path d="M14 17H5"/>
                    <circle cx="17" cy="17" r="3"/>
                    <circle cx="7" cy="7" r="3"/>
                </svg>
            ),
        },
        {
            id: 'health',
            label: t('ezbar_topic_health', 'Health'),
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 12-4-4v3H3v2h15v3z"/>
                    <path d="M2 9v1c0 1.1.9 2 2 2h6v5l4-4-4-4v5H4a2 2 0 0 1-2-2V9Z"/>
                </svg>
            ),
        },
        {
            id: 'finance',
            label: t('ezbar_topic_finance', 'Finance'),
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
            ),
        },
    ], [t]);

    const handlePopularTopicClick = useCallback((topic: string) => {
        setLinkQuery(topic);
        setAiQuery(topic);
        stopTyping();

        setCurrentPage(1);

        setAiConversationId(null);
        setAiThreadId(null);
        setAiConversationTitle(null);
        setAiConversationMessages([]);
        setAiMessageCount(0);
        setAiConversationCost(0);
        setAiSlug(null);
        setAiParentSlug(null);
        setConversationId(null);
        setConversationMessages([]);
        setComments([]);
        setUploadedFiles([]);
        setCustomSlug('');
        setSlugAvailable(null);

        setTimeout(() => {
            handleLinkSearch();
        }, 50);
    }, [handleLinkSearch, stopTyping]);

    // ============================================================
    // Unified Conversation Renderer
    // ============================================================
    const renderUnifiedConversation = () => {
        if (conversationMessages.length === 0) return null;

        return (
            <div className="mb-8 space-y-4 max-h-[500px] overflow-y-auto border rounded-xl p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversation</h3>
                {conversationMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.message_role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                            msg.message_role === 'user' 
                                ? msg.content_type === 'upload' 
                                    ? 'bg-blue-500 text-white'
                                    : msg.content_type === 'social' || msg.content_type === 'social_media'
                                    ? 'bg-purple-500 text-white'
                                    : msg.content_type === 'landing_page'
                                    ? 'bg-indigo-500 text-white'
                                    : msg.content_type === 'embed'
                                    ? 'bg-orange-500 text-white'
                                    : msg.content_type === 'conversationcomment'
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-[#22c55e] text-white' 
                                : 'bg-white border border-gray-200'
                        }`}>
                            {msg.content_type === 'ai' && (
                                <>
                                    {msg.message_role === 'user' ? (
                                        <p className="text-sm">{msg.query}</p>
                                    ) : (
                                        <div>
                                            <MarkdownPreview 
                                                source={msg.response || ''} 
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    fontSize: '14px',
                                                    color: msg.message_role === 'user' ? 'white' : '#1f2937',
                                                }}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {msg.content_type === 'landing_page' && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Landing Page Created</p>
                                    <p className="text-sm">{msg.query}</p>
                                    {msg.response && (
                                        <div className="mt-2 text-sm opacity-90">
                                            <MarkdownPreview 
                                                source={msg.response}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    fontSize: '13px',
                                                    color: msg.message_role === 'user' ? 'white' : '#1f2937',
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {msg.content_type === 'comment' && (
                                <div>
                                    <p className="text-sm">{msg.query}</p>
                                    {msg.user && (
                                        <p className="text-xs opacity-75 mt-1">
                                            {msg.user.name || 'Guest'}
                                        </p>
                                    )}
                                    <span className="text-xs opacity-75 block mt-1">
                                        {msg.formatted_created_at}
                                    </span>
                                </div>
                            )}

                            {msg.content_type === 'conversationcomment' && (
                                <div>
                                    <p className="text-sm">{msg.query}</p>
                                    {msg.user && (
                                        <p className="text-xs opacity-75 mt-1">
                                            {msg.user.name || 'Guest'}
                                        </p>
                                    )}
                                    <span className="text-xs opacity-75 block mt-1">
                                        {msg.formatted_created_at}
                                    </span>
                                </div>
                            )}

                            {msg.content_type === 'embed' && (
                                <div>
                                    <p className="text-xs font-medium mb-1 opacity-90">Embed Layout</p>
                                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.query }} />
                                    {msg.user && (
                                        <p className="text-xs opacity-75 mt-1">
                                            {msg.user.name || 'Guest'}
                                        </p>
                                    )}
                                    <span className="text-xs opacity-75 block mt-1">
                                        {msg.formatted_created_at}
                                    </span>
                                </div>
                            )}
                            
                            {(msg.content_type === 'social' || msg.content_type === 'social_media') && (
                                <div>
                                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.query }} />
                                    {msg.user && (
                                        <p className="text-xs opacity-75 mt-1">
                                            {msg.user.name || 'Guest'}
                                        </p>
                                    )}
                                    <span className="text-xs opacity-75 block mt-1">
                                        {msg.formatted_created_at}
                                    </span>
                                </div>
                            )}
                            
                            {msg.content_type === 'upload' && msg.file_data && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                                        {msg.file_data.mime_type.startsWith('image/') ? (
                                            <img 
                                                src={msg.file_data.url} 
                                                alt={msg.file_data.original_name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        ) : msg.file_data.mime_type === 'application/pdf' ? (
                                            <FontAwesomeIcon icon={faFilePdf} className="text-white text-xl" />
                                        ) : msg.file_data.mime_type === 'text/html' || msg.file_data.extension === 'html' || msg.file_data.extension === 'htm' ? (
                                            <FontAwesomeIcon icon={faFileCode} className="text-white text-xl" />
                                        ) : msg.file_data.mime_type.includes('word') ? (
                                            <FontAwesomeIcon icon={faFileWord} className="text-white text-xl" />
                                        ) : (
                                            <FontAwesomeIcon icon={faFileAlt} className="text-white text-xl" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {msg.file_data.original_name}
                                        </p>
                                        <p className="text-xs opacity-75">
                                            {formatFileSize(msg.file_data.size)}
                                        </p>
                                        {msg.query && (
                                            <p className="text-xs mt-1 italic opacity-90">{msg.query}</p>
                                        )}
                                    </div>
                                    <a 
                                        href={msg.file_data.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white hover:underline text-xs px-2 py-1 bg-white/20 rounded"
                                    >
                                        Open
                                    </a>
                                </div>
                            )}
                            
                            <div className={`flex items-center justify-between mt-2 text-xs ${
                                msg.message_role === 'user' ? 'text-white/80' : 'text-gray-500'
                            }`}>
                                <span>{msg.formatted_created_at}</span>
                                <a 
                                    href={msg.share_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`hover:underline ${
                                        msg.message_role === 'user' ? 'text-white' : 'text-[#22c55e]'
                                    }`}
                                >
                                    {t('ezbar_permalink', 'Permalink')}
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={conversationEndRef} />
            </div>
        );
    };

    // ============================================================
    // Pagination Renderer
    // ============================================================
    const renderPagination = () => {
        if (allResultsCount <= perPage) return null;

        return (
            <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isSearchingLinks}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors ${
                        currentPage === 1 || isSearchingLinks
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content={currentPage === 1 ? t('ezbar_first_page', 'You\'re on the first page') : t('ezbar_previous_page', 'Go to previous page')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                    <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isSearchingLinks}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === pageNum
                                        ? 'bg-[#22c55e] text-white'
                                        : isSearchingLinks
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                }`}
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={currentPage === pageNum 
                                    ? t('ezbar_current_page', 'You\'re on page {number}', { number: pageNum })
                                    : t('ezbar_page_number', 'Go to page {number}', { number: pageNum })}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isSearchingLinks}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors ${
                        currentPage === totalPages || isSearchingLinks
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content={currentPage === totalPages ? t('ezbar_last_page', 'You\'re on the last page') : t('ezbar_next_page', 'Go to next page')}
                >
                    <span>Next</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6"/>
                    </svg>
                </button>
            </div>
        );
    };

    // ============================================================
    // Link Results Renderer
    // ============================================================
    const renderLinkResults = () => {
        if (!showLinkResults) return null;

        if (isSearchingLinks && (!Array.isArray(linkResults) || linkResults.length === 0)) {
            return (
                <div 
                    ref={resultsContainerRef}
                    className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50"
                >
                    <div className="px-4 py-8 text-center">
                        <svg 
                            width="48" 
                            height="48" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#22c55e" 
                            strokeWidth="1.5" 
                            className="mx-auto mb-3 animate-spin"
                        >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        <p className="text-gray-600">{t('ezbar_searching_links', 'Searching for')} "<span className="font-semibold">{linkQuery}</span>"</p>
                    </div>
                </div>
            );
        }

        const resultsArray = Array.isArray(linkResults) ? linkResults : [];

        if (resultsArray.length === 0 && !isSearchingLinks) {
            return (
                <div 
                    ref={resultsContainerRef}
                    className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50"
                >
                    <div className="px-4 py-6 text-center">
                        <svg 
                            width="48" 
                            height="48" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#9ca3af" 
                            strokeWidth="1.5" 
                            className="mx-auto mb-3"
                        >
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.3-4.3"/>
                        </svg>
                        <p className="text-gray-600">{t('ezbar_no_results', 'No results found for')} "<span className="font-semibold">{linkQuery}</span>"</p>
                        <p className="text-sm text-gray-400 mt-1">{t('ezbar_try_keywords', 'Try different keywords or check your spelling')}</p>
                        <button 
                            onClick={clearLinkResults}
                            className="mt-3 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={t('ezbar_clear_results', 'Clear search results')}
                        >
                            {t('ezbar_close', 'Close')}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div 
                ref={resultsContainerRef}
                key={`results-${currentPage}-${allResultsCount}`}
                className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[500px] overflow-y-auto"
            >
                <div className={`sticky top-0 px-4 py-3 border-b rounded-t-xl z-10 ${
                    searchMode === 'ai' 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-100' 
                        : 'bg-gray-50 border-gray-100'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${
                                searchMode === 'ai' ? 'text-white' : 'text-gray-600'
                            }`}>
                                {searchMode === 'ai' 
                                    ? t('ezbar_label_ai_conversation', 'AI Conversation Results')
                                    : t('ezbar_label_search_results', 'Search Results')}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                searchMode === 'ai' 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-[#22c55e] text-white'
                            }`}>
                                {allResultsCount} {t('ezbar_label_total', 'total')} • {t('ezbar_label_page', 'Page')} {currentPage} {t('ezbar_label_of', 'of')} {totalPages}
                            </span>
                        </div>
                        <button 
                            onClick={clearLinkResults}
                            className={`transition-colors p-1 rounded ${
                                searchMode === 'ai' 
                                    ? 'text-white/80 hover:text-white hover:bg-white/10' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            aria-label="Close results"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={t('ezbar_clear_results', 'Clear search results')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18"/>
                                <path d="m6 6 12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="overflow-y-auto max-h-[400px]">
                    {resultsArray.map((result, index) => {
                        const typeStyles = getResultTypeStyles(result.type);
                        const globalIndex = (currentPage - 1) * perPage + index + 1;
                        
                        return (
                            <div 
                                key={`${result.id}-${result.type}-${globalIndex}`}
                                className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeStyles.bg} ${typeStyles.text}`}
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={t('ezbar_result_type', 'Result type: {type}', { type: result.type.replace('_', ' ') })}
                                            >
                                                {result.type === 'ai_conversation' ? 'AI Conversation' : result.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={t('ezbar_result_position', 'Result position in search results')}
                                            >
                                                #{globalIndex}
                                            </span>
                                            {result.score && (
                                                <span className="text-xs text-gray-500"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={t('ezbar_result_score', 'Relevance score: {score}% match', { score: result.score.toFixed(0) })}
                                                >
                                                    {result.score.toFixed(0)}% match
                                                </span>
                                            )}
                                            {result.type === 'ai_conversation' && result.message_count && (
                                                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={t('ezbar_messages_count', '{count} messages in this conversation', { count: result.message_count })}
                                                >
                                                    {result.message_count} msgs
                                                </span>
                                            )}
                                        </div>
                                        
                                        <a
                                            href={result.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block no-underline"
                                        >
                                            <h4 className={`text-sm font-medium truncate transition-colors ${
                                                searchMode === 'ai' 
                                                    ? 'text-purple-600 hover:text-purple-800' 
                                                    : 'text-gray-900 hover:text-[#22c55e]'
                                            }`}
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={t('ezbar_result_title', '{title}', { title: result.type === 'ai_conversation' && result.conversation_title ? result.conversation_title : result.title })}
                                            >
                                                {result.type === 'ai_conversation' && result.conversation_title 
                                                    ? result.conversation_title 
                                                    : result.title}
                                            </h4>
                                            
                                            {result.subtitle && (
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={result.subtitle}
                                                >
                                                    {result.subtitle}
                                                </p>
                                            )}
                                            
                                            {result.type === 'ai_conversation' && result.query_preview && (
                                                <p className="text-xs text-gray-500 mt-1 italic line-clamp-1"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={`Original query: ${result.query_preview}`}
                                                >
                                                    💬 {result.query_preview}
                                                </p>
                                            )}
                                        </a>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500 truncate flex items-center gap-1"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={t('ezbar_result_url', 'URL: {url}', { url: result.type === 'ai_conversation' ? '/X/' + result.slug : result.url })}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                                </svg>
                                                {result.type === 'ai_conversation' ? '/X/' + result.slug : result.url}
                                            </span>
                                            {result.created_at && (
                                                <span className="text-xs text-gray-400"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={t('ezbar_result_created', 'Created: {date}', { date: result.created_at })}
                                                >
                                                    {result.created_at}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={result.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`transition-colors ${
                                                searchMode === 'ai' 
                                                    ? 'text-purple-400 hover:text-purple-600' 
                                                    : 'text-gray-400 hover:text-[#22c55e]'
                                            }`}
                                            aria-label="Open link"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={t('ezbar_open_link', 'Open link in new tab')}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2V8a2 2 0 0 1 2 2h6"/>
                                                <polyline points="15 3 21 3 21 9"/>
                                                <line x1="10" y1="14" x2="21" y2="3"/>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-3">
                                    <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1 ${
                                            searchMode === 'ai' 
                                                ? 'bg-purple-500 hover:bg-purple-600' 
                                                : 'bg-[#22c55e] hover:bg-[#16a34a]'
                                        }`}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={t('ezbar_visit_link', 'Visit this link')}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2V8a2 2 0 0 1 2 2h6"/>
                                            <polyline points="15 3 21 3 21 9"/>
                                            <line x1="10" y1="14" x2="21" y2="3"/>
                                        </svg>
                                        <span>Visit</span>
                                    </a>
                                    
                                    <button
                                        onClick={() => generateQrCode(result.url, result.title)}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={t('ezbar_generate_qr', 'Generate QR code for this link')}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="7" height="7" x="3" y="3" rx="1"/>
                                            <rect width="7" height="7" x="14" y="3" rx="1"/>
                                            <rect width="7" height="7" x="14" y="14" rx="1"/>
                                            <rect width="7" height="7" x="3" y="14" rx="1"/>
                                        </svg>
                                        <span>QR Code</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {renderPagination()}
                
                <div className={`px-4 py-3 border-t rounded-b-xl ${
                    searchMode === 'ai' ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'
                }`}>
                    <p className="text-xs text-gray-500 text-center">
                        Showing {resultsArray.length} of {allResultsCount} results • 
                        <button 
                            onClick={clearLinkResults}
                            className="text-gray-600 hover:text-gray-900 font-medium underline ml-1"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={t('ezbar_clear_results', 'Clear all search results')}
                        >
                            Clear results
                        </button>
                    </p>
                </div>
            </div>
        );
    };

    // ============================================================
    // AI Conversation Renderer
    // ============================================================
    const renderAIConversation = () => {
        if (aiConversationMessages.length === 0) return null;

        return (
            <div className="mb-4 space-y-4">
                {aiConversationMessages.map((message) => {
                    if (message.message_role === 'system') return null;
                    
                    const isUser = message.message_role === 'user';
                    
                    return (
                        <div 
                            key={message.id} 
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
                                <div 
                                    className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-[#22c55e] text-white' : 'bg-gray-100'}`}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={isUser ? t('ezbar_user_message', 'Your message') : t('ezbar_assistant_message', 'AI response')}
                                >
                                    {isUser ? (
                                        <p className="font-medium">{message.query}</p>
                                    ) : (
                                        <div>
                                            <MarkdownPreview
                                                source={message.response || ''}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    fontSize: '14px',
                                                    color: isUser ? 'white' : '#1f2937',
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={t('ezbar_message_sent', 'Message sent at {time}', { time: message.formatted_created_at })}
                                >
                                    {message.formatted_created_at}
                            </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ============================================================
    // AI Response Renderer
    // ============================================================
    const renderAIResponse = () => {
        if (!aiResponse && !aiError && aiConversationMessages.length === 0) return null;

        if (aiError) {
            return (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-red-100 bg-red-50 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="#dc2626" 
                                    strokeWidth="2.5"
                                >
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="m15 9-6 6"/>
                                    <path d="m9 9 6 6"/>
                                </svg>
                                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                                    AI Error
                                </span>
                            </div>
                            <button 
                                onClick={() => setAiError(null)}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-100 rounded"
                                aria-label="Close error"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={t('ezbar_close_error', 'Close error message')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-4">
                        <div className="text-sm text-red-600">{aiError}</div>
                    </div>
                    
                    <div className="px-4 py-3 bg-red-50 border-t border-red-100 rounded-b-xl">
                        <p className="text-xs text-red-500 text-center">
                            <button 
                                onClick={handleAiSearch}
                                className="text-red-600 hover:text-red-800 font-medium underline"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={t('ezbar_try_again', 'Try sending your query again')}
                            >
                                Try again
                            </button>
                            • 
                            <button 
                                onClick={clearAiResults}
                                className="text-red-600 hover:text-red-800 font-medium underline ml-1"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={t('ezbar_clear_error', 'Clear error and start over')}
                            >
                                Clear
                            </button>
                        </p>
                    </div>
                </div>
            );
        }

        if (isAiDisabled) {
            return (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-yellow-100 bg-yellow-50 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="#eab308" 
                                    strokeWidth="2.5"
                                >
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 8v4"/>
                                    <path d="M12 16h.01"/>
                                </svg>
                                <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">
                                    AI Disabled
                                </span>
                            </div>
                            <button 
                                onClick={clearAiResults}
                                className="text-yellow-400 hover:text-yellow-600 transition-colors p-1 hover:bg-yellow-100 rounded"
                                aria-label="Close"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={t('ezbar_close', 'Close')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 text-center">
                        <p className="text-gray-600 mb-2">
                            {isAuthenticated 
                                ? t('ezbar_ai_disabled_user', 'Ask AI is currently disabled for logged-in users.')
                                : t('ezbar_ai_disabled_guest', 'Ask AI is currently disabled for guests. Login to access Ask AI.')}
                        </p>
                        {!isAuthenticated && (
                            <button 
                                onClick={() => setShowLoginPrompt(true)}
                                className="inline-block px-4 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors text-sm font-medium"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={t('ezbar_login_to_access', 'Login to access Ask AI')}
                            >
                                Login to Access
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-[500px] overflow-y-auto">
                <div className="sticky top-0 px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-xl z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="white" 
                                strokeWidth="2.5"
                            >
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                            </svg>
                            <span className="text-xs font-semibold text-white uppercase tracking-wider">
                                {t('ezbar_ai_conversation', 'AI Conversation {title}', { title: aiConversationTitle ? `- ${aiConversationTitle}` : '' })}
                            </span>
                            {selectedModel && (
                                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                                    {selectedModel.name}
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={clearAiResults}
                            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                            aria-label="Close AI response"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={t('ezbar_close_modal', 'Close this modal')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18"/>
                                <path d="m6 6 12 12"/>
                            </svg>
                        </button>
                    </div>
                    {aiMessageCount > 0 && (
                        <div className="mt-2 text-xs text-purple-200 flex items-center space-x-4">
                            <span data-tooltip-id="main-tooltip" data-tooltip-content={t('ezbar_messages_count', '{count} messages in this conversation', { count: aiMessageCount })}>
                                {aiMessageCount} messages in this conversation
                            </span>
                            <span className="flex items-center space-x-1" data-tooltip-id="main-tooltip" data-tooltip-content={t('ezbar_conversation_cost', 'Total conversation cost')}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                </svg>
                                <span>{t('ezbar_total_cost', 'Total cost of this conversation: ${cost}', { cost: aiConversationCost.toFixed(5) })}</span>
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="p-4">
                    {renderAIConversation()}
                    
                    {aiResponse && (
                        <div className="mt-4">
                            <MarkdownPreview
                                source={aiResponse}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: '#1f2937',
                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                }}
                                wrapperElement={{
                                    'data-color-mode': 'light'
                                }}
                            />
                            
                            {(aiUsage || aiConversationCost > 0) && (
                                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {aiUsage && (
                                                <>
                                                    <span className="flex items-center gap-1" data-tooltip-id="main-tooltip" data-tooltip-content={t('ezbar_token_usage', 'Total tokens used in this response')}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M2 12h5l2-4 3 8 3-8 2 4h5"/>
                                                        </svg>
                                                        Tokens: {aiUsage.total_tokens}
                                                    </span>
                                                    <span data-tooltip-id="main-tooltip" data-tooltip-content={t('ezbar_prompt_tokens', 'Prompt tokens')}>Prompt: {aiUsage.prompt_tokens}</span>
                                                    <span data-tooltip-id="main-tooltip" data-tooltip-content={t('ezbar_completion_tokens', 'Completion tokens')}>Completion: {aiUsage.completion_tokens}</span>
                                                </>
                                            )}
                                            <span className="flex items-center gap-1" data-tooltip-id="main-tooltip" data-tooltip-content={t('ezbar_response_cost', 'Estimated cost for this response')}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                                </svg>
                                                {t('ezbar_this_response_cost', 'This response cost: ${cost}', { cost: ((aiUsage?.total_tokens || 0) / 1000 * 0.01).toFixed(5) })}
                                            </span>
                                            <span className="flex items-center gap-1" data-tooltip-id="main-tooltip" data-tooltip-content={t('ezbar_conversation_cost', 'Total conversation cost')}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                                </svg>
                                                {t('ezbar_total_cost', 'Total cost of this conversation: ${cost}', { cost: aiConversationCost.toFixed(5) })}
                                            </span>
                                            <span className="flex items-center gap-1" data-tooltip-id="main-tooltip" data-tooltip-content={t('ezbar_model_used', 'Model used')}>
                                                Model: {selectedModel.name}
                                            </span>
                                        </div>
                                        {aiSlug && (
                                            <Link 
                                                href={`/X/${encodeSlugForUrl(aiSlug)}`}
                                                className="text-[#22c55e] hover:text-[#16a34a] text-xs"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={t('ezbar_view_conversation', 'View full conversation')}
                                            >
                                                {t('ezbar_conversation_permalink', 'View full conversation')}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {showRedirectNotification && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${redirecting ? 'bg-green-100' : 'bg-green-500'}`}>
                                        {redirecting ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="animate-spin">
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                                <path d="m9 18 6-6-6-6"/>
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-green-800">
                                            {redirecting ? t('ezbar_redirecting', 'Redirecting to conversation page...') : t('ezbar_new_conversation_created', 'New conversation created!')}
                                        </h4>
                                        <p className="text-xs text-green-600 mt-1">
                                            {redirecting 
                                                ? t('ezbar_redirect_message', 'You\'ll be redirected to the conversation page in a moment...')
                                                : t('ezbar_continue_conversation', 'You can continue this conversation in the dedicated conversation page.')}
                                        </p>
                                    </div>
                                </div>
                                {!redirecting && aiSlug && (
                                    <Link 
                                        href={`/X/${encodeSlugForUrl(aiSlug)}`}
                                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors flex items-center space-x-1"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={t('ezbar_go_now', 'Go to conversation page now')}
                                    >
                                        <span>{t('ezbar_go_now', 'Go to conversation page now')}</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="m9 18 6-6-6-6"/>
                                        </svg>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ============================================================
    // MAIN RENDER
    // ============================================================
    return (
        <>
            <Head title="ezbar.ai" />
            
            <Tooltip 
                id="main-tooltip"
                place="top"
                className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[100] !shadow-xl"
                effect="solid"
            />
            {auth?.user && <DraggableMenu auth={auth} />}
            <div className="flex min-h-screen bg-[#FCFCFC] text-slate-800">
                
                <main className="flex-1 min-h-screen overflow-y-auto">
                    <div className="flex flex-col items-center px-4 pt-1 pb-1">
                        
                        <div className="w-full max-w-[1200px] mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <ModelDropdown />
                            
                            {auth.user ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end leading-tight">
                                        <span className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">
                                            Hi, I'm {auth.user.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 hidden sm:inline-block">
                                            and explore the boundless creative world
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end leading-tight">
                                        <span className="text-sm font-semibold text-gray-700">
                                            Hi, I'm ez.wiki
                                        </span>
                                        <span className="text-[10px] text-gray-400 hidden sm:inline-block">
                                            and explore the boundless creative world
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <TopContent content={topcontent} />
                        
                        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* LEFT COLUMN: Search */}
                            <div className="lg:col-span-1 w-full">
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <svg 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2.5"
                                        className={searchMode === 'ai' ? 'text-purple-600' : 'text-gray-600'}
                                    >
                                        {searchMode === 'ai' ? (
                                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v8H3v-8a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-1.01-1-1.73a2 2 0 0 1 2-2Z"/>
                                        ) : (
                                            <circle cx="11" cy="11" r="8"/>
                                        )}
                                        {searchMode === 'ez' && <path d="m21 21-4.3-4.3"/>}
                                    </svg>
                                    <span className={`text-[11px] font-bold uppercase tracking-widest ${
                                        searchMode === 'ai' ? 'text-purple-600' : 'text-gray-600'
                                    }`}>
                                        {searchMode === 'ai' ? t('ezbar_search_mode_ai', 'AI Conversation Search') : t('ezbar_search_mode_ez', 'Link Search')}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
                                        • {t('ezbar_switch_mode', 'Click to toggle between link search and AI conversation search')}
                                    </span>
                                </div>
                                
                                <div className="relative group">
                                    <button
                                        onClick={toggleSearchMode}
                                        className="absolute inset-y-0 left-0 flex items-center pl-3 md:pl-4 z-10 group/toggle focus:outline-none"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={searchMode === 'ez' ? t('ezbar_switch_to_ai', 'Switch to AI conversation search') : t('ezbar_switch_to_ez', 'Switch to regular link search')}
                                    >
                                        <span className={`font-mono text-[10px] md:text-sm font-semibold tracking-tight bg-gradient-to-r px-2 py-0.5 rounded-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                            searchMode === 'ez' 
                                                ? 'text-[#22c55e] from-[#22c55e]/10 to-transparent' 
                                                : 'text-purple-500 from-purple-500/10 to-transparent'
                                        }`}>
                                            {searchMode === 'ez' ? 'EZ://' : 'AI://'}
                                        </span>
                                        <span className={`ml-1 w-1.5 h-1.5 rounded-full ${searchMode === 'ez' ? 'bg-[#22c55e]' : 'bg-purple-500'}`} />
                                    </button>
                                    
                                    {searchMode === 'ez' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                openComingSoonModal(
                                                    'QR Scanner',
                                                    t('ezbar_qr_scanner_soon', 'Scan QR codes from your browser (Coming Soon)'),
                                                    'green',
                                                    <svg 
                                                        width="32" 
                                                        height="32" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="1.5" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        className="text-green-500"
                                                    >
                                                        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                                                        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                                                        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                                                        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                                                        <rect width="6" height="6" x="9" y="9" rx="1"/>
                                                        <path d="M3 16v-3"/>
                                                        <path d="M21 16v-3"/>
                                                        <path d="M16 3h-3"/>
                                                        <path d="M16 21h-3"/>
                                                        <path d="M16 16l-3-3"/>
                                                        <path d="M16 8l-3 3"/>
                                                        <path d="M8 16l3-3"/>
                                                        <path d="M8 8l3 3"/>
                                                    </svg>
                                                );
                                            }}
                                            className="absolute right-32 md:right-40 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-[#22c55e] transition-colors"
                                            aria-label="Scan QR code"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={t('ezbar_qr_scanner_soon', 'Scan QR codes from your browser (Coming Soon)')}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                                                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                                                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                                                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                                                <rect width="6" height="6" x="9" y="9" rx="1"/>
                                                <path d="M3 16v-3"/>
                                                <path d="M21 16v-3"/>
                                                <path d="M16 3h-3"/>
                                                <path d="M16 21h-3"/>
                                                <path d="M16 16l-3-3"/>
                                                <path d="M16 8l-3 3"/>
                                                <path d="M8 16l3-3"/>
                                                <path d="M8 8l3 3"/>
                                            </svg>
                                        </button>
                                    )}
                                    
                                    {searchMode === 'ai' && (
                                        <div className="absolute right-32 md:right-40 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-purple-100 text-purple-600 rounded-lg text-xs font-medium flex items-center space-x-1">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v8H3v-8a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-1.01-1-1.73a2 2 0 0 1 2-2Z"/>
                                            </svg>
                                            <span>AI Conversations</span>
                                        </div>
                                    )}
                                    
                                    <input 
                                        ref={searchInputRef}
                                        type="text" 
                                        value={linkQuery}
                                        onChange={(e) => setLinkQuery(e.target.value)}
                                        onKeyDown={handleLinkKeyDown}
                                        onBlur={() => {
                                            setTimeout(() => {
                                                if (!linkQuery.trim()) {
                                                    setShowLinkResults(false);
                                                }
                                            }, 200);
                                        }}
                                        onFocus={() => {
                                            if (Array.isArray(linkResults) && linkResults.length > 0) {
                                                setShowLinkResults(true);
                                            }
                                        }}
                                        placeholder={searchMode === 'ez' ? t('ezbar_search_placeholder_ez', 'Search links, URLs, and domains...') : t('ezbar_search_placeholder_ai', 'Search AI conversations by slug or title...')}
                                        className="w-full bg-white border border-gray-200 rounded-xl py-3.5 md:py-4 pl-16 md:pl-20 pr-32 md:pr-48 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 focus:border-[#22c55e] focus:bg-white transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 shadow-sm hover:shadow-md backdrop-blur-sm resize-y min-h-[56px]"
                                        aria-label={searchMode === 'ez' ? "Search links, URLs, and domains" : "Search AI conversations"}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={searchMode === 'ez' ? t('ezbar_search_links_desc', 'Search for links, URLs, and domains') : t('ezbar_search_ai_desc', 'Search for AI conversation slugs and titles')}
                                    />
                                    
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
                                        {isSearchingLinks && (
                                            <div className="flex items-center text-xs text-gray-500 px-2 md:px-3 py-1.5 border border-gray-200 rounded-lg bg-white/80 shadow-sm"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={searchMode === 'ez' ? t('ezbar_searching_links_status', 'Searching for links...') : t('ezbar_searching_ai_status', 'Searching for AI conversations...')}
                                            >
                                                <svg 
                                                    width="12" 
                                                    height="12" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2.5"
                                                    className="animate-spin flex-shrink-0"
                                                >
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                                </svg>
                                                <span className="truncate ml-1.5 hidden md:inline">
                                                    {searchMode === 'ez' ? 'Searching...' : 'Searching AI...'}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleLinkSearch(undefined, 1)}
                                            disabled={isSearchingLinks || !linkQuery.trim()}
                                            className={`p-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 active:scale-95 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 ${
                                                searchMode === 'ez' 
                                                    ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] hover:shadow-[#22c55e]/20 focus:ring-[#22c55e]/50'
                                                    : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:shadow-purple-500/20 focus:ring-purple-500/50'
                                            }`}
                                            aria-label={searchMode === 'ez' ? "Search links" : "Search AI conversations"}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={!linkQuery.trim() 
                                                ? (searchMode === 'ez' ? "Type something to search" : "Type a slug or title to search") 
                                                : (searchMode === 'ez' ? "Search for links" : "Search for AI conversations")}
                                        >
                                            {isSearchingLinks ? (
                                                <svg 
                                                    width="18" 
                                                    height="18" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2.5" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                    className="animate-spin"
                                                >
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                                </svg>
                                            ) : (
                                                <svg 
                                                    width="18" 
                                                    height="18" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2.5" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                    className="group-hover:scale-105 transition-transform duration-200"
                                                >
                                                    <circle cx="11" cy="11" r="8"/>
                                                    <path d="m21 21-4.3-4.3"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    
                                    {searchMode === 'ez' && linkSuggestions.length > 0 && (
                                        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                                            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                                                <span className="text-xs font-medium text-gray-600">{t('ezbar_suggestions', 'Suggestions')}</span>
                                            </div>
                                            {linkSuggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center space-x-3 focus:outline-none focus:bg-gray-50"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={t('ezbar_search_for_suggestion', 'Search for "{suggestion}"', { suggestion })}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                        <circle cx="11" cy="11" r="8"/>
                                                        <path d="m21 21-4.3-4.3"/>
                                                    </svg>
                                                    <span className="text-sm text-gray-700">{suggestion}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {renderLinkResults()}
                                </div>
                            </div>
                            
                            {/* RIGHT COLUMN: Content with all sections */}
                            <div className="lg:col-span-2 w-full">
                                {/* Tab Navigation */}
                                <div className="flex flex-wrap items-center gap-2 mb-4 px-1 border-b border-gray-200 pb-3">
                                    <button
                                        onClick={() => {
                                            if (!canInteract) {
                                                setShowLoginPrompt(true);
                                                return;
                                            }
                                            setActiveTab('content');
                                        }}
                                        className={`flex-1 min-w-[100px] sm:flex-none px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                                            activeTab === 'content'
                                                ? 'bg-[#22c55e] text-white'
                                                : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                                        }`}
                                    >
                                        <TabIcon 
                                            icon={
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                    <line x1="9" y1="9" x2="15" y2="15"/>
                                                    <line x1="15" y1="9" x2="9" y2="15"/>
                                                </svg>
                                            }
                                            label="Social & Upload"
                                            count={uploadedFiles.length + comments.length}
                                            locked={!canInteract}
                                            active={activeTab === 'content'}
                                        />
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            if (!canInteract) {
                                                setShowLoginPrompt(true);
                                                return;
                                            }
                                            setActiveTab('text');
                                        }}
                                        className={`flex-1 min-w-[100px] sm:flex-none px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                                            activeTab === 'text'
                                                ? 'bg-[#22c55e] text-white'
                                                : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                                        }`}
                                    >
                                        <TabIcon 
                                            icon={
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v8H3v-8a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-1.01-1-1.73a2 2 0 0 1 2-2Z"/>
                                                    <path d="M9 12h6"/>
                                                    <path d="M12 9v6"/>
                                                </svg>
                                            }
                                            label="Ask AI"
                                            locked={!canInteract}
                                            active={activeTab === 'text'}
                                        />
                                    </button>
                                </div>
                                
                                {renderUnifiedConversation()}
                                
                                {/* Content Panel - Now shows all sections */}
                                {activeTab === 'content' && renderContentPanel()}
                                
                                {/* Ask AI Tab */}
                                {activeTab === 'text' && (
                                    !isAiDisabled ? (
                                        <div className="w-full">
                                            
                                            <div className="flex items-center gap-2 mb-3 px-1">
                                                <svg 
                                                    width="16" 
                                                    height="16" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2.5"
                                                    className="text-[#22c55e]"
                                                >
                                                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                                                </svg>
                                                <span className="text-[11px] font-bold text-[#22c55e] uppercase tracking-widest">
                                                    {t('ezbar_ask_ai', 'Ask AI')}
                                                </span>
                                                <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
                                                    • {t('ezbar_source_tag', 'Use @source for sources')}, {t('ezbar_thinking_mode', '#think for thinking mode')} • {isAuthenticated ? aiSettings.user_char_limit : aiSettings.guest_char_limit} char limit {!isAuthenticated && `(Login for ${aiSettings.user_char_limit})`}
                                                </span>
                                            </div>
                                            
                                            <div className="relative group">
                                                <div className="absolute top-4 left-0 flex items-start pl-3 md:pl-4 pointer-events-none z-10">
                                                    <span className="font-mono text-[10px] md:text-sm font-semibold text-[#22c55e] tracking-tight bg-gradient-to-r from-[#22c55e]/10 to-transparent px-2 py-0.5 rounded-md">
                                                        AI://
                                                    </span>
                                                </div>
                                                
                                                <div className="absolute top-4 right-0 flex items-center pr-3 space-x-2 z-20">
                                                    <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                                                        <span className="text-xs font-medium text-gray-700">{selectedModel.name}</span>
                                                        {selectedModel.isNew && (
                                                            <span className="text-[9px] font-semibold text-white bg-[#22c55e] px-1.5 py-0.5 rounded-full">
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <textarea
                                                    value={aiQuery}
                                                    onChange={(e) => setAiQuery(e.target.value)}
                                                    onKeyDown={handleAiKeyDown}
                                                    placeholder={t('ezbar_ai_placeholder', 'Ask AI anything... ({limit} char limit, use @source for sources, #think for thinking mode)', { limit: (isAuthenticated ? aiSettings.user_char_limit : aiSettings.guest_char_limit).toString() })}
                                                    className={`w-full bg-white border ${aiCharCount > AI_MAX_CHARS ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500' : 'border-gray-200 focus:ring-[#22c55e]/30 focus:border-[#22c55e]'} rounded-xl py-3.5 md:py-4 pl-12 md:pl-16 pr-12 md:pr-48 pb-14 md:pb-4 text-sm md:text-base focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 shadow-sm hover:shadow-md backdrop-blur-sm resize-y min-h-[120px] md:min-h-[140px] max-h-[300px] overflow-y-auto`}
                                                    aria-label="Ask AI anything... (Use @source for sources, #think for thinking mode)"
                                                    rows={4}
                                                    style={{ resize: 'vertical' }}
                                                    maxLength={AI_MAX_CHARS + 100}
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={t('ezbar_ai_placeholder', 'Ask AI anything... ({limit} char limit, use @source for sources, #think for thinking mode)', { limit: (isAuthenticated ? aiSettings.user_char_limit : aiSettings.guest_char_limit).toString() })}
                                                    disabled={!canInteract}
                                                />
                                                
                                                <div className="absolute bottom-3 left-3 md:left-16 flex items-center space-x-2">
                                                    <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-gray-100 shadow-sm"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content={t('ezbar_char_count', '{current} of {max} characters used', { current: aiCharCount, max: AI_MAX_CHARS })}
                                                    >
                                                        <div className="hidden sm:block w-12 md:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full ${getProgressStyles().color} transition-all duration-300`} 
                                                                style={{ width: getProgressStyles().width }}
                                                            />
                                                        </div>
                                                        
                                                        <span className={`text-[10px] md:text-xs font-medium ${getCounterColor()}`}>
                                                            {aiCharCount.toLocaleString()}/{AI_MAX_CHARS.toLocaleString()}
                                                            {!isAuthenticated && ` (Login for ${aiSettings.user_char_limit})`}
                                                        </span>
                                                        
                                                        {aiCharCount > AI_MAX_CHARS && (
                                                            <svg 
                                                                width="14" 
                                                                height="14" 
                                                                viewBox="0 0 24 24" 
                                                                fill="none" 
                                                                stroke="#ef4444" 
                                                                strokeWidth="2.5"
                                                                className="animate-pulse"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content={t('ezbar_character_limit_exceeded', 'Character limit exceeded. {login_message}Maximum is {max}', { 
                                                                    max: AI_MAX_CHARS, 
                                                                    login_message: !isAuthenticated ? t('ezbar_login_for_higher_limit', 'Login for higher limits. ') : '' 
                                                                })}
                                                            >
                                                                <circle cx="12" cy="12" r="10"/>
                                                                <path d="M12 8v4"/>
                                                                <path d="M12 16h.01"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="absolute bottom-3 right-0 flex items-center pr-3 space-x-1 md:space-x-2">
                                                    {isAiSearching && (
                                                        <div className="flex items-center text-xs text-gray-500 px-2 md:px-3 py-1.5 border border-gray-200 rounded-lg bg-white/80 shadow-sm"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={t('ezbar_ai_thinking', 'AI is processing your request...')}
                                                        >
                                                            <svg 
                                                                width="12" 
                                                                height="12" 
                                                                viewBox="0 0 24 24" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                strokeWidth="2.5"
                                                                className="animate-spin flex-shrink-0"
                                                            >
                                                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                                            </svg>
                                                            <span className="ml-1.5 hidden md:inline">{t('ezbar_ai_thinking_dots', 'Thinking...')}</span>
                                                        </div>
                                                    )}
                                                    
                                                    {(aiResponse || aiConversationMessages.length > 0) && !isAiSearching && (
                                                        <div className="flex items-center text-xs font-medium text-[#22c55e] px-2 md:px-3 py-1.5 border border-[#22c55e]/20 rounded-lg bg-[#22c55e]/5 shadow-sm"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={aiMessageCount > 0 ? t('ezbar_messages_count', '{count} messages in this conversation', { count: aiMessageCount }) : t('ezbar_ai_responded', 'AI has responded')}                                                        
                                                        >
                                                            <svg 
                                                                width="12" 
                                                                height="12" 
                                                                viewBox="0 0 24 24" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                strokeWidth="2.5"
                                                                className="flex-shrink-0"
                                                            >
                                                                <path d="m9 12 2 2 4-4"/>
                                                                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"/>
                                                            </svg>
                                                            <span className="ml-1.5 hidden md:inline">
                                                                {aiMessageCount > 0 ? `${aiMessageCount} msgs` : 'AI Responded'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    <button 
                                                        onClick={handleAiSearch}
                                                        disabled={isAiSearching || !aiQuery.trim() || aiCharCount > AI_MAX_CHARS || !canInteract}
                                                        className="p-3 bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white rounded-xl hover:shadow-lg hover:shadow-[#22c55e]/20 transition-all duration-200 active:scale-95 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50"
                                                        aria-label="Ask AI"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content={
                                                            !canInteract
                                                                ? t('ezbar_login_required', 'Login required to use Ask AI')
                                                                : aiCharCount > AI_MAX_CHARS 
                                                                    ? t('ezbar_character_limit_exceeded', 'Character limit exceeded ({current}/{max}){login_message}', { 
                                                                        current: aiCharCount, 
                                                                        max: AI_MAX_CHARS, 
                                                                        login_message: !isAuthenticated ? t('ezbar_login_for_higher_limit', '. Login for higher limits.') : '' 
                                                                    })
                                                                    : !aiQuery.trim() 
                                                                        ? t('ezbar_type_question', 'Type a question first')
                                                                        : t('ezbar_ask_ai', 'Ask AI')
                                                        }
                                                    >
                                                        {isAiSearching ? (
                                                            <svg 
                                                                width="18" 
                                                                height="18" 
                                                                viewBox="0 0 24 24" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                strokeWidth="2.5" 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round"
                                                                className="animate-spin"
                                                            >
                                                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                                            </svg>
                                                        ) : (
                                                            <svg 
                                                                width="18" 
                                                                height="18" 
                                                                viewBox="0 0 24 24" 
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                strokeWidth="2.5" 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round"
                                                                className="group-hover:scale-105 transition-transform duration-200"
                                                            >
                                                                <path d="M5 12h14"/>
                                                                <path d="m12 5 7 7-7 7"/>
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                
                                                {aiCharCount > AI_MAX_CHARS && (
                                                    <div className="absolute -bottom-6 left-0 text-xs text-red-500 animate-fadeIn"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content={t('ezbar_character_limit_exceeded', 'Character limit is {max}{login_message}', { 
                                                            max: AI_MAX_CHARS, 
                                                            login_message: !isAuthenticated ? t('ezbar_login_for_higher_limit', '. Login for higher limits.') : '' 
                                                        })}
                                                    >
                                                        {t('ezbar_character_limit_exceeded', 'Character limit exceeded ({current}/{max}){login_message}', { 
                                                            current: aiCharCount, 
                                                            max: AI_MAX_CHARS, 
                                                            login_message: !isAuthenticated ? t('ezbar_login_for_higher_limit', '. Login for higher limits.') : '' 
                                                        })}
                                                    </div>
                                                )}
                                                
                                                {renderAIResponse()}
                                            </div>
                                            
                                            <style>{`
                                                @keyframes fadeIn {
                                                    from { opacity: 0; transform: translateY(-5px); }
                                                    to { opacity: 1; transform: translateY(0); }
                                                }
                                                .animate-fadeIn {
                                                    animation: fadeIn 0.2s ease-out;
                                                }
                                            `}</style>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg 
                                                    width="24" 
                                                    height="24" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="#9ca3af" 
                                                    strokeWidth="2"
                                                >
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="M12 8v4"/>
                                                    <path d="M12 16h.01"/>
                                                </svg>
                                            </div>
                                            <p className="text-gray-600 mb-2">
                                                {isAuthenticated 
                                                    ? t('ezbar_ai_disabled_user', 'Ask AI is currently disabled for logged-in users.')
                                                    : t('ezbar_ai_disabled_guest', 'Ask AI is currently disabled for guests.')}
                                            </p>
                                            {!isAuthenticated && (
                                                <button 
                                                    onClick={() => setShowLoginPrompt(true)}
                                                    className="inline-block px-6 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors text-sm font-medium"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={t('ezbar_login_to_access', 'Login to access Ask AI')}
                                                >
                                                    Login to Access
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                                
                                {activeTab === 'text' && (
                                    <div className="flex flex-wrap justify-center gap-3 mt-8 md:mt-10 w-full">
                                        {popularTopics.map((topic) => (
                                            <button 
                                                key={topic.id}
                                                onClick={() => handlePopularTopicClick(topic.label)}
                                                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-95 text-[13.5px] text-gray-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={t('ezbar_search_for_suggestion', 'Search for "{suggestion}"', { suggestion: topic.label })}
                                            >
                                                {topic.icon}
                                                <span className="font-medium">{topic.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <BottomContent content={bottomcontent} />
                    </div>
                </main>
            </div>

            {/* QR Code Modal */}
            {qrModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="7" height="7" x="3" y="3" rx="1"/>
                                            <rect width="7" height="7" x="14" y="3" rx="1"/>
                                            <rect width="7" height="7" x="14" y="14" rx="1"/>
                                            <rect width="7" height="7" x="3" y="14" rx="1"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{t('ezbar_qr_code_title', 'QR Code')}</h3>
                                        <p className="text-sm text-gray-500 truncate max-w-[300px]">{qrModal.title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeQrModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                                    aria-label="Close QR modal"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={t('ezbar_close_qr_modal', 'Close QR modal')}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18"/>
                                        <path d="m6 6 12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <QRCodeCanvas
                                        ref={qrCanvasRef}
                                        value={qrModal.url}
                                        size={200}
                                        level="H"
                                        fgColor="#22c55e"
                                        bgColor="#ffffff"
                                        includeMargin={true}
                                    />
                                </div>
                                
                                <div className="text-center mb-6">
                                    <p className="text-sm font-medium text-gray-700 mb-1">{t('ezbar_scan_to_visit', 'Scan to visit:')}</p>
                                    <p className="text-xs text-gray-500 break-all px-4">{qrModal.url}</p>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={downloadQrCode}
                                        className="px-4 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={t('ezbar_download_qr', 'Download QR code as PNG')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7 10 12 15 17 10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                        <span>Download QR</span>
                                    </button>
                                    
                                    <button
                                        onClick={closeQrModal}
                                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={t('ezbar_close_modal', 'Close modal')}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
                            <p className="text-xs text-gray-500 text-center">
                                {t('ezbar_qr_powered_by', 'Powered by ezbar.ai • QR codes work with any scanner')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Required Modal */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
                        <div className="px-6 py-5 rounded-t-2xl bg-gradient-to-r from-[#22c55e] to-[#16a34a]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{t('ezbar_login_required', 'Login Required')}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-semibold text-white">
                                                {t('ezbar_authentication_needed', 'Authentication Needed')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowLoginPrompt(false)}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    aria-label="Close modal"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={t('ezbar_close_modal', 'Close this modal')}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M18 6 6 18"/>
                                        <path d="m6 6 12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-6 text-center">
                                <div className="w-20 h-20 mx-auto mb-4 bg-yellow-50 rounded-full flex items-center justify-center">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 8v4"/>
                                        <path d="M12 16h.01"/>
                                    </svg>
                                </div>
                                <p className="text-gray-600 mb-2">
                                    {t('ezbar_login_required_message', 'You need to be logged in to use this feature.')}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {t('ezbar_login_benefits', 'Login to create content, ask AI, upload files, add comments, and create landing pages.')}
                                </p>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <Link
                                    href="/login"
                                    className="flex-1 px-4 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={t('ezbar_login', 'Log in to your account')}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                        <polyline points="10 17 15 12 10 7"/>
                                        <line x1="15" y1="12" x2="3" y2="12"/>
                                    </svg>
                                    <span>{t('ezbar_login', 'Login')}</span>
                                </Link>
                                
                                <Link
                                    href="/register"
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={t('ezbar_create_account', 'Create a new account')}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    <span>{t('ezbar_register', 'Register')}</span>
                                </Link>
                            </div>
                            
                            <button
                                onClick={() => setShowLoginPrompt(false)}
                                className="w-full mt-3 px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={t('ezbar_maybe_later', 'Maybe Later')}
                            >
                                {t('ezbar_maybe_later', 'Maybe Later')}
                            </button>
                        </div>
                        
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
                            <p className="text-xs text-gray-500 text-center flex items-center justify-center space-x-1">
                                <span>🔒</span>
                                <span>{t('ezbar_secure_access', 'Secure access to all features requires authentication')}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Coming Soon Modal */}
            {comingSoonModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
                        <div className={`px-6 py-5 rounded-t-2xl bg-gradient-to-r ${
                            comingSoonModal.iconColor === 'purple' ? 'from-purple-500 to-purple-600' :
                            comingSoonModal.iconColor === 'blue' ? 'from-blue-500 to-blue-600' :
                            comingSoonModal.iconColor === 'green' ? 'from-green-500 to-green-600' :
                            'from-orange-500 to-orange-600'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        {comingSoonModal.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{comingSoonModal.feature}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-semibold text-white">
                                                {t('ezbar_coming_soon', 'Coming Soon')}
                                            </span>
                                            <span className="text-white/80 text-xs">• Pre-alpha</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={closeComingSoonModal}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    aria-label="Close modal"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={t('ezbar_close_modal', 'Close this modal')}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18"/>
                                        <path d="m6 6 12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('ezbar_whats_coming', '✨ What\'s coming?')}</h4>
                                <p className="text-gray-600 leading-relaxed">
                                    {comingSoonModal.description}
                                </p>
                            </div>
                            
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('ezbar_early_preview', 'Early Preview')}</h4>
                                <div className="space-y-2">
                                    {comingSoonModal.feature === 'Analytics' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Track clicks and engagement in real-time"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Real-time click tracking and analytics</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="See where your users are coming from"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Geographic heatmaps and device insights</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Generate and export custom reports"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Custom reports and exportable data</span>
                                            </div>
                                        </>
                                    )}
                                    {comingSoonModal.feature === 'Collections' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Group related conversations together"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Create and organize custom collections</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Add context to your collections"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Add notes, tags, and custom metadata</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Collaborate with your team"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Share collections with team members</span>
                                            </div>
                                        </>
                                    )}
                                    {comingSoonModal.feature === 'Bookmarks' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Save your favorite conversations"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Save and organize favorite links</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Access your bookmarks anywhere"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Cross-device synchronization</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Keep your bookmarks organized"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Folder organization and search</span>
                                            </div>
                                        </>
                                    )}
                                    {comingSoonModal.feature === 'QR Scanner' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Scan QR codes without additional apps"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Scan QR codes directly from your browser</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Create QR codes for any link"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Generate and share QR codes instantly</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Keep track of your scanned QR codes"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Scan history and quick access</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => {
                                        closeComingSoonModal();
                                    }}
                                    className={`flex-1 px-4 py-3 ${
                                        comingSoonModal.iconColor === 'purple' ? 'bg-purple-500 hover:bg-purple-600' :
                                        comingSoonModal.iconColor === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                                        comingSoonModal.iconColor === 'green' ? 'bg-green-500 hover:bg-green-600' :
                                        'bg-orange-500 hover:bg-orange-600'
                                    } text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2`}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={t('ezbar_notify_me', 'Get notified when this feature launches')}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                    </svg>
                                    <span>{t('ezbar_notify_me', 'Notify Me')}</span>
                                </button>
                                
                                <button
                                    onClick={closeComingSoonModal}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content={t('ezbar_maybe_later', 'Maybe Later')}
                                >
                                    {t('ezbar_maybe_later', 'Maybe Later')}
                                </button>
                            </div>
                        </div>
                        
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
                            <p className="text-xs text-gray-500 text-center flex items-center justify-center space-x-1">
                                <span>🚧</span>
                                <span>{t('ezbar_coming_soon_description', 'We\'re working hard to bring you this feature. Stay tuned for updates!')}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}