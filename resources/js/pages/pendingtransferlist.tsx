import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faExchangeAlt,
    faUser,
    faCoins,
    faCalendarAlt,
    faCheckCircle,
    faTimes,
    faSpinner,
    faArrowLeft,
    faPlus,
    faGlobe,
    faLink,
    faQuestionCircle,
    faExclamationTriangle,
    faReceipt
} from '@fortawesome/free-solid-svg-icons';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Transfer = {
    id: number;
    domain: {
        name: string;
        selected: string;
        type: string;
        url: string;
    };
    amount: number;
    seller_amount: number;
    commission: number;
    status: string;
    expires_at: string;
    created_at: string;
    is_seller: boolean;
    other_party: {
        id: number;
        email: string;
    } | null;
    can_respond: boolean;
};

export default function PendingTransferList() {
    const { auth, template, transfers } = usePage<SharedData>().props;
    const [loading, setLoading] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(transfers.current_page || 1);
    const [allTransfers, setAllTransfers] = useState<Transfer[]>(transfers.data);
    const [hasMore, setHasMore] = useState(transfers.current_page < transfers.last_page);
    const [selectedTransfer, setSelectedTransfer] = useState<{ id: number; action: string } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    const loadMoreTransfers = useCallback(async () => {
        if (!hasMore || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/pending-transfers`, {
                params: { page: nextPage }
            });
            
            if (response.data.data && response.data.data.length > 0) {
                setAllTransfers(prev => [...prev, ...response.data.data]);
                setCurrentPage(nextPage);
                setHasMore(response.data.current_page < response.data.last_page);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more transfers:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMore, loading]);

    const handleRespond = useCallback(async (transferId: number, action: string) => {
        setSelectedTransfer({ id: transferId, action });
        setShowConfirmModal(true);
    }, []);

    const confirmRespond = useCallback(async () => {
        if (!selectedTransfer) return;
        
        const { id: transferId, action } = selectedTransfer;
        
        try {
            setLoading(true);
            setShowConfirmModal(false);
            const response = await axios.post('/seller/transfers/respond', {
                transfer_id: transferId,
                action: action
            });

            if (response.data.success) {
                setAllTransfers(prev => prev.filter(t => t.id !== transferId));
                setSuccessMessage(`Transfer ${action}ed successfully!`);
                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (error) {
            console.error(`Error ${action}ing transfer:`, error);
            setErrorMessage(`Failed to ${action} transfer. Please try again.`);
            setTimeout(() => setErrorMessage(null), 5000);
        } finally {
            setLoading(false);
            setSelectedTransfer(null);
        }
    }, [selectedTransfer]);

    return (
        <>
            <Head>
                <title>Pending Domain Transfers - Your Pending Handle Transactions</title>
                <meta name="description" content="View and manage your pending domain transfers" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>

            <Tooltip id="action-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="modal-tooltip" />

            {errorMessage && (
                <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-100 flex items-center toast-slide-in">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-100 flex items-center toast-slide-in">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    {successMessage}
                    {successMessage.includes('Invoice') && (
                        <FontAwesomeIcon icon={faReceipt} className="ml-2" />
                    )}
                </div>
            )}
            <DraggableMenu auth={auth} />
            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">
                
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl">
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faExchangeAlt} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">Pending Domain Transfers</h1>
                                </div>
                                <Link 
                                    href="/marketplace" 
                                    className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition-colors"
                                    data-tooltip-id="action-tooltip"
                                    data-tooltip-content="Go to the marketplace to buy or sell domains"
                                >
                                    <FontAwesomeIcon icon={faGlobe} />
                                    Marketplace
                                </Link>
                            </div>

                            {loading && allTransfers.length === 0 ? (
                                <div className="flex justify-center items-center h-64">
                                    <FontAwesomeIcon icon={faSpinner} className="text-yellow-400 text-4xl animate-spin" />
                                </div>
                            ) : allTransfers.length === 0 ? (
                                <div className="text-center py-12">
                                    <FontAwesomeIcon icon={faQuestionCircle} className="text-gray-400 text-5xl mb-4" />
                                    <h3 className="text-xl font-medium text-gray-300 mb-2">No pending transfers</h3>
                                    <p className="text-gray-400 mb-6">Your pending domain transfers will appear here</p>
                                    <Link 
                                        href="/marketplace" 
                                        className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors"
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Visit the Marketplace"
                                    >
                                        <FontAwesomeIcon icon={faGlobe} />
                                        Visit Marketplace
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-900/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="Accept or reject the transfer offer">
                                                    Actions
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The domain or handle being transferred">
                                                    Domain/Handle
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="Your role in this transaction (Seller or Buyer)">
                                                    Role
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The agreed price for the transfer">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The other user involved in this transfer">
                                                    Other Party
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The current status of the transfer">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The date and time this offer expires">
                                                    Expires
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                            {allTransfers.map((transfer) => (
                                                <tr key={transfer.id} className="hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {transfer.can_respond ? (
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleRespond(transfer.id, 'accept')}
                                                                    disabled={loading}
                                                                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="Accept this transfer offer"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRespond(transfer.id, 'reject')}
                                                                    disabled={loading}
                                                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="Reject this transfer offer"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400" data-tooltip-id="form-tooltip" data-tooltip-content="Awaiting response from the other party">Waiting for seller</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon 
                                                                icon={transfer.domain.type === 'custom' ? faLink : faGlobe} 
                                                                className={`mr-2 ${transfer.domain.type === 'custom' ? 'text-blue-400' : 'text-green-400'}`} 
                                                            />
                                                            <a 
                                                                href={transfer.domain.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium text-white hover:underline"
                                                                data-tooltip-id="action-tooltip"
                                                                data-tooltip-content="View the domain/handle"
                                                            >
                                                                {transfer.domain.url}
                                                            </a>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            transfer.is_seller 
                                                                ? 'bg-purple-500 text-white' 
                                                                : 'bg-blue-500 text-white'
                                                        }`} data-tooltip-id="form-tooltip" data-tooltip-content={`You are the ${transfer.is_seller ? 'Seller' : 'Buyer'}`}>
                                                            {transfer.is_seller ? 'Seller' : 'Buyer'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${transfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            {transfer.is_seller && (
                                                                <span className="ml-2 text-xs text-gray-300" data-tooltip-id="form-tooltip" data-tooltip-content="Your earnings after commission">
                                                                    (You get: EZ${transfer.seller_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {transfer.other_party ? (
                                                            <div className="flex items-center" data-tooltip-id="form-tooltip" data-tooltip-content={transfer.other_party.email}>
                                                                <FontAwesomeIcon icon={faUser} className="text-gray-400 mr-2" />
                                                                <span className="text-sm text-gray-300">
                                                                    {transfer.other_party.email}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Unknown</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-yellow-400 capitalize">
                                                            {transfer.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center" data-tooltip-id="form-tooltip" data-tooltip-content={`Offer expires at: ${transfer.expires_at}`}>
                                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-400 mr-2" />
                                                            <span className="text-sm text-gray-300">
                                                                {formatDate(transfer.expires_at)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="mt-6 flex flex-col items-center space-y-4">
                                        <button 
                                            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Scroll to the top of the page"
                                        >
                                            <FontAwesomeIcon icon={faArrowLeft} />
                                            Back to Top
                                        </button>
                                        {hasMore && (
                                            <button
                                                onClick={loadMoreTransfers}
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Load more pending transfers"
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
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {showConfirmModal && selectedTransfer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="backdrop-blur-sm rounded-lg max-w-md w-full p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4">
                                Confirm {selectedTransfer.action === 'accept' ? 'Acceptance' : 'Rejection'}
                            </h3>
                            <p className="text-gray-300 mb-6">
                                {selectedTransfer.action === 'accept' 
                                    ? 'Are you sure you want to accept this transfer and sell your domain?' 
                                    : 'Are you sure you want to reject this transfer? You will receive 10% of the amount as compensation.'}
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Cancel and close this dialog"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRespond}
                                    disabled={loading}
                                    className={`px-4 py-2 rounded transition-colors ${
                                        selectedTransfer.action === 'accept' 
                                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                    } disabled:opacity-50`}
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content={`Finalize your decision to ${selectedTransfer.action}`}
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                            Processing...
                                        </span>
                                    ) : (
                                        `Confirm ${selectedTransfer.action === 'accept' ? 'Accept' : 'Reject'}`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}