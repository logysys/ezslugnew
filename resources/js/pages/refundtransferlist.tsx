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
    faUndo,
    faFileInvoice
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
    original_amount: number;
    buyer_payment_hold: number;
    sell_service_commission: number;
    reject_service_commission: number;
    reject_buyer_commission: number;
    total_penalty: number;
    refund_amount: number;
    status: string;
    processed_at: string;
    created_at: string;
    is_seller: boolean;
    other_party: {
        id: number;
        email: string;
    } | null;
    invoice_number?: string;
    invoice?: {
        number: string;
        date: string;
        amount: number;
    } | null;
};

export default function RefundTransferList() {
    const { auth, template, transfers } = usePage<SharedData>().props;
    const [loading, setLoading] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(transfers.current_page || 1);
    const [allTransfers, setAllTransfers] = useState<Transfer[]>(transfers.data);
    const [hasMore, setHasMore] = useState(transfers.current_page < transfers.last_page);

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

    const formatAmount = useCallback((amount: number) => {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }, []);

    const loadMoreTransfers = useCallback(async () => {
        if (!hasMore || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/refund-transfers/load-more`, {
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

    return (
        <>
            <Head>
                <title>Refunded Domain Transfers - Your Refunded Handle Transactions</title>
                <meta name="description" content="View your refunded domain transfers" />
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

            <DraggableMenu auth={auth} />
            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">
                
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl">
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faUndo} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">Refunded Domain Transfers</h1>
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
                                    <h3 className="text-xl font-medium text-gray-300 mb-2">No refunded transfers</h3>
                                    <p className="text-gray-400 mb-6">Your refunded domain transfers will appear here</p>
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
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The domain or handle that was part of the transaction">
                                                    Domain/Handle
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="Your role in this transaction (Seller or Buyer)">
                                                    Role
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="Link to the transaction invoice">
                                                    Invoice
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The initial agreed price for the transfer">
                                                    Original Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The portion of the buyer's payment held in escrow (90% of original amount)">
                                                    Buyer Payment Hold (100%)
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The fee charged to the seller for rejecting the offer (10% of original amount)">
                                                    Rejection Fee (10%)
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The amount paid to the buyer as compensation for the rejection (10% of original amount)">
                                                    Buyer Compensation (10%)
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The total penalty applied to the seller (Rejection Fee + Buyer Compensation, 20% total)">
                                                    Total Penalty (20%)
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The total amount refunded to the buyer (Original Payment Hold + Compensation, 110% total)">
                                                    Total Refund (110%)
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The other user involved in this transfer">
                                                    Other Party
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The final status of the transfer">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The date and time the refund was processed">
                                                    Processed At
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                            {allTransfers.map((transfer) => (
                                                <tr key={transfer.id} className="hover:bg-gray-700/50 transition-colors">
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
                                                        {transfer.is_seller ? (
                                                            transfer.invoice?.number ? (
                                                                <Link 
                                                                    href={`/refundinvoiceseller/${transfer.invoice.number}`}
                                                                    target="_blank"
                                                                    className="flex items-center text-blue-400 hover:underline"
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="View Invoice"
                                                                >
                                                                    <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                                                                    {transfer.invoice.number}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-400">N/A</span>
                                                            )
                                                        ) : (
                                                            transfer.invoice?.number ? (
                                                                <Link 
                                                                    href={`/refundinvoicebuyer/${transfer.invoice.number}`}
                                                                    target="_blank"
                                                                    className="flex items-center text-blue-400 hover:underline"
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="View Invoice"
                                                                >
                                                                    <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                                                                    {transfer.invoice.number}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-400">N/A</span>
                                                            )
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(transfer.original_amount)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-green-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(transfer.buyer_payment_hold)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-orange-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(transfer.reject_service_commission)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-pink-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(transfer.reject_buyer_commission)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-purple-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(transfer.total_penalty)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-teal-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(transfer.refund_amount)}
                                                            </span>
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
                                                        <span className={`text-sm ${
                                                            transfer.status === 'refunded' ? 'text-green-400' : 'text-yellow-400'
                                                        } capitalize`}>
                                                            {transfer.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center" data-tooltip-id="form-tooltip" data-tooltip-content={`Refund processed at: ${transfer.processed_at}`}>
                                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-400 mr-2" />
                                                            <span className="text-sm text-gray-300">
                                                                {formatDate(transfer.processed_at)}
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
                                                data-tooltip-content="Load more refunded transfers"
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
            </main>
        </>
    );
}