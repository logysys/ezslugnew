import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    Network,
    FileText,
    Plus,
    Search,
    Sparkles,
    CheckSquare,
    AlertTriangle,
    Info,
    Folder,
    Tag,
    Eye,
    Columns,
    Edit3,
    Link2,
    ChevronDown,
    ChevronRight,
    Save,
    Share2,
    CheckCircle2,
    HelpCircle,
    Image as ImageIcon,
    Film,
    Music,
    Volume2,
    ExternalLink,
    Upload,
    Zap,
    Bot,
    Loader2,
    Sliders,
    X,
    Send,
    Trash2,
    Code,
    Copy,
    Check,
    Globe,
    ChevronUp
} from 'lucide-react';

// Import for markdown rendering
import MarkdownPreview from '@uiw/react-markdown-preview';

// Model interface matching the image
interface ModelOption {
    id: string;
    name: string;
    description: string;
    isNew?: boolean;
    provider: 'moonshot' | 'openai' | 'deepseek' | 'perplexity' | 'gemini';
    color: string;
}

// The 5 models from the image - simplified to show only name
const AI_MODELS: ModelOption[] = [
    {
        id: 'kimi-k3',
        name: 'Kiwi K3',
        description: '',
        isNew: true,
        provider: 'moonshot',
        color: 'from-green-500 to-emerald-600'
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: '',
        isNew: true,
        provider: 'openai',
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: '',
        isNew: true,
        provider: 'deepseek',
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'sonar-pro',
        name: 'Sonar Pro',
        description: '',
        isNew: true,
        provider: 'perplexity',
        color: 'from-purple-500 to-violet-600'
    },
    {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash Preview',
        description: '',
        isNew: true,
        provider: 'gemini',
        color: 'from-blue-400 to-cyan-500'
    }
];

export interface ObsidianNote {
    id: string;
    title: string;
    category: string;
    tags: string[];
    content: string;
}

interface ObsidianWikiPanelProps {
    canInteract?: boolean;
    setShowLoginPrompt?: (show: boolean) => void;
    customSlug?: string;
    parentSlug?: string;
    conversationId?: string | null;
    messageId?: number | string | null;
    initialNotes?: ObsidianNote[];
    initialQuery?: string;
    initialFileData?: any[];
    onSaveSuccess?: (data: any) => void;
}

