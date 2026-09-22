import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faExternalLinkAlt,
    faCopy,
    faCheck,
    faExpand,
    faDesktop,
    faTabletAlt,
    faMobileAlt,
    faRedo,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { faHtml5 } from '@fortawesome/free-brands-svg-icons';

interface HtmlDocPreviewProps {
    content: string;
    title?: string;
    filename?: string;
}

type HeightPreset = 'auto' | '600' | '900';
type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const HtmlDocPreview: React.FC<HtmlDocPreviewProps> = ({
    content,
    title = 'HTML Preview',
    filename = 'preview.html',
}) => {
    const [iframeHeight, setIframeHeight] = useState<number>(650);
    const [heightMode, setHeightMode] = useState<HeightPreset>('auto');
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
    const [copied, setCopied] = useState<boolean>(false);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const fullscreenIframeRef = useRef<HTMLIFrameElement | null>(null);

    // Ensure carousel controls (Previous, Next, dots) are positioned at the top in preview & exports
    // and ensure all links default to target="_blank" to prevent iframe navigation blocking
    const processedContent = useMemo(() => {
        if (!content || typeof content !== 'string') return content;
        let formatted = content;

        // Ensure base target="_blank" so all external links / social share popups open in new tabs cleanly
        if (!formatted.includes('<base ') && !formatted.includes('<base>')) {
            if (formatted.includes('<head>')) {
                formatted = formatted.replace('<head>', '<head><base target="_blank">');
            } else if (formatted.includes('<head ')) {
                formatted = formatted.replace(/<head[^>]*>/i, (match) => `${match}<base target="_blank">`);
            } else if (formatted.includes('<html>') || formatted.includes('<html ')) {
                formatted = formatted.replace(/<html[^>]*>/i, (match) => `${match}<head><base target="_blank"></head>`);
            } else {
                formatted = `<base target="_blank">\n${formatted}`;
            }
        }

        if (formatted.includes('ec-controls') || formatted.includes('carousel-controls')) {
            try {
                if (typeof window !== 'undefined' && window.DOMParser) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(formatted, 'text/html');
                    const carousels = doc.querySelectorAll('.ec, [class*="embed-carousel"], .carousel-preview, .ec-container');
                    let modified = false;
                    carousels.forEach((carousel) => {
                        const controls = carousel.querySelector('.ec-controls, .carousel-controls');
                        const viewport = carousel.querySelector('.ec-viewport, .carousel-viewport');
                        if (controls && viewport) {
                            if (!(controls.compareDocumentPosition(viewport) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                                viewport.parentNode?.insertBefore(controls, viewport);
                                modified = true;
                            }
                        }
                    });
                    if (modified) {
                        formatted = doc.documentElement ? doc.documentElement.outerHTML : formatted;
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }
        return formatted;
    }, [content]);

    // Measure content height and reset scroll to top
    const handleIframeLoad = useCallback((iframe: HTMLIFrameElement | null) => {
        if (!iframe) return;
        setIsLoaded(true);

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
                // Ensure all clicks on links inside the iframe open in a top-level new tab with noopener,noreferrer
                const handleLinkClick = (e: MouseEvent) => {
                    const target = (e.target as HTMLElement)?.closest('a');
                    if (target && target.getAttribute('href')) {
                        const href = target.getAttribute('href');
                        if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//'))) {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(href, '_blank', 'noopener,noreferrer');
                        }
                    }
                };
                iframeDoc.removeEventListener('click', handleLinkClick, true);
                iframeDoc.addEventListener('click', handleLinkClick, true);

                // Re-position any carousel controls if found below the viewport
                const carousels = iframeDoc.querySelectorAll('.ec, [class*="embed-carousel"], .carousel-preview, .ec-container');
                carousels.forEach((carousel) => {
                    const controls = carousel.querySelector('.ec-controls, .carousel-controls');
                    const viewport = carousel.querySelector('.ec-viewport, .carousel-viewport');
                    if (controls && viewport) {
                        if (!(controls.compareDocumentPosition(viewport) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                            viewport.parentNode?.insertBefore(controls, viewport);
                        }
                    }
                });

                // Inject style override ensuring carousel controls, row grids, masonry layouts, and embeds are rendered beautifully
                const style = iframeDoc.createElement('style');
                style.textContent = `
                    /* --- CAROUSEL STYLES --- */
                    .ec, .carousel-preview, [class*="embed-carousel"] {
                        display: flex !important;
                        flex-direction: column !important;
                        max-width: 680px !important;
                        margin: 0 auto !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .ec-controls, .carousel-controls {
                        order: -1 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 12px !important;
                        margin-top: 0 !important;
                        margin-bottom: 12px !important;
                        padding: 5px 14px !important;
                        background: #f8fafc !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 9999px !important;
                        width: fit-content !important;
                        margin-left: auto !important;
                        margin-right: auto !important;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
                    }
                    .ec-viewport, .carousel-viewport {
                        order: 1 !important;
                        border-radius: 14px !important;
                        overflow-x: hidden !important;
                        overflow-y: auto !important;
                        -webkit-overflow-scrolling: touch !important;
                        box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04) !important;
                        border: 1px solid #e2e8f0 !important;
                        background: #ffffff !important;
                        width: 100% !important;
                        min-height: 380px !important;
                        height: 520px !important;
                        max-height: 75vh !important;
                        padding: 12px !important;
                        box-sizing: border-box !important;
                    }
                    .ec-slide iframe, .ec-slide video, .ec-slide blockquote, .carousel-viewport iframe {
                        max-width: 100% !important;
                        width: 100% !important;
                        min-height: 380px !important;
                        border: 0 !important;
                        display: block !important;
                        margin: 0 auto !important;
                    }
                    .carousel-counter {
                        display: none !important;
                    }

                    /* --- EMBED ROW STYLES --- */
                    .embed-scroll-container, [class*="embed-scroll"] {
                        width: 100% !important;
                        overflow-x: auto !important;
                        overflow-y: hidden !important;
                        padding: 16px !important;
                        box-sizing: border-box !important;
                        -webkit-overflow-scrolling: touch !important;
                    }
                    .embed-row-wrapper, [class*="embed-row-wrapper"] {
                        display: grid !important;
                        align-items: start !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    @media (min-width: 769px) {
                        .embed-row-wrapper:has(> .embed-row-item:only-child),
                        .embed-row-wrapper.is-single,
                        .masonry-wrapper:has(> .masonry-item:only-child),
                        .masonry-wrapper.is-single {
                            max-width: 50% !important;
                            margin-left: auto !important;
                            margin-right: auto !important;
                        }
                    }
                    @media (max-width: 768px) {
                        .embed-row-wrapper:has(> .embed-row-item:only-child),
                        .embed-row-wrapper.is-single,
                        .masonry-wrapper:has(> .masonry-item:only-child),
                        .masonry-wrapper.is-single {
                            max-width: 100% !important;
                        }
                    }
                    .embed-row-item, [class*="embed-row-item"] {
                        box-sizing: border-box !important;
                        border-radius: 14px !important;
                        background: #ffffff !important;
                        border: 1px solid #e2e8f0 !important;
                        box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02) !important;
                        padding: 12px !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: flex-start !important;
                        min-width: 240px !important;
                        min-height: 200px !important;
                        max-width: 100% !important;
                        resize: both !important;
                        overflow: auto !important;
                        transition: box-shadow 0.2s ease !important;
                    }
                    .embed-row-item:hover {
                        box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 3px 8px -2px rgba(0, 0, 0, 0.04) !important;
                    }
                    .embed-row-item iframe, .embed-row-item video, .embed-row-item blockquote, .embed-row-item img {
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 auto !important;
                        border: 0 !important;
                        border-radius: 8px !important;
                        display: block !important;
                    }

                    /* --- EMBED MASONRY STYLES --- */
                    .masonry-scroll-container, [class*="masonry-scroll"] {
                        width: 100% !important;
                        overflow-x: auto !important;
                        padding: 16px !important;
                        box-sizing: border-box !important;
                        -webkit-overflow-scrolling: touch !important;
                    }
                    .masonry-wrapper, [class*="masonry-wrapper"] {
                        width: 100% !important;
                        box-sizing: border-box !important;
                        margin: 0 auto !important;
                    }
                    .masonry-item, [class*="masonry-item"] {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        -webkit-column-break-inside: avoid !important;
                        display: inline-block !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        border-radius: 14px !important;
                        background: #ffffff !important;
                        border: 1px solid #e2e8f0 !important;
                        box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02) !important;
                        padding: 12px !important;
                        margin-bottom: 20px !important;
                        min-width: 240px !important;
                        min-height: 200px !important;
                        max-width: 100% !important;
                        resize: both !important;
                        overflow: auto !important;
                        transition: box-shadow 0.2s ease !important;
                    }
                    .masonry-item:hover {
                        box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 3px 8px -2px rgba(0, 0, 0, 0.04) !important;
                    }
                    .masonry-item iframe, .masonry-item video, .masonry-item blockquote, .masonry-item img {
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 auto !important;
                        border: 0 !important;
                        border-radius: 8px !important;
                        display: block !important;
                    }
                    .ec-viewport, [class*="ec-viewport"], .carousel-viewport {
                        resize: both !important;
                        overflow: auto !important;
                    }

                    /* Scrollbars */
                    ::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                    }
                    ::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 9999px;
                    }
                    ::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 9999px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
                    }
                `;
                iframeDoc.head?.appendChild(style);

                // Ensure scroll position is at the very top (0, 0)
                if (iframe.contentWindow) {
                    iframe.contentWindow.scrollTo(0, 0);
                }
                if (iframeDoc.documentElement) {
                    iframeDoc.documentElement.scrollTop = 0;
                    iframeDoc.documentElement.style.overflowX = 'auto';
                }
                if (iframeDoc.body) {
                    iframeDoc.body.scrollTop = 0;
                    iframeDoc.body.style.overflowX = 'auto';
                }

                // Calculate scroll height to prevent internal clipping
                const updateHeight = () => {
                    try {
                        const bodyHeight = iframeDoc.body ? iframeDoc.body.scrollHeight : 0;
                        const docHeight = iframeDoc.documentElement ? iframeDoc.documentElement.scrollHeight : 0;
                        const detectedHeight = Math.max(bodyHeight, docHeight, 600);

                        if (detectedHeight > 0 && heightMode === 'auto') {
                            setIframeHeight(Math.min(detectedHeight + 36, 2800));
                        }
                    } catch (e) {}
                };

                updateHeight();
                // Re-measure after async widgets (Twitter, Instagram, TikTok, YouTube) finish rendering
                setTimeout(updateHeight, 350);
                setTimeout(updateHeight, 800);
                setTimeout(updateHeight, 1600);
            }
        } catch (err) {
            // Sandboxed fallback
            console.debug('Iframe height auto-calc notice:', err);
        }
    }, [heightMode]);

    // Handle ESC key to exit fullscreen modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Open in New Window safely via Blob URL
    const handleOpenInNewWindow = () => {
        try {
            const blob = new Blob([processedContent], { type: 'text/html;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const newWindow = window.open(blobUrl, '_blank');
            if (newWindow) {
                newWindow.focus();
            }
        } catch {
            const newWin = window.open();
            if (newWin) {
                newWin.document.open();
                newWin.document.write(processedContent);
                newWin.document.close();
            }
        }
    };

    // Copy Raw HTML source
    const handleCopyHtml = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(processedContent);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = processedContent;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy HTML:', err);
        }
    };

    // Determine current display height for inline mode
    const currentHeight = heightMode === 'auto' ? `${iframeHeight}px` : `${heightMode}px`;

    // Determine viewport container width for fullscreen mode
    const getViewportWidthClass = () => {
        switch (viewportMode) {
            case 'mobile':
                return 'max-w-[420px]';
            case 'tablet':
                return 'max-w-[768px]';
            case 'desktop':
            default:
                return 'w-full max-w-[1300px]';
        }
    };

    return (
        <div className="social-post-html-preview rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/80 shadow-xs bg-white dark:bg-gray-900 transition-all">
            {/* macOS Styled Top Header */}
            <div className="bg-slate-900 text-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
                {/* Left: Window Dots & Title */}
                <div className="flex items-center space-x-2.5">
                    <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-inner"></span>
                        <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-inner"></span>
                        <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-inner"></span>
                    </div>
                    <div className="h-4 w-px bg-slate-700 mx-1"></div>
                    <div className="flex items-center space-x-1.5">
                        <FontAwesomeIcon icon={faHtml5} className="text-orange-500 text-sm" />
                        <span className="text-xs font-semibold text-gray-200 tracking-wide">
                            {title}
                        </span>
                    </div>
                </div>

                {/* Right: Controls & Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {/* Height Presets Selector */}
                    <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-[11px]">
                        <button
                            type="button"
                            onClick={() => {
                                setHeightMode('auto');
                                if (iframeRef.current) handleIframeLoad(iframeRef.current);
                            }}
                            className={`px-2 py-0.5 rounded-md transition-colors ${
                                heightMode === 'auto'
                                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                            title="Auto-expand height to fit content without scrollbars"
                        >
                            Auto-fit
                        </button>
                        <button
                            type="button"
                            onClick={() => setHeightMode('600')}
                            className={`px-2 py-0.5 rounded-md transition-colors ${
                                heightMode === '600'
                                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                            title="Fixed 600px height"
                        >
                            600px
                        </button>
                        <button
                            type="button"
                            onClick={() => setHeightMode('900')}
                            className={`px-2 py-0.5 rounded-md transition-colors ${
                                heightMode === '900'
                                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                            title="Fixed 900px height"
                        >
                            900px
                        </button>
                    </div>

                    {/* Copy HTML Source */}
                    <button
                        type="button"
                        onClick={handleCopyHtml}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                        title="Copy raw HTML source"
                    >
                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={copied ? 'text-emerald-400' : 'text-gray-400'} />
                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Download HTML */}
                    <a
                        href={`data:text/html;charset=utf-8,${encodeURIComponent(processedContent)}`}
                        download={filename}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                        title="Download HTML file"
                    >
                        <FontAwesomeIcon icon={faDownload} className="text-xs" />
                        <span className="hidden sm:inline">Download</span>
                    </a>

                    {/* Open in New Window */}
                    <button
                        type="button"
                        onClick={handleOpenInNewWindow}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                        title="Open interactive preview in full browser tab"
                    >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                        <span className="hidden sm:inline">Open Tab</span>
                    </button>

                    {/* Fullscreen Modal View Button */}
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(true)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Expand preview to full screen modal"
                    >
                        <FontAwesomeIcon icon={faExpand} className="text-xs" />
                        <span className="hidden sm:inline">Expand</span>
                    </button>
                </div>
            </div>

            {/* Main Interactive Iframe Container */}
            <div className="w-full bg-white relative overflow-x-auto">
                <iframe
                    key={`inline-iframe-${refreshKey}`}
                    ref={iframeRef}
                    srcDoc={processedContent}
                    title={title}
                    onLoad={() => handleIframeLoad(iframeRef.current)}
                    className="w-full border-0 block"
                    style={{
                        height: currentHeight,
                        minHeight: '550px',
                        backgroundColor: '#ffffff',
                        overflowX: 'auto',
                        overflowY: 'auto',
                    }}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation allow-top-navigation-by-user-activation allow-downloads"
                />
            </div>

            {/* FULLSCREEN MODAL PREVIEW OVERLAY */}
            {isFullscreen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-2 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setIsFullscreen(false)}
                >
                    <div 
                        className="flex flex-col w-full h-full bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1.5">
                                    <button 
                                        type="button"
                                        onClick={() => setIsFullscreen(false)} 
                                        className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:opacity-80 transition-opacity"
                                        title="Close"
                                    />
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></span>
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></span>
                                </div>
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                    <FontAwesomeIcon icon={faHtml5} className="text-orange-500" />
                                    <span>Full HTML Preview Mode</span>
                                </span>
                            </div>

                            {/* Viewport Width Switchers */}
                            <div className="hidden md:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setViewportMode('desktop')}
                                    className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                                        viewportMode === 'desktop'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faDesktop} />
                                    <span>Desktop</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewportMode('tablet')}
                                    className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                                        viewportMode === 'tablet'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faTabletAlt} />
                                    <span>Tablet</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewportMode('mobile')}
                                    className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                                        viewportMode === 'mobile'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faMobileAlt} />
                                    <span>Mobile</span>
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRefreshKey((k) => k + 1)}
                                    className="p-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors"
                                    title="Reload Preview"
                                >
                                    <FontAwesomeIcon icon={faRedo} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenInNewWindow}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 font-medium border border-slate-700"
                                >
                                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                                    <span>Open New Tab</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsFullscreen(false)}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    <span>Close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body with responsive container */}
                        <div className="flex-1 bg-slate-900/90 p-3 sm:p-6 overflow-auto flex items-start justify-center">
                            <div className={`w-full ${getViewportWidthClass()} h-full min-h-[500px] bg-white rounded-xl overflow-auto shadow-2xl transition-all duration-300 border border-slate-700`}>
                                <iframe
                                    key={`modal-iframe-${refreshKey}`}
                                    ref={fullscreenIframeRef}
                                    srcDoc={processedContent}
                                    title={`${title} Fullscreen`}
                                    onLoad={() => handleIframeLoad(fullscreenIframeRef.current)}
                                    className="w-full h-full min-h-[600px] border-0"
                                    style={{ backgroundColor: '#ffffff', overflowX: 'auto', overflowY: 'auto' }}
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation allow-top-navigation-by-user-activation allow-downloads"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HtmlDocPreview;
