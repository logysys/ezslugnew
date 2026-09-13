import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHistory,
    faExchangeAlt,
    faCoins,
    faDollarSign,
    faCalendarAlt,
    faCheckCircle,
    faTimes,
    faSpinner,
    faArrowLeft,
    faPlus,
    faFileInvoice,
    faArrowUp,
    faArrowDown,
    faBalanceScale
} from '@fortawesome/free-solid-svg-icons';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Transaction = {
    id: number;
    amount: number;
    transaction_type: string;
    reference_id: string;
    custom_id: number | null;
    domain_id: number | null;
    balance_before: number;
    balance_after: number;
    created_at: string;
};

type Totals = {
    total: number;
    positive: number;
    negative: number;
};

export default function TokenTransactions() {
    const { auth, template, transactions, totals } = usePage<SharedData & { totals: Totals }>().props;
    const [loading, setLoading] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(transactions.current_page || 1);
    const [allTransactions, setAllTransactions] = useState<Transaction[]>(
        transactions.data.map((transaction: any) => ({
            ...transaction,
            amount: Number(transaction.amount),
            balance_before: Number(transaction.balance_before),
            balance_after: Number(transaction.balance_after)
        }))
    );
    const [hasMore, setHasMore] = useState(transactions.current_page < transactions.last_page);

    const formatBeePoints = useCallback((amount: number) => {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }, []);

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

    const getTransactionTypeIcon = useCallback((type: string) => {
        switch (type) {
            case 'handle_purchase':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mr-3" />;
            case 'deposit':
                return <FontAwesomeIcon icon={faPlus} className="text-green-400 mr-3" />;
            case 'withdrawal':
                return <FontAwesomeIcon icon={faArrowLeft} className="text-red-400 mr-3" />;
            case 'transfer':
                return <FontAwesomeIcon icon={faExchangeAlt} className="text-purple-400 mr-3" />;
            case 'reward':
                return <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-3" />;
            case 'purchase':
                return <FontAwesomeIcon icon={faDollarSign} className="text-green-400 mr-3" />;
            default:
                return <FontAwesomeIcon icon={faHistory} className="text-gray-400 mr-3" />;
        }
    }, []);

    const getTransactionTypeLabel = useCallback((type: string) => {
        switch (type) {
            case 'handle_purchase':
                return 'Handle Purchase';
            case 'deposit':
                return 'Deposit';
            case 'withdrawal':
                return 'Withdrawal';
            case 'transfer':
                return 'Transfer';
            case 'reward':
                return 'Reward';
            case 'purchase':
                return 'Purchase';
            default:
                return type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
        }
    }, []);

    const getAmountColor = useCallback((amount: number) => {
        return amount >= 0 ? 'text-green-400' : 'text-red-400';
    }, []);

    const loadMoreTransactions = useCallback(async () => {
        if (!hasMore || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/token-transactions`, {
                params: { page: nextPage }
            });
            
            if (response.data.data && response.data.data.length > 0) {
                const parsedTransactions = response.data.data.map((transaction: any) => ({
                    ...transaction,
                    amount: Number(transaction.amount),
                    balance_before: Number(transaction.balance_before),
                    balance_after: Number(transaction.balance_after)
                }));
                
                setAllTransactions(prev => [...prev, ...parsedTransactions]);
                setCurrentPage(nextPage);
                setHasMore(response.data.current_page < response.data.last_page);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more transactions:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMore, loading]);

    return (
        <>
            <Head>
                <title>Token Transactions - Your EZ$ Points History</title>
                <meta name="description" content="View your EZ$ Points transaction history" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>
            
            {/* Tooltip components */}
            <Tooltip id="action-tooltip" />
            <Tooltip id="transaction-tooltip" />
            
            <div data-tooltip-id="action-tooltip" data-tooltip-content="Drag to move the main menu">
                <DraggableMenu auth={auth} />
            </div>

            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">
                
                {isPanelVisible && (
                    <div 
                        className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl"
                        data-tooltip-id="action-tooltip"
                        data-tooltip-content="This panel displays your complete EZ$ Points transaction history"
                    >
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div 
                                    className="flex items-center space-x-3"
                                    data-tooltip-id="transaction-tooltip"
                                    data-tooltip-content="Your detailed history of all EZ$ Points transactions"
                                >
                                    <FontAwesomeIcon icon={faHistory} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">
                                        Token Transactions
                                    </h1>
                                </div>
                                <Link 
                                    href="/purchase" 
                                    className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-500 transition-colors"
                                    data-tooltip-id="action-tooltip"
                                    data-tooltip-content="Purchase more EZ$ Points"
                                >
                                    <FontAwesomeIcon icon={faCoins} />
                                    Buy More Points
                                </Link>
                            </div>

                            {/* Totals Summary Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700" data-tooltip-id="transaction-tooltip" data-tooltip-content="Your current total EZ$ Points balance">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-400">Total Balance</p>
                                            <p className="text-2xl font-bold text-white">
                                                EZ${formatBeePoints(totals.total)}
                                            </p>
                                        </div>
                                        <FontAwesomeIcon 
                                            icon={faBalanceScale} 
                                            className="text-yellow-400 text-xl" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700" data-tooltip-id="transaction-tooltip" data-tooltip-content="The sum of all your positive transactions">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-400">Total Deposits</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                +EZ${formatBeePoints(totals.positive)}
                                            </p>
                                        </div>
                                        <FontAwesomeIcon 
                                            icon={faArrowUp} 
                                            className="text-green-400 text-xl" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700" data-tooltip-id="transaction-tooltip" data-tooltip-content="The sum of all your negative transactions">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-400">Total Withdrawals</p>
                                            <p className="text-2xl font-bold text-red-400">
                                                -EZ${formatBeePoints(totals.negative)}
                                            </p>
                                        </div>
                                        <FontAwesomeIcon 
                                            icon={faArrowDown} 
                                            className="text-red-400 text-xl" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {loading && allTransactions.length === 0 ? (
                                <div className="flex justify-center items-center h-64">
                                    <FontAwesomeIcon icon={faSpinner} className="text-yellow-400 text-4xl animate-spin" />
                                </div>
                            ) : allTransactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <FontAwesomeIcon icon={faExchangeAlt} className="text-gray-400 text-5xl mb-4" />
                                    <h3 className="text-xl font-medium text-gray-300 mb-2">No transactions yet</h3>
                                    <p className="text-gray-400 mb-6">Your EZ$ Points transaction history will appear here</p>
                                    <Link 
                                        href="/purchase" 
                                        className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors"
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Go to the purchase page"
                                    >
                                        <FontAwesomeIcon icon={faCoins} />
                                        Buy EZ$ Points
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-900/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="transaction-tooltip" data-tooltip-content="The category of the transaction">
                                                    Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="transaction-tooltip" data-tooltip-content="The amount of EZ$ Points for this transaction">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="transaction-tooltip" data-tooltip-content="Your balance before this transaction occurred">
                                                    Balance Before
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="transaction-tooltip" data-tooltip-content="Your balance after this transaction occurred">
                                                    Balance After
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider" data-tooltip-id="transaction-tooltip" data-tooltip-content="The date and time of the transaction">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                            {allTransactions.map((transaction: Transaction) => (
                                                <tr key={transaction.id} className="hover:bg-gray-700/50 transition-colors">
                                                    <td 
                                                        className="px-6 py-4 whitespace-nowrap"
                                                        data-tooltip-id="transaction-tooltip"
                                                        data-tooltip-content={`Ref ID: ${transaction.reference_id || 'N/A'}`}
                                                    >
                                                        <div className="flex items-center">
                                                            {getTransactionTypeIcon(transaction.transaction_type)}
                                                            <span className="text-sm font-medium text-white capitalize">
                                                                {getTransactionTypeLabel(transaction.transaction_type)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td 
                                                        className="px-6 py-4 whitespace-nowrap"
                                                        data-tooltip-id="transaction-tooltip"
                                                        data-tooltip-content="Positive values are credits (deposits), negative values are debits (withdrawals)"
                                                    >
                                                        <div className={`flex items-center text-sm font-mono ${getAmountColor(transaction.amount)}`}>
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span>
                                                                {transaction.amount >= 0 ? '+' : '-'}EZ${formatBeePoints(Math.abs(transaction.amount))}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td 
                                                        className="px-6 py-4 whitespace-nowrap"
                                                        data-tooltip-id="transaction-tooltip"
                                                        data-tooltip-content="The balance of your account before this transaction was processed"
                                                    >
                                                        <div className="flex items-center text-sm text-gray-300">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span>EZ${formatBeePoints(transaction.balance_before)}</span>
                                                        </div>
                                                    </td>
                                                    <td 
                                                        className="px-6 py-4 whitespace-nowrap"
                                                        data-tooltip-id="transaction-tooltip"
                                                        data-tooltip-content="The balance of your account after this transaction was processed"
                                                    >
                                                        <div className="flex items-center text-sm text-gray-300">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span>EZ${formatBeePoints(transaction.balance_after)}</span>
                                                        </div>
                                                    </td>
                                                    <td 
                                                        className="px-6 py-4 whitespace-nowrap"
                                                        data-tooltip-id="transaction-tooltip"
                                                        data-tooltip-content="The exact date and time the transaction was recorded"
                                                    >
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-400 mr-2" />
                                                            <span className="text-sm text-gray-300">
                                                                {formatDate(transaction.created_at)}
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
                                                onClick={loadMoreTransactions}
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-6 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Load more of your transaction history"
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