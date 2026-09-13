// resources/js/Pages/EffectView.tsx

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import EffectsDisplay from '@/components/EffectsDisplaynew';
import FlyingSaucer from '@/components/FlyingSaucernew';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode; fallback?: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white text-center">
                        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
                        <p className="text-gray-300 mb-6">The 3D effect couldn't be loaded.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

interface EffectViewProps {
    effect: any[];
    effectType: string;
    showEffectsDisplay: boolean;
    landingPage?: string;
    brandMessage?: string;
    avatarLink?: string;
    movingPattern?: string;
}

export default function EffectView({ 
    effect, 
    effectType, 
    showEffectsDisplay, 
    landingPage = '/', 
    brandMessage = '3D Effect',
    avatarLink = '',
    movingPattern = 'topright'
}: EffectViewProps) {
    const [currentEffect, setCurrentEffect] = useState(effectType || 'bee');
    const [currentLandingPage, setCurrentLandingPage] = useState(landingPage);
    const [currentBrandMessage, setCurrentBrandMessage] = useState(brandMessage);
    const [currentAvatarLink, setCurrentAvatarLink] = useState(avatarLink);
    const [currentMovingPattern, setCurrentMovingPattern] = useState(movingPattern);
    const [isLoading, setIsLoading] = useState(false);
    const [hasHeadError, setHasHeadError] = useState(false);
    
    // Effect titles for Head component
    const effectTitles: Record<string, string> = {
        bee: '🐝 Buzzy the Bee - 3D Effect Gallery',
        saucer: '🛸 Alien UFO - 3D Effect Gallery',
        bird: '🐦 Chirpy Bird - 3D Effect Gallery',
        plane: '✈️ Sky Cruiser - 3D Effect Gallery',
        real: '🏠 Village Scene - 3D Effect Gallery',
        coffee: '☕ Morning Brew - 3D Effect Gallery',
        time: '⏰ Digital Clock - 3D Effect Gallery',
        fire: '🔥 Campfire - 3D Effect Gallery',
        burger: '🍔 Deluxe Burger - 3D Effect Gallery',
        ball: '⚽ Magic Sphere - 3D Effect Gallery',
        superhero: '🦸 Hero Emblem - 3D Effect Gallery',
        none: '3D Effect Gallery'
    };
    
    const effectDescriptions: Record<string, string> = {
        bee: 'A friendly bee with animated wings that flutter gracefully. Drag to rotate and watch the wings move in a mesmerizing pattern!',
        saucer: 'Mysterious flying saucer with a curious alien passenger. The UFO rotates and the alien bobs up and down!',
        bird: 'A cute cartoon bird with flapping wings and a charming personality. Watch it bounce and turn its head!',
        plane: 'Classic propeller plane soaring through fluffy clouds. Realistic propeller animation and cloud effects!',
        real: 'Detailed 3D village with houses, a church, trees, and even a tiny UFO! Explore this charming miniature world.',
        coffee: 'Steaming hot coffee with rising steam effects. Perfect for coffee lovers!',
        time: 'Real-time digital clock displaying hours, minutes, and seconds. Updates every second!',
        fire: 'Warm campfire with dancing flames and glowing embers. Perfect for cozy vibes!',
        burger: 'Juicy burger with sesame seed bun, cheese, and patty. Makes you hungry just looking at it!',
        ball: 'Hypnotic spinning ball with rotating color patterns. Mesmerizing 3D effect!',
        superhero: 'Epic superhero emblem with dynamic lighting effects. Feel like a hero!',
        none: 'Custom 3D effect display'
    };
    
    const currentTitle = effectTitles[currentEffect] || '3D Effect Gallery';
    const currentDescription = effectDescriptions[currentEffect] || 'Interactive 3D effect visualization';
    
    const changeEffect = (newEffect: string) => {
        setIsLoading(true);
        setCurrentEffect(newEffect);
        // Update URL without reloading the page, preserving all parameters
        const url = new URL(window.location.href);
        url.searchParams.set('effect', newEffect);
        // Keep existing parameters
        if (currentLandingPage !== '/') {
            url.searchParams.set('landing_page', currentLandingPage);
        }
        if (currentBrandMessage !== '3D Effect') {
            url.searchParams.set('brand_message', currentBrandMessage);
        }
        if (currentAvatarLink) {
            url.searchParams.set('avatar_link', currentAvatarLink);
        }
        if (currentMovingPattern !== 'topright') {
            url.searchParams.set('moving_pattern', currentMovingPattern);
        }
        window.history.pushState({}, '', url.toString());
        
        // Small delay to show loading state
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
    };
    
    // Listen for URL changes (back/forward buttons)
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const newEffect = params.get('effect') || 'bee';
            const newLandingPage = params.get('landing_page') || '/';
            const newBrandMessage = params.get('brand_message') || '3D Effect';
            const newAvatarLink = params.get('avatar_link') || '';
            const newMovingPattern = params.get('moving_pattern') || 'topright';
            
            if (newEffect !== currentEffect) {
                setCurrentEffect(newEffect);
            }
            if (newLandingPage !== currentLandingPage) {
                setCurrentLandingPage(newLandingPage);
            }
            if (newBrandMessage !== currentBrandMessage) {
                setCurrentBrandMessage(newBrandMessage);
            }
            if (newAvatarLink !== currentAvatarLink) {
                setCurrentAvatarLink(newAvatarLink);
            }
            if (newMovingPattern !== currentMovingPattern) {
                setCurrentMovingPattern(newMovingPattern);
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [currentEffect, currentLandingPage, currentBrandMessage, currentAvatarLink, currentMovingPattern]);
    
    // Update effect data when parameters change
    const updatedEffectData = [
        {
            moving_effect: currentEffect,
            moving_pattern: currentMovingPattern,
            avatar_link: currentAvatarLink,
            landing_page: currentLandingPage,
            brand_message: currentBrandMessage,
            effect_type: '3d'
        }
    ];
    
    // Handle Head component error
    useEffect(() => {
        const timer = setTimeout(() => {
            setHasHeadError(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);
    
    // If Head component is causing issues, render without it
    if (hasHeadError) {
        return (
            <ErrorBoundary>
                <div className="relative min-h-screen overflow-hidden">
                    {/* Fullscreen Facebook Video Background with Autoplay */}
                    <div className="fixed inset-0 z-0">
                        <iframe 
                            src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1345507333998157%2F&show_text=false&width=560&t=0&autoplay=1"
                            width="560"
                            height="314"
                            style={{ 
                                border: 'none',
                                overflow: 'hidden',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                minWidth: '100%',
                                minHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                transform: 'translate(-50%, -50%)',
                                objectFit: 'cover'
                            }}
                            scrolling="no"
                            frameBorder="0"
                            allowFullScreen={true}
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        />
                        {/* Dark overlay for better text visibility */}
                        <div className="absolute inset-0 bg-black/50 z-10"></div>
                    </div>
                    
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-md">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                                <p className="mt-4 text-white text-sm">Loading effect...</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Main Effect Container - Centered */}
                    <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                        <div className="w-full max-w-5xl mx-auto flex items-center justify-center">
                            {showEffectsDisplay && updatedEffectData && updatedEffectData.length > 0 ? (
                                <EffectsDisplay effects={updatedEffectData} />
                            ) : (
                                <FlyingSaucer />
                            )}
                        </div>
                    </div>
                </div>
                
                <style>{`
                    @keyframes blob {
                        0% { transform: translate(0px, 0px) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
                        100% { transform: translate(0px, 0px) scale(1); }
                    }
                    .animate-blob { animation: blob 7s infinite; }
                    .animation-delay-2000 { animation-delay: 2s; }
                    .animation-delay-4000 { animation-delay: 4s; }
                    .zdog-svg, .zdog-canvas, canvas, svg {
                        cursor: grab !important;
                        max-width: 100%;
                        height: auto;
                    }
                    .zdog-svg:active, .zdog-canvas:active, canvas:active, svg:active {
                        cursor: grabbing !important;
                    }
                    ::-webkit-scrollbar { width: 8px; height: 8px; }
                    ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); border-radius: 4px; }
                    ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 4px; }
                    
                    /* Responsive adjustments */
                    @media (max-width: 768px) {
                        .zdog-svg, .zdog-canvas, canvas, svg {
                            max-width: 90vw;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .zdog-svg, .zdog-canvas, canvas, svg {
                            max-width: 85vw;
                        }
                    }
                `}</style>
            </ErrorBoundary>
        );
    }
    
    return (
        <ErrorBoundary>
            <Head>
                <title>{currentTitle}</title>
                <meta name="description" content={currentDescription} />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
            </Head>
            
            <div className="relative min-h-screen overflow-hidden">
                {/* Fullscreen Facebook Video Background with Autoplay */}
                <div className="fixed inset-0 z-0">
                    <iframe 
                        src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1345507333998157%2F&show_text=false&width=560&t=0&autoplay=1"
                        width="560"
                        height="314"
                        style={{ 
                            border: 'none', 
                            overflow: 'hidden',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            minWidth: '100%',
                            minHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            transform: 'translate(-50%, -50%)',
                            objectFit: 'cover'
                        }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    />
                    {/* Dark overlay for better text visibility */}
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                </div>
                
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-md">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                            <p className="mt-4 text-white text-sm">Loading effect...</p>
                        </div>
                    </div>
                )}
                
                {/* Main Effect Container - Centered */}
                <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-5xl mx-auto flex items-center justify-center">
                        {showEffectsDisplay && updatedEffectData && updatedEffectData.length > 0 ? (
                            <EffectsDisplay effects={updatedEffectData} />
                        ) : (
                            <FlyingSaucer />
                        )}
                    </div>
                </div>
            </div>
            
            {/* Global Styles */}
            <style>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                /* Zdog Canvas Styles */
                .zdog-svg, .zdog-canvas, canvas, svg {
                    cursor: grab !important;
                    max-width: 100%;
                    height: auto;
                }
                
                .zdog-svg:active, .zdog-canvas:active, canvas:active, svg:active {
                    cursor: grabbing !important;
                }
                
                /* Smooth Scrolling */
                html {
                    scroll-behavior: smooth;
                }
                
                /* Custom Scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, #9f7aea, #8b5cf6);
                }
                
                /* Responsive adjustments */
                @media (max-width: 1024px) {
                    .zdog-svg, .zdog-canvas, canvas, svg {
                        max-width: 95vw;
                    }
                }
                
                @media (max-width: 768px) {
                    .zdog-svg, .zdog-canvas, canvas, svg {
                        max-width: 90vw;
                    }
                    
                    .p-4 {
                        padding: 0.75rem;
                    }
                }
                
                @media (max-width: 480px) {
                    .zdog-svg, .zdog-canvas, canvas, svg {
                        max-width: 85vw;
                    }
                    
                    .p-4 {
                        padding: 0.5rem;
                    }
                }
            `}</style>
        </ErrorBoundary>
    );
}