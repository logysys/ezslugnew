import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import type { SharedData } from '@/types';
import DraggableMenu from '@/components/DraggableMenu';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGlobe,
    faCheckCircle,
    faExclamationTriangle,
    faTimes,
    faCopy,
    faSearch,
    faDollarSign,
    faExternalLink,
    faPlus,
    faLink,
    faCalendar,
    faCheck,
    faSave,
    faHashtag,
} from '@fortawesome/free-solid-svg-icons';

// ==================== Type Definitions ====================
interface Domain {
    id: number;
    user_id: number | null;
    funnelid: number | null;
    expire: string | null;
    email: string | null;
    hashtag: string | null;
    domain: string;
    domainselected: string;
    created_at: string;
    updated_at: string;
    handle?: string | null;
    slug?: string | null;
    conversation_id?: string | null;
    conversation_title?: string | null;
    funnel_token?: string | null;
    funnel_id?: number | null;
    status?: 'active' | 'pending';
    sells?: Array<{
        id: number;
        price: number;
        created_at: string;
    }>;
}

interface UserSlug {
    id: number;
    slug: string;
    conversation_id: string;
    conversation_title: string | null;
    funnel_id: number | null;
    funnel_token: string | null;
    created_at: string;
    created_at_formatted: string;
}

interface PaginatedDomains {
    data: Domain[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links?: any[];
    from?: number;
    to?: number;
}

interface DomainListProps {
    domains: PaginatedDomains | Domain[] | null | undefined;
    totalDomains?: number;
    currentPage?: number;
    lastPage?: number;
    perPage?: number;
    auth?: { user: any };
    tooltips?: Record<string, string>;
}

interface PaginatedResponse {
    success: boolean;
    data: Domain[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

// ==================== Constants ====================
const SORT_OPTIONS = [
    { value: 'recent', label: 'Most recent' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'alphabetical', label: 'Alphabetical' },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['value'];

const STATUS_FILTERS = [
    { value: 'all', label: 'All Domains' },
    { value: 'active', label: 'With Slug' },
    { value: 'pending', label: 'No Slug' },
] as const;

type StatusFilter = typeof STATUS_FILTERS[number]['value'];

// ==================== Utility Functions ====================
const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'N/A';
    }
};

const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return '0.00';
    const numPrice = Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

/**
 * Status is now based on whether a slug/funnel is assigned.
 * - 'active'  → domain has a funnel assigned (slug present)
 * - 'pending' → domain is waiting for a slug assignment
 */
const getDomainStatus = (domain: Domain): 'active' | 'pending' => {
    if (domain.funnelid && domain.slug) return 'active';
    return 'pending';
};

const normalizeDomains = (
    input: PaginatedDomains | Domain[] | null | undefined
): Domain[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'object' && 'data' in input && Array.isArray(input.data)) {
        return input.data;
    }
    return [];
};

// ==================== Subcomponents ====================

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="animate-spin text-yellow-400"
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const StatusBadge: React.FC<{ status: 'active' | 'pending' }> = ({ status }) => {
    const styles = {
        active: 'bg-green-400/20 text-green-400 border-green-400/30',
        pending: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
    };
    const labels = {
        active: 'Active',
        pending: 'Pending',
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 ${styles[status]} text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span className="truncate">{labels[status]}</span>
        </span>
    );
};

const CustomAlert: React.FC<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-green-500/20 border-green-500/30 text-green-400',
        error: 'bg-red-500/20 border-red-500/30 text-red-400',
        info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
        warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    };

    const icons = {
        success: (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    };

    return (
        <div
            className={`fixed top-20 right-4 z-[200] p-4 rounded-xl border ${styles[type]} bg-gray-800/90 backdrop-blur-sm shadow-2xl max-w-md animate-slide-left`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="flex-1 text-sm font-medium break-words">{message}</div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity text-gray-400"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// ==================== Domain Card Component ====================
const DomainCard: React.FC<{
    domain: Domain;
    isSelected: boolean;
    onSelect: (domain: Domain) => void;
    onCopy: (text: string, label: string) => void;
    onOpenSlug: (domain: Domain) => void;
    copiedField: string | null;
}> = ({ domain, isSelected, onSelect, onCopy, onOpenSlug, copiedField }) => {
    const status = getDomainStatus(domain);

    return (
        <div
            onClick={() => onSelect(domain)}
            className={`conversation-card bg-gray-800 border-2 rounded-2xl p-5 shadow-sm relative transition cursor-pointer ${
                isSelected
                    ? 'border-yellow-400 shadow-lg shadow-yellow-400/10'
                    : 'border-gray-700 hover:border-yellow-400'
            }`}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    {/* Domain Name + Slug Button + Status */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faGlobe} className="text-white text-sm" />
                            </div>
                            <h3 className="font-bold text-white text-base truncate">
                                {domain.domain}.{domain.domainselected}
                            </h3>
                        </div>

                        {/* Slug Button — right after domain */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenSlug(domain);
                            }}
                            className="inline-flex items-center gap-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all hover:shadow-md hover:shadow-yellow-400/10"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content={
                                domain.slug
                                    ? `Slug: /X/${domain.slug} — Click to change`
                                    : 'No slug yet — Click to assign'
                            }
                        >
                            <FontAwesomeIcon icon={faLink} className="text-[10px]" />
                            <span>{domain.slug ? 'Slug' : 'Add Slug'}</span>
                            {domain.slug ? (
                                <FontAwesomeIcon icon={faCheck} className="text-[9px] text-green-400" />
                            ) : (
                                <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                            )}
                        </button>

                        <StatusBadge status={status} />
                    </div>

                    {/* X000324 Handle */}
                    <div className="bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-600 mb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FontAwesomeIcon icon={faHashtag} className="text-purple-400 text-xs flex-shrink-0" />
                                <span className="text-xs font-mono text-purple-400 truncate">
                                    {domain.handle || 'X000324'}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCopy(domain.handle || 'X000324', `handle-${domain.id}`);
                                }}
                                className="ml-2 p-1 hover:bg-purple-500/20 rounded transition-colors text-gray-400 hover:text-purple-400 flex-shrink-0"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content="Copy handle"
                            >
                                {copiedField === `handle-${domain.id}` ? (
                                    <FontAwesomeIcon icon={faCheck} className="text-green-400 text-xs" />
                                ) : (
                                    <FontAwesomeIcon icon={faCopy} className="text-xs" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Slug preview */}
                    <div className="bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-600 mb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FontAwesomeIcon icon={faLink} className="text-yellow-400 text-xs flex-shrink-0" />
                                <span className="text-xs font-mono text-gray-400 truncate">
                                    /X/{domain.slug || 'no-slug'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                {domain.slug && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCopy(`/X/${domain.slug}`, `slug-${domain.id}`);
                                            }}
                                            className="p-1 hover:bg-yellow-500/20 rounded transition-colors text-gray-400 hover:text-yellow-400"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Copy slug"
                                        >
                                            {copiedField === `slug-${domain.id}` ? (
                                                <FontAwesomeIcon icon={faCheck} className="text-green-400 text-xs" />
                                            ) : (
                                                <FontAwesomeIcon icon={faCopy} className="text-xs" />
                                            )}
                                        </button>
                                        <a
                                            href={`/X/${domain.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1 hover:bg-yellow-500/20 rounded transition-colors text-gray-400 hover:text-yellow-400"
                                            data-tooltip-id="main-tooltip"
                                            data-tooltip-content="Open slug in new tab"
                                        >
                                            <FontAwesomeIcon icon={faExternalLink} className="text-xs" />
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between gap-2 mt-3">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faCalendar} className="text-[9px]" />
                                Created {formatDate(domain.created_at)}
                            </span>
                        </div>

                        {domain.sells && domain.sells.length > 0 && (
                            <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/30">
                                <FontAwesomeIcon icon={faDollarSign} className="text-[10px]" />
                                <span className="text-[11px] font-bold">
                                    {formatPrice(domain.sells[0].price)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Indicator */}
            {isSelected && (
                <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCheck} className="text-black text-xs" />
                    </div>
                </div>
            )}
        </div>
    );
};

// ==================== Main DomainList Component ====================
export default function DomainList({
    domains: initialDomainsProp,
    totalDomains = 0,
    currentPage = 1,
    lastPage = 1,
    perPage = 20,
    auth,
    tooltips = {},
}: DomainListProps) {
    const initialDomainsArray = useMemo(
        () => normalizeDomains(initialDomainsProp),
        [initialDomainsProp]
    );

    const [domains, setDomains] = useState<Domain[]>(initialDomainsArray);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(currentPage < lastPage);
    const [page, setPage] = useState(currentPage);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const [currentSort, setCurrentSort] = useState<SortOption>('recent');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Right-panel slug selector state
    const [slugSelector, setSlugSelector] = useState<{
        isActive: boolean;
        domain: Domain | null;
        slugs: UserSlug[];
        loading: boolean;
        selectedSlugId: number | null;
        saving: boolean;
        search: string;
    }>({
        isActive: false,
        domain: null,
        slugs: [],
        loading: false,
        selectedSlugId: null,
        saving: false,
        search: '',
    });

    const [customAlert, setCustomAlert] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({
        show: false,
        message: '',
        type: 'info',
    });

    const loaderRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const showAlert = useCallback(
        (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'error') => {
            setCustomAlert({ show: true, message, type });
        },
        []
    );

    // Stats
    const totalActive = useMemo(
        () => domains.filter((d) => getDomainStatus(d) === 'active').length,
        [domains]
    );
    const totalPending = useMemo(
        () => domains.filter((d) => getDomainStatus(d) === 'pending').length,
        [domains]
    );

    // Sync when initial prop changes (Inertia navigation)
    useEffect(() => {
        const normalized = normalizeDomains(initialDomainsProp);
        setDomains(normalized);
        setPage(currentPage);
        setHasMore(currentPage < lastPage);
    }, [initialDomainsProp, currentPage, lastPage]);

    // Filter + sort
    useEffect(() => {
        let filtered = Array.isArray(domains) ? [...domains] : [];

        if (statusFilter !== 'all') {
            filtered = filtered.filter((d) => getDomainStatus(d) === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            filtered = filtered.filter((domain) => {
                const domainName = `${domain.domain}.${domain.domainselected}`.toLowerCase();
                const handle = (domain.handle || 'X000324').toLowerCase();
                const slug = (domain.slug || '').toLowerCase();

                return (
                    domainName.includes(query) ||
                    handle.includes(query) ||
                    slug.includes(query) ||
                    domain.email?.toLowerCase().includes(query)
                );
            });
        }

        filtered.sort((a, b) => {
            switch (currentSort) {
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'alphabetical':
                    return a.domain.localeCompare(b.domain);
                case 'recent':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        setFilteredDomains(filtered);
    }, [domains, searchQuery, currentSort, statusFilter]);

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.5, rootMargin: '100px' }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
            if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, loading]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const response = await axios.get<PaginatedResponse>('/domains/load-more', {
                params: { page: page + 1, per_page: perPage },
            });

            if (response.data.success) {
                const newDomains = Array.isArray(response.data.data) ? response.data.data : [];
                setDomains((prev) => [...(Array.isArray(prev) ? prev : []), ...newDomains]);
                setPage(response.data.meta.current_page);
                setHasMore(response.data.meta.current_page < response.data.meta.last_page);
            }
        } catch (error) {
            console.error('Failed to load more domains:', error);
            showAlert('Failed to load more domains', 'error');
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, perPage, showAlert]);

    const handleCopy = useCallback(
        (text: string, label: string) => {
            navigator.clipboard.writeText(text);
            setCopiedField(label);
            showAlert('Copied to clipboard!', 'success');
            setTimeout(() => {
                setCopiedField(null);
            }, 2000);
        },
        [showAlert]
    );

    const handleSelectDomain = useCallback((domain: Domain) => {
        setSelectedDomain(domain);
    }, []);

    // Open right-panel slug selector and fetch user slugs
    const handleOpenSlug = useCallback(
        async (domain: Domain) => {
            setSlugSelector({
                isActive: true,
                domain,
                slugs: [],
                loading: true,
                selectedSlugId: null,
                saving: false,
                search: '',
            });

            setSelectedDomain(domain);

            try {
                const response = await axios.get('/domains/user-slugs');

                if (response.data.success) {
                    // Only keep slugs with a funnel (defensive — backend already filters)
                    const slugsWithFunnel: UserSlug[] = (response.data.slugs || []).filter(
                        (s: UserSlug) => s.funnel_id !== null && s.funnel_id !== undefined
                    );

                    setSlugSelector((prev) => ({
                        ...prev,
                        slugs: slugsWithFunnel,
                        loading: false,
                    }));
                } else {
                    setSlugSelector((prev) => ({ ...prev, loading: false }));
                    showAlert('Failed to load slugs.', 'error');
                }
            } catch (error) {
                console.error('Failed to load user slugs:', error);
                setSlugSelector((prev) => ({ ...prev, loading: false }));
                showAlert('Failed to load slugs. Please try again.', 'error');
            }
        },
        [showAlert]
    );

    // Close slug selector
    const handleCloseSlugSelector = useCallback(() => {
        setSlugSelector({
            isActive: false,
            domain: null,
            slugs: [],
            loading: false,
            selectedSlugId: null,
            saving: false,
            search: '',
        });
    }, []);

    // Assign selected slug to domain (updates domains.funnelid)
    const handleAssignSlug = useCallback(async () => {
        if (!slugSelector.domain || !slugSelector.selectedSlugId) {
            showAlert('Please select a slug first.', 'warning');
            return;
        }

        setSlugSelector((prev) => ({ ...prev, saving: true }));

        try {
            const csrf =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await axios.patch(
                `/domains/${slugSelector.domain.id}/assign-slug`,
                { slug_id: slugSelector.selectedSlugId },
                {
                    headers: {
                        'X-CSRF-TOKEN': csrf,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.success) {
                const updated = response.data.domain;

                // Update local state so the domain card reflects new slug + funnel
                setDomains((prev) =>
                    prev.map((d) =>
                        d.id === slugSelector.domain!.id
                            ? {
                                  ...d,
                                  funnelid: updated.funnelid,
                                  funnel_token: updated.funnel_token,
                                  slug: updated.slug,
                                  conversation_id: updated.conversation_id,
                                  conversation_title: updated.conversation_title,
                                  handle: updated.handle || d.handle,
                              }
                            : d
                    )
                );

                setSelectedDomain((prev) =>
                    prev && prev.id === slugSelector.domain!.id
                        ? {
                              ...prev,
                              funnelid: updated.funnelid,
                              funnel_token: updated.funnel_token,
                              slug: updated.slug,
                              conversation_id: updated.conversation_id,
                              conversation_title: updated.conversation_title,
                              handle: updated.handle || prev.handle,
                          }
                        : prev
                );

                showAlert('Slug assigned successfully!', 'success');

                setTimeout(() => {
                    handleCloseSlugSelector();
                }, 1200);
            } else {
                throw new Error(response.data.message || 'Failed to assign slug');
            }
        } catch (error: any) {
            console.error('Failed to assign slug:', error);
            const msg =
                error.response?.data?.message ||
                error.message ||
                'Failed to assign slug. Please try again.';
            showAlert(msg, 'error');
        } finally {
            setSlugSelector((prev) => ({ ...prev, saving: false }));
        }
    }, [slugSelector, showAlert, handleCloseSlugSelector]);

    return (
        <>
            <Head title="Domain Management" />
            <style>{`
                .react-tooltip {
                    z-index: 99999 !important;
                    opacity: 1 !important;
                    font-size: 12px;
                    padding: 4px 8px;
                }
            `}</style>

            <Tooltip
                id="main-tooltip"
                place="top"
                className="!bg-gray-800 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[100] !shadow-xl border !border-gray-700"
                effect="solid"
            />

            <DraggableMenu auth={auth} />

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-in-from-bottom-2 {
                    from { transform: translateY(0.5rem); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slide-left {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-in {
                    animation-duration: 0.3s;
                    animation-fill-mode: both;
                }
                .fade-in { animation-name: fade-in; }
                .slide-in-from-bottom-2 { animation-name: slide-in-from-bottom-2; }
                .animate-slide-left { animation: slide-left 0.3s ease-out; }
                .animate-slideDown { animation: slideDown 0.3s ease-out; }

                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1f2937; border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4b5563; border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                }
                .conversation-card:hover {
                    border-color: #fbbf24;
                    box-shadow: 0 8px 20px -6px rgba(251, 191, 36, 0.15);
                }
                button, .card-transition { transition: all 0.15s ease; }
            `}</style>

            <main className="flex-1 flex flex-col p-8 overflow-hidden">
                {isPanelVisible && (
                    <div
                        className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full max-w-7xl"
                        style={{ background: 'rgba(31, 41, 55, 0.8)' }}
                    >
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-yellow-400 tracking-tight">
                                        Domain Management
                                    </h1>
                                    <div className="flex gap-4 mt-2 items-center flex-wrap">
                                        <span className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-400/30">
                                            {totalDomains} domain{totalDomains !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-green-400 text-xs flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                            {totalActive} active
                                        </span>
                                        <span className="text-yellow-400 text-xs flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                                            {totalPending} pending
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    href="/"
                                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition shadow-lg shadow-yellow-400/20"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                    New Domain
                                </Link>
                            </div>

                            {/* Main Content */}
                            <div className="flex flex-1 gap-7 overflow-hidden">
                                {/* Left Side - Domain List */}
                                <div className="w-[40%] flex flex-col">
                                    {/* Sort and Filter */}
                                    <div className="flex justify-between items-center mb-4 px-1 gap-2">
                                        <p className="text-xs text-gray-500 font-medium">
                                            Showing {filteredDomains.length} of {totalDomains} domains
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={statusFilter}
                                                onChange={(e) =>
                                                    setStatusFilter(e.target.value as StatusFilter)
                                                }
                                                className="flex items-center gap-2 border border-gray-700 rounded-lg px-3 py-2 bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer shadow-sm hover:bg-gray-700 outline-none"
                                            >
                                                {STATUS_FILTERS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={currentSort}
                                                onChange={(e) =>
                                                    setCurrentSort(e.target.value as SortOption)
                                                }
                                                className="flex items-center gap-2 border border-gray-700 rounded-lg px-3 py-2 bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer shadow-sm hover:bg-gray-700 outline-none"
                                            >
                                                {SORT_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Search */}
                                    <div className="mb-6">
                                        <div className="relative w-full max-w-4xl">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                                                <FontAwesomeIcon icon={faSearch} className="text-base" />
                                            </span>
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by domain, handle, slug, or email..."
                                                className="w-full pl-11 pr-5 py-3.5 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50 outline-none bg-gray-800 text-white placeholder-gray-500 shadow-sm transition"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Domain List */}
                                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh)]">
                                        {filteredDomains.length === 0 ? (
                                            <div className="text-center py-20 bg-gray-800 rounded-2xl border-2 border-gray-700 shadow-sm">
                                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faGlobe} className="text-4xl text-gray-500" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                    {searchQuery ? 'No matches found' : 'No domains yet'}
                                                </h3>
                                                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                                    {searchQuery
                                                        ? `No domains match "${searchQuery}". Try different keywords.`
                                                        : 'Get your first custom domain to establish your online presence.'}
                                                </p>
                                                <Link
                                                    href="/"
                                                    className="inline-flex items-center px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-sm font-bold transition shadow-lg shadow-yellow-400/20"
                                                >
                                                    <FontAwesomeIcon icon={faPlus} className="mr-2 text-sm" />
                                                    Get a Domain
                                                </Link>
                                            </div>
                                        ) : (
                                            filteredDomains.map((domain) => (
                                                <DomainCard
                                                    key={domain.id}
                                                    domain={domain}
                                                    isSelected={selectedDomain?.id === domain.id}
                                                    onSelect={handleSelectDomain}
                                                    onCopy={handleCopy}
                                                    onOpenSlug={handleOpenSlug}
                                                    copiedField={copiedField}
                                                />
                                            ))
                                        )}
                                    </div>

                                    {/* Load More */}
                                    <div ref={loaderRef} className="py-12 text-center">
                                        {loading && (
                                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800 border-2 border-gray-700 rounded-2xl shadow-sm">
                                                <LoadingSpinner size={22} />
                                                <span className="text-sm font-medium text-gray-300">
                                                    Loading more domains...
                                                </span>
                                            </div>
                                        )}
                                        {!hasMore && domains.length > 0 && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                                <div className="w-12 h-px bg-gradient-to-r from-transparent to-gray-600" />
                                                <span>You've reached the end</span>
                                                <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side - Slug Selector or Blank */}
                                <div className="w-[60%]">
                                    <div className="bg-gray-800 border border-gray-700 rounded-3xl shadow-xl flex flex-col h-full">
                                        {/* Header */}
                                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                <FontAwesomeIcon
                                                    icon={slugSelector.isActive ? faLink : faGlobe}
                                                    className="text-yellow-400"
                                                />
                                                {slugSelector.isActive
                                                    ? 'Assign Slug to Domain'
                                                    : 'Domain Details'}
                                            </h2>

                                            {slugSelector.isActive && (
                                                <button
                                                    onClick={handleCloseSlugSelector}
                                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                                                    data-tooltip-id="main-tooltip"
                                                    data-tooltip-content="Close slug selector"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                            {!slugSelector.isActive ? (
                                                /* ------------------------- Default View ------------------------- */
                                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-yellow-400/10 rounded-3xl flex items-center justify-center border border-yellow-500/30">
                                                        <FontAwesomeIcon icon={faGlobe} className="text-4xl text-yellow-400" />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xl font-bold text-white mb-2">
                                                            {selectedDomain ? 'Domain Selected' : 'No Domain Selected'}
                                                        </h3>
                                                        <p className="text-gray-400 max-w-sm">
                                                            {selectedDomain
                                                                ? `You've selected ${selectedDomain.domain}.${selectedDomain.domainselected}. Click "Add Slug" on the card to assign a slug.`
                                                                : 'Select a domain from the list, then click "Add Slug" to assign a slug.'}
                                                        </p>
                                                    </div>

                                                    {selectedDomain && (
                                                        <div className="w-full max-w-md space-y-4 mt-4">
                                                            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className="text-sm text-gray-400">Domain</span>
                                                                    <span className="text-sm font-mono text-white">
                                                                        {selectedDomain.domain}.
                                                                        {selectedDomain.domainselected}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className="text-sm text-gray-400">Handle</span>
                                                                    <span className="text-sm font-mono text-purple-400">
                                                                        {selectedDomain.handle || 'X000324'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm text-gray-400">Slug</span>
                                                                    <span className="text-sm font-mono text-yellow-400">
                                                                        /X/{selectedDomain.slug || 'no-slug'}
                                                                    </span>
                                                                </div>
                                                                {selectedDomain.funnel_token && (
                                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-600">
                                                                        <span className="text-sm text-gray-400">Funnel</span>
                                                                        <span className="text-sm font-mono text-green-400">
                                                                            {selectedDomain.funnel_token}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => handleOpenSlug(selectedDomain)}
                                                                className="w-full flex items-center justify-center gap-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                                                            >
                                                                <FontAwesomeIcon icon={faLink} />
                                                                <span>
                                                                    {selectedDomain.slug ? 'Change Slug' : 'Add Slug'}
                                                                </span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* ---------------------- Slug Selector View ---------------------- */
                                                <div className="space-y-5">
                                                    {/* Domain context */}
                                                    {slugSelector.domain && (
                                                        <div className="bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/30 rounded-xl p-4">
                                                            <p className="text-[10px] text-yellow-400/80 uppercase font-bold tracking-wider mb-1">
                                                                Assigning slug to
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <FontAwesomeIcon icon={faGlobe} className="text-yellow-400" />
                                                                <span className="text-sm font-mono text-white font-bold">
                                                                    {slugSelector.domain.domain}.
                                                                    {slugSelector.domain.domainselected}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Search within slugs */}
                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                                            <FontAwesomeIcon icon={faSearch} className="text-sm" />
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={slugSelector.search}
                                                            onChange={(e) =>
                                                                setSlugSelector((prev) => ({
                                                                    ...prev,
                                                                    search: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Search slugs or titles..."
                                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50 outline-none bg-gray-900 text-white text-sm placeholder-gray-500"
                                                        />
                                                    </div>

                                                    {/* Slugs list */}
                                                    {slugSelector.loading ? (
                                                        <div className="flex items-center justify-center py-16">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <LoadingSpinner size={28} />
                                                                <span className="text-sm text-gray-400">
                                                                    Loading your slugs...
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        (() => {
                                                            // Only slugs with a funnel — defensive guard
                                                            const filteredSlugs = slugSelector.slugs.filter(
                                                                (s) => {
                                                                    // Skip any slug that has no funnel
                                                                    if (
                                                                        s.funnel_id === null ||
                                                                        s.funnel_id === undefined
                                                                    ) {
                                                                        return false;
                                                                    }

                                                                    if (
                                                                        !slugSelector.search.trim()
                                                                    ) {
                                                                        return true;
                                                                    }

                                                                    const q =
                                                                        slugSelector.search.toLowerCase();
                                                                    return (
                                                                        s.slug
                                                                            .toLowerCase()
                                                                            .includes(q) ||
                                                                        (
                                                                            s.conversation_title ||
                                                                            ''
                                                                        )
                                                                            .toLowerCase()
                                                                            .includes(q)
                                                                    );
                                                                }
                                                            );

                                                            if (filteredSlugs.length === 0) {
                                                                return (
                                                                    <div className="text-center py-16">
                                                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center border border-gray-600">
                                                                            <FontAwesomeIcon
                                                                                icon={faLink}
                                                                                className="text-2xl text-gray-500"
                                                                            />
                                                                        </div>
                                                                        <p className="text-gray-300 font-medium">
                                                                            {slugSelector.search
                                                                                ? 'No slugs match your search'
                                                                                : 'No slugs available'}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {slugSelector.search
                                                                                ? 'Try a different keyword.'
                                                                                : 'Create a conversation and build a funnel first to have assignable slugs.'}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div className="space-y-2">
                                                                    {filteredSlugs.map((s) => {
                                                                        const isSelected =
                                                                            slugSelector.selectedSlugId ===
                                                                            s.id;
                                                                        const alreadyAssigned =
                                                                            slugSelector.domain
                                                                                ?.funnelid &&
                                                                            s.funnel_id ===
                                                                                slugSelector
                                                                                    .domain
                                                                                    .funnelid;

                                                                        return (
                                                                            <button
                                                                                key={s.id}
                                                                                onClick={() =>
                                                                                    setSlugSelector(
                                                                                        (prev) => ({
                                                                                            ...prev,
                                                                                            selectedSlugId:
                                                                                                s.id,
                                                                                        })
                                                                                    )
                                                                                }
                                                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                                                    isSelected
                                                                                        ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/10'
                                                                                        : 'border-gray-700 bg-gray-700/30 hover:border-gray-600 hover:bg-gray-700/50'
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-start gap-3">
                                                                                    <div
                                                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                                            isSelected
                                                                                                ? 'bg-yellow-400 text-black'
                                                                                                : 'bg-gray-600/50 text-gray-300'
                                                                                        }`}
                                                                                    >
                                                                                        <FontAwesomeIcon
                                                                                            icon={faLink}
                                                                                            className="text-sm"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                            <span
                                                                                                className={`text-sm font-mono font-bold truncate ${
                                                                                                    isSelected
                                                                                                        ? 'text-yellow-400'
                                                                                                        : 'text-white'
                                                                                                }`}
                                                                                            >
                                                                                                /X/
                                                                                                {
                                                                                                    s.slug
                                                                                                }
                                                                                            </span>
                                                                                            {alreadyAssigned && (
                                                                                                <span className="inline-flex items-center gap-1 text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                                                                                                    <FontAwesomeIcon
                                                                                                        icon={
                                                                                                            faCheck
                                                                                                        }
                                                                                                        className="text-[7px]"
                                                                                                    />
                                                                                                    Current
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        {s.conversation_title && (
                                                                                            <p className="text-xs text-gray-400 mt-1 truncate">
                                                                                                {
                                                                                                    s.conversation_title
                                                                                                }
                                                                                            </p>
                                                                                        )}
                                                                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 flex-wrap">
                                                                                            <span className="flex items-center gap-1">
                                                                                                <FontAwesomeIcon
                                                                                                    icon={
                                                                                                        faCalendar
                                                                                                    }
                                                                                                    className="text-[9px]"
                                                                                                />
                                                                                                {
                                                                                                    s.created_at_formatted
                                                                                                }
                                                                                            </span>
                                                                                            {s.funnel_token && (
                                                                                                <>
                                                                                                    <span>
                                                                                                        •
                                                                                                    </span>
                                                                                                    <span className="font-mono text-purple-400">
                                                                                                        {
                                                                                                            s.funnel_token
                                                                                                        }
                                                                                                    </span>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    {isSelected && (
                                                                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                                                                                            <FontAwesomeIcon
                                                                                                icon={faCheck}
                                                                                                className="text-black text-xs"
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })()
                                                    )}

                                                    {/* Action buttons */}
                                                    {!slugSelector.loading &&
                                                        slugSelector.slugs.length > 0 && (
                                                            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 pt-4 mt-4 flex gap-3">
                                                                <button
                                                                    onClick={handleAssignSlug}
                                                                    disabled={
                                                                        slugSelector.saving ||
                                                                        !slugSelector.selectedSlugId
                                                                    }
                                                                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                                >
                                                                    {slugSelector.saving ? (
                                                                        <>
                                                                            <LoadingSpinner size={16} />
                                                                            <span>Assigning...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FontAwesomeIcon
                                                                                icon={faSave}
                                                                            />
                                                                            <span>Assign Slug</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={handleCloseSlugSelector}
                                                                    disabled={slugSelector.saving}
                                                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="p-4 border-t border-gray-700">
                                            <p className="text-[10px] text-gray-500 text-center">
                                                {slugSelector.isActive
                                                    ? 'Selecting a slug updates the domain funnel link'
                                                    : 'Domain management panel'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Custom Alert */}
            {customAlert.show && (
                <CustomAlert
                    message={customAlert.message}
                    type={customAlert.type}
                    onClose={() => setCustomAlert({ show: false, message: '', type: 'info' })}
                />
            )}
        </>
    );
}