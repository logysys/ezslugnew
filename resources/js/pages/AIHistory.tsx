import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import type { SharedData } from '@/types';
import DraggableMenu from '@/components/DraggableMenu';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import MarkdownPreview from '@uiw/react-markdown-preview';
import EnhancedMDEditor from '@/components/EnhancedMDEditor';
import { HtmlDocPreview } from '@/components/HtmlDocPreview';
import { detectAndProcessHtml } from '@/utils/htmlHelper';
import SocialMediaComposer from '@/components/SocialMediaComposer';
import ObsidianWikiPreview from '@/components/ObsidianWikiPreview';
import WikiPreview from '@/components/WikiPreview';
import ObsidianWikiPanel from '@/components/ObsidianWikiPanel';
import SEOModal from '@/components/SEOModal';
import EmbedRowModal from '@/components/EmbedRowModal';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faGlobe, 
    faSpinner, 
    faCheckCircle, 
    faExclamationTriangle,
    faTimes,
    faStore,
    faCopy,
    faLock,
    faEyeSlash,
    faUserLock,
    faRobot,
    faUser,
    faEarth,
    faFileAlt,
    faFilePdf,
    faFileImage,
    faFileVideo,
    faFileAudio,
    faImage,
    faFilePdf as faFilePdfSolid,
    faFileWord as faFileWordSolid,
    faFileArchive,
    faFileCode,
    faFileExcel,
    faFilePowerpoint,
    faComment,
    faUpload,
    faImage as faImageIcon,
    faSave,
    faHashtag,
    faPalette,
    faSearch,
    faDollarSign,
    faEdit,
    faChartLine,
    faUsers,
    faEye,
    faChartBar,
    faMapMarkerAlt,
    faDesktop,
    faExternalLink,
    faDownload,
    faFile,
    faArrowUp,
    faArrowDown,
    faSort,
    faPlus,
    faTag,
} from '@fortawesome/free-solid-svg-icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_live_51IyCo8Dpr0bpQPac24tix9UpShzoMw1uWsW3JvzcMrKVFnvUsXAnvBknJSPYucZCYSLT4Z0UVBeKx49jlYakdjIw00coa3YVdn');

// ==================== Type Definitions ====================
interface FileData {
    id: number;
    file_path: string;
    original_name: string;
    mime_type: string;
    size: number;
    storage_path: string;
    created_at: string;
    updated_at: string;
    url?: string;
}

interface ConversationMessage {
    id: number;
    conversation_id: string;
    message_role: 'user' | 'assistant' | 'system';
    content_type: 'comment' | 'ai' | 'upload' | 'social' | 'social_media' | 'landing_page' | 'embed';
    query: string | null;
    response?: string | null;
    content?: string | null;
    status: 'public' | 'hidden' | 'private';
    slug: string;
    model?: string | null;
    total_tokens?: number;
    total_cost?: number;
    language?: string;
    file_data?: any | null;
    file_metadata?: any | null;
    file_id?: number | null;
    parent_id?: number | null;
    position?: number | null;
    created_at: string;
    updated_at: string;
    created_at_formatted: string;
    user?: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
    };
    user_id?: number | null;
    session_id?: string;
    ip_address?: string;
    social_media_metadata?: any;
    format?: string;
    media_count?: number;
    content_warning?: string;
    sources?: string[];
}

interface Conversation {
    id?: number;
    parent_id?: number | null;
    conversation_id: string;
    conversation_title: string | null;
    slug: string;
    hashtag?: string[] | string | null;
    hashtag_display?: string;
    status: 'public' | 'private' | 'hidden';
    thinking_enabled: boolean;
    model: string | null;
    temperature: number | null;
    language: string | null;
    user_id: number | null;
    user_email: string | null;
    query: string;
    response_preview: string;
    message_count: number;
    conversation_cost: number | null;
    created_at: string;
    updated_at: string;
    created_at_formatted: string;
    pinned?: boolean;
    private_access_number?: string | null;
    private_access_limit?: number | null;
    private_views_count?: number;
    landing_page_url?: string | null;
    ezFunnelToken?: string | null;
    ezFunnelId?: string | null;
    social_media_metadata?: any;
    customDomains?: Array<{
        id: number;
        domain: string;
        domainselected: string;
        hashtag: string | null;
        expire: string | null;
        sells?: Array<{
            id: number;
            price: number;
            created_at: string;
        }>;
    }>;
    handleDomains?: Array<{
        id: number;
        domain: string;
        domainselected: string;
        hashtag: string | null;
        expire: string | null;
        sells?: Array<{
            id: number;
            price: number;
            created_at: string;
        }>;
    }>;
}

interface PaginatedResponse {
    success: boolean;
    data: Conversation[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface ConversationMessagesResponse {
    success: boolean;
    messages: ConversationMessage[];
    conversation?: Conversation;
}

interface EditFormData {
    conversation: Conversation | null;
    title: string;
    slug: string;
    status: 'public' | 'private';
    thinking_enabled: boolean;
    model: string;
    temperature: number;
    language: string;
    messages: ConversationMessage[];
}

interface ComingSoonModalState {
    isOpen: boolean;
    feature: string;
    description: string;
    iconColor: string;
    icon: JSX.Element | null;
}

interface BuyDomainModalState {
    isOpen: boolean;
    conversation: Conversation | null;
    domain: string;
    isChecking: boolean;
    isAvailable: boolean | null;
    error: string;
}

interface AIHistoryProps {
    conversations: any;
    totalConversations: number;
    currentPage: number;
    lastPage: number;
    perPage: number;
    auth?: { user: any };
    tooltips?: Record<string, string>;
    domains?: Domain[];
}

interface Domain {
    id: number;
    domain: string;
}

interface UploadedFile {
    name: string;
    size: number;
    type: string;
    data: string;
    file?: File;
}

interface EmailLog {
    id: number;
    email: string;
    access_number: string;
    accessed_at: string | null;
    accessed_at_formatted: string | null;
    ip_address: string | null;
    user_agent: string | null;
    is_used: boolean;
    created_at: string;
    created_at_formatted: string;
}

interface PriceEditModalState {
    isOpen: boolean;
    domainId: number | null;
    domainType: 'CUSTOM' | 'DOMAIN' | null;
    currentPrice: number;
    domainDisplay: string;
    domainUrl: string;
    funnelId: number;
    funnelToken: string;
}

// ==================== Constants ====================
const LANGUAGE_LABELS: Record<string, string> = {
    en: 'English',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    ar: 'العربية',
};

const SORT_OPTIONS = [
    { value: 'recent', label: 'Most recent' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'most-messages', label: 'Most messages' },
    { value: 'highest-cost', label: 'Highest cost' },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['value'];

const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
    'application/pdf',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav'
];

const ALLOWED_FILE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    '.pdf',
    '.mp4', '.webm', '.ogg', '.mov', '.avi',
    '.mp3', '.wav', '.ogg', '.m4a'
];

// ==================== Utility Functions ====================
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatCost = (cost: number | undefined | null): string => {
    if (cost === undefined || cost === null) return '0.0000';
    const numCost = Number(cost);
    return isNaN(numCost) ? '0.0000' : numCost.toFixed(4);
};

const getLanguageLabel = (lang: string): string => LANGUAGE_LABELS[lang] || lang;

const stripHtmlTags = (html: string): string => {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

const decodeHtmlEntities = (text: string): string => {
    if (!text) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

// ==================== FIXED: getMessageFormat with improved HTML detection ====================
const getMessageFormat = (message: any): 'markdown' | 'html' => {
    if (!message) return 'markdown';
    
    let meta = message.social_media_metadata;
    if (typeof meta === 'string') {
        try { meta = JSON.parse(meta); } catch {}
    }
    if (meta?.format === 'html') return 'html';
    if (meta?.format === 'markdown') return 'markdown';
    if (message.format === 'html') return 'html';
    if (message.format === 'markdown') return 'markdown';
    
    // Improved HTML detection
    const query = (message.query || message.response || '').trim();
    if (!query) return 'markdown';
    
    // Check for common HTML patterns
    const htmlPatterns = [
        /^<!doctype html>/i,
        /^<html/i,
        /<iframe/i,
        /^<div[^>]*class=/i,
        /^<h[1-6]/i,
        /^<p[^>]*>/i,
        /<style[^>]*>/i,
        /<script[^>]*>/i,
        /<link[^>]*>/i,
        /<meta[^>]*>/i,
        /<img[^>]*>/i,
        /<a[^>]*>/i,
        /<ul[^>]*>/i,
        /<ol[^>]*>/i,
        /<li[^>]*>/i,
        /<span[^>]*>/i,
        /<section[^>]*>/i,
        /<article[^>]*>/i,
        /<header[^>]*>/i,
        /<footer[^>]*>/i,
        /<nav[^>]*>/i,
        /<main[^>]*>/i,
        /<aside[^>]*>/i,
        /<figure[^>]*>/i,
        /<figcaption[^>]*>/i,
        /<blockquote[^>]*>/i,
        /<pre[^>]*>/i,
        /<code[^>]*>/i,
        /<table[^>]*>/i,
        /<thead[^>]*>/i,
        /<tbody[^>]*>/i,
        /<tr[^>]*>/i,
        /<td[^>]*>/i,
        /<th[^>]*>/i,
        /<form[^>]*>/i,
        /<input[^>]*>/i,
        /<button[^>]*>/i,
        /<select[^>]*>/i,
        /<textarea[^>]*>/i,
        /<label[^>]*>/i,
        /<fieldset[^>]*>/i,
        /<legend[^>]*>/i,
        /<datalist[^>]*>/i,
        /<output[^>]*>/i,
        /<option[^>]*>/i,
        /<optgroup[^>]*>/i,
        /<details[^>]*>/i,
        /<summary[^>]*>/i,
        /<dialog[^>]*>/i,
        /<menu[^>]*>/i,
        /<menuitem[^>]*>/i,
        /<address[^>]*>/i,
        /<hr[^>]*>/i,
        /<br[^>]*>/i,
        /<wbr[^>]*>/i,
        /<b[^>]*>/i,
        /<strong[^>]*>/i,
        /<i[^>]*>/i,
        /<em[^>]*>/i,
        /<u[^>]*>/i,
        /<s[^>]*>/i,
        /<strike[^>]*>/i,
        /<del[^>]*>/i,
        /<ins[^>]*>/i,
        /<mark[^>]*>/i,
        /<small[^>]*>/i,
        /<sub[^>]*>/i,
        /<sup[^>]*>/i,
        /<time[^>]*>/i,
        /<progress[^>]*>/i,
        /<meter[^>]*>/i,
        /<canvas[^>]*>/i,
        /<svg[^>]*>/i,
        /<math[^>]*>/i,
    ];
    
    // Check if content looks like HTML
    const looksLikeHtml = htmlPatterns.some(pattern => pattern.test(query));
    if (looksLikeHtml) {
        return 'html';
    }
    
    return 'markdown';
};

const extractTextFromSocialMessage = (html: string, format: 'markdown' | 'html' = 'markdown'): string => {
    if (!html) return '';
    
    if (format === 'html') {
        if (typeof document === 'undefined') return html;
        const div = document.createElement('div');
        div.innerHTML = html;
        
        const mediaGallery = div.querySelector('.social-media-gallery');
        if (mediaGallery) mediaGallery.remove();
        
        const warning = div.querySelector('.social-content-warning');
        if (warning) {
            const innerDiv = warning.querySelector('details > div');
            if (innerDiv) {
                const textDiv = innerDiv.querySelector('.social-content-text');
                if (textDiv) {
                    return textDiv.innerHTML || '';
                }
                return innerDiv.innerHTML || '';
            }
        }
        
        const contentText = div.querySelector('.social-content-text');
        if (contentText) {
            return contentText.innerHTML || '';
        }
        
        if (!mediaGallery && !warning && !contentText) {
            return html;
        }
        
        return div.innerHTML || html;
    }
    
    if (typeof document === 'undefined') return html;
    const div = document.createElement('div');
    div.innerHTML = html;
    
    const mediaGallery = div.querySelector('.social-media-gallery');
    if (mediaGallery) mediaGallery.remove();
    
    const warningDetails = div.querySelector('.social-content-warning details');
    if (warningDetails) {
        const innerDiv = warningDetails.querySelector('div');
        if (innerDiv) {
            const textDiv = innerDiv.querySelector('.social-content-text');
            if (textDiv) {
                return textDiv.innerHTML
                    .replace(/<br\s*[\/]?>/gi, '\n')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
            }
            return innerDiv.innerText || '';
        }
    }
    
    const contentText = div.querySelector('.social-content-text');
    if (contentText) {
        return contentText.innerHTML
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }
    
    if (!mediaGallery && !div.querySelector('.social-content-warning') && !contentText) {
        return html;
    }
    
    return div.innerText || html;
};

const extractMediaFromSocialMessage = (html: string, fileData: any): string[] => {
    const mediaUrls: string[] = [];
    
    if (fileData && fileData.files && Array.isArray(fileData.files)) {
        return fileData.files.map((file: any) => file.url);
    }
    
    const decodedHtml = decodeHtmlEntities(html);
    const div = document.createElement('div');
    div.innerHTML = decodedHtml;
    
    const images = div.querySelectorAll('.social-media-gallery img');
    images.forEach(img => {
        const src = img.getAttribute('src');
        if (src) mediaUrls.push(src);
    });
    
    return mediaUrls;
};

const extractCWFromSocialMessage = (html: string): string | null => {
    if (!html) return null;
    
    const decodedHtml = decodeHtmlEntities(html);
    const div = document.createElement('div');
    div.innerHTML = decodedHtml;
    
    const warningSpan = div.querySelector('.social-content-warning span');
    if (warningSpan) {
        const text = warningSpan.innerText;
        const match = text.match(/Content Warning:\s*(.+)/i);
        if (match) return match[1];
    }
    
    return null;
};

const escapeHtml = (text: string): string => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const buildMediaGalleryHtml = (mediaFiles: string[]): string => {
    if (!mediaFiles || mediaFiles.length === 0) return '';
    
    const count = mediaFiles.length;
    let gridStyle = 'display: grid; gap: 4px; border-radius: 16px; overflow: hidden;';
    if (count === 1) gridStyle += ' grid-template-columns: 1fr;';
    else if (count === 2) gridStyle += ' grid-template-columns: 1fr 1fr;';
    else if (count === 3) gridStyle += ' grid-template-columns: 1fr 1fr; grid-template-rows: auto auto;';
    else gridStyle += ' grid-template-columns: 1fr 1fr; grid-template-rows: auto auto;';
    
    let html = `<div class="social-media-gallery" style="margin-bottom: 16px;"><div style="${gridStyle}">`;
    
    mediaFiles.forEach((url, index) => {
        const isFirstLarge = (index === 0 && count === 3);
        html += `<div style="position: relative; background-color: #1f2937; overflow: hidden; ${isFirstLarge ? 'grid-row: span 2;' : ''}">`;
        html += `<img src="${escapeHtml(url)}" alt="Media ${index + 1}" style="width: 100%; height: 100%; object-fit: cover; aspect-ratio: 1/1;" loading="lazy">`;
        html += `</div>`;
    });
    
    html += `</div></div>`;
    return html;
};

// ==================== File Preview Utility Functions ====================
const getFileIcon = (mimeType: string, extension: string) => {
    if (mimeType?.startsWith('image/')) {
        return faImage;
    } else if (mimeType === 'application/pdf') {
        return faFilePdfSolid;
    } else if (mimeType?.includes('word') || extension?.match(/doc|docx/)) {
        return faFileWordSolid;
    } else if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet') || extension?.match(/xls|xlsx|csv/)) {
        return faFileExcel;
    } else if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation') || extension?.match(/ppt|pptx/)) {
        return faFilePowerpoint;
    } else if (mimeType?.includes('video/')) {
        return faFileVideo;
    } else if (mimeType?.includes('audio/')) {
        return faFileAudio;
    } else if (mimeType?.includes('zip') || mimeType?.includes('compressed') || extension?.match(/zip|rar|7z|tar|gz/)) {
        return faFileArchive;
    } else if (mimeType?.includes('json') || mimeType?.includes('xml') || mimeType?.includes('html') || mimeType?.includes('javascript') || extension?.match(/js|ts|py|java|cpp|php/)) {
        return faFileCode;
    } else {
        return faFile;
    }
};

// ==================== File Upload Render Function ====================
const renderFileUpload = (fileData: any) => {
    if (!fileData) return null;
    
    const isImage = fileData.mime_type?.startsWith('image/');
    const isVideo = fileData.mime_type?.startsWith('video/');
    const isAudio = fileData.mime_type?.startsWith('audio/');
    const isPdf = fileData.mime_type === 'application/pdf';
    const isHtml = fileData.mime_type === 'text/html' || fileData.extension === 'html' || fileData.extension === 'htm';
    
    const fileUrl = fileData.url || fileData.storage_path || '';
    
    if (isVideo) {
        return (
            <div className="w-full break-words">
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-300">🎬 {fileData.original_name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(fileData.size)})</span>
                </div>
                <div className="flex justify-center w-full bg-black/5 rounded-lg overflow-hidden">
                    <video 
                        src={fileUrl} 
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
                        href={fileUrl} 
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
                    <span className="text-sm font-medium text-gray-300">🎵 {fileData.original_name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(fileData.size)})</span>
                </div>
                <div className="flex justify-center w-full bg-black/5 rounded-lg p-4">
                    <audio 
                        src={fileUrl} 
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
                        href={fileUrl} 
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
        const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
        return (
            <div className="w-full break-words">
                <div className="flex gap-3 mb-3 flex-wrap">
                    <a 
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                        <FontAwesomeIcon icon={faExternalLink} />
                        Open PDF in New Tab
                    </a>
                    <a 
                        href={fileUrl}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                        Download PDF
                    </a>
                </div>
                <iframe
                    src={googleViewerUrl}
                    className="w-full h-[600px] rounded-lg border border-gray-700"
                    title={fileData.original_name}
                    style={{ backgroundColor: '#1f2937' }}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                />
            </div>
        );
    }
    
    if (isHtml) {
        return (
            <div className="w-full break-words">
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-300">📄 {fileData.original_name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(fileData.size)})</span>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <iframe 
                        src={fileUrl} 
                        className="w-full h-[500px] rounded-lg border border-gray-700" 
                        title={fileData.original_name}
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                    />
                </div>
                <div className="mt-3 text-center">
                    <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                        <FontAwesomeIcon icon={faExternalLink} />
                        Open HTML in new tab
                    </a>
                </div>
            </div>
        );
    }
    
    if (isImage) {
        return (
            <div className="w-full break-words">
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-300">🖼️ {fileData.original_name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(fileData.size)})</span>
                </div>
                <div className="flex justify-center w-full bg-black/5 rounded-lg overflow-hidden">
                    <img 
                        src={fileUrl} 
                        alt={fileData.original_name}
                        className="max-w-full max-h-[500px] object-contain rounded-lg"
                        loading="lazy"
                        onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'text-center text-gray-400 p-8';
                                fallback.innerHTML = `
                                    <svg class="w-16 h-16 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p>Image failed to load</p>
                                    <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline text-sm">Open image in new tab</a>
                                `;
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                </div>
                <div className="mt-3 text-center">
                    <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                        <FontAwesomeIcon icon={faExternalLink} />
                        Open image in new tab
                    </a>
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-full break-words">
            <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={getFileIcon(fileData.mime_type, fileData.extension || '')} className="text-white text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{fileData.original_name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(fileData.size)} • {fileData.mime_type}</p>
                </div>
                <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs flex items-center gap-1"
                >
                    <FontAwesomeIcon icon={faExternalLink} />
                    Open
                </a>
            </div>
        </div>
    );
};

// ==================== Custom Alert Component ====================
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
        success: 'bg-green-500/20 border-green-500/30 text-green-400',
        error: 'bg-red-500/20 border-red-500/30 text-red-400',
        info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
        warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    };

