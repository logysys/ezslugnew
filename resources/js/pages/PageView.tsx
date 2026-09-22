import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
    ArrowLeft, 
    FileCode, 
    AlertCircle, 
    ShieldCheck, 
    Globe,
    Copy,
    CheckCircle2,
    ExternalLink,
    RefreshCw,
    Shield,
    Eye,
    Code2,
    Sparkles,
} from 'lucide-react';
import DraggableMenu from '@/components/DraggableMenu';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface PageData {
    id: number;
    slug: string;
    title: string;
    hasSecrets: boolean;
    restoredHtml: string | null;
    createdAt: string;
    updatedAt: string;
}

interface PageViewProps {
    page?: PageData;
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
    tooltips?: Record<string, string>;
}

export default function PageView({ page: propPage, auth = { user: null }, tooltips = {} }: PageViewProps) {
    // Get page from props or from Inertia page props
    const { page: inertiaPage } = usePage<{ page?: PageData }>();
    const page = propPage || inertiaPage?.page;
    
    const htmlContainerRef = useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showSecretsWarning, setShowSecretsWarning] = useState(false);
    const [pageUrl, setPageUrl] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Helper function to get tooltip
    const t = useCallback((key: string, fallback: string, replacements?: Record<string, string | number>): string => {
        let tooltip = tooltips?.[key] || fallback;
        if (replacements) {
            for (const [k, v] of Object.entries(replacements)) {
                tooltip = tooltip.replace(new RegExp(`{${k}}`, 'g'), String(v));
            }
        }
        return tooltip;
    }, [tooltips]);

    // Set page URL on mount
    useEffect(() => {
        if (page?.slug) {
            setPageUrl(`${window.location.origin}/page/${page.slug}`);
        }
    }, [page?.slug]);

    // Copy URL to clipboard
    const copyUrl = useCallback(async () => {
        if (!pageUrl) return;
        
        try {
            await navigator.clipboard.writeText(pageUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [pageUrl]);

    // Toggle fullscreen mode
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Inject HTML into DOM
    useEffect(() => {
        if (!page?.restoredHtml || !htmlContainerRef.current) return;

        setRenderError(null);

        try {
            const container = htmlContainerRef.current;
            const html = page.restoredHtml;
            
            // Clear container
            container.innerHTML = '';

            // Check if it's a full HTML document or just a fragment
            const isFullDoc = html.trim().toLowerCase().startsWith('<!doctype') ||
                              html.trim().toLowerCase().startsWith('<html');

            if (isFullDoc) {
                // Extract and apply styles from head
                const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
                if (headMatch) {
                    const headContent = headMatch[1];
                    
                    // Extract style tags
                    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
                    let styleMatch;
                    while ((styleMatch = styleRegex.exec(headContent)) !== null) {
                        const styleEl = document.createElement('style');
                        styleEl.textContent = styleMatch[1];
                        container.appendChild(styleEl);
                    }
                    
                    // Extract link tags (CSS)
                    const linkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
                    let linkMatch;
                    while ((linkMatch = linkRegex.exec(headContent)) !== null) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = linkMatch[0];
                        const linkEl = tempDiv.firstChild;
                        if (linkEl) container.appendChild(linkEl);
                    }
                    
                    // Extract and apply meta tags
                    const metaRegex = /<meta[^>]*>/gi;
                    let metaMatch;
                    while ((metaMatch = metaRegex.exec(headContent)) !== null) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = metaMatch[0];
                        const metaEl = tempDiv.firstChild;
                        if (metaEl) container.appendChild(metaEl);
                    }
                    
                    // Extract base tag if exists
                    const baseMatch = headContent.match(/<base[^>]*>/i);
                    if (baseMatch) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = baseMatch[0];
                        const baseEl = tempDiv.firstChild;
                        if (baseEl) container.appendChild(baseEl);
                    }
                }

                // Extract body content
                const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                const bodyContent = bodyMatch ? bodyMatch[1] : html;
                
                // Set body content
                const bodyWrapper = document.createElement('div');
                bodyWrapper.innerHTML = bodyContent;
                container.appendChild(bodyWrapper);

                // Handle scripts - execute them in order
                const executeScripts = async () => {
                    const scripts = bodyWrapper.querySelectorAll('script');
                    for (const script of Array.from(scripts)) {
                        const newScript = document.createElement('script');
                        
                        // Copy all attributes
                        Array.from(script.attributes).forEach(attr => {
                            newScript.setAttribute(attr.name, attr.value);
                        });
                        
                        if (script.src) {
                            // External script - wait for it to load
                            await new Promise((resolve, reject) => {
                                newScript.onload = resolve;
                                newScript.onerror = reject;
                                newScript.src = script.src;
                                script.parentNode?.replaceChild(newScript, script);
                            });
                        } else {
                            // Inline script
                            newScript.textContent = script.textContent;
                            script.parentNode?.replaceChild(newScript, script);
                        }
                    }
                };
                
                executeScripts().catch(err => {
                    console.error('Script execution error:', err);
                    setRenderError(`Script error: ${err.message}`);
                });
            } else {
                // Simple HTML fragment - render directly
                container.innerHTML = html;

                // Execute any scripts
                const scripts = container.querySelectorAll('script');
                scripts.forEach((script) => {
                    const newScript = document.createElement('script');
                    if (script.type) newScript.type = script.type;
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    script.parentNode?.replaceChild(newScript, script);
                });
            }
        } catch (err) {
            console.error('HTML render error:', err);
            setRenderError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
    }, [page?.restoredHtml]);

    // Page not found
    if (!page) {
        return (
            <>
                <Tooltip id="pageview-tooltip" place="top" className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg" effect="solid" />
                <DraggableMenu auth={auth} />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('pageview_not_found', 'Page Not Found')}
                        </h1>
                        <p className="text-gray-500 mb-6">
                            {t('pageview_not_found_desc', 'The page you\'re looking for doesn\'t exist or has been removed.')}
                        </p>
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('pageview_back_home', 'Back to Home')}
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`${page.title}`} />
            
            
                <div
                    ref={htmlContainerRef}
                    className="w-full min-h-screen"
                />

        </>
    );
}

// Helper function to escape HTML for source view
function escapeHtml(html: string): string {
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Add Head import at the top
import { Head } from '@inertiajs/react';