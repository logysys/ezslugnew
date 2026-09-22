import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSave, 
    faTimes, 
    faCheckCircle, 
    faExclamationTriangle,
    faSearch,
    faHandPointer,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface SEOModalProps {
    isOpen: boolean;
    onClose: () => void;
    funnelId: number;
    funnelToken: string;
    onSaveSuccess?: () => void;
}

interface SeoData {
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
    metaLogo: string;
    metaSiteName: string;
    metaSiteUrl: string;
}

// Loading Spinner component matching AIHistory
const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-yellow-400">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const SEOModal: React.FC<SEOModalProps> = ({
    isOpen,
    onClose,
    funnelId,
    funnelToken,
    onSaveSuccess
}) => {
    const [seoData, setSeoData] = useState<SeoData>({
        metaTitle: '',
        metaKeywords: '',
        metaDescription: '',
        metaLogo: '',
        metaSiteName: '',
        metaSiteUrl: `https://ez.wiki/${funnelToken}`
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [seoPreview, setSeoPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && funnelId) {
            fetchSEOData();
        }
    }, [isOpen, funnelId]);

    const fetchSEOData = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await axios.get(`/get-funnel-seo/${funnelId}`);
            const existingSeo = response.data;
            
            setSeoData({
                metaTitle: existingSeo.meta_title || '',
                metaKeywords: existingSeo.meta_keywords || '',
                metaDescription: existingSeo.meta_description || '',
                metaLogo: existingSeo.meta_logo || '',
                metaSiteName: existingSeo.meta_site_name || '',
                metaSiteUrl: existingSeo.meta_site_url || `https://ez.wiki/${funnelToken}`
            });
        } catch (error) {
            console.error('Error fetching SEO data:', error);
            setSeoData({
                metaTitle: '',
                metaKeywords: '',
                metaDescription: '',
                metaLogo: '',
                metaSiteName: '',
                metaSiteUrl: `https://ez.wiki/${funnelToken}`
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setIsSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await axios.put('/update-funnel-seo', {
                funnelId: funnelId,
                metaTitle: seoData.metaTitle,
                metaKeywords: seoData.metaKeywords,
                metaDescription: seoData.metaDescription,
                metaLogo: seoData.metaLogo,
                metaSiteName: seoData.metaSiteName,
                metaSiteUrl: seoData.metaSiteUrl
            });

            setSuccessMessage('SEO settings updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            
            if (response.data.seo) {
                setSeoData({
                    metaTitle: response.data.seo.meta_title || '',
                    metaKeywords: response.data.seo.meta_keywords || '',
                    metaDescription: response.data.seo.meta_description || '',
                    metaLogo: response.data.seo.meta_logo || '',
                    metaSiteName: response.data.seo.meta_site_name || '',
                    metaSiteUrl: response.data.seo.meta_site_url || `https://ez.wiki/${funnelToken}`
                });
            }
            
            if (onSaveSuccess) onSaveSuccess();
        } catch (error: any) {
            console.error('SEO update error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to update SEO settings. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
            setIsSaving(false);
        }
    };

    // Dark theme preview matching the page style
    const renderSeoPreview = () => {
        return (
            <div className="bg-gray-700/50 text-gray-100 p-4 rounded-xl border border-gray-600 max-w-md mx-auto mt-4">
                <div className="border-b border-gray-600 pb-2 mb-2">
                    <h3 className="text-blue-400 text-lg font-medium truncate">
                        {seoData.metaTitle || 'Your Page Title'}
                    </h3>
                    <p className="text-green-400 text-sm truncate">
                        {seoData.metaSiteUrl || 'https://example.com'}
                    </p>
                </div>
                <p className="text-gray-300 text-sm line-clamp-3">
                    {seoData.metaDescription || 'This is a preview of how your page might appear in search results.'}
                </p>
                {seoData.metaLogo && (
                    <div className="mt-2">
                        <img 
                            src={seoData.metaLogo} 
                            alt="Site Logo" 
                            className="h-16 w-16 object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                {/* Header - Dark theme matching AIHistory */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">SEO Settings</h3>
                            <p className="text-sm text-gray-400">
                                {funnelToken ? `Funnel: ${funnelToken}` : 'Optimize your funnel for search engines'}
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

                {/* Content - Dark theme */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="inline-flex items-center gap-3 text-gray-400">
                                <LoadingSpinner size={24} />
                                <span className="text-sm font-medium text-gray-300">Loading SEO settings...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Success/Error Messages - Dark theme */}
                            {successMessage && (
                                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
                                    <span>{successMessage}</span>
                                </div>
                            )}
                            {errorMessage && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {seoPreview && renderSeoPreview()}

                            <form onSubmit={handleSeoSubmit} className="space-y-5">
                                {/* Meta Title - Dark theme */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-1.5">
                                        Meta Title <span className="text-xs font-normal text-gray-500">(60 characters max)</span>
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="Page title that appears in search results" 
                                            className="w-full px-4 py-2.5 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder:text-gray-500"
                                            value={seoData.metaTitle}
                                            onChange={(e) => setSeoData({...seoData, metaTitle: e.target.value})}
                                            maxLength={60}
                                            data-tooltip-id="seo-tooltip"
                                            data-tooltip-content="This is the main title shown in search engine results."
                                        />
                                        <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                                            {seoData.metaTitle.length}/60
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Keywords - Dark theme */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-1.5">
                                        Meta Keywords <span className="text-xs font-normal text-gray-500">(Comma separated)</span>
                                    </label>
                                    <textarea 
                                        placeholder="keywords, for, search, engines" 
                                        className="w-full px-4 py-2.5 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder:text-gray-500 h-20 resize-none"
                                        value={seoData.metaKeywords}
                                        onChange={(e) => setSeoData({...seoData, metaKeywords: e.target.value})}
                                        data-tooltip-id="seo-tooltip"
                                        data-tooltip-content="Enter relevant keywords separated by commas."
                                    />
                                </div>

                                {/* Meta Description - Dark theme */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-1.5">
                                        Meta Description <span className="text-xs font-normal text-gray-500">(160 characters max)</span>
                                    </label>
                                    <div className="relative">
                                        <textarea 
                                            placeholder="Brief description that appears in search results" 
                                            className="w-full px-4 py-2.5 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder:text-gray-500 h-20 resize-none"
                                            value={seoData.metaDescription}
                                            onChange={(e) => setSeoData({...seoData, metaDescription: e.target.value})}
                                            maxLength={160}
                                            data-tooltip-id="seo-tooltip"
                                            data-tooltip-content="This summary appears below the title in search results."
                                        />
                                        <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                                            {seoData.metaDescription.length}/160
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Logo - Dark theme */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-1.5">
                                        Meta Logo URL <span className="text-xs font-normal text-gray-500">(Recommended: 1200x630px)</span>
                                    </label>
                                    <input 
                                        type="url" 
                                        placeholder="https://example.com/logo.png" 
                                        className="w-full px-4 py-2.5 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder:text-gray-500"
                                        value={seoData.metaLogo}
                                        onChange={(e) => setSeoData({...seoData, metaLogo: e.target.value})}
                                        data-tooltip-id="seo-tooltip"
                                        data-tooltip-content="URL of the image to show in social media shares."
                                    />
                                    {seoData.metaLogo && (
                                        <div className="mt-2 p-2 bg-gray-700/30 rounded-lg border border-gray-600">
                                            <img 
                                                src={seoData.metaLogo} 
                                                alt="Logo Preview" 
                                                className="max-h-16 max-w-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Meta Site Name - Dark theme */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-1.5">
                                        Site/Brand Name
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Your brand or company name" 
                                        className="w-full px-4 py-2.5 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder:text-gray-500"
                                        value={seoData.metaSiteName}
                                        onChange={(e) => setSeoData({...seoData, metaSiteName: e.target.value})}
                                        data-tooltip-id="seo-tooltip"
                                        data-tooltip-content="The name of your site or brand."
                                    />
                                </div>

                                {/* Meta Site Url - Dark theme */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-1.5">
                                        Canonical URL
                                    </label>
                                    <input 
                                        type="url" 
                                        placeholder="https://example.com" 
                                        className="w-full px-4 py-2.5 bg-gray-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 placeholder:text-gray-500"
                                        value={seoData.metaSiteUrl}
                                        onChange={(e) => setSeoData({...seoData, metaSiteUrl: e.target.value})}
                                        data-tooltip-id="seo-tooltip"
                                        data-tooltip-content="The primary URL for this page."
                                    />
                                </div>

                                {/* Action Buttons - Dark theme matching AIHistory */}
                                <div className="flex justify-between pt-4 border-t border-gray-700">
                                    <button 
                                        type="button" 
                                        onClick={() => setSeoPreview(!seoPreview)}
                                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 border border-blue-500/30"
                                        data-tooltip-id="seo-tooltip"
                                        data-tooltip-content="See how your SEO info will look in search results"
                                    >
                                        <FontAwesomeIcon icon={faSearch} className="text-sm" />
                                        {seoPreview ? 'Hide Preview' : 'Show Preview'}
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-yellow-400/20"
                                        disabled={isSubmitting}
                                        data-tooltip-id="seo-tooltip"
                                        data-tooltip-content="Save your SEO settings"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <LoadingSpinner size={16} />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faSave} className="text-sm" />
                                                Save SEO Settings
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
            <Tooltip id="seo-tooltip" place="top" className="!bg-gray-800 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[200] !shadow-xl border !border-gray-700" effect="solid" />
        </div>
    );
};

export default SEOModal;