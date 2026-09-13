import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faCopy,
    faCheck,
    faQrcode,
    faShareNodes,
    faEnvelope,
    faCode,
    faEye,
    faSlidersH,
    faExternalLinkAlt,
    faDesktop,
} from '@fortawesome/free-solid-svg-icons';
import {
    faFacebook,
    faXTwitter,
    faWhatsapp,
    faTelegram,
    faLinkedin,
    faReddit,
    faPinterest,
    faThreads,
} from '@fortawesome/free-brands-svg-icons';
import { QRCodeSVG } from 'qrcode.react';

interface SocialShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    slug?: string;
    url?: string;
    title?: string;
    description?: string;
    initialTab?: 'share' | 'embed';
}

type EmbedFormat = 'iframe' | 'card' | 'responsive' | 'markdown';
type EmbedHeightPreset = '340' | '500' | '650' | 'custom';

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
    isOpen,
    onClose,
    slug,
    url,
    title = 'Check out this post on Ez.wiki',
    description = '',
    initialTab = 'share',
}) => {
    const [activeTab, setActiveTab] = useState<'share' | 'embed'>(initialTab);
    const [copied, setCopied] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [showQrCode, setShowQrCode] = useState(false);
    
    // Embed options
    const [embedFormat, setEmbedFormat] = useState<EmbedFormat>('iframe');
    const [heightPreset, setHeightPreset] = useState<EmbedHeightPreset>('500');
    const [customHeight, setCustomHeight] = useState('500');
    const [includeBorder, setIncludeBorder] = useState(true);
    const [includeRadius, setIncludeRadius] = useState(true);
    const [includeShadow, setIncludeShadow] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // Compute canonical share URL
    const canonicalUrl = url || (slug 
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/X/${encodeURIComponent(slug)}`
        : (typeof window !== 'undefined' ? window.location.href : ''));

    const displaySlug = slug || (canonicalUrl.split('/X/')[1] ? decodeURIComponent(canonicalUrl.split('/X/')[1]) : '');

    // Formatted share text for social platforms
    const shareText = description ? `${title} - ${description.slice(0, 100)}` : title;

    // Effective height in pixels
    const effectiveHeight = heightPreset === 'custom' ? (parseInt(customHeight, 10) || 500) : parseInt(heightPreset, 10);

    // Build style string for iframe
    const styleParts: string[] = ['width: 100%', `height: ${effectiveHeight}px`];
    if (includeBorder) styleParts.push('border: 1px solid #e5e7eb');
    else styleParts.push('border: 0');
    if (includeRadius) styleParts.push('border-radius: 12px');
    if (includeShadow) styleParts.push('box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
    styleParts.push('overflow: hidden');
    styleParts.push('max-width: 100%');

    const iframeStyleAttr = styleParts.join('; ');
    const cleanTitle = (title || `Ez.wiki - ${displaySlug || 'Search'}`).replace(/"/g, '&quot;');

    // Compute Embed Code snippet based on selected format
    const generateEmbedCode = (): string => {
        switch (embedFormat) {
            case 'card':
                return `<iframe src="${canonicalUrl}" width="100%" height="340" frameborder="0" style="border: 1px solid #e2e8f0; border-radius: 12px; max-width: 540px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" title="${cleanTitle}" loading="lazy" allow="clipboard-write"></iframe>`;
            case 'responsive':
                return `<div style="position: relative; width: 100%; height: 0; padding-bottom: 65%; overflow: hidden; border-radius: ${includeRadius ? '12px' : '0'}; ${includeBorder ? 'border: 1px solid #e5e7eb;' : ''} ${includeShadow ? 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);' : ''}">\n  <iframe src="${canonicalUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" title="${cleanTitle}" loading="lazy" allow="clipboard-write"></iframe>\n</div>`;
            case 'markdown':
                return `<!-- Ez.wiki Embed -->\n[![${cleanTitle}](${canonicalUrl})](${canonicalUrl})\n\n<iframe src="${canonicalUrl}" width="100%" height="${effectiveHeight}" frameborder="0" style="${iframeStyleAttr}"></iframe>`;
            case 'iframe':
            default:
                return `<iframe src="${canonicalUrl}" width="100%" height="${effectiveHeight}" frameborder="0" style="${iframeStyleAttr}" title="${cleanTitle}" loading="lazy" allow="clipboard-write"></iframe>`;
        }
    };

    const embedSnippet = generateEmbedCode();

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(canonicalUrl);
            } else {
                const input = document.createElement('input');
                input.value = canonicalUrl;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy share URL:', err);
        }
    };

    const handleCopyEmbed = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(embedSnippet);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = embedSnippet;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setEmbedCopied(true);
            setTimeout(() => setEmbedCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy embed code:', err);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || 'Ez.wiki Share',
                    text: shareText,
                    url: canonicalUrl,
                });
            } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        }
    };

    const socialPlatforms = [
        {
            name: 'Facebook',
            icon: faFacebook,
            bgClass: 'bg-[#1877F2] hover:bg-[#1565C0] text-white',
            shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`,
        },
        {
            name: 'X (Twitter)',
            icon: faXTwitter,
            bgClass: 'bg-black hover:bg-neutral-800 text-white',
            shareUrl: `https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(shareText)}`,
        },
        {
            name: 'WhatsApp',
            icon: faWhatsapp,
            bgClass: 'bg-[#25D366] hover:bg-[#20bd5a] text-white',
            shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${canonicalUrl}`)}`,
        },
        {
            name: 'Telegram',
            icon: faTelegram,
            bgClass: 'bg-[#24A1DE] hover:bg-[#1d8fc7] text-white',
            shareUrl: `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(shareText)}`,
        },
        {
            name: 'LinkedIn',
            icon: faLinkedin,
            bgClass: 'bg-[#0A66C2] hover:bg-[#084e96] text-white',
            shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`,
        },
        {
            name: 'Reddit',
            icon: faReddit,
            bgClass: 'bg-[#FF4500] hover:bg-[#e03d00] text-white',
            shareUrl: `https://reddit.com/submit?url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(shareText)}`,
        },
        {
            name: 'Threads',
            icon: faThreads,
            bgClass: 'bg-black hover:bg-neutral-800 text-white',
            shareUrl: `https://threads.net/intent/post?text=${encodeURIComponent(`${shareText} ${canonicalUrl}`)}`,
        },
        {
            name: 'Pinterest',
            icon: faPinterest,
            bgClass: 'bg-[#E60023] hover:bg-[#c5001e] text-white',
            shareUrl: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(canonicalUrl)}&description=${encodeURIComponent(shareText)}`,
        },
        {
            name: 'Email',
            icon: faEnvelope,
            bgClass: 'bg-gray-700 hover:bg-gray-800 text-white',
            shareUrl: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${canonicalUrl}`)}`,
        },
    ];

    const openShareWindow = (shareUrl: string) => {
        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
            />

            <div className="flex min-h-full items-center justify-center p-4">
                <div 
                    className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all duration-200 border border-gray-100 z-10 max-h-[92vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-[#22c55e] flex items-center justify-center shadow-xs">
                                <FontAwesomeIcon icon={activeTab === 'embed' ? faCode : faShareNodes} className="text-lg" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                    {activeTab === 'embed' ? 'Embed Code' : 'Share Post'}
                                </h3>
                                {displaySlug && (
                                    <p className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                                        <span>Slug:</span>
                                        <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                                            X/{displaySlug}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
                            aria-label="Close"
                        >
                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mode Navigation Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-4 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('share')}
                            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                activeTab === 'share'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <FontAwesomeIcon icon={faShareNodes} className={activeTab === 'share' ? 'text-[#22c55e]' : ''} />
                            <span>Share & Social</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('embed')}
                            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                activeTab === 'embed'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <FontAwesomeIcon icon={faCode} className={activeTab === 'embed' ? 'text-indigo-600' : ''} />
                            <span>Embed Code</span>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                &lt;/&gt;
                            </span>
                        </button>
                    </div>

                    {/* Preview / Snippet */}
                    {description && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                            <p className="text-xs text-gray-600 line-clamp-2 italic">
                                "{description}"
                            </p>
                        </div>
                    )}

                    {/* TAB 1: SHARE & SOCIAL */}
                    {activeTab === 'share' && (
                        <>
                            {/* Social Media Grid */}
                            <div className="mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center justify-between">
                                    <span>Share to Social Media</span>
                                </p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {/* Embed quick launcher button */}
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('embed')}
                                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer ring-2 ring-indigo-200"
                                        title="Generate Embed Code"
                                    >
                                        <FontAwesomeIcon icon={faCode} className="text-lg mb-1" />
                                        <span className="text-[11px] font-semibold leading-tight">
                                            Embed Code
                                        </span>
                                    </button>

                                    {socialPlatforms.map((platform) => (
                                        <button
                                            key={platform.name}
                                            type="button"
                                            onClick={() => openShareWindow(platform.shareUrl)}
                                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${platform.bgClass}`}
                                            title={`Share on ${platform.name}`}
                                        >
                                            <FontAwesomeIcon icon={platform.icon} className="text-lg mb-1" />
                                            <span className="text-[11px] font-medium leading-tight">
                                                {platform.name}
                                            </span>
                                        </button>
                                    ))}

                                    {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                                        <button
                                            type="button"
                                            onClick={handleNativeShare}
                                            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                                            title="More Options"
                                        >
                                            <FontAwesomeIcon icon={faShareNodes} className="text-lg mb-1" />
                                            <span className="text-[11px] font-medium leading-tight">More</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Copy Link Field */}
                            <div className="mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                    Direct Link
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            readOnly
                                            value={canonicalUrl}
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:bg-white font-mono"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer ${
                                            copied
                                                ? 'bg-emerald-600 text-white shadow-emerald-200'
                                                : 'bg-[#22c55e] hover:bg-[#16a34a] text-white'
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-3.5 h-3.5" />
                                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* QR Code Collapsible Section */}
                            <div className="pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowQrCode(!showQrCode)}
                                    className="w-full flex items-center justify-between text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors py-1 focus:outline-none cursor-pointer"
                                >
                                    <span className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faQrcode} className="text-gray-400" />
                                        <span>{showQrCode ? 'Hide QR Code' : 'Show QR Code for Mobile Scanning'}</span>
                                    </span>
                                    <span className="text-[11px] text-gray-400">
                                        {showQrCode ? '▲' : '▼'}
                                    </span>
                                </button>

                                {showQrCode && (
                                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl mt-3 border border-gray-200/80">
                                        <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-100">
                                            <QRCodeSVG 
                                                value={canonicalUrl} 
                                                size={148} 
                                                level="M"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-2.5 text-center">
                                            Scan with phone camera or QR reader to open this slug
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* TAB 2: EMBED CODE */}
                    {activeTab === 'embed' && (
                        <div className="space-y-4">
                            {/* Embed Format Selector */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                    Embed Type
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    {[
                                        { id: 'iframe', label: 'Standard iFrame', desc: 'Full responsive' },
                                        { id: 'card', label: 'Card Widget', desc: 'Compact mini-card' },
                                        { id: 'responsive', label: 'Aspect Ratio', desc: 'Fluid container' },
                                        { id: 'markdown', label: 'Markdown', desc: 'Obsidian / Docs' },
                                    ].map((fmt) => (
                                        <button
                                            key={fmt.id}
                                            type="button"
                                            onClick={() => setEmbedFormat(fmt.id as EmbedFormat)}
                                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                                embedFormat === fmt.id
                                                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-1 ring-indigo-500'
                                                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            <div className="text-[11px] font-bold leading-tight">{fmt.label}</div>
                                            <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{fmt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Height Controls (for iframe & markdown modes) */}
                            {embedFormat !== 'card' && embedFormat !== 'responsive' && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Height (Pixels)
                                        </label>
                                        {heightPreset === 'custom' && (
                                            <span className="text-xs text-indigo-600 font-mono font-bold">
                                                {effectiveHeight}px
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {[
                                            { id: '340', label: '340px (Compact)' },
                                            { id: '500', label: '500px (Default)' },
                                            { id: '650', label: '650px (Tall)' },
                                            { id: 'custom', label: 'Custom' },
                                        ].map((h) => (
                                            <button
                                                key={h.id}
                                                type="button"
                                                onClick={() => setHeightPreset(h.id as EmbedHeightPreset)}
                                                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer text-center ${
                                                    heightPreset === h.id
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                                                }`}
                                            >
                                                {h.label}
                                            </button>
                                        ))}
                                    </div>
                                    {heightPreset === 'custom' && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="200"
                                                max="1200"
                                                step="20"
                                                value={customHeight}
                                                onChange={(e) => setCustomHeight(e.target.value)}
                                                className="w-28 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="500"
                                            />
                                            <span className="text-xs text-gray-500">pixels height</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Style toggles */}
                            {embedFormat !== 'markdown' && (
                                <div className="flex flex-wrap gap-3 py-2 px-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeBorder}
                                            onChange={(e) => setIncludeBorder(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Border</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeRadius}
                                            onChange={(e) => setIncludeRadius(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Rounded (12px)</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeShadow}
                                            onChange={(e) => setIncludeShadow(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Drop Shadow</span>
                                    </label>
                                </div>
                            )}

                            {/* Embed Code Output Area */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faCode} className="text-indigo-500" />
                                        <span>HTML Embed Snippet</span>
                                    </p>
                                    <span className="text-[11px] text-gray-400">
                                        Ready to paste into HTML, WordPress, Notion, Obsidian, or Wiki
                                    </span>
                                </div>
                                <div className="relative group">
                                    <textarea
                                        readOnly
                                        rows={4}
                                        value={embedSnippet}
                                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                                        className="w-full bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none shadow-inner"
                                    />
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <FontAwesomeIcon icon={faEye} className="text-gray-500" />
                                            <span>{showPreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCopyEmbed}
                                            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer ${
                                                embedCopied
                                                    ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-400'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={embedCopied ? faCheck : faCopy} className="w-3.5 h-3.5" />
                                            <span>{embedCopied ? 'Embed Code Copied!' : 'Copy Embed Code'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Section */}
                            {showPreview && (
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faDesktop} className="text-gray-500" />
                                            <span>Live Embed Preview</span>
                                        </span>
                                        <a
                                            href={canonicalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                                        >
                                            <span>Open in new tab</span>
                                            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                                        </a>
                                    </div>
                                    <div className="w-full bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xs">
                                        <iframe
                                            src={canonicalUrl}
                                            title="Embed Preview"
                                            className="w-full"
                                            style={{ height: `${Math.min(effectiveHeight, 400)}px` }}
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Helper notice */}
                            <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-indigo-900/80 leading-normal flex items-start gap-2">
                                <span className="font-bold text-indigo-600">Tip:</span>
                                <span>Paste this snippet directly inside any website, blog post, documentation page, or CMS. The embedded content stays automatically synced with Ez.wiki updates.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialShareModal;