// ObsidianCodeBlock Component
const ObsidianCodeBlock: React.FC<{ code: string; lang?: string; isDark?: boolean }> = ({ 
    code, 
    lang = 'text', 
    isDark = false 
}) => {
    const displayLang = (lang || 'CODE').toUpperCase();
    const cleanLang = (lang || '').toLowerCase().trim();
    const canPreview = ['html', 'svg', 'xml', 'htm'].includes(cleanLang);
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(canPreview);
    const lineCount = code.split('\n').length;

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderTokens = (rawCode: string) => {
        const lines = rawCode.split('\n');
        return lines.map((line, lineIdx) => {
            let tokens: React.ReactNode = line;

            if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
                tokens = <span className="text-slate-500 italic">{line}</span>;
            } else {
                const parts = line.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|var|function|return|if|else|for|while|import|export|from|class|async|await|try|catch|type|interface|enum|def|fn|pub|use|select|insert|update|delete|where|table|struct|public|private)\b|\b\d+\b)/g);

                tokens = parts.filter(Boolean).map((part, pIdx) => {
                    if (/^["'`].*["'`]$/.test(part)) {
                        return <span key={`str-${pIdx}`} className="text-emerald-400">{part}</span>;
                    }
                    if (/^(const|let|var|function|return|if|else|for|while|import|export|from|class|async|await|try|catch|type|interface|enum|def|fn|pub|use|select|insert|update|delete|where|table|struct|public|private)$/.test(part)) {
                        return <span key={`kw-${pIdx}`} className="text-purple-400 font-semibold">{part}</span>;
                    }
                    if (/^\d+$/.test(part)) {
                        return <span key={`num-${pIdx}`} className="text-amber-400">{part}</span>;
                    }
                    return <span key={`txt-${pIdx}`}>{part}</span>;
                });
            }

            return (
                <div key={lineIdx} className="table-row leading-snug">
                    <span className="table-cell pr-3 text-right text-slate-500 select-none text-[11px] font-mono opacity-50 w-8">
                        {lineIdx + 1}
                    </span>
                    <span className="table-cell font-mono text-xs text-slate-200 whitespace-pre">
                        {tokens}
                    </span>
                </div>
            );
        });
    };

    return (
        <div className={`my-3.5 rounded-xl border overflow-hidden shadow-md font-sans ${isDark ? 'border-[#282d3c] bg-[#11141c]' : 'border-slate-800 bg-[#1e2330]'}`}>
            <div className="px-3.5 py-2 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-xs text-slate-300 select-none">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                    <Code className="w-3.5 h-3.5 text-purple-400" />
                    <span className="px-2 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800/60 font-bold uppercase tracking-wider">
                        {displayLang}
                    </span>
                    <span className="text-slate-500">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                </div>

                <div className="flex items-center gap-2">
                    {canPreview && (
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                                showPreview
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'bg-[#252b38] hover:bg-[#2d3444] text-slate-300'
                            }`}
                        >
                            <Eye className="w-3 h-3" />
                            <span>{showPreview ? 'Code' : 'Live Preview'}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="px-2.5 py-1 rounded bg-[#252b38] hover:bg-[#2d3444] text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copy code block"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {canPreview && showPreview ? (
                <div className="p-3 bg-white text-slate-900 min-h-[120px] max-h-[400px] overflow-auto">
                    {cleanLang === 'svg' ? (
                        <div dangerouslySetInnerHTML={{ __html: code }} className="flex items-center justify-center p-4 max-w-full" />
                    ) : (
                        <iframe
                            srcDoc={code}
                            title="Embedded Live Code Preview"
                            className="w-full h-[250px] border-0 rounded bg-white"
                            sandbox="allow-scripts"
                        />
                    )}
                </div>
            ) : (
                <div className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px]">
                    <div className="table border-collapse w-full">
                        {renderTokens(code)}
                    </div>
                </div>
            )}
        </div>
    );
};

// ObsidianTranscludedNote Component
const ObsidianTranscludedNote: React.FC<{
    note: ObsidianNote;
    section?: string | null;
    onOpenNote: () => void;
    isDark?: boolean;
}> = ({ note, section, onOpenNote, isDark = false }) => {
    let displayContent = note.content || '';

    if (displayContent.trim().startsWith('---')) {
        const secondDash = displayContent.trim().indexOf('---', 3);
        if (secondDash !== -1) {
            displayContent = displayContent.trim().substring(secondDash + 3).trim();
        }
    }

    if (section) {
        const lines = displayContent.split('\n');
        const sectionLines: string[] = [];
        let capturing = false;

        for (const l of lines) {
            if (l.match(new RegExp(`^#{1,6}\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))) {
                capturing = true;
                sectionLines.push(l);
                continue;
            }
            if (capturing) {
                if (l.match(/^#{1,6}\s+/)) break;
                sectionLines.push(l);
            }
        }
        if (sectionLines.length > 0) {
            displayContent = sectionLines.join('\n');
        }
    }

    const linesArr = displayContent.split('\n');
    const previewLines = linesArr.slice(0, 12).join('\n');
    const isTruncated = linesArr.length > 12;

    return (
        <div className={`my-3.5 rounded-xl border-l-4 border-purple-500 overflow-hidden shadow-sm transition-all ${
            isDark ? 'bg-[#151821] border-y border-r border-[#262b38]' : 'bg-purple-50/60 border-y border-r border-purple-200'
        }`}>
            <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs ${
                isDark ? 'bg-[#1c202d] border-[#262b38] text-slate-300' : 'bg-purple-100/70 border-purple-200 text-purple-950'
            }`}>
                <div className="flex items-center gap-2 font-semibold">
                    <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>Embedded Note: <span className="font-bold">{note.title}</span></span>
                    {section && <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">#{section}</span>}
                    {note.category && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-200 text-[10px] font-mono font-bold uppercase tracking-wide">
                            {note.category}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onOpenNote}
                    className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                    <span>Open Note</span>
                    <ExternalLink className="w-3 h-3" />
                </button>
            </div>

            <div className="p-3.5 text-xs sm:text-sm space-y-1 font-sans">
                {previewLines.split('\n').map((line, idx) => (
                    <p key={idx} className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        {line}
                    </p>
                ))}
                {isTruncated && (
                    <div className="pt-2 text-center">
                        <button
                            type="button"
                            onClick={onOpenNote}
                            className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                        >
                            ... View full note in vault ({linesArr.length} lines)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Main Component
export default function ObsidianWikiPanel({
    canInteract = true,
    setShowLoginPrompt,
    customSlug = '',
    parentSlug = '',
    conversationId = null,
    messageId = null,
    initialNotes,
    initialQuery,
    initialFileData,
    onSaveSuccess
}: ObsidianWikiPanelProps) {
    // Model selection state
    const [selectedModel, setSelectedModel] = useState<ModelOption>(AI_MODELS[0]);

    // Notes state - EMPTY by default, no demo content
    const parsedInitialNotes = useMemo<ObsidianNote[]>(() => {
        // If we have real notes from props, use them
        if (initialNotes && initialNotes.length > 0) {
            return initialNotes;
        }

        if (Array.isArray(initialFileData) && initialFileData.length > 0) {
            return initialFileData.map((f: any, idx: number) => {
                let noteCategory = (f.category || '').toUpperCase();
                if (!noteCategory) {
                    const titleLower = (f.title || f.name || '').toLowerCase();
                    if (titleLower.includes('prompt') || titleLower.includes('coding')) {
                        noteCategory = 'PROMPTS';
                    } else if (titleLower.includes('agent') || titleLower.includes('project')) {
                        noteCategory = 'PROJECTS';
                    } else {
                        noteCategory = 'GENERAL';
                    }
                }

                let noteTags: string[] = [];
                if (Array.isArray(f.tags)) {
                    noteTags = f.tags.map((t: string) => String(t).trim());
                } else if (typeof f.tags === 'string' && f.tags.trim()) {
                    noteTags = f.tags.split(',').map((t: string) => String(t).trim());
                }
                if (noteTags.length === 0) {
                    noteTags = ['#obsidian', '#wiki'];
                } else {
                    noteTags = noteTags.map(t => t.startsWith('#') ? t : `#${t}`);
                }

                return {
                    id: f.id || `file-note-${idx + 1}`,
                    title: f.title || f.name?.replace(/\.md$/, '') || `Note ${idx + 1}`,
                    category: noteCategory,
                    tags: noteTags,
                    content: f.content || `# ${f.title || 'Untitled Note'}\n\nNote stored in vault.`,
                };
            });
        }

        if (initialQuery && initialQuery.includes('## ')) {
            const rawSections = initialQuery.split(/\n(?=##\s+)/g);
            const parsed: ObsidianNote[] = [];
            let counter = 1;

            rawSections.forEach((section) => {
                const lines = section.trim().split('\n');
                const titleLine = lines.find(l => l.startsWith('## ')) || lines.find(l => l.startsWith('# '));

                if (titleLine) {
                    const title = titleLine.replace(/^#+\s*/, '').trim();
                    const contentLines = lines.filter(l => !l.startsWith('## ') && !l.startsWith('# Obsidian Wiki Vault'));
                    const content = contentLines.join('\n').trim();

                    if (title && title.length > 0) {
                        parsed.push({
                            id: `parsed-note-${counter++}`,
                            title: title,
                            category: title.toLowerCase().includes('prompt') ? 'PROMPTS' : title.toLowerCase().includes('project') ? 'PROJECTS' : 'GENERAL',
                            tags: ['#obsidian', '#ezwiki'],
                            content: content || `# ${title}\n\nNote details.`
                        });
                    }
                }
            });

            if (parsed.length > 0) return parsed;
        }

        // Return EMPTY array - NO DEMO CONTENT
        return [];
    }, [initialNotes, initialFileData, initialQuery]);

    const [notes, setNotes] = useState<ObsidianNote[]>(parsedInitialNotes);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(() => parsedInitialNotes[0]?.id || null);
    const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview' | 'graph'>('split');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTag, setSelectedTag] = useState<string>('All');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'GETTING STARTED': true,
        'WIKI CONCEPTS': true,
        'PLANNING': true,
        'GENERAL': true
    });

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveMessage, setSaveMessage] = useState<string>('');
    const [saveError, setSaveError] = useState<string>('');

    // Ask AI Create Note States
    const [showAskAiModal, setShowAskAiModal] = useState<boolean>(false);
    const [askAiTopic, setAskAiTopic] = useState<string>('');
    const [askAiCategory, setAskAiCategory] = useState<string>('GENERAL');
    const [askAiInstructions, setAskAiInstructions] = useState<string>('');
    const [askAiCreateSubtopics, setAskAiCreateSubtopics] = useState<boolean>(true);
    const [isGeneratingNote, setIsGeneratingNote] = useState<boolean>(false);
    const [askAiError, setAskAiError] = useState<string>('');

    // AI Auto-Pilot States
    const [isAutoPiloting, setIsAutoPiloting] = useState<boolean>(false);
    const [autoPilotStatus, setAutoPilotStatus] = useState<string>('');
    const [autoPilotSummary, setAutoPilotSummary] = useState<string>('');
    const [autoPilotError, setAutoPilotError] = useState<string>('');
    const [customInstruction, setCustomInstruction] = useState<string>('');
    const [showCustomInstructionModal, setShowCustomInstructionModal] = useState<boolean>(false);
    const [selectedAutoPilotMode, setSelectedAutoPilotMode] = useState<string>('auto_pilot');
    const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
    const [latestAiUsage, setLatestAiUsage] = useState<any>(null);

    // File upload ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeNote = useMemo(() => {
        if (!activeNoteId || notes.length === 0) return null;
        return notes.find(n => n.id === activeNoteId) || notes[0] || null;
    }, [notes, activeNoteId]);

    // All available tags in the vault
    const availableTags = useMemo(() => {
        const tagsSet = new Set<string>(['All']);
        notes.forEach(note => {
            note.tags.forEach(t => tagsSet.add(t));
        });
        return Array.from(tagsSet);
    }, [notes]);

    // Filter notes by search query and tag
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            const matchesSearch =
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = selectedTag === 'All' || note.tags.includes(selectedTag);
            return matchesSearch && matchesTag;
        });
    }, [notes, searchQuery, selectedTag]);

    // Group notes by category
    const groupedNotes = useMemo(() => {
        const groups: Record<string, ObsidianNote[]> = {};
        filteredNotes.forEach(note => {
            const cat = note.category || 'GENERAL';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(note);
        });
        return groups;
    }, [filteredNotes]);

    // Backlinks calculation
    const backlinks = useMemo(() => {
        if (!activeNote) return [];
        return notes.filter(n => {
            if (n.id === activeNote.id) return false;
            return n.content.includes(`[[${activeNote.title}`) || n.content.includes(`[[${activeNote.title}|`);
        });
    }, [notes, activeNote]);

    // Helper to get model badge color
    const getModelBadgeColor = (provider: string): string => {
        switch(provider) {
            case 'moonshot': return 'bg-green-100 text-green-700 border-green-200';
            case 'openai': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'deepseek': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'perplexity': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'gemini': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Toggle category accordion
    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    // Update active note
    const updateActiveNote = (field: keyof ObsidianNote, value: any) => {
        if (!activeNote) return;
        setNotes(prev =>
            prev.map(n => (n.id === activeNote.id ? { ...n, [field]: value } : n))
        );
    };

    // Create a new note
    const handleCreateNewNote = () => {
        if (!canInteract && setShowLoginPrompt) {
            setShowLoginPrompt(true);
            return;
        }
        const newId = `note-${Date.now()}`;
        const newTitle = `New Note ${notes.length + 1}`;
        const newNote: ObsidianNote = {
            id: newId,
            title: newTitle,
            category: 'GENERAL',
            tags: ['#ezwiki', '#note'],
            content: `# ${newTitle}\n\n> [!NOTE] NOTE\n> Write your obsidian notes here using [[Wikilinks]]!`
        };
        setNotes(prev => [...prev, newNote]);
        setActiveNoteId(newId);
    };

    // Select note by title
    const selectNoteByTitle = (title: string) => {
        const found = notes.find(n => n.title.toLowerCase() === title.toLowerCase().trim());
        if (found) {
            setActiveNoteId(found.id);
        } else {
            const newId = `note-${Date.now()}`;
            const newNote: ObsidianNote = {
                id: newId,
                title: title.trim(),
                category: 'GENERAL',
                tags: ['#wikilink'],
                content: `# ${title.trim()}\n\n> [!NOTE] CREATED FROM WIKILINK\n> Link reference from [[${activeNote?.title || 'Vault'}]]`
            };
            setNotes(prev => [...prev, newNote]);
            setActiveNoteId(newId);
        }
    };

    // Helper to decode HTML data URLs
    const decodeHtmlDataUrl = (dataUrl: string): string | null => {
        if (!dataUrl || typeof dataUrl !== 'string') return null;
        if (dataUrl.startsWith('data:text/html')) {
            try {
                if (dataUrl.includes(';base64,')) {
                    const base64Str = dataUrl.split(';base64,')[1].trim();
                    try {
                        return decodeURIComponent(escape(atob(base64Str)));
                    } catch {
                        return atob(base64Str);
                    }
                }
                const commaIdx = dataUrl.indexOf(',');
                if (commaIdx !== -1) {
                    const raw = dataUrl.substring(commaIdx + 1);
                    try {
                        return decodeURIComponent(raw);
                    } catch {
                        return unescape(raw);
                    }
                }
            } catch (e) {
                console.error('Error decoding HTML data URL:', e);
            }
        }
        return null;
    };

    // Helper to detect media type from URL
    const getMediaType = (urlStr: string) => {
        if (!urlStr) return 'unknown';
        const cleanUrl = urlStr.toLowerCase().trim();

        if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || cleanUrl.includes('vimeo.com')) {
            return 'video_embed';
        }
        if (/\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i.test(cleanUrl) || cleanUrl.startsWith('data:video/')) {
            return 'video';
        }
        if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(cleanUrl) || cleanUrl.startsWith('data:audio/')) {
            return 'audio';
        }
        if (/\.pdf(\?.*)?$/i.test(cleanUrl) || cleanUrl.startsWith('data:application/pdf')) {
            return 'pdf';
        }
        if (/\.(html|htm)(\?.*)?$/i.test(cleanUrl) || cleanUrl.startsWith('data:text/html')) {
            return 'html';
        }
        if (
            /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff|avif)(\?.*)?$/i.test(cleanUrl) ||
            cleanUrl.includes('images.unsplash.com') ||
            cleanUrl.includes('i.imgur.com') ||
            cleanUrl.startsWith('data:image/')
        ) {
            return 'image';
        }
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')) {
            return 'link';
        }
        return 'note_embed';
    };

    const getEmbedUrl = (urlStr: string) => {
        if (urlStr.includes('youtube.com/watch')) {
            const v = new URLSearchParams(urlStr.split('?')[1]).get('v');
            if (v) return `https://www.youtube.com/embed/${v}`;
        }
        if (urlStr.includes('youtu.be/')) {
            const id = urlStr.split('youtu.be/')[1]?.split('?')[0];
            if (id) return `https://www.youtube.com/embed/${id}`;
        }
        if (urlStr.includes('vimeo.com/')) {
            const id = urlStr.split('vimeo.com/')[1]?.split('?')[0];
            if (id) return `https://player.vimeo.com/video/${id}`;
        }
        return urlStr;
    };

    // Parse Wikilinks and formatting
    const parseWikilinksAndFormatting = (text: string) => {
        if (!text) return null;

        if (/<(?:iframe|embed|object)\b/i.test(text)) {
            const srcMatch = text.match(/src=["']([^"']+)["']/i);
            const iframeSrc = srcMatch ? srcMatch[1] : null;

            return (
                <div key="inline-html-embed" className="my-3.5 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-[#282d3c] bg-slate-900/10 dark:bg-slate-900/50 shadow-md">
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-[#181c26] border-b border-slate-200 dark:border-[#282d3c] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 select-none">
                        <span className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400">
                            <Globe className="w-3.5 h-3.5" />
                            <span>HTML Embed</span>
                        </span>
                        {iframeSrc && (
                            <a
                                href={iframeSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center gap-1 text-slate-400 hover:text-slate-200"
                            >
                                <span>Source</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                    <div
                        className="p-1 flex items-center justify-center overflow-auto max-w-full"
                        dangerouslySetInnerHTML={{ __html: text }}
                    />
                </div>
            );
        }

        const cleanedText = text
            .replace(/<\/?(div|footer|header|section|article|p|span)[^>]*>/gi, '')
            .trim();

        if (!cleanedText && text.trim()) return null;

        const regex = /(!\[[^\]]*\]\([^)]+\)|!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
        const parts = cleanedText.split(regex);

        return parts.map((part, i) => {
            if (!part) return null;

            // Markdown Image / Media Syntax
            if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (match) {
                    const alt = match[1] || 'Media asset';
                    const url = match[2];
                    const mediaType = getMediaType(url);

                    if (mediaType === 'audio') {
                        return (
                            <div key={i} className="my-3.5 p-3.5 rounded-xl bg-slate-100 dark:bg-[#141820] border border-slate-200 dark:border-[#282e3c] shadow-xs">
                                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-800 dark:text-purple-300">
                                    <Music className="w-4 h-4 text-emerald-600 dark:text-purple-400 flex-shrink-0" />
                                    <span>{alt}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-purple-950/80 text-emerald-700 dark:text-purple-300 text-[10px] font-mono font-bold uppercase">AUDIO</span>
                                </div>
                                <audio controls src={url} className="w-full h-9 rounded" />
                            </div>
                        );
                    }

                    if (mediaType === 'video' || mediaType === 'video_embed') {
                        const embedUrl = getEmbedUrl(url);
                        if (mediaType === 'video_embed') {
                            return (
                                <div key={i} className="my-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-[#282e3c] aspect-video bg-black shadow-md">
                                    <iframe src={embedUrl} title={alt} className="w-full h-full" allowFullScreen />
                                </div>
                            );
                        }
                        return (
                            <div key={i} className="my-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-[#282e3c] bg-black shadow-md">
                                <video controls src={url} className="w-full max-h-[480px] object-contain" />
                            </div>
                        );
                    }

                    if (mediaType === 'pdf') {
                        return (
                            <div key={i} className="my-3.5 rounded-xl border border-slate-200 dark:border-[#282d3c] bg-slate-50 dark:bg-[#11141c] overflow-hidden shadow-md">
                                <div className="px-3.5 py-2 bg-slate-100 dark:bg-[#161a24] border-b border-slate-200 dark:border-[#282d3c] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                                    <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                        <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                        <span className="truncate max-w-[220px] sm:max-w-[320px]">{alt}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-bold">PDF</span>
                                    </div>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded bg-slate-200 dark:bg-[#252b38] hover:bg-slate-300 dark:hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <span>Open / Download</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <div className="w-full h-[450px] bg-slate-900 flex items-center justify-center">
                                    <object data={url} type="application/pdf" className="w-full h-full">
                                        <iframe src={url} title={alt} className="w-full h-full border-0">
                                            <div className="p-6 text-center text-slate-300">
                                                <p className="mb-2">PDF Document Ready</p>
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-semibold">
                                                    Download / Open PDF
                                                </a>
                                            </div>
                                        </iframe>
                                    </object>
                                </div>
                            </div>
                        );
                    }

                    if (mediaType === 'html') {
                        const htmlSrcDoc = decodeHtmlDataUrl(url);
                        const displayTitle = alt && alt !== 'Media asset' ? alt : 'HTML Document';
                        return (
                            <div key={i} className="my-3.5 rounded-xl border border-slate-200 dark:border-[#282d3c] bg-white dark:bg-[#11141c] overflow-hidden shadow-md">
                                <div className="px-3.5 py-2 bg-slate-100 dark:bg-[#161a24] border-b border-slate-200 dark:border-[#282d3c] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                                    <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                        <Globe className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                                        <span className="truncate max-w-[200px] sm:max-w-[320px]">{displayTitle}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase">HTML PAGE</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const rawContent = htmlSrcDoc || decodeHtmlDataUrl(url);
                                                if (rawContent) {
                                                    const win = window.open('', '_blank');
                                                    if (win) {
                                                        win.document.write(rawContent);
                                                        win.document.close();
                                                    }
                                                } else if (url.startsWith('http')) {
                                                    window.open(url, '_blank');
                                                }
                                            }}
                                            className="px-2.5 py-1 rounded bg-slate-200 dark:bg-[#252b38] hover:bg-slate-300 dark:hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer"
                                            title="Open full interactive HTML in new tab"
                                        >
                                            <span>Open Full Screen</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full h-[450px] bg-white relative">
                                    <iframe
                                        srcDoc={htmlSrcDoc || undefined}
                                        src={!htmlSrcDoc ? url : undefined}
                                        title={displayTitle}
                                        className="w-full h-full border-0 bg-white"
                                        sandbox="allow-scripts allow-popups allow-forms allow-modals allow-same-origin"
                                    />
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className="my-3 max-w-full inline-block">
                            <img
                                src={url}
                                alt={alt}
                                className="max-w-full h-auto rounded-xl border border-slate-200 shadow-md object-cover transition-transform duration-200 hover:scale-[1.01]"
                                loading="lazy"
                            />
                            {alt && alt !== 'Media asset' && !alt.startsWith('http') && (
                                <span className="block text-[11px] text-slate-500 mt-1 italic text-center">
                                    {alt}
                                </span>
                            )}
                        </div>
                    );
                }
            }

            // Obsidian Embed Syntax
            if (part.startsWith('![') && part.endsWith(']]')) {
                const inner = part.slice(3, -2);
                const [rawUrl, sizeOrAlt] = inner.split('|');
                const url = rawUrl.trim();
                const mediaType = getMediaType(url);

                if (mediaType === 'audio') {
                    return (
                        <div key={i} className="my-3.5 p-3.5 rounded-xl bg-slate-100 dark:bg-[#141820] border border-slate-200 dark:border-[#282e3c]">
                            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-800 dark:text-purple-300">
                                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-purple-400 flex-shrink-0" />
                                <span>{sizeOrAlt || url}</span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-purple-950/80 text-emerald-700 dark:text-purple-300 text-[10px] font-mono font-bold uppercase">AUDIO</span>
                            </div>
                            <audio controls src={url} className="w-full h-9 rounded" />
                        </div>
                    );
                }

                if (mediaType === 'video' || mediaType === 'video_embed') {
                    const embedUrl = getEmbedUrl(url);
                    if (mediaType === 'video_embed') {
                        return (
                            <div key={i} className="my-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-[#282e3c] aspect-video bg-black shadow-md">
                                <iframe src={embedUrl} title={sizeOrAlt || 'Video'} className="w-full h-full" allowFullScreen />
                            </div>
                        );
                    }
                    return (
                        <div key={i} className="my-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-[#282e3c] bg-black shadow-md">
                            <video controls src={url} className="w-full max-h-[480px]" />
                        </div>
                    );
                }

                if (mediaType === 'pdf') {
                    return (
                        <div key={i} className="my-3.5 rounded-xl border border-slate-200 dark:border-[#282d3c] bg-slate-50 dark:bg-[#11141c] overflow-hidden shadow-md">
                            <div className="px-3.5 py-2 bg-slate-100 dark:bg-[#161a24] border-b border-slate-200 dark:border-[#282d3c] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                    <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span className="truncate max-w-[220px] sm:max-w-[320px]">{sizeOrAlt || url}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-bold">PDF</span>
                                </div>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded bg-slate-200 dark:bg-[#252b38] hover:bg-slate-300 dark:hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                    <span>Open / Download</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="w-full h-[450px] bg-slate-900 flex items-center justify-center">
                                <object data={url} type="application/pdf" className="w-full h-full">
                                    <iframe src={url} title={sizeOrAlt || 'PDF Document'} className="w-full h-full border-0">
                                        <div className="p-6 text-center text-slate-300">
                                            <p className="mb-2">PDF Document Ready</p>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline font-semibold">
                                                Download / Open PDF
                                            </a>
                                        </div>
                                    </iframe>
                                </object>
                            </div>
                        </div>
                    );
                }

                if (mediaType === 'html') {
                    const htmlSrcDoc = decodeHtmlDataUrl(url);
                    const displayTitle = sizeOrAlt || 'HTML Document';
                    return (
                        <div key={i} className="my-3.5 rounded-xl border border-slate-200 dark:border-[#282d3c] bg-white dark:bg-[#11141c] overflow-hidden shadow-md">
                            <div className="px-3.5 py-2 bg-slate-100 dark:bg-[#161a24] border-b border-slate-200 dark:border-[#282d3c] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                    <Globe className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                                    <span className="truncate max-w-[200px] sm:max-w-[300px]">{displayTitle}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase">HTML PAGE</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const rawContent = htmlSrcDoc || decodeHtmlDataUrl(url);
                                            if (rawContent) {
                                                const win = window.open('', '_blank');
                                                if (win) {
                                                    win.document.write(rawContent);
                                                    win.document.close();
                                                }
                                            } else if (url.startsWith('http')) {
                                                window.open(url, '_blank');
                                            }
                                        }}
                                        className="px-2.5 py-1 rounded bg-slate-200 dark:bg-[#252b38] hover:bg-slate-300 dark:hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer"
                                        title="Open full interactive HTML in new tab"
                                    >
                                        <span>Open Full Screen</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="w-full h-[450px] bg-white relative">
                                <iframe
                                    srcDoc={htmlSrcDoc || undefined}
                                    src={!htmlSrcDoc ? url : undefined}
                                    title={displayTitle}
                                    className="w-full h-full border-0 bg-white"
                                    sandbox="allow-scripts allow-popups allow-forms allow-modals allow-same-origin"
                                />
                            </div>
                        </div>
                    );
                }

                if (mediaType === 'image') {
                    return (
                        <div key={i} className="my-3 max-w-full">
                            <img
                                src={url}
                                alt={sizeOrAlt || 'Embedded image'}
                                className="max-w-full h-auto rounded-xl border border-slate-200 shadow-md object-cover"
                                loading="lazy"
                            />
                        </div>
                    );
                }

                const noteTitleClean = url.split('#')[0].trim();
                const sectionName = url.includes('#') ? url.split('#')[1]?.trim() : null;
                const matchedNote = notes.find(n => n.title.toLowerCase() === noteTitleClean.toLowerCase());

                if (matchedNote) {
                    return (
                        <ObsidianTranscludedNote
                            key={i}
                            note={matchedNote}
                            section={sectionName}
                            onOpenNote={() => selectNoteByTitle(matchedNote.title)}
                            isDark={false}
                        />
                    );
                }

                return (
                    <div key={i} className="my-3 p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 text-amber-900 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>Embedded Note: <strong className="font-mono">[[{noteTitleClean}]]</strong></span>
                        </div>
                        <button
                            type="button"
                            onClick={() => selectNoteByTitle(noteTitleClean)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                            + Create Note
                        </button>
                    </div>
                );
            }

            // Wikilink Syntax
            if (part.startsWith('[[') && part.endsWith(']]')) {
                const inner = part.slice(2, -2);
                const [targetTitle, displayName] = inner.split('|');
                const label = displayName || targetTitle;

                return (
                    <button
                        key={i}
                        onClick={() => selectNoteByTitle(targetTitle)}
                        className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 font-medium text-xs transition-colors cursor-pointer"
                        title={`Navigate to note: ${targetTitle}`}
                    >
                        <Link2 className="w-3 h-3 text-emerald-600 inline" />
                        <span>{label}</span>
                    </button>
                );
            }

            // Standard Link
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
                if (match) {
                    const label = match[1];
                    const url = match[2];
                    return (
                        <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 underline font-medium"
                        >
                            <span>{label}</span>
                            <ExternalLink className="w-3 h-3 text-emerald-600 inline" />
                        </a>
                    );
                }
            }

            // Bold
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }

            // Code
            if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200">
                        {part.slice(1, -1)}
                    </code>
                );
            }

            // Italic
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-slate-700">{part.slice(1, -1)}</em>;
            }

            return <span key={`txt-${i}`}>{part}</span>;
        });
    };

    // Render Obsidian formatted content
    const renderObsidianMarkdown = (content: string) => {
        if (!content) return null;

        let noteBody = content;
        const frontmatterData: Record<string, string> = {};

        if (content.trim().startsWith('---')) {
            const trimmed = content.trim();
            const secondDash = trimmed.indexOf('---', 3);
            if (secondDash !== -1) {
                const fmContent = trimmed.substring(3, secondDash).trim();
                noteBody = trimmed.substring(secondDash + 3).trim();

                fmContent.split('\n').forEach(line => {
                    const colonIdx = line.indexOf(':');
                    if (colonIdx !== -1) {
                        const key = line.substring(0, colonIdx).trim().toLowerCase();
                        let val = line.substring(colonIdx + 1).trim();
                        val = val.replace(/^["']|["']$/g, '');
                        if (key) frontmatterData[key] = val;
                    }
                });
            }
        }

        const cleanNoteBody = noteBody.trim().toLowerCase();
        if (cleanNoteBody.startsWith('<!doctype html') || cleanNoteBody.startsWith('<html')) {
            return (
                <div className="my-2 rounded-2xl border border-slate-200 dark:border-[#282d3c] bg-white dark:bg-[#11141c] overflow-hidden shadow-xl font-sans">
                    <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#161a24] border-b border-slate-200 dark:border-[#282d3c] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 select-none">
                        <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                            <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <span className="truncate font-bold text-slate-900 dark:text-white max-w-[280px]">Interactive HTML Document</span>
                            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/90 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-bold uppercase tracking-wider">
                                HTML5
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const win = window.open('', '_blank');
                                    if (win) {
                                        win.document.write(noteBody);
                                        win.document.close();
                                    }
                                }}
                                className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-[#252b38] hover:bg-slate-300 dark:hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1.5 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer"
                                title="Open full interactive page in new window"
                            >
                                <span>Open Full Screen</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="w-full h-[620px] bg-white relative">
                        <iframe
                            srcDoc={noteBody}
                            title="Interactive HTML Page"
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts allow-popups allow-forms allow-modals allow-same-origin"
                        />
                    </div>
                </div>
            );
        }

        const lines = noteBody.split('\n');
        const elements: React.ReactNode[] = [];

        if (frontmatterData.cover_image) {
            elements.push(
                <div key="frontmatter-banner" className="mb-4 rounded-xl overflow-hidden border border-slate-200 shadow-md">
                    <img
                        src={frontmatterData.cover_image}
                        alt={frontmatterData.title || 'Cover image'}
                        className="w-full h-44 sm:h-56 object-cover"
                        loading="lazy"
                    />
                </div>
            );
        }

        if (Object.keys(frontmatterData).length > 0) {
            elements.push(
                <div key="frontmatter-card" className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    {frontmatterData.title && (
                        <div className="font-bold text-slate-900 text-sm mb-1">{frontmatterData.title}</div>
                    )}
                    {frontmatterData.description && (
                        <p className="text-slate-600 italic mb-2">{frontmatterData.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        {frontmatterData.author && <span>👤 Author: <strong className="text-slate-700">{frontmatterData.author}</strong></span>}
                        {frontmatterData.date && <span>📅 Date: <strong className="text-slate-700">{frontmatterData.date}</strong></span>}
                    </div>
                </div>
            );
        }

        let inCallout = false;
        let calloutType = 'NOTE';
        let calloutTitle = '';
        let calloutLines: string[] = [];

        let inCodeBlock = false;
        let codeBlockLang = '';
        let codeBlockLines: string[] = [];

        let inHtmlEmbed = false;
        let htmlEmbedLines: string[] = [];

        let inFullHtmlDoc = false;
        let fullHtmlDocLines: string[] = [];

        const flushFullHtmlDoc = (keyIndex: number) => {
            if (!inFullHtmlDoc || fullHtmlDocLines.length === 0) return;
            const fullHtml = fullHtmlDocLines.join('\n');
            if (!fullHtml.trim()) return;

            elements.push(
                <div key={`full-html-doc-${keyIndex}`} className="my-4 rounded-2xl border border-slate-200 dark:border-[#282d3c] bg-white dark:bg-[#11141c] overflow-hidden shadow-xl font-sans">
                    <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#161a24] border-b border-slate-200 dark:border-[#282d3c] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 select-none">
                        <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                            <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <span className="truncate font-bold text-slate-900 dark:text-white max-w-[280px]">Interactive HTML Document</span>
                            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/90 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-bold uppercase tracking-wider">
                                HTML5
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const win = window.open('', '_blank');
                                    if (win) {
                                        win.document.write(fullHtml);
                                        win.document.close();
                                    }
                                }}
                                className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-[#252b38] hover:bg-slate-300 dark:hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1.5 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer"
                                title="Open full interactive page in new window"
                            >
                                <span>Open Full Screen</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="w-full h-[620px] bg-white relative">
                        <iframe
                            srcDoc={fullHtml}
                            title="Interactive HTML Page"
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts allow-popups allow-forms allow-modals allow-same-origin"
                        />
                    </div>
                </div>
            );

            inFullHtmlDoc = false;
            fullHtmlDocLines = [];
        };

        const flushHtmlEmbed = (keyIndex: number) => {
            if (!inHtmlEmbed || htmlEmbedLines.length === 0) return;
            const fullHtml = htmlEmbedLines.join('\n').trim();
            if (!fullHtml) return;

            const srcMatch = fullHtml.match(/src=["']([^"']+)["']/i);
            const iframeSrc = srcMatch ? srcMatch[1] : null;

            const isTikTok = /tiktok-embed|tiktok\.com/i.test(fullHtml);
            const isTwitter = /twitter-tweet|twitter\.com|x\.com/i.test(fullHtml);
            const isInstagram = /instagram-media|instagram\.com/i.test(fullHtml);
            const hasScript = /<script\b/i.test(fullHtml) || isTikTok || isTwitter || isInstagram;

            let embedHeight = 'h-[520px]';
            if (isTikTok) embedHeight = 'h-[750px]';
            else if (isTwitter) embedHeight = 'h-[600px]';
            else if (isInstagram) embedHeight = 'h-[640px]';
            else if (/spotify|soundcloud/i.test(fullHtml)) embedHeight = 'h-[380px]';

            const srcDocContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 12px;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    blockquote.tiktok-embed {
      margin: 0 auto !important;
      max-width: 100% !important;
    }
    iframe {
      max-width: 100% !important;
    }
  </style>
</head>
<body>
  ${fullHtml}
</body>
</html>`;

            elements.push(
                <div
                    key={`html-embed-${keyIndex}`}
                    className="my-4 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-[#282d3c] bg-white dark:bg-[#11141c] shadow-lg font-sans"
                >
                    <div className="px-3.5 py-2 bg-slate-100 dark:bg-[#161a24] border-b border-slate-200 dark:border-[#282d3c] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 select-none">
                        <span className="flex items-center gap-2 font-mono text-xs font-semibold">
                            <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-white">
                                {isTikTok ? 'TikTok Video Embed' : isTwitter ? 'X / Twitter Post Embed' : isInstagram ? 'Instagram Reel Embed' : 'Interactive HTML Embed'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/90 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-bold uppercase tracking-wider">
                                {isTikTok ? 'TikTok' : 'Embed'}
                            </span>
                        </span>
                        {iframeSrc && (
                            <a
                                href={iframeSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <span>Source</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                    <div className={`w-full ${embedHeight} bg-white relative flex items-center justify-center p-2`}>
                        {hasScript ? (
                            <iframe
                                srcDoc={srcDocContent}
                                title="Interactive Media Embed"
                                className="w-full h-full border-0 bg-white"
                                sandbox="allow-scripts allow-popups allow-forms allow-modals allow-same-origin"
                            />
                        ) : (
                            <div
                                className="p-1 flex items-center justify-center overflow-auto max-w-full w-full h-full"
                                dangerouslySetInnerHTML={{ __html: fullHtml }}
                            />
                        )}
                    </div>
                </div>
            );

            inHtmlEmbed = false;
            htmlEmbedLines = [];
        };

        const flushCallout = (keyIndex: number) => {
            if (!inCallout) return;
            let bgColor = 'bg-blue-50 border-blue-400 text-blue-900';
            let icon = <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />;

            const typeUpper = calloutType.toUpperCase();
            if (typeUpper.includes('WARNING') || typeUpper.includes('WARN')) {
                bgColor = 'bg-amber-50 border-amber-500 text-amber-900';
                icon = <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
            } else if (typeUpper.includes('SUCCESS') || typeUpper.includes('CHECK')) {
                bgColor = 'bg-emerald-50 border-emerald-500 text-emerald-900';
                icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
            } else if (typeUpper.includes('SUMMARY') || typeUpper.includes('INFO')) {
                bgColor = 'bg-sky-50 border-sky-500 text-sky-900';
                icon = <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0" />;
            }

            elements.push(
                <div
                    key={`callout-${keyIndex}`}
                    className={`my-3 p-3.5 border-l-4 rounded-r-md ${bgColor} shadow-xs text-xs sm:text-sm`}
                >
                    <div className="flex items-center gap-2 font-bold mb-1.5 uppercase tracking-wide text-xs">
                        {icon}
                        <span>{calloutTitle || calloutType}</span>
                    </div>
                    <div className="space-y-1">
                        {calloutLines.map((cline, cidx) => (
                            <p key={cidx}>{parseWikilinksAndFormatting(cline)}</p>
                        ))}
                    </div>
                </div>
            );

            inCallout = false;
            calloutType = 'NOTE';
            calloutTitle = '';
            calloutLines = [];
        };

        const flushCodeBlock = (keyIndex: number) => {
            if (!inCodeBlock) return;
            const codeContent = codeBlockLines.join('\n');
            elements.push(
                <ObsidianCodeBlock
                    key={`code-block-${keyIndex}`}
                    code={codeContent}
                    lang={codeBlockLang}
                    isDark={false}
                />
            );
            inCodeBlock = false;
            codeBlockLang = '';
            codeBlockLines = [];
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            if (inFullHtmlDoc) {
                fullHtmlDocLines.push(line);
                if (trimmedLine.toLowerCase() === '</html>') {
                    flushFullHtmlDoc(index);
                }
                return;
            }

            if (trimmedLine.toLowerCase().startsWith('<!doctype html') || trimmedLine.toLowerCase().startsWith('<html')) {
                flushCallout(index);
                flushCodeBlock(index);
                flushHtmlEmbed(index);
                inFullHtmlDoc = true;
                fullHtmlDocLines = [line];
                return;
            }

            if (line.trim().startsWith('```')) {
                flushHtmlEmbed(index);
                if (inCodeBlock) {
                    flushCodeBlock(index);
                } else {
                    flushCallout(index);
                    inCodeBlock = true;
                    codeBlockLang = line.trim().substring(3).trim();
                    codeBlockLines = [];
                }
                return;
            }

            if (inCodeBlock) {
                codeBlockLines.push(line);
                return;
            }

            if (inHtmlEmbed) {
                const isMarkdownBoundary =
                    trimmedLine.startsWith('# ') ||
                    trimmedLine.startsWith('## ') ||
                    trimmedLine.startsWith('### ') ||
                    trimmedLine.startsWith('```') ||
                    trimmedLine.startsWith('> [!') ||
                    trimmedLine === '---' ||
                    trimmedLine === '***';

                if (isMarkdownBoundary) {
                    flushHtmlEmbed(index);
                } else {
                    htmlEmbedLines.push(line);
                    const accumulated = htmlEmbedLines.join('\n').toLowerCase();
                    const currentLineLower = trimmedLine.toLowerCase();

                    const isClosed =
                        currentLineLower.includes('</iframe>') ||
                        currentLineLower.includes('</embed>') ||
                        currentLineLower.includes('</object>') ||
                        currentLineLower.includes('</script>') ||
                        currentLineLower.includes('</video>') ||
                        currentLineLower.includes('</audio>') ||
                        (currentLineLower.includes('Joined') && currentLineLower.includes('</script>')) ||
                        (accumulated.includes('</blockquote>') && currentLineLower.includes('</script>'));

                    if (isClosed) {
                        flushHtmlEmbed(index);
                    }
                }
                return;
            }

            if (
                /<(?:iframe|embed|object|blockquote|script|video|audio)\b/i.test(trimmedLine) ||
                /<div\s+[^>]*class=["'][^"']*(?:embed|tiktok|twitter|instagram|youtube|spotify)[^"']*["']/i.test(trimmedLine)
            ) {
                flushCallout(index);
                inHtmlEmbed = true;
                htmlEmbedLines = [line];
                const lineLower = trimmedLine.toLowerCase();
                const isSingleLineComplete =
                    lineLower.includes('</iframe>') ||
                    lineLower.includes('</embed>') ||
                    lineLower.includes('</object>') ||
                    lineLower.includes('</video>') ||
                    lineLower.includes('</audio>') ||
                    (lineLower.includes('</blockquote>') && lineLower.includes('</script>')) ||
                    lineLower.endsWith('/>');

                if (isSingleLineComplete) {
                    flushHtmlEmbed(index);
                }
                return;
            }

            if (/^<\/?(div|footer|header|section|article|p)[^>]*>$/i.test(trimmedLine)) {
                return;
            }

            if (trimmedLine === '---' || trimmedLine === '***') {
                elements.push(<hr key={index} className="my-4 border-slate-200" />);
                return;
            }

            const calloutMatch = line.match(/^>\s*\[!([A-Z]+)\]\s*(.*)$/i);
            if (calloutMatch) {
                flushCallout(index);
                inCallout = true;
                calloutType = calloutMatch[1];
                calloutTitle = calloutMatch[2] || calloutType;
                return;
            }

            if (inCallout) {
                if (line.startsWith('>')) {
                    calloutLines.push(line.replace(/^>\s*/, ''));
                    return;
                } else {
                    flushCallout(index);
                }
            }

            if (line.startsWith('# ')) {
                elements.push(
                    <h1 key={index} className="text-xl sm:text-2xl font-extrabold text-slate-900 my-3">
                        {parseWikilinksAndFormatting(line.replace('# ', ''))}
                    </h1>
                );
            } else if (line.startsWith('## ')) {
                elements.push(
                    <h2 key={index} className="text-lg sm:text-xl font-bold text-slate-800 my-2.5">
                        {parseWikilinksAndFormatting(line.replace('## ', ''))}
                    </h2>
                );
            } else if (line.startsWith('### ')) {
                elements.push(
                    <h3 key={index} className="text-base sm:text-lg font-semibold text-slate-800 my-2">
                        {parseWikilinksAndFormatting(line.replace('### ', ''))}
                    </h3>
                );
            } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
                const isChecked = line.startsWith('- [x] ');
                elements.push(
                    <div key={index} className="flex items-center gap-2 my-1.5 text-xs sm:text-sm">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className={isChecked ? 'line-through text-slate-400' : 'text-slate-700'}>
                            {parseWikilinksAndFormatting(line.substring(6))}
                        </span>
                    </div>
                );
            } else if (line.startsWith('- ')) {
                elements.push(
                    <li key={index} className="ml-4 list-disc text-xs sm:text-sm text-slate-700 my-1">
                        {parseWikilinksAndFormatting(line.replace('- ', ''))}
                    </li>
                );
            } else if (trimmedLine === '') {
                elements.push(<div key={index} className="h-2" />);
            } else {
                const parsed = parseWikilinksAndFormatting(line);
                if (parsed) {
                    elements.push(
                        <div key={index} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-1">
                            {parsed}
                        </div>
                    );
                }
            }
        });

        flushCallout(lines.length);
        flushCodeBlock(lines.length);
        flushHtmlEmbed(lines.length);
        flushFullHtmlDoc(lines.length);

        return elements;
    };

    // Handle file uploads
    const processFiles = (fileList: File[]) => {
        if (!fileList || fileList.length === 0) return;

        const newUploadedNotes: ObsidianNote[] = [];
        let processedCount = 0;

        const checkFinished = () => {
            if (processedCount === fileList.length) {
                if (newUploadedNotes.length > 0) {
                    setNotes(prev => [...prev, ...newUploadedNotes]);
                    if (!activeNoteId) {
                        setActiveNoteId(newUploadedNotes[0].id);
                    }
                }
                setSaveMessage(`Successfully imported ${fileList.length} file(s) into Obsidian Vault!`);
                setTimeout(() => setSaveMessage(''), 5000);
            }
        };

        fileList.forEach((file, index) => {
            const fileName = file.name;
            const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
            const lowerName = fileName.toLowerCase();

            if (
                (lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || lowerName.endsWith('.txt')) &&
                !lowerName.endsWith('.html') &&
                !lowerName.endsWith('.htm') &&
                !file.type.includes('html')
            ) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const fileContent = (event.target?.result as string) || '';

                    let noteTitle = cleanName;
                    let noteCategory = 'IMPORTED';
                    let noteTags: string[] = ['#obsidian', '#uploaded'];

                    const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                    if (frontmatterMatch) {
                        const yaml = frontmatterMatch[1];
                        yaml.split('\n').forEach(line => {
                            const colonIdx = line.indexOf(':');
                            if (colonIdx !== -1) {
                                const k = line.substring(0, colonIdx).trim().toLowerCase();
                                const v = line.substring(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
                                if (k === 'title' && v) noteTitle = v;
                                if (k === 'category' && v) noteCategory = v.toUpperCase();
                                if (k === 'tags' && v) {
                                    if (v.startsWith('[') && v.endsWith(']')) {
                                        noteTags = v.slice(1, -1).split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).map(t => t.startsWith('#') ? t : `#${t}`);
                                    } else {
                                        noteTags = v.split(',').map(t => t.trim()).map(t => t.startsWith('#') ? t : `#${t}`);
                                    }
                                }
                            }
                        });
                    } else {
                        const h1Match = fileContent.match(/^#\s+(.+)$/m);
                        if (h1Match && h1Match[1]) {
                            noteTitle = h1Match[1].trim();
                        }
                    }

                    const newNote: ObsidianNote = {
                        id: `uploaded-${Date.now()}-${index}`,
                        title: noteTitle || `Uploaded Note ${notes.length + index + 1}`,
                        category: noteCategory,
                        tags: noteTags.length > 0 ? noteTags : ['#obsidian', '#uploaded'],
                        content: fileContent
                    };

                    newUploadedNotes.push(newNote);
                    processedCount++;
                    checkFinished();
                };
                reader.readAsText(file);
                return;
            }

            if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || file.type.includes('html')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const fileContent = (event.target?.result as string) || '';

                    let htmlTitle = cleanName;
                    const titleMatch = fileContent.match(/<title[^>]*>([^<]+)<\/title>/i);
                    if (titleMatch && titleMatch[1]) {
                        htmlTitle = titleMatch[1].trim();
                    }

                    let base64Html = '';
                    try {
                        base64Html = btoa(unescape(encodeURIComponent(fileContent)));
                    } catch (e) {
                        base64Html = btoa(fileContent);
                    }
                    const dataUrl = `data:text/html;base64,${base64Html}`;
                    const embedTag = `![${htmlTitle}](${dataUrl})`;

                    const newNote: ObsidianNote = {
                        id: `uploaded-html-${Date.now()}-${index}`,
                        title: htmlTitle || fileName,
                        category: 'HTML EMBEDS',
                        tags: ['#html', '#embed'],
                        content: `# ${htmlTitle}\n\n${embedTag}`
                    };

                    newUploadedNotes.push(newNote);

                    if (activeNote) {
                        updateActiveNote('content', (activeNote.content || '') + `\n\n${embedTag}`);
                    }

                    processedCount++;
                    checkFinished();
                };
                reader.readAsText(file);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = (event.target?.result as string) || '';
                const mimeType = file.type || '';

                let category = 'ATTACHMENTS';
                let tag = '#attachment';

                if (mimeType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(fileName)) {
                    category = 'IMAGES';
                    tag = '#image';
                } else if (mimeType.startsWith('video/') || /\.(mp4|webm|mov|mkv|m4v)$/i.test(fileName)) {
                    category = 'VIDEOS';
                    tag = '#video';
                } else if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(fileName)) {
                    category = 'AUDIO';
                    tag = '#audio';
                } else if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
                    category = 'PDF DOCUMENTS';
                    tag = '#pdf';
                }

                const embedTag = `![${fileName}](${dataUrl})`;

                const newNote: ObsidianNote = {
                    id: `uploaded-media-${Date.now()}-${index}`,
                    title: fileName,
                    category: category,
                    tags: ['#media', tag],
                    content: `# ${fileName}\n\n${embedTag}`
                };

                newUploadedNotes.push(newNote);

                if (activeNote) {
                    updateActiveNote('content', (activeNote.content || '') + `\n\n${embedTag}`);
                }

                processedCount++;
                checkFinished();
            };
            reader.readAsDataURL(file);
        });
    };

    // Handle file upload from input
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        processFiles(Array.from(files));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    // Insert snippet
    const insertSnippet = (snippet: string) => {
        if (!activeNote) return;
        let addition = '';
        if (snippet === 'wikilink') {
            addition = ' [[Wikilink Title]] ';
        } else if (snippet === 'note') {
            addition = '\n\n> [!NOTE] NOTE TITLE\n> Note details and content goes here.';
        } else if (snippet === 'warning') {
            addition = '\n\n> [!WARNING] WARNING TITLE\n> Important warning message.';
        } else if (snippet === 'checkbox') {
            addition = '\n- [ ] Task item';
        }
        updateActiveNote('content', activeNote.content + addition);
    };

    // Handle delete note
    const handleDeleteNote = (idToDelete: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        const noteToDelete = notes.find(n => n.id === idToDelete);
        if (!noteToDelete) return;

        setNoteToDeleteId(idToDelete);
    };

    const confirmDeleteNote = () => {
        if (!noteToDeleteId) return;

        const noteToDelete = notes.find(n => n.id === noteToDeleteId);
        if (!noteToDelete) return;

        const remainingNotes = notes.filter(n => n.id !== noteToDeleteId);
        setNotes(remainingNotes);

        if (activeNoteId === noteToDeleteId) {
            if (remainingNotes.length > 0) {
                setActiveNoteId(remainingNotes[0].id);
            } else {
                setActiveNoteId(null);
            }
        }

        setSaveMessage(`🗑️ Deleted "${noteToDelete.title}" from vault.`);
        setTimeout(() => setSaveMessage(''), 3000);
        setNoteToDeleteId(null);
    };

    // Auto-Pilot functions
    const handleRunAutoPilot = async (modeOverride?: string, customPromptOverride?: string) => {
        if (!canInteract && setShowLoginPrompt) {
            setShowLoginPrompt(true);
            return;
        }

        if (!activeNote) {
            setAutoPilotError('Please create or select a note first.');
            return;
        }

        const modeToUse = modeOverride || selectedAutoPilotMode;
        const promptToUse = customPromptOverride !== undefined ? customPromptOverride : customInstruction;

        setIsAutoPiloting(true);
        let statusMsg = `🚀 AI Auto-Pilot connecting to ${selectedModel.name}...`;
        if (modeToUse === 'autolink' || modeToUse === 'autolink_vault') {
            statusMsg = `🔗 AI Auto-Linking concepts & vault notes with ${selectedModel.name}...`;
        } else if (modeToUse === 'summarize') {
            statusMsg = `📝 AI Generating Executive Summary with ${selectedModel.name}...`;
        } else if (modeToUse === 'callouts') {
            statusMsg = `🎨 AI Structuring Obsidian Callouts with ${selectedModel.name}...`;
        } else if (modeToUse === 'subtopics') {
            statusMsg = `🌱 AI Generating Related Sub-Topic Notes with ${selectedModel.name}...`;
        }
        setAutoPilotStatus(statusMsg);
        setAutoPilotSummary('');
        setAutoPilotError('');

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await axios.post('/content/obsidian-wiki/auto-pilot', {
                note: {
                    title: activeNote.title,
                    content: activeNote.content,
                    category: activeNote.category,
                    tags: activeNote.tags
                },
                vault_notes: notes.map(n => ({ title: n.title, category: n.category, id: n.id })),
                mode: modeToUse,
                instructions: promptToUse,
                conversation_id: conversationId || undefined,
                message_id: messageId || undefined,
                model: selectedModel.id
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                }
            });

            if (response.data?.usage) {
                const u = response.data.usage;
                setLatestAiUsage((prev: any) => ({
                    prompt_tokens: (prev?.prompt_tokens || 0) + (u.prompt_tokens || 0),
                    completion_tokens: (prev?.completion_tokens || 0) + (u.completion_tokens || 0),
                    total_tokens: (prev?.total_tokens || 0) + (u.total_tokens || 0),
                }));
            }

            if (response.data?.success && response.data?.data) {
                const result = response.data.data;
                
                const updatedTitle = result.title || activeNote.title;
                const updatedCategory = result.category ? result.category.toUpperCase() : activeNote.category;
                const updatedTags = Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : activeNote.tags;
                const updatedContent = result.content || activeNote.content;

                setNotes(prev => prev.map(n => n.id === activeNote.id ? {
                    ...n,
                    title: updatedTitle,
                    category: updatedCategory,
                    tags: updatedTags,
                    content: updatedContent
                } : n));

                let addedNotesCount = 0;
                if (Array.isArray(result.suggested_new_notes) && result.suggested_new_notes.length > 0) {
                    const newSubNotes: ObsidianNote[] = [];
                    result.suggested_new_notes.forEach((sub: any, idx: number) => {
                        const subTitle = (sub.title || '').trim();
                        if (subTitle && !notes.some(existing => existing.title.toLowerCase() === subTitle.toLowerCase())) {
                            newSubNotes.push({
                                id: `ap-subnote-${Date.now()}-${idx}`,
                                title: subTitle,
                                category: sub.category ? sub.category.toUpperCase() : updatedCategory,
                                tags: Array.isArray(sub.tags) ? sub.tags : ['#ai-generated', '#stub'],
                                content: sub.content || `# ${subTitle}\n\n> [!NOTE] AUTO-PILOT STUB NOTE\n> Auto-generated related node connected to [[${updatedTitle}]].`
                            });
                        }
                    });

                    if (newSubNotes.length > 0) {
                        setNotes(prev => [...prev, ...newSubNotes]);
                        addedNotesCount = newSubNotes.length;
                    }
                }

                const usageInfo = response.data?.usage;
                const tokenUsageText = usageInfo?.total_tokens ? ` (${usageInfo.total_tokens.toLocaleString()} tokens used)` : '';
                const summaryMsg = (result.enrichment_summary || 
                    `✨ AI Auto-Pilot enriched "${updatedTitle}"${addedNotesCount > 0 ? ` and created ${addedNotesCount} connected sub-notes!` : '!'}`) + tokenUsageText;
                setAutoPilotSummary(summaryMsg);
                setShowCustomInstructionModal(false);
                setCustomInstruction('');
            } else {
                setAutoPilotError(response.data?.message || `AI Auto-Pilot with ${selectedModel.name} failed to enrich note.`);
            }
        } catch (err: any) {
            console.error('AI Auto-Pilot Error:', err);
            setAutoPilotError(err.response?.data?.message || `Error running AI Auto-Pilot with ${selectedModel.name}.`);
        } finally {
            setIsAutoPiloting(false);
            setAutoPilotStatus('');
        }
    };

    // Ask AI Create Note
    const handleAskAiCreateNote = async (overrideTopic?: string) => {
        if (!canInteract && setShowLoginPrompt) {
            setShowLoginPrompt(true);
            return;
        }

        const topicToUse = (overrideTopic || askAiTopic).trim();
        if (!topicToUse) {
            setAskAiError('Please enter a topic or title for the AI note.');
            return;
        }

        setIsGeneratingNote(true);
        setAskAiError('');

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await axios.post('/content/obsidian-wiki/auto-pilot', {
                note: {
                    title: topicToUse,
                    content: '',
                    category: askAiCategory || 'GENERAL',
                    tags: []
                },
                vault_notes: notes.map(n => ({ title: n.title, category: n.category, id: n.id })),
                mode: 'create_from_topic',
                instructions: askAiInstructions,
                conversation_id: conversationId || undefined,
                message_id: messageId || undefined,
                model: selectedModel.id
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                }
            });

            if (response.data?.usage) {
                const u = response.data.usage;
                setLatestAiUsage((prev: any) => ({
                    prompt_tokens: (prev?.prompt_tokens || 0) + (u.prompt_tokens || 0),
                    completion_tokens: (prev?.completion_tokens || 0) + (u.completion_tokens || 0),
                    total_tokens: (prev?.total_tokens || 0) + (u.total_tokens || 0),
                }));
            }

            if (response.data?.success && response.data?.data) {
                const result = response.data.data;
                const newTitle = result.title || topicToUse;
                const newCategory = result.category ? result.category.toUpperCase() : (askAiCategory || 'GENERAL').toUpperCase();
                const newTags = Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : ['#ai-generated', `#${newTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}`];
                const newContent = result.content || `# ${newTitle}\n\n> [!NOTE] AI GENERATED NOTE\n> Comprehensive overview of ${newTitle}.\n\nDetailed content for ${newTitle}...`;

                const mainNoteId = `note-ai-${Date.now()}`;
                const mainNote: ObsidianNote = {
                    id: mainNoteId,
                    title: newTitle,
                    category: newCategory,
                    tags: newTags,
                    content: newContent
                };

                const newSubNotes: ObsidianNote[] = [];
                if (askAiCreateSubtopics && Array.isArray(result.suggested_new_notes) && result.suggested_new_notes.length > 0) {
                    result.suggested_new_notes.forEach((sub: any, idx: number) => {
                        const subTitle = (sub.title || '').trim();
                        if (subTitle && !notes.some(existing => existing.title.toLowerCase() === subTitle.toLowerCase())) {
                            newSubNotes.push({
                                id: `subnote-ai-${Date.now()}-${idx}`,
                                title: subTitle,
                                category: sub.category ? sub.category.toUpperCase() : newCategory,
                                tags: Array.isArray(sub.tags) ? sub.tags : ['#ai-generated', '#subtopic'],
                                content: sub.content || `# ${subTitle}\n\n> [!NOTE] SUB-TOPIC NOTE\n> Connected node for [[${newTitle}]].`
                            });
                        }
                    });
                }

                setNotes(prev => [...prev, mainNote, ...newSubNotes]);
                setActiveNoteId(mainNoteId);
                setShowAskAiModal(false);
                setAskAiTopic('');
                setAskAiInstructions('');
                const usageInfo = response.data?.usage;
                const tokenUsageText = usageInfo?.total_tokens ? ` (${usageInfo.total_tokens.toLocaleString()} tokens used)` : '';
                setAutoPilotSummary(`✨ ${selectedModel.name} created new note "${newTitle}" with ${newSubNotes.length} sub-topic nodes in your Obsidian Wiki!${tokenUsageText}`);
            } else {
                // Fallback client-side note creation
                const mainNoteId = `note-ai-${Date.now()}`;
                const newTitle = topicToUse;
                const newCategory = (askAiCategory || 'GENERAL').toUpperCase();
                const fallbackContent = `# ${newTitle}\n\n> [!NOTE] AI GENERATED KNOWLEDGE DOCUMENT\n> Knowledge note auto-generated for topic: **${newTitle}**.\n\n## 📌 Executive Overview\n${newTitle} is a key domain concept. This document organizes key insights, references, and related Wikilinks for your vault.\n\n### 💡 Key Takeaways\n- **Core Definition**: Primary principles and foundations of ${newTitle}.\n- **Applications**: Real-world implementation, workflows, and integrations.\n- **Related Topics**: Connected concepts in [[Wiki Concepts]] and [[Knowledge Base]].\n\n> [!TIP] PRO-TIP\n> You can use **AI Auto-Pilot Enrich** anytime to expand this note with additional callouts and Wikilinks!\n`;

                const mainNote: ObsidianNote = {
                    id: mainNoteId,
                    title: newTitle,
                    category: newCategory,
                    tags: ['#ai-generated', `#${newTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}`],
                    content: fallbackContent
                };

                setNotes(prev => [...prev, mainNote]);
                setActiveNoteId(mainNoteId);
                setShowAskAiModal(false);
                setAskAiTopic('');
                setAskAiInstructions('');
                setAutoPilotSummary(`✨ ${selectedModel.name} created new note "${newTitle}" in your Obsidian Wiki!`);
            }
        } catch (err: any) {
            console.error('Ask AI Create Note Error:', err);
            const mainNoteId = `note-ai-${Date.now()}`;
            const newTitle = topicToUse;
            const newCategory = (askAiCategory || 'GENERAL').toUpperCase();
            const fallbackContent = `# ${newTitle}\n\n> [!NOTE] AI GENERATED KNOWLEDGE DOCUMENT\n> Knowledge note generated for topic: **${newTitle}**.\n\n## 📌 Executive Overview\n${newTitle} represents an important subject in your vault. Below are structured sections and Wikilinks.\n\n### 💡 Key Takeaways & Structure\n- **Overview**: Core concepts and essential background for ${newTitle}.\n- **Practical Applications**: Step-by-step methods and best practices.\n- **Vault Connections**: Linked with [[Welcome to Obsidian Wiki]] and [[Wiki Concepts]].\n\n> [!TIP] AI AUTO-PILOT\n> Use the **✨ AI Auto-Pilot Enrich** button above to automatically expand this document with detailed explanations, callouts, and code snippets!\n`;

            const mainNote: ObsidianNote = {
                id: mainNoteId,
                title: newTitle,
                category: newCategory,
                tags: ['#ai-generated', `#${newTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}`],
                content: fallbackContent
            };

            setNotes(prev => [...prev, mainNote]);
            setActiveNoteId(mainNoteId);
            setShowAskAiModal(false);
            setAskAiTopic('');
            setAskAiInstructions('');
            setAutoPilotSummary(`✨ ${selectedModel.name} created new note "${newTitle}" in your Obsidian Wiki!`);
        } finally {
            setIsGeneratingNote(false);
        }
    };

    // Save Vault
    const handleSaveVault = async () => {
        if (!canInteract && setShowLoginPrompt) {
            setShowLoginPrompt(true);
            return;
        }

        if (notes.length === 0) {
            setSaveError('Cannot save an empty vault. Please create at least one note.');
            setTimeout(() => setSaveError(''), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage('');
        setSaveError('');

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await axios.post('/content/obsidian-wiki', {
                notes: notes.map(n => ({
                    title: n.title,
                    content: n.content,
                    category: n.category,
                    tags: n.tags
                })),
                custom_slug: customSlug || undefined,
                parent_slug: parentSlug || undefined,
                conversation_id: conversationId || undefined,
                message_id: messageId || undefined,
                usage: latestAiUsage || undefined
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                }
            });

            if (response.data.success) {
                setSaveMessage('Obsidian Vault saved successfully!');
                const slug = response.data.slug || customSlug;

                if (onSaveSuccess) {
                    onSaveSuccess(response.data);
                } else if (slug) {
                    setTimeout(() => {
                        router.visit(`/X/${encodeURIComponent(slug)}`, {
                            preserveScroll: false,
                            preserveState: false
                        });
                    }, 1000);
                }
            } else {
                setSaveError(response.data.message || 'Failed to save vault');
            }
        } catch (error: any) {
            console.error('Error saving Obsidian Vault:', error);
            if (axios.isAxiosError(error) && error.response) {
                setSaveError(error.response.data.message || 'Failed to save Obsidian Vault');
            } else {
                setSaveError('An error occurred while saving the vault.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Model Dropdown Component - FIXED VERSION
    const ModelDropdown = () => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef<HTMLDivElement>(null);

        // Handle click outside
        useEffect(() => {
            function handleClickOutside(event: MouseEvent) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);

        const handleSelect = (model: ModelOption) => {
            setSelectedModel(model);
            setIsOpen(false);
        };

        const toggleDropdown = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
        };

        const getProviderLabel = (provider: string) => {
            return provider.charAt(0).toUpperCase() + provider.slice(1);
        };

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium
                        ${isOpen ? 'border-[#22c55e] ring-2 ring-[#22c55e]/20' : 'border-gray-200 hover:border-gray-300'}
                        bg-white shadow-sm hover:shadow cursor-pointer`}
                    type="button"
                >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${selectedModel.color}`} />
                    <span className="text-gray-700">{selectedModel.name}</span>
                    {selectedModel.isNew && (
                        <span className="text-[8px] font-bold text-white bg-[#22c55e] px-1.5 py-0.5 rounded-full">
                            NEW
                        </span>
                    )}
                    {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                </button>

                {isOpen && (
                    <div className="absolute left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select AI Model</span>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                            {AI_MODELS.map((model) => {
                                const isSelected = selectedModel.id === model.id;
                                const badgeColor = getModelBadgeColor(model.provider);
                                const providerLabel = getProviderLabel(model.provider);
                                
                                return (
                                    <button
                                        key={model.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(model);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                            isSelected ? 'bg-[#22c55e]/10' : ''
                                        }`}
                                        type="button"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${model.color}`} />
                                                <span className={`text-sm font-medium ${
                                                    isSelected ? 'text-[#22c55e]' : 'text-gray-900'
                                                }`}>
                                                    {model.name}
                                                </span>
                                                {model.isNew && (
                                                    <span className="text-[8px] font-bold text-white bg-[#22c55e] px-1.5 py-0.5 rounded-full">
                                                        NEW
                                                    </span>
                                                )}
                                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${badgeColor}`}>
                                                    {providerLabel}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                            <span className="text-[10px] text-gray-400">Click to select a model for this conversation</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Empty State Component
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-6">
                <FileText className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Your Vault is Empty</h3>
            <p className="text-sm text-slate-500 text-center max-w-md mb-6">
                Get started by creating your first note, importing files, or asking AI to generate content.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    onClick={handleCreateNewNote}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Create Note
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
                >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Upload Files
                </button>
                <button
                    onClick={() => setShowAskAiModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
                >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Ask AI to Create
                </button>
            </div>
        </div>
    );

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden text-slate-800 relative"
        >
            {/* HIDDEN FILE INPUT */}
            <input
                type="file"
                ref={fileInputRef}
                accept=".md,.markdown,.txt,.html,.htm,.pdf,image/*,video/*,audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* TOP VAULT HEADER */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <Network className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">Obsidian Wiki Vault</h2>
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {notes.length} Notes
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Bidirectional links, callouts & interactive node graph
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ModelDropdown />

                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                        <button
                            onClick={() => setViewMode('edit')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                                viewMode === 'edit'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                                viewMode === 'split'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Columns className="w-3.5 h-3.5" />
                            <span>Split</span>
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                                viewMode === 'preview'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                        </button>
                        <button
                            onClick={() => setViewMode('graph')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                                viewMode === 'graph'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Network className="w-3.5 h-3.5" />
                            <span>Graph View</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* AI & QUICK ADD BANNER */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="text-sm">Welcome to Obsidian Wiki</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        <Bot className="w-3 h-3 text-amber-600" />
                        AI Auto-Pilot Enabled
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                        using {selectedModel.name}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setShowAskAiModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-purple-400 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                        title="Ask AI to create a brand-new note on any topic with callouts and wikilinks"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>🤖 Ask AI: Create Note</span>
                    </button>

                    <button
                        onClick={() => handleRunAutoPilot('auto_pilot')}
                        disabled={isAutoPiloting || !activeNote}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-amber-300 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        title="Connect to AI to auto-pilot and enrich active note automatically"
                    >
                        {isAutoPiloting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Auto-Piloting...</span>
                            </>
                        ) : (
                            <>
                                <Bot className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                                <span>✨ AI Auto-Pilot Enrich</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors cursor-pointer"
                        title="Upload HTML, PDF, video, audio, image, or markdown files into vault"
                    >
                        <Upload className="w-3 h-3 text-emerald-600" />
                        <span>+ Upload Files</span>
                    </button>

                    <button
                        onClick={() => handleRunAutoPilot('autolink')}
                        disabled={isAutoPiloting || !activeNote}
                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                        title="Auto detect concepts and convert to [[Wikilinks]] using AI"
                    >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>+ AI Auto-Link Vault</span>
                    </button>

                    <button
                        onClick={() => handleRunAutoPilot('summarize')}
                        disabled={isAutoPiloting || !activeNote}
                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                        title="Generate AI Executive Summary callout using AI"
                    >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>+ AI Summarize</span>
                    </button>

                    <div className="h-4 w-px bg-slate-300 hidden sm:block mx-1" />

                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                        <span className="mr-1">Quick Add:</span>
                        <button
                            onClick={() => insertSnippet('wikilink')}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-slate-300 text-slate-700"
                            disabled={!activeNote}
                        >
                            + [[Wikilink]]
                        </button>
                        <button
                            onClick={() => insertSnippet('note')}
                            className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                            disabled={!activeNote}
                        >
                            + [!NOTE]
                        </button>
                        <button
                            onClick={() => insertSnippet('warning')}
                            className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                            disabled={!activeNote}
                        >
                            + [!WARNING]
                        </button>
                        <button
                            onClick={() => insertSnippet('checkbox')}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-slate-300 text-slate-700"
                            disabled={!activeNote}
                        >
                            + Checkbox
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                {/* LEFT SIDEBAR */}
                <div className="md:col-span-3 bg-white border-r border-slate-200 p-3 flex flex-col justify-between">
                    <div>
                        <div className="relative mb-3">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search vault notes..."
                                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50"
                                disabled={notes.length === 0}
                            />
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3 max-h-20 overflow-y-auto pb-1 text-[11px]">
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`px-2 py-0.5 rounded-full transition-colors ${
                                        selectedTag === tag
                                            ? 'bg-emerald-600 text-white font-medium'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2 mb-3">
                            <button
                                onClick={() => setShowAskAiModal(true)}
                                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:via-indigo-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                                <Bot className="w-4 h-4 text-amber-300 animate-pulse" />
                                <span>🤖 Ask AI: Create Note</span>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleCreateNewNote}
                                    className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ New Note</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                                    title="Upload HTML, PDF, video, audio, image, or markdown files"
                                >
                                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Upload Files</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 overflow-y-auto max-h-[320px] text-xs">
                            {Object.keys(groupedNotes).length === 0 ? (
                                <p className="text-slate-400 text-center py-4 italic">
                                    {notes.length === 0 ? 'No notes yet. Create one!' : 'No matching notes found'}
                                </p>
                            ) : (
                                Object.entries(groupedNotes).map(([cat, catNotes]) => (
                                    <div key={cat} className="space-y-1">
                                        <button
                                            onClick={() => toggleCategory(cat)}
                                            className="w-full flex items-center justify-between text-left font-bold text-slate-500 hover:text-slate-800 text-[11px] uppercase tracking-wider py-1 px-1 rounded hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-1">
                                                <Folder className="w-3.5 h-3.5 text-amber-500" />
                                                <span>{cat}</span>
                                            </div>
                                            {expandedCategories[cat] ? (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            ) : (
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            )}
                                        </button>

                                        {expandedCategories[cat] && (
                                            <div className="pl-2 space-y-0.5">
                                                {catNotes.map(note => {
                                                    const isActive = note.id === activeNoteId;
                                                    return (
                                                        <div
                                                            key={note.id}
                                                            className={`group w-full flex items-center justify-between text-left py-1.5 px-2 rounded-md transition-colors ${
                                                                isActive
                                                                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                                                                    : 'text-slate-600 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <button
                                                                onClick={() => setActiveNoteId(note.id)}
                                                                className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                                                            >
                                                                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                                                <span className="truncate">{note.title}</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteNote(note.id, e)}
                                                                title={`Delete note "${note.title}"`}
                                                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-rose-600 hover:bg-rose-100/80 p-1 rounded transition-all cursor-pointer flex-shrink-0 ml-1"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Obsidian Format: <strong className="text-slate-700">Ready</strong></span>
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Local Vault Active
                        </span>
                    </div>
                </div>

                {/* CENTER/RIGHT WORKSPACE */}
                <div className="md:col-span-9 bg-slate-100 flex flex-col justify-between p-3">
                    {notes.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[420px]">
                            <EmptyState />
                        </div>
                    ) : viewMode === 'graph' ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[420px] flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                    <Network className="w-4 h-4 text-emerald-600" />
                                    <span>Vault Interactive Graph View</span>
                                </h3>
                                <span className="text-xs text-slate-500">Click any node to navigate</span>
                            </div>

                            <div className="relative w-full h-[340px] bg-slate-900 rounded-lg p-4 flex items-center justify-center overflow-hidden">
                                <svg className="w-full h-full">
                                    {notes.map((n1, idx1) => {
                                        const x1 = 120 + (idx1 % 2) * 220 + Math.sin(idx1) * 40;
                                        const y1 = 80 + Math.floor(idx1 / 2) * 140 + Math.cos(idx1) * 30;

                                        return notes.map((n2, idx2) => {
                                            if (idx1 >= idx2) return null;
                                            if (
                                                n1.content.includes(`[[${n2.title}`) ||
                                                n2.content.includes(`[[${n1.title}`)
                                            ) {
                                                const x2 = 120 + (idx2 % 2) * 220 + Math.sin(idx2) * 40;
                                                const y2 = 80 + Math.floor(idx2 / 2) * 140 + Math.cos(idx2) * 30;

                                                return (
                                                    <line
                                                        key={`edge-${n1.id}-${n2.id}`}
                                                        x1={x1}
                                                        y1={y1}
                                                        x2={x2}
                                                        y2={y2}
                                                        stroke="#059669"
                                                        strokeWidth="2"
                                                        strokeDasharray="4"
                                                        opacity="0.6"
                                                    />
                                                );
                                            }
                                            return null;
                                        });
                                    })}

                                    {notes.map((n, idx) => {
                                        const cx = 120 + (idx % 2) * 220 + Math.sin(idx) * 40;
                                        const cy = 80 + Math.floor(idx / 2) * 140 + Math.cos(idx) * 30;
                                        const isSelected = n.id === activeNoteId;

                                        return (
                                            <g
                                                key={n.id}
                                                onClick={() => {
                                                    setActiveNoteId(n.id);
                                                    setViewMode('split');
                                                }}
                                                className="cursor-pointer group"
                                            >
                                                <circle
                                                    cx={cx}
                                                    cy={cy}
                                                    r={isSelected ? 18 : 14}
                                                    fill={isSelected ? '#10b981' : '#334155'}
                                                    stroke={isSelected ? '#34d399' : '#64748b'}
                                                    strokeWidth="3"
                                                    className="transition-all duration-300 group-hover:scale-125"
                                                />
                                                <text
                                                    x={cx}
                                                    y={cy + 30}
                                                    textAnchor="middle"
                                                    fill="#f8fafc"
                                                    fontSize="11"
                                                    fontWeight={isSelected ? 'bold' : 'normal'}
                                                >
                                                    {n.title}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-[420px]">
                            {(viewMode === 'edit' || viewMode === 'split') && activeNote && (
                                <div
                                    className={`bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-3.5 flex flex-col justify-between ${
                                        viewMode === 'edit' ? 'lg:col-span-2' : ''
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-xs">
                                            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                                                <Edit3 className="w-3.5 h-3.5" />
                                                Markdown Editor
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-[11px] hidden sm:inline">
                                                    Supports <code className="text-emerald-300">[[Wikilinks]]</code>
                                                </span>
                                                {activeNote && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-[11px] font-medium transition-colors cursor-pointer"
                                                            title="Upload and attach HTML, video, audio, PDF, image, or markdown file"
                                                        >
                                                            <Upload className="w-3 h-3 text-emerald-400" />
                                                            <span>Attach Media / File</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteNote(activeNote.id)}
                                                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-[11px] font-medium transition-colors cursor-pointer"
                                                            title={`Delete current note "${activeNote.title}"`}
                                                        >
                                                            <Trash2 className="w-3 h-3 text-rose-400" />
                                                            <span>Delete Note</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {activeNote && (
                                            <div className="space-y-2.5">
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                                        Note Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={activeNote.title}
                                                        onChange={e => updateActiveNote('title', e.target.value)}
                                                        className="w-full text-sm font-bold bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                                            Category
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={activeNote.category}
                                                            onChange={e => updateActiveNote('category', e.target.value)}
                                                            className="w-full text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                                            Tags (comma separated)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={activeNote.tags.join(', ')}
                                                            onChange={e =>
                                                                updateActiveNote(
                                                                    'tags',
                                                                    e.target.value.split(',').map(t => t.trim())
                                                                )
                                                            }
                                                            className="w-full text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                                                        />
                                                    </div>
                                                </div>

                                                {/* AI Auto-Pilot Control Dock with Model Selector */}
                                                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-2 my-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                                                            <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
                                                            <span>AI Auto-Pilot Assistant</span>
                                                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
                                                                {selectedModel.name}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <ModelDropdown />
                                                            <button
                                                                onClick={() => setShowCustomInstructionModal(true)}
                                                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
                                                            >
                                                                <Sliders className="w-3 h-3 text-amber-400" />
                                                                <span>Custom Prompt...</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                        <button
                                                            onClick={() => handleRunAutoPilot('auto_pilot')}
                                                            disabled={isAutoPiloting}
                                                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <Zap className="w-3 h-3" />
                                                            <span>Auto-Pilot Enrich</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleRunAutoPilot('autolink')}
                                                            disabled={isAutoPiloting}
                                                            className="px-2.5 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <Sparkles className="w-3 h-3 text-purple-400" />
                                                            <span>Auto-Link Concepts</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleRunAutoPilot('summarize')}
                                                            disabled={isAutoPiloting}
                                                            className="px-2.5 py-1 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <Sparkles className="w-3 h-3 text-blue-400" />
                                                            <span>AI Summarize</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleRunAutoPilot('callouts')}
                                                            disabled={isAutoPiloting}
                                                            className="px-2.5 py-1 rounded bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-700 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <Info className="w-3 h-3 text-sky-400" />
                                                            <span>Structure Callouts</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleRunAutoPilot('subtopics')}
                                                            disabled={isAutoPiloting}
                                                            className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <Plus className="w-3 h-3 text-emerald-400" />
                                                            <span>Generate Related Stub Notes</span>
                                                        </button>
                                                    </div>

                                                    {isAutoPiloting && (
                                                        <div className="flex items-center gap-2 p-2 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 font-medium animate-pulse">
                                                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                                                            <span>{autoPilotStatus}</span>
                                                        </div>
                                                    )}

                                                    {autoPilotSummary && (
                                                        <div className="flex items-center justify-between p-2 rounded bg-emerald-950/50 border border-emerald-800/80 text-xs text-emerald-300 font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                                <span>{autoPilotSummary}</span>
                                                            </div>
                                                            <button onClick={() => setAutoPilotSummary('')} className="text-emerald-400 hover:text-white ml-2">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {autoPilotError && (
                                                        <div className="flex items-center justify-between p-2 rounded bg-rose-950/50 border border-rose-800/80 text-xs text-rose-300 font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                                                <span>{autoPilotError}</span>
                                                            </div>
                                                            <button onClick={() => setAutoPilotError('')} className="text-rose-400 hover:text-white ml-2">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                                        Note Content (Obsidian Markdown)
                                                    </label>
                                                    <textarea
                                                        value={activeNote.content}
                                                        onChange={e => updateActiveNote('content', e.target.value)}
                                                        rows={12}
                                                        className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg p-3 text-emerald-300 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(viewMode === 'preview' || viewMode === 'split') && activeNote && (
                                <div
                                    className={`bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between overflow-y-auto ${
                                        viewMode === 'preview' ? 'lg:col-span-2' : ''
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 text-xs">
                                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                                Live Obsidian Render
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-600 font-medium text-[11px]">
                                                    Interactive Links
                                                </span>
                                                {activeNote && viewMode === 'preview' && (
                                                    <button
                                                        onClick={() => handleDeleteNote(activeNote.id)}
                                                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-medium transition-colors cursor-pointer"
                                                        title={`Delete note "${activeNote.title}"`}
                                                    >
                                                        <Trash2 className="w-3 h-3 text-rose-600" />
                                                        <span>Delete Note</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {activeNote && (
                                            <div className="prose prose-slate max-w-none">
                                                {renderObsidianMarkdown(activeNote.content)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!activeNote && notes.length > 0 && (
                                <div className="lg:col-span-2 flex items-center justify-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 min-h-[420px]">
                                    <div className="text-center">
                                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <p className="text-slate-600 font-medium">Select a note to view or edit</p>
                                        <p className="text-sm text-slate-400">Click on any note in the sidebar to get started</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BACKLINKS BOTTOM PANEL */}
                    {activeNote && notes.length > 0 && (
                        <div className="mt-3 bg-white rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 mb-2">
                                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                    Linked Backlinks to "{activeNote.title}" ({backlinks.length})
                                </span>
                            </div>

                            {backlinks.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No other notes currently link to this note.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2 text-xs">
                                    {backlinks.map(bNote => (
                                        <button
                                            key={bNote.id}
                                            onClick={() => setActiveNoteId(bNote.id)}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-colors text-slate-700 font-medium"
                                        >
                                            <FileText className="w-3 h-3 text-emerald-600" />
                                            <span>{bNote.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SAVE VAULT BAR */}
                    <div className="mt-3 bg-white rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h4 className="font-bold text-sm text-slate-900">Save Obsidian Vault & Generate Page</h4>
                            {saveMessage && <span className="text-xs font-semibold text-emerald-600 ml-2">{saveMessage}</span>}
                            {saveError && <span className="text-xs font-semibold text-rose-600 ml-2">{saveError}</span>}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveVault}
                                disabled={isSaving || notes.length === 0}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <span>Saving Vault...</span>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Save Vault & Export</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CUSTOM AI AUTO-PILOT PROMPT MODAL */}
            {showCustomInstructionModal && activeNote && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">AI Auto-Pilot Custom Instructions</h3>
                                    <p className="text-xs text-slate-500">Direct AI on how to enrich "{activeNote?.title}"</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCustomInstructionModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Custom Prompt or Focus Areas
                            </label>
                            <textarea
                                value={customInstruction}
                                onChange={e => setCustomInstruction(e.target.value)}
                                placeholder="E.g., Add a section on system architecture, create code examples in TypeScript, add Obsidian callouts and link to existing vault notes..."
                                rows={4}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">Using:</span>
                                <span className="font-semibold text-amber-600">{selectedModel.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowCustomInstructionModal(false)}
                                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleRunAutoPilot('auto_pilot', customInstruction)}
                                    disabled={isAutoPiloting}
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {isAutoPiloting ? (
                                        <span>Processing...</span>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Run AI Auto-Pilot</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE NOTE POPUP MODAL */}
            {noteToDeleteId && (() => {
                const targetNote = notes.find(n => n.id === noteToDeleteId);
                if (!targetNote) return null;
                return (
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                        onClick={() => setNoteToDeleteId(null)}
                    >
                        <div 
                            className="bg-white rounded-2xl border border-rose-100 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800 animate-in zoom-in-95 duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 text-base">Delete Note from Vault</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Are you sure you want to delete <span className="font-semibold text-slate-800">"{targetNote.title}"</span> from your Obsidian vault? This action cannot be undone.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setNoteToDeleteId(null)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                                <span className="font-medium truncate max-w-[200px]">{targetNote.title}</span>
                                <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[10px] font-mono font-bold uppercase">
                                    {targetNote.category || 'GENERAL'}
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 text-xs">
                                <button
                                    onClick={() => setNoteToDeleteId(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteNote}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Note</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ASK AI CREATE NOTE MODAL */}
            {showAskAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#161a24] border border-slate-200 dark:border-[#282d3c] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden font-sans">
                        <div className="px-5 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-purple-800/50">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-amber-300">
                                    <Bot className="w-5 h-5 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                                        <span>Ask AI: Create Note</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                            {selectedModel.name}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-purple-200">
                                        Enter any topic and AI will write structured notes with callouts & wikilinks
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAskAiModal(false);
                                    setAskAiError('');
                                }}
                                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                            {askAiError && (
                                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{askAiError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Topic or Note Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={askAiTopic}
                                    onChange={e => setAskAiTopic(e.target.value)}
                                    placeholder="e.g. Quantum Computing Fundamentals, React 19 Server Components..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#282d3c] bg-slate-50 dark:bg-[#11141c] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium placeholder:text-slate-400"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAskAiCreateNote();
                                        }
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Popular Topics
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        '⚡ React 19 Server Components',
                                        '🚀 Quantum Computing Basics',
                                        '🛡️ Cybersecurity Best Practices',
                                        '🧠 Deep Learning Architecture',
                                        '📈 SaaS Product Metrics',
                                        '🧬 CRISPR Gene Editing'
                                    ].map(preset => {
                                        const cleanTopic = preset.replace(/^[^\w\s]+\s*/, '');
                                        return (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setAskAiTopic(cleanTopic)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors text-left cursor-pointer"
                                            >
                                                {preset}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Category (Optional)
                                </label>
                                <select
                                    value={askAiCategory}
                                    onChange={e => setAskAiCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#282d3c] bg-slate-50 dark:bg-[#11141c] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                                >
                                    <option value="GENERAL">GENERAL</option>
                                    <option value="PROGRAMMING">PROGRAMMING</option>
                                    <option value="PROJECTS">PROJECTS</option>
                                    <option value="RESEARCH">RESEARCH</option>
                                    <option value="STRATEGY">STRATEGY</option>
                                    <option value="WIKI CONCEPTS">WIKI CONCEPTS</option>
                                    <option value="GETTING STARTED">GETTING STARTED</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Additional Instructions (Optional)
                                </label>
                                <textarea
                                    value={askAiInstructions}
                                    onChange={e => setAskAiInstructions(e.target.value)}
                                    placeholder="e.g. Include code snippets, emphasize key formulas, use warning callouts..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#282d3c] bg-slate-50 dark:bg-[#11141c] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium placeholder:text-slate-400"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="askAiSubtopics"
                                    checked={askAiCreateSubtopics}
                                    onChange={e => setAskAiCreateSubtopics(e.target.checked)}
                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700"
                                />
                                <label htmlFor="askAiSubtopics" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Auto-generate connected sub-topic notes to expand knowledge graph
                                </label>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-[#11141c] p-2 rounded-lg">
                                <Bot className="w-3 h-3 text-purple-400" />
                                <span>Using AI model: <strong className="text-purple-600 dark:text-purple-400">{selectedModel.name}</strong></span>
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-slate-100 dark:bg-[#11141c] border-t border-slate-200 dark:border-[#282d3c] flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAskAiModal(false);
                                    setAskAiError('');
                                }}
                                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAskAiCreateNote()}
                                disabled={isGeneratingNote || !askAiTopic.trim()}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isGeneratingNote ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                                        <span>Generating Note...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-amber-300" />
                                        <span>✨ Generate Note with {selectedModel.name}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}