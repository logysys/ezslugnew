import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faCheckCircle, 
    faExclamationTriangle,
    faPalette,
    faShoppingCart,
    faBolt,
    faReceipt,
    faTimes,
    faImage,
    faGlobe,
    faQuestionCircle,
    faXmark,
    faInfoCircle,
    faExternalLinkAlt,
    faFileAlt,
    faStar,
    faMobile,
    faPaintBrush,
    faRocket,
    faCode,
    faShield,
    faClock,
    faCoins,
    faUser,
    faHashtag
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type TemplateItem = {
    id: number;
    title: string;
    image: string;
    unique_id: string;
    description?: string;
    price: number;
    status: string;
    option?: string;
    created_at: string;
    updated_at: string;
    user_id?: number;
    user?: {
        id: number;
        email: string;
    };
};

type AuthData = {
    user?: {
        id: number;
        name: string;
        email: string;
    };
    balance?: {
        balance: number;
    };
};

type Filters = {
    min_price?: number;
    max_price?: number;
    search?: string;
};

type Pagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type TemplateListingsProps = {
    auth: AuthData;
    initialTemplates: TemplateItem[];
    initialPagination: Pagination;
    initialFilters?: Filters;
    onRental?: (templateId: number, price: number) => Promise<void>;
    showFilters?: boolean;
    currencySymbol?: string;
    themeCollections?: {[key: number]: {isInCollection: boolean, isThemeOwner: boolean}};
    onCheckCollection?: (email: string, templateId: number) => Promise<{isInCollection: boolean, isThemeOwner: boolean}>;
};

