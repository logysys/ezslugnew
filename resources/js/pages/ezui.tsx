import AppLogoIcon from '@/components/app-logo-icon';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import '@google/model-viewer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import Draggable from 'react-draggable';
import { 
    faDownload, 
    faSignInAlt, 
    faUserPlus, 
    faLayerGroup,
    faCloudDownloadAlt,
    faHandPointer,
    faHome, 
    faTrashAlt, 
    faPlusCircle, 
    faColumns, 
    faGlobeAmericas,
    faGlobe,
    faSignOutAlt,
    faPlay,
    faMapPin,
    faInfoCircle,
    faSave,
    faTimes,
    faEdit,
    faCreditCard,
    faPalette,
    faSearch,
    faImage,
    faHashtag
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

export default function EzUI() {
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const pageProps = usePage<SharedData>().props;
    const dragRef = useRef<HTMLDivElement>(null);
    const { auth, template, initialFunnels } = usePage<SharedData>().props;
    const [selectedTemplatePrice, setSelectedTemplatePrice] = useState(0);
    const [funnels, setFunnels] = useState<Array<{
        id: number;
        token: string;
        created_at: string;
        fly_sign: boolean;
        eye_tracking: boolean;
        theme: string;
        mode: string;
        custom_domains?: Array<{
            id: number;
            domain: string;
            domainselected: string;
        }>;
        handle_domains?: Array<{
            id: number;
            domain: string;
            domainselected: string;
        }>;
        fields: Array<{
            emoji_marker: string;
            url: string;
        }>;
    }>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy' | 'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedFunnel, setSelectedFunnel] = useState<null | {
        id: number;
        token: string;
        theme?: string;
        mode?: string;
        effect_settings?: Array<{
            id: number;
            moving_effect: string;
            moving_pattern: string;
            brand_message: string;
            avatar_link: string;
            landing_page: string;
        }>;
    }>(null);
    const [templates, setTemplates] = useState<{
        userTemplates: Array<{id: number, title: string, unique_id: string, price?: number}>;
        defaultTemplates: Array<{id: number, title: string, unique_id: string}>;
        paidTemplates?: Array<{id: number, title: string, unique_id: string, price: number, user_id: number}>;
    }>({ userTemplates: [], defaultTemplates: [], paidTemplates: [] });
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [formData, setFormData] = useState({
        flySign: false,
        eyeTracking: false
    });

    const [effectSettingsList, setEffectSettingsList] = useState([
        {
            id: 1,
            movingEffect: "bee",
            movingPattern: "none",
            brandMessage: "",
            avatarLink: "",
            landingPage: "",
            flySignOption1: "Hide",
            flySignOption2: "Hide"
        }
    ]);

    const [themeSettings, setThemeSettings] = useState({
        mode: "Select Mode",
        theme: [] as string[],
        freestyleMode: ""
    });

    // Theme management functions
    const toggleThemeSelection = (themeId: string) => {
        setThemeSettings(prev => {
            if (prev.theme.includes(themeId)) {
                return {
                    ...prev,
                    theme: prev.theme.filter(id => id !== themeId)
                };
            } else {
                return {
                    ...prev,
                    theme: [...prev.theme, themeId]
                };
            }
        });

        // Update price calculation when theme changes
        const templateId = parseInt(themeId, 10);
        let price = 0;
        
        const defaultTemplate = templates.defaultTemplates.find(t => t.id === templateId);
        if (defaultTemplate && defaultTemplate.price) {
            price = defaultTemplate.price;
        }
        
        const userTemplate = templates.userTemplates.find(t => t.id === templateId);
        if (userTemplate && userTemplate.price) {
            price = userTemplate.price;
        }
        
        if (templates.paidTemplates) {
            const paidTemplate = templates.paidTemplates.find(t => t.id === templateId);
            if (paidTemplate) {
                price = paidTemplate.price;
            }
        }
        
        setSelectedTemplatePrice(price);
    };

    const moveThemeUp = (index: number) => {
        if (index <= 0) return;
        setThemeSettings(prev => {
            const newThemes = [...prev.theme];
            [newThemes[index], newThemes[index - 1]] = [newThemes[index - 1], newThemes[index]];
            return {
                ...prev,
                theme: newThemes
            };
        });
    };

    const moveThemeDown = (index: number) => {
        setThemeSettings(prev => {
            if (index >= prev.theme.length - 1) return prev;
            const newThemes = [...prev.theme];
            [newThemes[index], newThemes[index + 1]] = [newThemes[index + 1], newThemes[index]];
            return {
                ...prev,
                theme: newThemes
            };
        });
    };

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    const addNewEffect = useCallback(() => {
        setEffectSettingsList(prev => [
            ...prev,
            {
                id: prev.length + 1,
                movingEffect: "bee",
                movingPattern: "none",
                brandMessage: "",
                avatarLink: "",
                landingPage: "",
                flySignOption1: "Hide",
                flySignOption2: "Hide"
            }
        ]);
    }, []);

    const removeEffect = useCallback((id: number) => {
        if (effectSettingsList.length > 1) {
            setEffectSettingsList(prev => prev.filter(effect => effect.id !== id));
        }
    }, [effectSettingsList.length]);

    const handleEffectChange = useCallback((id: number, field: string, value: string) => {
        setEffectSettingsList(prev =>
            prev.map(effect =>
                effect.id === id ? { ...effect, [field]: value } : effect
            )
        );
    }, []);

    const handleThemeChange = useCallback((field: string, value: string) => {
        if (field === 'mode' || field === 'freestyleMode') {
            setThemeSettings(prev => ({
                ...prev,
                [field]: value
            }));
        }
    }, []);

    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoadingTemplates(true);
            try {
                const response = await axios.get('/paidtemplates');
                setTemplates(response.data);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setIsLoadingTemplates(false);
            }
        };

        if (auth.user) {
            fetchTemplates();
        }
    }, [auth.user]);

    useEffect(() => {
        if (initialFunnels) {
            setFunnels(initialFunnels.data);
            setHasMore(initialFunnels.next_page_url !== null);
        }
    }, [initialFunnels]);

    const handleSearch = useCallback(async () => {
        try {
            const response = await axios.get('/search-ez-funnels', {
                params: {
                    query: debouncedSearchQuery,
                    type: searchType,
                    page: 1
                }
            });
            
            setFunnels(response.data.data);
            setCurrentPage(1);
            setHasMore(response.data.next_page_url !== null);
        } catch (error) {
            console.error('Search error:', error);
            setErrorMessage('Failed to search funnels. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        }
    }, [debouncedSearchQuery, searchType]);

    useEffect(() => {
        if (debouncedSearchQuery) {
            handleSearch();
        }
    }, [debouncedSearchQuery, handleSearch]);

    const loadMore = useCallback(async () => {
        try {
            setIsSubmitting(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await axios.get('/search-ez-funnels', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: currentPage + 1,
                    with: 'customDomains,handleDomains'
                },
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data && response.data.data) {
                setFunnels(prevFunnels => [...prevFunnels, ...response.data.data]);
                setCurrentPage(currentPage + 1);
                setHasMore(response.data.next_page_url !== null);
            }
        } catch (error) {
            console.error('Load more error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to load more items. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    }, [searchQuery, searchType, currentPage]);

    const handleEditUI = useCallback(async (funnelId: number) => {
        try {
            setIsSubmitting(true);
            const response = await axios.get(`/edit-ez-funnel/${funnelId}`);
            const funnel = response.data;

            setSelectedFunnel(funnel);
            
            setFormData({
                flySign: funnel.fly_sign || false,
                eyeTracking: funnel.eye_tracking || false
            });

            setThemeSettings({
                mode: funnel.mode || "Select Mode",
                theme: funnel.theme ? funnel.theme.split(',') : [],
                freestyleMode: ''
            });

            if (funnel.effect_settings && funnel.effect_settings.length > 0) {
                setEffectSettingsList(funnel.effect_settings.map((effect, index) => ({
                    id: effect.id || index + 1,
                    movingEffect: effect.moving_effect,
                    movingPattern: effect.moving_pattern,
                    brandMessage: effect.brand_message,
                    avatarLink: effect.avatar_link,
                    landingPage: effect.landing_page,
                    flySignOption1: "Hide",
                    flySignOption2: "Hide"
                })));
            } else {
                setEffectSettingsList([{
                    id: 1,
                    movingEffect: "bee",
                    movingPattern: "none",
                    brandMessage: "",
                    avatarLink: "",
                    landingPage: "",
                    flySignOption1: "Hide",
                    flySignOption2: "Hide"
                }]);
            }
        } catch (error) {
            console.error('Error loading funnel data:', error);
            setErrorMessage('Failed to load funnel data. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        if (!selectedFunnel) return;

        try {
            const response = await axios.put('/update-eztheme-funnel', {
                id: selectedFunnel.id,
                flySign: formData.flySign,
                eyeTracking: formData.eyeTracking,
                effectSettings: effectSettingsList.length > 0 ? effectSettingsList.map(effect => ({
                    id: effect.id,
                    movingEffect: effect.movingEffect,
                    movingPattern: effect.movingPattern,
                    brandMessage: effect.brandMessage,
                    avatarLink: effect.avatarLink,
                    landingPage: effect.landingPage
                })) : null
            });

            setFunnels(prev => prev.map(f => 
                f.id === selectedFunnel.id ? { 
                    ...f, 
                    fly_sign: formData.flySign,
                    eye_tracking: formData.eyeTracking,
                    effect_settings: effectSettingsList.map(effect => ({
                        id: effect.id,
                        moving_effect: effect.movingEffect,
                        moving_pattern: effect.movingPattern,
                        brand_message: effect.brandMessage,
                        avatar_link: effect.avatarLink,
                        landing_page: effect.landingPage
                    }))
                } : f
            ));

            setSuccessMessage('Funnel updated successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error('Update error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to update funnel. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedFunnel, formData, effectSettingsList]);
    
    const handleClaimTheme = useCallback(async () => {
        if (!selectedFunnel) return;

        setIsSubmitting(true);
        
        try {
            const modeValue = themeSettings.freestyleMode === '' ? themeSettings.mode : themeSettings.freestyleMode;
            const response = await axios.put('/update-ez-funnel-theme', {
                id: selectedFunnel.id,
                theme: themeSettings.theme.join(','),
                mode: modeValue
            });

            setFunnels(prev => prev.map(f => 
                f.id === selectedFunnel.id ? { 
                    ...f, 
                    theme: themeSettings.theme.join(','),
                    mode: modeValue
                } : f
            ));

            setSuccessMessage('Theme claimed successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error('Claim theme error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to claim theme. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedFunnel, themeSettings]);

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

    const isValidUrl = useCallback((url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }, []);

    const getImageExtension = useCallback((url: string) => {
        const cleanUrl = url.split('?')[0];
        return cleanUrl.split('.').pop()?.toLowerCase();
    }, []);

    const isImageExtension = useCallback((extension?: string) => {
        if (!extension) return false;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        return imageExtensions.includes(extension);
    }, []);

    const blurStyle = useMemo(() => {
        if (!template?.image) return null;
        const extension = getImageExtension(template.image);
        return isImageExtension(extension) ? (
            <style>{`
                .blur-bg {
                    background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                    background-size: cover;
                }
            `}</style>
        ) : null;
    }, [template, getImageExtension, isImageExtension]);

    const renderTemplateContent = useCallback(() => {
        if (!template) return null;

        const extension = template.image.split('.').pop()?.toLowerCase() || '';
        const imgPath = template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        const fullImageUrl = `${imgPath}${template.image}`;

        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        const validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];

        const youtubeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
        const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^/]+:[^"&?/ ]+)/i;
        const vimeoRegex = /^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im;
        const fbWatchRegex = /^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/;
        const facebookRegex = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/;
        const iframeRegex = /<iframe.*?src=["'](.*?)["'].*?>.*?<\/iframe>/is;
        const blockquoteRegex = /<blockquote/;

        const youtubeMatch = template.image.match(youtubeRegex);
        const linkedinMatch = template.image.match(linkedinRegex);
        const vimeoMatch = template.image.match(vimeoRegex);
        const fbWatchMatch = template.image.match(fbWatchRegex);
        const facebookMatch = template.image.match(facebookRegex);
        const iframeMatch = template.image.match(iframeRegex) || blockquoteRegex.test(template.image);
        const htmlBlob = new Blob([template.image], { type: 'text/html' });
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
                    />
                </>
            );
        }

        if (validDocumentExtensions.includes(extension)) {
            return (
                <iframe
                    src={`https://docs.google.com/viewer?url=${fullImageUrl}&embedded=true`}
                    className="fixed top-0 left-0 w-full h-full"
                    frameBorder="0"
                    loading="lazy"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin"
                    title="Document Viewer"
                    scrolling="yes"
                />
            );
        }

        if (iframeMatch) {
            const processedHtml = template.image
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
                    />
                </>
            );
        }

        if (youtubeMatch) {
            const autoplayParam = template.option === 'autoplay' ? 'autoplay=1' : 
                                template.option === 'mute' ? 'autoplay=1&mute=1' : 'mute=1';
            
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
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${template.option}=1&mute=1&loop=1&playlist=${youtubeMatch[1]}`}
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                    />
                </>
            );
        }

        if (linkedinMatch) {
            let linkedinUrl = template.image;
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
                    />
                </>
            );
        }

        if (fbWatchMatch || (facebookMatch && !template.image.includes('groups'))) {
            return (
                <div className="fixed top-0 left-0 w-full h-full">
                    <div 
                        className="fb-post" 
                        data-href={template.image} 
                        data-width="1400" 
                        data-show-text="true"
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
                    />
                </>
            );
        }

        if (isValidUrl(template.image)) {
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
                        src={template.image} 
                        className="fixed top-0 left-0 w-full h-full" 
                        frameBorder="0" 
                        allowFullScreen
                        scrolling="yes"
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
            />
        );
    }, [template, getImageExtension, isValidUrl]);

    const templateContent = useMemo(() => renderTemplateContent(), [renderTemplateContent]);

    return (
        <>
            <Head>
                <title>EZ UI - Customize Your Funnel UI</title>
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
            <Tooltip id="ezui-tooltip" />
            <DraggableMenu auth={auth} /> 
            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image.split('.').pop()?.toLowerCase() && 
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {templateContent}
                </div>
                {isPanelVisible && (
                <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl">
                    <button 
                        onClick={() => setIsPanelVisible(false)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center z-50 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Close panel"
                        data-tooltip-id="ezui-tooltip"
                        data-tooltip-content="Close this panel"
                    >
                        <FontAwesomeIcon 
                            icon={faTimes} 
                            className="text-white text-lg" 
                            style={{ textShadow: '0.7px 0.7px 0 rgb(255,0,0), -0.7px -0.7px 0 rgb(0,255,255)' }}
                        />
                    </button>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left side - Search results */}
                        <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <input 
                                    type="text" 
                                    placeholder="Search by token" 
                                    className="flex-grow bg-white text-gray-900 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    data-tooltip-id="ezui-tooltip"
                                    data-tooltip-content="Search for a funnel by its token"
                                />
                                
                                <div className="flex items-center">
                                    <button 
                                        className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-l-md border-r transition-colors ${
                                            searchType === 'fuzzy' 
                                                ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' 
                                                : 'bg-gray-600 text-gray-300 border-gray-700 hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                            setSearchType('fuzzy');
                                            handleSearch();
                                        }}
                                        data-tooltip-id="ezui-tooltip"
                                        data-tooltip-content="Fuzzy search: finds partial matches"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Fuzzy
                                    </button>
                                    <button 
                                        className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-r-md transition-colors ${
                                            searchType === 'exact' 
                                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                                : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                                        }`}
                                        onClick={() => {
                                            setSearchType('exact');
                                            handleSearch();
                                        }}
                                        data-tooltip-id="ezui-tooltip"
                                        data-tooltip-content="Exact search: finds only exact token matches"
                                    >
                                        <span className="text-sm">🏀</span>
                                        Exact
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar space-y-2">
                                {funnels.map((funnel) => (
                                    <div key={funnel.id} className="flex items-center p-4 gap-1 bg-[#5d0f6e] rounded-lg">
                                        <span className="text-4xl select-none">
                                            🍀
                                        </span>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-col gap-y-2">
                                                {/* Default URL */}
                                                <a 
                                                    href={`https://ez.wiki/${encodeURIComponent(funnel.token)}`} 
                                                    target="_blank" 
                                                    className="text-yellow-400 font-semibold truncate"
                                                    rel="noopener noreferrer"
                                                    data-tooltip-id="ezui-tooltip"
                                                    data-tooltip-content="Open this URL in a new tab"
                                                >
                                                    https://ez.wiki/{funnel.token}
                                                </a>
                                                {/* Sub domains */}
                                                {funnel.handle_domains?.map((domain) => (
                                                    <a 
                                                        key={domain.id}
                                                        href={`https://${domain.domain}.${domain.domainselected}`} 
                                                        target="_blank" 
                                                        className="text-yellow-400 font-semibold truncate"
                                                        rel="noopener noreferrer"
                                                        data-tooltip-id="ezui-tooltip"
                                                        data-tooltip-content="Open this URL in a new tab"
                                                    >
                                                        https://{domain.domain}.{domain.domainselected}
                                                    </a>
                                                ))}
                                                {/* Custom domains */}
                                                {funnel.custom_domains?.map((domain) => (
                                                    <a 
                                                        key={domain.id}
                                                        href={`https://${domain.domainselected}/${domain.domain}`} 
                                                        target="_blank" 
                                                        className="text-yellow-400 font-semibold truncate"
                                                        rel="noopener noreferrer"
                                                        data-tooltip-id="ezui-tooltip"
                                                        data-tooltip-content="Open this URL in a new tab"
                                                    >
                                                        https://{domain.domainselected}/{domain.domain}
                                                    </a>
                                                ))}
                                                
                                                <p className="text-purple-300 text-sm whitespace-nowrap">
                                                    {formatDate(funnel.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            className="bg-yellow-400 text-black font-bold py-1 px-5 rounded-md text-sm hover:bg-yellow-500 transition-colors whitespace-nowrap"
                                            onClick={() => handleEditUI(funnel.id)}
                                            data-tooltip-id="ezui-tooltip"
                                            data-tooltip-content="Customize the UI and theme for this funnel"
                                        >
                                            Edit UI
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {hasMore && (
                                <div className="flex justify-center mt-4">
                                    <button 
                                        className="bg-black text-white border border-white px-8 py-2 rounded-md font-semibold hover:bg-white hover:text-black transition-colors"
                                        onClick={loadMore}
                                        disabled={isSubmitting}
                                        data-tooltip-id="ezui-tooltip"
                                        data-tooltip-content="Load more funnels"
                                    >
                                        {isSubmitting ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right side - Show either settings panel or placeholder */}
                        {selectedFunnel ? (
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                                {/* Success and Error Messages */}
                                {successMessage && (
                                    <div className="bg-green-500 text-white p-3 rounded-lg mb-4">
                                        {successMessage}
                                    </div>
                                )}
                                {errorMessage && (
                                    <div className="bg-red-500 text-white p-3 rounded-lg mb-4">
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <h2 className="text-yellow-400 text-xl font-bold">Editing: {selectedFunnel.token}</h2>
                                    <button 
                                        onClick={() => setSelectedFunnel(null)}
                                        className="text-gray-300 hover:text-white"
                                        data-tooltip-id="ezui-tooltip"
                                        data-tooltip-content="Close editor and return to list"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                <hr className="border-t border-gray-700" />

                                <form onSubmit={handleSubmit}>
                                    {/* Effect Section */}
                                    <div className="space-y-4">
                                        <h1 className="text-yellow-400 text-xl font-bold">Effect Settings</h1>
                                        <hr className="border-t border-gray-700" />

                                        <div className="space-y-4">
                                            {/* Render all effect sections */}
                                            {effectSettingsList.map((effect) => (
                                                <div key={effect.id} className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-yellow-400 text-sm font-semibold">Moving Effect</label>
                                                            <select 
                                                                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                                value={effect.movingEffect}
                                                                onChange={(e) => handleEffectChange(effect.id, 'movingEffect', e.target.value)}
                                                                data-tooltip-id="ezui-tooltip"
                                                                data-tooltip-content="Select the type of flying object"
                                                            >
                                                                <option value="none">External link</option>
                                                                <option selected="" value="bee">Flying Bee</option>
                                                                <option value="saucer">Flying Saucer</option>
                                                                <option value="bird">Flying Bird</option>
                                                                <option value="plane">Flying Plane</option>
                                                                <option value="superhero">Flying Superhero</option>
                                                                <option value="qr">Flying Qrcode</option>
                                                                <option value="real">Flying Real Estate</option>
                                                                <option value="coffee">Flying Coffee</option>
                                                                <option value="time">Flying Time</option>
                                                                <option value="fire">Flying Camp Fire</option>
                                                                <option value="burger">Flying Burger</option>
                                                                <option value="ball">Flying Ball</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-yellow-400 text-sm font-semibold">Moving Pattern</label>
                                                            <select 
                                                                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                                value={effect.movingPattern}
                                                                onChange={(e) => handleEffectChange(effect.id, 'movingPattern', e.target.value)}
                                                                data-tooltip-id="ezui-tooltip"
                                                                data-tooltip-content="Select the flight path for the object"
                                                            >
                                                                <option value="none">Hovering</option>
                                                                <option value="top">Top to Bottom</option>
                                                                <option value="bottom">Bottom to Top</option>
                                                                <option value="left">Left to Right</option>
                                                                <option value="right">Right to Left</option>
                                                                <option value="topright">TopLeft to Rightbottom</option>
                                                                <option value="bottomleft">Rightbottom to Topleft</option>
                                                                <option value="lefttop">Leftbottom to Righttop</option>
                                                                <option value="leftbottom">Righttop to Leftbottom</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-yellow-400 text-sm font-semibold">Fly Sign Message</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Enter your brand message" 
                                                            className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                            value={effect.brandMessage}
                                                            onChange={(e) => handleEffectChange(effect.id, 'brandMessage', e.target.value)}
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="Message displayed by the flying object"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-1">
                                                            <label className="text-yellow-400 text-sm font-semibold">Avatar Link</label>
                                                            <FontAwesomeIcon 
                                                                icon={faInfoCircle} 
                                                                className="text-yellow-400 hover:text-yellow-300 cursor-help transition-colors text-sm"
                                                                data-tooltip-id="ezui-tooltip"
                                                                data-tooltip-content="Link to your avatar image"
                                                            />
                                                        </div>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Enter avatar image URL" 
                                                            className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                            value={effect.avatarLink}
                                                            onChange={(e) => handleEffectChange(effect.id, 'avatarLink', e.target.value)}
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="URL for your avatar image"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-yellow-400 text-sm font-semibold">Landing Page</label>
                                                        <div className="relative">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Enter landing page URL" 
                                                                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm pl-10 pr-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                                value={effect.landingPage}
                                                                onChange={(e) => handleEffectChange(effect.id, 'landingPage', e.target.value)}
                                                                data-tooltip-id="ezui-tooltip"
                                                                data-tooltip-content="URL the user is sent to when clicking the object"
                                                            />
                                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                                                <FontAwesomeIcon icon={faGlobeAmericas} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {effectSettingsList.length > 1 && (
                                                        <button 
                                                            type="button"
                                                            className="w-full bg-red-500 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 font-medium hover:bg-red-600 transition-all duration-200"
                                                            onClick={() => removeEffect(effect.id)}
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="Delete this effect configuration"
                                                        >
                                                            <FontAwesomeIcon icon={faTrashAlt} className="text-lg" />
                                                            Remove this effect
                                                        </button>
                                                    )}

                                                    <hr className="border-t border-gray-700" />
                                                </div>
                                            ))}

                                            {/* Add more effect button */}
                                            <button 
                                                type="button"
                                                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 rounded-lg px-4 py-2 flex items-center justify-center gap-2 font-medium hover:shadow-lg hover:from-yellow-400 hover:to-yellow-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                onClick={addNewEffect}
                                                data-tooltip-id="ezui-tooltip"
                                                data-tooltip-content="Add another flying effect to the page"
                                            >
                                                <FontAwesomeIcon icon={faPlusCircle} className="text-lg" />
                                                Add more effect
                                            </button>

                                            {/* Fly-Sign and Eye Tracking Toggles */}
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                {/* Fly-Sign Toggle */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <label className="text-yellow-400 text-sm font-semibold text-center">Fly-Sign</label>
                                                        <FontAwesomeIcon 
                                                            icon={faInfoCircle} 
                                                            className="text-yellow-400 hover:text-yellow-300 cursor-help transition-colors text-xs"
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="Toggle the visibility of the flying signature"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <label htmlFor="flySignToggle" className="inline-flex items-center cursor-pointer" data-tooltip-id="ezui-tooltip" data-tooltip-content="Enable or disable the flying object">
                                                            <input
                                                                type="checkbox"
                                                                id="flySignToggle"
                                                                className="sr-only peer"
                                                                checked={formData.flySign}
                                                                onChange={() => setFormData(prev => ({
                                                                    ...prev,
                                                                    flySign: !prev.flySign
                                                                }))}
                                                            />
                                                            <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                                
                                                {/* Eye Tracking Toggle */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <label className="text-yellow-400 text-sm font-semibold text-center">Eye Tracking</label>
                                                        <FontAwesomeIcon 
                                                            icon={faInfoCircle} 
                                                            className="text-yellow-400 hover:text-yellow-300 cursor-help transition-colors text-xs"
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="Toggle eye tracking visualization"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <label htmlFor="eyeTrackingToggle" className="inline-flex items-center cursor-pointer" data-tooltip-id="ezui-tooltip" data-tooltip-content="Enable or disable the eye-tracking visualization">
                                                            <input
                                                                type="checkbox"
                                                                id="eyeTrackingToggle"
                                                                className="sr-only peer"
                                                                checked={formData.eyeTracking}
                                                                onChange={() => setFormData(prev => ({
                                                                    ...prev,
                                                                    eyeTracking: !prev.eyeTracking
                                                                }))}
                                                            />
                                                            <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center pt-2">
                                                <button 
                                                    type="submit"
                                                    className="bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-2 px-12 rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-200"
                                                    disabled={isSubmitting}
                                                    data-tooltip-id="ezui-tooltip"
                                                    data-tooltip-content="Save all effect settings and toggle states"
                                                >
                                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <hr className="border-t border-gray-700 mt-4 mb-4" />
                                    {/* EZTheme Setting Section */}
                                    <div className="space-y-4">
                                        <h2 className="text-yellow-400 text-xl font-bold">EZTheme Setting</h2>
                                        <hr className="border-t border-gray-700" />
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="space-y-2">
                                                        <label className="text-yellow-400 text-sm font-semibold">Select Mode:</label>
                                                        <select 
                                                            className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                            value={themeSettings.mode}
                                                            onChange={(e) => handleThemeChange('mode', e.target.value)}
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="Choose a pre-defined layout for your themes"
                                                        >
                                                            <option>Select Mode</option>
                                                            <option>L</option>
                                                            <option>L,R</option>
                                                            <option>L,L,C,R</option>
                                                        </select>
                                                    </div>

                                                    <div className="text-center pt-2">
                                                        <p className="text-yellow-400 font-bold text-lg">OR</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-yellow-400 text-sm font-semibold">Freestyle Mode:</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Enter freestyle mode (e.g., L,R)" 
                                                            className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                            value={themeSettings.freestyleMode}
                                                            onChange={(e) => handleThemeChange('freestyleMode', e.target.value)}
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="Manually define a custom layout (e.g., L,C,R)"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="space-y-2">
                                                        <label className="text-yellow-400 text-sm font-semibold">Select Themes:</label>
                                                        
                                                        {/* Selected themes with ordering controls */}
                                                        <div className="mb-3 space-y-2">
                                                            {themeSettings.theme.length > 0 ? (
                                                                themeSettings.theme.map((themeId, index) => {
                                                                    const theme = [
                                                                        ...(templates.defaultTemplates || []),
                                                                        ...(templates.userTemplates || []),
                                                                        ...(templates.paidTemplates || [])
                                                                    ].find(t => t.id.toString() === themeId);
                                                                    
                                                                    if (!theme) return null;
                                                                    
                                                                    return (
                                                                        <div key={`${themeId}-${index}`} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                                                                            <button 
                                                                                onClick={() => moveThemeUp(index)}
                                                                                disabled={index === 0}
                                                                                className="text-gray-400 hover:text-white disabled:opacity-30"
                                                                                data-tooltip-id="ezui-tooltip"
                                                                                data-tooltip-content="Move theme up"
                                                                            >
                                                                                ↑
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => moveThemeDown(index)}
                                                                                disabled={index === themeSettings.theme.length - 1}
                                                                                className="text-gray-400 hover:text-white disabled:opacity-30"
                                                                                data-tooltip-id="ezui-tooltip"
                                                                                data-tooltip-content="Move theme down"
                                                                            >
                                                                                ↓
                                                                            </button>
                                                                            <span className="flex-1 text-white">
                                                                                {theme.title} ({theme.unique_id})
                                                                                {templates.paidTemplates?.some(t => t.id.toString() === themeId) && ` - $${theme.price}`}
                                                                            </span>
                                                                            <button 
                                                                                onClick={() => toggleThemeSelection(themeId)}
                                                                                className="text-red-400 hover:text-red-300"
                                                                                data-tooltip-id="ezui-tooltip"
                                                                                data-tooltip-content="Remove this theme"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="text-gray-400 text-sm py-2 text-center">
                                                                    No theme selected
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Theme selection dropdown */}
                                                        <div className="relative">
                                                            <select
                                                                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                                onChange={(e) => {
                                                                    const themeId = e.target.value;
                                                                    if (themeId && !themeSettings.theme.includes(themeId)) {
                                                                        toggleThemeSelection(themeId);
                                                                    }
                                                                    e.target.value = ''; // Reset the select
                                                                }}
                                                                value=""
                                                                disabled={isLoadingTemplates}
                                                                data-tooltip-id="ezui-tooltip"
                                                                data-tooltip-content="Add a theme to your funnel's layout"
                                                            >
                                                                <option value="">Add a theme...</option>
                                                                {isLoadingTemplates ? (
                                                                    <option>Loading templates...</option>
                                                                ) : (
                                                                    <>
                                                                        {templates.defaultTemplates.length > 0 && (
                                                                            <optgroup label="Default Templates">
                                                                                {templates.defaultTemplates.map(template => (
                                                                                    <option 
                                                                                        key={template.id} 
                                                                                        value={template.id}
                                                                                        disabled={themeSettings.theme.includes(template.id.toString())}
                                                                                    >
                                                                                        {template.title} ({template.unique_id})
                                                                                    </option>
                                                                                ))}
                                                                            </optgroup>
                                                                        )}
                                                                        {templates.userTemplates.length > 0 && (
                                                                            <optgroup label="Your Templates">
                                                                                {templates.userTemplates.map(template => (
                                                                                    <option 
                                                                                        key={template.id} 
                                                                                        value={template.id}
                                                                                        disabled={themeSettings.theme.includes(template.id.toString())}
                                                                                    >
                                                                                        {template.title} ({template.unique_id})
                                                                                    </option>
                                                                                ))}
                                                                            </optgroup>
                                                                        )}
                                                                        {templates.paidTemplates && templates.paidTemplates.length > 0 && (
                                                                            <optgroup label="Paid Templates">
                                                                                {templates.paidTemplates.map(template => (
                                                                                    <option 
                                                                                        key={template.id} 
                                                                                        value={template.id}
                                                                                        disabled={themeSettings.theme.includes(template.id.toString())}
                                                                                    >
                                                                                        {template.title} ({template.unique_id}) - ${template.price}
                                                                                    </option>
                                                                                ))}
                                                                            </optgroup>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Section */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center space-x-2">
                                            <a 
                                                href={themeSettings.theme.length > 0 ? `https://ez.wiki/${templates.defaultTemplates.concat(templates.userTemplates, templates.paidTemplates || []).find(t => t.id === parseInt(themeSettings.theme[0]))?.unique_id || '#'}` : '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex px-4 py-2 text-sm bg-blue-500 font-bold text-white rounded hover:bg-blue-600 transition-colors items-center"
                                                data-tooltip-id="ezui-tooltip"
                                                data-tooltip-content="Preview the first selected theme"
                                            >
                                                <svg
                                                    className="w-4 h-4 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg> 
                                                Preview
                                            </a>
                                            <div className="flex-grow bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2" data-tooltip-id="ezui-tooltip" data-tooltip-content="Name Your Price in Bee Points for this theme">
                                                <FontAwesomeIcon icon={faCreditCard} />
                                                <span>NYP EZ$ : {selectedTemplatePrice}</span>
                                            </div>
                                        </div>

                                        <div className="text-center pt-2">
                                            <button 
                                                className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 w-2/3 mx-auto hover:from-yellow-400 hover:to-yellow-300 transition-all duration-200"
                                                onClick={handleClaimTheme}
                                                disabled={isSubmitting}
                                                data-tooltip-id="ezui-tooltip"
                                                data-tooltip-content="Apply the selected themes and layout to your funnel"
                                            >
                                                <FontAwesomeIcon icon={faDownload} />
                                                <span>{isSubmitting ? 'Claiming...' : 'Claim Theme'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            // Placeholder panel when no funnel is selected
                            <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6 flex flex-col items-center justify-center h-full">
                                <div className="text-center">
                                    <FontAwesomeIcon 
                                        icon={faHandPointer} 
                                        className="text-yellow-400 text-5xl mb-4 animate-bounce"
                                        data-tooltip-id="ezui-tooltip"
                                        data-tooltip-content="Select a funnel from the list on the left to begin editing."
                                    />
                                    <h2 className="text-yellow-400 text-xl font-bold mb-2">Select a Funnel to Edit</h2>
                                    <p className="text-gray-300">
                                        Click the "Edit UI" button on any funnel to customize its settings
                                    </p>
                                    <div className="mt-6">
                                        <div className="bg-gray-700/50 p-4 rounded-lg border border-dashed border-gray-600">
                                            <h3 className="text-yellow-400 font-semibold mb-2">Quick Tips:</h3>
                                            <ul className="text-gray-300 text-sm space-y-1 text-left">
                                                <li>• Customize flying effects and patterns</li>
                                                <li>• Set your brand message and avatar</li>
                                                <li>• Configure landing page destinations</li>
                                                <li>• Toggle Fly-Sign and Eye Tracking features</li>
                                                <li>• Select from multiple theme options</li>
                                            </ul>
                                        </div>
                                    </div>
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