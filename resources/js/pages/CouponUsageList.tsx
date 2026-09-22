import { useEffect, useState, useRef, useMemo } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DraggableMenu from '@/components/DraggableMenu';
import AppLogoIcon from '@/components/app-logo-icon';
import axios from 'axios';
import Draggable from 'react-draggable';
import { 
    faSearch, 
    faCheckCircle, 
    faExclamationTriangle,
    faTimes,
    faGlobe,
    faLink,
    faShoppingCart,
    faCoins,
    faBolt,
    faHashtag,
    faImage,
    faPalette,
    faReceipt,
    faSignInAlt,
    faUserPlus,
    faBuilding,
    faStore,
    faSpinner,
    faTicketAlt,
    faUsers,
    faCalendarAlt,
    faDollarSign,
    faPercentage,
    faClock,
    faChartLine,
    faWallet,
    faGift,
    faStar,
    faFire,
    faArrowLeft,
    faDownload,
    faFilter,
    faCalendarWeek,
    faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

type Coupon = {
    id: number;
    title: string;
    type: string;
    coupon: string;
    offer: number;
    use_limit: number;
    limit_type: string;
    expire: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    usage_count?: number;
    remaining_uses?: number;
};

type CouponUsageRecord = {
    id: number;
    coupon_id: number;
    user_id: number;
    coupon_code: string;
    used_at: string;
    coupon?: Coupon;
};

type AuthData = {
    user?: {
        id: number;
        name: string;
        email: string;
        is_admin?: boolean;
    };
};

type Filters = {
    search?: string;
    coupon_code?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
};

type Pagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Template = {
    id: number;
    image: string;
    option?: string;
    user_id?: number;
};

type MonthlyStat = {
    month: string;
    count: number;
};

type MostUsedCoupon = {
    coupon_code: string;
    usage_count: number;
};

type CouponUsageListProps = {
    auth: AuthData;
    usages: CouponUsageRecord[];
    filters: Filters;
    pagination: Pagination;
    coupons?: Coupon[];
    template?: Template;
    totalSaved: number;
};

export default function CouponUsageList({ 
    auth, 
    usages: initialUsages, 
    filters: initialFilters, 
    pagination: initialPagination,
    coupons: initialCoupons = [],
    template,
    totalSaved: initialTotalSaved
}: CouponUsageListProps) {
    const [usages, setUsages] = useState<CouponUsageRecord[]>(initialUsages);
    const [pagination, setPagination] = useState<Pagination>(initialPagination);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showStats, setShowStats] = useState(false);
    const [statistics, setStatistics] = useState({
        total_usages: 0,
        total_saved: 0,
        usages_by_month: [] as MonthlyStat[],
        most_used_coupons: [] as MostUsedCoupon[]
    });
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    
    const dragRef = useRef(null);

    // Fetch statistics
    const fetchStatistics = async () => {
        setIsStatsLoading(true);
        try {
            const response = await axios.get(route('my-coupons.statistics'));
            setStatistics(response.data);
            setShowStats(true);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            setErrorMessage('Failed to load statistics');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setIsStatsLoading(false);
        }
    };

    const fetchFilteredUsages = async (newFilters: Filters) => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('my-coupons.list'), {
                params: {
                    ...newFilters,
                    page: newFilters.page || 1
                }
            });

            if (newFilters.page && newFilters.page > 1) {
                setUsages([...usages, ...response.data.usages]);
            } else {
                setUsages(response.data.usages);
            }
            setPagination(response.data.pagination);
            setFilters(newFilters);
        } catch (error) {
            console.error('Error fetching coupon usages:', error);
            setErrorMessage('Failed to load coupon usage data. Please try again.');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreUsages = async () => {
        if (isLoading || pagination.current_page >= pagination.last_page) return;
        
        setIsLoading(true);
        try {
            const response = await axios.get(route('my-coupons.list'), {
                params: {
                    ...filters,
                    page: pagination.current_page + 1
                }
            });

            setUsages([...usages, ...response.data.usages]);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error loading more usages:', error);
            setErrorMessage('Failed to load more data. Please try again.');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        const newFilters = { ...filters, search: searchTerm, page: 1 };
        fetchFilteredUsages(newFilters);
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        const newFilters = { ...filters, [key]: value, page: 1 };
        fetchFilteredUsages(newFilters);
    };

    const clearFilters = () => {
        setSearchTerm('');
        const newFilters = { page: 1 };
        fetchFilteredUsages(newFilters);
        setShowFilterPanel(false);
    };

    const getCouponTypeBadge = (type: string) => {
        const typeColors: Record<string, string> = {
            'percentage': 'bg-purple-500/20 text-purple-400 border border-purple-500',
            'fixed': 'bg-blue-500/20 text-blue-400 border border-blue-500',
        };
        return typeColors[type] || 'bg-gray-500/20 text-gray-400 border border-gray-500';
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMonth = (month: string) => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <>
            <Head>
                <title>My Coupon Usage - Account Dashboard</title>
                <meta name="description" content="View your coupon usage history and track your savings" />
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                    .stats-modal {
                        animation: slideUp 0.3s ease-out;
                    }
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}</style>
            </Head>

            <Tooltip id="nav-tooltip" />
            <Tooltip id="action-tooltip" />

            {auth.user ? (
                <DraggableMenu auth={auth} />   
            ) : (
                <Draggable 
                    nodeRef={dragRef}
                    bounds="parent"
                    cancel=".no-drag"
                    defaultPosition={{x: window.innerWidth - 650, y: 0}}
                >
                    <div ref={dragRef} className="space-x-4 z-10 absolute mt-5 cursor-move touch-none">
                        <div className="flex items-center gap-4">
                            <Link 
                                href={route('home')}
                                className="flex items-center px-2 py-0 rounded-full bg-[#235A72] no-drag transition-colors duration-300 hover:bg-[#1C4A5E]"
                                data-tooltip-id="nav-tooltip"
                                data-tooltip-content="Go to Homepage"
                            >
                                <AppLogoIcon className="size-8 fill-current text-[#8EF587]" />
                                <span className="ml-2 text-[#8EF587]">ez.wiki</span>
                            </Link>
                            <Link 
                                href={route('demodesign')} 
                                className="group no-drag" 
                                data-tooltip-id="nav-tooltip" 
                                data-tooltip-content="Rent and Own a Branded Staging Portal"
                            >
                                <span className="flex items-center gap-2 bg-orange-500 text-white font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-orange-600 cursor-pointer">
                                    <FontAwesomeIcon icon={faBuilding} className="text-white" />
                                    <span className="hidden group-hover:inline">EXPRESS DOMAIN</span>
                                </span>
                            </Link>
                            <Link 
                                href={route('login')} 
                                className="group no-drag" 
                                data-tooltip-id="nav-tooltip" 
                                data-tooltip-content="Sign in to your account"
                            >
                                <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                    <FontAwesomeIcon icon={faSignInAlt} className="text-[#8EF587]" />
                                    <span className="hidden group-hover:inline">SIGN IN</span>
                                </span>
                            </Link>
                            <Link 
                                href={route('register')} 
                                className="group no-drag" 
                                data-tooltip-id="nav-tooltip" 
                                data-tooltip-content="Create a new account"
                            >
                                <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                    <FontAwesomeIcon icon={faUserPlus} className="text-[#8EF587]" />
                                    <span className="hidden group-hover:inline">SIGN UP</span>
                                </span>
                            </Link>
                        </div>
                    </div>
                </Draggable>
            )}
            
            <main className="relative flex justify-end p-4 min-h-screen overflow-hidden">

                {errorMessage && (
                    <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {errorMessage}
                    </div>
                )}
                
                {successMessage && (
                    <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                        {successMessage}
                    </div>
                )}

                {/* Statistics Modal */}
                {showStats && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 overflow-y-auto">
                        <div className="bg-[#235A72] border border-[#3a7a94] text-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[85vh] overflow-y-auto stats-modal">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-bold text-yellow-400 flex items-center">
                                    <FontAwesomeIcon icon={faChartLine} className="mr-3" />
                                    My Coupon Statistics
                                </h3>
                                <button 
                                    onClick={() => setShowStats(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-xl p-6 border border-purple-500/50 text-center">
                                    <FontAwesomeIcon icon={faTicketAlt} className="text-4xl text-purple-400 mb-3" />
                                    <p className="text-gray-300 text-sm">Total Coupons Used</p>
                                    <p className="text-3xl font-bold text-white">{statistics.total_usages}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/30 to-green-600/20 rounded-xl p-6 border border-green-500/50 text-center">
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-4xl text-green-400 mb-3" />
                                    <p className="text-gray-300 text-sm">Total Money Saved</p>
                                    <p className="text-3xl font-bold text-green-400">${statistics.total_saved}</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-xl p-6 border border-blue-500/50 text-center">
                                    <FontAwesomeIcon icon={faStar} className="text-4xl text-blue-400 mb-3" />
                                    <p className="text-gray-300 text-sm">Average Savings per Coupon</p>
                                    <p className="text-3xl font-bold text-blue-400">
                                        ${statistics.total_usages > 0 
                                            ? (statistics.total_saved / statistics.total_usages).toFixed(2) 
                                            : '0'}
                                    </p>
                                </div>
                            </div>

                            {/* Monthly Usage Chart */}
                            {statistics.usages_by_month.length > 0 && (
                                <div className="bg-[#1a3a4a] rounded-xl p-6 mb-6">
                                    <h4 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                                        <FontAwesomeIcon icon={faCalendarWeek} className="mr-2" />
                                        Monthly Usage (Last 12 Months)
                                    </h4>
                                    <div className="space-y-3">
                                        {statistics.usages_by_month.map((stat, index) => {
                                            const maxCount = Math.max(...statistics.usages_by_month.map(s => s.count), 1);
                                            const percentage = (stat.count / maxCount) * 100;
                                            return (
                                                <div key={index} className="flex items-center gap-4">
                                                    <div className="w-32 text-sm text-gray-300">{formatMonth(stat.month)}</div>
                                                    <div className="flex-1 bg-gray-700 rounded-full h-8 overflow-hidden">
                                                        <div 
                                                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full rounded-full flex items-center justify-end px-3 text-sm font-semibold text-gray-900 transition-all duration-500"
                                                            style={{ width: `${percentage}%` }}
                                                        >
                                                            {percentage > 15 && `${stat.count} uses`}
                                                        </div>
                                                    </div>
                                                    {percentage <= 15 && (
                                                        <div className="text-sm text-gray-400 w-16">{stat.count} uses</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Most Used Coupons */}
                            {statistics.most_used_coupons.length > 0 && (
                                <div className="bg-[#1a3a4a] rounded-xl p-6">
                                    <h4 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                                        <FontAwesomeIcon icon={faFire} className="mr-2" />
                                        My Most Used Coupons
                                    </h4>
                                    <div className="space-y-3">
                                        {statistics.most_used_coupons.map((coupon, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-[#235A72]/50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                                        <span className="text-yellow-400 font-bold">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-mono text-yellow-400">{coupon.coupon_code}</p>
                                                        <p className="text-xs text-gray-400">Used {coupon.usage_count} times</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-2xl font-bold text-yellow-400">{coupon.usage_count}</div>
                                                    <div className="text-sm text-gray-400">uses</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isPanelVisible && (
                    <div className="relative bg-gray-900 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-7xl mt-20">
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                                    <FontAwesomeIcon icon={faTicketAlt} className="text-yellow-400" />
                                    My Coupon Usage History
                                </h1>
                                <p className="text-gray-400 mt-2">
                                    Track all your coupon redemptions and see how much you've saved
                                </p>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30 cursor-pointer hover:scale-105 transition-transform"
                                     onClick={fetchStatistics}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400 text-sm">Total Usages</p>
                                            <p className="text-2xl font-bold text-white">{pagination.total}</p>
                                        </div>
                                        <FontAwesomeIcon icon={faTicketAlt} className="text-3xl text-purple-400 opacity-50" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30 cursor-pointer hover:scale-105 transition-transform"
                                     onClick={fetchStatistics}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400 text-sm">Total Saved</p>
                                            <p className="text-2xl font-bold text-green-400">${initialTotalSaved}</p>
                                        </div>
                                        <FontAwesomeIcon icon={faWallet} className="text-3xl text-green-400 opacity-50" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-4 border border-yellow-500/30 cursor-pointer hover:scale-105 transition-transform"
                                     onClick={fetchStatistics}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400 text-sm">Avg Savings</p>
                                            <p className="text-2xl font-bold text-yellow-400">
                                                ${pagination.total > 0 
                                                    ? (initialTotalSaved / pagination.total).toFixed(2) 
                                                    : '0'}
                                            </p>
                                        </div>
                                        <FontAwesomeIcon icon={faChartLine} className="text-3xl text-yellow-400 opacity-50" />
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-[#235A72]/50 rounded-xl p-4 border border-[#3a7a94]">
                                <div className="flex justify-between items-center mb-4">
                                    <button
                                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                                        className="px-4 py-2 bg-[#1a3a4a] text-white rounded-lg hover:bg-[#2a4a5a] transition-colors flex items-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faFilter} />
                                        {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
                                    </button>
                                    {(filters.search || filters.coupon_code || filters.date_from || filters.date_to) && (
                                        <button
                                            onClick={clearFilters}
                                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                                
                                {showFilterPanel && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="relative">
                                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by coupon code..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                className="w-full pl-10 pr-4 py-2 bg-[#1a3a4a] text-white rounded-lg border border-[#3a7a94] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="date"
                                                placeholder="Date From"
                                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                                className="w-full px-4 py-2 bg-[#1a3a4a] text-white rounded-lg border border-[#3a7a94] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="date"
                                                placeholder="Date To"
                                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                                className="w-full px-4 py-2 bg-[#1a3a4a] text-white rounded-lg border border-[#3a7a94] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            />
                                        </div>
                                        <div>
                                            <select
                                                onChange={(e) => handleFilterChange('coupon_code', e.target.value)}
                                                className="w-full px-4 py-2 bg-[#1a3a4a] text-white rounded-lg border border-[#3a7a94] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            >
                                                <option value="">All Coupons</option>
                                                {initialCoupons.map((coupon) => (
                                                    <option key={coupon.id} value={coupon.coupon}>
                                                        {coupon.title} ({coupon.coupon})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={handleSearch}
                                        className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faSearch} />
                                        Search
                                    </button>
                                </div>
                            </div>

                            {/* Usage Table */}
                            <div className="bg-[#235A72]/30 rounded-xl border border-[#3a7a94] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#1a3a4a] border-b border-[#3a7a94]">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Coupon Code</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Used At</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Savings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#3a7a94]/50">
                                            {isLoading && usages.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center">
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-yellow-400" />
                                                        <p className="text-gray-400 mt-2">Loading coupon usages...</p>
                                                    </td>
                                                </tr>
                                            ) : usages.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center">
                                                        <FontAwesomeIcon icon={faTicketAlt} className="text-4xl mb-2 opacity-50" />
                                                        <p className="text-gray-400">No coupon usage records found</p>
                                                        <Link 
                                                            href={route('home')}
                                                            className="inline-block mt-4 px-6 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors"
                                                        >
                                                            Browse Coupons
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ) : (
                                                usages.map((usage) => (
                                                    <tr key={usage.id} className="hover:bg-[#1a3a4a]/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                            #{usage.id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-sm font-mono">
                                                                {usage.coupon_code}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                            {formatDate(usage.used_at)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {usage.coupon && (
                                                                <span className={`px-2 py-1 rounded-full text-xs ${getCouponTypeBadge(usage.coupon.type)}`}>
                                                                    {usage.coupon.type === 'percentage' ? 'Percentage' : 'Fixed'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {usage.coupon && (
                                                                <span className="text-green-400 font-semibold">
                                                                    {usage.coupon.type === 'percentage' 
                                                                        ? `${usage.coupon.offer}% OFF` 
                                                                        : `$${usage.coupon.offer} OFF`}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.last_page > 1 && (
                                    <div className="px-6 py-4 border-t border-[#3a7a94] flex justify-between items-center">
                                        <div className="text-sm text-gray-400">
                                            Showing {usages.length} of {pagination.total} records
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    if (pagination.current_page > 1) {
                                                        fetchFilteredUsages({ ...filters, page: pagination.current_page - 1 });
                                                    }
                                                }}
                                                disabled={pagination.current_page === 1 || isLoading}
                                                className="px-4 py-2 bg-[#1a3a4a] text-white rounded-lg hover:bg-[#2a4a5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold">
                                                Page {pagination.current_page} of {pagination.last_page}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (pagination.current_page < pagination.last_page) {
                                                        fetchFilteredUsages({ ...filters, page: pagination.current_page + 1 });
                                                    }
                                                }}
                                                disabled={pagination.current_page === pagination.last_page || isLoading}
                                                className="px-4 py-2 bg-[#1a3a4a] text-white rounded-lg hover:bg-[#2a4a5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Load More Button for Infinite Scroll */}
                            {pagination.current_page < pagination.last_page && (
                                <div className="text-center">
                                    <button
                                        onClick={loadMoreUsages}
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-[#235A72] text-white rounded-lg hover:bg-[#2a6b87] transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faBolt} />
                                                Load More Records
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}