export default function TemplateListings({
    auth,
    initialTemplates,
    initialPagination,
    initialFilters = {},
    onRental,
    showFilters = true,
    currencySymbol = 'EZ$',
    themeCollections = {},
    onCheckCollection
}: TemplateListingsProps) {
    const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isRenting, setIsRenting] = useState(false);
    const [searchInput, setSearchInput] = useState(initialFilters.search || '');
    const [localThemeCollections, setLocalThemeCollections] = useState<{[key: number]: {isInCollection: boolean, isThemeOwner: boolean}}>(themeCollections);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sync with parent component's themeCollections
    useEffect(() => {
        setLocalThemeCollections(themeCollections);
    }, [themeCollections]);

    // Add this function to get the appropriate currency symbol
    const getCurrencySymbol = () => {
        return auth.user ? 'EZ$' : 'US$';
    };

    // New function to format the price with commas
    const formatPrice = (price: number) => {
        const currency = getCurrencySymbol();
        return `${currency}${price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Apply filters with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                setFilters(prev => ({ ...prev, search: searchInput }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch data when filters change
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(route('templatemarketplace.loadmore'), {
                    params: {
                        ...filters,
                        page: 1
                    }
                });

                setTemplates(response.data.templates);
                setPagination(response.data.pagination);
                
                // Reset local collections when templates change
                setLocalThemeCollections({});
            } catch (error) {
                console.error('Error fetching Themes:', error);
                setErrorMessage('Failed to load Themes. Please try again.');
                setTimeout(() => setErrorMessage(''), 5000);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [filters]);

    const loadMore = async () => {
        if (isLoadingMore || pagination.current_page >= pagination.last_page) return;
        
        setIsLoadingMore(true);
        try {
            const nextPage = pagination.current_page + 1;
            const response = await axios.get(route('templatemarketplace.loadmore'), {
                params: {
                    ...filters,
                    page: nextPage
                }
            });

            setTemplates(prev => [...prev, ...response.data.templates]);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error loading more Themes:', error);
            setErrorMessage('Failed to load more Themes. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Add this function to check collection status for a template
    const getCollectionStatus = (templateId: number) => {
        return localThemeCollections[templateId] || { isInCollection: false, isThemeOwner: false };
    };

    // Update the handleRental function to check collection status
    const handleRental = async (templateId: number, price: number) => {
        // Check collection status first
        let collectionStatus = getCollectionStatus(templateId);
        
        // If we have an email but no collection data, try to check
        if (auth.user?.email && (!collectionStatus.isInCollection && !collectionStatus.isThemeOwner) && onCheckCollection) {
            try {
                collectionStatus = await onCheckCollection(auth.user.email, templateId);
                // Update local state
                setLocalThemeCollections(prev => ({
                    ...prev,
                    [templateId]: collectionStatus
                }));
            } catch (error) {
                console.error('Error checking collection:', error);
            }
        }

        // If already in collection or user is owner, show message and return
        if (collectionStatus.isInCollection || collectionStatus.isThemeOwner) {
            setErrorMessage('You already own or have this theme in your collection!');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        setIsRenting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            if (onRental) {
                await onRental(templateId, price);
                // Remove from local state if rental is successful
                setTemplates(prev => prev.filter(t => t.id !== templateId));
            } else {
                const response = await axios.post(route('templatemarketplace.rental'), {
                    template_id: templateId
                });

                if (response.data.success) {
                    setSuccessMessage(
                        `Rental successful! ${response.data.invoice_number ? 
                        `Invoice #${response.data.invoice_number}` : ''}`
                    );
                    setTemplates(prev => prev.filter(t => t.id !== templateId));
                    // Refresh the list
                    const refreshResponse = await axios.get(route('templatemarketplace.loadmore'), {
                        params: {
                            ...filters,
                            page: 1
                        }
                    });
                    setTemplates(refreshResponse.data.templates);
                    setPagination(refreshResponse.data.pagination);
                } else {
                    throw new Error(response.data.message || 'Rental failed');
                }
            }
        } catch (error) {
            let errorMessage = 'An error occurred during rental';
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || 
                              error.response?.data?.error || 
                              error.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            setErrorMessage(errorMessage);
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsRenting(false);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    };

    const clearFilters = () => {
        setFilters({});
        setSearchInput('');
    };

    const handleExplainTheme = (template: TemplateItem) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTemplate(null);
    };

    const hasActiveFilters = filters.search || filters.min_price || filters.max_price;

    const getImageUrl = (template: TemplateItem) => {
        const imgPath = template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        return `${imgPath}${template.image}`;
    };

    return (
        <div className="space-y-6">
            <Tooltip id="template-tooltip" />
            <Tooltip id="action-tooltip" />
            <style>{`
                .react-tooltip {
                    z-index: 99999 !important;
                    opacity: 1 !important;
                    font-size: 12px;
                    padding: 4px 8px;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slide-up {
                    from { 
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                
                .animate-slide-up {
                    animation: slide-up 0.4s ease-out;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
            `}</style>

            {/* Theme Explanation Modal */}
            {isModalOpen && selectedTemplate && (
                <div 
                    className="fixed inset-0 flex justify-center z-[9999] p-4 backdrop-blur-sm animate-fade-in"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="theme-modal-title"
                >
                    <div 
                        className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-gray-600 shadow-2xl transform transition-all duration-300 scale-100 animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-start p-6 border-b border-gray-700 bg-gray-900/50">
                            <div className="flex items-start space-x-4 flex-1 min-w-0">
                                <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ring-purple-400/30">
                                    <FontAwesomeIcon icon={faPalette} className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 
                                        id="theme-modal-title"
                                        className="text-2xl font-bold text-white truncate pr-8" 
                                        title={selectedTemplate.title}
                                    >
                                        {selectedTemplate.title}
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1 flex items-center">
                                        <FontAwesomeIcon icon={faInfoCircle} className="h-3 w-3 mr-1" />
                                        Theme Details & Description
                                    </p>
                                    {selectedTemplate.description && (
                                        <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                                            {selectedTemplate.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-gray-700 ml-4 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content="Close modal"
                                aria-label="Close modal"
                            >
                                <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-8 max-h-[calc(95vh-200px)] overflow-y-auto custom-scrollbar">
                            {/* Basic Information & Actions */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center">
                                        <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4 mr-2 text-blue-400" />
                                        Basic Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-150 rounded px-2">
                                            <span className="text-gray-400 text-sm flex items-center">
                                                <FontAwesomeIcon icon={faCoins} className="h-3 w-3 mr-2" />
                                                Price:
                                            </span>
                                            <p className="text-white font-semibold text-lg bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                                                {formatPrice(selectedTemplate.price)}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-150 rounded px-2">
                                            <span className="text-gray-400 text-sm flex items-center">
                                                <FontAwesomeIcon icon={faHashtag} className="h-3 w-3 mr-2" />
                                                Unique ID:
                                            </span>
                                            <p className="text-white font-mono text-sm bg-gray-900 px-3 py-1 rounded border border-gray-600">
                                                {selectedTemplate.unique_id}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-150 rounded px-2">
                                            <span className="text-gray-400 text-sm flex items-center">
                                                <FontAwesomeIcon icon={faUser} className="h-3 w-3 mr-2" />
                                                Created By:
                                            </span>
                                            <p 
                                                className="text-white text-right max-w-[200px] truncate" 
                                                title={selectedTemplate.user?.email || (selectedTemplate.user_id === 0 ? 'System Theme' : 'User Theme')}
                                            >
                                                {selectedTemplate.user?.email || (selectedTemplate.user_id === 0 ? 'System Theme' : 'User Theme')}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-150 rounded px-2">
                                            <span className="text-gray-400 text-sm flex items-center">
                                                <FontAwesomeIcon icon={faShield} className="h-3 w-3 mr-2" />
                                                Status:
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 ${
                                                selectedTemplate.status === 'active' 
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30 shadow-lg shadow-green-500/20'
                                                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shadow-lg shadow-yellow-500/20'
                                            }`}>
                                                {selectedTemplate.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center">
                                        <FontAwesomeIcon icon={faBolt} className="h-4 w-4 mr-2 text-yellow-400" />
                                        Quick Actions
                                    </h3>
                                    <div className="space-y-3">
                                        <a 
                                            href={`/${selectedTemplate.unique_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between w-full p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-200 group border border-blue-500/30 hover:border-blue-400/50 hover:scale-[1.02] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/50">
                                                    <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">Open Theme Preview</span>
                                                    <span className="text-blue-200 text-xs">Live preview in new tab</span>
                                                </div>
                                            </div>
                                            <FontAwesomeIcon icon={faExternalLinkAlt} className="h-4 w-4 opacity-70 group-hover:opacity-100 transform group-hover:translate-x-1 transition-transform" />
                                        </a>
                                        <a 
                                            href={`https://ez.wiki/${selectedTemplate.unique_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between w-full p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all duration-200 group border border-purple-500/30 hover:border-purple-400/50 hover:scale-[1.02] shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-400/50">
                                                    <FontAwesomeIcon icon={faPalette} className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">View on EZ Wiki</span>
                                                    <span className="text-purple-200 text-xs">Official EZ Wiki page</span>
                                                </div>
                                            </div>
                                            <FontAwesomeIcon icon={faExternalLinkAlt} className="h-4 w-4 opacity-70 group-hover:opacity-100 transform group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center">
                                    <FontAwesomeIcon icon={faFileAlt} className="h-4 w-4 mr-2 text-gray-400" />
                                    Theme Description
                                </h3>
                                <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors duration-200 shadow-inner">
                                    {selectedTemplate.description ? (
                                        <div className="prose prose-invert max-w-none">
                                            <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
                                                {selectedTemplate.description}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4 border border-gray-600">
                                                <FontAwesomeIcon icon={faPalette} className="text-2xl text-gray-500" />
                                            </div>
                                            <p className="text-gray-400 text-lg mb-2">No detailed description available</p>
                                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                                                This theme provides a clean, modern design optimized for content presentation and user experience.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Theme Features */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center">
                                    <FontAwesomeIcon icon={faStar} className="h-4 w-4 mr-2 text-yellow-400" />
                                    Theme Features
                                </h3>
                                <div className="bg-gradient-to-r from-purple-900/20 to-fuchsia-900/20 rounded-xl p-5 border border-purple-700/30 hover:border-purple-600/40 transition-colors duration-200 shadow-lg shadow-purple-500/10">
                                    <p className="text-gray-300 leading-relaxed mb-4 text-sm md:text-base">
                                        This professional theme template offers a comprehensive design system with modern web standards and responsive architecture.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { icon: faMobile, color: 'emerald', text: 'Fully Responsive Design' },
                                            { icon: faPaintBrush, color: 'blue', text: 'Customizable Color Scheme' },
                                            { icon: faRocket, color: 'purple', text: 'Optimized Performance' },
                                            { icon: faSearch, color: 'amber', text: 'SEO Friendly Structure' },
                                            { icon: faCode, color: 'indigo', text: 'Clean Semantic HTML' },
                                            { icon: faPalette, color: 'pink', text: 'Modern UI Components' },
                                            { icon: faBolt, color: 'orange', text: 'Fast Loading' },
                                            { icon: faShield, color: 'red', text: 'Secure Implementation' }
                                        ].map((feature, index) => (
                                            <div 
                                                key={index} 
                                                className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 hover:scale-105 cursor-default group"
                                            >
                                                <div className={`w-10 h-10 rounded-full bg-${feature.color}-500/20 flex items-center justify-center border border-${feature.color}-500/30 group-hover:border-${feature.color}-400/50 group-hover:bg-${feature.color}-500/30 transition-colors`}>
                                                    <FontAwesomeIcon 
                                                        icon={feature.icon} 
                                                        className={`h-4 w-4 text-${feature.color}-300 group-hover:text-${feature.color}-200`} 
                                                    />
                                                </div>
                                                <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
                                                    {feature.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Simple & Clean */}
						<div className="flex flex-col xs:flex-row justify-between items-center gap-3 p-4 border-t border-gray-700/40 bg-gray-900/20">
							{/* Last Updated Info */}
							<div className="flex items-center space-x-2 order-2 xs:order-1">
								<FontAwesomeIcon icon={faClock} className="h-3 w-3 text-gray-500" />
								<span className="text-xs text-gray-500">
									{new Date(selectedTemplate.updated_at).toLocaleDateString()}
								</span>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2 w-full xs:w-auto order-1 xs:order-2">
								<button
									onClick={closeModal}
									className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors text-sm font-medium flex-1 xs:flex-none"
								>
									Close
								</button>
								<a 
									href={`/${selectedTemplate.unique_id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-semibold flex items-center justify-center space-x-2 flex-1 xs:flex-none"
								>
									<FontAwesomeIcon icon={faGlobe} className="h-3 w-3" />
									<span>Try Theme</span>
								</a>
							</div>
						</div>
                    </div>
                </div>
            )}

            {/* Messages */}
            {errorMessage && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center" data-tooltip-id="template-tooltip" data-tooltip-content="An error occurred. This message will disappear shortly.">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                    {errorMessage}
                </div>
            )}
            
            {successMessage && (
                <div className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center" data-tooltip-id="template-tooltip" data-tooltip-content="Your action was successful. This message will disappear shortly.">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    {successMessage}
                    {successMessage.includes('Invoice') && (
                        <FontAwesomeIcon icon={faReceipt} className="ml-2" />
                    )}
                </div>
            )}

            {/* Filters */}
            {showFilters && (
                <div className="mb-8 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <input 
                                type="text" 
                                placeholder="Search Themes..." 
                                className="w-full bg-gray-700 text-white px-3 py-2 pl-10 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                data-tooltip-id="template-tooltip"
                                data-tooltip-content="Search for Theme titles, descriptions, or unique IDs."
                            />
                            <FontAwesomeIcon 
                                icon={faSearch} 
                                className="absolute left-3 top-3 text-gray-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div>
                                <input
                                    type="number"
                                    value={filters.min_price || ''}
                                    onChange={(e) => setFilters({
                                        ...filters, 
                                        min_price: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    placeholder={`Min ${getCurrencySymbol()}`}
                                    min="0"
                                    data-tooltip-id="template-tooltip"
                                    data-tooltip-content={`Enter the minimum price in ${getCurrencySymbol()}.`}
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    value={filters.max_price || ''}
                                    onChange={(e) => setFilters({
                                        ...filters, 
                                        max_price: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    placeholder={`Max ${getCurrencySymbol()}`}
                                    min="0"
                                    data-tooltip-id="template-tooltip"
                                    data-tooltip-content={`Enter the maximum price in ${getCurrencySymbol()}.`}
                                />
                            </div>
                            <button
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold col-span-2 md:col-span-1 disabled:opacity-50"
                                data-tooltip-id="template-tooltip"
                                data-tooltip-content="Remove all active filters and reset the search."
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 flex justify-between items-center mt-4">
                            <p className="text-gray-300">
                                Active filters: 
                                {filters.search && ` Search: "${filters.search}"`} 
                                {filters.min_price && ` Min price: ${formatPrice(Number(filters.min_price))}`}
                                {filters.max_price && ` Max price: ${formatPrice(Number(filters.max_price))}`}
                            </p>
                            <button 
                                onClick={clearFilters}
                                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                                data-tooltip-id="template-tooltip"
                                data-tooltip-content="Clear all current filters."
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-1" />
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                </div>
            )}

            {/* Theme Listings */}
            {!isLoading && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => {
                            const isOwnedByUser = auth.user && template.user?.id === auth.user.id;
                            const isCreatedByUser = auth.user && template.user_id === auth.user.id;
                            const collectionStatus = getCollectionStatus(template.id);
                            const isInCollection = collectionStatus.isInCollection;
                            const isThemeOwner = collectionStatus.isThemeOwner;
                            
                            // Determine if rental should be disabled
                            const shouldDisableRental = isOwnedByUser || isCreatedByUser || isInCollection || isThemeOwner;

                            return (
                                <div 
                                    key={template.id}
                                    className={`backdrop-blur-sm bg-white/5 border border-gray-700 rounded-2xl p-5 flex flex-col transition-all duration-300 hover:translate-y-[-8px] ${
                                        shouldDisableRental
                                            ? 'hover:shadow-lg hover:shadow-purple-500/20' 
                                            : 'hover:shadow-lg hover:shadow-green-500/20'
                                    }`}
                                >
                                    {/* Template Image */}                                    
                                    <div className="flex items-start mb-4">
                                        <div className="text-5xl mr-4 flex-shrink-0 bg-gradient-to-br from-purple-600 to-fuchsia-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" data-tooltip-id="template-tooltip" data-tooltip-content="This is a Theme">
                                            <FontAwesomeIcon icon={faPalette} className="h-8 w-8 text-white" />
                                        </div>
                                        
                                        <div className="flex-grow">
                                            <h3 className="font-semibold text-lg text-gray-100 block">
                                                {template.title}
                                            </h3>
                                            {template.unique_id && (
                                                <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                                                    <a 
                                                        href={`https://ez.wiki/${template.unique_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:text-yellow-400 transition-colors duration-200"
                                                        data-tooltip-id="template-tooltip"
                                                        data-tooltip-content="Open this Theme in a new tab"
                                                    >
                                                        https://ez.wiki/{template.unique_id}
                                                    </a>
                                                </p>
                                            )}
                                            <p className={`text-xs ${shouldDisableRental ? 'text-purple-300' : 'text-green-300'} mt-1`}>
                                                {template.user?.email || (template.user_id === 0 ? 'System Theme' : 'User Theme')}
                                            </p>
                                            {/* Show status badges */}
                                            {isThemeOwner && (
                                                <p className="text-xs text-purple-300 mt-1">✓ You created this theme</p>
                                            )}
                                            {isInCollection && !isThemeOwner && (
                                                <p className="text-xs text-green-300 mt-1">✓ Already in your collection</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex space-x-2">
                                            {/* Preview Button */}
                                            <a 
                                                href={`/${template.unique_id}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors" 
                                                data-tooltip-id="action-tooltip" 
                                                data-tooltip-content="Open your theme preview in a new tab"
                                            >
                                                <FontAwesomeIcon icon={faGlobe} />
                                            </a>
                                            
                                            {/* Help/Explanation Button */}
                                            <button 
                                                onClick={() => handleExplainTheme(template)}
                                                className="flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Learn more about this theme and how it works"
                                            >
                                                <FontAwesomeIcon icon={faQuestionCircle} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto flex justify-between items-center">
                                        <div>
                                            <p className="text-xl font-bold text-white">
                                                {formatPrice(template.price)}
                                            </p>
                                        </div>
                                        {shouldDisableRental ? (
                                            <button 
                                                className="bg-white/10 border border-gray-600 text-white py-2 px-4 rounded-lg text-sm font-semibold shadow-md hover:bg-white/20 transition-all duration-200"
                                                disabled
                                                data-tooltip-id="template-tooltip"
                                                data-tooltip-content={
                                                    isThemeOwner ? "You created this theme" :
                                                    isInCollection ? "Already in your collection" :
                                                    isOwnedByUser ? "You already own this theme" :
                                                    "You created this theme"
                                                }
                                            >
                                                {isThemeOwner ? "Your Theme" :
                                                 isInCollection ? "In Collection" :
                                                 isOwnedByUser ? "Owned" : "Your Theme"}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRental(template.id, template.price)}
                                                disabled={isRenting}
                                                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 rounded-lg text-sm shadow-md shadow-yellow-500/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                                                data-tooltip-id="template-tooltip"
                                                data-tooltip-content={`Rent this Theme using your ${auth.user ? 'EZ$ balance' : 'US dollars'}.`}
                                            >
                                                {isRenting ? (
                                                    <span className="flex items-center justify-center">
                                                        <FontAwesomeIcon icon={faBolt} className="mr-2 animate-pulse" />
                                                        Processing...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center">
                                                        <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                                                        Rent Now
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {templates.length === 0 && !isLoading && (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                                <FontAwesomeIcon icon={faPalette} className="text-5xl" />
                            </div>
                            <h3 className="text-xl font-medium text-gray-300 mb-2">
                                No Themes found
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                {hasActiveFilters 
                                    ? "Try adjusting your filters or search criteria"
                                    : "There are currently no Themes available for rental"}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-medium py-2 px-6 rounded-lg"
                                    data-tooltip-id="template-tooltip"
                                    data-tooltip-content="Clear your filters to see all available Themes."
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Load More Button */}
                    {pagination.current_page < pagination.last_page && templates.length > 0 && (
                        <div className="mt-8 text-center">
                            <button 
                                onClick={loadMore}
                                disabled={isLoadingMore}
                                className="bg-white/10 border border-gray-600 hover:bg-white/20 text-white font-semibold py-3 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                                data-tooltip-id="template-tooltip"
                                data-tooltip-content="Load the next page of results."
                            >
                                {isLoadingMore ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading...
                                    </span>
                                ) : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}