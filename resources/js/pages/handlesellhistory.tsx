import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHistory,
    faReceipt,
    faCoins,
    faDollarSign,
    faCalendarAlt,
    faCheckCircle,
    faTimes,
    faSpinner,
    faArrowLeft,
    faPlus,
    faFileInvoice,
    faGlobe,
    faLink
} from '@fortawesome/free-solid-svg-icons';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Sale = {
    id: number;
    amount: number | string;
    seller_amount: number;
    commission: number;
    currency: string;
    payment_method: string;
    status: string;
    processed_at: string;
    transaction_id: string;
    invoice: {
        number: string;
        date: string;
        amount: number;
    } | null;
    domain: {
        name: string;
        selected: string;
        type: string;
        url: string;
    } | null;
};

export default function HandleSellHistory() {
    const { auth, template, sales } = usePage<SharedData>().props;
    const [loading, setLoading] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(sales.current_page || 1);
    const [allSales, setAllSales] = useState<Sale[]>(sales.data);
    const [hasMore, setHasMore] = useState(sales.current_page < sales.last_page);

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
                return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" data-tooltip-id="action-tooltip" data-tooltip-content="Completed" />;
            case 'failed':
                return <FontAwesomeIcon icon={faTimes} className="text-red-500" data-tooltip-id="action-tooltip" data-tooltip-content="Failed" />;
            case 'pending':
                return <FontAwesomeIcon icon={faSpinner} className="text-yellow-500 animate-spin" data-tooltip-id="action-tooltip" data-tooltip-content="Pending" />;
            default:
                return <FontAwesomeIcon icon={faSpinner} className="text-gray-500" data-tooltip-id="action-tooltip" data-tooltip-content="Unknown Status" />;
        }
    }, []);

    const loadMoreSales = useCallback(async () => {
        if (!hasMore || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/handlesellhistory`, {
                params: { page: nextPage }
            });
            
            if (response.data.data && response.data.data.length > 0) {
                setAllSales(prev => [...prev, ...response.data.data]);
                setCurrentPage(nextPage);
                setHasMore(response.data.current_page < response.data.last_page);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more sales:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMore, loading]);

    const formatAmount = useCallback((amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(num) ? '0.00' : num.toFixed(2);
    }, []);

    return (
        <>
            <Head>
                <title>Handle Sell History - Your Domain and Handle Sales</title>
                <meta name="description" content="View your domain and handle sales history and transactions" />
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
                                    <FontAwesomeIcon icon={faHistory} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">Handle Sell History</h1>
                                </div>
                                <Link 
                                    href="/ez-sell-price" 
                                    className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition-colors"
                                    data-tooltip-id="action-tooltip"
                                    data-tooltip-content="Go to the domain/handle marketplace"
                                >
                                    <FontAwesomeIcon icon={faGlobe} />
                                    Sell More Handles
                                </Link>
                            </div>

                            {loading && allSales.length === 0 ? (
                                <div className="flex justify-center items-center h-64">
                                    <FontAwesomeIcon icon={faSpinner} className="text-yellow-400 text-4xl animate-spin" />
                                </div>
                            ) : allSales.length === 0 ? (
                                <div className="text-center py-12">
                                    <FontAwesomeIcon icon={faReceipt} className="text-gray-400 text-5xl mb-4" />
                                    <h3 className="text-xl font-medium text-gray-300 mb-2">No sales yet</h3>
                                    <p className="text-gray-400 mb-6">Your handle sales history will appear here</p>
                                    <Link 
                                        href="/ez-sell-price" 
                                        className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors"
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Start selling your domains and handles"
                                    >
                                        <FontAwesomeIcon icon={faGlobe} />
                                        Sell Domain Handles
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-900/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The specific domain or handle that was sold">
                                                    Domain/Handle
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The official invoice for this transaction">
                                                    Invoice
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="Total sale price paid by the buyer">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The amount you received after commission">
                                                    Your Earnings
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The platform fee for facilitating the sale">
                                                    Commission
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The payment method used for the transaction">
                                                    Method
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="Current status of the transaction (e.g., completed, pending)">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="form-tooltip" data-tooltip-content="The date and time the transaction was processed">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                            {allSales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="form-tooltip" data-tooltip-content={`Sold Item: ${sale.domain?.url || 'N/A'}`}>
                                                        {sale.domain ? (
                                                            <div className="flex items-center">
                                                                <FontAwesomeIcon 
                                                                    icon={sale.domain.type === 'custom' ? faLink : faGlobe} 
                                                                    className={`mr-2 ${sale.domain.type === 'custom' ? 'text-blue-400' : 'text-green-400'}`} 
                                                                />
                                                                <a 
                                                                    href={sale.domain.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm font-medium text-white hover:underline"
                                                                    data-tooltip-id="action-tooltip"
                                                                    data-tooltip-content="View the sold domain/handle"
                                                                >
                                                                    {sale.domain.url}
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="form-tooltip" data-tooltip-content={`Invoice: ${sale.invoice?.number || 'N/A'}`}>
                                                        {sale.invoice ? (
                                                            <Link 
                                                                href={`/handle-sell-invoice/${sale.invoice.number}`} 
                                                                target="_blank"
                                                                className="flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                                                data-tooltip-id="action-tooltip"
                                                                data-tooltip-content="View invoice"
                                                            >
                                                                <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                                                                {sale.invoice.number}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="form-tooltip" data-tooltip-content="Total sale price">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(sale.amount)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="form-tooltip" data-tooltip-content="Your share of the sale">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(sale.seller_amount)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="form-tooltip" data-tooltip-content="Platform fee">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-red-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${formatAmount(sale.commission)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="form-tooltip" data-tooltip-content={`Payment via ${sale.payment_method}`}>
                                                        <span className="text-sm text-gray-300 capitalize">
                                                            {sale.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {getStatusIcon(sale.status)}
                                                            <span className="ml-2 text-sm text-gray-300 capitalize">
                                                                {sale.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="form-tooltip" data-tooltip-content={sale.processed_at}>
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-400 mr-2" />
                                                            <span className="text-sm text-gray-300">
                                                                {formatDate(sale.processed_at)}
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
                                                onClick={loadMoreSales}
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Load more sales records"
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