import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes,
    faGlobe,
    faReceipt,
    faCoins,
    faArrowUp,
    faArrowDown,
    faHistory,
    faExchangeAlt,
    faDollarSign,
    faCheckCircle,
    faSpinner,
    faPlus,
    faHourglassHalf,
    faSyncAlt,
    faFileInvoiceDollar,
    faCalendarDay,
    faWallet,
    faShoppingCart,
    faLink,
    faChartLine,
    faChartPie,
    faWrench,
    faMinus,
    faSignOutAlt,
    faComments,
    faRobot,
    faDatabase,
    faClock,
    faCalendar,
    faBrain,
    faChevronRight,
    faUndo,
    faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import 'react-tooltip/dist/react-tooltip.css';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';

// ============================================
// INTERFACES
// ============================================

interface AIStats {
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    todayConversations: number;
    todayMessages: number;
    weekConversations: number;
    avgMessagesPerConversation: number;
    favoriteModel: string;
    lastActive: string;
    memberSince: string;
}

interface RecentConversation {
    id: number;
    slug: string;
    conversation_id: string;
    conversation_title: string;
    query: string;
    created_at: string;
    created_at_formatted: string;
    created_at_diff: string;
    message_count: number;
    total_tokens: number;
    conversation_cost: number;
    model: string;
}

interface ModelUsage {
    model: string;
    count: number;
    percentage: number;
}

interface LanguageStat {
    code: string;
    name: string;
    count: number;
    percentage: number;
}

interface TopConversation {
    id: number;
    slug: string;
    conversation_title: string;
    message_count: number;
    total_tokens: number;
    conversation_cost: number;
    created_at: string;
    created_at_formatted: string;
}

interface BusinessStats {
    transactions: { value: number; change: number | string; trend: string };
    token_balance: { value: string; change: number | string; trend: string };
    domains: { value: number; change: number | string; trend: string };
}

interface Activity {
    icon: string;
    color: string;
    bgColor: string;
    title: string;
    description: string;
    time: string;
}

interface Domain {
    name: string;
    status: string;
    expires: string;
}

interface Transaction {
    date: string;
    type: string;
    amount: number;
    status: string;
}

interface ComingSoonModalState {
    isOpen: boolean;
    feature: string;
    description: string;
    iconColor: string;
    icon: JSX.Element | null;
}

interface DashboardProps {
    auth: { user: any };
    userBalance: { bee_points_balance: number } | null;

    // AI Section
    aiStats: AIStats;
    recentConversations: RecentConversation[];
    modelUsage: ModelUsage[];
    languageStats: LanguageStat[];
    topConversations: TopConversation[];

