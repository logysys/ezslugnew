import { Head, Link } from '@inertiajs/react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

export default function ConversationDetail({ conversation }: { conversation: any }) {
    const markdownStyles = {
        backgroundColor: 'transparent',
        color: '#1f2937',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        lineHeight: '1.6',
    };

    return (
        <>
            <Head title={conversation.conversation_title} />
            
            <Tooltip 
                id="conversation-tooltip"
                place="top"
                className="!bg-gray-900 !text-white !text-xs !px-3 !py-2 !rounded-lg !z-[100] !shadow-xl"
                effect="solid"
            />
            
            <div className="flex min-h-screen flex-col bg-[#FCFCFC]">
                <div className="flex-1 w-full flex">
                    <aside className="w-20 border-r border-gray-100 flex flex-col items-center py-6 bg-white fixed h-screen">
                        <Link 
                            href="/" 
                            className="text-[#22c55e] mb-8"
                            data-tooltip-id="conversation-tooltip"
                            data-tooltip-content="Go to home page"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                            </svg>
                        </Link>
                        
                        <Link 
                            href="/ai/history" 
                            className="flex flex-col items-center group"
                            data-tooltip-id="conversation-tooltip"
                            data-tooltip-content="Back to conversation history"
                        >
                            <div className="p-2 bg-[#22c55e]/10 rounded-full">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                            </div>
                            <span className="text-[10px] mt-1 text-[#22c55e] font-medium">Back</span>
                        </Link>
                    </aside>

                    <main className="flex-1 ml-20 max-w-4xl mx-auto px-4 py-8">
                        <div className="mb-6">
                            <Link
                                href="/ai/history"
                                className="inline-flex items-center text-sm text-gray-600 hover:text-[#22c55e]"
                                data-tooltip-id="conversation-tooltip"
                                data-tooltip-content="Return to history list"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                                    <path d="m15 18-6-6 6-6"/>
                                </svg>
                                Back to History
                            </Link>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="mb-6 pb-4 border-b border-gray-200">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    {conversation.conversation_title}
                                </h1>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span 
                                        data-tooltip-id="conversation-tooltip"
                                        data-tooltip-content="When this conversation started"
                                    >
                                        {conversation.created_at_formatted}
                                    </span>
                                    <span>•</span>
                                    <span 
                                        data-tooltip-id="conversation-tooltip"
                                        data-tooltip-content={`Total messages in this conversation: ${conversation.message_count}`}
                                    >
                                        {conversation.message_count} messages
                                    </span>
                                    <span>•</span>
                                    <span 
                                        data-tooltip-id="conversation-tooltip"
                                        data-tooltip-content={`Total tokens used: ${conversation.total_tokens}`}
                                    >
                                        Total tokens: {conversation.total_tokens}
                                    </span>
                                    <span>•</span>
                                    <span 
                                        data-tooltip-id="conversation-tooltip"
                                        data-tooltip-content={`Total cost of this conversation: $${conversation.total_cost}`}
                                    >
                                        Cost: ${conversation.total_cost}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {conversation.messages.map((message: any) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.message_role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] ${message.message_role === 'user' ? 'text-right' : 'text-left'}`}>
                                            {message.message_role === 'user' ? (
                                                <div 
                                                    className="bg-[#22c55e] text-white rounded-2xl px-4 py-3"
                                                    data-tooltip-id="conversation-tooltip"
                                                    data-tooltip-content="Your question"
                                                >
                                                    <p className="font-medium">{message.query}</p>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="bg-gray-100 rounded-2xl px-4 py-3"
                                                    data-tooltip-id="conversation-tooltip"
                                                    data-tooltip-content="AI response"
                                                >
                                                    <MarkdownPreview
                                                        source={message.response}
                                                        style={markdownStyles}
                                                    />
                                                </div>
                                            )}
                                            <div className={`text-xs text-gray-500 mt-1 ${message.message_role === 'user' ? 'text-right' : 'text-left'}`}>
                                                <span
                                                    data-tooltip-id="conversation-tooltip"
                                                    data-tooltip-content={`Sent at ${message.created_at_formatted}`}
                                                >
                                                    {message.created_at_formatted}
                                                </span>
                                                {message.thinking_enabled && (
                                                    <span 
                                                        className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[10px]"
                                                        data-tooltip-id="conversation-tooltip"
                                                        data-tooltip-content="This response used thinking mode for enhanced reasoning"
                                                    >
                                                        Thinking mode
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Conversation Stats Footer */}
                            <div className="mt-8 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center space-x-4">
                                        <span 
                                            className="flex items-center space-x-1"
                                            data-tooltip-id="conversation-tooltip"
                                            data-tooltip-content="Total messages in this conversation"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                            </svg>
                                            <span>{conversation.message_count} messages</span>
                                        </span>
                                        
                                        <span 
                                            className="flex items-center space-x-1"
                                            data-tooltip-id="conversation-tooltip"
                                            data-tooltip-content="Total tokens used across all messages"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M2 12h5l2-4 3 8 3-8 2 4h5"/>
                                            </svg>
                                            <span>{conversation.total_tokens} tokens</span>
                                        </span>
                                        
                                        <span 
                                            className="flex items-center space-x-1"
                                            data-tooltip-id="conversation-tooltip"
                                            data-tooltip-content="Total cost of this conversation"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                            </svg>
                                            <span>${conversation.total_cost}</span>
                                        </span>
                                    </div>
                                    
                                    <Link
                                        href="/ai/history"
                                        className="text-[#22c55e] hover:text-[#16a34a] transition-colors"
                                        data-tooltip-id="conversation-tooltip"
                                        data-tooltip-content="View all conversations"
                                    >
                                        View History →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}