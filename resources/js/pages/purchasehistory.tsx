import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHistory,
    faReceipt,
    faCoins,
    faDollarSign,
    faCalendarAlt,
    faCheckCircle,
    faTimesCircle,
    faTimes,
    faSpinner,
    faArrowLeft,
    faPlus,
    faFileInvoice
} from '@fortawesome/free-solid-svg-icons';
import 'react-tooltip/dist/react-tooltip.css';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import axios from 'axios';

type Purchase = {
    id: number;
    bee_points_amount: number;
    fiat_amount: number;
    price_per_point: number;
    payment_method: string;
    status: string;
    processed_at: string;
    transaction_hash: string;
    invoice_number: string;
};

export default function PurchaseHistory() {
    const { auth, template, purchases } = usePage<SharedData>().props;
    const [loading, setLoading] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(purchases.current_page || 1);
    const [allPurchases, setAllPurchases] = useState<Purchase[]>(
        purchases.data.map((purchase: any) => ({
            ...purchase,
            bee_points_amount: Number(purchase.bee_points_amount),
            fiat_amount: Number(purchase.fiat_amount),
            price_per_point: Number(purchase.price_per_point)
        }))
    );
    const [hasMore, setHasMore] = useState(purchases.current_page < purchases.last_page);

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

    const getStatusIcon = useCallback((status: string) => {
        switch (status) {
            case 'completed':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
            case 'failed':
                return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
            case 'pending':
                return <FontAwesomeIcon icon={faSpinner} className="text-yellow-500 animate-spin" />;
            default:
                return <FontAwesomeIcon icon={faSpinner} className="text-gray-500" />;
        }
    }, []);

    const loadMorePurchases = useCallback(async () => {
        if (!hasMore || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/purchasehistory`, {
                params: { page: nextPage }
            });
            
            if (response.data.data && response.data.data.length > 0) {
                const parsedPurchases = response.data.data.map((purchase: any) => ({
                    ...purchase,
                    bee_points_amount: Number(purchase.bee_points_amount),
                    fiat_amount: Number(purchase.fiat_amount),
                    price_per_point: Number(purchase.price_per_point)
                }));
                
                setAllPurchases(prev => [...prev, ...parsedPurchases]);
                setCurrentPage(nextPage);
                setHasMore(response.data.current_page < response.data.last_page);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more purchases:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMore, loading]);

    return (
        <>
            <Head>
                <title>Purchase History - Your Bee Points Transactions</title>
                <meta name="description" content="View your Bee Points purchase history and transactions" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>
            <Tooltip id="history-tooltip" />
            <DraggableMenu auth={auth} />
            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">
                
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl">
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faHistory} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">Purchase History</h1>
                                </div>
                                <Link 
                                    href="/purchase" 
                                    className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition-colors"
                                    data-tooltip-id="history-tooltip"
                                    data-tooltip-content="Purchase more Bee Points"
                                >
                                    <FontAwesomeIcon icon={faCoins} />
                                    Buy More Points
                                </Link>
                            </div>

                            {loading && allPurchases.length === 0 ? (
                                <div className="flex justify-center items-center h-64">
                                    <FontAwesomeIcon icon={faSpinner} className="text-yellow-400 text-4xl animate-spin" />
                                </div>
                            ) : allPurchases.length === 0 ? (
                                <div className="text-center py-12">
                                    <FontAwesomeIcon icon={faReceipt} className="text-gray-400 text-5xl mb-4" />
                                    <h3 className="text-xl font-medium text-gray-300 mb-2">No purchases yet</h3>
                                    <p className="text-gray-400 mb-6">Your Bee Points purchase history will appear here</p>
                                    <Link 
                                        href="/purchase" 
                                        className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors"
                                        data-tooltip-id="history-tooltip"
                                        data-tooltip-content="Go to the purchase page"
                                    >
                                        <FontAwesomeIcon icon={faCoins} />
                                        Buy Bee Points
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-900/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Your unique invoice number">
                                                    Invoice
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Blockchain transaction hash (if applicable)">
                                                    Transaction
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Amount of Bee Points purchased">
                                                    Points
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Total cost in fiat currency (e.g., USD)">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Cost per single Bee Point">
                                                    Price/Point
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Payment method used for the transaction">
                                                    Method
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Current status of the transaction">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="history-tooltip" data-tooltip-content="Date and time of the purchase">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                            {allPurchases.map((purchase: Purchase) => (
                                                <tr key={purchase.id} className="hover:bg-gray-700/50 transition-colors" data-tooltip-id="history-tooltip" data-tooltip-content={`Transaction ID: ${purchase.id}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {purchase.invoice_number ? (
                                                            <Link 
                                                                href={`/invoice/${purchase.invoice_number}`} 
                                                                target="_blank"
                                                                className="flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                                                data-tooltip-id="history-tooltip"
                                                                data-tooltip-content="View your invoice in a new tab"
                                                            >
                                                                <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                                                                {purchase.invoice_number}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="history-tooltip" data-tooltip-content={purchase.transaction_hash || 'No transaction hash'}>
                                                        <div className="text-sm font-mono text-purple-300">
                                                            {purchase.transaction_hash || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="history-tooltip" data-tooltip-content={`EZ$${purchase.bee_points_amount.toFixed(2)}`}>
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${purchase.bee_points_amount.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="history-tooltip" data-tooltip-content={`US$${purchase.fiat_amount.toFixed(2)}`}>
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faDollarSign} className="text-green-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                US${purchase.fiat_amount.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="history-tooltip" data-tooltip-content={`Price per point: US$${purchase.price_per_point.toFixed(2)}`}>
                                                        <span className="text-sm text-gray-300">
                                                            US${purchase.price_per_point.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="history-tooltip" data-tooltip-content={`Paid with ${purchase.payment_method}`}>
                                                        <span className="text-sm text-gray-300 capitalize">
                                                            {purchase.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="history-tooltip" data-tooltip-content={`Transaction is ${purchase.status}`}>
                                                        <div className="flex items-center">
                                                            {getStatusIcon(purchase.status)}
                                                            <span className="ml-2 text-sm text-gray-300 capitalize">
                                                                {purchase.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="history-tooltip" data-tooltip-content={formatDate(purchase.processed_at)}>
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-400 mr-2" />
                                                            <span className="text-sm text-gray-300">
                                                                {formatDate(purchase.processed_at)}
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
                                            data-tooltip-id="history-tooltip"
                                            data-tooltip-content="Scroll to the top of the page"
                                        >
                                            <FontAwesomeIcon icon={faArrowLeft} />
                                            Back to Top
                                        </button>
                                        {hasMore && (
                                            <button
                                                onClick={loadMorePurchases}
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                                data-tooltip-id="history-tooltip"
                                                data-tooltip-content="Load more purchase records"
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