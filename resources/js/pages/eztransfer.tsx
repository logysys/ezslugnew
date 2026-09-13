import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExchangeAlt,
    faTimes,
    faCreditCard,
    faCheckCircle,
    faSpinner,
    faGlobe,
    faGlobeAmericas,
    faHashtag,
    faCopy
} from '@fortawesome/free-solid-svg-icons';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type HandleType = 'custom' | 'domain' | 'funnel';
type Funnel = {
    id: number;
    token: string;
    created_at: string;
    handle_domains?: Array<{
        id: number;
        domain: string;
        domainselected: string;
    }>;
    custom_domains?: Array<{
        id: number;
        domain: string;
        domainselected: string;
    }>;
};

export default function EzTransfer() {
    const { auth, template, initialFunnels } = usePage<SharedData>().props;
    const [funnels, setFunnels] = useState<Funnel[]>(initialFunnels?.data || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy'|'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialFunnels?.next_page_url !== null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [transferToken, setTransferToken] = useState('');
    const [tokenExpiry, setTokenExpiry] = useState('');
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [redeemToken, setRedeemToken] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [handleToTransfer, setHandleToTransfer] = useState<{ name: string; type: HandleType; id: number } | null>(null);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [selectedFunnelId, setSelectedFunnelId] = useState<number | null>(null);

    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const handleSearch = useCallback(async () => {
        try {
            const response = await axios.get('/search-ez-funnels', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: 1
                }
            });

            setFunnels(response.data.data);
            setCurrentPage(1);
            setHasMore(response.data.next_page_url !== null);
        } catch (error) {
            console.error('Search error:', error);
            setErrorMessage('Failed to search funnels. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        }
    }, [searchQuery, searchType]);

    const loadMore = useCallback(async () => {
        if (isSubmitting || !hasMore) return;
        
        try {
            setIsSubmitting(true);
            const response = await axios.get('/search-ez-funnels', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: currentPage + 1
                }
            });

            setFunnels(prev => [...prev, ...response.data.data]);
            setCurrentPage(prev => prev + 1);
            setHasMore(response.data.next_page_url !== null);
        } catch (error) {
            console.error('Load more error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to load more items. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    }, [currentPage, hasMore, isSubmitting, searchQuery, searchType]);

    const generateTransferToken = useCallback(async (type: HandleType, handleId: number, handleName: string) => {
        setHandleToTransfer({ name: handleName, type, id: handleId });
        setTransferToken('');
        setTokenExpiry('');
        setErrorMessage('');
        setSuccessMessage('');
        setIsGeneratingToken(true);

        try {
            const response = await axios.post('/generate-transfer-token', {
                type,
                handle_id: handleId
            });

            setTransferToken(response.data.token);
            setTokenExpiry(response.data.expires_at);
            setSuccessMessage('Transfer token generated successfully!');
        } catch (error) {
            console.error('Token generation error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to generate transfer token');
        } finally {
            setIsGeneratingToken(false);
        }
    }, []);

    const redeemTransferToken = useCallback(async () => {
        if (!redeemToken.trim()) return;
        
        try {
            setIsRedeeming(true);
            setErrorMessage('');
            setSuccessMessage('');
            const response = await axios.post('/redeem-transfer-token', {
                token: redeemToken.trim(),
                funnel_id: selectedFunnelId || null
            });

            setSuccessMessage(response.data.message);
            setRedeemToken('');
            setHandleToTransfer(null);
            setSelectedFunnelId(null);
            await handleSearch();
        } catch (error) {
            console.error('Token redemption error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to redeem transfer token');
        } finally {
            setIsRedeeming(false);
        }
    }, [redeemToken, handleSearch, selectedFunnelId]);

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setSuccessMessage('Copied to clipboard!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            setErrorMessage('Failed to copy to clipboard');
            setTimeout(() => setErrorMessage(''), 3000);
        });
    }, []);

    const getHandleIcon = useCallback((type: HandleType) => {
        switch (type) {
            case 'funnel': return faHashtag;
            case 'domain': return faGlobeAmericas;
            case 'custom': return faGlobe;
            default: return faExchangeAlt;
        }
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isSubmitting || !hasMore) {
                return;
            }
            loadMore();
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isSubmitting, hasMore, loadMore]);

    return (
        <>
            <Head>
                <title>EZ Transfer - Transfer Handles Between Accounts</title>
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>
            <Tooltip id="panel-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="action-tooltip" />
            
            <DraggableMenu auth={auth} />
            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl max-w-6xl w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Search Results Section */}
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search by token"
                                        className="flex-grow bg-white text-gray-900 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-0"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        data-tooltip-id="form-tooltip"
                                        data-tooltip-content="Search by funnel token or associated domains"
                                    />

                                    <div className="flex items-center">
                                        <button
                                            className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-l-md border-r transition-colors ${
                                                searchType === 'fuzzy'
                                                    ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                                                    : 'bg-gray-600 text-gray-300 border-gray-700 hover:bg-gray-700'
                                            }`}
                                            onClick={() => {
                                                setSearchType('fuzzy');
                                                handleSearch();
                                            }}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="Fuzzy search finds partial and similar matches"
                                        >
                                            <FontAwesomeIcon icon={faHashtag} className="h-5 w-5" />
                                            Fuzzy
                                        </button>
                                        <button
                                            className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-r-md transition-colors ${
                                                searchType === 'exact'
                                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                                    : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                                            }`}
                                            onClick={() => {
                                                setSearchType('exact');
                                                handleSearch();
                                            }}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="Exact search requires a perfect match"
                                        >
                                            <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5" />
                                            Exact
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-[65vh] overflow-y-auto custom-scrollbar space-y-2">
                                    {funnels.length > 0 ? (
                                        funnels.map((funnel) => (
                                            <div key={funnel.id} className="flex items-start p-4 gap-3 bg-[#5d0f6e] rounded-lg" data-tooltip-id="action-tooltip" data-tooltip-content={`Funnel Token: ${funnel.token}`}>
                                                <span className="text-4xl select-none pt-1">
                                                    🍀
                                                </span>
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex flex-col flex-wrap gap-2">
                                                        {/* Default Handle */}
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={`https://ez.wiki/${encodeURIComponent(funnel.token)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-yellow-400 font-semibold truncate hover:underline"
                                                                data-tooltip-id="action-tooltip"
                                                                data-tooltip-content="Open this handle in a new tab"
                                                            >
                                                                https://ez.wiki/{funnel.token}
                                                            </a>
                                                        </div>
                                                        
                                                        {/* Sub domains */}
                                                        {funnel.handle_domains?.map((domain) => (
                                                            <div key={domain.id} className="flex items-center gap-2">
                                                                <a
                                                                    href={`https://${domain.domain}.${domain.domainselected}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-yellow-400 font-semibold truncate hover:underline"
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="Open this subdomain in a new tab"
                                                                >
                                                                    https://{domain.domain}.{domain.domainselected}
                                                                </a>
                                                                <button
                                                                    onClick={() => generateTransferToken('domain', domain.id, `https://${domain.domain}.${domain.domainselected}`)}
                                                                    disabled={isGeneratingToken}
                                                                    className={`text-xs px-2 py-1 rounded transition-colors ${
                                                                        isGeneratingToken
                                                                            ? 'bg-gray-500 cursor-not-allowed'
                                                                            : 'bg-yellow-500 text-black font-bold hover:bg-yellow-600'
                                                                    }`}
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="Generate a transfer token for this domain"
                                                                >
                                                                    {isGeneratingToken && handleToTransfer?.id === domain.id ? (
                                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                                    ) : 'Transfer'}
                                                                </button>
                                                            </div>
                                                        ))}
                                                        
                                                        {/* Custom domains */}
                                                        {funnel.custom_domains?.map((domain) => (
                                                            <div key={domain.id} className="flex items-center gap-2">
                                                                <a
                                                                    href={`https://${domain.domainselected}/${domain.domain}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-yellow-400 font-semibold truncate hover:underline"
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="Open this custom domain handle in a new tab"
                                                                >
                                                                    https://{domain.domainselected}/{domain.domain}
                                                                </a>
                                                                <button
                                                                    onClick={() => generateTransferToken('custom', domain.id, `https://${domain.domainselected}/${domain.domain}`)}
                                                                    disabled={isGeneratingToken}
                                                                    className={`text-xs px-2 py-1 rounded transition-colors ${
                                                                        isGeneratingToken
                                                                            ? 'bg-gray-500 cursor-not-allowed'
                                                                            : 'bg-yellow-500 text-black font-bold hover:bg-yellow-600'
                                                                    }`}
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="Generate a transfer token for this custom domain"
                                                                >
                                                                    {isGeneratingToken && handleToTransfer?.id === domain.id ? (
                                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                                    ) : 'Transfer'}
                                                                </button>
                                                            </div>
                                                        ))}

                                                        <p className="text-purple-300 text-sm whitespace-nowrap pt-1" data-tooltip-id="action-tooltip" data-tooltip-content={`Created on: ${new Date(funnel.created_at).toLocaleString()}`}>
                                                            Created: {formatDate(funnel.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            No funnels found. Try a different search term.
                                        </div>
                                    )}
                                </div>

                                {hasMore && (
                                    <div className="flex justify-center mt-4">
                                        <button
                                            className="bg-black text-white border border-white px-8 py-2 rounded-md font-semibold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                                            onClick={loadMore}
                                            disabled={isSubmitting}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Load more results"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                    Loading...
                                                </>
                                            ) : 'Load More'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Transfer Form Section */}
                            <div className="space-y-4">
                                <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-white">
                                            <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
                                            Handle Transfer
                                        </h2>
                                    </div>

                                    {successMessage && !errorMessage && (
                                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                                            {successMessage}
                                        </div>
                                    )}
                                    {errorMessage && (
                                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {/* Token Generation Section */}
                                        <div>
                                            <h3 className="text-yellow-400 font-medium mb-3" data-tooltip-id="form-tooltip" data-tooltip-content="Generate a unique, single-use token to transfer a handle.">
                                                <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                                                Generate Transfer Token
                                            </h3>
                                            
                                            {handleToTransfer ? (
                                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-3">
                                                    <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-md">
                                                        <FontAwesomeIcon 
                                                            icon={getHandleIcon(handleToTransfer.type)} 
                                                            className="text-xl text-cyan-400 fa-fw"
                                                            data-tooltip-id="action-tooltip"
                                                            data-tooltip-content={`Handle Type: ${handleToTransfer.type}`}
                                                        />
                                                        <span className="font-mono text-lg text-white break-all">
                                                            {handleToTransfer.name}
                                                        </span>
                                                    </div>
                                                    
                                                    {isGeneratingToken ? (
                                                        <div className="flex items-center justify-center text-white pt-2">
                                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-3" />
                                                            <span>Generating Token...</span>
                                                        </div>
                                                    ) : transferToken && (
                                                        <div className="space-y-2 pt-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-white font-semibold">Your Transfer Token:</span>
                                                                <button 
                                                                    onClick={() => copyToClipboard(transferToken)}
                                                                    className="text-yellow-400 hover:underline text-sm font-bold flex items-center gap-1"
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="Copy token to clipboard"
                                                                >
                                                                    <FontAwesomeIcon icon={faCopy} />
                                                                    Copy
                                                                </button>
                                                            </div>
                                                            <div className="bg-gray-800 p-2 text-white rounded break-all text-sm font-mono">
                                                                {transferToken}
                                                            </div>
                                                            <div className="text-gray-400 text-xs text-right" data-tooltip-id="action-tooltip" data-tooltip-content={`Token is valid until ${new Date(tokenExpiry).toLocaleString()}`}>
                                                                Expires: {new Date(tokenExpiry).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-gray-300 text-sm p-4 text-center bg-gray-900/50 rounded-lg border border-gray-700">
                                                    Select a handle from the list on the left and click its "Transfer" button to generate a token.
                                                </p>
                                            )}
                                        </div>

                                        {/* Token Redemption Section */}
                                        <div>
                                            <h3 className="text-yellow-400 font-medium mb-2" data-tooltip-id="form-tooltip" data-tooltip-content="Use a token received from another user to claim a handle.">
                                                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                                Redeem Transfer Token
                                            </h3>
                                            <div>
                                                <label className="block text-gray-300 text-sm mb-2">
                                                    Assign to existing funnel (leave blank to create new):
                                                </label>
                                                <select
                                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                    value={selectedFunnelId || ''}
                                                    onChange={(e) => setSelectedFunnelId(e.target.value ? parseInt(e.target.value) : null)}
                                                    disabled={isRedeeming}
                                                    data-tooltip-id="form-tooltip"
                                                    data-tooltip-content="Optional: Assign the handle to one of your existing funnels"
                                                >
                                                    <option value="">-- Create New Ai Page --</option>
                                                    {funnels.map(funnel => (
                                                        <option key={funnel.id} value={funnel.id}>
                                                            {funnel.token}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                <input
                                                    type="text"
                                                    placeholder="Enter transfer token"
                                                    className="flex-grow bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                    value={redeemToken}
                                                    onChange={(e) => setRedeemToken(e.target.value)}
                                                    disabled={isRedeeming}
                                                    data-tooltip-id="form-tooltip"
                                                    data-tooltip-content="Paste the transfer token you received"
                                                />
                                                <button
                                                    onClick={redeemTransferToken}
                                                    disabled={isRedeeming || !redeemToken.trim()}
                                                    className={`bg-yellow-500 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors ${
                                                        isRedeeming || !redeemToken.trim() ? 'opacity-70 cursor-not-allowed' : ''
                                                    }`}
                                                    data-tooltip-id="action-tooltip"
                                                    data-tooltip-content="Claim the handle using the provided token"
                                                >
                                                    {isRedeeming ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                                            Redeeming...
                                                        </>
                                                    ) : 'Redeem'}
                                                </button>
                                            </div>                                            
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}