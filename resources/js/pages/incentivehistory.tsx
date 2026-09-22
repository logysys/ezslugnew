import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHistory,
    faGift,
    faCoins,
    faDollarSign,
    faCalendarAlt,
    faCheckCircle,
    faTimesCircle,
    faTimes,
    faSpinner,
    faArrowLeft,
    faPlus,
    faFileInvoice,
    faUserPlus,
    faCube,
    faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import 'react-tooltip/dist/react-tooltip.css';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import axios from 'axios';

type Incentive = {
    incentive_history_id: number;
    incentive_id: number;
    user_id: number;
    amount: number;
    incentive_type: string;
    description: string;
    status: string;
    reference_type: string | null;
    reference_id: number | null;
    distributed_at: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    invoice_number?: string; 
};

export default function IncentiveHistory() {
    const { auth, template, incentives } = usePage<SharedData & { incentives: any }>().props;
    const [loading, setLoading] = useState(false);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(incentives.current_page || 1);
    const [allIncentives, setAllIncentives] = useState<Incentive[]>(
        incentives.data.map((incentive: any) => ({
            ...incentive,
            amount: Number(incentive.amount)
        }))
    );
    const [hasMore, setHasMore] = useState(incentives.current_page < incentives.last_page);

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
            case 'distributed':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
            case 'failed':
                return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
            case 'pending':
                return <FontAwesomeIcon icon={faSpinner} className="text-yellow-500 animate-spin" />;
            default:
                return <FontAwesomeIcon icon={faSpinner} className="text-gray-500" />;
        }
    }, []);

    const getIncentiveIcon = useCallback((type: string) => {
        switch (type.toLowerCase()) {
            case 'sign up':
            case 'signup':
                return <FontAwesomeIcon icon={faUserPlus} className="text-blue-400" />;
            case 'create funnel':
                return <FontAwesomeIcon icon={faLayerGroup} className="text-purple-400" />;
            case 'frame create':
                return <FontAwesomeIcon icon={faCube} className="text-orange-400" />;
            default:
                return <FontAwesomeIcon icon={faGift} className="text-yellow-400" />;
        }
    }, []);

    const loadMoreIncentives = useCallback(async () => {
        if (!hasMore || loading) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await axios.get(`/incentivehistory/load-more`, {
                params: { page: nextPage }
            });
            
            if (response.data.data && response.data.data.length > 0) {
                const parsedIncentives = response.data.data.map((incentive: any) => ({
                    ...incentive,
                    amount: Number(incentive.amount)
                }));
                
                setAllIncentives(prev => [...prev, ...parsedIncentives]);
                setCurrentPage(nextPage);
                setHasMore(response.data.current_page < response.data.last_page);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more incentives:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMore, loading]);

    return (
        <>
            <Head>
                <title>Incentive History - Your Reward Transactions</title>
                <meta name="description" content="View your incentive and reward history" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>
            <Tooltip id="incentive-tooltip" />
            <DraggableMenu auth={auth} />
            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">
                
                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-6xl">
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faGift} className="text-purple-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">Incentive History</h1>
                                </div>
                                <Link 
                                    href="/dashboard" 
                                    className="flex items-center gap-2 bg-purple-500 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-600 transition-colors"
                                    data-tooltip-id="incentive-tooltip"
                                    data-tooltip-content="Return to dashboard"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    Back to Dashboard
                                </Link>
                            </div>

                            {loading && allIncentives.length === 0 ? (
                                <div className="flex justify-center items-center h-64">
                                    <FontAwesomeIcon icon={faSpinner} className="text-purple-400 text-4xl animate-spin" />
                                </div>
                            ) : allIncentives.length === 0 ? (
                                <div className="text-center py-12">
                                    <FontAwesomeIcon icon={faGift} className="text-gray-400 text-5xl mb-4" />
                                    <h3 className="text-xl font-medium text-gray-300 mb-2">No incentives yet</h3>
                                    <p className="text-gray-400 mb-6">Your incentive history will appear here as you earn rewards</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-900/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider" data-tooltip-id="incentive-tooltip" data-tooltip-content="Your unique invoice number">
                                                    Invoice
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider" data-tooltip-id="incentive-tooltip" data-tooltip-content="Type of incentive earned">
                                                    Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider" data-tooltip-id="incentive-tooltip" data-tooltip-content="Amount of Bee Points earned">
                                                    Points
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider" data-tooltip-id="incentive-tooltip" data-tooltip-content="Description of the incentive">
                                                    Description
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider" data-tooltip-id="incentive-tooltip" data-tooltip-content="Current status of the incentive">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider" data-tooltip-id="incentive-tooltip" data-tooltip-content="Date and time the incentive was distributed">
                                                    Distributed Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                            {allIncentives.map((incentive: Incentive) => (
                                                <tr key={incentive.incentive_history_id} className="hover:bg-gray-700/50 transition-colors" data-tooltip-id="incentive-tooltip" data-tooltip-content={`Incentive ID: ${incentive.incentive_id}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <a 
                                                            href={`/invoiceincentive/${incentive.invoice_number || 'INC-' + incentive.incentive_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                                            data-tooltip-id="incentive-tooltip"
                                                            data-tooltip-content="View your invoice in a new tab"
                                                        >
                                                            <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                                                            {incentive.invoice_number || 'INC-' + incentive.incentive_id}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="incentive-tooltip" data-tooltip-content={incentive.incentive_type}>
                                                        <div className="flex items-center">
                                                            {getIncentiveIcon(incentive.incentive_type)}
                                                            <span className="ml-2 text-sm font-medium text-white capitalize">
                                                                {incentive.incentive_type}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="incentive-tooltip" data-tooltip-content={`EZ$${incentive.amount.toFixed(2)}`}>
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-2" />
                                                            <span className="text-sm font-medium text-white">
                                                                EZ${incentive.amount.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4" data-tooltip-id="incentive-tooltip" data-tooltip-content={incentive.description}>
                                                        <span className="text-sm text-gray-300">
                                                            {incentive.description}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="incentive-tooltip" data-tooltip-content={`Incentive is ${incentive.status}`}>
                                                        <div className="flex items-center">
                                                            {getStatusIcon(incentive.status)}
                                                            <span className="ml-2 text-sm text-gray-300 capitalize">
                                                                {incentive.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap" data-tooltip-id="incentive-tooltip" data-tooltip-content={formatDate(incentive.distributed_at)}>
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-400 mr-2" />
                                                            <span className="text-sm text-gray-300">
                                                                {formatDate(incentive.distributed_at)}
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
                                            data-tooltip-id="incentive-tooltip"
                                            data-tooltip-content="Scroll to the top of the page"
                                        >
                                            <FontAwesomeIcon icon={faArrowLeft} />
                                            Back to Top
                                        </button>
                                        {hasMore && (
                                            <button
                                                onClick={loadMoreIncentives}
                                                disabled={loading}
                                                className="flex items-center gap-2 bg-purple-500 text-white font-bold py-2 px-6 rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50"
                                                data-tooltip-id="incentive-tooltip"
                                                data-tooltip-content="Load more incentive records"
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