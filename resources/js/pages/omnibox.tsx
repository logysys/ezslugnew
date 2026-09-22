import { useEffect, useRef, useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faGlobe, 
    faBolt, 
    faHashtag, 
    faKeyboard, 
    faArrowUp, 
    faArrowDown, 
    faTimes,
    faExternalLinkAlt,
    faFileAlt,
    faPalette,
    faLink,
    faChartBar,
    faUser,
    faCog,
    faQuestionCircle,
    faSpinner,
    faEdit,
    faEye,
    faCopy,
    faStar,
    faFilter,
    faSortAmountDown,
    faSortAmountUp,
    faRocket,
    faImage,
    faVideo,
    faThumbtack,
    faComment,
    faMobileAlt
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import axios from 'axios';

// Types
interface QuickAction {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    url?: string;
    action?: string;
    query?: string;
    shortcut: string;
}

interface SearchResult {
    type: string;
    id: number | string;
    token?: string;
    unique_id?: string;
    domain?: string;
    domainselected?: string | boolean;
    title: string;
    subtitle: string;
    description?: string;
    url?: string;
    edit_url?: string;
    preview_url?: string;
    color: string;
    icon: string;
    score: number;
    created_at?: string;
    user?: {
        id: number;
        name: string;
        email?: string;
    };
    funnel?: {
        id: number;
        token: string;
        url?: string;
    };
    action?: string;
    platform?: string;
}

interface SmartSuggestion {
    type: string;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    action: string;
    url?: string;
    query?: string;
}

interface SearchResponse {
    results: SearchResult[];
    suggestions: SmartSuggestion[];
    query: string;
    total: number;
    categories?: {
        funnel: number;
        field: number;
        custom_domain: number;
        domain: number;
        theme: number;
        social_tumblr?: number;
        social_youtube?: number;
        social_pinterest?: number;
        social_reddit?: number;
    };
    pagination?: {
        tumblr_next?: string | null;
        youtube_next?: string | null;
        reddit_after?: string | null;
    };
}

// Protocol normalization function
const normalizeProtocol = (url: string): string => {
    // Handle re:// protocol
    if (url.toLowerCase().startsWith('re://')) {
        return url.replace(/^re:\/\//i, 'https://');
    }
    
    // Handle 🀄:// protocol
    if (url.startsWith('🀄://')) {
        return url.replace(/^🀄:\/\//, 'https://');
    }
    
    return url;
};

export default function Omnibox() {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // State
    const [inputValue, setInputValue] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
    const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [lastQuery, setLastQuery] = useState('');
    const [totalResults, setTotalResults] = useState(0);
    const [resultCategories, setResultCategories] = useState<Record<string, number>>({});
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'relevance' | 'newest' | 'oldest'>('relevance');
    const [showFilters, setShowFilters] = useState(false);
    const [paginationData, setPaginationData] = useState<{
        tumblr_next?: string | null;
        youtube_next?: string | null;
        reddit_after?: string | null;
    }>({});
    
    // Load quick actions on mount
    useEffect(() => {
        // Load quick actions from backend API
        loadQuickActions();
        
        // Add global keyboard shortcut
        const handleGlobalShortcut = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsVisible(true);
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }, 100);
            }
        };
        
        document.addEventListener('keydown', handleGlobalShortcut);
        return () => document.removeEventListener('keydown', handleGlobalShortcut);
    }, []);

    // Load quick actions from API
    const loadQuickActions = async () => {
        try {
            const response = await axios.get('/omnibox/quick-actions');
            setQuickActions(response.data);
        } catch (error) {
            console.error('Failed to load quick actions, using defaults:', error);
            setQuickActions(getDefaultQuickActions());
        }
    };

    // Focus input when visible
    useEffect(() => {
        if (isVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isVisible]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsVisible(false);
            }
        };
        
        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isVisible]);

    // Default quick actions fallback
    const getDefaultQuickActions = (): QuickAction[] => [
        {
            id: 'create_funnel',
            title: 'Create New Funnel',
            subtitle: 'Start a new funnel',
            icon: '⚡',
            color: 'indigo',
            url: '/home',
            shortcut: '⌘ F'
        },
        {
            id: 'create_theme',
            title: 'Create Theme',
            subtitle: 'Design a new theme',
            icon: '🎨',
            color: 'blue',
            url: '/home',
            shortcut: '⌘ T'
        },
        {
            id: 'add_domain',
            title: 'Add Domain',
            subtitle: 'Register new domain',
            icon: '🔗',
            color: 'emerald',
            url: '/home',
            shortcut: '⌘ D'
        },
        {
            id: 'add_custom_domain',
            title: 'Add Custom Domain',
            subtitle: 'Register custom domain',
            icon: '🌐',
            color: 'purple',
            url: '/home',
            shortcut: '⌘ ⇧ D'
        },
        {
            id: 'view_dashboard',
            title: 'Go to Dashboard',
            subtitle: 'View analytics and stats',
            icon: '📊',
            color: 'purple',
            url: '/dashboard',
            shortcut: '⌘ K'
        },
        {
            id: 'search_hashtag',
            title: 'Search #Hashtag',
            subtitle: 'Find social media content',
            icon: '🏷️',
            color: 'orange',
            action: 'search_hashtag',
            shortcut: '#'
        },
        {
            id: 'global_search',
            title: 'Global Search',
            subtitle: 'Search everything',
            icon: '🔍',
            color: 'gray',
            action: 'search_all',
            shortcut: '⌘ /'
        },
        {
            id: 'view_profile',
            title: 'View Profile',
            subtitle: 'Your account settings',
            icon: '👤',
            color: 'teal',
            url: '/home',
            shortcut: '⌘ P'
        },
        {
            id: 'view_settings',
            title: 'Settings',
            subtitle: 'Configure application',
            icon: '⚙️',
            color: 'gray',
            url: '/home',
            shortcut: '⌘ ,'
        },
        {
            id: 'view_help',
            title: 'Help & Documentation',
            subtitle: 'Learn how to use',
            icon: '❓',
            color: 'blue',
            url: '/home',
            shortcut: '⌘ ?'
        }
    ];

    // Transform backend result to frontend format
    const transformBackendResult = (result: any): SearchResult => {
        // Determine color and icon based on type
        const typeConfig = getTypeConfig(result.type);
        
        // Build title and subtitle from backend data
        let title = result.title || '';
        let subtitle = result.subtitle || '';
        
        // Store the original URL for clicking
        let clickableUrl = result.url || '';
        
        if (!title) {
            switch(result.type) {
                case 'funnel':
                    title = `Funnel: ${clickableUrl || 'Unknown'}`;
                    break;
                case 'field':
                    title = `Field: ${clickableUrl || 'Unknown'}`;
                    subtitle = `${result.title || 'N/A'}`;
                    break;
                case 'custom_domain':
                    title = `Custom Domain: ${clickableUrl || 'Unknown'}`;
                    subtitle = `Selected: ${result.title || 'N/A'}`;
                    break;
                case 'domain':
                    title = `Domain: ${clickableUrl || 'Unknown'}`;
                    subtitle = `Selected: ${result.title || 'N/A'}`;
                    break;
                case 'theme':
                    title = `Theme: ${clickableUrl || 'Unknown'}`;
                    subtitle = `Unique ID: ${result.title || 'N/A'}`;
                    break;
                case 'social_tumblr':
                    title = result.title || 'Tumblr Post';
                    subtitle = result.subtitle || '';
                    break;
                case 'social_youtube':
                    title = result.title || 'YouTube Video';
                    subtitle = result.subtitle || '';
                    break;
                case 'social_pinterest':
                    title = result.title || 'Pinterest Pin';
                    subtitle = result.subtitle || '';
                    break;
                case 'social_reddit':
                    title = result.title || 'Reddit Post';
                    subtitle = result.subtitle || '';
                    break;
                default:
                    title = `${result.type}: ${result.id}`;
            }
        }
        
        // Ensure URL is properly formatted
        if (clickableUrl && !clickableUrl.startsWith('http')) {
            clickableUrl = `https://${clickableUrl}`;
        }
        
        return {
            type: result.type,
            id: result.id || Date.now(),
            token: result.token,
            unique_id: result.unique_id,
            domain: result.domain,
            domainselected: result.domainselected,
            title: title,
            subtitle: subtitle,
            description: result.description,
            url: clickableUrl,
            edit_url: result.edit_url,
            preview_url: result.preview_url,
            color: typeConfig.color,
            icon: typeConfig.icon,
            score: result.score || 50,
            created_at: result.created_at,
            user: result.user,
            funnel: result.funnel,
            action: result.action,
            platform: result.platform
        };
    };

    // Get type-specific configuration
    const getTypeConfig = (type: string) => {
        const configs: Record<string, { color: string; icon: string }> = {
            'funnel': { color: 'indigo', icon: '⚡' },
            'field': { color: 'blue', icon: '📝' },
            'custom_domain': { color: 'purple', icon: '🌐' },
            'domain': { color: 'emerald', icon: '🔗' },
            'theme': { color: 'amber', icon: '🎨' },
            'url': { color: 'teal', icon: '🔗' },
            'hashtag': { color: 'orange', icon: '🏷️' },
            'web_search': { color: 'green', icon: '🌍' },
            // Social media types
            'social_tumblr': { color: 'blue', icon: '🌼' },
            'social_youtube': { color: 'red', icon: '▶️' },
            'social_pinterest': { color: 'red', icon: '📌' },
            'social_reddit': { color: 'orange', icon: '👁️' },
            'social_search': { color: 'purple', icon: '📱' },
            'hashtag_social': { color: 'purple', icon: '📱' },
            'hashtag_web': { color: 'green', icon: '🌍' },
            'field_search': { color: 'indigo', icon: '🔍' },
            'funnel_search': { color: 'amber', icon: '⚡' },
            'id_search': { color: 'orange', icon: '#️⃣' },
            'general_search': { color: 'gray', icon: '🔍' },
            'error': { color: 'red', icon: '❌' },
        };
        
        return configs[type] || { color: 'gray', icon: '🔍' };
    };

    // Perform search
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setSmartSuggestions([]);
            setTotalResults(0);
            setResultCategories({});
            setPaginationData({});
            return;
        }
        
        // Check if it's a special protocol, if so then handle directly without searching
        const normalizedQuery = normalizeProtocol(query.trim());
        if (normalizedQuery !== query.trim()) {
            // This is a special protocol URL, don't search, just return
            setSearchResults([]);
            setSmartSuggestions([]);
            setTotalResults(0);
            setResultCategories({});
            setPaginationData({});
            setIsLoading(false);
            return;
        }
        
        if (query === lastQuery && searchResults.length > 0) {
            return; // Skip if same query
        }
        
        setIsLoading(true);
        setLastQuery(query);
        try {
            const response = await axios.get<SearchResponse>('/omnibox/search', {
                params: { query, limit: 20 }
            });
            
            // Transform backend results to frontend format
            const transformedResults = response.data.results?.map(transformBackendResult) || [];
            
            setSearchResults(transformedResults);
            setSmartSuggestions(response.data.suggestions || []);
            setTotalResults(response.data.total || 0);
            setResultCategories(response.data.categories || {});
            setPaginationData(response.data.pagination || {});
            setSelectedIndex(0);
            
            // Apply filters and sorting
            applyFiltersAndSorting(transformedResults);
            
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
            setSmartSuggestions([]);
            setTotalResults(0);
            setResultCategories({});
            setPaginationData({});
        } finally {
            setIsLoading(false);
        }
    }, [lastQuery, searchResults.length]);

    // Apply filters and sorting
    const applyFiltersAndSorting = useCallback((results: SearchResult[]) => {
        let filtered = results;
        
        // Apply type filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(result => result.type === activeFilter);
        }
        
        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
                case 'oldest':
                    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
                case 'relevance':
                default:
                    return b.score - a.score;
            }
        });
        
        setSearchResults(filtered);
    }, [activeFilter, sortOrder]);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setSelectedIndex(0);
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Set new timeout for debounced search
        const timeout = setTimeout(() => {
            performSearch(value);
        }, 300);
        
        setSearchTimeout(timeout);
    };

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isVisible) return;
        
        const totalItems = inputValue.trim() 
            ? (smartSuggestions.length > 0 ? smartSuggestions.length : searchResults.length)
            : quickActions.length;
        
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                setIsVisible(false);
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < totalItems - 1 ? prev + 1 : 0
                );
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : totalItems - 1
                );
                break;
                
            case 'Enter':
                e.preventDefault();
                handleEnterKey();
                break;
                
            case 'Tab':
                if (inputValue.trim() && smartSuggestions.length > 0) {
                    e.preventDefault();
                    handleSmartSuggestion(smartSuggestions[0]);
                }
                break;
                
            case '/':
                if (inputRef.current && document.activeElement !== inputRef.current) {
                    e.preventDefault();
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
                break;
                
            case '#':
                if (inputRef.current && document.activeElement !== inputRef.current) {
                    e.preventDefault();
                    setInputValue('#');
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
                break;
        }
    }, [isVisible, inputValue, searchResults, quickActions, smartSuggestions, selectedIndex]);

    // Handle Enter key
    const handleEnterKey = () => {
        if (inputValue.trim()) {
            // Check if it's a special protocol
            const normalizedInput = normalizeProtocol(inputValue.trim());
            if (normalizedInput !== inputValue.trim()) {
                window.open(normalizedInput, '_blank');
                setIsVisible(false);
                return;
            }
            
            if (smartSuggestions.length > 0 && selectedIndex < smartSuggestions.length) {
                handleSmartSuggestion(smartSuggestions[selectedIndex]);
            } else if (searchResults.length > 0 && selectedIndex < searchResults.length) {
                handleSearchResult(searchResults[selectedIndex]);
            } else {
                handleDirectAction();
            }
        } else {
            if (selectedIndex < quickActions.length) {
                handleQuickAction(quickActions[selectedIndex]);
            }
        }
    };

    // Handle quick action
    const handleQuickAction = (action: QuickAction) => {
        if (action.action === 'search_hashtag') {
            setInputValue('#');
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } else if (action.action === 'search_all') {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } else if (action.url) {
            window.location.href = action.url;
            setIsVisible(false);
        }
    };

    // Handle search result
    const handleSearchResult = (result: SearchResult) => {
        if (result.url) {
            window.open(result.url, '_blank');
            setIsVisible(false);
        } else if (result.edit_url) {
            window.open(result.edit_url, '_blank');
            setIsVisible(false);
        } else if (result.preview_url) {
            window.open(result.preview_url, '_blank');
            setIsVisible(false);
        }
    };

    // Handle smart suggestion
    const handleSmartSuggestion = (suggestion: SmartSuggestion) => {
        if (suggestion.action === 'navigate' && suggestion.url) {
            window.open(suggestion.url, '_blank');
            setIsVisible(false);
        } else if (suggestion.action === 'social_search' || 
                   suggestion.action === 'search' || 
                   suggestion.action === 'search_all' ||
                   suggestion.action === 'search_field' || 
                   suggestion.action === 'search_funnel' || 
                   suggestion.action === 'search_id') {
            setInputValue(suggestion.query || '');
            performSearch(suggestion.query || '');
        } else if (suggestion.action === 'web_search' && suggestion.url) {
            window.open(suggestion.url, '_blank');
            setIsVisible(false);
        }
    };

    // Handle direct action
    const handleDirectAction = async () => {
        if (!inputValue.trim()) return;
        
        // Check if it's a special protocol
        const normalizedInput = normalizeProtocol(inputValue.trim());
        
        // If it's a special protocol, directly open in new tab
        if (normalizedInput !== inputValue.trim()) {
            window.open(normalizedInput, '_blank');
            setIsVisible(false);
            return;
        }
        
        try {
            const response = await axios.post('/omnibox/direct-action', {
                query: inputValue.trim()
            });
            
            const result = response.data;
            
            if (result.action === 'social_search' && result.hashtag) {
                // Handle social media search
                performSearch('#' + result.hashtag);
            } else if (result.url) {
                window.open(result.url, '_blank');
                setIsVisible(false);
            }
        } catch (error) {
            // Fallback to basic URL detection
            const query = inputValue.trim();
            
            if (query.startsWith('http://') || query.startsWith('https://')) {
                window.open(query, '_blank');
            } else if (query.includes('.') && !query.includes(' ')) {
                // Check if there's a special protocol that needs conversion
                const normalizedQuery = normalizeProtocol(query);
                if (normalizedQuery !== query) {
                    window.open(normalizedQuery, '_blank');
                } else {
                    window.open(`https://${query}`, '_blank');
                }
            } else {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            }
            
            setIsVisible(false);
        }
    };

    // Handle item click
    const handleItemClick = (index: number) => {
        setSelectedIndex(index);
        
        if (inputValue.trim()) {
            // Check if it's a special protocol
            const normalizedInput = normalizeProtocol(inputValue.trim());
            if (normalizedInput !== inputValue.trim()) {
                window.open(normalizedInput, '_blank');
                setIsVisible(false);
                return;
            }
            
            if (smartSuggestions.length > 0 && index < smartSuggestions.length) {
                handleSmartSuggestion(smartSuggestions[index]);
            } else if (index < searchResults.length) {
                const resultIndex = index - smartSuggestions.length;
                if (resultIndex >= 0 && resultIndex < searchResults.length) {
                    handleSearchResult(searchResults[resultIndex]);
                }
            }
        } else {
            if (index < quickActions.length) {
                handleQuickAction(quickActions[index]);
            }
        }
    };

    // Get icon component
    const getIconComponent = (icon: string) => {
        const iconMap: Record<string, any> = {
            '⚡': faBolt,
            '🎨': faPalette,
            '🔗': faLink,
            '📊': faChartBar,
            '🏷️': faHashtag,
            '🔍': faSearch,
            '🌐': faGlobe,
            '📝': faFileAlt,
            '👤': faUser,
            '⚙️': faCog,
            '❓': faQuestionCircle,
            '🚀': faRocket,
            '#️⃣': faHashtag,
            '🌍': faGlobe,
            '🌼': faImage,
            '▶️': faVideo,
            '📌': faThumbtack,
            '👁️': faComment,
            '📱': faMobileAlt,
        };
        
        return iconMap[icon] || faSearch;
    };

    // Get color classes
    const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' = 'bg') => {
        const colorMap: Record<string, string> = {
            'indigo': 'indigo',
            'blue': 'blue',
            'emerald': 'emerald',
            'purple': 'purple',
            'orange': 'orange',
            'gray': 'gray',
            'red': 'red',
            'amber': 'amber',
            'teal': 'teal',
            'green': 'green',
        };
        
        const baseColor = colorMap[color] || 'gray';
        
        switch (type) {
            case 'bg': return `bg-${baseColor}-500/20`;
            case 'text': return `text-${baseColor}-300`;
            case 'border': return `border-${baseColor}-500/30`;
            default: return `bg-${baseColor}-500/20`;
        }
    };

    // Get type label
    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'funnel': 'Funnel',
            'field': 'Field',
            'custom_domain': 'Custom Domain',
            'domain': 'Domain',
            'theme': 'Theme',
            'url': 'URL',
            'hashtag': 'Hashtag',
            'web_search': 'Web Search',
            'field_search': 'Field Search',
            'funnel_search': 'Funnel Search',
            'id_search': 'ID Search',
            'general_search': 'General Search',
            // Social media labels
            'social_tumblr': 'Tumblr',
            'social_youtube': 'YouTube',
            'social_pinterest': 'Pinterest',
            'social_reddit': 'Reddit',
            'social_search': 'Social Media',
            'hashtag_social': 'Social Search',
            'hashtag_web': 'Web Search',
            'error': 'Error',
        };
        
        return labels[type] || type.replace('_', ' ').toUpperCase();
    };

    // Clear search
    const clearSearch = () => {
        setInputValue('');
        setSearchResults([]);
        setSmartSuggestions([]);
        setTotalResults(0);
        setSelectedIndex(0);
        setPaginationData({});
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Show success message (you could add a toast here)
            console.log('Copied to clipboard:', text);
        });
    };

    // Get filtered results
    const getFilteredResults = () => {
        if (activeFilter === 'all') return searchResults;
        return searchResults.filter(result => result.type === activeFilter);
    };

    // Get sorted results
    const getSortedResults = () => {
        const filtered = getFilteredResults();
        
        return [...filtered].sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
                case 'oldest':
                    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
                case 'relevance':
                default:
                    return b.score - a.score;
            }
        });
    };

    // Get platform icon
    const getPlatformIcon = (platform?: string) => {
        switch (platform) {
            case 'tumblr': return '🌼';
            case 'youtube': return '▶️';
            case 'pinterest': return '📌';
            case 'reddit': return '👁️';
            default: return null;
        }
    };

    // Add keyboard event listeners
    useEffect(() => {
        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
        }
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [isVisible, handleKeyDown, searchTimeout]);

    // Get total items for navigation
    const getTotalItems = () => {
        if (inputValue.trim()) {
            if (smartSuggestions.length > 0) {
                return smartSuggestions.length;
            }
            return getSortedResults().length;
        }
        return quickActions.length;
    };

    return (
        <>
            <Head>
                <title>Re:Box Search - aso.now</title>
                <style>{`
                    .glow {
                        box-shadow: 0 0 30px rgba(99, 102, 241, 0.35);
                    }
                    
                    /* Custom scrollbar */
                    ::-webkit-scrollbar {
                        width: 8px;
                    }
                    
                    ::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 4px;
                    }
                    
                    ::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 4px;
                    }
                    
                    ::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }
                    
                    /* Animation for ambient orbs */
                    @keyframes float {
                        0%, 100% {
                            transform: translateY(0px) scale(1);
                        }
                        50% {
                            transform: translateY(-20px) scale(1.05);
                        }
                    }
                    
                    .animate-float {
                        animation: float 6s ease-in-out infinite;
                    }
                    
                    /* Pulse animation for active item */
                    @keyframes pulse-glow {
                        0%, 100% {
                            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
                        }
                        50% {
                            box-shadow: 0 0 20px 0 rgba(99, 102, 241, 0.5);
                        }
                    }
                    
                    .animate-pulse-glow {
                        animation: pulse-glow 2s ease-in-out infinite;
                    }
                    
                    /* Shimmer animation */
                    @keyframes shimmer {
                        0% {
                            background-position: -1000px 0;
                        }
                        100% {
                            background-position: 1000px 0;
                        }
                    }
                    
                    .animate-shimmer {
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                        background-size: 1000px 100%;
                        animation: shimmer 2s infinite;
                    }
                    
                    /* Fade in animation */
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .animate-fade-in {
                        animation: fadeIn 0.3s ease-out;
                    }
                    
                    /* Typewriter effect */
                    @keyframes typewriter {
                        from { width: 0; }
                        to { width: 100%; }
                    }
                    
                    .typewriter {
                        overflow: hidden;
                        white-space: nowrap;
                        animation: typewriter 2s steps(40) 1s 1 normal both;
                    }
                `}</style>
            </Head>
            
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
                {/* Ambient Orbs */}
                <div className="absolute top-16 left-16 w-64 h-64 sm:w-80 sm:h-80 bg-indigo-500/30 rounded-full blur-3xl animate-float opacity-70"></div>
                <div className="absolute bottom-16 right-16 w-64 h-64 sm:w-80 sm:h-80 bg-fuchsia-500/30 rounded-full blur-3xl animate-float opacity-70" style={{ animationDelay: '3s' }}></div>

                {/* Close button */}
                {isVisible && (
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                        aria-label="Close omnibox"
                        data-tooltip-id="omnibox-tooltip"
                        data-tooltip-content="Close omnibox (Esc)"
                    >
                        <FontAwesomeIcon
                            icon={faTimes}
                            className="text-gray-300 hover:text-white text-base transition-colors" 
                        />
                    </button>
                )}

                {/* Omnibox Container */}
                <div ref={containerRef} className="relative z-10 w-full max-w-2xl lg:max-w-4xl animate-fade-in">
                    <div className={`glow backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl transition-all duration-300 ${!isVisible ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                        
                        {/* Input Section */}
                        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 rounded-t-2xl bg-white/5 hover:bg-white/10 transition-colors duration-200">
                            {/* Search Icon */}
                            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                                Re:Box
                            </div>

                            {/* Input Field */}
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder="Search funnels, fields, domains, themes, hashtags... (Ctrl+K)"
                                className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 text-sm sm:text-lg tracking-wide focus:ring-0"
                                autoFocus
                                data-tooltip-id="omnibox-tooltip"
                                data-tooltip-content="Type to search across all content and social media"
                            />

                            {/* Clear button */}
                            {inputValue && (
                                <button
                                    onClick={clearSearch}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                    aria-label="Clear search"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                </button>
                            )}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="ml-2">
                                    <FontAwesomeIcon 
                                        icon={faSpinner} 
                                        className="text-indigo-300 text-sm animate-spin" 
                                    />
                                </div>
                            )}

                            {/* Shortcut Key */}
                            <kbd className="hidden sm:flex items-center gap-1 text-xs text-gray-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 transition-colors hover:bg-white/20">
                                <FontAwesomeIcon icon={faKeyboard} className="mr-1" />
                                Ctrl+K
                            </kbd>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                        {/* Results Section */}
                        <div className="py-2 max-h-[70vh] overflow-y-auto">
                            {/* Smart Suggestions */}
                            {inputValue.trim() && smartSuggestions.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-4 sm:px-6 py-2 text-[11px] uppercase tracking-widest text-gray-400 flex items-center justify-between">
                                        <span>Smart Suggestions</span>
                                        <span className="text-[10px] text-gray-500">
                                            {smartSuggestions.length} suggestions
                                        </span>
                                    </div>
                                    
                                    {smartSuggestions.map((suggestion, index) => (
                                        <div
                                            key={`suggestion-${index}`}
                                            onClick={() => handleItemClick(index)}
                                            className={`group flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 mx-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                                selectedIndex === index
                                                    ? 'bg-white/20 animate-pulse-glow border border-white/30' 
                                                    : 'hover:bg-white/10'
                                            }`}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${getColorClasses(suggestion.color, 'bg')}`}>
                                                    <FontAwesomeIcon 
                                                        icon={getIconComponent(suggestion.icon)} 
                                                        className={`text-sm sm:text-lg ${getColorClasses(suggestion.color, 'text')}`} 
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-white text-sm font-medium truncate">{suggestion.title}</div>
                                                    <div className="text-xs text-gray-400 truncate">{suggestion.subtitle}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="hidden sm:inline text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                                                    {getTypeLabel(suggestion.type)}
                                                </span>
                                                {suggestion.url && (
                                                    <FontAwesomeIcon 
                                                        icon={faExternalLinkAlt} 
                                                        className="text-xs text-gray-500 group-hover:text-indigo-400 transition-colors" 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quick Actions (when no query) */}
                            {!inputValue.trim() && quickActions.length > 0 && (
                                <>
                                    <div className="px-4 sm:px-6 py-2 text-[11px] uppercase tracking-widest text-gray-400 flex items-center justify-between">
                                        <span>Quick Actions</span>
                                        <span className="text-[10px] text-gray-500">
                                            {quickActions.length} actions
                                        </span>
                                    </div>
                                    {quickActions.map((action, index) => (
                                        <div
                                            key={action.id}
                                            onClick={() => handleItemClick(index)}
                                            className={`group flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 mx-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                                selectedIndex === index 
                                                    ? 'bg-white/20 animate-pulse-glow border border-white/30' 
                                                    : 'hover:bg-white/10'
                                            }`}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${getColorClasses(action.color, 'bg')}`}>
                                                    <FontAwesomeIcon 
                                                        icon={getIconComponent(action.icon)} 
                                                        className={`text-sm sm:text-lg ${getColorClasses(action.color, 'text')}`} 
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-white text-sm font-medium truncate">{action.title}</div>
                                                    <div className="text-xs text-gray-400 truncate">{action.subtitle}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="hidden sm:inline text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                                                    {action.shortcut}
                                                </span>
                                                {action.url && (
                                                    <FontAwesomeIcon 
                                                        icon={faExternalLinkAlt} 
                                                        className="text-xs text-gray-500 group-hover:text-indigo-400 transition-colors" 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            
                            {/* Search Results Header */}
                            {inputValue.trim() && getSortedResults().length > 0 && (
                                <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50">
                                    <div className="px-4 sm:px-6 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <div className="text-sm font-semibold text-white">
                                                        Search Results
                                                        {totalResults > 0 && (
                                                            <span className="ml-2 text-xs font-normal text-gray-400">
                                                                ({totalResults} found)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Searching for: "{inputValue}"
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Filters and Sort */}
                                            <div className="flex items-center gap-2">
                                                {/* Filter toggle */}
                                                <button
                                                    onClick={() => setShowFilters(!showFilters)}
                                                    className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}
                                                    data-tooltip-id="filter-tooltip"
                                                    data-tooltip-content="Toggle filters"
                                                >
                                                    <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
                                                </button>
                                                
                                                {/* Sort toggle */}
                                                <button
                                                    onClick={() => setSortOrder(
                                                        sortOrder === 'relevance' ? 'newest' :
                                                        sortOrder === 'newest' ? 'oldest' : 'relevance'
                                                    )}
                                                    className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
                                                    data-tooltip-id="sort-tooltip"
                                                    data-tooltip-content={`Sort by: ${sortOrder}`}
                                                >
                                                    <FontAwesomeIcon 
                                                        icon={sortOrder === 'newest' ? faSortAmountDown : sortOrder === 'oldest' ? faSortAmountUp : faStar} 
                                                        className="w-4 h-4" 
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Filters Panel */}
                                        {showFilters && (
                                            <div className="mt-3 pt-3 border-t border-gray-700/50">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => setActiveFilter('all')}
                                                        className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                                                            activeFilter === 'all'
                                                                ? 'bg-indigo-500 text-white'
                                                                : 'bg-gray-800/50 text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        All ({totalResults})
                                                    </button>
                                                    {Object.entries(resultCategories).map(([type, count]) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setActiveFilter(type)}
                                                            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                                                                activeFilter === type
                                                                    ? 'bg-indigo-500 text-white'
                                                                    : 'bg-gray-800/50 text-gray-400 hover:text-white'
                                                            }`}
                                                        >
                                                            {getTypeLabel(type)} ({count})
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Search Results */}
                            {inputValue.trim() && (
                                <>
                                    {isLoading ? (
                                        <div className="px-6 py-12 text-center text-gray-400">
                                            <div className="inline-flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                                <span className="ml-3 text-sm">
                                                    {inputValue.startsWith('#') 
                                                        ? `Searching social media for ${inputValue}...` 
                                                        : 'Searching across all content...'}
                                                </span>
                                            </div>
                                            <div className="mt-6 w-full max-w-md mx-auto h-2 bg-gray-800/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-shimmer"></div>
                                            </div>
                                        </div>
                                    ) : getSortedResults().length > 0 ? (
                                        getSortedResults().map((result, index) => {
                                            const displayIndex = smartSuggestions.length + index;
                                            return (
                                                <div
                                                    key={`${result.type}-${result.id}-${index}`}
                                                    className={`group flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 mx-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                                        selectedIndex === displayIndex
                                                            ? 'bg-white/20 animate-pulse-glow border border-white/30' 
                                                            : 'hover:bg-white/10'
                                                    }`}
                                                    onClick={() => handleItemClick(displayIndex)}
                                                    onMouseEnter={() => setSelectedIndex(displayIndex)}
                                                >
                                                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${getColorClasses(result.color, 'bg')} flex-shrink-0`}>
                                                            <FontAwesomeIcon 
                                                                icon={getIconComponent(result.icon)} 
                                                                className={`text-sm sm:text-lg ${getColorClasses(result.color, 'text')}`} 
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    {result.url ? (
                                                                        <a
                                                                            href={result.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setIsVisible(false);
                                                                            }}
                                                                            className="text-white text-sm font-medium truncate hover:text-indigo-300 transition-colors flex items-center gap-1 group/link"
                                                                        >
                                                                            {result.title}
                                                                            <FontAwesomeIcon 
                                                                                icon={faExternalLinkAlt} 
                                                                                className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" 
                                                                            />
                                                                        </a>
                                                                    ) : (
                                                                        <div className="text-white text-sm font-medium truncate">{result.title}</div>
                                                                    )}
                                                                    <div className="text-xs text-gray-400 truncate mt-1">{result.subtitle}</div>
                                                                    {result.description && (
                                                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                            {result.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {result.edit_url && (
                                                                        <a
                                                                            href={result.edit_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="p-1 text-gray-400 hover:text-blue-400"
                                                                            data-tooltip-id="action-tooltip"
                                                                            data-tooltip-content="Edit"
                                                                        >
                                                                            <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                                                                        </a>
                                                                    )}
                                                                    {result.preview_url && (
                                                                        <a
                                                                            href={result.preview_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="p-1 text-gray-400 hover:text-green-400"
                                                                            data-tooltip-id="action-tooltip"
                                                                            data-tooltip-content="Preview"
                                                                        >
                                                                            <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                                                                        </a>
                                                                    )}
                                                                    {result.url && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                copyToClipboard(result.url || '');
                                                                            }}
                                                                            className="p-1 text-gray-400 hover:text-yellow-400"
                                                                            data-tooltip-id="action-tooltip"
                                                                            data-tooltip-content="Copy URL"
                                                                        >
                                                                            <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Metadata */}
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800/50 text-gray-400">
                                                                    {getTypeLabel(result.type)}
                                                                </span>
                                                                {result.platform && (
                                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                        {getPlatformIcon(result.platform)}
                                                                        {result.platform}
                                                                    </span>
                                                                )}
                                                                {result.created_at && (
                                                                    <span className="text-[10px] text-gray-500">
                                                                        {result.created_at}
                                                                    </span>
                                                                )}
                                                                {result.user && (
                                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                        <FontAwesomeIcon icon={faUser} className="w-2 h-2" />
                                                                        {result.user.name}
                                                                    </span>
                                                                )}
                                                                {result.funnel && (
                                                                    <a
                                                                        href={result.funnel.url || `/funnels/${result.funnel.token}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                                                                    >
                                                                        <FontAwesomeIcon icon={faBolt} className="w-2 h-2" />
                                                                        {result.funnel.token}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <span className="hidden sm:inline text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                                                            {result.score}%
                                                        </span>
                                                        {result.url && (
                                                            <a
                                                                href={result.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsVisible(false);
                                                                }}
                                                                className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                                                            >
                                                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : smartSuggestions.length === 0 ? (
                                        <div className="px-6 py-12 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                                                <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-2xl" />
                                            </div>
                                            <p className="text-sm text-gray-400 mb-2">No results found for "{inputValue}"</p>
                                            <p className="text-xs text-gray-500 mb-4">
                                                Try a different search term or use one of the smart suggestions above
                                            </p>
                                            <a
                                                href={`https://www.google.com/search?q=${encodeURIComponent(inputValue)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm"
                                            >
                                                <FontAwesomeIcon icon={faGlobe} className="w-4 h-4" />
                                                Search the web for "{inputValue}"
                                            </a>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-700/50 bg-gray-900/50 rounded-b-2xl">
                            <div className="px-4 sm:px-6 py-3">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                                            <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3" />
                                            <span>Navigate</span>
                                        </span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faKeyboard} className="w-3 h-3" />
                                            <span>Enter Select</span>
                                        </span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                                            <span>Esc Close</span>
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {totalResults > 0 && (
                                            <div className="text-xs text-gray-500">
                                                Showing {getSortedResults().length} of {totalResults}
                                            </div>
                                        )}
                                        {inputValue.startsWith('#') && (paginationData.tumblr_next || paginationData.youtube_next || paginationData.reddit_after) && (
                                            <button
                                                onClick={() => {
                                                    // You can implement load more functionality here
                                                    console.log('Load more social media results');
                                                }}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 bg-indigo-500/10 rounded"
                                            >
                                                Load more
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Search Tips */}
                    {!inputValue.trim() && (
                        <div className="mt-4 text-center">
                            <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded text-[10px]">F0001</kbd>
                                    <span>Search fields</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded text-[10px]">X000001</kbd>
                                    <span>Search funnels</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded text-[10px]">example.com</kbd>
                                    <span>Search domains</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded text-[10px]">#hashtag</kbd>
                                    <span>Search social media</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded text-[10px]">re://example.com</kbd>
                                    <span>Open with re:// protocol</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-800/50 rounded text-[10px]">🀄://example.com</kbd>
                                    <span>Open with 🀄:// protocol</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Global shortcut hint */}
                {!isVisible && (
                    <div className="fixed bottom-6 right-6 z-40">
                        <button
                            onClick={() => {
                                setIsVisible(true);
                                setTimeout(() => {
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                    }
                                }, 100);
                            }}
                            className="group w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                            data-tooltip-id="omnibox-tooltip"
                            data-tooltip-content="Open Omnibox (Ctrl+K)"
                        >
                            <FontAwesomeIcon icon={faSearch} className="text-white text-lg group-hover:rotate-12 transition-transform" />
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold border-2 border-gray-900">
                                ⌘K
                            </span>
                        </button>
                    </div>
                )}

                {/* Tooltips */}
                <Tooltip 
                    id="omnibox-tooltip" 
                    className="!z-[99999] !opacity-100 !px-3 !py-2 !rounded-lg !bg-gray-900 !border !border-gray-700 !text-sm"
                />
                <Tooltip 
                    id="filter-tooltip" 
                    className="!z-[99999] !opacity-100 !px-3 !py-2 !rounded-lg !bg-gray-900 !border !border-gray-700 !text-sm"
                />
                <Tooltip 
                    id="sort-tooltip" 
                    className="!z-[99999] !opacity-100 !px-3 !py-2 !rounded-lg !bg-gray-900 !border !border-gray-700 !text-sm"
                />
                <Tooltip 
                    id="action-tooltip" 
                    className="!z-[99999] !opacity-100 !px-3 !py-2 !rounded-lg !bg-gray-900 !border !border-gray-700 !text-sm"
                />
            </main>
        </>
    );
}