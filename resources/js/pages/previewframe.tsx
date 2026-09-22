import React from 'react';
import { Head } from '@inertiajs/react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';

export default function PreviewFrame({ frame }) {
    // Determine content type
    const isPDF = frame.image_url && frame.image_url.toLowerCase().endsWith('.pdf');
    const isImage = frame.image_url && !isPDF && 
        ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => 
            frame.image_url.toLowerCase().endsWith(ext)
        );

    // Format relative time function
    const formatRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    // Default background color
    const backgroundColor = '#FFFFFF'; // gray-800

    // Safe frame data access with fallbacks
    const frameId = frame?.id || 'Unknown';
    const frameCaption = frame?.caption || 'Frame';
    const frameUniqueId = frame?.unique_id || 'Unknown';
    const frameCreatedAt = frame?.created_at ? new Date(frame.created_at).toLocaleString() : 'Unknown';
    const frameEmojiMarker = frame?.emoji_marker || 'None';
    const frameApprove = frame?.approve || 'Unknown';
    const frameUpdatedAt = frame?.updated_at ? new Date(frame.updated_at).toLocaleString() : null;

    return (
        <>
            <Head>
                <title>{`Preview Frame - ${frameId}`}</title>
                <meta name="description" content={`Preview of frame content: ${frameCaption}`} />
            </Head>

            <div className="min-h-screen py-8">
                    {/* Frame Content */}
                    <div className="flex justify-center">
                        <div className="w-full">
                            
                                {frame?.pinned === 1 && (
                                    <div className="absolute top-2 left-2 z-50" data-tooltip-id="content-tooltip" data-tooltip-content="Pinned Content">
                                        📌
                                    </div>
                                )}
                                <div
                                    className="absolute top-2 right-2 z-50 cursor-pointer hidden touch-manipulation"
                                    data-tooltip-id="content-tooltip"
                                    data-tooltip-content="View content details"
                                >
                                    👁️
                                </div>

                                {/* User Info Section */}
                                {frame?.user && frame?.created_at && frame?.post_type === 'visitor' && (
                                    <div className="flex items-start space-x-3 mb-4 w-full max-w-full touch-manipulation">
                                        {/* Avatar Container */}
                                        <div className="relative flex-shrink-0">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full blur-sm opacity-60"></div>
                                            <img 
                                                className="relative w-8 h-8 rounded-full object-cover border border-gray-600 shadow-sm" 
                                                src={frame.user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(frame.user.name || frame.user.email || 'User')}&color=FFFFFF&background=0D9488&bold=true`} 
                                                alt={frame.user.email || 'User Avatar'} 
                                            />
                                        </div>
                                        
                                        {/* User Info */}
                                        <div className="flex flex-col flex-1 min-w-0 space-y-1">
                                            {/* Name and Verification */}
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-white text-sm truncate">
                                                    {frame.user.email ? (
                                                        <>
                                                            {frame.user.email.substring(0, 2)}
                                                            {'*'.repeat(3)}
                                                            {'@'}
                                                            {'*'.repeat(3)}
                                                            {frame.user.email.split('@')[1]?.substring(frame.user.email.split('@')[1].length - 3)}
                                                        </>
                                                    ) : (
                                                        'Anonymous User'
                                                    )}
                                                </span>
                                                {frame.user.is_verified && (
                                                    <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-blue-500/20 rounded-full border border-blue-500/30">
                                                        <FontAwesomeIcon 
                                                            icon={faCheckCircle} 
                                                            className="w-2.5 h-2.5 text-blue-400" 
                                                            aria-label="Verified account"
                                                        />
                                                        <span className="text-xs text-blue-300 font-medium">Verified</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Timestamp */}
                                            <div className="flex items-center space-x-1 text-xs">
                                                <div className="flex items-center space-x-1 text-gray-400 bg-gray-800/30 px-2 py-1 rounded-full">
                                                    <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5 text-teal-400" />
                                                    <span className="text-gray-300 font-medium">{formatRelativeTime(frame.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Content Sections */}
                                {frame?.caption && (
                                    <MarkdownPreview 
                                        source={frame.caption} 
                                        data-color-mode="dark" 
                                        className="w-full touch-manipulation overflow-hidden text-white mb-4" 
                                    />
                                )}

                                {frame?.reference && (
                                    <MarkdownPreview 
                                        source={frame.reference} 
                                        data-color-mode="dark" 
                                        className="w-full touch-manipulation overflow-hidden text-white mb-4" 
                                    />
                                )}

                                {frame?.url && (
                                    <MarkdownPreview 
                                        source={frame.url} 
                                        data-color-mode="dark" 
                                        className="w-full touch-manipulation overflow-hidden text-white mb-4" 
                                        style={{ background: 'transparent' }}
                                    />
                                )}

                                {/* Handle PDF files */}
                                {isPDF && (
                                    <div className="w-full h-full min-h-[400px]">
                                        <iframe
                                            src={`/${frame.image_url}`}
                                            className="w-full h-full rounded-lg"
                                            frameBorder="0"
                                            title="PDF Preview"
                                        >
                                            <p>Your browser does not support PDFs. 
                                                <a href={`/${frame.image_url}`} target="_blank" rel="noopener noreferrer">Download the PDF</a>.
                                            </p>
                                        </iframe>
                                    </div>
                                )}

                                {/* Handle image files */}
                                {isImage && (
                                    <MarkdownPreview 
                                        source={`<img src="/${frame.image_url}" style="width: 100%; border-radius: 0.5rem;" alt="Content Image" />`} 
                                        data-color-mode="dark" 
                                        className="w-full touch-manipulation overflow-hidden" 
                                    />
                                )}

                                {frame?.link_url && (
                                    <MarkdownPreview 
                                        source={`[${frame.link_url}](${frame.link_url})`} 
                                        data-color-mode="dark" 
                                        className="w-full touch-manipulation overflow-hidden text-lime-300" 
                                    />
                                )}

                                {/* Empty state */}
                                {!frame?.caption && !frame?.reference && !frame?.url && !frame?.image_url && !frame?.link_url && (
                                    <div className="text-center text-gray-400 py-8">
                                        <p>No content available in this frame.</p>
                                    </div>
                                )}
                            </div>                            
                </div>
            </div>
        </>
    );
}