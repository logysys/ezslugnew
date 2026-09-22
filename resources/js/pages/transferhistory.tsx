import { Head, usePage } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExchangeAlt,
    faGlobe,
    faGlobeAmericas,
    faHistory,
    faArrowRight,
    faUser,
    faClock,
    faTimes,
    faCheckCircle,
    faSpinner,
    faArrowLeft,
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import { type SharedData } from '@/types';
import DraggableMenu from '@/components/DraggableMenu';
import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Transfer = {
    id: number;
    token: string;
    handle_type: 'custom' | 'domain';
    handle_name: string;
    created_at: string;
    transferred_at: string;
    expires_at: string;
    used: boolean;
    sender?: {
        name: string;
        email: string;
    };
    recipient?: {
        name: string;
        email: string;
    };
    handle_url?: string;
};

export default function TransferHistory() {
    const { auth, template, sentTransfers, receivedTransfers } = usePage<SharedData & {
        sentTransfers: Transfer[];
        receivedTransfers: Transfer[];
    }>().props;

    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [allSentTransfers, setAllSentTransfers] = useState<Transfer[]>(sentTransfers);
    const [allReceivedTransfers, setAllReceivedTransfers] = useState<Transfer[]>(receivedTransfers);
    const [hasMoreSent, setHasMoreSent] = useState(true);
    const [hasMoreReceived, setHasMoreReceived] = useState(true);

    const getStatusIcon = useCallback((status: boolean) => {
        switch (status) {
            case true:
                return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
            case false:
                return <FontAwesomeIcon icon={faSpinner} className="text-yellow-500 animate-spin" />;
            default:
                return <FontAwesomeIcon icon={faSpinner} className="text-gray-500" />;
        }
    }, []);

    const loadMoreSentTransfers = useCallback(async () => {
        if (!hasMoreSent || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/transferhistory/sent`, {
                params: { page: nextPage }
            });
            
            if (response.data.data && response.data.data.length > 0) {
                setAllSentTransfers(prev => [...prev, ...response.data.data]);
                setCurrentPage(nextPage);
                setHasMoreSent(response.data.current_page < response.data.last_page);
            } else {
                setHasMoreSent(false);
            }
        } catch (error) {
            console.error('Error loading more sent transfers:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMoreSent, loading]);

    const loadMoreReceivedTransfers = useCallback(async () => {
        if (!hasMoreReceived || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/transferhistory/received`, {
                params: { page: nextPage }
            });
            
            if (response.data.data && response.data.data.length > 0) {
                setAllReceivedTransfers(prev => [...prev, ...response.data.data]);
                setCurrentPage(nextPage);
                setHasMoreReceived(response.data.current_page < response.data.last_page);
            } else {
                setHasMoreReceived(false);
            }
        } catch (error) {
            console.error('Error loading more received transfers:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMoreReceived, loading]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getHandleIcon = (type: 'custom' | 'domain') => {
        return type === 'domain' ? faGlobeAmericas : faGlobe;
    };

    return (
        <>
            <Head>
                <title>Transfer History - Your Handle Transfers</title>
                <meta name="description" content="View your domain and custom handle transfer history" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>
            <Tooltip id="transfer-tooltip" />
            <DraggableMenu auth={auth} />
            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">
                
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl">
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faHistory} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">Transfer History</h1>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Sent Transfers */}
                                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                                        <FontAwesomeIcon icon={faExchangeAlt} className="mr-2 text-yellow-400" />
                                        <span>Sent Transfers</span>
                                    </h2>

                                    {allSentTransfers.length > 0 ? (
                                        <div className="space-y-4">
                                            {allSentTransfers.map(transfer => (
                                                <div key={transfer.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon 
                                                                icon={getHandleIcon(transfer.handle_type)} 
                                                                className="text-lg mr-3 text-cyan-400"
                                                                data-tooltip-id="transfer-tooltip"
                                                                data-tooltip-content={transfer.handle_type === 'domain' ? 'Domain Handle' : 'Custom Handle'}
                                                            />
                                                            <a 
                                                                href={transfer.handle_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="font-medium text-white hover:underline"
                                                                data-tooltip-id="transfer-tooltip"
                                                                data-tooltip-content="View handle in a new tab"
                                                            >
                                                                {transfer.handle_name}
                                                            </a>
                                                        </div>
                                                        <div 
                                                            className="flex items-center"
                                                            data-tooltip-id="transfer-tooltip"
                                                            data-tooltip-content={`Status: ${transfer.used ? 'Completed' : 'Pending'}`}
                                                        >
                                                            {getStatusIcon(transfer.used)}
                                                            <span className="ml-2 text-sm text-gray-300 capitalize">
                                                                {transfer.used ? 'Completed' : 'Pending'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {transfer.recipient ? (
                                                        <div 
                                                            className="flex items-center text-sm text-gray-400 mt-3"
                                                            data-tooltip-id="transfer-tooltip"
                                                            data-tooltip-content={`Sent to ${transfer.recipient.name} (${transfer.recipient.email})`}
                                                        >
                                                            <FontAwesomeIcon icon={faUser} className="mr-2" />
                                                            <span>To: {transfer.recipient.name} ({transfer.recipient.email})</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-400 mt-3">
                                                            <FontAwesomeIcon icon={faClock} className="mr-2" />
                                                            <span>Waiting for recipient</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between text-xs text-gray-500 mt-3">
                                                        <span
                                                            data-tooltip-id="transfer-tooltip"
                                                            data-tooltip-content={`Created on ${formatDate(transfer.created_at)}`}
                                                        >
                                                            Created: {formatDate(transfer.created_at)}
                                                        </span>
                                                        {transfer.transferred_at && (
                                                            <span
                                                                data-tooltip-id="transfer-tooltip"
                                                                data-tooltip-content={`Completed on ${formatDate(transfer.transferred_at)}`}
                                                            >
                                                                Completed: {formatDate(transfer.transferred_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            You haven't initiated any transfers yet.
                                        </div>
                                    )}

                                    {hasMoreSent && (
                                        <div className="mt-4 flex justify-center">
                                            <button
                                                onClick={loadMoreSentTransfers}
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                                data-tooltip-id="transfer-tooltip"
                                                data-tooltip-content="Load more sent transfer records"
                                            >
                                                {loading ? (
                                                    <>
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                        Loading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faPlus} />
                                                        Load More
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Received Transfers */}
                                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                                        <FontAwesomeIcon icon={faExchangeAlt} className="mr-2 text-green-400" />
                                        <span>Received Transfers</span>
                                    </h2>

                                    {allReceivedTransfers.length > 0 ? (
                                        <div className="space-y-4">
                                            {allReceivedTransfers.map(transfer => (
                                                <div key={transfer.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon 
                                                                icon={getHandleIcon(transfer.handle_type)} 
                                                                className="text-lg mr-3 text-cyan-400"
                                                                data-tooltip-id="transfer-tooltip"
                                                                data-tooltip-content={transfer.handle_type === 'domain' ? 'Domain Handle' : 'Custom Handle'}
                                                            />
                                                            <a 
                                                                href={transfer.handle_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="font-medium text-white hover:underline"
                                                                data-tooltip-id="transfer-tooltip"
                                                                data-tooltip-content="View handle in a new tab"
                                                            >
                                                                {transfer.handle_name}
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center"
                                                            data-tooltip-id="transfer-tooltip"
                                                            data-tooltip-content="Status: Completed"
                                                        >
                                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                                                            <span className="ml-2 text-sm text-gray-300 capitalize">
                                                                Completed
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center text-sm text-gray-400 mt-3"
                                                        data-tooltip-id="transfer-tooltip"
                                                        data-tooltip-content={`Received from ${transfer.sender?.name} (${transfer.sender?.email})`}
                                                    >
                                                        <FontAwesomeIcon icon={faUser} className="mr-2" />
                                                        <span>From: {transfer.sender?.name} ({transfer.sender?.email})</span>
                                                    </div>

                                                    <div className="flex justify-between text-xs text-gray-500 mt-3">
                                                        <span
                                                            data-tooltip-id="transfer-tooltip"
                                                            data-tooltip-content={`Created on ${formatDate(transfer.created_at)}`}
                                                        >
                                                            Created: {formatDate(transfer.created_at)}
                                                        </span>
                                                        <span
                                                            data-tooltip-id="transfer-tooltip"
                                                            data-tooltip-content={`Received on ${formatDate(transfer.transferred_at)}`}
                                                        >
                                                            Received: {formatDate(transfer.transferred_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            You haven't received any transfers yet.
                                        </div>
                                    )}

                                    {hasMoreReceived && (
                                        <div className="mt-4 flex justify-center">
                                            <button
                                                onClick={loadMoreReceivedTransfers}
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                                data-tooltip-id="transfer-tooltip"
                                                data-tooltip-content="Load more received transfer records"
                                            >
                                                {loading ? (
                                                    <>
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                        Loading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faPlus} />
                                                        Load More
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-center">
                                <button 
                                    className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    data-tooltip-id="transfer-tooltip"
                                    data-tooltip-content="Scroll to the top of the page"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    Back to Top
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}