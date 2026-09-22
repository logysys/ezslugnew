import { useState, useCallback, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Upload as UploadIcon, 
    FileCode, 
    ArrowLeft, 
    Loader2, 
    CheckCircle2,
    Copy,
    ExternalLink, 
    Type, 
    Sparkles,
    AlertCircle
} from 'lucide-react';
import DraggableMenu from '@/components/DraggableMenu';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface GeneratePageProps {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
    tooltips?: Record<string, string>;
}

export default function GeneratePage({ auth = { user: null }, tooltips = {} }: GeneratePageProps) {
    const [title, setTitle] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [customSlug, setCustomSlug] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
    const [useAI, setUseAI] = useState(false);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = (file: File) => {
        if (!file.name.endsWith('.html') && file.type !== 'text/html') {
            setError(t('generate_page_invalid_file', 'Please upload an HTML file'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setHtmlContent(content);
            setError(null);
            
            // Extract title from HTML
            const match = content.match(/<title[^>]*>([^<]*)<\/title>/i);
            if (match?.[1]?.trim()) {
                setTitle(match[1].trim());
            } else {
                setTitle(file.name.replace('.html', '').replace('.htm', ''));
            }
        };
        reader.onerror = () => {
            setError(t('generate_page_read_error', 'Error reading file'));
        };
        reader.readAsText(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            processFile(e.target.files[0]);
        }
    }, []);

    const clearFile = () => {
        setHtmlContent('');
        setTitle('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAIConversion = async () => {
        if (!htmlContent.trim()) {
            setError(t('generate_page_no_html', 'Please provide HTML content first'));
            return;
        }

        if (!title.trim()) {
            setError(t('generate_page_no_title', 'Please enter a title'));
            return;
        }

        setAiProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/pages/ai-convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    htmlContent: htmlContent,
                    title: title,
                }),
            });

            const data = await response.json();
            
            if (data.success && data.reactCode) {
                setAiResult(data.reactCode);
                setUseAI(true);
            } else {
                setError(data.error || t('generate_page_ai_failed', 'AI conversion failed. Please try again.'));
            }
        } catch (err) {
            console.error('AI conversion error:', err);
            setError(t('generate_page_ai_error', 'Network error during AI conversion'));
        } finally {
            setAiProcessing(false);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError(t('generate_page_title_required', 'Please enter a page title'));
            return;
        }
        
        if (!htmlContent.trim()) {
            setError(t('generate_page_html_required', 'Please provide HTML content'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/pages-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    htmlContent: htmlContent.trim(),
                    customSlug: customSlug.trim() || undefined,
                    useAI: useAI && aiResult ? true : false,
                    reactCode: useAI && aiResult ? aiResult : undefined,
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setGeneratedSlug(data.slug);
                // Clear form
                setTitle('');
                setHtmlContent('');
                setCustomSlug('');
                setUseAI(false);
                setAiResult(null);
            } else {
                setError(data.error || t('generate_page_failed', 'Failed to create page'));
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError(t('generate_page_network_error', 'Network error. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const copyUrl = (text: string) => {
        navigator.clipboard.writeText(text);
        // You might want to show a toast notification here
        alert(t('generate_page_copied', 'Copied to clipboard!'));
    };

    const startNewUpload = () => {
        setGeneratedSlug(null);
        setTitle('');
        setHtmlContent('');
        setCustomSlug('');
        setUseAI(false);
        setAiResult(null);
        setError(null);
        setActiveTab('upload');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Success screen
    if (generatedSlug) {
        const pageUrl = `${window.location.origin}/page/${generatedSlug}`;
        return (
            <>
                <Head title={t('generate_page_success_title', 'Page Created - ezbar.ai')} />
                <Tooltip id="generate-tooltip" place="top" className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg" effect="solid" />
                <DraggableMenu auth={auth} />
                <div className="min-h-screen bg-[#FCFCFC]">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 mb-8 hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> 
                            {t('generate_page_back', 'Back to Home')}
                        </Link>
                        
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {t('generate_page_created', 'Page Created Successfully!')}
                                </h2>
                                <p className="text-gray-500 mb-6">
                                    {t('generate_page_live', 'Your page is now live and ready to be shared.')}
                                </p>
                                
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6 text-left">
                                    <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                                        {t('generate_page_url_label', 'Page URL')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-sm font-mono text-green-600 truncate bg-white px-3 py-2 rounded-lg border border-gray-200">
                                            {pageUrl}
                                        </code>
                                        <button 
                                            onClick={() => copyUrl(pageUrl)} 
                                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                                            data-tooltip-id="generate-tooltip"
                                            data-tooltip-content={t('generate_page_copy_url', 'Copy URL to clipboard')}
                                        >
                                            <Copy className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 justify-center flex-wrap">
                                    <a 
                                        href={`/page/${generatedSlug}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                                        data-tooltip-id="generate-tooltip"
                                        data-tooltip-content={t('generate_page_view_page', 'View your published page')}
                                    >
                                        <ExternalLink className="w-4 h-4" /> 
                                        {t('generate_page_view_page', 'View Page')}
                                    </a>
                                    
                                    <button 
                                        onClick={startNewUpload}
                                        className="inline-flex items-center gap-2 border-2 border-gray-300 hover:border-green-500 bg-white hover:bg-green-50 px-6 py-3 rounded-xl font-medium transition-all duration-200"
                                        data-tooltip-id="generate-tooltip"
                                        data-tooltip-content={t('generate_page_upload_another', 'Create another page')}
                                    >
                                        <UploadIcon className="w-4 h-4 text-gray-600" /> 
                                        {t('generate_page_upload_another', 'Upload Another')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                                <p className="text-xs text-gray-500">
                                    {t('generate_page_powered_by', 'Powered by ezbar.ai • Your page is publicly accessible')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Main form
    return (
        <>
            <Head title={t('generate_page_title', 'Generate HTML Page - ezbar.ai')} />
            <Tooltip id="generate-tooltip" place="top" className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg" effect="solid" />
            <DraggableMenu auth={auth} />
            <div className="min-h-screen bg-[#FCFCFC] pb-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-600 mb-6 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> 
                        {t('generate_page_back', 'Back to Home')}
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                            {t('generate_page_heading', 'Generate HTML Page')}
                        </h1>
                        <p className="text-gray-500">
                            {t('generate_page_description', 'Upload your HTML file or paste the code. We\'ll process it and create a live page.')}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                            <button 
                                onClick={() => setError(null)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6 6 18"/>
                                    <path d="m6 6 12 12"/>
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Title Input */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700">
                                <Type className="w-4 h-4 text-green-500" /> 
                                {t('generate_page_title_label', 'Page Title')}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder={t('generate_page_title_placeholder', 'Enter a title for your page')}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-gray-800"
                                data-tooltip-id="generate-tooltip"
                                data-tooltip-content={t('generate_page_title_tooltip', 'This will be used as the page title and SEO')}
                            />
                        </div>

                        {/* Custom Slug */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700">
                                <Sparkles className="w-4 h-4 text-green-500" /> 
                                {t('generate_page_slug_label', 'Custom Slug (Optional)')}
                            </label>
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                <span className="text-sm text-gray-500 whitespace-nowrap shrink-0 bg-gray-100 px-3 py-2 rounded-lg">
                                    {window.location.origin}/page/
                                </span>
                                <input
                                    type="text"
                                    placeholder={t('generate_page_slug_placeholder', 'auto-generated')}
                                    value={customSlug}
                                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-gray-800"
                                    data-tooltip-id="generate-tooltip"
                                    data-tooltip-content={t('generate_page_slug_tooltip', 'Custom URL slug (letters, numbers, hyphens only)')}
                                />
                            </div>
                            {customSlug && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {t('generate_page_slug_preview', 'Your page will be available at: {url}', { 
                                        url: `${window.location.origin}/page/${customSlug}` 
                                    })}
                                </p>
                            )}
                        </div>

                        {/* Upload Tabs */}
                        <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                            <div className="grid grid-cols-2 border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-200 ${
                                        activeTab === 'upload'
                                            ? 'bg-white text-green-600 border-b-2 border-green-600'
                                            : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                    data-tooltip-id="generate-tooltip"
                                    data-tooltip-content={t('generate_page_upload_tab', 'Upload HTML file from your computer')}
                                >
                                    <UploadIcon className="w-4 h-4" /> 
                                    {t('generate_page_upload_tab', 'File Upload')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('paste')}
                                    className={`flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-200 ${
                                        activeTab === 'paste'
                                            ? 'bg-white text-green-600 border-b-2 border-green-600'
                                            : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                    data-tooltip-id="generate-tooltip"
                                    data-tooltip-content={t('generate_page_paste_tab', 'Paste HTML code directly')}
                                >
                                    <FileCode className="w-4 h-4" /> 
                                    {t('generate_page_paste_tab', 'Paste Code')}
                                </button>
                            </div>

                            {/* Upload Tab */}
                            {activeTab === 'upload' && (
                                <div className="p-6">
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`
                                            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
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
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            {htmlContent ? (
                                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                                            ) : (
                                                <UploadIcon className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                        {htmlContent ? (
                                            <div>
                                                <p className="font-medium text-green-700 mb-1">
                                                    {t('generate_page_file_loaded', 'File loaded successfully!')}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {t('generate_page_click_replace', 'Click or drop to replace')}
                                                </p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                                                    className="text-xs text-red-500 mt-2 hover:underline"
                                                >
                                                    {t('generate_page_clear_file', 'Clear file')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-medium text-gray-700 mb-1">
                                                    {t('generate_page_drop_zone', 'Drop your HTML file here')}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {t('generate_page_or_click', 'or click to browse')}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {t('generate_page_supported', 'Supports .html, .htm')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Paste Tab */}
                            {activeTab === 'paste' && (
                                <div className="p-6">
                                    <textarea
                                        ref={textareaRef}
                                        placeholder={t('generate_page_paste_placeholder', `<!DOCTYPE html>
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
</html>`)}
                                        value={htmlContent}
                                        onChange={(e) => {
                                            setHtmlContent(e.target.value);
                                            if (!title) {
                                                const match = e.target.value.match(/<title[^>]*>([^<]*)<\/title>/i);
                                                if (match?.[1]?.trim()) {
                                                    setTitle(match[1].trim());
                                                }
                                            }
                                            setError(null);
                                        }}
                                        className="w-full min-h-[300px] px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 resize-y"
                                        data-tooltip-id="generate-tooltip"
                                        data-tooltip-content={t('generate_page_paste_tooltip', 'Paste your HTML code here')}
                                    />
                                </div>
                            )}
                        </div>

                        {/* AI Conversion Option - Premium Feature */}
                        {htmlContent && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-5 h-5 text-purple-600" />
                                            <label className="font-medium text-purple-900">
                                                {t('generate_page_ai_option', 'AI-Powered Conversion (Premium)')}
                                            </label>
                                            <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                                                {t('generate_page_coming_soon', 'Coming Soon')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-purple-700">
                                            {t('generate_page_ai_description', 'Convert your HTML to a React component with interactive features and dynamic behavior.')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleAIConversion}
                                        disabled={aiProcessing || true} // Disabled until feature is ready
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        data-tooltip-id="generate-tooltip"
                                        data-tooltip-content={t('generate_page_ai_tooltip', 'AI conversion will be available soon')}
                                    >
                                        {aiProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                                {t('generate_page_processing', 'Processing...')}
                                            </>
                                        ) : (
                                            t('generate_page_ai_convert', 'AI Convert (Beta)')
                                        )}
                                    </button>
                                </div>
                                
                                {aiResult && useAI && (
                                    <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-purple-600">
                                                {t('generate_page_ai_result', 'AI Conversion Result')}
                                            </span>
                                            <button
                                                onClick={() => setUseAI(false)}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                {t('generate_page_use_original', 'Use Original')}
                                            </button>
                                        </div>
                                        <pre className="text-xs text-gray-600 overflow-x-auto max-h-32">
                                            {aiResult.substring(0, 500)}...
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* HTML Preview */}
                        {htmlContent && (
                            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileCode className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {t('generate_page_preview', 'HTML Preview')}
                                        </span>
                                    </div>
                                    <span className="text-xs bg-white text-gray-600 px-2 py-1 rounded-md shadow-sm">
                                        {htmlContent.length.toLocaleString()} {t('generate_page_characters', 'characters')}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-48 overflow-y-auto text-gray-600 font-mono">
                                        {htmlContent.substring(0, 1000)}
                                        {htmlContent.length > 1000 && '\n\n<!-- ... truncated ... -->'}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 shadow-lg z-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-4">
                        {/* Info text */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm text-gray-600 truncate">
                                {title ? (
                                    <>
                                        <span className="font-medium text-gray-900">{title}</span>
                                        {htmlContent && (
                                            <span className="text-gray-400 ml-1">
                                                ({htmlContent.length.toLocaleString()} chars)
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-gray-400">
                                        {t('generate_page_ready', 'Ready to generate your page')}
                                    </span>
                                )}
                            </p>
                        </div>
                        
                        {/* Generate Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !title || !htmlContent}
                            className="shrink-0 px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg active:scale-95"
                            data-tooltip-id="generate-tooltip"
                            data-tooltip-content={
                                !title 
                                    ? t('generate_page_needs_title', 'Please enter a title')
                                    : !htmlContent
                                    ? t('generate_page_needs_html', 'Please provide HTML content')
                                    : t('generate_page_generate_tooltip', 'Generate your live page')
                            }
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="hidden sm:inline">{t('generate_page_generating', 'Generating...')}</span>
                                    <span className="sm:hidden">...</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 whitespace-nowrap">
                                    <Sparkles className="w-4 h-4 shrink-0" />
                                    <span>{t('generate_page_generate', 'Generate Page')}</span>
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </>
    );
}