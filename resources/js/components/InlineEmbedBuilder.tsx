import React, { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { EMBED_ROW_HTML } from './EmbedRowModal';

export interface InlineEmbedBuilderProps {
    parentSlug?: string;
    conversationId?: string;
    onChildConvoCreated?: (html: string, contentType?: string) => Promise<any> | void;
    onCommentCreated?: (messages: any[]) => void;
    isEdit?: boolean;
    editId?: string | number;
    editSlug?: string;
    initialHtml?: string;
    onUpdate?: (html: string) => Promise<any> | void;
    className?: string;
    height?: string;
}

export const InlineEmbedBuilder: React.FC<InlineEmbedBuilderProps> = ({
    parentSlug,
    conversationId,
    onChildConvoCreated,
    onCommentCreated,
    isEdit = false,
    editId,
    editSlug,
    initialHtml,
    onUpdate,
    className = '',
    height = '820px',
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const postEditMode = useCallback(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                {
                    type: 'EZ_SET_EDIT_MODE',
                    isEdit: !!isEdit,
                    editId: editId || null,
                    editSlug: editSlug || null,
                    initialHtml: initialHtml || '',
                },
                '*'
            );
        }
    }, [isEdit, editId, editSlug, initialHtml]);

    useEffect(() => {
        const timer1 = setTimeout(postEditMode, 100);
        const timer2 = setTimeout(postEditMode, 300);
        const timer3 = setTimeout(postEditMode, 600);
        const timer4 = setTimeout(postEditMode, 1200);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [postEditMode]);

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            // Guard: ensure message originates strictly from this inline builder iframe if
            if (!iframeRef.current || !iframeRef.current.contentWindow) return;
            if (event.source !== iframeRef.current.contentWindow) return;

            if (event.data && event.data.type === 'EZ_BUILDER_READY') {
                postEditMode();
                return;
            }

            if (event.data && event.data.type === 'EZ_CREATE_CONVO_HTML' && event.data.html) {
                const generatedHtml = event.data.html;

                // 1. Editing path — update existing message
                if (isEdit || onUpdate || event.data.isEdit) {
                    if (onUpdate) {
                        try {
                            await onUpdate(generatedHtml);
                            return;
                        } catch (err) {
                            console.error('Failed in onUpdate:', err);
                        }
                    }

                    const targetId =
                        editId ||
                        event.data.editId ||
                        editSlug ||
                        event.data.editSlug ||
                        parentSlug;

                    if (targetId) {
                        try {
                            const response = await axios.patch(
                                `/ai/message/${targetId}/update-content`,
                                {
                                    content: generatedHtml,
                                    content_type: 'embed',
                                }
                            );

                            if (response.data && response.data.success) {
                                window.dispatchEvent(
                                    new CustomEvent('ez:conversation-updated', {
                                        detail: response.data,
                                    })
                                );
                                return;
                            }
                        } catch (err) {
                            console.error('Failed to update embed message:', err);
                        }
                    }
                    return;
                }

                // 2. Callback path — parent controls what to do
                if (onChildConvoCreated) {
                    try {
                        await onChildConvoCreated(generatedHtml, 'embed');
                        return;
                    } catch (err) {
                        console.error('Failed in onChildConvoCreated:', err);
                    }
                }

                // 3. Fallback — post to /content/comment
                try {
                    const payload: {
                        content: string;
                        content_type: string;
                        parent_slug?: string | null;
                        conversation_id?: string | null;
                    } = {
                        content: generatedHtml,
                        content_type: 'embed',
                        parent_slug: null,
                        conversation_id: conversationId || null,
                    };

                    const response = await axios.post('/content/comment', payload, {
                        headers: {
                            Accept: 'application/json',
                            'X-CSRF-TOKEN':
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute('content') || '',
                        },
                    });

                    if (response.data && response.data.success) {
                        if (onCommentCreated && response.data.conversation_messages) {
                            onCommentCreated(response.data.conversation_messages);
                            return;
                        }

                        if (parentSlug || conversationId) {
                            window.dispatchEvent(
                                new CustomEvent('ez:conversation-updated', {
                                    detail: response.data,
                                })
                            );
                            return;
                        }

                        if (response.data.slug) {
                            window.location.href =
                                '/X/' + encodeURIComponent(response.data.slug);
                        } else if (response.data.conversation_id) {
                            window.location.href =
                                '/X/' + encodeURIComponent(response.data.conversation_id);
                        }
                    }
                } catch (err) {
                    console.error('Failed to create conversation from message:', err);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [
        parentSlug,
        conversationId,
        onChildConvoCreated,
        onCommentCreated,
        isEdit,
        editId,
        editSlug,
        onUpdate,
        postEditMode,
    ]);

    return (
        <div
            className={`inline-embed-builder ${className}`}
            style={{ width: '100%', height, minHeight: '600px' }}
        >
            <iframe
                ref={iframeRef}
                srcDoc={EMBED_ROW_HTML}
                title="Embed Row & Masonry Builder"
                className="w-full h-full border-0 block rounded-xl"
                style={{ backgroundColor: '#f3f4f1' }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                allowFullScreen={true}
                onLoad={postEditMode}
            />
        </div>
    );
};

export default InlineEmbedBuilder;