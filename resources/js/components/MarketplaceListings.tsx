import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faCheckCircle, 
    faExclamationTriangle,
    faGlobe,
    faLink,
    faShoppingCart,
    faBolt,
    faReceipt,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type DomainItem = {
    id: number;
    domain: string;
    domainselected: string;
    type: 'CUSTOM' | 'DOMAIN';
    hashtag?: string;
    email?: string;
    sells?: {
        price: number | string;
        created_at?: string;
    }[];
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

type MarketplaceListingsProps = {
    auth: AuthData;
    initialDomains: DomainItem[];
    initialPagination: Pagination;
    initialFilters?: Filters;
    onPurchase?: (domainId: number, type: 'CUSTOM' | 'DOMAIN', price: number | string, domainItem?: DomainItem) => Promise<void>;
    showFilters?: boolean;
    onFilterChange?: (filters: Filters) => void;
    onLoadMore?: () => void;
    isLoading?: boolean;
};

export default function MarketplaceListings({
    auth,
    initialDomains,
    initialPagination,
    initialFilters = {},
    onPurchase,
    showFilters = true,
}: MarketplaceListingsProps) {
    const [domains, setDomains] = useState<DomainItem[]>(initialDomains);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [searchInput, setSearchInput] = useState(initialFilters.search || '');

    // New function to format the price with commas
    const formatPrice = (price: number) => {
        return `EZ$${price.toLocaleString('en-US', {
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
                const response = await axios.get(route('marketplace.loadmore'), {
                    params: {
                        ...filters,
                        page: 1
                    }
                });

                setDomains(response.data.domains);
                setPagination(response.data.pagination);
            } catch (error) {
                console.error('Error fetching domains:', error);
                setErrorMessage('Failed to load domains. Please try again.');
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
            const response = await axios.get(route('marketplace.loadmore'), {
                params: {
                    ...filters,
                    page: nextPage
                }
            });

            setDomains(prev => [...prev, ...response.data.domains]);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error loading more domains:', error);
            setErrorMessage('Failed to load more domains. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handlePurchase = async (domainId: number, type: 'CUSTOM' | 'DOMAIN', price: number | string, domainItem?: DomainItem) => {
        setIsPurchasing(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            if (onPurchase) {
                await onPurchase(domainId, type, price, domainItem);
            } else {
                const response = await axios.post(route('marketplace.purchase'), {
                    domain_id: domainId,
                    type: type,
                    price: Number(price)
                });

                if (response.data.success) {
                    setSuccessMessage(
                        `Purchase successful! ${response.data.invoice_number ? 
                        `Invoice #${response.data.invoice_number}` : ''}`
                    );
                    setDomains(prev => prev.filter(d => !(d.id === domainId && d.type === type)));
                    // Refresh the list
                    const refreshResponse = await axios.get(route('marketplace.loadmore'), {
                        params: {
                            ...filters,
                            page: 1
                        }
                    });
                    setDomains(refreshResponse.data.domains);
                    setPagination(refreshResponse.data.pagination);
                } else {
                    throw new Error(response.data.message || 'Purchase failed');
                }
            }
        } catch (error) {
            let errorMessage = 'An error occurred during purchase';
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
            setIsPurchasing(false);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    };

    const clearFilters = () => {
        setFilters({});
        setSearchInput('');
    };

    const hasActiveFilters = filters.search || filters.min_price || filters.max_price;

    return (
        <div className="space-y-6">
            <Tooltip id="marketplace-tooltip" />
             <style>{`
                .react-tooltip {
                    z-index: 99999 !important;
                    opacity: 1 !important;
                    font-size: 12px;
                    padding: 4px 8px;
                }
            `}</style>
            {/* Messages */}
            {errorMessage && (
                <div className="bg-red-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center" data-tooltip-id="marketplace-tooltip" data-tooltip-content="An error occurred. This message will disappear shortly.">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                    {errorMessage}
                </div>
            )}
            
            {successMessage && (
                <div className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center" data-tooltip-id="marketplace-tooltip" data-tooltip-content="Your action was successful. This message will disappear shortly.">
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
                                placeholder="Search domains..." 
                                className="w-full bg-gray-700 text-white px-3 py-2 pl-10 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                data-tooltip-id="marketplace-tooltip"
                                data-tooltip-content="Search for specific domain names or hashtags."
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
                                    placeholder="Min EZ$"
                                    min="0"
                                    data-tooltip-id="marketplace-tooltip"
                                    data-tooltip-content="Enter the minimum price in EZ$."
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
                                    placeholder="Max EZ$"
                                    min="0"
                                    data-tooltip-id="marketplace-tooltip"
                                    data-tooltip-content="Enter the maximum price in EZ$."
                                />
                            </div>
                            <button
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold col-span-2 md:col-span-1 disabled:opacity-50"
                                data-tooltip-id="marketplace-tooltip"
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
                                data-tooltip-id="marketplace-tooltip"
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

            {/* Domain Listings */}
            {!isLoading && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {domains.map((domain) => {
                            const isOwnedByUser = auth.user && domain.user?.id === auth.user.id;
                            const domainUrl = domain.type === 'CUSTOM' 
                                ? `https://${domain.domainselected}/${domain.domain}`
                                : `https://${domain.domain}.${domain.domainselected}`;
                            const displayName = domain.type === 'CUSTOM' 
                                ? `${domain.domainselected}/${domain.domain}`
                                : `${domain.domain}.${domain.domainselected}`;

                            const metadataParts = [];
                            if (domain.hashtag) metadataParts.push(`#${domain.hashtag}`);
                            if (domain.user?.email) metadataParts.push(domain.user.email);
                            const metadata = metadataParts.join(' • ');

                            const price = Number(domain.sells?.[0]?.price || 0);

                            return (
                                <div 
                                    key={`${domain.type}-${domain.id}`}
                                    className={`backdrop-blur-sm bg-white/5 border border-gray-700 rounded-2xl p-5 flex flex-col transition-all duration-300 hover:translate-y-[-8px] ${
                                        isOwnedByUser 
                                            ? 'hover:shadow-lg hover:shadow-purple-500/20' 
                                            : 'hover:shadow-lg hover:shadow-green-500/20'
                                    }`}
                                >
                                    <div className="flex items-start mb-4">
                                        {domain.type === 'CUSTOM' ? (
                                            <div className="text-5xl mr-4 flex-shrink-0 bg-gradient-to-br from-purple-600 to-fuchsia-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" data-tooltip-id="marketplace-tooltip" data-tooltip-content="This is a Custom Handle (e.g., domain/handle).">
                                                <FontAwesomeIcon icon={faLink} className="h-8 w-8 text-white" />
                                            </div>
                                        ) : (
                                            <div className="text-5xl mr-4 flex-shrink-0 bg-gradient-to-br from-blue-600 to-cyan-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" data-tooltip-id="marketplace-tooltip" data-tooltip-content="This is a full Domain (e.g., brand.domain).">
                                                <FontAwesomeIcon icon={faGlobe} className="h-8 w-8 text-white" />
                                            </div>
                                        )}
                                        
                                        <div className="flex-grow">
                                            <a 
                                                href={domainUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="font-semibold text-lg text-gray-100 block hover:text-white transition-colors"
                                                data-tooltip-id="marketplace-tooltip"
                                                data-tooltip-content="Visit this page in a new tab."
                                            >
                                                {displayName}
                                            </a>
                                            {metadata && (
                                                <p className={`text-xs ${isOwnedByUser ? 'text-purple-300' : 'text-green-300'} mt-1`}>
                                                    {metadata}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto flex justify-between items-center">
                                        <div>
                                            <p className="text-xl font-bold text-white">
                                                {formatPrice(price)}
                                            </p>
                                        </div>
                                        {isOwnedByUser ? (
                                            <button 
                                                className="bg-white/10 border border-gray-600 text-white py-2 px-4 rounded-lg text-sm font-semibold shadow-md hover:bg-white/20 transition-all duration-200"
                                                disabled
                                                data-tooltip-id="marketplace-tooltip"
                                                data-tooltip-content="You already own this listing."
                                            >
                                                Your Listing
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePurchase(domain.id, domain.type as 'CUSTOM' | 'DOMAIN', price, domain)}
                                                disabled={isPurchasing}
                                                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 rounded-lg text-sm shadow-md shadow-yellow-500/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                                                data-tooltip-id="marketplace-tooltip"
                                                data-tooltip-content="Purchase this domain using your EZ$ balance."
                                            >
                                                {isPurchasing ? (
                                                    <span className="flex items-center justify-center">
                                                        <FontAwesomeIcon icon={faBolt} className="mr-2 animate-pulse" />
                                                        Processing...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center">
                                                        <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                                                        Buy Now
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
                    {domains.length === 0 && !isLoading && (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-4">
                                <FontAwesomeIcon icon={faGlobe} className="text-5xl" />
                            </div>
                            <h3 className="text-xl font-medium text-gray-300 mb-2">
                                No domains found
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                {hasActiveFilters 
                                    ? "Try adjusting your filters or search criteria"
                                    : "There are currently no domains available for purchase"}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-medium py-2 px-6 rounded-lg"
                                    data-tooltip-id="marketplace-tooltip"
                                    data-tooltip-content="Clear your filters to see all available domains."
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Load More Button */}
                    {pagination.current_page < pagination.last_page && domains.length > 0 && (
                        <div className="mt-8 text-center">
                            <button 
                                onClick={loadMore}
                                disabled={isLoadingMore}
                                className="bg-white/10 border border-gray-600 hover:bg-white/20 text-white font-semibold py-3 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                                data-tooltip-id="marketplace-tooltip"
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