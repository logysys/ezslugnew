import React, { useState, useMemo, useEffect } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import {
  Copy,
  Check,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  Clock,
  BookOpen,
  Tag,
  Share2
} from 'lucide-react';

interface WikiPreviewProps {
  query?: string;
  fileData?: any[];
  socialMediaMetadata?: any;
  created_at?: string;
  className?: string;
}

interface WikiNoteItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  url?: string;
}

export default function WikiPreview({
  query = '',
  fileData = [],
  socialMediaMetadata = {},
  created_at,
  className = ''
}: WikiPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);

  // Check if content contains full HTML document
  const hasFullHtmlDoc = useMemo(() => {
    return query.includes('<!DOCTYPE html>') || 
           query.includes('<html>') || 
           query.includes('<html ');
  }, [query]);

  // Parse notes from fileData or query
  const notes: WikiNoteItem[] = useMemo(() => {
    // 1. From fileData array if available
    if (Array.isArray(fileData) && fileData.length > 0) {
      const parsedFromFileData = fileData
        .filter((f) => f && (f.content || f.title || f.url))
        .map((f, idx) => ({
          id: f.id || `file-${idx}`,
          title: f.title || f.name || `Note ${idx + 1}`,
          content: f.content || '',
          category: f.category || 'WIKI',
          tags: Array.isArray(f.tags) ? f.tags : (typeof f.tags === 'string' ? f.tags.split(',').map((t: string) => t.trim()) : []),
          url: f.url
        }));

      if (parsedFromFileData.length > 0) {
        return parsedFromFileData;
      }
    }

    // 2. From query string
    if (query && query.trim().length > 0) {
      // Check if multiple ## headings
      if (query.includes('## ')) {
        const sections = query.split(/\n(?=##\s+)/g);
        const parsedSections: WikiNoteItem[] = [];

        sections.forEach((sec, idx) => {
          const lines = sec.trim().split('\n');
          const titleLine = lines.find((l) => l.startsWith('## ')) || lines.find((l) => l.startsWith('# '));
          
          if (titleLine) {
            const title = titleLine.replace(/^#+\s*/, '').trim();
            const contentLines = lines.filter((l) => !l.startsWith('## '));
            const content = contentLines.join('\n').trim();

            if (title) {
              parsedSections.push({
                id: `sec-${idx}`,
                title,
                content: content || sec,
                category: 'WIKI',
                tags: ['wiki', 'documentation']
              });
            }
          }
        });

        if (parsedSections.length > 0) {
          return parsedSections;
        }
      }

      // Single note
      const fallbackTitle = socialMediaMetadata?.wiki_title || 'Wiki Document';
      return [
        {
          id: 'single-note',
          title: fallbackTitle,
          content: query,
          category: 'WIKI',
          tags: ['wiki', 'documentation']
        }
      ];
    }

    // Default fallback empty state
    return [
      {
        id: 'default-empty',
        title: 'Wiki Document',
        content: '*No wiki content available.*',
        category: 'WIKI'
      }
    ];
  }, [fileData, query, socialMediaMetadata]);

  const currentNote = notes[activeNoteIndex] || notes[0] || { title: 'Wiki', content: '' };

  const handleCopyContent = () => {
    if (!currentNote.content) return;
    navigator.clipboard.writeText(currentNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    if (!currentNote.content) return;
    const blob = new Blob([currentNote.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentNote.title.replace(/[^a-z0-9_-]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Word count & Reading time calculations
  const stats = useMemo(() => {
    const text = currentNote.content || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, readTime };
  }, [currentNote.content]);

  // Render content with proper HTML/iframe support for full HTML documents
  const renderContent = () => {
    if (hasFullHtmlDoc) {
      // For full HTML documents, render inside an iframe for proper isolation
      return (
        <div className="wiki-html-preview rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-2">
                HTML Preview
              </span>
            </div>
            <a 
              href={`data:text/html;charset=utf-8,${encodeURIComponent(currentNote.content)}`}
              download="wiki-page.html"
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Download HTML
            </a>
          </div>
          <iframe
            srcDoc={currentNote.content}
            className="w-full min-h-[500px] border-0"
            style={{ height: 'auto', minHeight: '500px', backgroundColor: '#ffffff' }}
            title="Wiki HTML Preview"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            loading="lazy"
          />
        </div>
      );
    }

    // Regular markdown preview with custom image rendering
    return (
      <MarkdownPreview
        source={currentNote.content}
        style={{
          backgroundColor: 'transparent',
          color: 'inherit',
          fontSize: '0.95rem',
          lineHeight: '1.7'
        }}
        wrapperElement={{
          'data-color-mode': 'auto'
        }}
        components={{
          img: ({ node, ...props }) => (
            <div className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-black/5">
              <img {...props} className="w-full max-h-[450px] object-cover" alt={props.alt || 'Preview Image'} />
              {props.alt && (
                <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span>📷 {props.alt}</span>
                  <span className="text-[10px] uppercase font-bold text-blue-600">IMAGE PREVIEW</span>
                </div>
              )}
            </div>
          ),
          iframe: ({ node, ...props }) => (
            <div className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
              <iframe {...props} className="w-full min-h-[400px] border-0" title="Embedded Content" />
            </div>
          ),
          video: ({ node, ...props }) => (
            <div className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-black/5">
              <video {...props} className="w-full max-h-[500px]" controls />
            </div>
          ),
          audio: ({ node, ...props }) => (
            <div className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm p-4 bg-gray-50 dark:bg-gray-900">
              <audio {...props} className="w-full" controls />
            </div>
          )
        }}
      />
    );
  };

  return (
    <div className={`wiki-preview-container w-full max-w-5xl mx-auto my-2 text-gray-900 dark:text-gray-100 ${className}`}>
      {/* MULTI-NOTE SELECTOR TAB (Only if more than 1 note exists) */}
      {notes.length > 1 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 border-b border-gray-200 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 shrink-0">
            Notes:
          </span>
          {notes.map((note, idx) => (
            <button
              key={note.id || idx}
              onClick={() => setActiveNoteIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeNoteIndex === idx
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{note.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* PURE WIKI DOCUMENT PREVIEW CARD - NO HEADER, NO LEFT SIDEBAR */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm transition-all relative">
        {/* TOP RIGHT COMPACT ACTION TOOLBAR */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-100 dark:border-gray-800">
          {/* Note Metadata Header */}
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white truncate">
              {currentNote.title}
            </h1>
            {currentNote.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                {currentNote.category}
              </span>
            )}
            {created_at && (
              <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3" />
                {created_at}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyContent}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Copy Markdown content"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadMd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Download as .md file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* TAGS (if present) */}
        {currentNote.tags && currentNote.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {currentNote.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="wiki-markdown-body prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed">
          {renderContent()}
        </div>

        {/* FOOTER STATS */}
        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>{stats.words} words</span>
            <span>•</span>
            <span>{stats.readTime} min read</span>
            {hasFullHtmlDoc && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400">HTML Document</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Wiki Note</span>
          </div>
        </div>
      </div>
    </div>
  );
}