    // Business Section
    businessStats: BusinessStats;
    recentActivity: Activity[];
    domains: Domain[];
    transactions: Transaction[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function UnifiedDashboard() {
    const { 
        auth, 
        userBalance,
        aiStats,
        recentConversations,
        modelUsage,
        languageStats,
        topConversations,
        businessStats,
        recentActivity,
        domains,
        transactions 
    } = usePage<SharedData & DashboardProps>().props;

    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState<'ai' | 'business'>('ai');

    // Coming Soon Modal State
    const [comingSoonModal, setComingSoonModal] = useState<ComingSoonModalState>({
        isOpen: false,
        feature: '',
        description: '',
        iconColor: '',
        icon: null,
    });

    // ============================================
    // HANDLERS
    // ============================================

    const handleLogout = useCallback(async () => {
        router.post('/logout');
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            window.location.href = '/ai/dashboard/export';
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    const refreshDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/dashboard/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            
            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const openComingSoonModal = useCallback((feature: string, description: string, iconColor: string, icon: JSX.Element) => {
        setComingSoonModal({
            isOpen: true,
            feature,
            description,
            iconColor,
            icon,
        });
    }, []);

    const closeComingSoonModal = useCallback(() => {
        setComingSoonModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    const formatCost = (cost: number | undefined | null): string => {
        if (cost === undefined || cost === null) return '0.0000';
        const numCost = Number(cost);
        if (isNaN(numCost)) return '0.0000';
        return numCost.toFixed(4);
    };

    const formatNumber = (num: number): string => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const formatBeePoints = (amount: number) => {
        return `EZ$${amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatWithBeePrefix = (value: string) => {
        const numericValue = parseFloat(value.replace(/,/g, ''));
        if (isNaN(numericValue)) return `EZ$${value}`;
        return `EZ$${numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getModelIcon = (model: string) => {
        if (model.includes('kimi')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center border border-yellow-400/30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                </div>
            );
        }
        return (
            <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center border border-gray-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v8M8 12h8"/>
                </svg>
            </div>
        );
    };

    const getLanguageColor = (code: string) => {
        const colors: Record<string, string> = {
            'en': 'bg-yellow-400',
            'zh': 'bg-red-500',
            'ja': 'bg-purple-500',
            'ko': 'bg-green-500',
            'ar': 'bg-orange-500',
        };
        return colors[code] || 'bg-gray-500';
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'completed':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'pending':
                return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30';
            default:
                return 'bg-gray-600/30 text-gray-300 border border-gray-500/30';
        }
    };

    const getTransactionTypeInfo = (type: string) => {
        switch (type.toLowerCase()) {
            case 'purchase':
                return { icon: faShoppingCart, color: 'text-yellow-400' };
            case 'invoice paid':
                return { icon: faFileInvoiceDollar, color: 'text-green-400' };
            case 'funnel usage':
                return { icon: faWrench, color: 'text-yellow-400' };
            case 'domain renewal':
                return { icon: faSyncAlt, color: 'text-yellow-400' };
            case 'domain purchase':
                return { icon: faGlobe, color: 'text-yellow-400' };
            case 'token transfer':
                return { icon: faExchangeAlt, color: 'text-yellow-400' };
            case 'commission':
                return { icon: faCoins, color: 'text-yellow-400' };
            default:
                return { icon: faExchangeAlt, color: 'text-gray-400' };
        }
    };

    const getIconFromName = (iconName: string) => {
        const iconMap: { [key: string]: any } = {
            'faShoppingCart': faShoppingCart,
            'faLink': faLink,
        };
        return iconMap[iconName] || faLink;
    };

    const formatChangeValue = (change: number | string) => {
        if (change === 'N/A') return 'N/A';
        return `${change}%`;
    };

    const getTrendColor = (change: number | string, trend: string) => {
        if (change === 'N/A') return 'text-gray-400';
        return trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            <Head>
                <title>Unified Dashboard - Your Analytics Hub</title>
                <meta name="description" content="Unified dashboard with AI and business analytics" />
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
                    <div 
                        className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-7xl"
                        style={{ background: 'rgba(31, 41, 55, 0.8)' }}
                    >
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            {/* ========================================== */}
                            {/* HEADER SECTION */}
                            {/* ========================================== */}
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faChartPie} className="text-yellow-400 text-2xl" />
                                    <h1 className="text-2xl font-bold text-white">Unified Dashboard</h1>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Tab Toggle */}
                                    <div className="flex items-center gap-1 bg-gray-900/50 rounded-xl p-1 border border-gray-700">
                                        <button
                                            onClick={() => setActiveTab('ai')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                activeTab === 'ai' 
                                                    ? 'bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-400/20' 
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="View AI analytics"
                                        >
                                            <FontAwesomeIcon icon={faRobot} className="mr-2" />
                                            AI Analytics
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('business')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                activeTab === 'business' 
                                                    ? 'bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-400/20' 
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="View business analytics"
                                        >
                                            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                                            Business Analytics
                                        </button>
                                    </div>

                                    <button
                                        onClick={refreshDashboard}
                                        className="flex items-center gap-2 bg-yellow-400 text-black font-bold py-2 px-5 rounded-md hover:bg-yellow-500 transition-colors"
                                        disabled={loading}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Refresh dashboard data"
                                    >
                                        <FontAwesomeIcon icon={faSyncAlt} className={loading ? 'animate-spin' : ''} />
                                        Refresh
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 bg-red-500/80 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-md transition-colors border border-red-400/30"
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Log out of your account"
                                    >
                                        <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>

                            {/* ========================================== */}
                            {/* AI SECTION */}
                            {/* ========================================== */}
                            {activeTab === 'ai' && (
                                <div className="space-y-6">
                                    {/* AI Welcome */}
                                    <div className="mb-4">
                                        <h2 className="text-xl font-bold text-white flex items-center">
                                            <FontAwesomeIcon icon={faRobot} className="text-yellow-400 mr-3" />
                                            AI Analytics Dashboard
                                        </h2>
                                        <p className="text-gray-400 mt-1">Track your AI conversation usage and performance.</p>
                                    </div>

                                    {/* AI Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-yellow-400/50 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center border border-yellow-400/30">
                                                    <FontAwesomeIcon icon={faComments} className="text-yellow-400 text-xl" />
                                                </div>
                                                <span className="text-xs font-medium text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full border border-yellow-400/30">Total</span>
                                            </div>
                                            <h3 className="text-3xl font-bold text-white">{formatNumber(aiStats.totalConversations)}</h3>
                                            <p className="text-sm text-gray-400">Conversations</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatNumber(aiStats.totalMessages)} messages total</p>
                                        </div>

                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-yellow-400/50 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                                                    <FontAwesomeIcon icon={faDatabase} className="text-purple-400 text-xl" />
                                                </div>
                                                <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full border border-purple-500/30">Usage</span>
                                            </div>
                                            <h3 className="text-3xl font-bold text-white">{formatNumber(aiStats.totalTokens)}</h3>
                                            <p className="text-sm text-gray-400">Total Tokens</p>
                                            <p className="text-xs text-gray-500 mt-1">${formatCost(aiStats.totalCost)} estimated cost</p>
                                        </div>

                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-yellow-400/50 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                                                    <FontAwesomeIcon icon={faClock} className="text-green-400 text-xl" />
                                                </div>
                                                <span className="text-xs font-medium text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">Today</span>
                                            </div>
                                            <h3 className="text-3xl font-bold text-white">{aiStats.todayConversations}</h3>
                                            <p className="text-sm text-gray-400">New Conversations</p>
                                            <p className="text-xs text-gray-500 mt-1">{aiStats.todayMessages} messages today</p>
                                        </div>

                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-yellow-400/50 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                                                    <FontAwesomeIcon icon={faCalendarDay} className="text-orange-400 text-xl" />
                                                </div>
                                                <span className="text-xs font-medium text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full border border-orange-500/30">This Week</span>
                                            </div>
                                            <h3 className="text-3xl font-bold text-white">{aiStats.weekConversations}</h3>
                                            <p className="text-sm text-gray-400">New Conversations</p>
                                            <p className="text-xs text-gray-500 mt-1">Avg {aiStats.avgMessagesPerConversation} msgs per conversation</p>
                                        </div>
                                    </div>

                                    {/* AI User Info Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-900/50 border border-yellow-400/30 rounded-lg p-6">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faBrain} className="text-black" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Favorite Model</p>
                                                    <p className="font-semibold text-white capitalize">{aiStats.favoriteModel}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-6">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faClock} className="text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Last Active</p>
                                                    <p className="font-semibold text-white">{aiStats.lastActive}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-6">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faCalendar} className="text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Member Since</p>
                                                    <p className="font-semibold text-white">{aiStats.memberSince}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Model Usage & Language Distribution */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <div className="lg:col-span-1 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-white mb-4">Model Usage</h3>
                                            <div className="space-y-4">
                                                {modelUsage.map((model, index) => (
                                                    <div key={index}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center space-x-2">
                                                                {getModelIcon(model.model)}
                                                                <span className="text-sm font-medium text-white capitalize">{model.model}</span>
                                                            </div>
                                                            <span className="text-sm text-gray-400">{model.count} ({model.percentage}%)</span>
                                                        </div>
                                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                                            <div 
                                                                className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                                                style={{ width: `${model.percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-white mb-4">Language Distribution</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {languageStats.map((lang, index) => (
                                                    <div key={index} className="flex-1 min-w-[150px]">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium text-white">{lang.name}</span>
                                                            <span className="text-sm text-gray-400">{lang.percentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                                            <div 
                                                                className={`${getLanguageColor(lang.code)} h-2 rounded-full transition-all duration-500`}
                                                                style={{ width: `${lang.percentage}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">{lang.count} conversations</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Conversations */}
                                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white">Recent Conversations</h3>
                                            <Link 
                                                href="/ai/history" 
                                                className="text-sm text-yellow-400 hover:text-yellow-300 font-medium flex items-center"
                                            >
                                                View All
                                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {recentConversations.map((conv) => (
                                                <Link 
                                                    key={conv.id}
                                                    href={`/X/${conv.slug}`}
                                                    className="block p-4 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700 hover:border-yellow-400/50"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                {getModelIcon(conv.model)}
                                                                <h4 className="font-medium text-white">{conv.conversation_title}</h4>
                                                            </div>
                                                            <p className="text-sm text-gray-400 line-clamp-1 mb-2">"{conv.query}"</p>
                                                            <div className="flex items-center space-x-4 text-xs">
                                                                <span className="text-gray-500">{conv.created_at_diff}</span>
                                                                <span className="text-gray-600">•</span>
                                                                <span className="text-gray-500">{conv.message_count} messages</span>
                                                                <span className="text-gray-600">•</span>
                                                                <span className="text-yellow-400 font-medium">${formatCost(conv.conversation_cost)}</span>
                                                            </div>
                                                        </div>
                                                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-600" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Top Conversations */}
                                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">Most Resource-Intensive Conversations</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-700">
                                                        <th className="text-left text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Conversation</th>
                                                        <th className="text-left text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Messages</th>
                                                        <th className="text-left text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Tokens</th>
                                                        <th className="text-left text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Cost</th>
                                                        <th className="text-left text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Date</th>
                                                        <th className="text-left text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topConversations.map((conv) => (
                                                        <tr key={conv.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30 transition-colors">
                                                            <td className="py-3 text-white font-medium">{conv.conversation_title}</td>
                                                            <td className="py-3 text-gray-400">{conv.message_count}</td>
                                                            <td className="py-3 text-gray-400">{formatNumber(conv.total_tokens)}</td>
                                                            <td className="py-3 text-yellow-400 font-medium">${formatCost(conv.conversation_cost)}</td>
                                                            <td className="py-3 text-gray-500">{conv.created_at_formatted}</td>
                                                            <td className="py-3">
                                                                <Link href={`/X/${conv.slug}`} className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
                                                                    View →
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ========================================== */}
                            {/* BUSINESS SECTION */}
                            {/* ========================================== */}
                            {activeTab === 'business' && (
                                <div className="space-y-6">
                                    {/* Business Welcome */}
                                    <div className="mb-4">
                                        <h2 className="text-xl font-bold text-white flex items-center">
                                            <FontAwesomeIcon icon={faChartLine} className="text-yellow-400 mr-3" />
                                            Business Analytics Dashboard
                                        </h2>
                                        <p className="text-gray-400 mt-1">Track your domains, transactions, and token balance.</p>
                                    </div>

                                    {/* Business Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-yellow-400/50 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-yellow-400 font-medium text-sm uppercase tracking-wider">Domains</p>
                                                    <h3 className="text-3xl font-bold text-white mt-1">{businessStats.domains.value}</h3>
                                                </div>
                                                <div className="w-14 h-14 rounded-full bg-yellow-400/20 flex items-center justify-center border border-yellow-400/30">
                                                    <FontAwesomeIcon icon={faGlobe} className="text-yellow-400 text-2xl" />
                                                </div>
                                            </div>
                                            <p className={`text-sm mt-4 font-semibold flex items-center ${getTrendColor(businessStats.domains.change, businessStats.domains.trend)}`}>
                                                {businessStats.domains.change !== 'N/A' && (
                                                    <FontAwesomeIcon icon={businessStats.domains.trend === 'up' ? faArrowUp : businessStats.domains.trend === 'down' ? faArrowDown : faMinus} className="mr-1.5 text-xs" />
                                                )}
                                                {businessStats.domains.change === 'N/A' ? 'No data available' : `${businessStats.domains.change}% from last month`}
                                            </p>
                                        </div>

                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-yellow-400/50 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-yellow-400 font-medium text-sm uppercase tracking-wider">Transactions</p>
                                                    <h3 className="text-3xl font-bold text-white mt-1">{businessStats.transactions.value}</h3>
                                                </div>
                                                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                                    <FontAwesomeIcon icon={faExchangeAlt} className="text-purple-400 text-2xl" />
                                                </div>
                                            </div>
                                            <p className={`text-sm mt-4 font-semibold flex items-center ${getTrendColor(businessStats.transactions.change, businessStats.transactions.trend)}`}>
                                                {businessStats.transactions.change !== 'N/A' && (
                                                    <FontAwesomeIcon icon={businessStats.transactions.trend === 'up' ? faArrowUp : businessStats.transactions.trend === 'down' ? faArrowDown : faMinus} className="mr-1.5 text-xs" />
                                                )}
                                                {businessStats.transactions.change === 'N/A' ? 'No data available' : `${businessStats.transactions.change}% from last month`}
                                            </p>
                                        </div>

                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-yellow-400/50 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-yellow-400 font-medium text-sm uppercase tracking-wider">Token Balance</p>
                                                    <h3 className="text-3xl font-bold text-white mt-1">{formatWithBeePrefix(businessStats.token_balance.value)}</h3>
                                                </div>
                                                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                                    <FontAwesomeIcon icon={faWallet} className="text-amber-400 text-2xl" />
                                                </div>
                                            </div>
                                            <p className={`text-sm mt-4 font-semibold flex items-center ${getTrendColor(businessStats.token_balance.change, businessStats.token_balance.trend)}`}>
                                                {businessStats.token_balance.change !== 'N/A' && (
                                                    <FontAwesomeIcon icon={businessStats.token_balance.trend === 'up' ? faArrowUp : businessStats.token_balance.trend === 'down' ? faArrowDown : faMinus} className="mr-1.5 text-xs" />
                                                )}
                                                {businessStats.token_balance.change === 'N/A' ? 'No data available' : `${businessStats.token_balance.change}% from last month`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recent Activity & Domains */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                                                        <FontAwesomeIcon icon={faHistory} className="text-yellow-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                                                </div>
                                            </div>
                                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                                {recentActivity.map((activity, index) => (
                                                    <div key={index} className="flex items-start space-x-4 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-700 hover:border-yellow-400/30">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.bgColor}`}>
                                                            <FontAwesomeIcon icon={getIconFromName(activity.icon)} className={`${activity.color} text-lg`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-medium truncate">{activity.title}</p>
                                                            <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                                                            <p className="text-gray-500 text-xs mt-2">{activity.time}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                                                        <FontAwesomeIcon icon={faGlobe} className="text-yellow-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white">Your Domains</h3>
                                                </div>
                                            </div>
                                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                                {domains.map((domain, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-700 hover:border-yellow-400/30">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center border border-yellow-400/30">
                                                                <FontAwesomeIcon icon={faGlobe} className="text-yellow-400 text-lg" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-medium">{domain.name}</p>
                                                                <p className="text-gray-500 text-sm">Created at: {domain.expires}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(domain.status)}`}>
                                                            {domain.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Transactions */}
                                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                                                    <FontAwesomeIcon icon={faReceipt} className="text-yellow-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-700">
                                                        <th className="text-left text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Date</th>
                                                        <th className="text-left text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Type</th>
                                                        <th className="text-right text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Amount</th>
                                                        <th className="text-center text-yellow-400 font-medium pb-3 text-sm uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactions.map((transaction, index) => {
                                                        const typeInfo = getTransactionTypeInfo(transaction.type);
                                                        return (
                                                            <tr key={index} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30 transition-colors">
                                                                <td className="py-4 text-white">{transaction.date}</td>
                                                                <td className="py-4">
                                                                    <div className="flex items-center space-x-2">
                                                                        <FontAwesomeIcon icon={typeInfo.icon} className={`${typeInfo.color} text-sm`} />
                                                                        <span className="text-gray-300">{transaction.type}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 text-right">
                                                                    <span className={`font-semibold ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                        {transaction.amount >= 0 ? '+' : ''}{formatBeePoints(Math.abs(transaction.amount))}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 text-center">
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(transaction.status)}`}>
                                                                        {transaction.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Coming Soon Modal */}
            {comingSoonModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
                        <div className={`px-6 py-5 rounded-t-2xl bg-gradient-to-r ${
                            comingSoonModal.iconColor === 'purple' ? 'from-purple-600 to-purple-700' :
                            comingSoonModal.iconColor === 'blue' ? 'from-blue-600 to-blue-700' :
                            comingSoonModal.iconColor === 'green' ? 'from-green-600 to-green-700' :
                            'from-yellow-500 to-yellow-600'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        {comingSoonModal.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{comingSoonModal.feature}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-semibold text-white">Coming Soon</span>
                                            <span className="text-white/80 text-xs">• Pre-alpha</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={closeComingSoonModal}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    aria-label="Close modal"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18"/>
                                        <path d="m6 6 12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-yellow-400 mb-2">✨ What's coming?</h4>
                                <p className="text-gray-300 leading-relaxed">{comingSoonModal.description}</p>
                            </div>
                            
                            <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700">
                                <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">Early Preview</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="m9 12 2 2 4-4"/>
                                        </svg>
                                        <span>Real-time analytics and insights</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="m9 12 2 2 4-4"/>
                                        </svg>
                                        <span>Advanced filtering and search</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="m9 12 2 2 4-4"/>
                                        </svg>
                                        <span>Custom reports and exportable data</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => {
                                        closeComingSoonModal();
                                        setTimeout(() => {
                                            alert(`You'll be notified when ${comingSoonModal.feature} launches!`);
                                        }, 100);
                                    }}
                                    className={`flex-1 px-4 py-3 ${
                                        comingSoonModal.iconColor === 'purple' ? 'bg-purple-500 hover:bg-purple-600' :
                                        comingSoonModal.iconColor === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                                        comingSoonModal.iconColor === 'green' ? 'bg-green-500 hover:bg-green-600' :
                                        'bg-yellow-400 hover:bg-yellow-500'
                                    } text-black font-bold rounded-xl transition-colors flex items-center justify-center space-x-2`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                    </svg>
                                    <span>Notify Me</span>
                                </button>
                                <button
                                    onClick={closeComingSoonModal}
                                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors border border-gray-600"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                        
                        <div className="px-6 py-3 bg-gray-900/50 border-t border-gray-700 rounded-b-2xl">
                            <p className="text-xs text-gray-500 text-center flex items-center justify-center space-x-1">
                                <span>🚧</span>
                                <span>We're working hard to bring you this feature. Stay tuned for updates!</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}