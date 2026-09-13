import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import '@google/model-viewer';
import EffectsDisplay from '@/components/EffectsDisplay';
import FlyingSaucer from '@/components/FlyingSaucer'; // Added import
import Modal from "@/components/Modal";
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

// Memoized ResizableContent component with mode-based positioning
const ResizableContent = memo(({
  content,
  onEyeClick,
  index,
  mode
}: {
  content: any,
  onEyeClick: (content: string | null) => void,
  index: number,
  mode: string
}) => {
  // Determine position based on mode and index
  const getPositionClass = () => {
    if (!mode) return ''; // Default behavior if no mode

    const modePattern = mode.split(','); // Split mode into array (e.g., ['L','C','R'])
    const positionIndex = index % modePattern.length;
    const position = modePattern[positionIndex];
    switch(position) {
      case 'L': return 'self-start ml-5 mr-auto';
      case 'C': return 'self-center mx-auto';
      case 'R': return 'self-end ml-auto mr-5';
      default: return '';
    }
  };

  return (
    <Resizable
      defaultSize={{
        width: content.width,
        height: 'auto',
      }}
      minWidth={100}
      minHeight={50}
      bounds="parent"
      enable={{
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false
      }}
      className={`relative m-5 hover:overflow-auto overflow-hidden touch-manipulation ${getPositionClass()}`}
    >
      <div className="p-4 justify-center rounded-lg shadow bg-[rgba(31,41,55,0.5)] relative w-full h-full flex flex-col items-center justify-center">
        <div
          className="absolute top-2 right-2 z-50 cursor-pointer hidden touch-action-none"
          onClick={() => onEyeClick(content.url || null)}
          onTouchEnd={(e) => {
            e.preventDefault();
            onEyeClick(content.url || null);
          }}
        >
          👁️
        </div>
        {content.title && (
          <div dangerouslySetInnerHTML={{ __html: content.title }} className="text-center w-full touch-manipulation" />
        )}
        {content.url && (
          <div dangerouslySetInnerHTML={{ __html: content.url }} className="text-center w-full touch-manipulation" />
        )}
      </div>
    </Resizable>
  );
});

ResizableContent.displayName = 'ResizableContent';

