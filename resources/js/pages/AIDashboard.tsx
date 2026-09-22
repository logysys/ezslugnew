import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import type { SharedData } from '@/types';
import DraggableMenu from '@/components/DraggableMenu';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface DashboardStats {
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

interface UsageTrend {
    date: string;
    date_iso: string;
    conversations: number;
    messages: number;
    tokens: number;
    cost: number;
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

interface ComingSoonModalState {
    isOpen: boolean;
    feature: string;
    description: string;
    iconColor: string;
    icon: JSX.Element | null;
}

interface DashboardProps {
    stats: DashboardStats;
    recentConversations: RecentConversation[];
    usageTrends: UsageTrend[];
    modelUsage: ModelUsage[];
    languageStats: LanguageStat[];
    topConversations: TopConversation[];
    auth: {
        user: any;
    };
}

export default function AIDashboard({ 
    stats,
    recentConversations,
    usageTrends,
    modelUsage,
    languageStats,
    topConversations,
    auth 
}: DashboardProps) {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
    const [exporting, setExporting] = useState(false);
    
    // Coming Soon Modal State
    const [comingSoonModal, setComingSoonModal] = useState<ComingSoonModalState>({
        isOpen: false,
        feature: '',
        description: '',
        iconColor: '',
        icon: null,
    });

    // Handle new search - navigate to home page
    const handleNewSearch = useCallback(() => {
        router.visit('/');
    }, []);

    // Handle logout
    const handleLogout = useCallback(() => {
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

    // Coming Soon Modal functions
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

    const getModelIcon = (model: string) => {
        if (model.includes('kimi')) {
            return (
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                </div>
            );
        }
        return (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v8M8 12h8"/>
                </svg>
            </div>
        );
    };

    const getLanguageColor = (code: string) => {
        const colors: Record<string, string> = {
            'en': 'bg-blue-500',
            'zh': 'bg-red-500',
            'ja': 'bg-purple-500',
            'ko': 'bg-green-500',
            'ar': 'bg-yellow-500',
        };
        return colors[code] || 'bg-gray-500';
    };

    // Format cost with proper decimal places
    const formatCost = (cost: number | undefined | null): string => {
        if (cost === undefined || cost === null) return '0.0000';
        const numCost = Number(cost);
        if (isNaN(numCost)) return '0.0000';
        return numCost.toFixed(4);
    };

    // Format number with commas
    const formatNumber = (num: number): string => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
        <>
            <Head title="AI Dashboard" />
            
            <Tooltip 
                id="main-tooltip"
                place="top"
                className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[100] !shadow-xl"
                effect="solid"
            />
            
            {/* Draggable Menu */}
            <DraggableMenu auth={auth} />
            
            <div className="flex min-h-screen bg-[#FCFCFC] text-slate-800">

                {/* Main Content - with left padding to account for fixed sidebar */}
                <main className="flex-1 min-h-screen overflow-y-auto">
                    <div className="flex flex-col min-h-screen">
                        {/* Top Navigation Bar */}
<nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20 w-full">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
            {/* Logo - Text hidden on very small screens */}
            <div className="flex items-center flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 ">AI Dashboard</span>
                </Link>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
                {/* EZ Dashboard */}
                <Link
                    href="/dashboard"
                    className="group relative inline-flex items-center p-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 overflow-hidden"
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content="Go to main dashboard"
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <svg 
                        className="h-5 w-5 sm:-ml-1 sm:mr-2.5 transition-transform group-hover:scale-110" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <span className="hidden md:inline relative">EZ Dashboard</span>
                </Link>
                
                {/* Export Data */}
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="inline-flex items-center p-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content={exporting ? "Exporting..." : "Export CSV"}
                >
                    {exporting ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden lg:inline">Export Data</span>
                        </>
                    )}
                </button>
                
                {/* New Conversation */}
                <Link
                    href="/"
                    className="inline-flex items-center p-2 sm:px-4 sm:py-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-lg text-sm font-medium hover:from-[#16a34a] hover:to-[#15803d]"
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content="New Conversation"
                >
                    <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden lg:inline">New</span>
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="inline-flex items-center p-2 sm:px-4 sm:py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none transition-colors duration-200"
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content="Logout"
                >
                    <svg className="h-4 w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden md:inline">Logout</span>
                </button>
            </div>
        </div>
    </div>
</nav>

                        {/* Main Content Area */}
                        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                            {/* Welcome Section */}
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {auth.user?.name || 'User'}!</h1>
                                <p className="text-gray-600 mt-1">Here's an overview of your AI conversation activity.</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {/* Total Conversations */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="All-time total conversations"
                                        >
                                            Total
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalConversations)}</h3>
                                        <p className="text-sm text-gray-600">Conversations</p>
                                        <p className="text-xs text-gray-500"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Total messages across all conversations"
                                        >
                                            {formatNumber(stats.totalMessages)} messages total
                                        </p>
                                    </div>
                                </div>

                                {/* Token Usage */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Total token usage across all conversations"
                                        >
                                            Usage
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalTokens)}</h3>
                                        <p className="text-sm text-gray-600">Total Tokens</p>
                                        <p className="text-xs text-gray-500"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Estimated total cost based on token usage"
                                        >
                                            ${formatCost(stats.totalCost)} estimated cost
                                        </p>
                                    </div>
                                </div>

                                {/* Today's Activity */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Activity in the last 24 hours"
                                        >
                                            Today
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-bold text-gray-900">{stats.todayConversations}</h3>
                                        <p className="text-sm text-gray-600">New Conversations</p>
                                        <p className="text-xs text-gray-500"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Messages sent today"
                                        >
                                            {stats.todayMessages} messages today
                                        </p>
                                    </div>
                                </div>

                                {/* Weekly Activity */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Activity in the last 7 days"
                                        >
                                            This Week
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-bold text-gray-900">{stats.weekConversations}</h3>
                                        <p className="text-sm text-gray-600">New Conversations</p>
                                        <p className="text-xs text-gray-500"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Average messages per conversation"
                                        >
                                            Avg {stats.avgMessagesPerConversation} msgs per conversation
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* User Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-[#22c55e]/10 to-[#16a34a]/5 rounded-2xl border border-[#22c55e]/20 p-6"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Your most frequently used AI model"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-10 h-10 bg-[#22c55e] rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Favorite Model</p>
                                            <p className="font-semibold text-gray-900 capitalize">{stats.favoriteModel}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl border border-blue-500/20 p-6"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Your most recent activity"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Last Active</p>
                                            <p className="font-semibold text-gray-900">{stats.lastActive}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl border border-purple-500/20 p-6"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="When you joined ezbar.ai"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Member Since</p>
                                            <p className="font-semibold text-gray-900">{stats.memberSince}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {/* Model Usage */}
                                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Usage</h2>
                                    <div className="space-y-4">
                                        {modelUsage.map((model, index) => (
                                            <div key={index}
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={`${model.count} conversations using ${model.model}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center space-x-2">
                                                        {getModelIcon(model.model)}
                                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                                            {model.model}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-600">{model.count} ({model.percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-[#22c55e] h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${model.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Language Distribution */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h2>
                                    <div className="flex flex-wrap gap-4">
                                        {languageStats.map((lang, index) => (
                                            <div key={index} className="flex-1 min-w-[150px]"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content={`${lang.count} conversations in ${lang.name}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                                                    <span className="text-sm text-gray-600">{lang.percentage}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`${getLanguageColor(lang.code)} h-2 rounded-full transition-all duration-500`}
                                                        style={{ width: `${lang.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{lang.count} conversations</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Conversations */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
                                    <Link 
                                        href="/ai/history" 
                                        className="text-sm text-[#22c55e] hover:text-[#16a34a] font-medium flex items-center"
                                        data-tooltip-id="main-tooltip"
                                        data-tooltip-content="View all conversation history"
                                    >
                                        View All
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                                
                                <div className="space-y-4">
                                    {recentConversations.map((conv) => (
                                        <Link 
                                            key={conv.id}
                                            href={`/X/${conv.slug}`}
                                            className="block p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 hover:border-gray-200"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content={`View conversation: ${conv.conversation_title}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        {getModelIcon(conv.model)}
                                                        <h3 className="font-medium text-gray-900">{conv.conversation_title}</h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-1 mb-2">"{conv.query}"</p>
                                                    <div className="flex items-center space-x-4 text-xs">
                                                        <span className="text-gray-500"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={conv.created_at_formatted}
                                                        >
                                                            {conv.created_at_diff}
                                                        </span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-gray-500"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content={`${conv.message_count} messages in this conversation`}
                                                        >
                                                            {conv.message_count} messages
                                                        </span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-emerald-600 font-medium"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content="Estimated cost for this conversation"
                                                        >
                                                            ${formatCost(conv.conversation_cost)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Top Conversations by Usage */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Resource-Intensive Conversations</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversation</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {topConversations.map((conv) => (
                                                <tr key={conv.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900">{conv.conversation_title}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content={`${conv.message_count} messages`}
                                                    >
                                                        {conv.message_count}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content={`${formatNumber(conv.total_tokens)} total tokens used`}
                                                    >
                                                        {formatNumber(conv.total_tokens)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-emerald-600"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content="Estimated cost for this conversation"
                                                    >
                                                        ${formatCost(conv.conversation_cost)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500"
                                                        data-tooltip-id="main-tooltip"
                                                        data-tooltip-content={conv.created_at_formatted}
                                                    >
                                                        {conv.created_at_formatted}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Link 
                                                            href={`/X/${conv.slug}`}
                                                            className="text-[#22c55e] hover:text-[#16a34a] text-sm font-medium"
                                                            data-tooltip-id="main-tooltip"
                                                            data-tooltip-content="View this conversation"
                                                        >
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
                    </div>
                </main>
            </div>

            {/* Coming Soon Modal - Matching ezbar.tsx design */}
            {comingSoonModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
                        {/* Modal Header with gradient based on feature color */}
                        <div className={`px-6 py-5 rounded-t-2xl bg-gradient-to-r ${
                            comingSoonModal.iconColor === 'purple' ? 'from-purple-500 to-purple-600' :
                            comingSoonModal.iconColor === 'blue' ? 'from-blue-500 to-blue-600' :
                            comingSoonModal.iconColor === 'green' ? 'from-green-500 to-green-600' :
                            'from-orange-500 to-orange-600'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        {comingSoonModal.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{comingSoonModal.feature}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-semibold text-white"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="This feature is in development"
                                            >
                                                Coming Soon
                                            </span>
                                            <span className="text-white/80 text-xs">• Pre-alpha</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={closeComingSoonModal}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    aria-label="Close modal"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Close modal"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18"/>
                                        <path d="m6 6 12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">✨ What's coming?</h4>
                                <p className="text-gray-600 leading-relaxed">
                                    {comingSoonModal.description}
                                </p>
                            </div>
                            
                            {/* Feature Highlights */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Early Preview</h4>
                                <div className="space-y-2">
                                    {comingSoonModal.feature === 'Analytics' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Track your AI usage in real-time"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Real-time AI usage tracking and analytics</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Monitor token consumption and costs"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Token consumption and cost insights</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Generate custom reports"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Custom reports and exportable data</span>
                                            </div>
                                        </>
                                    )}
                                    {comingSoonModal.feature === 'Collections' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Organize conversations into custom groups"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Organize conversations into custom collections</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Add notes and tags to conversations"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Add notes, tags, and custom metadata</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Export entire conversation threads"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Export conversation threads</span>
                                            </div>
                                        </>
                                    )}
                                    {comingSoonModal.feature === 'Bookmarks' && (
                                        <>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Save important conversations for later"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Save important conversations</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Access your bookmarks across devices"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Cross-device synchronization</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600"
                                                data-tooltip-id="main-tooltip"
                                                data-tooltip-content="Organize bookmarks into folders"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="m9 12 2 2 4-4"/>
                                                </svg>
                                                <span>Folder organization and search</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
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
                                        'bg-orange-500 hover:bg-orange-600'
                                    } text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2`}
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Get notified when this feature launches"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                    </svg>
                                    <span>Notify Me</span>
                                </button>
                                
                                <button
                                    onClick={closeComingSoonModal}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                                    data-tooltip-id="main-tooltip"
                                    data-tooltip-content="Close this modal"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
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