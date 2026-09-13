import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileInvoice,
    faCoins,
    faPrint,
    faCheckCircle,
    faTimesCircle,
    faSpinner,
    faGift,
    faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';

interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: string | number;
    amount: string | number;
}

interface IncentiveData {
    incentive_history_id: number;
    incentive_id: number;
    user_id: number;
    amount: number;
    incentive_type: string;
    description: string;
    status: string;
    reference_type: string | null;
    reference_id: number | null;
    distributed_at: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface InvoiceData {
    id: number;
    invoice_number: string;
    user_id: number;
    incentive_id: number;
    issue_date: string;
    due_date: string;
    amount: string;
    status: string;
    items: InvoiceItem[];
    notes?: string;
    created_at: string;
    updated_at: string;
}

export default function InvoiceIncentive() {
    const { props } = usePage<SharedData>();
    const { auth, template, invoice, incentive } = props as {
        auth: any;
        template: any;
        invoice: InvoiceData;
        incentive: IncentiveData;
    };

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
        if (template?.image && isImageExtension(getImageExtension(template.image))) {
            return (
                <style>{`
                    .blur-bg {
                        background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                        background-size: cover;
                    }
                `}</style>
            );
        }
        return null;
    }, [template, getImageExtension, isImageExtension]);

    const renderTemplateContent = useMemo(() => {
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
                        key={`image-${template.image}`}
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
                    key={`doc-${template.image}`}
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
                        key={`iframe-${template.image}`}
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
                            key={`youtube-1-${youtubeMatch[1]}`}
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
                        key={`youtube-2-${youtubeMatch[1]}`}
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
                        key={`linkedin-${linkedinUrl}`}
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
                        key={`vimeo-${vimeoMatch[3]}`}
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
                        key={`fb-${template.image}`}
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
                    key={`video-bg-${template.image}`}
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
                    key={`video-main-${template.image}`}
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
                        key={`model-${template.image}`}
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
                        key={`iframe-url-${template.image}`}
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
                key={`html-${template.image}`}
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
    }, [template, isValidUrl]);

    if (!invoice || !incentive) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Invoice Not Found</h1>
                    <Link
                        href="/incentivehistory"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        Back to Incentive History
                    </Link>
                </div>
            </div>
        );
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Incentive Invoice ${invoice.invoice_number}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
                        .invoice-header { background: #6b46c1; color: #fff; padding: 20px; }
                        .invoice-body { padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #f5f5f5; }
                        .total-row { font-weight: bold; }
                        .status { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 14px; }
                        .paid { background: #d4edda; color: #155724; }
                        .pending { background: #fff3cd; color: #856404; }
                        .incentive-details { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="invoice-header">
                        <h1>Incentive Invoice #${invoice.invoice_number}</h1>
                        <p>Issued: ${invoice.issue_date} | Due: ${invoice.due_date}</p>
                        <span class="status ${invoice.status === 'paid' ? 'paid' : 'pending'}">
                            ${invoice.status.toUpperCase()}
                        </span>
                    </div>
                    <div class="invoice-body">
                        <div class="incentive-details">
                            <h2>Incentive Information</h2>
                            <p><strong>Type:</strong> ${incentive.incentive_type}</p>
                            <p><strong>Description:</strong> ${incentive.description}</p>
                            <p><strong>Distributed:</strong> ${new Date(incentive.distributed_at).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> ${incentive.status}</p>
                        </div>

                        <h2>Bee Points Earned</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td>${item.quantity.toLocaleString()}</td>
                                        <td>EZ$${item.unit_price}</td>
                                        <td>EZ$${item.amount}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="3" style="text-align: right;">Total</td>
                                    <td>EZ$${invoice.amount}</td>
                                </tr>
                            </tfoot>
                        </table>

                        ${invoice.notes ? `
                            <h2>Notes</h2>
                            <p>${invoice.notes}</p>
                        ` : ''}
                    </div>
                    <script>window.print(); window.close();</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            window.print();
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'distributed':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
            case 'failed':
                return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
            case 'pending':
                return <FontAwesomeIcon icon={faSpinner} className="text-yellow-500 animate-spin" />;
            default:
                return <FontAwesomeIcon icon={faSpinner} className="text-gray-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Head>
                <title>{`Incentive Invoice ${invoice.invoice_number} - Bee Points Reward`}</title>
                <meta name="description" content={`Incentive invoice for your Bee Points reward - ${invoice.invoice_number}`} />
                {blurStyle}
            </Head>

            <DraggableMenu auth={auth} />

            <main className={`relative min-h-screen p-4 md:p-8 ${
                template?.image && isImageExtension(getImageExtension(template.image)) ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {renderTemplateContent}
                </div>

                <div className="relative z-10">
                    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="p-6 md:p-8 bg-purple-700 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold flex items-center">
                                        <FontAwesomeIcon icon={faGift} className="mr-3" />
                                        Incentive Invoice #{invoice.invoice_number}
                                    </h1>
                                    <p className="text-purple-200 mt-2">
                                        Issued: {invoice.issue_date}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        invoice.status === 'paid'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {invoice.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="mb-8 bg-blue-50 p-6 rounded-lg">
                                <h2 className="text-lg font-medium text-blue-900 mb-4">Incentive Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-700 mb-2">Incentive Type</h3>
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faGift} className="text-purple-500 mr-2" />
                                            <span className="font-medium capitalize">
                                                {incentive.incentive_type}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-700 mb-2">Status</h3>
                                        <div className="flex items-center">
                                            {getStatusIcon(incentive.status)}
                                            <span className="ml-2 font-medium capitalize">
                                                {incentive.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-700 mb-2">Distributed Date</h3>
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 mr-2" />
                                            <span>
                                                {formatDate(incentive.distributed_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-700 mb-2">Reference</h3>
                                        <div className="text-sm">
                                            {incentive.reference_type || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-blue-700 mb-2">Description</h3>
                                    <p className="text-blue-900">{incentive.description}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Bee Points Earned</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {invoice.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-500 mr-2" />
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {item.description}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        EZ${item.amount}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan={1} className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                                    Total
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    EZ${invoice.amount}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {invoice.notes && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-medium text-gray-900 mb-2">Notes</h2>
                                    <p className="text-gray-600">{invoice.notes}</p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    <FontAwesomeIcon icon={faPrint} className="mr-2" />
                                    Print Invoice
                                </button>
                                <Link
                                    href="/incentivehistory"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    Back to Incentive History
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}