export default function Welcome() {
    const { auth, template, allTemplates , contents, funnel, eye_tracking, fly_sign, count, sidebarwidth, effect, mode } = usePage<SharedData>().props;
    const [viewMode, setViewMode] = useState<'design' | 'tile' | 'theme' | 'university'>('design');
    const [isEffectsDisplayVisible, setIsEffectsDisplayVisible] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isInCollection, setIsInCollection] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [copySuccessAlert, setCopySuccessAlert] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showEyeTracking, setShowEyeTracking] = useState(eye_tracking === 1);
    const [sidebarPosition, setSidebarPosition] = useState({ right: sidebarwidth });
    const [contentModal, setContentModal] = useState<{ show: boolean, content: string | null }>({
        show: false,
        content: null
    });

    // Reaction states
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);

    const sidebarRef = useRef<HTMLDivElement>(null);
    const viewModeRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);

    const [isScrollingUp, setIsScrollingUp] = useState(false);
    const [isScrollingDown, setIsScrollingDown] = useState(false);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchTimeout = useRef<NodeJS.Timeout | null>(null);

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    // Function to render template content (extracted from useMemo)
    const renderTemplateContent = useCallback((currentTemplate) => {
        if (!currentTemplate?.image) return null;

        const extension = currentTemplate.image.split('.').pop()?.toLowerCase() || '';
        const imgPath = currentTemplate.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        const fullImageUrl = `${imgPath}${currentTemplate.image}`;

        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        const validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];

        const youtubeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
        const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^/]+:[^"&?/ ]+)/i;
        const vimeoRegex = /^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im;
        const fbWatchRegex = /^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/;
        const facebookRegex = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/;
        const iframeRegex = /<iframe.*?src=["'](.*?)["'].*?>.*?<\/iframe>/is;
        const blockquoteRegex = /<blockquote/;

        const youtubeMatch = currentTemplate.image.match(youtubeRegex);
        const linkedinMatch = currentTemplate.image.match(linkedinRegex);
        const vimeoMatch = currentTemplate.image.match(vimeoRegex);
        const fbWatchMatch = currentTemplate.image.match(fbWatchRegex);
        const facebookMatch = currentTemplate.image.match(facebookRegex);
        const iframeMatch = currentTemplate.image.match(iframeRegex) || blockquoteRegex.test(currentTemplate.image);
        const htmlBlob = new Blob([currentTemplate.image], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);

        if (validImageExtensions.includes(extension)) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <img
                        src={fullImageUrl}
                        alt="Background"
                        className="absolute inset-0 max-w-full max-h-full m-auto z-0 rounded-lg touch-none"
                        onError={(e) => console.error('Image failed to load', e)}
                        key={`img-${currentTemplate.id}`}
                    />
                </>
            );
        }

        if (validDocumentExtensions.includes(extension)) {
            return (
                <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(fullImageUrl)}&embedded=true`}
                    className="fixed top-0 left-0 w-full h-full touch-action-pan-y"
                    frameBorder="0"
                    loading="lazy"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin"
                    title="Document Viewer"
                    key={`doc-${currentTemplate.id}`}
                    scrolling="yes"
                />
            );
        }

        if (iframeMatch) {
            const processedHtml = currentTemplate.image
                .replace(/<(iframe|blockquote)([^>]*)\s(height|width|style)=["'][^"']*["']([^>]*)>/gi, '<$1$2$4 class="fixed top-0 left-0 w-full h-full" scrolling="yes">')
                .replace(/class="([^"]*)"/g, 'class="$1 absolute inset-0 m-auto"');

            const finalHtml = !/<(iframe|blockquote)[^>]*class="/i.test(processedHtml)
                ? processedHtml.replace(/<(iframe|blockquote)/g, '<$1 scrolling="yes" class="absolute w-full h-full inset-0 m-auto"')
                : processedHtml;

            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                        .twitter-tweet {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            object-fit: cover;
                            z-index: 0;
                            border: none;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <div
                        className="fixed top-0 left-0 w-full h-full object-cover touch-none"
                        dangerouslySetInnerHTML={{ __html: finalHtml }}
                        key={`iframe-${currentTemplate.id}`}
                    />
                </>
            );
        }

        if (youtubeMatch) {
            const autoplayParam = currentTemplate.option === 'autoplay' ? 'autoplay=1' :
                                currentTemplate.option === 'mute' ? 'autoplay=1&mute=1' : 'mute=1';

            return (
                <>
                    <div className="fixed top-0 left-0 w-full h-full z-[-2]">
                        <iframe
                            loading="lazy"
                            src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${autoplayParam}&loop=1&playlist=${youtubeMatch[1]}&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3`}
                            className="w-full h-full object-cover touch-action-pan-y"
                            frameBorder="0"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            key={`yt-embed-${currentTemplate.id}`}
                        />
                    </div>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe
                        id="bgVideo"
                        loading="lazy"
                        className="fixed top-0 left-0 w-full h-full object-cover touch-action-pan-y"
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${currentTemplate.option}=1&mute=1&loop=1&playlist=${youtubeMatch[1]}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        key={`yt-main-${currentTemplate.id}`}
                    />
                </>
            );
        }

        if (linkedinMatch) {
            let linkedinUrl = currentTemplate.image;
            if (!linkedinUrl.includes('?compact=1')) {
                linkedinUrl += (linkedinUrl.includes('?') ? '&' : '?') + 'compact=1';
            }

            return (
                <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black">
                    <iframe
                        id="bgVideo"
                        src={linkedinUrl}
                        className="w-full h-full touch-action-pan-y"
                        frameBorder="0"
                        allowFullScreen
                        title="Embedded LinkedIn Post"
                        key={`linkedin-${currentTemplate.id}`}
                        scrolling="yes"
                    />
                </div>
            );
        }

        if (vimeoMatch) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe
                        loading="lazy"
                        id="bgVideo"
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        src={`https://player.vimeo.com/video/${vimeoMatch[3]}?h=33160d1512&color=de0101`}
                        className="fixed top-0 left-0 w-full h-full object-cover touch-action-pan-y"
                        frameBorder="0"
                        allowFullScreen
                        key={`vimeo-${currentTemplate.id}`}
                    />
                </>
            );
        }

        if (fbWatchMatch || (facebookMatch && !currentTemplate.image.includes('groups'))) {
            return (
                <div className="fixed top-0 left-0 w-full h-full">
                    <div
                        className="fb-post"
                        data-href={currentTemplate.image}
                        data-width="1400"
                        data-show-text="true"
                        key={`fb-${currentTemplate.id}`}
                    />
                </div>
            );
        }

        if (extension === 'mp4') {
            return (
                <>
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="fixed top-0 left-0 w-full h-full object-cover z-[-3] touch-none"
                        key={`mp4-bg-${currentTemplate.id}`}
                    >
                        <source src={fullImageUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <video
                        id="bgVideo"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full m-auto touch-action-pan-y"
                        controls
                        key={`mp4-main-${currentTemplate.id}`}
                    >
                        <source src={fullImageUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </>
            );
        }

        if (extension === 'glb') {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <model-viewer
                        src={fullImageUrl}
                        alt="3D model"
                        className="fixed top-0 left-0 w-full h-full touch-action-pan-y"
                        ar
                        auto-rotate
                        camera-controls
                        shadow-intensity="1"
                        key={`glb-${currentTemplate.id}`}
                    />
                </>
            );
        }

        if (isValidUrl(currentTemplate.image)) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe
                        loading="lazy"
                        id="bgVideo"
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        src={currentTemplate.image}
                        className="fixed top-0 left-0 w-full h-full touch-action-pan-y"
                        frameBorder="0"
                        allowFullScreen
                        key={`generic-${currentTemplate.id}`}
                        scrolling="yes"
                    />
                </>
            );
        }

        return (
            <iframe
                src={htmlUrl}
                className="fixed top-0 left-0 w-full h-full border-none touch-action-pan-y"
                allow="fullscreen; microphone; camera; autoplay; display-capture"
                sandbox="allow-forms allow-modals allow-pointer-lock allow-popups 
                        allow-presentation allow-scripts allow-downloads 
                        allow-storage-access-by-user-activation"
                allowFullScreen  // Still included for backward compatibility
                loading="lazy"
                name="binauralMixerFrame"
                referrerpolicy="strict-origin-when-cross-origin"
                title="Binaural Audio Mixer"  // Accessibility requirement
            />
        );
    }, []);

    const memoizedBackgroundContent = useMemo(() => {
        if (allTemplates && allTemplates.length > 1) {
            return (
                <>
                    <style>{`
                        .swiper-button-next::after,
                        .swiper-button-prev::after {
                            content: none;
                        }
                    `}</style>
                    <Swiper
                      modules={[EffectFade, Navigation]}
                      effect="fade"
                      speed={1000}
                      loop={true}
                      loopAdditionalSlides={1}
                      navigation={{
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                      }}
                      className="h-full w-full"
                    >
                      {allTemplates.map((tpl) => (
                        <SwiperSlide key={tpl.id}>
                          {renderTemplateContent(tpl)}
                        </SwiperSlide>
                      ))}
                      <div className="swiper-button-prev !left-4 !text-white !w-10 !h-10 p-[5px] !flex !items-center !justify-center !bg-gray-800/70 !rounded-full">
                        <FontAwesomeIcon icon={faChevronLeft} className="!text-2xl " />
                      </div>
                      <div className="swiper-button-next !right-4 !text-white !w-10 p-[5px] !h-10 !flex !items-center !justify-center !bg-gray-800/70 !rounded-full">
                        <FontAwesomeIcon icon={faChevronRight} className="!text-2xl " />
                      </div>
                    </Swiper>
                </>
            );
        }
        return renderTemplateContent(template);
    }, [allTemplates, template, renderTemplateContent]);

    const blurStyle = useMemo(() => {
        if (!template?.image) return null;

        const extension = template.image.split('.').pop()?.toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'].includes(extension || '');

        return isImage ? (
            <style>{`
                .blur-bg {
                    background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                    background-size: cover;
                }
            `}</style>
        ) : null;
    }, [template]);

    // Load reaction counts and user reaction
    useEffect(() => {
        const loadReactionData = async () => {
            try {
                // Get reaction counts
                const countsResponse = await axios.get(`/reactions/${funnel}/counts`);
                setLikes(countsResponse.data.likes);
                setDislikes(countsResponse.data.dislikes);

            } catch (error) {
                console.error('Error loading reaction data:', error);
            }
        };

        if (funnel?.id) {
            loadReactionData();
        }
    }, [funnel?.id]);

    // Handle like/dislike reactions
    const handleReaction = async (reactionType: 'like' | 'dislike') => {
        try {
            const response = await axios.post('/reactions', {
                funnelid: funnel,
                reaction: reactionType
            });

            setLikes(response.data.likes);
            setDislikes(response.data.dislikes);

            // Update user's current reaction
            if (response.data.action === 'removed' && userReaction === reactionType) {
                setUserReaction(null);
            } else {
                setUserReaction(reactionType);
            }
        } catch (error) {
            console.error('Error submitting reaction:', error);
        }
    };

    const startScrolling = useCallback((direction: 'up' | 'down') => {
        if (scrollInterval.current) clearInterval(scrollInterval.current);

        const scrollStep = 25;
        const scrollDelay = 50;

        scrollInterval.current = setInterval(() => {
            if (mainRef.current) {
                mainRef.current.scrollBy({
                    top: direction === 'up' ? -scrollStep : scrollStep,
                    behavior: 'auto'
                });
            }
        }, scrollDelay);
    }, []);

    useEffect(() => {
        return () => {
            if (scrollInterval.current) {
                clearInterval(scrollInterval.current);
            }
            if (touchTimeout.current) {
                clearTimeout(touchTimeout.current);
            }
        };
    }, []);

    const handleMouseDown = (direction: 'up' | 'down') => {
        if (direction === 'up') {
            setIsScrollingUp(true);
        } else {
            setIsScrollingDown(true);
        }
        startScrolling(direction);
    };

    const handleMouseUp = () => {
        setIsScrollingUp(false);
        setIsScrollingDown(false);
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    const handleMouseLeave = () => {
        handleMouseUp();
    };

    // Touch event handlers for scrolling
    const handleTouchStart = (direction: 'up' | 'down') => {
        if (direction === 'up') {
            setIsScrollingUp(true);
        } else {
            setIsScrollingDown(true);
        }
        startScrolling(direction);
    };

    const handleTouchEnd = () => {
        handleMouseUp();
    };

    const handleScrollTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleScrollTouchMove = (e: React.TouchEvent) => {
        if (!touchStartY.current) return;

        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY.current - touchY;

        if (mainRef.current) {
            mainRef.current.scrollBy({
                top: deltaY,
                behavior: 'auto'
            });
        }

        touchStartY.current = touchY;
    };

    const handleScrollTouchEnd = () => {
        touchStartY.current = null;
    };

    const toggleEyeTracking = () => {
        setShowEyeTracking(!showEyeTracking);
        if (showEyeTracking) {
            setSidebarPosition({ right: sidebarwidth });
        } else {
            setSidebarPosition({ right: '4%' });
        }
    };

    useEffect(() => {
        if (eye_tracking === 0) {
            setShowEyeTracking(false);
            setSidebarPosition({ right: sidebarwidth });
        } else {
            setShowEyeTracking(true);
            setSidebarPosition({ right: '4%' });
        }
    }, [eye_tracking]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showShareOptions && !target.closest('.relative')) {
                setShowShareOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showShareOptions]);

    useEffect(() => {
        if (auth.user && template?.id) {
            checkThemeInCollection();
        }
    }, [auth.user, template?.id]);

    const checkThemeInCollection = async () => {
        try {
            const response = await axios.get(`/check-theme-collection/${template.id}`);
            setIsInCollection(response.data.isInCollection);
        } catch (error) {
            console.error('Error checking theme collection:', error);
        }
    };

    const addToCollection = async () => {
        if (!auth.user) {
            setShowLoginModal(true);
            return;
        }

        try {
            await axios.post('/add-to-collection', {
                theme_id: template.id
            });
            setIsInCollection(true);
            setShowSuccessAlert(true);
            setTimeout(() => setShowSuccessAlert(false), 3000);
        } catch (error) {
            console.error('Error adding to collection:', error);
        }
    };

    const toggleEffectsDisplay = () => {
        setIsEffectsDisplayVisible(!isEffectsDisplayVisible);
    };

    useEffect(() => {
        if (fly_sign === 1) {
            setIsEffectsDisplayVisible(false);
        } else {
            setIsEffectsDisplayVisible(true);
        }
    }, [fly_sign]);

    useEffect(() => {
        if (template?.image.includes('facebook.com') || template?.image.includes('fb.watch')) {
            const script = document.createElement('script');
            script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, [template]);

    // Memoize the contents array
    const memoizedContents = useMemo(() => contents, [contents]);

    // Memoize the eye click handler
    const handleEyeClick = useCallback((content: string | null) => {
        setContentModal({
            show: true,
            content
        });
    }, []);

    // Handle touch events for buttons
    const handleButtonTouch = (callback: Function) => {
        if (touchTimeout.current) {
            clearTimeout(touchTimeout.current);
        }

        touchTimeout.current = setTimeout(() => {
            callback();
        }, 100);
    };

    return (
        <>
			<style>{`
			  iframe {
				width: 100% !important;
			  }
			`}</style>
            {showSuccessAlert && (
                <div className="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
                    Theme added to your collection!
                </div>
            )}
            {copySuccessAlert && (
                <div className="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
                    Great! The theme URL has been copied to your clipboard.
                </div>
            )}

            <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)}>
                <div className="inline-block mt-25 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-black via-gray-900 to-lime-900 shadow-2xl text-white">
                        <h3 className="text-2xl font-semibold text-lime-400">🔒 Login Required</h3>
                        <p className="mt-3 text-sm text-gray-300">
                            You need to log in to add this theme to your collection. Please sign in or cancel to go back.
                        </p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                className="bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold py-2 px-4 rounded-lg border border-gray-600 shadow hover:bg-gray-800 hover:text-lime-400 hover:border-lime-500 transition-all duration-300"
                                onClick={() => setShowLoginModal(false)}
                                onTouchEnd={() => handleButtonTouch(() => setShowLoginModal(false))}
                            >
                                Cancel
                            </button>
                            <Link href={route('login')}>
                                <span
                                    className="bg-gradient-to-r from-lime-500 to-lime-600 text-black font-bold py-2 px-4 rounded-lg border-2 border-white shadow hover:shadow-xl hover:bg-white hover:text-black transition-all duration-300 flex items-center gap-2"
                                    onTouchEnd={() => handleButtonTouch(() => window.location.href = route('login'))}
                                >
                                    <i className="fas fa-sign-in-alt" />
                                    SIGN IN
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </Modal>

            <main className={`relative flex min-h-screen overflow-hidden ${
                template?.image.split('.').pop()?.toLowerCase() &&
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>

                {blurStyle}

                <div className="absolute inset-0 z-0">
                  {memoizedBackgroundContent}
                </div>

                {/* Modified section to show FlyingSaucer when effect is null */}
                {isEffectsDisplayVisible && (
                  effect ? <EffectsDisplay effects={effect} /> : <FlyingSaucer />
                )}
                <div
                    className={`fixed top-[-6px] left-[-71px] w-[176px] ${
                        isEffectsDisplayVisible ? 'bg-red-600' : 'bg-green-600'
                    } text-white text-[12px] font-bold text-center py-[10px] pb-[5px] shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation`}
                    onClick={toggleEffectsDisplay}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        toggleEffectsDisplay();
                    }}
                >
                    {isEffectsDisplayVisible ? 'OFF' : 'ON'} <br /> Fly-Sign
                </div>

                <Draggable nodeRef={viewModeRef}>
                    <div
                        ref={viewModeRef}
                        style={{ display: showEyeTracking ? 'block' : 'none' }}
                        className="absolute top-[50px] left-[100px] px-5 py-2 rounded-[24px] text-white font-bold cursor-pointer transition-all duration-300 z-[1001] hover:bg-gray-800/50 touch-manipulation"
                    >
                        <picture
                            onClick={toggleEyeTracking}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                toggleEyeTracking();
                            }}
                        >
                            <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.webp" type="image/webp" />
                            <img
                                src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif"
                                alt="👀"
                                width="80"
                                height="80"
                                className="emoji-eye"
                            />
                        </picture>
                    </div>
                </Draggable>

                <div
                    className="fixed top-[29px] left-[-38px] w-[163px] bg-black text-white text-[12px] font-bold text-center py-1 shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation"
                    onClick={() => {
                        setViewMode(prev =>
                            prev === 'design' ? 'tile' :
                            prev === 'tile' ? 'theme' :
                            prev === 'theme' ? 'university' :
                            'design'
                        );
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        setViewMode(prev =>
                            prev === 'design' ? 'tile' :
                            prev === 'tile' ? 'theme' :
                            prev === 'theme' ? 'university' :
                            'design'
                        );
                    }}
                >
                    {viewMode === 'design' ? 'Design View' :
                     viewMode === 'tile' ? 'Tile View' :
                     viewMode === 'theme' ? 'Theme Only' :
                     'University'}
                </div>

                {viewMode !== 'theme' && (
                    <div className="fixed flex items-center justify-center top-[48px] left-[-39px] w-[200px] h-[22px] bg-gray-500/50 text-white text-[12px] font-bold shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation">
                        {funnel}
                    </div>
                )}

                {viewMode === 'theme' && (
                    <div className="fixed top-[48px] left-[-39px] w-[200px] h-[22px] bg-gray-500/50 text-white text-[12px] font-bold shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation">
                        <span className="flex items-center justify-center w-full gap-1">
                            {template.unique_id} EZ$ {template.price}
                            <span
                                onClick={addToCollection}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    addToCollection();
                                }}
                                className="cursor-pointer"
                            >
                                {isInCollection ? '❤️' : '🤍'}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="w-4 h-4 text-white hover:text-blue-500 cursor-pointer transition-colors touch-manipulation"
                                onClick={() => {
                                    const url = `https://ez.wiki/${template.unique_id}`;
                                    navigator.clipboard.writeText(url)
                                        .then(() => {
                                            setCopySuccessAlert(true);
                                            setTimeout(() => setCopySuccessAlert(false), 3000);
                                        })
                                        .catch(err => {
                                            console.error('Failed to copy URL: ', err);
                                            setCopySuccessAlert(false);
                                        });
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    const url = `https://ez.wiki/${template.unique_id}`;
                                    navigator.clipboard.writeText(url)
                                        .then(() => {
                                            setCopySuccessAlert(true);
                                            setTimeout(() => setCopySuccessAlert(false), 3000);
                                        })
                                        .catch(err => {
                                            console.error('Failed to copy URL: ', err);
                                            setCopySuccessAlert(false);
                                        });
                                }}
                            >
                                <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                            </svg>
                        </span>
                    </div>
                )}

                {!showEyeTracking && (
                    <>
                        {viewMode !== 'theme' && viewMode !== 'university' && (
                            <div
                                ref={mainRef}
                                className={`w-full h-[100vh] z-10 overflow-y-auto ${
                                    viewMode === 'design' ? 'flex flex-col space-y-8' : 'flex flex-wrap'
                                }`}
                                onTouchStart={handleScrollTouchStart}
                                onTouchMove={handleScrollTouchMove}
                                onTouchEnd={handleScrollTouchEnd}
                            >
                                {memoizedContents.map((content, index) => (
                                    <ResizableContent
                                        key={content.id}
                                        content={content}
                                        onEyeClick={handleEyeClick}
                                        index={index}
                                        mode={mode}
                                    />
                                ))}
                            </div>
                        )}

                        {viewMode === 'university' && (
                            <div
                                ref={mainRef}
                                className="w-full h-[100vh] z-10 overflow-y-auto"
                                onTouchStart={handleScrollTouchStart}
                                onTouchMove={handleScrollTouchMove}
                                onTouchEnd={handleScrollTouchEnd}
                            >
                                <div className="w-[97%] bg-[rgba(31,41,55,0.5)] rounded-lg shadow p-4 m-5">
                                    <div className="bg-blue-50 font-[Tahoma,Arial,Helvetica,sans-serif] min-h-screen p-0 m-0">
                                        <div className="max-w-3xl mx-auto p-5">
                                            <h3 className="text-center text-4xl font-bold mt-5 text-transparent bg-gradient-to-r from-black to-black bg-clip-text">
                                                Rules for Purchasing and Selling Brand Domains and Handles<br />(2024.12.30)
                                            </h3>

                                            <ol className="list-decimal pl-5 mt-8 space-y-6">
                                                {[
                                                    {
                                                        bg: 'bg-white',
                                                        border: 'border-[#6c5ce7]',
                                                        title: 'Purchasing a Property:',
                                                        content: 'You can buy a Brand Domain or Brand Handle ("Property") for a flat fee of US$6.00.'
                                                    },
                                                    {
                                                        bg: 'bg-[#f9f7ff]',
                                                        border: 'border-[#00cec9]',
                                                        title: 'Setting a Selling Price:',
                                                        content: 'Set a selling price known as NYP (Name Your Price).'
                                                    },
                                                    {
                                                        bg: 'bg-white',
                                                        border: 'border-[#6c5ce7]',
                                                        title: 'Bidding Process:',
                                                        content: 'Interested parties place a bond with the platform to indicate their interest in purchasing at the NYP.'
                                                    },
                                                    {
                                                        bg: 'bg-[#f9f7ff]',
                                                        border: 'border-[#00cec9]',
                                                        title: 'Decision Period:',
                                                        content: (
                                                            <>
                                                                Once a bond is placed by a bidder, you have 3 calendar days to decide whether to:
                                                                <ul className="list-disc pl-6 mt-2 text-gray-700">
                                                                    <li className="mb-2">Sell the Property at the original NYP.</li>
                                                                    <li>Pay a penalty (e.g., 20% of the NYP bond) and continue to own the Property.</li>
                                                                </ul>
                                                            </>
                                                        )
                                                    },
                                                    {
                                                        bg: 'bg-white',
                                                        border: 'border-[#6c5ce7]',
                                                        title: 'Receiving Payment:',
                                                        content: 'If you accept the offer, you will receive the full NYP amount minus the transaction fee and the commission rate set by the platform at the time of transfer (e.g., 10% of the NYP bond).'
                                                    },
                                                    {
                                                        bg: 'bg-[#f9f7ff]',
                                                        border: 'border-[#00cec9]',
                                                        title: 'Third-Party Fees:',
                                                        content: 'The platform will deduct any transaction fees charged by payment gateways and any applicable tax withholdings from the NYP amount before it is disbursed to you.'
                                                    },
                                                    {
                                                        bg: 'bg-white',
                                                        border: 'border-[#6c5ce7]',
                                                        title: 'Keeping the Property:',
                                                        content: 'If you decide to keep the Property by paying the penalty, the bidder will receive a full refund of their NYP bond.'
                                                    },
                                                    {
                                                        bg: 'bg-[#f9f7ff]',
                                                        border: 'border-[#00cec9]',
                                                        title: 'Penalty Distribution:',
                                                        content: 'The penalty paid by the original owner will be split 50/50 between the platform and the bidder.'
                                                    },
                                                    {
                                                        bg: 'bg-white',
                                                        border: 'border-[#6c5ce7]',
                                                        title: 'Third-Party Fees:',
                                                        content: 'The platform will handle any transaction fees charged by payment gateways and any applicable tax withholdings from the penalty amount before distribution.'
                                                    }
                                                ].map((item, index) => (
                                                    <li
                                                        key={index}
                                                        className={`${item.bg} p-5 rounded-xl shadow-md text-lg leading-relaxed border-l-[6px] ${item.border}`}
                                                    >
                                                        <strong className="block text-2xl mb-2 text-gray-900">{item.title}</strong>
                                                        {typeof item.content === 'string' ? (
                                                            <p className="text-black">{item.content}</p>
                                                        ) : (
                                                            item.content
                                                        )}
                                                    </li>
                                                ))}
                                            </ol>

                                            <div className="mt-10 text-center text-gray-500">aaa</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <Draggable nodeRef={sidebarRef}>
                    <div
                        ref={sidebarRef}
                        className="space-x-4 z-10 absolute top-4 right-4 touch-manipulation"
                        style={{
                            right: sidebarPosition.right,
                            transition: 'left 0.3s ease, right 0.3s ease'
                        }}
                    >
                        <div className="flex w-16 flex-col items-center space-y-2 from-sky-300 via-teal-500 to-green-700 py-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer">
                                <div
                                    className="flex h-6 w-6 items-center justify-center rounded-sm border border-black bg-blue-600"
                                    onClick={() => {
                                        setViewMode(prev =>
                                            prev === 'design' ? 'tile' :
                                            prev === 'tile' ? 'theme' :
                                            prev === 'theme' ? 'university' :
                                            'design'
                                        );
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        setViewMode(prev =>
                                            prev === 'design' ? 'tile' :
                                            prev === 'tile' ? 'theme' :
                                            prev === 'theme' ? 'university' :
                                            'design'
                                        );
                                    }}
                                >
                                    <span className="font-bold text-white">
                                        {viewMode === 'design' ? '1' :
                                         viewMode === 'tile' ? '2' :
                                         viewMode === 'theme' ? '3' :
                                         '4'}
                                    </span>
                                </div>
                            </div>

                            <Link href={route('home')}>
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                    onTouchEnd={() => handleButtonTouch(() => window.location.href = route('home'))}
                                >
                                    <span className="text-2xl">🏠</span>
                                </div>
                            </Link>

                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                onTouchEnd={() => handleButtonTouch(() => {})}
                            >
                                <span className="text-2xl">🏆</span>
                            </div>

                            <div className="relative">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                    onClick={() => setShowShareOptions(!showShareOptions)}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        setShowShareOptions(!showShareOptions);
                                    }}
                                >
                                    <span className="text-2xl -rotate-45 text-white">🔗</span>
                                </div>

                                {showShareOptions && (
                                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-50 py-1">
                                        <button
                                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 rounded"
                                            onClick={() => {
                                                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank');
                                                setShowShareOptions(false);
                                            }}
                                            onTouchEnd={(e) => {
                                                e.preventDefault();
                                                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank');
                                                setShowShareOptions(false);
                                            }}
                                        >
                                            <span className="mr-2">🐦</span> Twitter
                                        </button>
                                        <button
                                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 rounded"
                                            onClick={() => {
                                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                                                setShowShareOptions(false);
                                            }}
                                            onTouchEnd={(e) => {
                                                e.preventDefault();
                                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                                                setShowShareOptions(false);
                                            }}
                                        >
                                            <span className="mr-2">👍</span> Facebook
                                        </button>
                                        <button
                                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 rounded"
                                            onClick={() => {
                                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
                                                setShowShareOptions(false);
                                            }}
                                            onTouchEnd={(e) => {
                                                e.preventDefault();
                                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
                                                setShowShareOptions(false);
                                            }}
                                        >
                                            <span className="mr-2">💼</span> LinkedIn
                                        </button>
                                        <button
                                            className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 rounded"
                                            onClick={() => {
                                                window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}`, '_blank');
                                                setShowShareOptions(false);
                                            }}
                                            onTouchEnd={(e) => {
                                                e.preventDefault();
                                                window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}`, '_blank');
                                                setShowShareOptions(false);
                                            }}
                                        >
                                            <span className="mr-2">📌</span> Pinterest
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div
                                className="flex h-16 w-10 flex-col items-center justify-around rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                onMouseLeave={handleMouseLeave}
                                onTouchEnd={handleTouchEnd}
                            >
                                <span
                                    className={`text-sm ${isScrollingUp ? 'text-blue-400' : 'text-white'} hover:text-blue-300`}
                                    onMouseDown={() => handleMouseDown('up')}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        mainRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
                                    }}
                                    onTouchStart={() => handleTouchStart('up')}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    ▲
                                </span>
                                <span
                                    className={`text-sm ${isScrollingDown ? 'text-blue-400' : 'text-white'} hover:text-blue-300`}
                                    onMouseDown={() => handleMouseDown('down')}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        mainRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
                                    }}
                                    onTouchStart={() => handleTouchStart('down')}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    ▼
                                </span>
                            </div>

                            <div
                                className="flex h-16 w-10 flex-col items-center justify-center gap-1 rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    toggleEyeTracking();
                                }}
                            >
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">{count}</div>
                                <span className="text-xl" onClick={toggleEyeTracking}>
                                    <picture>
                                        <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.webp" type="image/webp" />
                                        <img
                                            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif"
                                            alt="👀"
                                            width="24"
                                            height="24"
                                            className="emoji-eye cursor-pointer"
                                        />
                                    </picture>
                                </span>
                            </div>

                            {/* Like Button */}
                            <div
                                className="flex h-16 w-10 flex-col items-center justify-center gap-1 rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    handleReaction('like');
                                }}
                            >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${userReaction === 'like' ? 'bg-blue-500' : 'bg-green-500'} text-[10px] font-bold text-white`}>
                                    {likes}
                                </div>
                                <span
                                    className="text-xl"
                                    onClick={() => handleReaction('like')}
                                    style={{ color: userReaction === 'like' ? '#3b82f6' : 'inherit' }}
                                >
                                    👍
                                </span>
                            </div>

                            {/* Dislike Button */}
                            <div
                                className="flex h-16 w-10 flex-col items-center justify-center gap-1 rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    handleReaction('dislike');
                                }}
                            >
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${userReaction === 'dislike' ? 'bg-blue-500' : 'bg-red-500'} text-[10px] font-bold text-white`}>
                                    {dislikes}
                                </div>
                                <span
                                    className="text-xl"
                                    onClick={() => handleReaction('dislike')}
                                    style={{ color: userReaction === 'dislike' ? '#3b82f6' : 'inherit' }}
                                >
                                    👎
                                </span>
                            </div>

                            <div
                                className="relative h-16 w-16 rounded-full bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                onTouchEnd={() => handleButtonTouch(() => {})}
                            >
                                <div className="absolute left-1/2 top-1.5 -translate-x-1/2 flex h-10 w-12 flex-col items-center justify-center rounded-full bg-orange-400">
                                    <span className="text-xs font-bold leading-tight text-white text-shadow">340.00</span>
                                    <span className="text-[9px] font-semibold leading-tight text-white text-shadow">EZ$</span>
                                </div>
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xl">💡</span>
                            </div>
                        </div>
                    </div>
                </Draggable>

                <Modal show={contentModal.show} onClose={() => setContentModal({show: false, content: null})}>
                    <div className="inline-block mt-25 rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-[95%]">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-black via-gray-900 to-lime-900 shadow-2xl text-white w-full max-h-[80vh] overflow-auto">
                            {contentModal.content ? (
                                <div className="bg-gray-800 p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: contentModal.content }} />
                            ) : (
                                <p className="text-gray-300">No content available</p>
                            )}
                            <div className="mt-6 flex justify-end">
                                <button
                                    className="bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold py-2 px-4 rounded-lg border border-gray-600 shadow hover:bg-gray-800 hover:text-lime-400 hover:border-lime-500 transition-all duration-300"
                                    onClick={() => setContentModal({show: false, content: null})}
                                    onTouchEnd={() => handleButtonTouch(() => setContentModal({show: false, content: null}))}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            </main>
        </>
    );
}