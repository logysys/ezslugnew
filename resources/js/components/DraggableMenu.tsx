import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHouse, faSlidersH, faUser, faWallet, faPaperPlane,
    faGem, faGlobe, faChartLine, faShoppingBag,
    faExchangeAlt, faTags, faFileInvoiceDollar, faHistory, faChartBar,
    faTicketAlt, faShoppingCart, faCoins, faReceipt, faAward,
    faClock, faUndo, faCode, faRightFromBracket,
    faIdCard, faArrowsAlt, faKey,
    faBook
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { EmbedRowModal } from '@/components/EmbedRowModal';

// ============================================================================
// Types & Constants
// ============================================================================

interface DraggableMenuProps {
    auth?: {
        user?: {
            id: number;
        };
    };
    parentSlug?: string;
    conversationId?: string;
    onChildConvoCreated?: (html: string, contentType?: string) => Promise<any> | void;
    onCommentCreated?: (messages: any[]) => void;
}

interface BalanceResponse {
    balance: number;
}

interface MenuItem {
    href: string;
    action: string;
    icon: any;
    label: string;
    method?: 'get' | 'post';
    isDestructive?: boolean;
}

type Corner = 'br' | 'bl' | 'tr' | 'tl';
type QuadrantId = '1' | '2' | '3' | '4' | '5';

const MENU_DIMENSIONS = {
    width: 120,
    height: 120,
    padding: 20,
} as const;

const DEAD_ZONE_RADIUS_FACTOR = 0.25;
const ANIMATION_DURATION = 350;
const MESSAGE_DURATION = 2000;
const DRAG_THRESHOLD = 4;

// 5-fold radial layout calculation (72 degrees per slice)
// 1: Rose, 2: Amber, 3: Emerald, 4: Sky, 5: Violet
const WEDGE_POSITIONS = [
    { id: '1' as QuadrantId, angleStart: 288, angleEnd: 360, label: '1', color: '#f43f5e', gradient: ['#f43f5e', '#e11d48'], labelAngle: 324 },
    { id: '2' as QuadrantId, angleStart: 0,   angleEnd: 72,  label: '2', color: '#f59e0b', gradient: ['#f59e0b', '#d97706'], labelAngle: 36  },
    { id: '3' as QuadrantId, angleStart: 72,  angleEnd: 144, label: '3', color: '#10b981', gradient: ['#10b981', '#059669'], labelAngle: 108 },
    { id: '4' as QuadrantId, angleStart: 144, angleEnd: 216, label: '4', color: '#3b82f6', gradient: ['#3b82f6', '#2563eb'], labelAngle: 180 },
    { id: '5' as QuadrantId, angleStart: 216, angleEnd: 288, label: '5', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'], labelAngle: 252 },
].map(item => {
    const rad = (item.labelAngle * Math.PI) / 180;
    const r = 32;
    
    const startRad = (item.angleStart * Math.PI) / 180;
    const endRad = (item.angleEnd * Math.PI) / 180;
    const x1 = (50 + 46 * Math.cos(startRad)).toFixed(2);
    const y1 = (50 + 46 * Math.sin(startRad)).toFixed(2);
    const x2 = (50 + 46 * Math.cos(endRad)).toFixed(2);
    const y2 = (50 + 46 * Math.sin(endRad)).toFixed(2);
    
    const pathData = `M 50 50 L ${x1} ${y1} A 46 46 0 0 1 ${x2} ${y2} Z`;

    return {
        ...item,
        pathData,
        x: (50 + r * Math.cos(rad)).toFixed(2),
        y: (50 + r * Math.sin(rad)).toFixed(2),
    };
});

const QUADRANT_STYLES: Record<QuadrantId, { bg: string; glow: string; border: string }> = {
    '1': { bg: 'linear-gradient(135deg, rgba(244,63,94,0.95), rgba(225,29,72,0.95))', glow: 'rgba(244,63,94,0.35)', border: 'rgba(244,63,94,0.6)' },
    '2': { bg: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95))', glow: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.6)' },
    '3': { bg: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))', glow: 'rgba(16,185,129,0.35)', border: 'rgba(16,185,129,0.6)' },
    '4': { bg: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95))', glow: 'rgba(59,130,246,0.35)', border: 'rgba(59,130,246,0.6)' },
    '5': { bg: 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(124,58,237,0.95))', glow: 'rgba(139,92,246,0.35)', border: 'rgba(139,92,246,0.6)' },
};

// ============================================================================
// Sub-components
// ============================================================================

const ClickMessage: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
    <div 
        id="click-message" 
        className={visible ? 'visible' : ''}
        role="status"
        aria-live="polite"
    >
        <div className="msg-icon">✦</div>
        <span>{message}</span>
    </div>
);