    const icons = {
        success: (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    };

    return (
        <div className={`fixed top-20 right-4 z-[200] p-4 rounded-xl border ${styles[type]} bg-gray-800/90 backdrop-blur-sm shadow-2xl max-w-md animate-slide-left`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="flex-1 text-sm font-medium break-words">{message}</div>
                <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// ==================== Subcomponents ====================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    return (
        <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border border-yellow-400/30">
            <span className="truncate">{status === 'public' ? 'Public' : status === 'private' ? 'Private' : 'Hidden'}</span>
        </span>
    );
};

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-yellow-400">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

// Stripe Checkout Form Component
const StripeCheckoutForm = ({
    price,
    clientSecret,
    onSuccess,
    onBack,
    onError,
    tooltips,
    email
}: {
    price: number;
    clientSecret: string;
    onSuccess: () => void;
    onBack: () => void;
    onError: (message: string) => void;
    tooltips?: Record<string, string>;
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
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span data-tooltip-id="main-tooltip" data-tooltip-content={tooltips?.ai_search_view_error_notification || "Error notification"}>
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
                    data-tooltip-content={tooltips?.ai_search_view_cancel || "Go back"}
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

const checkIsObsidianVault = (message: ConversationMessage) => {
    return Boolean(
        message.social_media_metadata?.is_obsidian_vault ||
        (message.sources && message.sources.includes('obsidian_wiki')) ||
        (message.query && message.query.includes('Obsidian Wiki Vault')) ||
        (message.response && message.response.includes('Obsidian Vault'))
    );
};

const checkIsWiki = (message: ConversationMessage) => {
    return Boolean(
        message.social_media_metadata?.is_wiki ||
        (message.sources && message.sources.includes('wiki')) ||
        (message.response && message.response.includes('Wiki saved'))
    );
};

// ==================== Message Item Component ====================
const MessageItem: React.FC<{
    message: ConversationMessage;
    isOwner: boolean;
    onEdit: (message: ConversationMessage) => void;
    onEditSocial: (message: ConversationMessage) => void;
    onEditObsidian: (message: ConversationMessage) => void;
    onEditEmbed: (message: ConversationMessage) => void;
    onDeleteClick: (message: ConversationMessage) => void;
    onToggleStatus: (message: ConversationMessage) => void;
    isUpdating?: boolean;
    index?: number;
    total?: number;
    onMoveUp?: (index: number) => void;
    onMoveDown?: (index: number) => void;
}> = ({ 
    message, 
    isOwner, 
    onEdit, 
    onEditSocial, 
    onEditObsidian,
    onEditEmbed,
    onDeleteClick, 
    onToggleStatus, 
    isUpdating,
    index = 0,
    total = 1,
    onMoveUp,
    onMoveDown
}) => {
    const isObsidianVault = checkIsObsidianVault(message);
    const isWikiNote = checkIsWiki(message);

    const getMessagePreview = () => {
        if (message.content_type === 'upload') {
            return `[File] ${message.file_data?.original_name || message.query}`;
        } else if (message.content_type === 'comment') {
            return message.query || message.content || message.response || '';
        } else if (message.content_type === 'embed') {
            return message.query || '';
        } else if (message.content_type === 'ai') {
            return message.response || message.query || '';
        } else if (message.content_type === 'social' || message.content_type === 'social_media') {
            return message.query || '';
        } else if (message.message_role === 'user') {
            return message.query || '';
        } else {
            return message.response || message.query || '';
        }
    };

    const getRoleBadge = () => {
        if (message.message_role === 'user') {
            return <span className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-full">User</span>;
        } else if (message.message_role === 'assistant') {
            return <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">Assistant</span>;
        }
        return null;
    };

    const getContentTypeBadge = () => {
        if (isWikiNote) {
            return <span className="text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-semibold rounded-full border border-emerald-500/30">Wiki Note</span>;
        } else if (isObsidianVault) {
            return <span className="text-xs px-2.5 py-0.5 bg-purple-500/20 text-purple-400 font-semibold rounded-full border border-purple-500/30">Obsidian Wiki</span>;
        } else if (message.content_type === 'upload') {
            return <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">Upload</span>;
        } else if (message.content_type === 'embed') {
            return <span className="text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-semibold rounded-full border border-emerald-500/30">Embed</span>;
        } else if (message.content_type === 'comment') {
            return <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full">Comment</span>;
        } else if (message.content_type === 'ai') {
            return <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">AI</span>;
        } else if (message.content_type === 'social' || message.content_type === 'social_media') {
            let meta = message.social_media_metadata;
            if (typeof meta === 'string') {
                try { meta = JSON.parse(meta); } catch {}
            }
            const isHtml = meta?.format === 'html';
            const isMarkdown = meta?.format === 'markdown';
            return (
                <span className={`text-xs px-2.5 py-0.5 font-semibold rounded-full border ${
                    isHtml
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : isMarkdown
                        ? 'bg-pink-500/20 text-pink-400 border-pink-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                    {isHtml ? '🌐 Social HTML' : isMarkdown ? '📝 Social' : '💬 Social'}
                </span>
            );
        }
        return null;
    };

    const handleEditClick = () => {
        const ct = (message.content_type || '').toLowerCase();
        if (isWikiNote || isObsidianVault) {
            onEditObsidian(message);
        } else if (ct === 'social' || ct === 'social_media') {
            onEditSocial(message);
        } else if (ct === 'embed') {
            onEditEmbed(message);
        } else {
            onEdit(message);
        }
    };

    const isSocialContent = message.content_type === 'social' || message.content_type === 'social_media';
    const isUploadContent = message.content_type === 'upload';
    const isCommentContent = message.content_type === 'comment';

    const renderMessageContent = () => {
        if (isWikiNote) {
            return (
                <WikiPreview 
                    query={message.query || message.response || ''} 
                    fileData={Array.isArray(message.file_data) ? message.file_data : []}
                    socialMediaMetadata={message.social_media_metadata}
                    created_at={message.created_at_formatted}
                />
            );
        }
        
        if (isObsidianVault) {
            return (
                <ObsidianWikiPreview 
                    query={message.query || message.response || ''} 
                    fileData={Array.isArray(message.file_data) ? message.file_data : []}
                    socialMediaMetadata={message.social_media_metadata}
                    created_at={message.created_at_formatted}
                />
            );
        }
        
        if (message.content_type === 'embed') {
            return (
                <div className="w-full mt-2">
                    <HtmlDocPreview 
                        content={message.query || ''} 
                        title="Embed Row / Masonry Layout" 
                        filename="embed.html" 
                    />
                </div>
            );
        }
        
        if (isUploadContent && message.file_data) {
            return renderFileUpload(message.file_data);
        }
        
        if (isCommentContent) {
            const content = message.query || message.content || message.response || '';
            if (!content || !content.trim()) {
                return <span className="text-gray-500 italic text-sm">Empty comment</span>;
            }
            const processed = detectAndProcessHtml(content);
            if (processed.isHtml) {
                return (
                    <div className="break-words w-full">
                        <HtmlDocPreview content={content} title="HTML Preview" filename="preview.html" />
                    </div>
                );
            }
            return (
                <MarkdownPreview 
                    source={content}
                    wrapperElement={{
                        "data-color-mode": "dark"
                    }}
                    className="!bg-transparent !font-sans prose prose-sm max-w-none prose-invert"
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    remarkPlugins={[remarkGfm]}
                />
            );
        }
        
        if (isSocialContent) {
            const format = getMessageFormat(message);
            const rawContent = message.query || message.response || '';
            const processed = detectAndProcessHtml(rawContent);
            
            let meta = message.social_media_metadata;
            if (typeof meta === 'string') {
                try { meta = JSON.parse(meta); } catch {}
            }
            
            if (meta?.format === 'html') {
                const htmlContent = rawContent;
                return (
                    <div className="w-full mt-2">
                        <HtmlDocPreview 
                            content={htmlContent} 
                            title="Social HTML Post Preview" 
                            filename="post.html" 
                        />
                    </div>
                );
            }
            
            return (
                <MarkdownPreview 
                    source={getMessagePreview() || ''} 
                    wrapperElement={{
                        "data-color-mode": "dark"
                    }}
                    className="!bg-transparent !font-sans prose prose-sm max-w-none prose-invert"
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    remarkPlugins={[remarkGfm]}
                />
            );
        }
        
        return (
            <MarkdownPreview 
                source={getMessagePreview()} 
                wrapperElement={{
                    "data-color-mode": "dark"
                }}
                className="!bg-transparent !font-sans prose prose-sm max-w-none prose-invert"
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                remarkPlugins={[remarkGfm]}
            />
        );
    };

    return (
        <div className={`border rounded-lg p-3 hover:border-yellow-400/50 transition-all ${
            message.status === 'hidden' ? 'bg-red-500/10 border-red-500/30 opacity-75' : 'border-gray-700 bg-gray-800/30'
        }`}>
            <div className="flex items-start gap-2">
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-1">
                    <button
                        onClick={() => onMoveUp && onMoveUp(index)}
                        disabled={index === 0 || !onMoveUp}
                        className="text-gray-500 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed p-0.5 hover:bg-yellow-400/20 rounded transition"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content="Move message up"
                    >
                        <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
                    </button>
                    <span className="text-[10px] text-gray-500 font-mono">{index + 1}</span>
                    <button
                        onClick={() => onMoveDown && onMoveDown(index)}
                        disabled={index === total - 1 || !onMoveUp}
                        className="text-gray-500 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed p-0.5 hover:bg-yellow-400/20 rounded transition"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content="Move message down"
                    >
                        <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
                    </button>
                </div>

                <div className="flex-1 min-w-0 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getRoleBadge()}
                        {getContentTypeBadge()}
                        <StatusBadge status={message.status} />
                        <span className="text-xs text-gray-500">{message.created_at_formatted}</span>
                    </div>
                    
                    <div className="text-sm text-gray-300 break-words mt-1">
                        {renderMessageContent()}
                    </div>

                    {message.total_tokens !== undefined && message.total_tokens !== null && Number(message.total_tokens) > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                            Tokens: {message.total_tokens} | Cost: ${((Number(message.total_tokens) / 1000) * 0.01).toFixed(4)}
                        </div>
                    )}

                    {message.content_type === 'upload' && message.file_data && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                                {message.file_data.mime_type}
                            </span>
                            <span className="text-gray-500">
                                {formatFileSize(message.file_data.size)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                        onClick={handleEditClick}
                        disabled={isUpdating}
                        className="p-1.5 hover:bg-yellow-500/20 rounded-lg transition-colors text-gray-400 hover:text-yellow-400"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={isObsidianVault ? "Edit Obsidian Vault" : isWikiNote ? "Edit Wiki Note" : message.content_type === 'embed' ? "Edit Embed Content" : "Edit message"}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                    </button>
                    
                    <button
                        onClick={() => onToggleStatus(message)}
                        disabled={isUpdating}
                        className={`p-1.5 rounded-lg transition-colors ${
                            message.status === 'hidden'
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 border border-gray-600'
                        }`}
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content={message.status === 'hidden' ? 'Unhide message' : 'Hide message'}
                    >
                        {message.status === 'hidden' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                            </svg>
                        )}
                    </button>
                    
                    <button
                        onClick={() => onDeleteClick(message)}
                        disabled={isUpdating}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content="Delete message"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== Message Edit Modal Component ====================
const MessageEditModal: React.FC<{
    message: ConversationMessage | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (message: ConversationMessage, content: string) => Promise<void>;
    onOpenEmbed?: (message: ConversationMessage) => void;
    isSaving?: boolean;
}> = ({ message, isOpen, onClose, onSave, onOpenEmbed, isSaving = false }) => {
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [isReplacingFile, setIsReplacingFile] = useState(false);
    const [newFile, setNewFile] = useState<File | null>(null);
    const [fileReplaceError, setFileReplaceError] = useState('');
    const [isLocalSaving, setIsLocalSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSavingState = isSaving || isLocalSaving;

    useEffect(() => {
        if (message) {
            if (message.content_type === 'upload') {
                setContent(message.file_data?.original_name || message.query || '');
            } else if (message.content_type === 'ai') {
                setContent(message.response || message.query || '');
            } else if (message.content_type === 'comment') {
                setContent(message.query || message.content || message.response || '');
            } else {
                setContent(message.query || '');
            }
            setError('');
            setNewFile(null);
            setIsReplacingFile(false);
            setFileReplaceError('');
        }
    }, [message]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setFileReplaceError('');
        
        if (file.size > 100 * 1024 * 1024) {
            setFileReplaceError('File size must be less than 100MB');
            return;
        }
        
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setFileReplaceError('File type not allowed. Only images, PDF, video, and audio files are permitted.');
            return;
        }
        
        setNewFile(file);
    };

    const handleSave = async () => {
        if (!message) return;

        if (message.content_type === 'upload') {
            if (!content.trim() && !newFile) {
                setError('Either description or file must be provided');
                return;
            }
        } else {
            if (!content.trim()) {
                setError('Content cannot be empty');
                return;
            }
        }

        try {
            setIsLocalSaving(true);
            if (message.content_type === 'upload' && newFile) {
                const formData = new FormData();
                formData.append('message_slug', message.slug);
                formData.append('description', content);
                formData.append('file', newFile);

                const response = await axios.post('/content/update-upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });

                if (response.data.success) {
                    await onSave(message, content);
                    onClose();
                }
            } else {
                await onSave(message, content);
                onClose();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update message');
        } finally {
            setIsLocalSaving(false);
        }
    };

    if (!isOpen || !message) return null;

    const getModalTitle = () => {
        if (message.content_type === 'upload') return 'Edit File Upload';
        if (message.content_type === 'comment') return 'Edit Comment';
        if (message.content_type === 'ai') return 'Edit AI Response';
        if (message.content_type === 'embed') return 'Edit Embed Content';
        return 'Edit Message';
    };

    // For embed messages, offer direct opening of EmbedRowModal
    if ((message.content_type || '').toLowerCase() === 'embed') {
        return createPortal(
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full">
                    <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Edit Embed Content</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                            </svg>
                        </div>
                        <p className="text-gray-200 text-base font-medium mb-2">
                            Edit in <span className="text-emerald-400 font-semibold">Embed Row & Masonry Builder</span>
                        </p>
                        <p className="text-gray-400 text-sm max-w-md mx-auto mb-5">
                            Customize your embed slots, masonry grid layout, aspect ratios, and visual styling in the visual builder.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            {onOpenEmbed && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const targetMessage = message;
                                        onClose();
                                        onOpenEmbed(targetMessage);
                                    }}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    <span>Open in Embed Builder</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                    <h3 className="text-lg font-semibold text-white">
                        {getModalTitle()}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        disabled={isSavingState}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {message.content_type === 'upload' ? (
                        <div className="space-y-4">
                            {message.file_data && !newFile && (
                                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                                            {message.file_data.mime_type.startsWith('image/') ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="2" width="20" height="20" rx="2.18"/>
                                                    <path d="m7 2 10 20M7 22 17 2"/>
                                                </svg>
                                            ) : message.file_data.mime_type === 'application/pdf' ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                    <polyline points="14 2 14 8 20 8"/>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                    <polyline points="14 2 14 8 20 8"/>
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {message.file_data.original_name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatFileSize(message.file_data.size)} • {message.file_data.mime_type}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!newFile && (
                                <button
                                    onClick={() => setIsReplacingFile(true)}
                                    className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                                    disabled={isSavingState}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    <span>Replace file</span>
                                </button>
                            )}

                            {(isReplacingFile || newFile) && (
                                <div className="space-y-4">
                                    {!newFile ? (
                                        <div
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                                            onClick={() => !isSavingState && fileInputRef.current?.click()}
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.5861.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm text-gray-400">
                                                    <span className="font-semibold text-yellow-400">Click to upload</span> or drag & drop
                                                </p>
                                                <p className="text-xs text-gray-500">Images, PDF, Video, Audio files up to 100MB</p>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf,video/*,audio/*,.mp4,.webm,.ogg,.mp3,.wav,.mov,.avi"
                                                onChange={handleFileChange}
                                                disabled={isSavingState}
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                {newFile.type.startsWith('image/') ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                        <rect x="2" y="2" width="20" height="20" rx="2.18"/>
                                                        <path d="m7 2 10 20M7 22 17 2"/>
                                                    </svg>
                                                ) : newFile.type === 'application/pdf' ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                        <polyline points="14 2 14 8 20 8"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                        <polyline points="14 2 14 8 20 8"/>
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{newFile.name}</p>
                                                <p className="text-xs text-gray-400">{formatFileSize(newFile.size)}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setNewFile(null);
                                                    setIsReplacingFile(false);
                                                }}
                                                className="p-1 hover:bg-gray-600 rounded-full transition-colors text-gray-400 hover:text-white"
                                                disabled={isSavingState}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6L6 18M6 6l12 12"/>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    File Description
                                </label>
                                <input
                                    type="text"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Enter file description"
                                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 bg-gray-700/50 text-white placeholder-gray-400"
                                    disabled={isSavingState}
                                />
                            </div>

                            {fileReplaceError && (
                                <p className="text-sm text-red-400">{fileReplaceError}</p>
                            )}
                        </div>
                    ) : (
                        <EnhancedMDEditor
                            value={content}
                            onChange={(value) => setContent(value || '')}
                            placeholder={`Edit your ${message.content_type === 'ai' ? 'AI response' : 'message'}... (Markdown supported)`}
                            minHeight={300}
                        />
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSave}
                            disabled={isSavingState}
                            className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSavingState ? (
                                <>
                                    <LoadingSpinner size={16} />
                                    <span>updating.......</span>
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isSavingState}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ==================== EZ Logo Modal Component ====================
interface EzLogoModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation;
    auth: any;
}

const EzLogoModal: React.FC<EzLogoModalProps> = ({ isOpen, onClose, conversation, auth }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [funnelData, setFunnelData] = useState<{
        id: number;
        token: string;
        logoimage?: string;
        fly_sign_logo?: string;
        favicon_logo?: string;
        meta_logo?: string;
        secondary_logo?: string;
        logo_settings?: {
            fly_sign_logo: string;
            favicon_logo: string;
            meta_logo: string;
            secondary_logo: string;
        };
    } | null>(null);
    const [error, setError] = useState('');

    const [selectedFunnel, setSelectedFunnel] = useState<null | {
        id: number;
        token: string;
    }>(null);
    
    const [logoData, setLogoData] = useState<{
        flySignLogo: string;
        faviconLogo: string;
        metaLogo: string;
        secondaryLogo: string;
    }>({
        flySignLogo: '',
        faviconLogo: '',
        metaLogo: '',
        secondaryLogo: ''
    });

    const [logoOptions, setLogoOptions] = useState({
        flySign: false,
        favicon: false,
        metaLogo: false,
        secondaryLogo: false
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('No file chosen');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && conversation) {
            fetchFunnelData();
        }
    }, [isOpen, conversation]);

    const fetchFunnelData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const funnelId = conversation.ezFunnelId;
            const funnelToken = conversation.ezFunnelToken;

            if (!funnelId && !funnelToken) {
                setError('No funnel associated with this conversation');
                setIsLoading(false);
                return;
            }

            let endpoint = '';
            if (funnelId) {
                endpoint = `/get-funnel-logo/${funnelId}`;
            } else if (funnelToken) {
                endpoint = `/get-funnel-by-token/${funnelToken}`;
            }

            const response = await axios.get(endpoint);
            
            if (response.data) {
                const funnelData = response.data.data || response.data.funnel || response.data;
                console.log('Funnel data received:', funnelData);
                
                setFunnelData(funnelData);
                setSelectedFunnel({
                    id: funnelId || funnelData.id,
                    token: funnelToken || funnelData.token
                });

                const logoImage = funnelData.logoimage || funnelData.logoImage || funnelData.logo || '';
                const flySignLogo = funnelData.fly_sign_logo || funnelData.flySignLogo || '';
                const faviconLogo = funnelData.favicon_logo || funnelData.faviconLogo || '';
                const metaLogo = funnelData.meta_logo || funnelData.metaLogo || '';
                const secondaryLogo = funnelData.secondary_logo || funnelData.secondaryLogo || '';
                
                setLogoData({
                    flySignLogo: flySignLogo,
                    faviconLogo: faviconLogo,
                    metaLogo: metaLogo,
                    secondaryLogo: secondaryLogo
                });
                
                setLogoOptions({
                    flySign: flySignLogo === '1' || flySignLogo === 1 || (flySignLogo && flySignLogo !== '0' && flySignLogo !== 0 && flySignLogo !== ''),
                    favicon: faviconLogo === '1' || faviconLogo === 1 || (faviconLogo && faviconLogo !== '0' && faviconLogo !== 0 && faviconLogo !== ''),
                    metaLogo: metaLogo === '1' || metaLogo === 1 || (metaLogo && metaLogo !== '0' && metaLogo !== 0 && metaLogo !== ''),
                    secondaryLogo: secondaryLogo === '1' || secondaryLogo === 1 || (secondaryLogo && secondaryLogo !== '0' && secondaryLogo !== 0 && secondaryLogo !== '')
                });
                
                if (logoImage) {
                    let fullLogoUrl = logoImage;
                    if (!logoImage.startsWith('http://') && !logoImage.startsWith('https://')) {
                        const baseUrl = window.location.origin;
                        fullLogoUrl = `${baseUrl}/${logoImage}`;
                        
                    }
                    console.log('Setting preview URL to:', fullLogoUrl);
                    setPreviewUrl(fullLogoUrl);
                }
            }
        } catch (error) {
            console.error('Failed to fetch funnel data:', error);
            setError('Could not load funnel data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setFileName(file.name);
            
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedFunnel || !selectedFunnel.id) {
            setErrorMessage('No funnel selected. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }
        
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('funnelId', selectedFunnel.id.toString());
            formData.append('flySign', logoOptions.flySign ? '1' : '0');
            formData.append('favicon', logoOptions.favicon ? '1' : '0');
            formData.append('metaLogo', logoOptions.metaLogo ? '1' : '0');
            formData.append('secondaryLogo', logoOptions.secondaryLogo ? '1' : '0');
            
            if (selectedFile) {
                formData.append('logoImage', selectedFile);
            }
        
            const response = await axios.post('/update-funnel-logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            
            setSuccessMessage('Logo settings updated successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
            if (response.data.logo) {
                const newFlySign = response.data.logo.fly_sign_logo || '';
                const newFavicon = response.data.logo.favicon_logo || '';
                const newMeta = response.data.logo.meta_logo || '';
                const newSecondary = response.data.logo.secondary_logo || '';
                const newLogoImage = response.data.logo.logoimage || response.data.logo.logoImage || '';
                
                setLogoData({
                    flySignLogo: newFlySign,
                    faviconLogo: newFavicon,
                    metaLogo: newMeta,
                    secondaryLogo: newSecondary
                });
                
                setLogoOptions({
                    flySign: newFlySign === '1' || newFlySign === 1,
                    favicon: newFavicon === '1' || newFavicon === 1,
                    metaLogo: newMeta === '1' || newMeta === 1,
                    secondaryLogo: newSecondary === '1' || newSecondary === 1
                });
                
                if (newLogoImage) {
                    let fullLogoUrl = newLogoImage;
                    if (!newLogoImage.startsWith('http://') && !newLogoImage.startsWith('https://')) {
                        const baseUrl = window.location.origin;
                        fullLogoUrl = `${baseUrl}/${newLogoImage}`;
                    }
                    setPreviewUrl(fullLogoUrl);
                }
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setFileName('No file chosen');
            setSelectedFile(null);
        } catch (error) {
            console.error('Logo update error:', error);
            if (error.response?.data?.errors) {
                setErrorMessage(
                    Object.values(error.response.data.errors).flat().join(', ') || 
                    'Failed to update logo settings. Please try again.'
                );
            } else {
                setErrorMessage(error.response?.data?.message || 'Failed to update logo settings. Please try again.');
            }
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderQRCode = (url: string, showOnlyImage: boolean = false) => {
        const logoImageUrl = previewUrl || funnelData?.logoimage || funnelData?.logo || '';
        
        const hasValidLogo = logoImageUrl && 
                             logoImageUrl !== '0' && 
                             logoImageUrl !== '1' && 
                             logoImageUrl !== 'false' && 
                             logoImageUrl !== 'true' &&
                             logoImageUrl.length > 0;
        
        if (showOnlyImage && hasValidLogo) {
            return (
                <div className="text-center">
                    <a 
                        href={url} 
                        className="text-yellow-400 block mb-2 text-sm sm:text-base break-all hover:underline" 
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        {url}
                    </a>
                    <div className="relative inline-block p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <img 
                            src={logoImageUrl} 
                            alt="Uploaded Logo" 
                            className="w-full h-auto max-w-[200px] max-h-[200px] object-contain"
                            onError={(e) => {
                                const target = e.currentTarget;
                                console.error('Failed to load image:', logoImageUrl);
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'text-center text-gray-400';
                                    fallback.innerHTML = `
                                        <svg class="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p class="text-sm mt-2">No logo uploaded</p>
                                    `;
                                    parent.appendChild(fallback);
                                }
                            }}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="text-center">
                <a 
                    href={url} 
                    className="text-yellow-400 block mb-2 text-sm sm:text-base break-all hover:underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    {url}
                </a>
                <div className="relative inline-block p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=fbbf24&bgcolor=1f2937&qzone=1`} 
                        alt="QR Code" 
                        className="w-full h-auto max-w-[200px]"
                        onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                                const fallback = document.createElement('p');
                                fallback.className = 'text-xs text-gray-400';
                                fallback.textContent = 'QR code unavailable';
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faImageIcon} className="text-white text-lg" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">EZ Logo Manager</h3>
                            <p className="text-sm text-gray-400">
                                {funnelData?.token ? `Funnel: ${funnelData.token}` : 'Manage your funnel logos'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner size={32} />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl text-red-400" />
                            </div>
                            <p className="text-gray-300">{error}</p>
                            {conversation.ezFunnelToken && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Funnel Token: {conversation.ezFunnelToken}
                                </p>
                            )}
                            <button
                                onClick={fetchFunnelData}
                                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : selectedFunnel ? (
                        <div className="space-y-6">
                            {successMessage && (
                                <div className="bg-green-500/20 border border-green-500/30 text-green-400 p-3 rounded-lg flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
                                    {successMessage}
                                </div>
                            )}
                            {errorMessage && (
                                <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400" />
                                    {errorMessage}
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Funnel QR Codes</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {renderQRCode(`https://ez.wiki/${selectedFunnel.token}`)}
                                    {renderQRCode(`https://ez.wiki/${selectedFunnel.token}`, true)}
                                </div>
                            </div>

                            <hr className="border-t border-gray-700" />

                            <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Upload Logo Image</h4>
                                <div className="bg-gray-700/50 border border-gray-600 rounded-lg flex items-center w-full overflow-hidden">
                                    <label 
                                        htmlFor="file-upload-ezlogo" 
                                        className="cursor-pointer bg-gray-600 text-gray-200 font-medium px-4 py-2.5 hover:bg-gray-500 transition-colors whitespace-nowrap"
                                    >
                                        Choose File
                                    </label>
                                    <span className="px-3 text-gray-400 truncate flex-1">
                                        {fileName}
                                    </span>
                                    <input 
                                        id="file-upload-ezlogo" 
                                        type="file" 
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF, SVG, WEBP</p>
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Logo Usage Options</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer hover:text-white transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400/50 focus:ring-offset-0"
                                            checked={logoOptions.favicon}
                                            onChange={(e) => setLogoOptions({...logoOptions, favicon: e.target.checked})}
                                        />
                                        <span>Favicon</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer hover:text-white transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400/50 focus:ring-offset-0"
                                            checked={logoOptions.metaLogo}
                                            onChange={(e) => setLogoOptions({...logoOptions, metaLogo: e.target.checked})}
                                        />
                                        <span>Meta Logo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    onClick={handleLogoSubmit}
                                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <LoadingSpinner size={16} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSave} />
                                            Save Logo Settings
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2.5 px-6 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center border border-gray-600">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl text-gray-400" />
                            </div>
                            <p className="text-gray-400">No funnel data found for this conversation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==================== Edit Panel Component ====================
const EditPanel = ({
    conversation,
    messages,
    isOpen,
    onClose,
    onUpdateTitle,
    onUpdateSlug,
    onUpdateStatus,
    onUpdateMessage,
    onUpdateSocialMessage,
    onUpdateMessageStatus,
    onDeleteMessage,
    onRefreshMessages,
    isOwner,
    tooltips,
    onShowAlert,
    conversationMessages,
    onEditEmbed,
}: {
    conversation: Conversation | null;
    messages: ConversationMessage[];
    isOpen: boolean;
    onClose: () => void;
    onUpdateTitle: (conversationId: string, title: string) => Promise<void>;
    onUpdateSlug: (conversationId: string, slug: string) => Promise<void>;
    onUpdateStatus: (conversationId: string, status: 'public' | 'private') => Promise<void>;
    onUpdateMessage: (message: ConversationMessage, content: string) => Promise<void>;
    onUpdateSocialMessage: (message: ConversationMessage, content: string, mediaFiles: string[], cw: string | null, format?: 'markdown' | 'html') => Promise<void>;
    onUpdateMessageStatus: (message: ConversationMessage) => Promise<void>;
    onDeleteMessage: (message: ConversationMessage) => Promise<void>;
    onRefreshMessages: (conversationId: string) => Promise<void>;
    isOwner: boolean;
    tooltips?: Record<string, string>;
    onShowAlert?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    conversationMessages?: Record<string, ConversationMessage[]>;
    onEditEmbed?: (message: ConversationMessage) => void;
}) => {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [hashtagInput, setHashtagInput] = useState('');
    const [hashtagList, setHashtagList] = useState<string[]>([]);
    const [status, setStatus] = useState<'public' | 'private'>('public');
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingMessage, setEditingMessage] = useState<ConversationMessage | null>(null);
    const [editingSocialMessage, setEditingSocialMessage] = useState<ConversationMessage | null>(null);
    const [editingObsidianMessage, setEditingObsidianMessage] = useState<ConversationMessage | null>(null);
    const [editSocialFormat, setEditSocialFormat] = useState<'markdown' | 'html'>('markdown');
    const [slugError, setSlugError] = useState('');
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugSuccess, setSlugSuccess] = useState('');
    const [titleSuccess, setTitleSuccess] = useState('');
    const [hashtagSuccess, setHashtagSuccess] = useState('');
    const [hashtagError, setHashtagError] = useState('');
    const [isAddingHashtag, setIsAddingHashtag] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'messages'>('details');
    
    const [messageOrder, setMessageOrder] = useState<number[]>([]);
    const [sortMode, setSortMode] = useState<'custom' | 'oldest' | 'newest' | 'user'>('custom');
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [previousMessageOrder, setPreviousMessageOrder] = useState<number[]>([]);
    
    const [accessNumber, setAccessNumber] = useState('');
    const [accessLimit, setAccessLimit] = useState<number | string>('');
    const [accessNumberError, setAccessNumberError] = useState('');
    const [accessLimitError, setAccessLimitError] = useState('');
    const [privateSettingsSuccess, setPrivateSettingsSuccess] = useState('');
    const [privateSettingsError, setPrivateSettingsError] = useState('');

    const [deleteMessageModal, setDeleteMessageModal] = useState<{
        isOpen: boolean;
        message: ConversationMessage | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        message: null,
        isDeleting: false,
    });

    const slugTimeoutRef = useRef<NodeJS.Timeout>();
    const hashtagInputRef = useRef<HTMLInputElement>(null);
    const hashtagListRef = useRef<string[]>([]);

    useEffect(() => {
        hashtagListRef.current = hashtagList;
    }, [hashtagList]);

    useEffect(() => {
        if (messages.length > 0) {
            const hasPositions = messages.some(m => m.position !== undefined && m.position !== null);
            if (hasPositions) {
                const sorted = [...messages].sort((a, b) => (a.position || 0) - (b.position || 0));
                setMessageOrder(sorted.map(m => m.id));
                setPreviousMessageOrder(sorted.map(m => m.id));
            } else {
                setMessageOrder(messages.map(m => m.id));
                setPreviousMessageOrder(messages.map(m => m.id));
            }
        } else {
            setMessageOrder([]);
            setPreviousMessageOrder([]);
        }
    }, [messages]);

    useEffect(() => {
        if (conversation) {
            setTitle(conversation.conversation_title || '');
            setSlug(conversation.slug);
            
            let initialTags: string[] = [];
            if (Array.isArray(conversation.hashtag)) {
                initialTags = conversation.hashtag;
            } else if (typeof conversation.hashtag === 'string' && conversation.hashtag) {
                initialTags = conversation.hashtag.split(/[, ]+/).filter(Boolean);
            }
            setHashtagList(initialTags);
            hashtagListRef.current = initialTags;
            
            setStatus(conversation.status === 'private' ? 'private' : 'public');
            setHashtagInput('');
        }
    }, [conversation]);

    useEffect(() => {
        if (conversation && conversation.status === 'private') {
            loadPrivateSettings();
        } else {
            setAccessNumber('');
            setAccessLimit('');
            setAccessNumberError('');
            setAccessLimitError('');
            setPrivateSettingsSuccess('');
            setPrivateSettingsError('');
        }
    }, [conversation, conversation?.status]);

    const handleHashtagAdd = async (customInput?: string, shouldFocus = true) => {
        const raw = (typeof customInput === 'string' ? customInput : hashtagInput).trim();
        
        // Immediately clear both the state and the input DOM element
        setHashtagInput('');
        if (hashtagInputRef.current) {
            hashtagInputRef.current.value = '';
        }

        // Keep cursor focused in the textbox
        if (shouldFocus) {
            hashtagInputRef.current?.focus();
            requestAnimationFrame(() => {
                hashtagInputRef.current?.focus();
            });
            setTimeout(() => {
                hashtagInputRef.current?.focus();
            }, 0);
        }

        if (!conversation || !raw) {
            return;
        }
        
        const rawTokens = raw.split(/[\s,]+/).filter(Boolean);
        if (rawTokens.length === 0) {
            return;
        }
        
        const newTagsToAdd: string[] = [];
        const currentList = hashtagListRef.current;
        const existingLower = new Set(currentList.map(t => t.toLowerCase()));
        
        for (const token of rawTokens) {
            const clean = token.replace(/^#+/, '').replace(/#+$/, '').trim();
            if (!clean) continue;
            
            if (clean.length > 50) {
                setHashtagError('Tag must be 50 characters or less');
                setTimeout(() => setHashtagError(''), 3000);
                continue;
            }
            
            if (existingLower.has(clean.toLowerCase())) {
                setHashtagError(`"#${clean}" is already added`);
                setTimeout(() => setHashtagError(''), 3000);
                continue;
            }
            
            existingLower.add(clean.toLowerCase());
            newTagsToAdd.push(clean);
        }
        
        if (newTagsToAdd.length === 0) {
            if (shouldFocus) {
                setTimeout(() => hashtagInputRef.current?.focus(), 10);
            }
            return;
        }
        
        setIsAddingHashtag(true);
        setHashtagError('');
        
        // Optimistically update list so rapid additions stack seamlessly
        const updatedList = [...currentList, ...newTagsToAdd];
        hashtagListRef.current = updatedList;
        setHashtagList(updatedList);
        
        if (shouldFocus) {
            setTimeout(() => hashtagInputRef.current?.focus(), 10);
        }
        
        try {
            const response = await axios.patch(`/ai/conversation/${conversation.conversation_id}/hashtag`, {
                hashtags: updatedList
            });
            
            if (response.data.success) {
                const confirmedList = response.data.hashtags || updatedList;
                hashtagListRef.current = confirmedList;
                setHashtagList(confirmedList);
                const successMsg = newTagsToAdd.length === 1 ? `Added #${newTagsToAdd[0]}` : `Added ${newTagsToAdd.length} hashtags`;
                setHashtagSuccess(successMsg);
                if (onShowAlert) onShowAlert(successMsg, 'success');
                setTimeout(() => setHashtagSuccess(''), 3000);
            }
        } catch (error: any) {
            console.error('Failed to add hashtag:', error);
            const errorMsg = error.response?.data?.message || 'Failed to add hashtag';
            setHashtagError(errorMsg);
            if (onShowAlert) onShowAlert(errorMsg, 'error');
        } finally {
            setIsAddingHashtag(false);
            if (shouldFocus) {
                hashtagInputRef.current?.focus();
                setTimeout(() => {
                    hashtagInputRef.current?.focus();
                }, 0);
            }
        }
    };

    const handleHashtagRemove = async (tagToRemove: string) => {
        if (!conversation) return;
        
        const updatedList = hashtagListRef.current.filter(t => t !== tagToRemove);
        hashtagListRef.current = updatedList;
        setHashtagList(updatedList);
        
        try {
            const response = await axios.patch(`/ai/conversation/${conversation.conversation_id}/hashtag`, {
                hashtags: updatedList
            });
            
            if (response.data.success) {
                const confirmedList = response.data.hashtags || updatedList;
                hashtagListRef.current = confirmedList;
                setHashtagList(confirmedList);
                if (onShowAlert) onShowAlert(`Removed #${tagToRemove}`, 'success');
            }
        } catch (error: any) {
            console.error('Failed to remove hashtag:', error);
            const errorMsg = error.response?.data?.message || 'Failed to remove hashtag';
            setHashtagError(errorMsg);
            if (onShowAlert) onShowAlert(errorMsg, 'error');
        }
    };

    const moveMessageUp = (index: number) => {
        if (index <= 0) return;
        setMessageOrder(prev => {
            const newOrder = [...prev];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            return newOrder;
        });
        setSortMode('custom');
    };

    const moveMessageDown = (index: number) => {
        if (index >= messageOrder.length - 1) return;
        setMessageOrder(prev => {
            const newOrder = [...prev];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            return newOrder;
        });
        setSortMode('custom');
    };

    const sortMessages = async (mode: 'oldest' | 'newest' | 'user') => {
        const sorted = [...messages];
        if (mode === 'oldest') {
            sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (mode === 'newest') {
            sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (mode === 'user') {
            sorted.sort((a, b) => {
                if (a.message_role === 'user' && b.message_role !== 'user') return -1;
                if (a.message_role !== 'user' && b.message_role === 'user') return 1;
                return 0;
            });
        }
        const newOrder = sorted.map(m => m.id);
        setMessageOrder(newOrder);
        setSortMode(mode);
        
        if (newOrder.length > 0) {
            await saveMessageOrder(newOrder);
        }
    };

    const saveMessageOrder = async (orderToSave?: number[]) => {
        if (!conversation) return;
        
        const order = orderToSave || messageOrder;
        if (order.length === 0) return;
        
        setIsSavingOrder(true);
        try {
            const response = await axios.patch(`/ai/conversation/${conversation.conversation_id}/message-order`, {
                message_order: order
            });
            
            if (response.data.success) {
                setPreviousMessageOrder(order);
                await onRefreshMessages(conversation.conversation_id);
                if (onShowAlert) onShowAlert('Message order saved successfully!', 'success');
                
                const updatedMessages = conversationMessages?.[conversation.conversation_id] || messages;
                const hasPositions = updatedMessages.some(m => m.position !== undefined && m.position !== null);
                if (hasPositions) {
                    const sorted = [...updatedMessages].sort((a, b) => (a.position || 0) - (b.position || 0));
                    setMessageOrder(sorted.map(m => m.id));
                    setPreviousMessageOrder(sorted.map(m => m.id));
                }
            } else {
                throw new Error(response.data.message || 'Failed to save order');
            }
        } catch (error) {
            console.error('Failed to save message order:', error);
            if (onShowAlert) onShowAlert('Failed to save message order', 'error');
            setMessageOrder(previousMessageOrder);
        } finally {
            setIsSavingOrder(false);
        }
    };

    const checkSlugAvailability = async (slugToCheck: string) => {
        if (!slugToCheck || !conversation) return;
        
        setSlugChecking(true);
        
        try {
            const response = await axios.get('/ai/conversation/check-slug-availability', {
                params: { slug: slugToCheck, conversation_id: conversation.conversation_id }
            });
            
            if (!response.data.available && slugToCheck !== conversation.slug) {
                setSlugError('This slug is already taken');
            } else {
                setSlugError('');
            }
        } catch (error) {
            console.error('Failed to check slug availability:', error);
        } finally {
            setSlugChecking(false);
        }
    };

    useEffect(() => {
        if (slug && slug.length >= 3 && conversation) {
            if (slugTimeoutRef.current) {
                clearTimeout(slugTimeoutRef.current);
            }
            
            slugTimeoutRef.current = setTimeout(() => {
                checkSlugAvailability(slug);
            }, 500);
        }
        
        return () => {
            if (slugTimeoutRef.current) {
                clearTimeout(slugTimeoutRef.current);
            }
        };
    }, [slug, conversation]);

    const handleSaveAll = async () => {
        if (!conversation) return;
        
        if (!title.trim()) {
            setTitleSuccess('');
            if (onShowAlert) onShowAlert('Title cannot be empty', 'error');
            return;
        }
        
        if (!slug.trim()) {
            setSlugError('Slug cannot be empty');
            return;
        }
        
        if (slug.length > 255) {
            setSlugError('Slug is too long (maximum 255 characters)');
            return;
        }
        
        if (slugError) {
            if (onShowAlert) onShowAlert('Please fix slug errors before saving', 'error');
            return;
        }
        
        setIsUpdating(true);
        setSlugSuccess('');
        setTitleSuccess('');
        
        try {
            if (title !== conversation.conversation_title) {
                await onUpdateTitle(conversation.conversation_id, title);
            }
            
            if (slug !== conversation.slug) {
                await onUpdateSlug(conversation.conversation_id, slug);
            }
            
            const combinedMessage = 'Title & slug updated successfully!';
            setTitleSuccess(combinedMessage);
            setSlugSuccess(combinedMessage);
            if (onShowAlert) onShowAlert(combinedMessage, 'success');
            
            setTimeout(() => {
                setTitleSuccess('');
                setSlugSuccess('');
            }, 3000);
            
        } catch (error: any) {
            console.error('Failed to update:', error);
            if (error.response?.status === 422) {
                setSlugError(error.response.data.message || 'This slug is already taken');
            } else {
                setSlugError('Failed to update. Please try again.');
            }
            if (onShowAlert) onShowAlert('Failed to update', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const loadPrivateSettings = async () => {
        if (!conversation) return;
        
        try {
            const response = await axios.get(`/ai/conversation/${conversation.conversation_id}/private-settings`);
            if (response.data.success) {
                setAccessNumber(response.data.access_number || '');
                setAccessLimit(response.data.access_limit !== null && response.data.access_limit !== undefined ? response.data.access_limit : '');
            }
        } catch (error) {
            console.error('Failed to load private settings:', error);
            if (onShowAlert) onShowAlert('Failed to load private settings', 'error');
        }
    };

    const handleTitleUpdate = async () => {
        if (!conversation || !title.trim()) return;
        
        setIsUpdating(true);
        try {
            await onUpdateTitle(conversation.conversation_id, title);
            setTitleSuccess('Title updated successfully!');
            if (onShowAlert) onShowAlert('Title updated successfully!', 'success');
            setTimeout(() => setTitleSuccess(''), 3000);
        } catch (error) {
            console.error('Failed to update title:', error);
            if (onShowAlert) onShowAlert('Failed to update title', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSlugUpdate = async () => {
        if (!conversation || !slug.trim()) {
            setSlugError('Slug cannot be empty');
            return;
        }
        
        if (slug.length > 255) {
            setSlugError('Slug is too long (maximum 255 characters)');
            return;
        }
        
        if (slug === conversation.slug) {
            return;
        }
        
        setIsUpdating(true);
        try {
            await onUpdateSlug(conversation.conversation_id, slug);
            setSlugSuccess('Slug updated successfully!');
            if (onShowAlert) onShowAlert('Slug updated successfully!', 'success');
            setTimeout(() => setSlugSuccess(''), 3000);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setSlugError(error.response.data.message || 'This slug is already taken');
            } else {
                setSlugError('Failed to update slug. Please try again.');
            }
            if (onShowAlert) onShowAlert('Failed to update slug', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleStatusUpdate = async (newStatus: 'public' | 'private') => {
        if (!conversation) return;
        
        setIsUpdating(true);
        try {
            await onUpdateStatus(conversation.conversation_id, newStatus);
            setStatus(newStatus);
            if (onShowAlert) onShowAlert(`Conversation set to ${newStatus}`, 'success');
            
            if (newStatus === 'public') {
                setAccessNumber('');
                setAccessLimit('');
                setAccessNumberError('');
                setAccessLimitError('');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            if (onShowAlert) onShowAlert('Failed to update status', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const isPrivateSettingsValid = useCallback(() => {
        if (status !== 'private') return true;
        
        if (!accessNumber || accessNumber.length !== 4) return false;
        if (!/^\d{4}$/.test(accessNumber)) return false;
        
        if (accessLimit === '' || accessLimit === null) return false;
        const limit = Number(accessLimit);
        if (isNaN(limit) || limit < 0) return false;
        
        return true;
    }, [status, accessNumber, accessLimit]);

    const handlePrivateSettingsUpdate = async () => {
        if (!conversation) return;
        
        if (!isPrivateSettingsValid()) {
            if (!accessNumber || accessNumber.length !== 4) {
                setAccessNumberError('Access number must be exactly 4 digits');
            }
            if (accessLimit === '' || accessLimit === null) {
                setAccessLimitError('Access limit is required');
            } else if (Number(accessLimit) < 0) {
                setAccessLimitError('Access limit cannot be negative');
            }
            return;
        }
        
        setPrivateSettingsError('');
        setPrivateSettingsSuccess('');
        setIsUpdating(true);
        
        try {
            const response = await axios.patch(`/ai/conversation/${conversation.conversation_id}/private-settings`, {
                access_number: accessNumber,
                access_limit: accessLimit === 0 ? null : Number(accessLimit)
            });
            
            if (response.data.success) {
                setPrivateSettingsSuccess('Private access settings updated successfully!');
                if (onShowAlert) onShowAlert('Private access settings updated successfully!', 'success');
                setTimeout(() => setPrivateSettingsSuccess(''), 3000);
            }
        } catch (error: any) {
            console.error('Failed to update private settings:', error);
            setPrivateSettingsError(error.response?.data?.message || 'Failed to update private settings. Please try again.');
            if (onShowAlert) onShowAlert(error.response?.data?.message || 'Failed to update private settings', 'error');
            setTimeout(() => setPrivateSettingsError(''), 3000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEditMessage = (message: ConversationMessage) => {
        if ((message.content_type || '').toLowerCase() === 'embed') {
            onEditEmbed?.(message);
            return;
        }
        setEditingMessage(message);
    };

    const handleEditSocialMessage = (message: ConversationMessage) => {
        const format = getMessageFormat(message);
        console.log('Editing social message:', {
            id: message.id,
            slug: message.slug,
            query: message.query,
            format: format,
            extractedText: extractTextFromSocialMessage(message.query || '', format)
        });
        setEditSocialFormat(format);
        setEditingSocialMessage(message);
    };

    const handleEditObsidianMessage = (message: ConversationMessage) => {
        setEditingObsidianMessage(message);
    };

    const handleEditEmbedMessage = (message: ConversationMessage) => {
        onEditEmbed?.(message);
    };

    const handleDeleteMessageClick = (message: ConversationMessage) => {
        if (deleteMessageModal.isDeleting) return;
        
        setDeleteMessageModal({
            isOpen: true,
            message: message,
            isDeleting: false,
        });
    };

    const confirmDeleteMessage = async () => {
        if (!deleteMessageModal.message) return;
        
        setDeleteMessageModal(prev => ({ ...prev, isDeleting: true }));
        
        try {
            await onDeleteMessage(deleteMessageModal.message);
            await onRefreshMessages(conversation!.conversation_id);
            if (onShowAlert) onShowAlert('Message deleted successfully!', 'success');
            setDeleteMessageModal({ isOpen: false, message: null, isDeleting: false });
        } catch (error) {
            console.error('Failed to delete message:', error);
            if (onShowAlert) onShowAlert('Failed to delete message', 'error');
            setDeleteMessageModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const cancelDeleteMessage = () => {
        setDeleteMessageModal({ isOpen: false, message: null, isDeleting: false });
    };

    const handleMessageUpdate = async (message: ConversationMessage, content: string) => {
        setIsUpdating(true);
        try {
            await onUpdateMessage(message, content);
            setEditingMessage(null);
            await onRefreshMessages(conversation!.conversation_id);
            if (onShowAlert) onShowAlert('Message updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to update message:', error);
            if (onShowAlert) onShowAlert('Failed to update message', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleToggleMessageStatus = async (message: ConversationMessage) => {
        setIsUpdating(true);
        try {
            await onUpdateMessageStatus(message);
            await onRefreshMessages(conversation!.conversation_id);
            if (onShowAlert) onShowAlert(`Message ${message.status === 'hidden' ? 'unhidden' : 'hidden'}`, 'success');
        } catch (error) {
            console.error('Failed to update message status:', error);
            if (onShowAlert) onShowAlert('Failed to update message status', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleObsidianWikiSaveSuccess = async (data: any) => {
        console.log('Obsidian Wiki saved successfully with data:', data);
        
        setEditingObsidianMessage(null);
        
        if (conversation?.conversation_id) {
            await onRefreshMessages(conversation.conversation_id);
            
            if (onShowAlert) {
                onShowAlert('Obsidian Wiki Vault updated successfully!', 'success');
            }
        }
    };

    if (!isOpen || !conversation) return null;

    const getHashtagDisplay = (tags: string[]) => {
        if (!tags || tags.length === 0) return '';
        return tags.map(tag => `#${tag}`).join(' ');
    };

    return (
        <>
            <div className="w-full bg-gray-800 border border-gray-700 rounded-3xl shadow-xl flex flex-col h-full">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Conversation
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 px-2 text-sm font-bold ${
                            activeTab === 'details'
                                ? 'text-yellow-400 border-b-2 border-yellow-400'
                                : 'text-gray-400 hover:text-gray-300'
                        } transition-colors`}
                    >
                        Conversation Details
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`py-4 px-6 text-sm font-medium ${
                            activeTab === 'messages'
                                ? 'text-yellow-400 border-b-2 border-yellow-400'
                                : 'text-gray-400 hover:text-gray-300'
                        } transition-colors`}
                    >
                        Messages ({messages.length})
                    </button>
                </div>

                <div className="p-6 space-y-7 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'details' ? (
                        <>
                            {/* ========== DETACHED CARD 1: HASHTAGS SECTION ========== */}
                            <div className="bg-[#121b2d] rounded-2xl border border-slate-700/60 p-5 sm:p-6 shadow-xl transition-all duration-200 hover:border-slate-600">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                    <span className="text-yellow-400 font-extrabold text-sm select-none">#</span>
                                    HASHTAGS
                                </label>
                                
                                <div className="relative">
                                    <div className="flex items-center border border-slate-700/80 rounded-xl bg-[#0c1322] transition-all duration-200 focus-within:border-yellow-400/80 hover:border-slate-600 px-3.5">
                                        <span className="text-sm text-slate-500 font-mono select-none mr-1.5 font-bold">#</span>
                                        <input
                                            ref={hashtagInputRef}
                                            type="text"
                                            value={hashtagInput}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.includes(' ') || value.includes(',')) {
                                                    handleHashtagAdd(value, true);
                                                } else {
                                                    setHashtagInput(value);
                                                    setHashtagError('');
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
                                                    e.preventDefault();
                                                    const val = hashtagInput.trim();
                                                    if (val) {
                                                        handleHashtagAdd(val, true);
                                                    }
                                                    hashtagInputRef.current?.focus();
                                                }
                                            }}
                                            onBlur={() => {
                                                if (hashtagInput.trim()) {
                                                    handleHashtagAdd(hashtagInput, false);
                                                }
                                            }}
                                            placeholder="Type hashtag and press Space or Enter (e.g. AI, 😊, 中文, #crypto)"
                                            className="flex-1 py-3 outline-none text-sm font-medium bg-transparent text-white placeholder-slate-500"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Type a tag and press Space or Enter to add"
                                        />
                                        {isAddingHashtag && (
                                            <div className="flex items-center pl-2 text-yellow-400">
                                                <LoadingSpinner size={14} />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {hashtagError && (
                                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400 animate-slideDown">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            {hashtagError}
                                        </div>
                                    )}
                                    
                                    {hashtagSuccess && (
                                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400 animate-slideDown">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M20 6L9 17l-5-5"/>
                                            </svg>
                                            {hashtagSuccess}
                                        </div>
                                    )}
                                </div>
                                
                                {hashtagList.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {hashtagList.map((tag) => (
                                            <span
                                                key={tag}
                                                className="group inline-flex items-center gap-1.5 bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full border border-yellow-400/30 text-xs font-medium transition-all hover:bg-yellow-400/20"
                                            >
                                                <FontAwesomeIcon icon={faTag} className="text-[10px] text-yellow-400/60" />
                                                #{tag}
                                                <button
                                                    onClick={() => handleHashtagRemove(tag)}
                                                    className="text-yellow-400/60 hover:text-yellow-300 transition-colors p-0.5 hover:bg-yellow-400/20 rounded-full"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content={`Remove #${tag}`}
                                                    aria-label={`Remove hashtag ${tag}`}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-xs text-slate-400">No hashtags added yet. Type above and press Space or Enter to add.</p>
                                )}
                                
                                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                    Press Space or Enter after typing to add a hashtag. Supports emojis and all languages (with or without #).
                                </p>
                            </div>

                            {/* ========== DETACHED CARD 2: TITLE, SLUG & VERTICAL UPDATE BUTTON ========== */}
                            <div className="bg-[#121b2d] rounded-2xl border border-slate-700/60 p-5 sm:p-6 shadow-xl transition-all duration-200 hover:border-slate-600">
                                <div className="flex items-stretch gap-4 sm:gap-5">
                                    {/* Left column: Title & Slug */}
                                    <div className="flex-1 space-y-4">
                                        {/* ========== TITLE SECTION ========== */}
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-400">
                                                    <line x1="3" y1="6" x2="21" y2="6" />
                                                    <line x1="3" y1="12" x2="21" y2="12" />
                                                    <line x1="3" y1="18" x2="21" y2="18" />
                                                </svg>
                                                TITLE
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-slate-700/80 rounded-xl focus:outline-none focus:border-yellow-400/80 text-sm font-medium bg-[#0c1322] text-white placeholder-slate-500 transition-all duration-200 hover:border-slate-600"
                                                    placeholder="Enter conversation title..."
                                                />
                                            </div>
                                        </div>

                                        {/* ========== SLUG SECTION ========== */}
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                </svg>
                                                SLUG
                                            </label>
                                            <div className="relative">
                                                <div className="flex items-center border border-slate-700/80 rounded-xl bg-[#0c1322] transition-all duration-200 focus-within:border-yellow-400/80 hover:border-slate-600">
                                                    <span className="pl-4 pr-1 text-sm text-slate-500 font-mono select-none font-semibold">/X/</span>
                                                    <input
                                                        type="text"
                                                        value={slug}
                                                        onChange={(e) => {
                                                            let value = e.target.value;
                                                            value = value.replace(/\s+/g, '-');
                                                            setSlug(value);
                                                            setSlugError('');
                                                            setSlugSuccess('');
                                                        }}
                                                        className={`flex-1 px-2 py-2.5 outline-none text-sm font-medium bg-transparent text-white placeholder-slate-500 ${
                                                            slugError ? 'text-red-400' : ''
                                                        }`}
                                                        placeholder="url-slug (supports all languages)"
                                                    />
                                                    {slugChecking && (
                                                        <div className="px-3">
                                                            <LoadingSpinner size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {slugError && (
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400 animate-slideDown">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="12" y1="8" x2="12" y2="12" />
                                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                                        </svg>
                                                        {slugError}
                                                    </div>
                                                )}
                                                {slugSuccess && (
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400 animate-slideDown">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M20 6L9 17l-5-5"/>
                                                        </svg>
                                                        {slugSuccess}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Supports all languages: 中文, 日本語, 한국어, العربية, and more
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right column: Vertical Update Button */}
                                    <div className="flex flex-col justify-stretch">
                                        <button
                                            onClick={handleSaveAll}
                                            disabled={isUpdating || !title.trim() || !slug.trim() || slugError !== ''}
                                            className="group relative w-16 sm:w-[72px] h-full min-h-[140px] bg-gradient-to-b from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black rounded-2xl shadow-[0_0_28px_rgba(245,158,11,0.45)] hover:shadow-[0_0_36px_rgba(245,158,11,0.65)] transition-all duration-200 flex flex-col items-center justify-center p-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none select-none"
                                            title="Update title and slug"
                                        >
                                            {isUpdating ? (
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <LoadingSpinner size={22} color="#000" />
                                                    <div className="flex flex-col items-center text-[9px] font-black tracking-widest text-slate-950 leading-[1.2]">
                                                        <span>S</span>
                                                        <span>A</span>
                                                        <span>V</span>
                                                        <span>I</span>
                                                        <span>N</span>
                                                        <span>G</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg 
                                                        width="26" 
                                                        height="26" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="2.4" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        className="text-slate-950 group-hover:scale-105 transition-transform duration-200"
                                                    >
                                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                        <polyline points="17 21 17 13 7 13 7 21" />
                                                        <polyline points="7 3 7 8 15 8" />
                                                    </svg>
                                                    <div className="flex flex-col items-center text-[10.5px] font-black tracking-[0.22em] leading-[1.3] text-slate-950 mt-2 select-none">
                                                        <span>U</span>
                                                        <span>P</span>
                                                        <span>D</span>
                                                        <span>A</span>
                                                        <span>T</span>
                                                        <span>E</span>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-1.5">Privacy Status</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleStatusUpdate('public')}
                                        disabled={isUpdating || status === 'public'}
                                        className={`flex items-center justify-center gap-2 border-2 ${
                                            status === 'public'
                                                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 font-bold'
                                                : 'border-gray-600 bg-gray-700/30 text-gray-400 font-medium hover:border-gray-500 hover:bg-gray-700/50'
                                        } py-3 rounded-xl text-sm shadow-sm transition disabled:opacity-50`}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M15 12a3 3 0 11-6 0 3 3 0 0116 0z" strokeWidth="2"/>
                                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"/>
                                        </svg>
                                        Public
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('private')}
                                        disabled={isUpdating || status === 'private'}
                                        className={`flex items-center justify-center gap-2 border-2 ${
                                            status === 'private'
                                                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 font-bold'
                                                : 'border-gray-600 bg-gray-700/30 text-gray-400 font-medium hover:border-gray-500 hover:bg-gray-700/50'
                                        } py-3 rounded-xl text-sm shadow-sm transition disabled:opacity-50`}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2"/>
                                        </svg>
                                        Private
                                    </button>
                                </div>
                                
                                {status === 'private' && (
                                    <div className="mt-3 space-y-3 p-3 bg-gray-700/30 rounded-xl border border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-semibold text-gray-400">Private Access</h4>
                                            {conversation.private_views_count !== undefined && (
                                                <span className="text-[10px] text-gray-500">
                                                    Views: {conversation.private_views_count || 0}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                                    Access Number <span className="text-red-400">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    {[0, 1, 2, 3].map((index) => (
                                                        <input
                                                            key={index}
                                                            type="text"
                                                            maxLength={1}
                                                            value={accessNumber[index] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (value && !/^\d$/.test(value)) return;
                                                                const newAccessNumber = accessNumber.split('');
                                                                newAccessNumber[index] = value;
                                                                const newValue = newAccessNumber.join('');
                                                                
                                                                setAccessNumber(newValue);
                                                                setAccessNumberError('');
                                                                
                                                                if (value && index < 3) {
                                                                    const nextInput = document.getElementById(`otp-input-${index + 1}`);
                                                                    nextInput?.focus();
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Backspace' && !accessNumber[index] && index > 0) {
                                                                    const prevInput = document.getElementById(`otp-input-${index - 1}`);
                                                                    prevInput?.focus();
                                                                }
                                                            }}
                                                            onPaste={(e) => {
                                                                e.preventDefault();
                                                                const pastedData = e.clipboardData.getData('text');
                                                                const digits = pastedData.replace(/\D/g, '').slice(0, 4);
                                                                
                                                                if (digits.length > 0) {
                                                                    setAccessNumber(digits);
                                                                    setAccessNumberError('');
                                                                    
                                                                    if (digits.length === 4) {
                                                                        document.getElementById(`otp-input-3`)?.focus();
                                                                    } else if (digits.length < 4) {
                                                                        document.getElementById(`otp-input-${digits.length}`)?.focus();
                                                                    }
                                                                }
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            id={`otp-input-${index}`}
                                                            placeholder="•"
                                                            className={`w-10 h-10 text-center font-bold bg-gray-700/50 border-2 rounded-lg focus:outline-none transition-all text-lg text-white ${
                                                                accessNumberError 
                                                                    ? 'border-red-500/50 focus:border-red-500' 
                                                                    : accessNumber[index] 
                                                                        ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400' 
                                                                        : 'border-gray-600 focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20'
                                                            }`}
                                                            disabled={isUpdating}
                                                            autoComplete="off"
                                                        />
                                                    ))}
                                                </div>
                                                {accessNumberError && (
                                                    <p className="text-[10px] text-red-400 mt-1">{accessNumberError}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                                                    Access Limit <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={accessLimit}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === '') {
                                                            setAccessLimit('');
                                                            setAccessLimitError('');
                                                        } else if (!isNaN(parseInt(value)) && parseInt(value) >= 0) {
                                                            setAccessLimit(parseInt(value));
                                                            setAccessLimitError('');
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (accessLimit === '' || accessLimit === null) {
                                                            setAccessLimitError('Required');
                                                        } else if (Number(accessLimit) < 0) {
                                                            setAccessLimitError('Cannot be negative');
                                                        } else {
                                                            setAccessLimitError('');
                                                        }
                                                    }}
                                                    placeholder="Max views"
                                                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 outline-none text-sm bg-gray-700/50 text-white placeholder-gray-400"
                                                    min={0}
                                                    disabled={isUpdating}
                                                />
                                                {accessLimitError && (
                                                    <p className="text-[10px] text-red-400 mt-1">{accessLimitError}</p>
                                                )}
                                                <p className="text-[9px] text-gray-500 mt-0.5">0 = unlimited</p>
                                            </div>
                                        </div>

                                        {(privateSettingsSuccess || privateSettingsError) && (
                                            <p className={`text-[10px] flex items-center gap-1 ${privateSettingsSuccess ? 'text-green-400' : 'text-red-400'}`}>
                                                {privateSettingsSuccess ? '✓' : '⚠'} {privateSettingsSuccess || privateSettingsError}
                                            </p>
                                        )}

                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={handlePrivateSettingsUpdate}
                                                disabled={isUpdating || !isPrivateSettingsValid()}
                                                className="flex-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 py-2 rounded-lg text-xs font-bold hover:bg-yellow-400/30 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                {isUpdating ? <LoadingSpinner size={12} /> : (
                                                    <>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M20 6L9 17l-5-5"/>
                                                        </svg>
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAccessNumber('');
                                                    setAccessLimit('');
                                                    setAccessNumberError('');
                                                    setAccessLimitError('');
                                                    loadPrivateSettings();
                                                }}
                                                disabled={isUpdating}
                                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition disabled:opacity-50"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-yellow-400 mb-4 uppercase tracking-wider">Conversation Stats</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-600">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Messages</p>
                                        <p className="text-2xl font-bold text-white">{messages.length}</p>
                                    </div>
                                    <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-600">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Cost</p>
                                        <p className="text-2xl font-bold text-yellow-400">${formatCost(conversation.conversation_cost)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4 mt-2 text-center text-gray-500 text-[10px] font-medium">
                                conversation ID: {conversation.conversation_id} · created {conversation.created_at_formatted}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faSort} className="text-yellow-400 text-sm" />
                                        <span className="text-sm font-medium text-gray-300">Sort by:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => {
                                                setSortMode('custom');
                                                if (previousMessageOrder.length > 0 && previousMessageOrder.length === messages.length) {
                                                    setMessageOrder(previousMessageOrder);
                                                } else {
                                                    const hasPositions = messages.some(m => m.position !== undefined && m.position !== null);
                                                    if (hasPositions) {
                                                        const sorted = [...messages].sort((a, b) => (a.position || 0) - (b.position || 0));
                                                        setMessageOrder(sorted.map(m => m.id));
                                                    } else {
                                                        setMessageOrder(messages.map(m => m.id));
                                                    }
                                                }
                                            }}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                                sortMode === 'custom'
                                                    ? 'bg-yellow-400 text-black'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Use drag arrows to order manually"
                                        >
                                            Custom
                                        </button>
                                        <button
                                            onClick={() => sortMessages('oldest')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                                sortMode === 'oldest'
                                                    ? 'bg-yellow-400 text-black'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Oldest messages first"
                                        >
                                            Oldest First
                                        </button>
                                        <button
                                            onClick={() => sortMessages('newest')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                                sortMode === 'newest'
                                                    ? 'bg-yellow-400 text-black'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Newest messages first"
                                        >
                                            Newest First
                                        </button>
                                        <button
                                            onClick={() => sortMessages('user')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                                sortMode === 'user'
                                                    ? 'bg-yellow-400 text-black'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="User messages first, then AI responses"
                                        >
                                            User First
                                        </button>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        {sortMode === 'custom' && messageOrder.length > 1 && (
                                            <button
                                                onClick={() => saveMessageOrder()}
                                                disabled={isSavingOrder}
                                                className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Save the custom order of messages"
                                            >
                                                {isSavingOrder ? (
                                                    <>
                                                        <LoadingSpinner size={12} />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faSave} className="text-xs" />
                                                        Save Order
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {sortMode !== 'custom' && (
                                            <span className="text-xs text-gray-500">
                                                {sortMode === 'oldest' ? 'Oldest first' : 
                                                 sortMode === 'newest' ? 'Newest first' : 
                                                 'User first'} 
                                                <span className="text-green-400 ml-1">✓ Saved</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {sortMode === 'custom' && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" />
                                        <FontAwesomeIcon icon={faArrowDown} className="text-[10px]" />
                                        Use the up/down arrows on each message to reorder, then click "Save Order"
                                    </p>
                                )}
                            </div>

                            {messageOrder.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No messages found in this conversation.
                                </div>
                            ) : (
                                messageOrder.map((messageId, index) => {
                                    const message = messages.find(m => m.id === messageId);
                                    if (!message) return null;
                                    
                                    return (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                            isOwner={isOwner}
                                            onEdit={handleEditMessage}
                                            onEditSocial={handleEditSocialMessage}
                                            onEditObsidian={handleEditObsidianMessage}
                                            onEditEmbed={handleEditEmbedMessage}
                                            onDeleteClick={handleDeleteMessageClick}
                                            onToggleStatus={handleToggleMessageStatus}
                                            isUpdating={isUpdating}
                                            index={index}
                                            total={messageOrder.length}
                                            onMoveUp={sortMode === 'custom' ? moveMessageUp : undefined}
                                            onMoveDown={sortMode === 'custom' ? moveMessageDown : undefined}
                                        />
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            <MessageEditModal
                message={editingMessage}
                isOpen={!!editingMessage}
                onClose={() => setEditingMessage(null)}
                onSave={handleMessageUpdate}
                onOpenEmbed={(msg) => {
                    setEditingMessage(null);
                    onEditEmbed?.(msg);
                }}
                isSaving={isUpdating}
            />

            {editingSocialMessage && createPortal(
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                Edit Social Media Post
                            </h3>
                            <button
                                onClick={() => setEditingSocialMessage(null)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-3">
                                <span className="text-sm font-medium text-gray-400">Format:</span>
                                <div className="flex items-center gap-1 bg-gray-700/50 rounded-lg p-1">
                                    <button
                                        onClick={() => setEditSocialFormat('markdown')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            editSocialFormat === 'markdown'
                                                ? 'bg-yellow-400 text-black'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                                        }`}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Use Markdown syntax for formatting"
                                    >
                                        Markdown
                                    </button>
                                    <button
                                        onClick={() => setEditSocialFormat('html')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            editSocialFormat === 'html'
                                                ? 'bg-yellow-400 text-black'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                                        }`}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Use HTML for rich formatting"
                                    >
                                        HTML
                                    </button>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">
                                    Current: {editSocialFormat === 'markdown' ? '📝 Markdown' : '🌐 HTML'}
                                </span>
                            </div>
                            
                            <SocialMediaComposer
                                onUpdate={async (content, mediaFiles, cw, messageSlug) => {
                                    if (editingSocialMessage) {
                                        const slugToUse = messageSlug || editingSocialMessage.slug;
                                        console.log('Updating with slug:', slugToUse, 'format:', editSocialFormat);
                                        await onUpdateSocialMessage(editingSocialMessage, content, mediaFiles, cw, editSocialFormat);
                                        setEditingSocialMessage(null);
                                        await onRefreshMessages(conversation!.conversation_id);
                                    }
                                }}
                                initialContent={extractTextFromSocialMessage(editingSocialMessage.query || '', editSocialFormat)}
                                initialMediaFiles={extractMediaFromSocialMessage(editingSocialMessage.query || '', editingSocialMessage.file_data)}
                                initialCW={extractCWFromSocialMessage(editingSocialMessage.query || '')}
                                messageSlug={editingSocialMessage.slug}
                                isEditMode={true}
                                initialFormat={editSocialFormat}
                                contentFormat={editSocialFormat}
                                key={`social-edit-${editingSocialMessage.id}-${editSocialFormat}`}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {editingObsidianMessage && createPortal(
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
                    <div className="m-auto w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-6xl h-[92vh]">
                        <div className="bg-[#0f1218] rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden border border-[#212631]">
                            <div className="bg-[#141820] border-b border-[#212631] px-5 py-3.5 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-100">
                                            Edit Obsidian Wiki Vault
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Edit notes, links, graph view, and publish live wiki page
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingObsidianMessage(null)}
                                    className="p-2 hover:bg-[#212631] rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-[#0f1218]">
                                <ObsidianWikiPanel
                                    canInteract={isOwner}
                                    customSlug={editingObsidianMessage.slug}
                                    conversationId={conversation?.conversation_id}
                                    messageId={editingObsidianMessage.id}
                                    initialQuery={
                                        editingObsidianMessage.query ||
                                        editingObsidianMessage.response
                                    }
                                    initialFileData={
                                        Array.isArray(editingObsidianMessage.file_data)
                                            ? editingObsidianMessage.file_data
                                            : []
                                    }
                                    onSaveSuccess={handleObsidianWikiSaveSuccess}
                                />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {deleteMessageModal.isOpen && deleteMessageModal.message && createPortal(
                <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="m-auto w-[calc(100%-2rem)] max-w-md">
                        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Delete Message</h3>
                                        <p className="text-sm text-gray-400">This action cannot be undone.</p>
                                    </div>
                                </div>
                                <div className="mb-6 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                                    <p className="text-sm text-gray-300">
                                        Are you sure you want to delete this message?
                                    </p>
                                    {deleteMessageModal.message.content_type === 'upload' && deleteMessageModal.message.file_data && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            File: {deleteMessageModal.message.file_data.original_name}
                                        </p>
                                    )}
                                    {deleteMessageModal.message.content_type !== 'upload' && (
                                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                            {deleteMessageModal.message.query || deleteMessageModal.message.response || 'No content'}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={confirmDeleteMessage}
                                        disabled={deleteMessageModal.isDeleting}
                                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {deleteMessageModal.isDeleting ? (
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
                                        onClick={cancelDeleteMessage}
                                        disabled={deleteMessageModal.isDeleting}
                                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

// ==================== Main AIHistory Component ====================
export default function AIHistory({
    conversations: initialConversations,
    totalConversations,
    currentPage,
    lastPage,
    perPage,
    auth,
    tooltips = {},
    domains: initialDomains = [],
}: AIHistoryProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(currentPage < lastPage);
    const [page, setPage] = useState(currentPage);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [domainConversation, setDomainConversation] = useState<Conversation | null>(null);
    const [currentConversationSlug, setCurrentConversationSlug] = useState('');
    const [currentConversationTitle, setCurrentConversationTitle] = useState('');
    const [currentConversationEzFunnelId, setCurrentConversationEzFunnelId] = useState<string | null | undefined>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
    const [isDeletingConversation, setIsDeletingConversation] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [currentSort, setCurrentSort] = useState<SortOption>('recent');
    const [isPanelVisible, setIsPanelVisible] = useState(true);

    const [editPanelOpen, setEditPanelOpen] = useState(false);
    const [conversationMessages, setConversationMessages] = useState<Record<string, ConversationMessage[]>>({});
    const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});

    // Embed Modal State
    const [embedModal, setEmbedModal] = useState<{
        isOpen: boolean;
        message: ConversationMessage | null;
        conversationId: string | null;
    }>({ isOpen: false, message: null, conversationId: null });

    const [customAlert, setCustomAlert] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({
        show: false,
        message: '',
        type: 'info'
    });

    const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'error') => {
        setCustomAlert({ show: true, message, type });
    }, []);

    const [comingSoonModal, setComingSoonModal] = useState<ComingSoonModalState>({
        isOpen: false,
        feature: '',
        description: '',
        iconColor: '',
        icon: null,
    });

    const [emailListModal, setEmailListModal] = useState<{
        isOpen: boolean;
        conversation: Conversation | null;
        logs: EmailLog[];
        loading: boolean;
        total: number;
        usedCount: number;
        pendingCount: number;
    }>({
        isOpen: false,
        conversation: null,
        logs: [],
        loading: false,
        total: 0,
        usedCount: 0,
        pendingCount: 0,
    });

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
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
    const [isCopyAllCopied, setIsCopyAllCopied] = useState(false);

    const [priceEditModal, setPriceEditModal] = useState<PriceEditModalState>({
        isOpen: false,
        domainId: null,
        domainType: null,
        currentPrice: 0,
        domainDisplay: '',
        domainUrl: '',
        funnelId: 0,
        funnelToken: '',
    });
    const [priceEditLoading, setPriceEditLoading] = useState(false);
    const [priceEditError, setPriceEditError] = useState('');
    const [priceEditSuccess, setPriceEditSuccess] = useState('');

    const [ezLogoModal, setEzLogoModal] = useState<{
        isOpen: boolean;
        conversation: Conversation | null;
    }>({
        isOpen: false,
        conversation: null,
    });

    const [seoModal, setSeoModal] = useState<{
        isOpen: boolean;
        funnelId: number | null;
        funnelToken: string | null;
    }>({
        isOpen: false,
        funnelId: null,
        funnelToken: null,
    });

    const [analyticsModal, setAnalyticsModal] = useState<{
        isOpen: boolean;
        funnelId: number | null;
        funnelToken: string | null;
        funnelData: Conversation | null;
    }>({
        isOpen: false,
        funnelId: null,
        funnelToken: null,
        funnelData: null,
    });

    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    const loaderRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const totalCost = useMemo(
        () =>
            conversations.reduce((acc, conv) => {
                const cost = conv.conversation_cost ?? 0;
                return acc + (isNaN(Number(cost)) ? 0 : Number(cost));
            }, 0),
        [conversations]
    );

    const totalMessages = useMemo(
        () => conversations.reduce((acc, conv) => acc + (conv.message_count || 0), 0),
        [conversations]
    );

    const currentUser = auth?.user || null;
    const isOwner = useMemo(() => {
        if (!selectedConversation || !currentUser) return false;
        return selectedConversation.user_id === currentUser.id;
    }, [selectedConversation, currentUser]);

    const getHashtagsFromConversation = useCallback((conv: Conversation): string[] => {
        if (!conv.hashtag) return [];
        if (Array.isArray(conv.hashtag)) {
            return conv.hashtag;
        }
        if (typeof conv.hashtag === 'string' && conv.hashtag) {
            return conv.hashtag.split(/[, ]+/).filter(Boolean);
        }
        return [];
    }, []);

    const handleSeoClick = (e: React.MouseEvent, conversation: Conversation) => {
        e.preventDefault();
        e.stopPropagation();
        
        const funnelId = conversation.ezFunnelId;
        const funnelToken = conversation.ezFunnelToken;
        
        if (!funnelId && !funnelToken) {
            showAlert('No funnel associated with this conversation. Please create a funnel first.', 'warning');
            return;
        }
        
        if (funnelToken && !funnelId) {
            showAlert('Funnel ID not found. Please refresh or contact support.', 'error');
            return;
        }
        
        setSeoModal({
            isOpen: true,
            funnelId: funnelId ? Number(funnelId) : null,
            funnelToken: funnelToken || null,
        });
    };

    const handleAnalyticsClick = async (e: React.MouseEvent, conversation: Conversation) => {
        e.preventDefault();
        e.stopPropagation();
        
        const funnelId = conversation.ezFunnelId;
        const funnelToken = conversation.ezFunnelToken;
        
        if (!funnelId && !funnelToken) {
            showAlert('No funnel associated with this conversation. Please create a funnel first.', 'warning');
            return;
        }
        
        if (funnelToken && !funnelId) {
            showAlert('Funnel ID not found. Please refresh or contact support.', 'error');
            return;
        }
        
        setAnalyticsModal({
            isOpen: true,
            funnelId: funnelId ? Number(funnelId) : null,
            funnelToken: funnelToken || null,
            funnelData: conversation,
        });
        
        if (funnelId) {
            await fetchAnalyticsData(Number(funnelId), analyticsTimeRange);
        }
    };

    const fetchAnalyticsData = async (funnelId: number, timeRange: string) => {
        setAnalyticsLoading(true);
        setAnalyticsData(null);
        
        try {
            const response = await axios.get(`/get-funnel-analytics/${funnelId}`, {
                params: {
                    time_range: timeRange
                }
            });
            
            setAnalyticsData(response.data);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            showAlert('Failed to load analytics data. Please try again.', 'error');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleCloseAnalyticsModal = () => {
        setAnalyticsModal({
            isOpen: false,
            funnelId: null,
            funnelToken: null,
            funnelData: null,
        });
        setAnalyticsData(null);
        setAnalyticsLoading(false);
    };

    const handleAnalyticsTimeRangeChange = async (range: '7d' | '30d' | '90d') => {
        setAnalyticsTimeRange(range);
        if (analyticsModal.funnelId) {
            await fetchAnalyticsData(analyticsModal.funnelId, range);
        }
    };

    const handlePriceEditClick = (e: React.MouseEvent, domain: any, domainType: 'CUSTOM' | 'DOMAIN', conversation: Conversation) => {
        e.preventDefault();
        e.stopPropagation();
        
        const currentPrice = domain.sells?.[0]?.price || 0;
        let domainDisplay = '';
        let domainUrl = '';
        
        if (domainType === 'CUSTOM') {
            domainDisplay = `${domain.domainselected}/${domain.domain}`;
            domainUrl = `https://${domain.domainselected}/${domain.domain}`;
        } else {
            domainDisplay = `${domain.domain}.${domain.domainselected}`;
            domainUrl = `https://${domain.domain}.${domain.domainselected}`;
        }
        
        setPriceEditModal({
            isOpen: true,
            domainId: domain.id,
            domainType: domainType,
            currentPrice: currentPrice,
            domainDisplay: domainDisplay,
            domainUrl: domainUrl,
            funnelId: conversation.ezFunnelId ? Number(conversation.ezFunnelId) : 0,
            funnelToken: conversation.ezFunnelToken || '',
        });
        setPriceEditError('');
        setPriceEditSuccess('');
    };

    const handlePriceSave = async (domainId: number, type: 'CUSTOM' | 'DOMAIN', price: number) => {
        try {
            setPriceEditLoading(true);
            setPriceEditError('');
            setPriceEditSuccess('');
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await axios.post('/save-domain-price', {
                domain_id: domainId,
                type: type,
                price: price
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            
            setPriceEditSuccess('Price updated successfully!');
            
            setConversations(prevConversations => 
                prevConversations.map(conv => {
                    if (conv.ezFunnelId === String(priceEditModal.funnelId) || conv.ezFunnelToken === priceEditModal.funnelToken) {
                        const updateDomains = (domains: any[] | undefined) => 
                            domains?.map(d => {
                                if (d.id === domainId) {
                                    const newSells = d.sells && d.sells.length > 0 
                                        ? [{...d.sells[0], price: price}]
                                        : [{id: Date.now(), price: price, created_at: new Date().toISOString()}];
                                    return {...d, sells: newSells};
                                }
                                return d;
                            });
                        
                        return {
                            ...conv,
                            customDomains: type === 'CUSTOM' ? updateDomains(conv.customDomains) : conv.customDomains,
                            handleDomains: type === 'DOMAIN' ? updateDomains(conv.handleDomains) : conv.handleDomains
                        };
                    }
                    return conv;
                })
            );
            
            setTimeout(() => {
                setPriceEditSuccess('');
                setPriceEditModal(prev => ({ ...prev, isOpen: false }));
            }, 2000);
            
        } catch (error) {
            console.error('Error saving price:', error);
            setPriceEditError('Failed to save price. Please try again.');
            setTimeout(() => setPriceEditError(''), 5000);
        } finally {
            setPriceEditLoading(false);
        }
    };

    const handleViewEmailList = async (conversation: Conversation) => {
        setEmailListModal({
            isOpen: true,
            conversation: conversation,
            logs: [],
            loading: true,
            total: 0,
            usedCount: 0,
            pendingCount: 0,
        });
        
        try {
            const response = await axios.get(`/ai/conversation/${conversation.conversation_id}/private-access-logs`);
            
            if (response.data.success) {
                setEmailListModal(prev => ({
                    ...prev,
                    logs: response.data.data,
                    total: response.data.total,
                    usedCount: response.data.used_count,
                    pendingCount: response.data.pending_count,
                    loading: false,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch email list:', error);
            setEmailListModal(prev => ({ ...prev, loading: false }));
            showAlert('Failed to load email list. Please try again.', 'error');
        }
    };

    const handleExpressDomainClick = (conversation: Conversation) => {
        setDomainConversation(conversation);
        setCurrentConversationEzFunnelId(conversation.ezFunnelId);
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
        setDomainConversation(null);
        setCurrentConversationSlug('');
        setCurrentConversationTitle('');
        setCurrentConversationEzFunnelId(null);
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
            const endpoint = activeOption === 'handle' ? '/check-handle-availability' : '/ezai/check-ezpressstandard-domain';
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

        const slugToUse = domainConversation?.slug || selectedConversation?.slug || '';
        const titleToUse = domainConversation?.conversation_title || selectedConversation?.conversation_title || '';
        
        if (!slugToUse) {
            setErrorMessage('No conversation selected for domain purchase');
            showAlert('No conversation selected for domain purchase', 'error');
            return;
        }

        setCurrentConversationSlug(slugToUse);
        setCurrentConversationTitle(titleToUse || '');
        setPurchaseFormType(activeOption);
        setIsPaymentModalOpen(true);
    };

    const initiateHandlePayment = async () => {
        let finalPrice = Number(displayFinalPrices.totalPrice);

        if (finalPrice > 0 && finalPrice < 1) {
            finalPrice = 1;
        }

        const conversationSlug = currentConversationSlug;
        const conversationTitle = currentConversationTitle;
        
        if (!conversationSlug) {
            setErrorMessage('No conversation selected for domain purchase');
            showAlert('No conversation selected for domain purchase', 'error');
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
                    slug: conversationSlug,
                    slug_id: domainConversation?.id || selectedConversation?.id,
                    title: conversationTitle,
                    ezFunnelId: currentConversationEzFunnelId || domainConversation?.ezFunnelId || selectedConversation?.ezFunnelId,
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
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });
            
            setClientSecret(response.data.clientSecret);
            setPaymentIntentId(response.data.payment_intent_id);
            setPaymentStep(2);
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
                slug_id: domainConversation?.id || selectedConversation?.id,
                ezFunnelId: currentConversationEzFunnelId || domainConversation?.ezFunnelId || selectedConversation?.ezFunnelId,
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

    const copyMessageToClipboard = (messageId: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(messageId);
        showAlert('Copied to clipboard!', 'success');
        setTimeout(() => {
            setCopiedMessageId(null);
        }, 2000);
    };

    const handleUpdateSocialMessage = async (message: ConversationMessage, content: string, mediaFiles: string[], cw: string | null, format: 'markdown' | 'html' = 'markdown') => {
        try {
            const slugToUse = message.slug;
            const id = message.id;
            console.log('Updating social message:', {
                originalSlug: message.slug,
                slugToUse: slugToUse,
                content: content,
                mediaCount: mediaFiles?.length || 0,
                hasCW: !!cw,
                format: format
            });
            
            const response = await axios.put(`/content/social/${id}`, {
                content: content,
                media: mediaFiles || [],
                content_warning: cw || null,
                format: format,
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                }
            });

            if (response.data.success) {
                setConversationMessages(prev => {
                    const conversationId = message.conversation_id;
                    const messages = prev[conversationId] || [];
                    
                    let socialHtml = '';
                    
                    if (cw && cw.trim()) {
                        socialHtml = `<div class="social-content-warning" style="background-color: #2d1f0a; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 16px; border-radius: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M12 8v4M12 16h.01"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
                                <span style="font-weight: 600; color: #fbbf24;">Content Warning: ${escapeHtml(cw)}</span>
                            </div>
                            <details style="cursor: pointer;">
                                <summary style="color: #fcd34d; font-size: 14px;">Click to view content</summary>
                                <div style="margin-top: 12px;">`;
                    }
                    
                    if (mediaFiles && mediaFiles.length > 0) {
                        socialHtml += buildMediaGalleryHtml(mediaFiles);
                    }
                    
                    if (content && content.trim()) {
                        socialHtml += `<div class="social-content-text" style="font-family: inherit; line-height: 1.5; white-space: pre-wrap; word-break: break-word; margin-top: ${mediaFiles && mediaFiles.length > 0 ? '16px' : '0'}; color: #d1d5db;">`;
                        
                        if (format === 'html') {
                            socialHtml += content;
                        } else {
                            socialHtml += escapeHtml(content).replace(/\n/g, '<br>');
                        }
                        
                        socialHtml += `</div>`;
                    }
                    
                    if (cw && cw.trim()) {
                        socialHtml += `</div></details></div>`;
                    }
                    
                    if ((!content || !content.trim()) && (!mediaFiles || mediaFiles.length === 0)) {
                        socialHtml = '<div class="social-content-empty" style="color: #6b7280; text-align: center; padding: 20px;">No content provided</div>';
                    }
                    
                    const updatedMessages = messages.map(msg => 
                        msg.id === message.id 
                            ? { 
                                ...msg, 
                                query: socialHtml,
                                file_data: mediaFiles && mediaFiles.length > 0 ? {
                                    type: 'social_media_gallery',
                                    count: mediaFiles.length,
                                    files: mediaFiles.map((url, index) => ({
                                        url: url,
                                        type: 'image',
                                        order: index,
                                    }))
                                } : null,
                                media_count: mediaFiles?.length || 0,
                                updated_at: new Date().toISOString(),
                                social_media_metadata: {
                                    ...(msg.social_media_metadata || {}),
                                    format: format,
                                },
                              }
                            : msg
                    );
                    
                    return {
                        ...prev,
                        [conversationId]: updatedMessages
                    };
                });
                
                showAlert('Social media post updated successfully!', 'success');
            } else {
                throw new Error(response.data.message || 'Failed to update social media post');
            }
        } catch (error: any) {
            console.error('Failed to update social media post:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update social media post';
            showAlert(errorMessage, 'error');
            throw new Error(errorMessage);
        }
    };

    const handleEzLogoClick = (e: React.MouseEvent, conversation: Conversation) => {
        e.preventDefault();
        e.stopPropagation();
        setEzLogoModal({
            isOpen: true,
            conversation: conversation,
        });
    };

    const PriceEditModal = () => {
        const [priceInput, setPriceInput] = useState<string>('0');
        
        useEffect(() => {
            if (priceEditModal.isOpen) {
                setPriceInput(String(priceEditModal.currentPrice || 0));
            }
        }, [priceEditModal.isOpen, priceEditModal.currentPrice]);
        
        if (!priceEditModal.isOpen) return null;
        
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full relative">
                    <button
                        onClick={() => setPriceEditModal(prev => ({ ...prev, isOpen: false }))}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center"
                        data-tooltip-id="main-tooltip"
                        data-tooltip-content="Close price editor"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-gray-400" />
                    </button>
                    
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl mb-4 border border-yellow-500/30">
                                <FontAwesomeIcon icon={faDollarSign} className="text-2xl text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Set Selling Price</h2>
                            <p className="text-gray-400 text-sm mt-1">Domain: <span className="font-mono text-yellow-400">{priceEditModal.domainDisplay}</span></p>
                            <a 
                                href={priceEditModal.domainUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-yellow-400 hover:underline break-all"
                            >
                                {priceEditModal.domainUrl}
                            </a>
                        </div>
                        
                        {priceEditError && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                <span>{priceEditError}</span>
                            </div>
                        )}
                        
                        {priceEditSuccess && (
                            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg flex items-center gap-2">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <span>{priceEditSuccess}</span>
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Price (EZ$)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400 font-semibold">EZ$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={priceInput}
                                    onChange={(e) => setPriceInput(e.target.value)}
                                    className="w-full bg-gray-700/50 border border-gray-600 text-white px-4 py-3 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                                    placeholder="0.00"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Enter the selling price for this domain"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            const rawValue = parseFloat(priceInput);
                                            if (!isNaN(rawValue) && priceEditModal.domainId) {
                                                handlePriceSave(
                                                    priceEditModal.domainId,
                                                    priceEditModal.domainType!,
                                                    Math.round(rawValue * 100) / 100
                                                );
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Enter 0 to set as free</p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    const rawValue = parseFloat(priceInput);
                                    if (!isNaN(rawValue) && priceEditModal.domainId) {
                                        handlePriceSave(
                                            priceEditModal.domainId,
                                            priceEditModal.domainType!,
                                            Math.round(rawValue * 100) / 100
                                        );
                                    }
                                }}
                                disabled={priceEditLoading}
                                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
                            >
                                {priceEditLoading ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faSave} />
                                        Save Price
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setPriceEditModal(prev => ({ ...prev, isOpen: false }))}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors"
                                disabled={priceEditLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const AnalyticsModal = () => {
        if (!analyticsModal.isOpen) return null;
        
        const formatNumber = (num: number) => {
            return new Intl.NumberFormat().format(num);
        };
        
        const formatDuration = (seconds: number) => {
            if (seconds < 60) return `${Math.round(seconds)}s`;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${Math.round(remainingSeconds)}s`;
        };
        
        const COLORS = ['#fbbf24', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
        
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faChartLine} className="text-black text-lg" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Funnel Analytics</h3>
                                <p className="text-sm text-gray-400">
                                    {analyticsModal.funnelToken ? `Funnel: ${analyticsModal.funnelToken}` : 'Analytics Dashboard'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                                {(['7d', '30d', '90d'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => handleAnalyticsTimeRangeChange(range)}
                                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                            analyticsTimeRange === range 
                                                ? 'bg-yellow-400 text-black font-bold' 
                                                : 'text-gray-300 hover:bg-gray-600'
                                        }`}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content={`Last ${range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}`}
                                    >
                                        {range === '7d' ? '7D' : range === '30d' ? '30D' : '90D'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleCloseAnalyticsModal}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-lg" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {analyticsLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading analytics data...</p>
                                </div>
                            </div>
                        ) : analyticsData ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm hover:border-yellow-400/50 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                                                <FontAwesomeIcon icon={faUsers} className="text-blue-400 text-sm" />
                                            </div>
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Visitors</h3>
                                        </div>
                                        <p className="text-2xl font-bold text-white">
                                            {formatNumber(analyticsData.total_visitors)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Unique: {formatNumber(analyticsData.unique_visitors)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm hover:border-yellow-400/50 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                                                <FontAwesomeIcon icon={faEye} className="text-green-400 text-sm" />
                                            </div>
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Page Views</h3>
                                        </div>
                                        <p className="text-2xl font-bold text-white">
                                            {formatNumber(analyticsData.page_views)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Views/visitor: {(analyticsData.page_views / analyticsData.total_visitors).toFixed(1)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm hover:border-yellow-400/50 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                                                <FontAwesomeIcon icon={faChartLine} className="text-purple-400 text-sm" />
                                            </div>
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg. Duration</h3>
                                        </div>
                                        <p className="text-2xl font-bold text-white">
                                            {formatDuration(analyticsData.avg_session_duration)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Session length</p>
                                    </div>
                                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm hover:border-yellow-400/50 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                                                <FontAwesomeIcon icon={faChartBar} className="text-red-400 text-sm" />
                                            </div>
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bounce Rate</h3>
                                        </div>
                                        <p className="text-2xl font-bold text-white">
                                            {analyticsData.bounce_rate.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Single-page visits</p>
                                    </div>
                                </div>
                                
                                {analyticsData.daily_visits && analyticsData.daily_visits.length > 0 && (
                                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                                                <FontAwesomeIcon icon={faChartLine} className="text-yellow-400 text-xs" />
                                            </div>
                                            Visitors Over Time
                                        </h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={analyticsData.daily_visits}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    stroke="#6b7280"
                                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                />
                                                <YAxis 
                                                    stroke="#6b7280"
                                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                />
                                                <RechartsTooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: '#1f2937', 
                                                        borderColor: '#374151',
                                                        borderRadius: '8px',
                                                        color: '#e5e7eb',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                                    }}
                                                    labelStyle={{ color: '#9ca3af', fontWeight: '600' }}
                                                    formatter={(value: number) => [value, 'Visitors']}
                                                />
                                                <Legend 
                                                    wrapperStyle={{ color: '#9ca3af', fontSize: 12 }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="visits" 
                                                    stroke="#fbbf24" 
                                                    strokeWidth={3}
                                                    name="Visitors"
                                                    dot={{ stroke: '#fbbf24', strokeWidth: 2, r: 4, fill: '#fbbf24' }}
                                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fbbf24' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {analyticsData.traffic_sources && analyticsData.traffic_sources.length > 0 && (
                                        <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm">
                                            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                                                    <FontAwesomeIcon icon={faGlobe} className="text-blue-400 text-xs" />
                                                </div>
                                                Traffic Sources
                                            </h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={analyticsData.traffic_sources}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={true}
                                                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="visitors"
                                                    >
                                                        {analyticsData.traffic_sources.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip 
                                                        formatter={(value: number, name: string, props: any) => {
                                                            const percentage = props.payload.percentage || 0;
                                                            return [`${value} visitors (${percentage.toFixed(1)}%)`, name];
                                                        }}
                                                        contentStyle={{ 
                                                            backgroundColor: '#1f2937', 
                                                            borderColor: '#374151',
                                                            borderRadius: '8px',
                                                            color: '#e5e7eb',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                    
                                    {analyticsData.devices && analyticsData.devices.length > 0 && (
                                        <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm">
                                            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                                                    <FontAwesomeIcon icon={faDesktop} className="text-purple-400 text-xs" />
                                                </div>
                                                Device Usage
                                            </h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={analyticsData.devices}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                    <XAxis 
                                                        dataKey="device" 
                                                        stroke="#6b7280"
                                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                    />
                                                    <YAxis 
                                                        stroke="#6b7280"
                                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                    />
                                                    <RechartsTooltip 
                                                        formatter={(value: number, name: string, props: any) => {
                                                            const percentage = props.payload.percentage || 0;
                                                            return [`${value} visitors (${percentage.toFixed(1)}%)`, name];
                                                        }}
                                                        contentStyle={{ 
                                                            backgroundColor: '#1f2937', 
                                                            borderColor: '#374151',
                                                            borderRadius: '8px',
                                                            color: '#e5e7eb',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                                        }}
                                                    />
                                                    <Bar 
                                                        dataKey="visitors" 
                                                        fill="#8b5cf6" 
                                                        radius={[4, 4, 0, 0]}
                                                        name="Visitors"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                                
                                {analyticsData.locations && analyticsData.locations.length > 0 && (
                                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-400 text-xs" />
                                            </div>
                                            Top Visitor Locations
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-gray-300">
                                                <thead>
                                                    <tr className="border-b border-gray-600">
                                                        <th className="text-left py-3 px-4 text-xs font-semibold text-yellow-400 uppercase tracking-wider">Country</th>
                                                        <th className="text-left py-3 px-4 text-xs font-semibold text-yellow-400 uppercase tracking-wider">City</th>
                                                        <th className="text-left py-3 px-4 text-xs font-semibold text-yellow-400 uppercase tracking-wider">Visitors</th>
                                                        <th className="text-left py-3 px-4 text-xs font-semibold text-yellow-400 uppercase tracking-wider">Percentage</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analyticsData.locations.slice(0, 5).map((location: any, index: number) => (
                                                        <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                                            <td className="py-3 px-4 flex items-center gap-2">
                                                                <FontAwesomeIcon icon={faGlobe} className="text-yellow-400 text-sm" />
                                                                <span className="font-medium text-white">{location.country || 'Unknown'}</span>
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-gray-300">{location.city || 'Unknown'}</td>
                                                            <td className="py-3 px-4 font-semibold text-white">{location.visitors}</td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-24 bg-gray-700 rounded-full h-2 overflow-hidden">
                                                                        <div 
                                                                            className="bg-yellow-400 h-2 rounded-full transition-all duration-500" 
                                                                            style={{ 
                                                                                width: `${analyticsData.total_visitors > 0 ? (location.visitors / analyticsData.total_visitors) * 100 : 0}%` 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-gray-400">
                                                                        {analyticsData.total_visitors > 0 
                                                                            ? ((location.visitors / analyticsData.total_visitors) * 100).toFixed(1)
                                                                            : '0.0'
                                                                        }%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                
                                {analyticsData.top_pages && analyticsData.top_pages.length > 0 && (
                                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                                                <FontAwesomeIcon icon={faFileAlt} className="text-indigo-400 text-xs" />
                                            </div>
                                            Top Pages
                                        </h3>
                                        <div className="space-y-2">
                                            {analyticsData.top_pages.map((page: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-yellow-400/30 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-300 truncate font-medium">{page.url}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                                        <span className="text-sm font-semibold text-yellow-400">{page.visitors} visitors</span>
                                                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full border border-gray-600">
                                                            {formatDuration(page.avg_duration)} avg
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-400">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center border border-gray-600">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-gray-500" />
                                </div>
                                <p className="text-gray-300 font-medium">No analytics data available</p>
                                <p className="text-sm text-gray-500 mt-1">for this funnel in the selected time range.</p>
                                <button 
                                    onClick={() => analyticsModal.funnelId && fetchAnalyticsData(analyticsModal.funnelId, analyticsTimeRange)}
                                    className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-yellow-400/20"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const filterParentConversations = (convList: Conversation[]): Conversation[] => {
        const seen = new Set<string>();
        return convList.filter((conv) => {
            if (!conv) return false;
            if (conv.parent_id !== null && conv.parent_id !== undefined && Boolean(conv.parent_id)) {
                return false;
            }
            if (conv.conversation_id) {
                if (seen.has(conv.conversation_id)) {
                    return false;
                }
                seen.add(conv.conversation_id);
            }
            return true;
        });
    };

    useEffect(() => {
        const convData = initialConversations?.data || [];
        setConversations(filterParentConversations(convData));
    }, [initialConversations]);

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const response = await axios.get('/api/domains');
                if (response.data && response.data.length > 0) {
                    setDomains(response.data);
                    setSelectedDomain(response.data[0].domain);
                }
            } catch (error) {
                console.error('Failed to fetch domains:', error);
            }
        };
        
        if (domains.length === 0) {
            fetchDomains();
        } else if (domains.length > 0) {
            setSelectedDomain(domains[0].domain);
        }
    }, []);

    useEffect(() => {
        if (brandInput.trim() && selectedDomain && isExpressDomainOpen) {
            const timer = setTimeout(() => {
                checkAvailability();
            }, 800);
            
            return () => clearTimeout(timer);
        }
    }, [brandInput, selectedDomain, activeOption, isExpressDomainOpen]);

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
        let filtered = filterParentConversations(conversations);

        if (searchQuery.trim()) {
            const rawQuery = searchQuery.trim().toLowerCase();
            const strippedQuery = rawQuery
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/^ez\.wiki\//, '')
                .replace(/^\/x\//, '')
                .replace(/^x\//, '')
                .replace(/^[@#/]/, '')
                .trim();

            filtered = filtered.filter((conv) => {
                if (
                    conv.conversation_title?.toLowerCase().includes(rawQuery) ||
                    conv.query?.toLowerCase().includes(rawQuery) ||
                    conv.response_preview?.toLowerCase().includes(rawQuery) ||
                    conv.user_email?.toLowerCase().includes(rawQuery) ||
                    conv.status?.toLowerCase().includes(rawQuery) ||
                    conv.conversation_id?.toLowerCase().includes(rawQuery) ||
                    conv.model?.toLowerCase().includes(rawQuery)
                ) {
                    return true;
                }

                const tags = getHashtagsFromConversation(conv);
                if (tags.length > 0) {
                    const tagMatch = tags.some(tag => 
                        tag.toLowerCase().includes(rawQuery) ||
                        `#${tag}`.toLowerCase().includes(rawQuery) ||
                        (strippedQuery && (tag.toLowerCase().includes(strippedQuery) || strippedQuery.includes(tag.toLowerCase())))
                    );
                    if (tagMatch) return true;
                }

                if (conv.slug) {
                    const slugLower = conv.slug.toLowerCase();
                    const fullSlug = `/x/${slugLower}`;
                    if (
                        slugLower.includes(rawQuery) ||
                        fullSlug.includes(rawQuery) ||
                        (strippedQuery && (slugLower.includes(strippedQuery) || strippedQuery.includes(slugLower)))
                    ) {
                        return true;
                    }
                }

                if (conv.ezFunnelToken) {
                    const tokenLower = conv.ezFunnelToken.toLowerCase();
                    const fullTokenUrl = `https://ez.wiki/${tokenLower}`;
                    const shortTokenUrl = `ez.wiki/${tokenLower}`;
                    if (
                        tokenLower.includes(rawQuery) ||
                        fullTokenUrl.includes(rawQuery) ||
                        shortTokenUrl.includes(rawQuery) ||
                        (strippedQuery && (tokenLower.includes(strippedQuery) || strippedQuery.includes(tokenLower)))
                    ) {
                        return true;
                    }
                }

                if (conv.ezFunnelId && String(conv.ezFunnelId).toLowerCase().includes(rawQuery)) {
                    return true;
                }

                if (conv.customDomains && Array.isArray(conv.customDomains)) {
                    const matchCustom = conv.customDomains.some((cd) => {
                        const domainName = cd.domain?.toLowerCase() || '';
                        const domainExt = cd.domainselected?.toLowerCase() || '';
                        const pathFormat = `${domainExt}/${domainName}`.toLowerCase();
                        const subFormat = `${domainName}.${domainExt}`.toLowerCase();
                        const hashtag = cd.hashtag?.toLowerCase() || '';
                        const fullUrl1 = `https://${pathFormat}`;
                        const fullUrl2 = `https://${subFormat}`;

                        return (
                            domainName.includes(rawQuery) ||
                            domainExt.includes(rawQuery) ||
                            pathFormat.includes(rawQuery) ||
                            subFormat.includes(rawQuery) ||
                            fullUrl1.includes(rawQuery) ||
                            fullUrl2.includes(rawQuery) ||
                            hashtag.includes(rawQuery) ||
                            (strippedQuery && (
                                domainName.includes(strippedQuery) ||
                                pathFormat.includes(strippedQuery) ||
                                subFormat.includes(strippedQuery) ||
                                hashtag.includes(strippedQuery)
                            ))
                        );
                    });
                    if (matchCustom) return true;
                }

                if (conv.handleDomains && Array.isArray(conv.handleDomains)) {
                    const matchHandle = conv.handleDomains.some((hd) => {
                        const domainName = hd.domain?.toLowerCase() || '';
                        const domainExt = hd.domainselected?.toLowerCase() || '';
                        const pathFormat = `${domainExt}/${domainName}`.toLowerCase();
                        const subFormat = `${domainName}.${domainExt}`.toLowerCase();
                        const hashtag = hd.hashtag?.toLowerCase() || '';
                        const fullUrl1 = `https://${pathFormat}`;
                        const fullUrl2 = `https://${subFormat}`;

                        return (
                            domainName.includes(rawQuery) ||
                            domainExt.includes(rawQuery) ||
                            pathFormat.includes(rawQuery) ||
                            subFormat.includes(rawQuery) ||
                            fullUrl1.includes(rawQuery) ||
                            fullUrl2.includes(rawQuery) ||
                            hashtag.includes(rawQuery) ||
                            (strippedQuery && (
                                domainName.includes(strippedQuery) ||
                                pathFormat.includes(strippedQuery) ||
                                subFormat.includes(strippedQuery) ||
                                hashtag.includes(strippedQuery)
                            ))
                        );
                    });
                    if (matchHandle) return true;
                }

                if (conv.landing_page_url) {
                    const landingLower = conv.landing_page_url.toLowerCase();
                    if (landingLower.includes(rawQuery) || (strippedQuery && landingLower.includes(strippedQuery))) {
                        return true;
                    }
                }

                return false;
            });
        }

        const sorted = [...filtered].sort((a, b) => {
            switch (currentSort) {
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'most-messages':
                    return b.message_count - a.message_count;
                case 'highest-cost':
                    return (b.conversation_cost || 0) - (a.conversation_cost || 0);
                case 'recent':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        setFilteredConversations(sorted);
    }, [conversations, searchQuery, currentSort, getHashtagsFromConversation]);

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
            const response = await axios.get<PaginatedResponse>('/ai/history/load-more', {
                params: { page: page + 1, per_page: perPage },
            });

            if (response.data.success) {
                const newConvs = filterParentConversations(response.data.data || []);
                setConversations((prev) => filterParentConversations([...prev, ...newConvs]));
                setPage(response.data.meta.current_page);
                setHasMore(response.data.meta.current_page < response.data.meta.last_page);
            }
        } catch (error) {
            console.error('Failed to load more conversations:', error);
            showAlert('Failed to load more conversations', 'error');
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, perPage, showAlert]);

    const loadConversationMessages = useCallback(async (conversationId: string) => {
        if (loadingMessages[conversationId]) return;
        
        setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
        
        try {
            const response = await axios.get<ConversationMessagesResponse>(`/ai/conversation/${conversationId}`);
            
            if (response.data.success) {
                setConversationMessages(prev => ({
                    ...prev,
                    [conversationId]: response.data.messages || []
                }));
            }
        } catch (error) {
            console.error('Failed to load conversation messages:', error);
            showAlert('Failed to load conversation messages', 'error');
        } finally {
            setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
        }
    }, [loadingMessages, showAlert]);

    const handleEditClick = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setEditPanelOpen(true);
        
        if (!conversationMessages[conversation.conversation_id]) {
            await loadConversationMessages(conversation.conversation_id);
        }
    };

    const handleCloseEditPanel = () => {
        setEditPanelOpen(false);
        setSelectedConversation(null);
    };

    const handleUpdateTitle = async (conversationId: string, title: string) => {
        const response = await axios.patch(`/ai/conversation/${conversationId}/title`, { title });
        
        if (response.data.success) {
            setConversations(prev => 
                prev.map(c => 
                    c.conversation_id === conversationId 
                        ? { ...c, conversation_title: response.data.title }
                        : c
                )
            );
            
            if (selectedConversation?.conversation_id === conversationId) {
                setSelectedConversation(prev => prev ? { ...prev, conversation_title: response.data.title } : null);
            }
            showAlert('Title updated successfully', 'success');
        }
    };

    const handleUpdateSlug = async (conversationId: string, slug: string) => {
        const response = await axios.patch(`/ai/conversation/${conversationId}/slug`, { slug });
        
        if (response.data.success) {
            setConversations(prev => 
                prev.map(c => 
                    c.conversation_id === conversationId 
                        ? { ...c, slug: response.data.slug }
                        : c
                )
            );
            
            if (selectedConversation?.conversation_id === conversationId) {
                setSelectedConversation(prev => prev ? { ...prev, slug: response.data.slug } : null);
            }
            showAlert('Slug updated successfully', 'success');
        } else {
            showAlert('Failed to update slug', 'error');
        }
    };

    const handleUpdateStatus = async (conversationId: string, status: 'public' | 'private') => {
        const response = await axios.patch(`/ai/conversation/${conversationId}/status`, { status });
        
        if (response.data.success) {
            setConversations(prev => 
                prev.map(c => 
                    c.conversation_id === conversationId 
                        ? { ...c, status }
                        : c
                )
            );
            
            if (selectedConversation?.conversation_id === conversationId) {
                setSelectedConversation(prev => prev ? { ...prev, status } : null);
            }
            showAlert(`Conversation set to ${status}`, 'success');
        } else {
            showAlert('Failed to update status', 'error');
        }
    };

    const handleUpdateMessage = async (message: ConversationMessage, content: string) => {
        try {
            const response = await axios.patch(`/ai/message/${message.id}/update-content`, {
                content,
                content_type: message.content_type || 'embed'
            });

            if (response.data.success) {
                setConversationMessages(prev => {
                    const conversationId = message.conversation_id;
                    const messages = prev[conversationId] || [];
                    
                    return {
                        ...prev,
                        [conversationId]: messages.map(msg => 
                            msg.id === message.id 
                                ? { 
                                    ...msg, 
                                    ...(message.content_type === 'ai' 
                                        ? { response: content }
                                        : message.content_type === 'comment' 
                                        ? { query: content, content: content }
                                        : message.content_type === 'embed'
                                        ? { query: content }
                                        : message.message_role === 'user'
                                        ? { query: content }
                                        : { response: content }
                                    ),
                                    updated_at: response.data.data.updated_at,
                                    updated_at_formatted: response.data.data.updated_at_formatted,
                                    ...(response.data.data.total_tokens && { total_tokens: response.data.data.total_tokens })
                                  }
                                : msg
                        )
                    };
                });

                if (message.message_role === 'user' && message.parent_id === null) {
                    setConversations(prev => 
                        prev.map(conv => 
                            conv.conversation_id === message.conversation_id
                                ? { 
                                    ...conv, 
                                    query: content,
                                    response_preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                                    updated_at: response.data.data.updated_at
                                  }
                                : conv
                        )
                    );
                }
                showAlert('Message updated successfully', 'success');
            }
        } catch (error: any) {
            console.error('Failed to update message:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update message. Please try again.';
            showAlert(errorMessage, 'error');
            throw new Error(errorMessage);
        }
    };

    const handleUpdateMessageStatus = async (message: ConversationMessage) => {
        const newStatus = message.status === 'public' ? 'hidden' : 'public';
        const response = await axios.patch(`/ai/message/${message.slug}/status`, { status: newStatus });
        
        if (response.data.success) {
            setConversationMessages(prev => {
                const conversationId = message.conversation_id;
                const messages = prev[conversationId] || [];
                
                return {
                    ...prev,
                    [conversationId]: messages.map(msg => 
                        msg.id === message.id 
                            ? { ...msg, status: newStatus }
                            : msg
                    )
                };
            });
            showAlert(`Message ${newStatus === 'hidden' ? 'hidden' : 'unhidden'}`, 'success');
        } else {
            showAlert('Failed to update message status', 'error');
        }
    };

    const handleDeleteMessage = async (message: ConversationMessage) => {
        const response = await axios.delete(`/ai/message/${message.id}`);
        if (response.data.success) {
            setConversationMessages(prev => {
                const conversationId = message.conversation_id;
                const messages = prev[conversationId] || [];
                
                return {
                    ...prev,
                    [conversationId]: messages.filter(msg => msg.id !== message.id)
                };
            });
            
            setConversations(prev => 
                prev.map(conv => 
                    conv.conversation_id === message.conversation_id
                        ? { ...conv, message_count: conv.message_count - 1 }
                        : conv
                )
            );
            showAlert('Message deleted successfully', 'success');
        } else {
            showAlert('Failed to delete message', 'error');
        }
    };

    const handleRefreshMessages = async (conversationId: string) => {
        try {
            const response = await axios.get<ConversationMessagesResponse>(`/ai/conversation/${conversationId}`);
            if (response.data.success) {
                setConversationMessages(prev => ({
                    ...prev,
                    [conversationId]: response.data.messages || []
                }));
            }
        } catch (error) {
            console.error('Failed to refresh conversation messages:', error);
        }
    };

    const handleDeleteClick = (conversation: Conversation) => {
        setDeleteTarget(conversation);
        setDeletingId(conversation.conversation_id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        
        setIsDeletingConversation(true);
        try {
            await axios.delete(`/ai/conversation/${deleteTarget.conversation_id}`);

            setConversations((prev) => prev.filter((c) => c.conversation_id !== deleteTarget.conversation_id));
            setConversationMessages(prev => {
                const newState = { ...prev };
                delete newState[deleteTarget.conversation_id];
                return newState;
            });

            setShowDeleteModal(false);
            setDeleteTarget(null);
            setDeletingId(null);
            
            if (editPanelOpen && selectedConversation?.conversation_id === deleteTarget.conversation_id) {
                setEditPanelOpen(false);
                setSelectedConversation(null);
            }
            
            showAlert('Conversation deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            showAlert('Failed to delete conversation. Please try again.', 'error');
        } finally {
            setIsDeletingConversation(false);
        }
    };

    const handleToggleStatus = async (e: React.MouseEvent, conversation: Conversation) => {
        e.preventDefault();
        e.stopPropagation();

        const newStatus = conversation.status === 'public' ? 'private' : 'public';
        setUpdatingStatus(conversation.conversation_id);

        try {
            await axios.patch(`/ai/conversation/${conversation.conversation_id}/status`, { status: newStatus });

            setConversations((prev) =>
                prev.map((c) => (c.conversation_id === conversation.conversation_id ? { ...c, status: newStatus } : c))
            );
            showAlert(`Conversation set to ${newStatus}`, 'success');
        } catch (error) {
            console.error('Failed to update conversation status:', error);
            showAlert('Failed to update conversation status. Please try again.', 'error');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleNewSearch = () => {
        router.get('/');
    };

    const openComingSoonModal = useCallback((feature: string, description: string, iconColor: string, icon: JSX.Element) => {
        setComingSoonModal({ isOpen: true, feature, description, iconColor, icon });
    }, []);

    const closeComingSoonModal = useCallback(() => {
        setComingSoonModal((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleObsidianWikiSaveSuccess = useCallback((data: any) => {
        if (data.conversation_messages && Array.isArray(data.conversation_messages)) {
            const convId = data.conversation_id || selectedConversation?.conversation_id;
            
            if (convId) {
                setConversationMessages(prev => ({
                    ...prev,
                    [convId]: data.conversation_messages
                }));
                
                if (editPanelOpen && selectedConversation?.conversation_id === convId) {
                    setConversationMessages(prev => ({
                        ...prev,
                        [convId]: data.conversation_messages
                    }));
                }
            }
        }

        if (data.conversation_title) {
            setConversations(prev => 
                prev.map(c => 
                    c.conversation_id === (data.conversation_id || selectedConversation?.conversation_id)
                        ? { ...c, conversation_title: data.conversation_title }
                        : c
                )
            );
            
            if (selectedConversation) {
                setSelectedConversation(prev => prev ? { ...prev, conversation_title: data.conversation_title } : null);
            }
        }

        showAlert('Obsidian Wiki Vault updated successfully!', 'success');

    }, [selectedConversation, editPanelOpen, showAlert]);

    return (
        <>
            <Head title="Slug Management" />
            <style>{`
                .react-tooltip {
                    z-index: 99999 !important;
                    opacity: 1 !important;
                    font-size: 12px;
                    padding: 4px 8px;
                }
            `}</style>

            <Tooltip id="main-tooltip" place="top" className="!bg-gray-800 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[100] !shadow-xl border !border-gray-700" effect="solid" />

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
                
                @keyframes pulse-slow {
                    0%, 100% {
                        box-shadow: 0 10px 25px -5px rgba(251, 191, 36, 0.3);
                    }
                    50% {
                        box-shadow: 0 20px 30px -5px rgba(251, 191, 36, 0.5);
                    }
                }
                
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

                .animate-pulse-slow {
                    animation: pulse-slow 2s infinite;
                }
                
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1f2937;
                    border-radius: 20px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4b5563;
                    border-radius: 20px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                }
                
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #1f2937;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #4b5563;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                }

                .conversation-card:hover {
                    border-color: #fbbf24;
                    box-shadow: 0 8px 20px -6px rgba(251, 191, 36, 0.15);
                }

                button, .card-transition {
                    transition: all 0.15s ease;
                }
            `}</style>

            <main className="flex-1 flex flex-col p-8 overflow-hidden">
                {isPanelVisible && (
                    <div 
                        className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-7xl"
                        style={{ background: 'rgba(31, 41, 55, 0.8)' }}
                    >
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-yellow-400 tracking-tight">Slug Management</h1>
                                    <div className="flex gap-4 mt-2 items-center">
                                        <span className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-400/30">
                                            {totalConversations} conversation{totalConversations !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-gray-400 text-xs">• {totalMessages} messages</span>
                                        <span className="text-gray-400 text-xs">• ${formatCost(totalCost)} total</span>
                                    </div>
                                </div>
                                <Link
                                    href="/"
                                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition shadow-lg shadow-yellow-400/20"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    New Conversation
                                </Link>
                            </div>

                            <div className="flex flex-1 gap-7 overflow-hidden">
                                <div className="w-[40%] flex flex-col">
                                    <div className="flex justify-between items-center mb-4 px-1">
                                        <p className="text-xs text-gray-500 font-medium">
                                            Showing {filteredConversations.length} of {totalConversations} conversations
                                        </p>
                                        <select
                                            value={currentSort}
                                            onChange={(e) => setCurrentSort(e.target.value as SortOption)}
                                            className="flex items-center gap-2 border border-gray-700 rounded-lg px-4 py-2 bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer shadow-sm hover:bg-gray-700 outline-none"
                                        >
                                            {SORT_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-8">
                                        <div className="relative w-full max-w-4xl">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
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
                                                placeholder="Search by title, query, slug, hashtag, X0000 handle, domain, or email..."
                                                className="w-full pl-11 pr-5 py-3.5 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50 outline-none bg-gray-800 text-white placeholder-gray-500 shadow-sm transition"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh)]">
                                        {filteredConversations.length === 0 ? (
                                            <div className="text-center py-20 bg-gray-800 rounded-2xl border-2 border-gray-700 shadow-sm">
                                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="M12 16v-4M12 8h.01" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                    {searchQuery ? 'No matches found' : 'Ready for your first chat?'}
                                                </h3>
                                                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                                    {searchQuery
                                                        ? `No conversations match "${searchQuery}". Try different keywords.`
                                                        : 'Start a conversation with our AI and watch your history grow here.'}
                                                </p>
                                                <Link
                                                    href="/"
                                                    className="inline-flex items-center px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-sm font-bold transition shadow-lg shadow-yellow-400/20"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2">
                                                        <path d="M12 5v14M5 12h14" />
                                                    </svg>
                                                    Start a Conversation
                                                </Link>
                                            </div>
                                        ) : (
                                            filteredConversations.map((conversation) => {
                                                const hashtags = getHashtagsFromConversation(conversation);
                                                const displayHashtags = hashtags.slice(0, 3);
                                                const remainingHashtags = hashtags.length - 3;
                                                
                                                return (
                                                    <div
                                                        key={conversation.conversation_id}
                                                        className="conversation-card bg-gray-800 border-2 border-gray-700 hover:border-yellow-400 rounded-2xl p-5 shadow-sm relative transition cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h3 className="font-bold text-white text-base truncate">
                                                                        {conversation.conversation_title || 'Untitled Conversation'}
                                                                    </h3>
                                                                    {displayHashtags.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {displayHashtags.map((tag) => (
                                                                                <span key={tag} className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-400/30 flex-shrink-0">
                                                                                    #{tag}
                                                                                </span>
                                                                            ))}
                                                                            {remainingHashtags > 0 && (
                                                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                                                    +{remainingHashtags} more
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    
                                                                    <div className="flex gap-2 mt-1 text-gray-300 flex-shrink-0">
                                                                        <StatusBadge status={conversation.status || 'public'} />
                                                                        <button
                                                                            onClick={() => handleEditClick(conversation)}
                                                                            className="hover:text-yellow-400 p-1 rounded-full hover:bg-yellow-400/20 transition"
                                                                            data-tooltip-id="main-tooltip"
                                                                            data-tooltip-content="Edit conversation"
                                                                        >
                                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                            </svg>
                                                                        </button>

                                                                        <button
                                                                            onClick={(e) => handleToggleStatus(e, conversation)}
                                                                            disabled={updatingStatus === conversation.conversation_id}
                                                                            className={`p-1 rounded-full hover:bg-opacity-20 disabled:opacity-50 transition-colors ${
                                                                                conversation.status === 'private' 
                                                                                    ? 'text-amber-400 hover:bg-amber-500/20' 
                                                                                    : 'text-green-400 hover:bg-green-500/20'
                                                                            }`}
                                                                            data-tooltip-id="main-tooltip"
                                                                            data-tooltip-content={conversation.status === 'public' ? 'Make private' : 'Make public'}
                                                                        >
                                                                            {updatingStatus === conversation.conversation_id ? (
                                                                                <LoadingSpinner size={16} />
                                                                            ) : (
                                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                                                                </svg>
                                                                            )}
                                                                        </button>

                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleExpressDomainClick(conversation);
                                                                            }}
                                                                            className="relative group overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg hover:shadow-lg hover:shadow-yellow-400/30 flex items-center gap-1.5 border border-yellow-400/30"
                                                                            data-tooltip-id="main-tooltip"
                                                                            data-tooltip-content="✨ Get a custom domain for this conversation"
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
                                                                            
                                                                        </button>

                                                                        <button
                                                                            onClick={(e) => handleEzLogoClick(e, conversation)}
                                                                            className="hover:text-purple-400 p-1 rounded-full hover:bg-purple-500/20 transition relative group"
                                                                            data-tooltip-id="main-tooltip"
                                                                            data-tooltip-content="🎨 Manage funnel logos (favicon, meta logo, etc.)"
                                                                        >
                                                                            <FontAwesomeIcon 
                                                                                icon={faImageIcon} 
                                                                                className="text-gray-400 group-hover:text-purple-400 transition-colors text-base"
                                                                            />
                                                                            {conversation.ezFunnelToken && (
                                                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-800 animate-pulse" />
                                                                            )}
                                                                        </button>

                                                                        <button
                                                                            onClick={(e) => handleSeoClick(e, conversation)}
                                                                            className="hover:text-yellow-400 p-1 rounded-full hover:bg-yellow-500/20 transition relative group"
                                                                            data-tooltip-id="main-tooltip"
                                                                            data-tooltip-content="🔍 Manage SEO settings for this funnel"
                                                                        >
                                                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                                <circle cx="12" cy="12" r="3" />
                                                                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                                                            </svg>
                                                                            {conversation.ezFunnelToken && (
                                                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-gray-800 animate-pulse" />
                                                                            )}
                                                                        </button>

                                                                        <button
                                                                            onClick={(e) => handleAnalyticsClick(e, conversation)}
                                                                            className="hover:text-blue-400 p-1 rounded-full hover:bg-blue-500/20 transition relative group"
                                                                            data-tooltip-id="main-tooltip"
                                                                            data-tooltip-content="📊 View funnel analytics"
                                                                        >
                                                                            <FontAwesomeIcon 
                                                                                icon={faChartLine} 
                                                                                className="text-gray-400 group-hover:text-blue-400 transition-colors text-base"
                                                                            />
                                                                            {conversation.ezFunnelToken && (
                                                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-gray-800 animate-pulse" />
                                                                            )}
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleViewEmailList(conversation)}
                                                                            className="hover:text-blue-400 p-1 rounded-full hover:bg-blue-500/20 transition"
                                                                            data-tooltip-id="main-tooltip"
                                                                            data-tooltip-content="View email access list"
                                                                        >
                                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                                                <polyline points="22,6 12,13 2,6" />
                                                                            </svg>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleDeleteClick(conversation)}
                                                                            className="hover:text-red-400 p-1 rounded-full hover:bg-red-500/20 transition"
                                                                            data-tooltip-id="main-tooltip"
                                                                            data-tooltip-content="Delete conversation"
                                                                        >
                                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <p className="text-[11px] text-gray-500 mb-2">
                                                                    {conversation.created_at_formatted} • {conversation.message_count} messages • ${formatCost(conversation.conversation_cost)} • {conversation.user_email || 'Anonymous'}
                                                                </p>
                                                                
                                                                <div className="bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-600">
                                                                    <a 
                                                                        href={`/X/${conversation.slug}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs font-mono text-gray-400 hover:text-yellow-400 truncate flex items-center gap-1 transition-colors group"
                                                                        title={`Click to open /X/${conversation.slug} in new tab`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <span className="text-gray-500 group-hover:text-yellow-400 transition-colors">🔗</span>
                                                                        <span className="flex-1 truncate">/X/{conversation.slug}</span>
                                                                        <svg 
                                                                            width="14" 
                                                                            height="14" 
                                                                            viewBox="0 0 24 24" 
                                                                            fill="none" 
                                                                            stroke="currentColor" 
                                                                            strokeWidth="2"
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400"
                                                                        >
                                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                            <polyline points="15 3 21 3 21 9" />
                                                                            <line x1="10" y1="14" x2="21" y2="3" />
                                                                        </svg>
                                                                    </a>
                                                                </div>

                                                                {conversation.ezFunnelToken && (
                                                                    <div className="mt-2 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-lg px-3 py-2 border border-yellow-500/30">
                                                                        <a 
                                                                            href={`https://ez.wiki/${conversation.ezFunnelToken}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs font-mono text-yellow-400 hover:text-yellow-300 truncate flex items-center gap-1 transition-colors group"
                                                                            title={`Click to open https://ez.wiki/${conversation.ezFunnelToken} in new tab`}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <span className="text-yellow-500 group-hover:text-yellow-400 transition-colors">✨</span>
                                                                            <span className="flex-1 truncate font-semibold">https://ez.wiki/{conversation.ezFunnelToken}</span>
                                                                            <svg 
                                                                                width="14" 
                                                                                height="14" 
                                                                                viewBox="0 0 24 24" 
                                                                                fill="none" 
                                                                                stroke="currentColor" 
                                                                                strokeWidth="2"
                                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400"
                                                                            >
                                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                                <polyline points="15 3 21 3 21 9" />
                                                                                <line x1="10" y1="14" x2="21" y2="3" />
                                                                            </svg>
                                                                        </a>
                                                                    </div>
                                                                )}

                                                                {conversation.customDomains && conversation.customDomains.length > 0 && (
                                                                    <div className="mt-2 space-y-2">
                                                                        {conversation.customDomains.map((customDomain: any) => (
                                                                            <div key={customDomain.id} className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg px-3 py-2 border border-blue-500/30">
                                                                                <div className="flex items-center justify-between">
                                                                                    <a 
                                                                                        href={`https://${customDomain.domainselected}/${customDomain.domain}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-xs font-mono text-blue-400 hover:text-blue-300 truncate flex items-center gap-1 transition-colors group flex-1 min-w-0"
                                                                                        title={`Click to open https://${customDomain.domainselected}/${customDomain.domain} in new tab`}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        <span className="text-blue-400 group-hover:text-blue-300 transition-colors">🌐</span>
                                                                                        <span className="flex-1 truncate font-semibold">https://{customDomain.domainselected}/{customDomain.domain}</span>
                                                                                        <svg 
                                                                                            width="14" 
                                                                                            height="14" 
                                                                                            viewBox="0 0 24 24" 
                                                                                            fill="none" 
                                                                                            stroke="currentColor" 
                                                                                            strokeWidth="2"
                                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 flex-shrink-0"
                                                                                        >
                                                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                                            <polyline points="15 3 21 3 21 9" />
                                                                                            <line x1="10" y1="14" x2="21" y2="3" />
                                                                                        </svg>
                                                                                    </a>
                                                                                    <button
                                                                                        onClick={(e) => handlePriceEditClick(e, customDomain, 'CUSTOM', conversation)}
                                                                                        className="ml-2 p-1.5 hover:bg-yellow-500/20 rounded-lg transition-colors text-gray-400 hover:text-yellow-400 flex-shrink-0"
                                                                                        data-tooltip-id="main-tooltip"
                                                                                        data-tooltip-content={`Selling price: EZ$${customDomain.sells?.[0]?.price || 0} - Click to edit`}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faDollarSign} className="text-sm" />
                                                                                        <span className="text-[10px] font-mono ml-0.5 text-yellow-400">
                                                                                            {customDomain.sells?.[0]?.price || 0}
                                                                                        </span>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {conversation.handleDomains && conversation.handleDomains.length > 0 && (
                                                                    <div className="mt-2 space-y-2">
                                                                        {conversation.handleDomains.map((handleDomain: any) => (
                                                                            <div key={handleDomain.id} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg px-3 py-2 border border-purple-500/30">
                                                                                <div className="flex items-center justify-between">
                                                                                    <a 
                                                                                        href={`https://${handleDomain.domain}.${handleDomain.domainselected}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-xs font-mono text-purple-400 hover:text-purple-300 truncate flex items-center gap-1 transition-colors group flex-1 min-w-0"
                                                                                        title={`Click to open https://${handleDomain.domain}.${handleDomain.domainselected} in new tab`}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        <span className="text-purple-400 group-hover:text-purple-300 transition-colors">🔗</span>
                                                                                        <span className="flex-1 truncate font-semibold">https://{handleDomain.domain}.{handleDomain.domainselected}</span>
                                                                                        <svg 
                                                                                            width="14" 
                                                                                            height="14" 
                                                                                            viewBox="0 0 24 24" 
                                                                                            fill="none" 
                                                                                            stroke="currentColor" 
                                                                                            strokeWidth="2"
                                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 flex-shrink-0"
                                                                                        >
                                                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                                            <polyline points="15 3 21 3 21 9" />
                                                                                            <line x1="10" y1="14" x2="21" y2="3" />
                                                                                        </svg>
                                                                                    </a>
                                                                                    <button
                                                                                        onClick={(e) => handlePriceEditClick(e, handleDomain, 'DOMAIN', conversation)}
                                                                                        className="ml-2 p-1.5 hover:bg-yellow-500/20 rounded-lg transition-colors text-gray-400 hover:text-yellow-400 flex-shrink-0"
                                                                                        data-tooltip-id="main-tooltip"
                                                                                        data-tooltip-content={`Selling price: EZ$${handleDomain.sells?.[0]?.price || 0} - Click to edit`}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faDollarSign} className="text-sm" />
                                                                                        <span className="text-[10px] font-mono ml-0.5 text-yellow-400">
                                                                                            {handleDomain.sells?.[0]?.price || 0}
                                                                                        </span>
                                                                                    </button>
                                                                                </div>
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
                                                );
                                            })
                                        )}
                                    </div>

                                    <div ref={loaderRef} className="py-12 text-center">
                                        {loading && (
                                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800 border-2 border-gray-700 rounded-2xl shadow-sm">
                                                <LoadingSpinner size={22} />
                                                <span className="text-sm font-medium text-gray-300">Loading more conversations...</span>
                                            </div>
                                        )}
                                        {!hasMore && conversations.length > 0 && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                                <div className="w-12 h-px bg-gradient-to-r from-transparent to-gray-600" />
                                                <span>You've reached the end</span>
                                                <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="w-[60%]">
                                    {editPanelOpen && selectedConversation ? (
                                        <EditPanel
                                            conversation={selectedConversation}
                                            messages={conversationMessages[selectedConversation.conversation_id] || []}
                                            isOpen={editPanelOpen}
                                            onClose={handleCloseEditPanel}
                                            onUpdateTitle={handleUpdateTitle}
                                            onUpdateSlug={handleUpdateSlug}
                                            onUpdateStatus={handleUpdateStatus}
                                            onUpdateMessage={handleUpdateMessage}
                                            onUpdateSocialMessage={handleUpdateSocialMessage}
                                            onUpdateMessageStatus={handleUpdateMessageStatus}
                                            onDeleteMessage={handleDeleteMessage}
                                            onRefreshMessages={handleRefreshMessages}
                                            isOwner={isOwner}
                                            tooltips={tooltips}
                                            onShowAlert={showAlert}
                                            conversationMessages={conversationMessages}
                                            onEditEmbed={(message: ConversationMessage) => {
                                                setEmbedModal({
                                                    isOpen: true,
                                                    message,
                                                    conversationId: message.conversation_id || selectedConversation?.conversation_id || null,
                                                });
                                            }}
                                        />
                                    ) : (
                                        <div className="bg-gray-800 border border-gray-700 rounded-3xl shadow-xl flex flex-col h-full">
                                            <div className="p-6 border-b border-gray-700">
                                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                    Edit Conversation
                                                </h2>
                                            </div>

                                            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                                <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-yellow-400/10 rounded-3xl flex items-center justify-center border border-yellow-500/30">
                                                    <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-2">
                                                        No Conversation Selected
                                                    </h3>
                                                    <p className="text-gray-400 max-w-sm">
                                                        Select a conversation from the list to edit its details, manage messages, and customize settings.
                                                    </p>
                                                </div>

                                                <div className="w-full max-w-sm space-y-4 mt-4">
                                                    <div className="flex items-start gap-3 text-left">
                                                        <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-white text-sm">Edit Title & Slug</h4>
                                                            <p className="text-xs text-gray-400">Customize the conversation URL and display name</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 text-left">
                                                        <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-white text-sm">Add Hashtags</h4>
                                                            <p className="text-xs text-gray-400">Categorize your conversation with multiple hashtags (supports emojis and all languages)</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 text-left">
                                                        <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-white text-sm">Manage Privacy</h4>
                                                            <p className="text-xs text-gray-400">Toggle between public and private visibility</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 text-left">
                                                        <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-white text-sm">Edit Messages</h4>
                                                            <p className="text-xs text-gray-400">Modify or hide individual messages in the conversation</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 text-left">
                                                        <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                                <path d="M20 6L9 17l-5-5" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-white text-sm">Reorder Messages</h4>
                                                            <p className="text-xs text-gray-400">Drag and drop or sort messages in any order</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600">
                                                    <p className="text-xs text-gray-400 flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M12 16v-4M12 8h.01" />
                                                        </svg>
                                                        <span>Click the edit icon <span className="text-yellow-400 font-medium">✎</span> on any conversation card to start editing</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-4 border-t border-gray-700">
                                                <p className="text-[10px] text-gray-500 text-center">
                                                    Changes are saved automatically when you update
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showDeleteModal && deleteTarget && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="px-6 py-4 border-b border-gray-700">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-white">Delete Conversation</h3>
                                    <p className="text-sm text-gray-400">Are you sure you want to delete this conversation?</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                                <p className="text-sm font-medium text-gray-300 mb-1">Conversation:</p>
                                <p className="text-sm text-white break-words">{deleteTarget.conversation_title}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                                    {deleteTarget.user_email && (
                                        <>
                                            <span className="flex items-center gap-1 whitespace-nowrap">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="12" r="4" />
                                                </svg>
                                                <span className="truncate max-w-[150px]" title={deleteTarget.user_email}>
                                                    {deleteTarget.user_email}
                                                </span>
                                            </span>
                                            <span className="flex-shrink-0">•</span>
                                        </>
                                    )}
                                    <span className="whitespace-nowrap">{deleteTarget.message_count} messages</span>
                                    <span className="flex-shrink-0">•</span>
                                    <span className="whitespace-nowrap">${formatCost(deleteTarget.conversation_cost)} cost</span>
                                    <span className="flex-shrink-0">•</span>
                                    <span
                                        className={
                                            deleteTarget.status === 'public' ? 'text-green-400 whitespace-nowrap' : 'text-yellow-400 whitespace-nowrap'
                                        }
                                    >
                                        {deleteTarget.status || 'public'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-red-400 mb-4 break-words">
                                This action cannot be undone. All messages in this conversation will be permanently deleted.
                            </p>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeletingConversation}
                                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeletingConversation ? (
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
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteTarget(null);
                                        setDeletingId(null);
                                    }}
                                    disabled={isDeletingConversation}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {emailListModal.isOpen && emailListModal.conversation && createPortal(
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full relative max-h-[90vh] flex flex-col">
                        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Private Access Logs</h3>
                                    <p className="text-sm text-gray-400">
                                        {emailListModal.conversation.conversation_title || 'Untitled Conversation'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEmailListModal({ ...emailListModal, isOpen: false })}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                                    <p className="text-xs text-blue-400 font-semibold uppercase mb-1">Total Requests</p>
                                    <p className="text-2xl font-bold text-blue-400">{emailListModal.total}</p>
                                </div>
                                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                                    <p className="text-xs text-green-400 font-semibold uppercase mb-1">Accessed</p>
                                    <p className="text-2xl font-bold text-green-400">{emailListModal.usedCount}</p>
                                </div>
                                <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
                                    <p className="text-xs text-yellow-400 font-semibold uppercase mb-1">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-400">{emailListModal.pendingCount}</p>
                                </div>
                            </div>

                            {emailListModal.loading ? (
                                <div className="flex justify-center py-12">
                                    <LoadingSpinner size={32} />
                                </div>
                            ) : emailListModal.logs.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center border border-gray-600">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400">No access requests yet</p>
                                    <p className="text-sm text-gray-500 mt-1">When users request access to this private conversation, they'll appear here</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-700/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Email</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Access Number</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">Accessed At</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">IP Address</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-gray-700">
                                            {emailListModal.logs.map((log: EmailLog) => (
                                                <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                                <polyline points="22,6 12,13 2,6" />
                                                            </svg>
                                                            <span className="text-sm text-gray-300">{log.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <code className="px-2 py-1 bg-gray-700/50 rounded text-xs font-mono text-yellow-400">{log.access_number}</code>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {log.is_used ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-semibold">
                                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                                                Used
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-semibold">
                                                                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-400">
                                                            {log.accessed_at_formatted || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-gray-500 font-mono">{log.ip_address || '-'}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-3 rounded-b-2xl">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                    <span>Used: Access has been granted and used</span>
                                    <span className="mx-2">•</span>
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                    <span>Pending: Access requested but not yet used</span>
                                </div>
                                <button
                                    onClick={() => setEmailListModal({ ...emailListModal, isOpen: false })}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isExpressDomainOpen && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={handleCloseExpressDomain}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Close express domain modal"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-gray-400" />
                        </button>

                        <div className="p-8">
                            <div className="text-center mb-10">
                                <div 
                                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-yellow-400/10 rounded-2xl mb-4 border border-yellow-500/30"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Express Domain Service"
                                >
                                    <FontAwesomeIcon icon={faStore} className="text-2xl text-yellow-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-3">Get Your Express Domain</h3>
                                <p className="text-gray-400 text-lg">Choose your preferred option to establish your Web3 presence</p>
                            </div>

                            {purchaseSuccess.success && (
                                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl relative">
                                    <button
                                        onClick={() => setPurchaseSuccess({ success: false, message: '', url: '' })}
                                        className="absolute top-4 right-4 text-green-400 hover:text-green-300 transition-colors"
                                        aria-label="Close alert"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Close success notification"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12"/>
                                        </svg>
                                    </button>
                                    <div className="flex items-center justify-center gap-3 text-green-400 mb-2">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
                                        <span className="text-lg font-semibold">Purchase Successful!</span>
                                    </div>
                                    <div className="text-center text-gray-300 mb-3">
                                        {purchaseSuccess.message}
                                        <a 
                                            href={purchaseSuccess.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:text-yellow-300 hover:underline font-medium ml-1"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Visit your new domain"
                                        >
                                            {purchaseSuccess.url}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl relative">
                                    <button
                                        onClick={() => setErrorMessage('')}
                                        className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition-colors"
                                        aria-label="Close error"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12"/>
                                        </svg>
                                    </button>
                                    <div className="flex items-center justify-center gap-3 text-red-400 mb-2">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl" />
                                        <span className="text-lg font-semibold">Error</span>
                                    </div>
                                    <div className="text-center text-gray-300">
                                        {errorMessage}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center items-center gap-4 mb-10">
                                <button 
                                    onClick={() => handleOptionChange('domain')}
                                    className={`flex items-center justify-center py-3 px-8 rounded-xl shadow-sm font-semibold transition-all ${
                                        activeOption === 'domain' 
                                            ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' 
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                                        className="w-full bg-gray-700/50 border border-gray-600 text-white py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder-gray-400"
                                        value={brandInput}
                                        onChange={(e) => setBrandInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                checkAvailability();
                                            }
                                        }}
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Enter your desired brand name or handle"
                                    />
                                </div>
                                
                                <div className="relative w-full md:w-2/5">
                                    <select 
                                        className="w-full bg-gray-700/50 text-white py-4 px-6 pr-10 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 appearance-none"
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
                                    onClick={checkAvailability}
                                    className={`w-full md:w-1/5 font-bold py-4 px-6 rounded-xl shadow-sm flex items-center justify-center transition-all ${
                                        availabilityStatus.checking 
                                            ? 'bg-gray-700 text-gray-400' 
                                            : availabilityStatus.available !== null 
                                                ? (availabilityStatus.available 
                                                    ? 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-lg shadow-yellow-400/20' 
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30')
                                                : 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-lg shadow-yellow-400/20'
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
                                <div className="text-center mb-4 transition-all duration-300">
                                    <div className={`flex items-center justify-center gap-2 text-sm font-medium mb-4 ${
                                        availabilityStatus.available ? 'text-green-400' : 
                                        availabilityStatus.available === false ? 'text-red-400' : 
                                        'text-yellow-400'
                                    }`}>
                                        {availabilityStatus.checking ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                {availabilityStatus.message || "Checking availability..."}
                                            </>
                                        ) : (
                                            <>
                                                {availabilityStatus.available ? (
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400" />
                                                )}
                                                {availabilityStatus.message}
                                            </>
                                        )}
                                    </div>

                                    {availabilityStatus.available && availabilityStatus.price !== undefined && (
                                        <div className="mt-8 max-w-2xl mx-auto">
                                            <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600 rounded-xl p-6 mb-6">
                                                <div className="flex items-center justify-between flex-wrap gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-400 mb-1">Your domain will be:</p>
                                                        <p 
                                                            className="text-2xl font-bold text-white"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content="Your new domain"
                                                        >
                                                            {brandInput.trim()}.{selectedDomain}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span 
                                                            className="text-sm text-gray-400"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={`${availabilityStatus.charCount || 0} characters in your brand name`}
                                                        >
                                                            {availabilityStatus.charCount} characters
                                                        </span>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-400">Price</p>
                                                            <p 
                                                                className="text-2xl font-bold text-yellow-400"
                                                                data-tooltip-id="main-tooltip"
                                                                data-tooltip-content="Final price after any discounts"
                                                            >
                                                                US${Number(displayFinalPrices.domainPrice).toFixed(2)}
                                                                {couponStatus.valid && (
                                                                    <span className="text-yellow-400 text-sm ml-2">🎉</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {couponStatus.valid && (
                                                <div className="flex flex-col sm:flex-row gap-3 mt-4 items-stretch mb-4">
                                                    <div className="flex-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 p-4 rounded-xl text-center flex flex-col justify-center shadow-sm">
                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-emerald-400 text-sm font-semibold">
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
                                                    
                                                    <div className="flex-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-4 rounded-xl text-center flex flex-col justify-center shadow-sm">
                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-amber-400 font-semibold text-base">
                                                                Final Price
                                                            </p>
                                                        </div>
                                                        <p className="text-2xl font-bold text-white">
                                                            US${Number(displayFinalPrices.domainPrice).toFixed(2)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Including all fees
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {!couponStatus.valid && Number(availabilityStatus.promoPrice) > 0 && (
                                                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-6">
                                                    <p 
                                                        className="text-blue-400 font-semibold flex items-center justify-center gap-2"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content="Pre-launch promotional price"
                                                    >
                                                        <span className="text-xl">✨</span>
                                                        Pre-launch Price: US${Number(availabilityStatus.promoPrice).toFixed(2)}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Have a coupon code?
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-gray-700/50 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder-gray-400"
                                                        placeholder="Enter coupon code"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content="Enter a coupon code for discounts"
                                                    />
                                                </div>
                                                {couponCode && (
                                                    <div className={`mt-2 text-sm ${
                                                        couponStatus.valid ? 'text-green-400' : 
                                                        couponStatus.valid === false ? 'text-red-400' : 'text-yellow-400'
                                                    }`}>
                                                        {couponStatus.message || 'Validating coupon...'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-gray-700/30 border border-gray-600 p-4 rounded-xl mb-6">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-300 font-medium">Total Amount:</span>
                                                    <span 
                                                        className="text-2xl font-bold text-yellow-400"
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
                                                        className="mt-1 mr-3 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400/50 focus:ring-offset-0"
                                                        checked={termsAgreed}
                                                        onChange={(e) => setTermsAgreed(e.target.checked)}
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content="You must agree to the terms to continue"
                                                    />
                                                    <label htmlFor="terms-checkbox" className="text-sm text-gray-400">
                                                        By claiming your domain you agree to the{' '}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => window.open('/terms-and-conditions', '_blank')}
                                                            className="text-yellow-400 hover:text-yellow-300 hover:underline focus:outline-none"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content="View terms and conditions"
                                                        >
                                                            Terms and Conditions
                                                        </button>{' '}
                                                        and{' '}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => window.open('/privacy-policy', '_blank')}
                                                            className="text-yellow-400 hover:text-yellow-300 hover:underline focus:outline-none"
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
                                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/20"
                                                disabled={isSubmitting || !termsAgreed}
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={
                                                    !termsAgreed ? "Please agree to terms first" :
                                                    isSubmitting ? "Processing your purchase..." :
                                                    Number(displayFinalPrices.totalPrice) === 0 ? "Claim your free domain" : "Proceed to payment"
                                                }
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                        Processing...
                                                    </span>
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
                </div>,
                document.body
            )}

            {isPaymentModalOpen && purchaseFormType && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => {
                                setIsPaymentModalOpen(false);
                                setPurchaseFormType(null);
                                setErrorMessage('');
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center"
                            disabled={isLoading}
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Close payment modal"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-gray-400" />
                        </button>

                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div 
                                    className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-yellow-400/10 rounded-xl mb-4 border border-yellow-500/30"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="ez.wiki payment"
                                >
                                    <img
                                        src="https://ez.wiki/logo.gif"
                                        className="w-8 h-8 rounded-full object-cover"
                                        alt="ez.wiki Logo"
                                    />
                                </div>
                                <h2 className="text-xl font-bold text-white">
                                    {purchaseFormType === 'handle' ? 'Handle Purchase' : 'Domain Purchase'}
                                </h2>
                                <p 
                                    className="text-yellow-400 font-medium mt-1"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Your selected domain"
                                >
                                    {purchaseFormType === 'handle' 
                                        ? `${selectedDomain}/${brandInput.trim()}`
                                        : `${brandInput.trim()}.${selectedDomain}`
                                    }
                                </p>
                            </div>

                            <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400">Domain Price:</span>
                                    <span className="text-white font-semibold">US${Number(displayFinalPrices.domainPrice).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                                    <span className="text-white font-bold">Total:</span>
                                    <span 
                                        className="text-yellow-400 font-bold text-xl"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="Final payment amount"
                                    >
                                        US${Number(displayFinalPrices.totalPrice).toFixed(2)}
                                    </span>
                                </div>
                                {couponStatus.valid && (
                                    <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                                        <span className="text-green-400 text-sm">Coupon applied: {couponStatus.message}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={initiateHandlePayment}
                                disabled={isLoading}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/20"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content={
                                    isLoading ? "Processing payment..." :
                                    Number(displayFinalPrices.totalPrice) === 0 ? "Claim your free domain" : "Proceed to payment"
                                }
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        Processing...
                                    </span>
                                ) : Number(displayFinalPrices.totalPrice) === 0 ? 
                                    `Claim Free ${purchaseFormType === 'handle' ? 'Handle' : 'Domain'}` : 
                                    `Pay US${Number(displayFinalPrices.totalPrice).toFixed(2)}`
                                }
                            </button>

                            <div className="text-center text-xs text-gray-500 mt-4">
                                <p>Payment secured by STRIPE. You'll be taken to a thank you page after the payment.</p>
                                <p className="mt-1">
                                    <Link href="/terms" className="text-yellow-400 hover:underline">Terms</Link> and{' '}
                                    <Link href="/privacy" className="text-yellow-400 hover:underline">Privacy</Link>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isPaymentModalOpen && paymentStep === 2 && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm min-h-screen flex items-center justify-center z-[100] p-4 overflow-y-auto">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => {
                                setIsPaymentModalOpen(false);
                                setPaymentStep(1);
                                setErrorMessage('');
                            }}
                            className="sticky top-0 right-0 ml-auto text-gray-400 hover:text-white transition-colors z-10 bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center m-2"
                            disabled={isLoading}
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Close payment modal"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-gray-400" />
                        </button>

                        <div className="p-6">
                            {errorMessage && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    <span data-tooltip-id="main-tooltip" data-tooltip-content="Error notification">
                                        {errorMessage}
                                    </span>
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-yellow-400" />
                                </div>
                            )}

                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret: clientSecret,
                                    appearance: {
                                        theme: 'stripe',
                                        variables: {
                                            colorPrimary: '#fbbf24',
                                            colorBackground: '#1f2937',
                                            colorText: '#e5e7eb',
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
                                        onError={setErrorMessage}
                                        tooltips={tooltips}
                                        email={auth?.user?.email}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center py-8">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-yellow-400" />
                                    </div>
                                )}
                            </Elements>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {comingSoonModal.isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div
                            className={`px-6 py-5 rounded-t-2xl bg-gradient-to-r ${
                                comingSoonModal.iconColor === 'purple'
                                    ? 'from-purple-600 to-purple-700'
                                    : comingSoonModal.iconColor === 'blue'
                                    ? 'from-blue-600 to-blue-700'
                                    : comingSoonModal.iconColor === 'green'
                                    ? 'from-green-600 to-green-700'
                                    : 'from-yellow-500 to-yellow-600'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0">
                                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                        {comingSoonModal.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold text-white truncate">{comingSoonModal.feature}</h3>
                                        <div className="flex items-center space-x-2 mt-1 flex-wrap">
                                            <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-semibold text-white whitespace-nowrap">
                                                Coming Soon
                                            </span>
                                            <span className="text-white/80 text-xs whitespace-nowrap">• Pre-alpha</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={closeComingSoonModal}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                                    aria-label="Close modal"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-yellow-400 mb-2">✨ What's coming?</h4>
                                <p className="text-gray-300 leading-relaxed break-words">{comingSoonModal.description}</p>
                            </div>

                            <div className="bg-gray-700/30 rounded-xl p-4 mb-6 border border-gray-600">
                                <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">Early Preview</h4>
                                <div className="space-y-2">
                                    {comingSoonModal.feature === 'Analytics' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Real-time click tracking and analytics</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Geographic heatmaps and device insights</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Custom reports and exportable data</span>
                                            </div>
                                        </>
                                    )}
                                    {comingSoonModal.feature === 'Collections' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Create and organize custom collections</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Add notes, tags, and custom metadata</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Share collections with team members</span>
                                            </div>
                                        </>
                                    )}
                                    {comingSoonModal.feature === 'Bookmarks' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Save and organize favorite links</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Cross-device synchronization</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <path d="m9 12 2 2 4-4" />
                                                </svg>
                                                <span>Folder organization and search</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => {
                                        closeComingSoonModal();
                                        setTimeout(() => {
                                            showAlert(`You'll be notified when ${comingSoonModal.feature} launches!`, 'success');
                                        }, 100);
                                    }}
                                    className={`flex-1 px-4 py-3 ${
                                        comingSoonModal.iconColor === 'purple'
                                            ? 'bg-purple-500 hover:bg-purple-600'
                                            : comingSoonModal.iconColor === 'blue'
                                            ? 'bg-blue-500 hover:bg-blue-600'
                                            : comingSoonModal.iconColor === 'green'
                                            ? 'bg-green-500 hover:bg-green-600'
                                            : 'bg-yellow-400 hover:bg-yellow-500'
                                    } text-black font-bold rounded-xl transition-colors flex items-center justify-center space-x-2 min-w-0`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                    <span className="truncate">Notify Me</span>
                                </button>

                                <button
                                    onClick={closeComingSoonModal}
                                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-xl transition-colors border border-gray-600 min-w-0"
                                >
                                    <span className="truncate">Maybe Later</span>
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-gray-700/30 border-t border-gray-600 rounded-b-2xl">
                            <p className="text-xs text-gray-500 text-center flex items-center justify-center space-x-1">
                                <span>🚧</span>
                                <span className="truncate">We're working hard to bring you this feature. Stay tuned for updates!</span>
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {customAlert.show && (
                <CustomAlert
                    message={customAlert.message}
                    type={customAlert.type}
                    onClose={() => setCustomAlert({ show: false, message: '', type: 'info' })}
                />
            )}

            {ezLogoModal.isOpen && ezLogoModal.conversation && createPortal(
                <EzLogoModal
                    isOpen={ezLogoModal.isOpen}
                    onClose={() => setEzLogoModal({ isOpen: false, conversation: null })}
                    conversation={ezLogoModal.conversation}
                    auth={auth}
                />,
                document.body
            )}

            {seoModal.isOpen && seoModal.funnelId && createPortal(
                <SEOModal
                    isOpen={seoModal.isOpen}
                    onClose={() => setSeoModal({ isOpen: false, funnelId: null, funnelToken: null })}
                    funnelId={seoModal.funnelId}
                    funnelToken={seoModal.funnelToken || ''}
                    onSaveSuccess={() => {
                        showAlert('SEO settings updated successfully!', 'success');
                    }}
                />,
                document.body
            )}

            {createPortal(<AnalyticsModal />, document.body)}

            {createPortal(<PriceEditModal />, document.body)}

            {embedModal.isOpen && embedModal.message && createPortal(
                <EmbedRowModal
                    isOpen={embedModal.isOpen}
                    onClose={() => setEmbedModal({ isOpen: false, message: null, conversationId: null })}
                    conversationId={embedModal.conversationId || undefined}
                    parentSlug={embedModal.message.slug}
                    isEdit={true}
                    editId={embedModal.message.id}
                    editSlug={embedModal.message.slug}
                    initialHtml={embedModal.message.query || embedModal.message.content || embedModal.message.response || ''}
                    onUpdate={async (html: string) => {
                        try {
                            await handleUpdateMessage(embedModal.message!, html);
                            if (embedModal.conversationId) {
                                await handleRefreshMessages(embedModal.conversationId);
                            }
                            setEmbedModal({ isOpen: false, message: null, conversationId: null });
                            showAlert('Embed content updated successfully!', 'success');
                        } catch (error) {
                            console.error('Failed to update embed message:', error);
                            showAlert('Failed to update embed message. Please try again.', 'error');
                        }
                    }}
                    onChildConvoCreated={async (html: string, contentType?: string) => {
                        try {
                            await handleUpdateMessage(embedModal.message!, html);
                            if (embedModal.conversationId) {
                                await handleRefreshMessages(embedModal.conversationId);
                            }
                            setEmbedModal({ isOpen: false, message: null, conversationId: null });
                            showAlert('Embed content updated successfully!', 'success');
                        } catch (error) {
                            console.error('Failed to update embed message:', error);
                            showAlert('Failed to update embed message. Please try again.', 'error');
                        }
                    }}
                />,
                document.body
            )}
        </>
    );
}