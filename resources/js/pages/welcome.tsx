import AppLogoIcon from '@/components/app-logo-icon';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useMemo } from 'react';
import '@google/model-viewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Draggable from 'react-draggable';
import { 
    faHome, 
    faLayerGroup,
    faCloudDownloadAlt,
    faHandPointer,
    faGlobe,
    faSignInAlt, 
    faUserPlus,
    faSignOutAlt,
    faPalette,
    faSearch,
    faImage,
    faHashtag,
    faChevronLeft,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

export default function Welcome() {
    const { auth, template, allTemplates } = usePage<SharedData>().props;
    const dragRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (template?.image.includes('facebook.com') || template?.image.includes('fb.watch')) {
            const script = document.createElement('script');
            script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, [template]);

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const getImageExtension = (url: string) => {
        const cleanUrl = url.split('?')[0];
        return cleanUrl.split('.').pop()?.toLowerCase();
    };

    const isImageExtension = (extension?: string) => {
        if (!extension) return false;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        return imageExtensions.includes(extension);
    };

    const blurStyle = template?.image && isImageExtension(getImageExtension(template.image)) ? (
        <style>{`
            .blur-bg {
                background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                background-size: cover;
            }
        `}</style>
    ) : null;

    const renderTemplateContent = (currentTemplate = template) => {
        if (!currentTemplate) return null;

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
                        className="absolute inset-0 max-w-full max-h-full m-auto z-0 rounded-lg"
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
                    className="fixed top-0 left-0 w-full h-full"
                    frameBorder="0"
                    loading="lazy"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin"
                    title="Document Viewer"
                    scrolling="yes"
                    key={`doc-${currentTemplate.id}`}
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
                        className="fixed top-0 left-0 w-full h-full object-cover"
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
                            className="w-full h-full object-cover"
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
                        className="fixed top-0 left-0 w-full h-full object-cover" 
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
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title="Embedded LinkedIn Post"
                        scrolling="yes"
                        key={`linkedin-${currentTemplate.id}`}
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
                        className="fixed top-0 left-0 w-full h-full object-cover" 
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
                        className="fixed top-0 left-0 w-full h-full object-cover z-[-3]"
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
                        className="absolute inset-0 max-w-full max-h-full m-auto" 
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
                        className="fixed top-0 left-0 w-full h-full"
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
                        className="fixed top-0 left-0 w-full h-full" 
                        frameBorder="0" 
                        allowFullScreen
                        scrolling="yes"
                        key={`generic-${currentTemplate.id}`}
                    />
                </>
            );
        }

        return (
            <iframe
                src={htmlUrl}
                className="fixed top-0 left-0 w-full h-full border-none"
                allow="microphone *; camera *; autoplay *; fullscreen *; display-capture *;"
                sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock 
                        allow-popups allow-popups-to-escape-sandbox allow-presentation 
                        allow-same-origin allow-scripts allow-top-navigation 
                        allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation"
                allowFullScreen
                loading="lazy"
                name="binauralMixerFrame"
                allowTransparency="true"
                scrolling="yes"
                key={`html-${currentTemplate.id}`}
            />
        );
    };

    const memoizedBackgroundContent = useMemo(() => {
        if (allTemplates && allTemplates.length > 1) {
            return (
                <>
                    <style>{`
                        .swiper-button-next::after,
                        .swiper-button-prev::after {
                            content: none;
                        }
                        .swiper-button-next,
                        .swiper-button-prev {
                            width: 40px;
                            height: 40px;
                            background: rgba(0, 0, 0, 0.7);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            transition: all 0.3s ease;
                        }
                        .swiper-button-next:hover,
                        .swiper-button-prev:hover {
                            background: rgba(0, 0, 0, 0.9);
                            transform: scale(1.1);
                        }
                    `}</style>
                    <Swiper
                        modules={[EffectFade, Navigation]}
                        effect="fade"
                        speed={1000}
                        loop={true}
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
                        <div className="swiper-button-prev !left-4 !text-white !w-10 !h-10 p-[5px] !flex !items-center !justify-center !bg-gray-800/70 !rounded-full" data-tooltip-id="nav-tooltip" data-tooltip-content="Previous">
                            <FontAwesomeIcon icon={faChevronLeft} className="!text-2xl" />
                        </div>
                        <div className="swiper-button-next !right-4 !text-white !w-10 !h-10 p-[5px] !flex !items-center !justify-center !bg-gray-800/70 !rounded-full" data-tooltip-id="nav-tooltip" data-tooltip-content="Next">
                            <FontAwesomeIcon icon={faChevronRight} className="!text-2xl" />
                        </div>
                    </Swiper>
                </>
            );
        }
        return renderTemplateContent(template);
    }, [allTemplates, template]);
    
    return (
        <>
            <Head>
                <title>Home</title>
                {blurStyle}
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                `}</style>
            </Head>
            <Tooltip id="nav-tooltip" />
            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image.split('.').pop()?.toLowerCase() && 
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {auth.user ? (
                        <DraggableMenu auth={auth} />   
                    ) : (
                        <Draggable 
                            nodeRef={dragRef}
                            bounds="parent"
                            cancel=".no-drag"
                            defaultPosition={{x: window.innerWidth - 320, y: 0}}
                        >
                            <div ref={dragRef} className="space-x-4 z-10 absolute mt-15 cursor-move touch-none" data-tooltip-id="nav-tooltip" data-tooltip-content="Drag to move">
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
                                    <Link href={route('login')} className="group no-drag" data-tooltip-id="nav-tooltip" data-tooltip-content="Sign in to your account">
                                        <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                            <FontAwesomeIcon icon={faSignInAlt} className="text-[#8EF587]" />
                                            <span className="hidden group-hover:inline">SIGN IN</span>
                                        </span>
                                    </Link>

                                    <Link href={route('register')} className="group no-drag" data-tooltip-id="nav-tooltip" data-tooltip-content="Create a new account">
                                        <span className="flex items-center gap-2 bg-[#235A72] text-[#8EF587] font-medium py-2 px-4 rounded-full transition-all duration-300 hover:bg-[#1C4A5E] cursor-pointer">
                                            <FontAwesomeIcon icon={faUserPlus} className="text-[#8EF587]" />
                                            <span className="hidden group-hover:inline">SIGN UP</span>
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </Draggable>
                    )}
                    {memoizedBackgroundContent}
                </div>
            </main>
        </>
    );
}