const LogoSection: React.FC<{
    onLogoClick: (e: React.MouseEvent, href: string, label: string) => void;
    onAvatarClick: (e: React.MouseEvent) => void;
    isTopCorner: boolean;
}> = ({ onLogoClick, onAvatarClick, isTopCorner }) => {
    return (
        <div 
            className={`logo-section-container absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 pointer-events-auto z-30 transition-all duration-500 ${
                isTopCorner ? 'top-[calc(100%+14px)]' : 'bottom-[calc(100%+14px)]'
            }`}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <div 
                className="w-[3.6rem] h-[3.6rem] rounded-full flex items-center justify-center overflow-hidden relative avatar-glow cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                onClick={onAvatarClick}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                role="button"
                tabIndex={0}
                aria-label="Open Embed Row & Masonry Builder"
                title="Click to open Embed Row & Masonry Builder"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onAvatarClick(e as any);
                    }
                }}
            >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#059669] via-[#34d399] to-[#10b981] opacity-90" />
                <img
                    src="https://ez.wiki/logo.gif"
                    className="w-[78%] h-[78%] object-contain relative z-10 filter drop-shadow-lg pointer-events-none"
                    alt="ez.wiki Logo"
                />
            </div>
            
            <div className="split-logo">
                <span 
                    className="logo-ez cursor-pointer select-none"
                    onClick={(e) => onLogoClick(e, '/unified-dashboard', 'EZ Dashboard')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            onLogoClick(e as any, '/unified-dashboard', 'EZ Dashboard');
                        }
                    }}
                >
                    EZ.WIKI
                </span>
            </div>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

const DraggableMenu: React.FC<DraggableMenuProps> = ({
    auth,
    parentSlug,
    conversationId,
    onChildConvoCreated,
    onCommentCreated,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const mainButtonRef = useRef<HTMLDivElement>(null);
    
    const dragStartRef = useRef<{
        pointerX: number;
        pointerY: number;
        elementX: number;
        elementY: number;
        hasMoved: boolean;
    } | null>(null);
    const dragPositionRef = useRef<{ top: number; left: number } | null>(null);
    const messageTimeoutRef = useRef<NodeJS.Timeout>();

    const [beeBalance, setBeeBalance] = useState<string>('0.00');
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [activeQuadrant, setActiveQuadrant] = useState<QuadrantId | null>(null);
    const [clickMessage, setClickMessage] = useState({ visible: false, text: '' });
    const [isDragging, setIsDragging] = useState(false);
    const [isEmbedRowOpen, setIsEmbedRowOpen] = useState(false);
    const [dragPosition, setDragPosition] = useState<{ top: number; left: number } | null>(null);
    const [snappedCorner, setSnappedCorner] = useState<Corner | null>('br');
    const [freePosition, setFreePosition] = useState<{ top: number; left: number } | null>(null);
    const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Fetch user balance
    useEffect(() => {
        let active = true;
        const fetchBalance = async () => {
            if (!auth?.user) return;
            setIsLoadingBalance(true);
            setBalanceError(null);

            try {
                const response = await axios.get<BalanceResponse>('/buy-bee/balance');
                if (active) {
                    setBeeBalance(Number(response.data.balance || 0).toFixed(2));
                }
            } catch (error) {
                if (active) {
                    setBeeBalance('0.00');
                    setBalanceError('Failed to load balance');
                }
            } finally {
                if (active) setIsLoadingBalance(false);
            }
        };

        fetchBalance();
        return () => { active = false; };
    }, [auth?.user]);

    // Track viewport resize
    useEffect(() => {
        const handleResize = () => setViewportSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        return () => {
            if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        };
    }, []);

    const balanceLabel = useMemo(() => {
        if (isLoadingBalance) return 'Loading...';
        if (balanceError) return '--.-- EZ$';
        return `${beeBalance} EZ$`;
    }, [isLoadingBalance, balanceError, beeBalance]);

    const menuItems = useMemo((): Record<QuadrantId, MenuItem[]> => {
        const guestItems: MenuItem[] = [
            { href: '/', action: 'HOME', icon: faHouse, label: 'Home' },
            { href: '/login', action: 'SIGN IN', icon: faKey, label: 'Sign In' },
            { href: '/register', action: 'SIGN UP', icon: faIdCard, label: 'Sign Up' },
        ];

        if (!auth?.user) {
            return { '1': guestItems, '2': guestItems, '3': guestItems, '4': guestItems, '5': guestItems };
        }

        return {
            '1': [
                { href: '/aihome', action: 'HOME', icon: faHouse, label: 'Home' },
                { href: '/dashboard', action: 'DASHBOARD', icon: faSlidersH, label: 'Dashboard' },
                { href: '/settings/profile', action: 'PROFILE', icon: faUser, label: 'Profile' },
                { href: '/purchase', action: balanceLabel, icon: faWallet, label: balanceLabel },
            ],
            '2': [
				{ href: '/sendbee', action: 'Send EZ$', icon: faPaperPlane, label: 'Send EZ$' },
				{ href: '/purchasehistory', action: 'EZ$ Purchase History', icon: faFileInvoiceDollar, label: 'EZ$ Purchase History' },
                { href: '/ez-transfer', action: 'EZ TRANSFER', icon: faExchangeAlt, label: 'EZ Transfer' },
				{ href: '/transfer/history', action: 'EZ TRANSFER HISTORY', icon: faHistory, label: 'Transfer History' },
            ],
            '3': [
				{ href: '/marketplace', action: 'DOMAIN MART', icon: faShoppingBag, label: 'Domain Mart' },
                { href: '/my-coupons', action: 'Coupon Usage', icon: faTicketAlt, label: 'Coupon Usage' },
				{ href: '/handlepurchasehistory', action: 'Handle Purchase History', icon: faShoppingCart, label: 'Handle Purchase History' },
				{ href: '/handlesellhistory', action: 'Handle Sell History', icon: faCoins, label: 'Handle Sell History' },
            ],
            '4': [
                { href: '/token-transactions', action: 'EZ$ Transaction History', icon: faReceipt, label: 'EZ$ Transaction History' },
                { href: '/incentivehistory', action: 'Incentive History', icon: faAward, label: 'Incentive History' },
                { href: '/pending-transfers', action: 'Pending Transaction', icon: faClock, label: 'Pending Transaction' },
				{ href: '/refund-transfers', action: 'Refund History', icon: faUndo, label: 'Refund History' },
            ],
            '5': [
                { href: '/', action: 'New Conversation', icon: faPaperPlane, label: 'New Conversation' },
                { href: '/public/ai/history', action: 'Slug Wall', icon: faGlobe, label: 'Slug Wall' },
                { href: '/ai/history', action: 'Slug Management', icon: faCode, label: 'Slug Management' },
                { href: '/logout', action: 'Logout', icon: faRightFromBracket, label: 'Logout', method: 'post', isDestructive: true },
            ],
        };
    }, [auth?.user, balanceLabel]);

    const effectiveCorner = useMemo((): Corner => {
        if (snappedCorner) return snappedCorner;
        if (freePosition) {
            const centerX = freePosition.left + MENU_DIMENSIONS.width / 2;
            const centerY = freePosition.top + MENU_DIMENSIONS.height / 2;
            const { width, height } = viewportSize;
            if (centerY < height / 2) return centerX < width / 2 ? 'tl' : 'tr';
            return centerX < width / 2 ? 'bl' : 'br';
        }
        return 'br';
    }, [snappedCorner, freePosition, viewportSize]);

    const isTopCorner = effectiveCorner === 'tr' || effectiveCorner === 'tl';

    const closeAllMenus = useCallback(() => setActiveQuadrant(null), []);
    const toggleQuadrantMenu = useCallback((quadrant: QuadrantId) => {
        setActiveQuadrant(prev => (prev === quadrant ? null : quadrant));
    }, []);

    const showMessage = useCallback((text: string) => {
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        setClickMessage({ visible: true, text });
        messageTimeoutRef.current = setTimeout(() => {
            setClickMessage(prev => ({ ...prev, visible: false }));
        }, MESSAGE_DURATION);
    }, []);

    const navigateWithFeedback = useCallback((href: string, action: string, method: 'get' | 'post' = 'get') => {
        showMessage(`Navigating to ${action}...`);
        closeAllMenus();
        setTimeout(() => {
            if (method === 'post') router.post(href);
            else router.visit(href);
        }, ANIMATION_DURATION);
    }, [closeAllMenus, showMessage]);

    const handleLinkClick = useCallback((e: React.MouseEvent | React.KeyboardEvent, action: string, href: string, method: 'get' | 'post' = 'get') => {
        e.preventDefault();
        e.stopPropagation();
        navigateWithFeedback(href, action, method);
    }, [navigateWithFeedback]);

    const handleLogoClick = useCallback((e: React.MouseEvent, href: string, label: string) => {
        e.preventDefault();
        e.stopPropagation();
        navigateWithFeedback(href, label);
    }, [navigateWithFeedback]);

    const handleAvatarClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        closeAllMenus();
        setIsEmbedRowOpen(true);
    }, [closeAllMenus]);

    const handleMainButtonKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleQuadrantMenu(activeQuadrant || '1');
        }
    }, [activeQuadrant, toggleQuadrantMenu]);

    // Enhanced Drag Handler with Boundary Lock & Accurate 5-Sector Hit Testing
    useEffect(() => {
        const buttonNode = mainButtonRef.current;
        const menuNode = menuRef.current;
        if (!buttonNode || !menuNode) return;

        const handlePointerMove = (e: PointerEvent) => {
            if (!dragStartRef.current) return;

            const dx = e.clientX - dragStartRef.current.pointerX;
            const dy = e.clientY - dragStartRef.current.pointerY;

            if (!dragStartRef.current.hasMoved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
                dragStartRef.current.hasMoved = true;
                setIsDragging(true);
                closeAllMenus();
            }

            if (dragStartRef.current.hasMoved) {
                let newTop = dragStartRef.current.elementY + dy;
                let newLeft = dragStartRef.current.elementX + dx;

                const { width: vw, height: vh } = viewportSize;
                const elementWidth = menuNode.offsetWidth || 120;
                const elementHeight = menuNode.offsetHeight || 120;

                newLeft = Math.max(MENU_DIMENSIONS.padding, Math.min(newLeft, vw - elementWidth - MENU_DIMENSIONS.padding));
                newTop = Math.max(MENU_DIMENSIONS.padding, Math.min(newTop, vh - elementHeight - MENU_DIMENSIONS.padding));

                const newPos = { top: newTop, left: newLeft };
                setDragPosition(newPos);
                dragPositionRef.current = newPos;
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            try { buttonNode.releasePointerCapture(e.pointerId); } catch (err) {}

            if (dragStartRef.current?.hasMoved) {
                if (dragPositionRef.current) {
                    setFreePosition(dragPositionRef.current);
                    setSnappedCorner(null);
                }
            } else {
                const rect = buttonNode.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const deadZoneRadius = rect.width * DEAD_ZONE_RADIUS_FACTOR;

                if (distance >= deadZoneRadius) {
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    const normalizedAngle = (angle + 360) % 360;

                    let quadrant: QuadrantId;
                    if (normalizedAngle >= 288 || normalizedAngle < 18) quadrant = '1';
                    else if (normalizedAngle >= 18 && normalizedAngle < 90) quadrant = '2';
                    else if (normalizedAngle >= 90 && normalizedAngle < 162) quadrant = '3';
                    else if (normalizedAngle >= 162 && normalizedAngle < 234) quadrant = '4';
                    else quadrant = '5';

                    toggleQuadrantMenu(quadrant);
                }
            }

            dragStartRef.current = null;
            setIsDragging(false);
            setDragPosition(null);
            dragPositionRef.current = null;
        };

        const handlePointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;

            // Ignore pointer down if clicked inside LogoSection (avatar or logo texts)
            const target = e.target as HTMLElement | null;
            if (target && target.closest('.logo-section-container, .avatar-glow, .split-logo, .logo-ez, .logo-wiki')) {
                return;
            }

            buttonNode.setPointerCapture(e.pointerId);
            const rect = menuNode.getBoundingClientRect();
            dragStartRef.current = {
                pointerX: e.clientX,
                pointerY: e.clientY,
                elementX: rect.left,
                elementY: rect.top,
                hasMoved: false
            };

            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        };

        buttonNode.addEventListener('pointerdown', handlePointerDown);
        return () => {
            buttonNode.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [closeAllMenus, toggleQuadrantMenu, viewportSize]);

    // Outside click dismissal
    useEffect(() => {
        if (!activeQuadrant) return;
        const outsideClickListener = (e: MouseEvent | TouchEvent) => {
            if (isDragging) return;
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                closeAllMenus();
            }
        };

        document.addEventListener('mousedown', outsideClickListener);
        document.addEventListener('touchstart', outsideClickListener);
        return () => {
            document.removeEventListener('mousedown', outsideClickListener);
            document.removeEventListener('touchstart', outsideClickListener);
        };
    }, [activeQuadrant, closeAllMenus, isDragging]);

    const getContainerStyle = useCallback((): React.CSSProperties => {
        const P = '24px';
        if (isDragging && dragPosition) {
            return {
                position: 'fixed',
                transform: `translate3d(${dragPosition.left}px, ${dragPosition.top}px, 0)`,
                transition: 'none',
                zIndex: 9999,
            };
        }
        if (freePosition) {
            return {
                position: 'fixed',
                top: `${freePosition.top}px`,
                left: `${freePosition.left}px`,
                transition: 'none',
            };
        }
        const cornerStyles: Record<Corner, React.CSSProperties> = {
            br: { bottom: P, right: P },
            bl: { bottom: P, left: P },
            tr: { top: P, right: P },
            tl: { top: P, left: P },
        };
        return {
            position: 'fixed',
            ...(snappedCorner ? cornerStyles[snappedCorner] : {}),
            transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        };
    }, [isDragging, dragPosition, freePosition, snappedCorner]);

    const containerClasses = useMemo(() => {
        const classes = ['group z-50 select-none'];
        if (activeQuadrant) classes.push(`q${activeQuadrant}-open`, 'menu-open');
        if (isTopCorner) classes.push('tl-open', 'tr-open');
        if (isDragging) classes.push('dragging');
        return classes.join(' ');
    }, [activeQuadrant, isTopCorner, isDragging]);

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>{`
                    #draggable-menu-container {
                        z-index: 9999 !important;
                        backface-visibility: hidden;
                        will-change: transform, top, left, bottom, right;
                    }

                    /* Ambient glow behind the button */
                    #draggable-menu-container::before {
                        content: '';
                        position: absolute;
                        inset: -20px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%);
                        pointer-events: none;
                        z-index: -1;
                        opacity: 0;
                        transition: opacity 0.5s ease;
                    }

                    #draggable-menu-container.menu-open::before {
                        opacity: 1;
                    }

                    #main-button {
                        width: 7.6rem;
                        height: 7.6rem;
                        box-shadow:
                            0 0 0 1px rgba(255,255,255,0.1),
                            0 20px 50px rgba(0,0,0,0.4),
                            0 8px 20px rgba(0,0,0,0.3),
                            inset 0 1px 0 rgba(255,255,255,0.15),
                            inset 0 -1px 0 rgba(0,0,0,0.2);
                        transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease;
                        touch-action: none;
                        position: relative;
                        background: #0f172a;
                        border-radius: 9999px;
                        outline: none;
                        border: 2.5px solid rgba(255,255,255,0.9);
                        overflow: visible;
                    }

                    #main-button:focus-visible {
                        box-shadow:
                            0 0 0 4px rgba(52,211,153,0.4),
                            0 20px 50px rgba(0,0,0,0.4),
                            inset 0 1px 0 rgba(255,255,255,0.15);
                    }

                    #main-button:hover {
                        transform: scale(1.06);
                        box-shadow:
                            0 0 0 1px rgba(255,255,255,0.15),
                            0 25px 60px rgba(0,0,0,0.5),
                            0 0 30px rgba(52,211,153,0.25),
                            inset 0 1px 0 rgba(255,255,255,0.2);
                    }

                    #main-button:active {
                        transform: scale(0.97);
                    }

                    #main-button svg {
                        overflow: visible !important;
                    }

                    /* Wedge slices with individual gradients */
                    .wedge-slice {
                        transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
                        stroke: rgba(255,255,255,0.35);
                        stroke-width: 1.5px;
                        cursor: pointer;
                        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                    }

                    .wedge-slice:hover {
                        filter: brightness(1.2) drop-shadow(0 0 12px rgba(255,255,255,0.6));
                        stroke: rgba(255,255,255,0.8);
                        stroke-width: 2px;
                    }

                    /* Active wedge glow ring */
                    .active-wedge-ring {
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        pointer-events: none;
                    }

                    .group.q1-open .ring-q1,
                    .group.q2-open .ring-q2,
                    .group.q3-open .ring-q3,
                    .group.q4-open .ring-q4,
                    .group.q5-open .ring-q5 {
                        opacity: 1;
                    }

                    /* Center hub */
                    .center-hub {
                        width: 30%;
                        height: 30%;
                        background: #0f172a;
                        border-radius: 50%;
                        border: 2px solid rgba(255,255,255,0.8);
                        z-index: 20;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow:
                            inset 0 2px 8px rgba(0,0,0,0.5),
                            0 0 0 3px rgba(52,211,153,0.15),
                            0 2px 8px rgba(0,0,0,0.3);
                        pointer-events: none;
                        position: relative;
                    }

                    .center-hub::after {
                        content: '';
                        position: absolute;
                        inset: -6px;
                        border-radius: 50%;
                        border: 1.5px solid rgba(52,211,153,0.3);
                        animation: hub-pulse 2.5s ease-in-out infinite;
                    }

                    @keyframes hub-pulse {
                        0%, 100% { transform: scale(1); opacity: 0.6; }
                        50% { transform: scale(1.08); opacity: 0; }
                    }

                    /* Menu items - color-coded per quadrant with glassmorphism */
                    .menu-item {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.55rem 1rem;
                        border-radius: 1rem;
                        font-weight: 600;
                        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                        position: relative;
                        overflow: hidden;
                        min-width: 195px;
                        font-size: 0.8rem;
                        backdrop-filter: blur(24px) saturate(1.4);
                        -webkit-backdrop-filter: blur(24px) saturate(1.4);
                        border: 1px solid rgba(255,255,255,0.25);
                        border-top: 1px solid rgba(255,255,255,0.5);
                        color: #ffffff !important;
                        font-variant-numeric: tabular-nums;
                        text-shadow: 0 1px 3px rgba(0,0,0,0.25);
                        box-shadow:
                            0 8px 32px rgba(0,0,0,0.25),
                            inset 0 1px 0 rgba(255,255,255,0.25);
                    }

                    .menu-item::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        border-radius: inherit;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
                    }

                    .menu-item:hover::before,
                    .menu-item:focus-visible::before {
                        opacity: 1;
                    }

                    .menu-item:hover, .menu-item:focus-visible {
                        transform: translateY(-3px) scale(1.03);
                        box-shadow:
                            0 16px 40px rgba(0,0,0,0.35),
                            0 0 20px var(--item-glow, rgba(16,185,129,0.3)),
                            inset 0 1px 0 rgba(255,255,255,0.4);
                        border-color: rgba(255,255,255,0.6) !important;
                    }

                    .menu-item .icon-wrapper {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 1.7rem;
                        height: 1.7rem;
                        font-size: 0.78rem;
                        border-radius: 0.55rem;
                        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                        background: rgba(255,255,255,0.18) !important;
                        border: 1px solid rgba(255,255,255,0.4);
                        color: #ffffff;
                        flex-shrink: 0;
                        box-shadow: inset 0 1px 2px rgba(255,255,255,0.1);
                    }

                    .menu-item:hover .icon-wrapper,
                    .menu-item:focus-visible .icon-wrapper {
                        transform: scale(1.15) rotate(-6deg);
                        background: rgba(255,255,255,0.35) !important;
                        border-color: rgba(255,255,255,0.7) !important;
                        box-shadow: 0 0 12px rgba(255,255,255,0.4);
                    }

                    .menu-item.destructive {
                        --item-glow: rgba(244,63,94,0.4);
                        background: linear-gradient(135deg, rgba(244,63,94,0.92), rgba(190,18,60,0.92)) !important;
                        border-color: rgba(244,63,94,0.4);
                    }

                    .menu-item.destructive .icon-wrapper {
                        background: rgba(255,255,255,0.15) !important;
                        border-color: rgba(255,255,255,0.4) !important;
                    }

                    .menu-item.destructive:hover {
                        background: linear-gradient(135deg, rgba(251,113,133,0.95), rgba(244,63,94,0.95)) !important;
                        border-color: rgba(255,255,255,0.6) !important;
                    }

                    /* Staggered entrance animation */
                    @keyframes slide-in-blur {
                        0% { transform: translateY(12px) scale(0.92); opacity: 0; filter: blur(6px); }
                        100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
                    }

                    .quadrant-menu.open .menu-item {
                        animation: slide-in-blur 0.35s cubic-bezier(0.23, 1, 0.32, 1) both;
                    }

                    .quadrant-menu.open .menu-item:nth-child(1) { animation-delay: 0.02s; }
                    .quadrant-menu.open .menu-item:nth-child(2) { animation-delay: 0.05s; }
                    .quadrant-menu.open .menu-item:nth-child(3) { animation-delay: 0.08s; }
                    .quadrant-menu.open .menu-item:nth-child(4) { animation-delay: 0.11s; }
                    .quadrant-menu.open .menu-item:nth-child(5) { animation-delay: 0.14s; }
                    .quadrant-menu.open .menu-item:nth-child(6) { animation-delay: 0.17s; }

                    /* Float animation */
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-6px); }
                    }

                    #draggable-menu-container:not(.menu-open):not(.dragging) {
                        animation: float 5s ease-in-out infinite;
                    }

                    #draggable-menu-container.dragging {
                        animation: none;
                        opacity: 0.88;
                        cursor: grabbing !important;
                    }

                    #draggable-menu-container.dragging #main-button {
                        box-shadow:
                            0 0 0 2px rgba(52,211,153,0.3),
                            0 30px 70px rgba(0,0,0,0.5),
                            inset 0 1px 0 rgba(255,255,255,0.1);
                    }

                    /* Click message / Toast */
                    #click-message {
                        position: fixed;
                        bottom: 2.5rem;
                        left: 50%;
                        transform: translate(-50%, 40px) scale(0.9);
                        padding: 0.7rem 1.6rem 0.7rem 1.2rem;
                        border-radius: 1rem;
                        font-weight: 600;
                        transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                        background: rgba(15,23,42,0.92);
                        border: 1px solid rgba(52,211,153,0.4);
                        color: #ffffff;
                        backdrop-filter: blur(24px) saturate(1.3);
                        -webkit-backdrop-filter: blur(24px) saturate(1.3);
                        box-shadow:
                            0 20px 50px rgba(0,0,0,0.4),
                            0 0 30px rgba(52,211,153,0.15),
                            inset 0 1px 0 rgba(255,255,255,0.1);
                        opacity: 0;
                        pointer-events: none;
                        z-index: 10000;
                        font-size: 0.85rem;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        letter-spacing: 0.01em;
                    }

                    #click-message .msg-icon {
                        width: 1.4rem;
                        height: 1.4rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 0.4rem;
                        background: rgba(52,211,153,0.2);
                        color: #34d399;
                        font-size: 0.75rem;
                        flex-shrink: 0;
                    }

                    #click-message.visible {
                        transform: translate(-50%, 0) scale(1);
                        opacity: 1;
                    }

                    /* Quadrant menus */
                    .quadrant-menu { 
                        position: absolute;
                        display: flex;
                        flex-direction: column;
                        gap: 0.35rem;
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.25s ease, visibility 0s linear 0.25s, transform 0.3s ease;
                        z-index: 20;
                        max-height: calc(100vh - 160px);
                        overflow-y: auto;
                        padding: 6px;
                        scrollbar-width: none;
                    }

                    .quadrant-menu::-webkit-scrollbar { display: none; }

                    .group.open .quadrant-menu { pointer-events: auto; }

                    .group.q1-open #menu-q1, 
                    .group.q2-open #menu-q2, 
                    .group.q3-open #menu-q3, 
                    .group.q4-open #menu-q4,
                    .group.q5-open #menu-q5 {
                        opacity: 1;
                        visibility: visible;
                        transition-delay: 0s;
                    }

                    .group.tr-open .quadrant-menu,
                    .group.tl-open .quadrant-menu {
                        flex-direction: column-reverse;
                    }

                    /* Logo styling */
                    .split-logo {
                        display: flex;
                        gap: 0.35rem;
                        background: transparent;
                        position: relative;
                        z-index: 30;
                        pointer-events: auto;
                    }

                    .logo-ez {
                        padding: 0.4rem 0.9rem;
                        border-radius: 9999px;
                        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                        font-weight: 800;
                        font-size: 0.68rem;
                        position: relative;
                        z-index: 31;
                        cursor: pointer;
                        text-align: center;
                        min-width: 3.2rem;
                        border: 1.5px solid rgba(255,255,255,0.5);
                        letter-spacing: 0.08em;
                        background: linear-gradient(135deg, #10b981, #047857);
                        color: #ffffff;
                        box-shadow:
                            0 4px 15px rgba(5,150,105,0.35),
                            0 0 10px rgba(52,211,153,0.15),
                            inset 0 1px 0 rgba(255,255,255,0.2);
                        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    }

                    .logo-ez:hover {
                        transform: translateY(-2px) scale(1.08);
                        filter: brightness(1.15);
                        box-shadow:
                            0 8px 25px rgba(5,150,105,0.45),
                            0 0 20px rgba(52,211,153,0.3),
                            inset 0 1px 0 rgba(255,255,255,0.3);
                        border-color: rgba(255,255,255,0.8);
                    }

                    /* Avatar glow */
                    .avatar-glow {
                        box-shadow:
                            0 0 0 2px rgba(255,255,255,0.8),
                            0 0 25px rgba(52,211,153,0.5),
                            0 0 50px rgba(52,211,153,0.2);
                        animation: avatar-pulse 3s infinite ease-in-out;
                    }

                    @keyframes avatar-pulse {
                        0%, 100% {
                            box-shadow:
                                0 0 0 2px rgba(255,255,255,0.8),
                                0 0 20px rgba(52,211,153,0.4),
                                0 0 40px rgba(52,211,153,0.15);
                        }
                        50% {
                            box-shadow:
                                0 0 0 2px rgba(255,255,255,0.9),
                                0 0 35px rgba(52,211,153,0.7),
                                0 0 70px rgba(52,211,153,0.3);
                        }
                    }

                    /* Wedge numbers */
                    .wedge-number-outer {
                        font-family: 'SF Pro Display', system-ui, -apple-system, sans-serif;
                        text-anchor: middle;
                        dominant-baseline: central;
                        pointer-events: none;
                        font-size: 14px;
                        font-weight: 800;
                        fill: rgba(255,255,255,0.85);
                        transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
                        text-shadow: 0 1px 4px rgba(0,0,0,0.5);
                    }

                    .active-num-1, .active-num-2, .active-num-3, .active-num-4, .active-num-5 {
                        fill: #ffffff !important;
                        opacity: 1 !important;
                        filter: drop-shadow(0 0 10px rgba(255,255,255,0.9));
                        font-size: 16px;
                        font-weight: 900;
                    }
                `}</style>
            </Head>

            <ClickMessage message={clickMessage.text} visible={clickMessage.visible} />
            {isEmbedRowOpen && (
                <EmbedRowModal
                    isOpen={isEmbedRowOpen}
                    onClose={() => setIsEmbedRowOpen(false)}
                    parentSlug={parentSlug}
                    conversationId={conversationId}
                    onChildConvoCreated={onChildConvoCreated}
                    onCommentCreated={onCommentCreated}
                />
            )}

            <div
                id="draggable-menu-container"
                ref={menuRef}
                className={containerClasses}
                style={getContainerStyle()}
            >
                <div
                    id="main-button"
                    ref={mainButtonRef}
                    className={`relative z-10 cursor-pointer flex items-center justify-center ${activeQuadrant ? `q${activeQuadrant}-active` : ''}`}
                    role="button"
                    aria-label="Quadrant Menu - Click to open, drag to move"
                    aria-haspopup="true"
                    aria-expanded={!!activeQuadrant}
                    tabIndex={0}
                    onKeyDown={handleMainButtonKeyDown}
                >
                    <LogoSection onLogoClick={handleLogoClick} onAvatarClick={handleAvatarClick} isTopCorner={isTopCorner} />

                    <svg viewBox="0 0 100 100" className="w-full h-full select-none absolute inset-0 overflow-visible pointer-events-none">
                        {/* Outer subtle ring */}
                        <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                        
                        {/* Dark base */}
                        <circle cx="50" cy="50" r="48" fill="#0f172a" />
                        
                        {/* Active wedge glow rings */}
                        {WEDGE_POSITIONS.map(w => (
                            <path
                                key={`ring-${w.id}`}
                                d={w.pathData}
                                fill="none"
                                stroke={w.color}
                                strokeWidth="3"
                                className={`active-wedge-ring ring-q${w.id}`}
                                style={{ filter: `drop-shadow(0 0 8px ${w.color})` }}
                            />
                        ))}
                        
                        {/* Wedge slices */}
                        {WEDGE_POSITIONS.map(w => (
                            <g key={w.id}>
                                <defs>
                                    <linearGradient id={`grad-${w.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={w.gradient[0]} />
                                        <stop offset="100%" stopColor={w.gradient[1]} />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={w.pathData}
                                    fill={`url(#grad-${w.id})`}
                                    className={`wedge-slice ${activeQuadrant === w.id ? 'opacity-100' : 'opacity-90'}`}
                                />
                                <text
                                    className={`wedge-number-outer ${activeQuadrant === w.id ? `active-num-${w.id}` : ''}`}
                                    x={w.x}
                                    y={w.y}
                                >
                                    {w.label}
                                </text>
                            </g>
                        ))}
                    </svg>

                    <div className="center-hub" aria-hidden="true">
                        <FontAwesomeIcon icon={faArrowsAlt} className="text-white/70 text-[10px]" />
                    </div>
                </div>

                {Object.entries(menuItems).map(([q, items]) => {
                    const menuPositionClasses = {
                        br: 'bottom-full left-1/2 -translate-x-1/2 mb-4',
                        bl: 'bottom-full right-1/2 translate-x-1/2 mb-4',
                        tr: 'top-full left-1/2 -translate-x-1/2 mt-4',
                        tl: 'top-full right-1/2 translate-x-1/2 mt-4',
                    }[effectiveCorner];

                    const isActive = activeQuadrant === q;
                    const qStyle = QUADRANT_STYLES[q as QuadrantId];

                    return (
                        <div
                            key={q}
                            id={`menu-q${q}`}
                            className={`quadrant-menu ${menuPositionClasses} ${isActive ? 'open' : ''}`}
                            role="menu"
                            aria-labelledby="main-button"
                        >
                            {items.map((item, index) => (
                                <Link
                                    key={`${item.href}-${index}`}
                                    href={item.href}
                                    method={item.method || 'get'}
                                    as={item.method === 'post' ? 'button' : 'a'}
                                    className={`menu-item ${item.isDestructive ? 'destructive' : ''}`}
                                    title={item.label}
                                    role="menuitem"
                                    aria-label={item.label}
                                    onClick={(e) => handleLinkClick(e, item.action, item.href, item.method)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleLinkClick(e, item.action, item.href, item.method);
                                        }
                                    }}
                                    tabIndex={isActive ? 0 : -1}
                                    style={{
                                        animationDelay: `${index * 0.03}s`,
                                        background: item.isDestructive ? undefined : qStyle.bg,
                                        '--item-glow': qStyle.glow,
                                        borderColor: item.isDestructive ? undefined : qStyle.border,
                                    } as React.CSSProperties}
                                >
                                    <div className="icon-wrapper">
                                        <FontAwesomeIcon icon={item.icon} />
                                    </div>
                                    <span className="truncate">{`${q}.${index + 1}`} {item.label}</span>
                                </Link>
                            ))}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default DraggableMenu;