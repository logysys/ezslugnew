import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import {
  FileText,
  Split,
  Code,
  Eye,
  FolderOpen,
  Sparkles,
  Upload,
  Download,
  Copy,
  Check,
  Sun,
  Moon,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Minus,
  FileCode,
  File,
  Video,
  Music,
  Globe,
  Clock,
  Maximize2,
  ExternalLink,
  PlayCircle,
  Volume2,
  FileCheck,
  Database,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface WikiEditorPanelProps {
  canInteract: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  initialContent?: string;
  customSlug?: string;
  conversationId?: string;
  messageId?: number | string;
  onSaveSuccess?: (data: any) => void;
}

const DEFAULT_SAMPLE_CONTENT = `## 📌 Alert Callouts

<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 1rem; margin-bottom: 1rem; border-radius: 0 8px 8px 0;">
  <strong style="color: #15803d;">✅ Tip:</strong> Embed live previews for PDF documents, Images, Videos, Audio tracks, and HTML elements directly in this Wiki editor.
</div>

<div style="background: #fffbebf1; border-left: 4px solid #f59e0b; padding: 1rem; margin-bottom: 1.5rem; border-radius: 0 8px 8px 0;">
  <strong style="color: #b45309;">⚠️ Warning:</strong> Ensure media links use HTTPS to prevent mixed-content blocking in modern browsers.
</div>

---

### 📷 1. Image Preview
![Modern Architecture Showcase](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800)

---

### 📄 2. PDF Document Preview
<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; background: #ffffff;">
  <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-weight: 600; font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px;">
      📄 W3C Architecture Diagram Document (PDF)
    </span>
    <a href="https://www.w3.org/W3C/DesignIssues/Diagrams.pdf" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; font-size: 12px; font-weight: 600;">Open PDF ↗</a>
  </div>
  <iframe src="https://docs.google.com/viewer?url=https://www.w3.org/W3C/DesignIssues/Diagrams.pdf&embedded=true" width="100%" height="420px" style="border: none;"></iframe>
</div>

---

### 🎥 3. Video Preview
<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; background: #0f172a;">
  <div style="background: #1e293b; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; color: white;">
    <span style="font-weight: 600; font-size: 13px;">🎥 High Definition Sample Video</span>
    <span style="font-size: 11px; background: #334155; padding: 2px 8px; border-radius: 4px; color: #cbd5e1;">1080p MP4</span>
  </div>
  <video controls width="100%" style="max-height: 380px; display: block; outline: none;" poster="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800">
    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4">
    Your browser does not support video playback.
  </video>
</div>

---

### 🎵 4. Audio Track Preview
<div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); shadow: 0 2px 4px rgba(0,0,0,0.02);">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 36px; height: 36px; background: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
        🎵
      </div>
      <div>
        <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">Sample Sound Helix Track 1</h4>
        <p style="margin: 0; font-size: 12px; color: #64748b;">High-quality MP3 Audio Stream</p>
      </div>
    </div>
    <span style="font-size: 11px; background: #d1fae5; color: #065f46; font-weight: 600; padding: 2px 8px; border-radius: 12px;">MP3 Audio</span>
  </div>
  <audio controls style="width: 100%; border-radius: 8px; outline: none;">
    <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg">
    Your browser does not support audio playback.
  </audio>
</div>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample HTML Page</title>
  <!-- Font Awesome for icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    .sample-card {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .sample-nav {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      color: #3b82f6;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="sample-card">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 40px; height: 40px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">
        S
      </div>
      <div>
        <h3 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 700;">Sample Component</h3>
        <p style="margin: 2px 0 0 0; color: #64748b; font-size: 13px;">clean • modern • responsive</p>
      </div>
    </div>
    <div class="sample-nav">
      <span><i class="fa fa-home"></i> Home</span>
      <span><i class="fa fa-info-circle"></i> About</span>
      <span><i class="fa fa-cogs"></i> Services</span>
      <span><i class="fa fa-envelope"></i> Contact</span>
    </div>
  </div>
</body>
</html>
`;

export default function WikiEditorPanel({
  canInteract,
  setShowLoginPrompt,
  initialContent,
  customSlug,
  conversationId,
  messageId,
  onSaveSuccess
}: WikiEditorPanelProps) {
  const [docTitle, setDocTitle] = useState('Technical Documentation & Guides.md');
  const [content, setContent] = useState(initialContent || '');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showSamplesModal, setShowSamplesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Database Save States
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [saveDbSuccess, setSaveDbSuccess] = useState<string | null>(null);
  const [saveDbError, setSaveDbError] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  // Upload modal states
  const [mediaType, setMediaType] = useState<'image' | 'pdf' | 'video' | 'audio'>('image');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTitleInput, setMediaTitleInput] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Handle saving wiki directly to AISearchHistory table in database
  const handleSaveToDatabase = async () => {
    if (!canInteract) {
      setShowLoginPrompt(true);
      return;
    }

    if (!content.trim()) {
      setSaveDbError('Cannot save empty Wiki content');
      return;
    }

    setIsSavingDb(true);
    setSaveDbSuccess(null);
    setSaveDbError(null);

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const cleanTitle = docTitle.replace(/\.md$/i, '').replace(/\.html$/i, '').trim() || 'Wiki Document';

      const response = await axios.post('/content/wiki', {
        title: cleanTitle,
        content: content,
        notes: [
          {
            title: cleanTitle,
            content: content,
            category: 'WIKI',
            tags: ['wiki', 'documentation']
          }
        ],
        custom_slug: customSlug || undefined,
        conversation_id: conversationId || undefined,
        message_id: messageId || undefined,
      }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken
        }
      });

      if (response.data && response.data.success) {
        const slug = response.data.slug;
        setSavedSlug(slug);
        setSaveDbSuccess(`Wiki successfully saved! ${slug ? `(Slug: ${slug})` : ''}`);

        if (onSaveSuccess) {
          onSaveSuccess(response.data);
          if (slug && window.location.pathname !== `/X/${slug}` && window.location.pathname !== `/X/${encodeURIComponent(slug)}`) {
            window.history.pushState({}, '', `/X/${encodeURIComponent(slug)}`);
          }
        } else if (slug) {
          const targetUrl = `/X/${encodeURIComponent(slug)}`;
          setTimeout(() => {
            try {
              router.visit(targetUrl);
            } catch (e) {
              window.location.href = targetUrl;
            }
          }, 600);
        }
      } else {
        setSaveDbError(response.data?.message || 'Failed to save Wiki to AISearchHistory DB');
      }
    } catch (err: any) {
      console.error('Save to AISearchHistory error:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setSaveDbError(err.response.data.message);
      } else {
        setSaveDbError('Failed to save Wiki to database. Please check your network or session.');
      }
    } finally {
      setIsSavingDb(false);
    }
  };

  // Auto save timestamp update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastAutoSave(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [content]);

  // Sync scroll of line numbers and textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const lines = content.split('\n').length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { lines, words, chars, readTime };
  }, [content]);

  // Line numbers generation
  const lineNumbers = useMemo(() => {
    const count = Math.max(stats.lines, 1);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [stats.lines]);

  // Insert helper at cursor position
  const insertText = (before: string, after: string = '') => {
    if (!canInteract) {
      setShowLoginPrompt(true);
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + selectedText + after;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 10);
  };

  // Preset Embed Insertions
  const handleEmbed = (type: 'md' | 'image' | 'pdf' | 'video' | 'audio' | 'html') => {
    switch (type) {
      case 'md':
        insertText(
          '\n<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0;">\n  <strong style="color: #15803d;">💡 Note:</strong> Write your markdown note here...\n</div>\n'
        );
        break;
      case 'image':
        insertText('\n![Sample Image Preview](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800)\n');
        break;
      case 'pdf':
        insertText(
          `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; background: #ffffff;">\n  <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">\n    <span style="font-weight: 600; font-size: 13px; color: #334155;">📄 Embedded PDF Document</span>\n    <a href="https://www.w3.org/W3C/DesignIssues/Diagrams.pdf" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; font-size: 12px; font-weight: 600;">Open PDF ↗</a>\n  </div>\n  <iframe src="https://docs.google.com/viewer?url=https://www.w3.org/W3C/DesignIssues/Diagrams.pdf&embedded=true" width="100%" height="450px" style="border: none;"></iframe>\n</div>\n`
        );
        break;
      case 'video':
        insertText(
          `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; background: #000000;">\n  <div style="background: #1e293b; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; color: white;">\n    <span style="font-weight: 600; font-size: 13px;">🎥 Embedded Video Preview</span>\n  </div>\n  <video controls width="100%" style="max-height: 380px; display: block;">\n    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4">\n    Your browser does not support video playback.\n  </video>\n</div>\n`
        );
        break;
      case 'audio':
        insertText(
          `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; background: #f8fafc;">\n  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">\n    <span style="font-size: 18px;">🎵</span>\n    <span style="font-weight: 600; font-size: 14px; color: #1e293b;">Audio Track Preview</span>\n  </div>\n  <audio controls style="width: 100%;">\n    <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg">\n    Your browser does not support audio playback.\n  </audio>\n</div>\n`
        );
        break;
      case 'html':
        insertText(
          '\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff;">\n  <h4 style="margin: 0 0 8px 0; color: #2563eb;">Embedded HTML Component</h4>\n  <p style="margin: 0; color: #475569; font-size: 14px;">This block is rendered directly via HTML5.</p>\n</div>\n'
        );
        break;
    }
  };

  // Local file open handler for document
  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocTitle(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setContent(text);
    };
    reader.readAsText(file);
  };

  // Local media upload handler
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canInteract) {
      setShowLoginPrompt(true);
      return;
    }

    const fileName = file.name;
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    // Upload file directly to /content/wiki/upload-file endpoint (stored in upload/wiki)
    let serverUrl = '';
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await axios.post('/content/wiki/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRF-TOKEN': csrfToken
        }
      });

      if (uploadRes.data && uploadRes.data.success && uploadRes.data.url) {
        serverUrl = uploadRes.data.url;
      }
    } catch (uploadErr) {
      console.warn('Wiki media upload failed, using fallback object URL:', uploadErr);
    }

    const fileUrl = serverUrl || URL.createObjectURL(file);

    if (extension === '.html' || extension === '.htm' || file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const htmlText = event.target?.result as string;
        if (htmlText) {
          insertText(`\n<!-- Embedded HTML Document (${fileName}) -->\n${htmlText}\n`);
        }
      };
      reader.readAsText(file);
    } else if (extension === '.md' || extension === '.markdown' || file.type === 'text/markdown') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const mdText = event.target?.result as string;
        if (mdText) {
          insertText(`\n${mdText}\n`);
        }
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      insertText(`\n![${fileName}](${fileUrl})\n`);
    } else if (file.type === 'application/pdf' || extension === '.pdf') {
      insertText(
        `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; background: #ffffff;">\n  <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">\n    <span style="font-weight: 600; font-size: 13px; color: #334155;">📄 ${fileName}</span>\n    <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-size: 12px; font-weight: 600;">Open PDF ↗</a>\n  </div>\n  <iframe src="${fileUrl}" width="100%" height="480px" style="border: none;"></iframe>\n</div>\n`
      );
    } else if (file.type.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].includes(extension)) {
      insertText(
        `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; background: #0f172a;">\n  <div style="background: #1e293b; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; color: white;">\n    <span style="font-weight: 600; font-size: 13px;">🎥 ${fileName}</span>\n    <span style="font-size: 11px; background: #334155; padding: 2px 8px; border-radius: 4px; color: #cbd5e1;">Uploaded Video</span>\n  </div>\n  <video controls src="${fileUrl}" width="100%" style="max-height: 420px; display: block; outline: none; background: #000000;">\n    <source src="${fileUrl}" type="${file.type || 'video/mp4'}">\n    Your browser does not support video playback.\n  </video>\n</div>\n`
      );
    } else if (file.type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(extension)) {
      insertText(
        `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0;">\n  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">\n    <div style="display: flex; align-items: center; gap: 10px;">\n      <div style="width: 36px; height: 36px; background: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">🎵</div>\n      <div>\n        <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${fileName}</h4>\n        <p style="margin: 0; font-size: 12px; color: #64748b;">Uploaded Audio Stream</p>\n      </div>\n    </div>\n    <span style="font-size: 11px; background: #d1fae5; color: #065f46; font-weight: 600; padding: 2px 8px; border-radius: 12px;">Audio Track</span>\n  </div>\n  <audio controls src="${fileUrl}" style="width: 100%; border-radius: 8px; outline: none;">\n    <source src="${fileUrl}" type="${file.type || 'audio/mpeg'}">\n    Your browser does not support audio playback.\n  </audio>\n</div>\n`
      );
    } else {
      insertText(`\n[${fileName}](${fileUrl})\n`);
    }

    if (e.target) {
      e.target.value = '';
    }

    setShowUploadModal(false);
  };

  const handleInsertMediaUrl = () => {
    if (!mediaUrlInput.trim()) return;
    const url = mediaUrlInput.trim();
    const title = mediaTitleInput.trim() || 'Uploaded Media';

    switch (mediaType) {
      case 'image':
        insertText(`\n![${title}](${url})\n`);
        break;
      case 'pdf':
        insertText(
          `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; background: #ffffff;">\n  <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">\n    <span style="font-weight: 600; font-size: 13px; color: #334155;">📄 ${title}</span>\n    <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-size: 12px; font-weight: 600;">Open PDF ↗</a>\n  </div>\n  <iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true" width="100%" height="450px" style="border: none;"></iframe>\n</div>\n`
        );
        break;
      case 'video':
        insertText(
          `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0; background: #0f172a;">\n  <div style="background: #1e293b; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; color: white;">\n    <span style="font-weight: 600; font-size: 13px;">🎥 ${title}</span>\n    <span style="font-size: 11px; background: #334155; padding: 2px 8px; border-radius: 4px; color: #cbd5e1;">Video Preview</span>\n  </div>\n  <video controls src="${url}" width="100%" style="max-height: 400px; display: block; background: #000000;">\n    <source src="${url}" type="video/mp4">\n    Your browser does not support video playback.\n  </video>\n</div>\n`
        );
        break;
      case 'audio':
        insertText(
          `\n<div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0;">\n  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">\n    <div style="display: flex; align-items: center; gap: 10px;">\n      <div style="width: 36px; height: 36px; background: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">🎵</div>\n      <div>\n        <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${title}</h4>\n        <p style="margin: 0; font-size: 12px; color: #64748b;">Audio Stream</p>\n      </div>\n    </div>\n    <span style="font-size: 11px; background: #d1fae5; color: #065f46; font-weight: 600; padding: 2px 8px; border-radius: 12px;">Audio</span>\n  </div>\n  <audio controls src="${url}" style="width: 100%; border-radius: 8px; outline: none;">\n    <source src="${url}" type="audio/mpeg">\n    Your browser does not support audio playback.\n  </audio>\n</div>\n`
        );
        break;
    }

    setMediaUrlInput('');
    setMediaTitleInput('');
    setShowUploadModal(false);
  };

  // Export handlers
  const handleExportMd = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docTitle.endsWith('.md') ? docTitle : `${docTitle}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleExportHtml = () => {
    const htmlWrapper = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #3b82f6; margin: 0; padding-left: 16px; color: #475569; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
    const blob = new Blob([htmlWrapper], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle.replace(/\.[^/.]+$/, '')}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract HTML block or preview parts if present
  const renderLivePreview = () => {
    const hasFullHtmlDoc =
      content.includes('<!DOCTYPE html>') ||
      content.includes('<html');

    if (hasFullHtmlDoc) {
      const htmlStartIdx = content.search(/<!DOCTYPE html>|<html/i);
      const markdownPart = htmlStartIdx !== -1 ? content.substring(0, htmlStartIdx) : '';
      const htmlPart = htmlStartIdx !== -1 ? content.substring(htmlStartIdx) : content;

      // Render HTML inside an iframe for proper isolation and rendering
      return (
        <div className="space-y-6">
          {markdownPart.trim() && (
            <MarkdownPreview
              source={markdownPart}
              style={{
                backgroundColor: 'transparent',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
              wrapperElement={{ 'data-color-mode': isDarkMode ? 'dark' : 'light' }}
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
                )
              }}
            />
          )}

          {/* Interactive Window / Media Preview Frame - Using iframe for proper HTML rendering */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-md transition-all">
            {/* Window Title Bar */}
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-2">
                  Interactive Media & HTML Live Preview
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 uppercase tracking-wider">
                LIVE MEDIA RENDER
              </span>
            </div>

            {/* Content Render - Using iframe for proper HTML rendering */}
            <div className="p-0 overflow-auto min-h-[220px]">
              <iframe
                srcDoc={htmlPart}
                className="w-full min-h-[400px] border-0"
                style={{ height: 'auto', minHeight: '400px', backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff' }}
                title="HTML Preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <MarkdownPreview
        source={content}
        style={{
          backgroundColor: 'transparent',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
        wrapperElement={{ 'data-color-mode': isDarkMode ? 'dark' : 'light' }}
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
          )
        }}
      />
    );
  };

  return (
    <div className={`w-full rounded-2xl border transition-colors duration-200 shadow-xl ${
      isDarkMode ? 'bg-gray-950 border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      {/* HEADER BAR */}
      <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Badge */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="text-base md:text-lg font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none transition-colors px-1 text-gray-900 dark:text-white max-w-xs sm:max-w-md truncate"
            />
            <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 font-bold text-[11px] tracking-wider uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              LIVE EDITOR
            </span>
          </div>

          {/* Format Sub-tags */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 pl-1">
            <span className="hover:text-purple-600 transition-colors cursor-default">Markdown</span>
            <span>•</span>
            <span className="hover:text-purple-600 transition-colors cursor-default">PDF Preview</span>
            <span>•</span>
            <span className="hover:text-purple-600 transition-colors cursor-default">Image Preview</span>
            <span>•</span>
            <span className="hover:text-purple-600 transition-colors cursor-default">Video Player</span>
            <span>•</span>
            <span className="hover:text-purple-600 transition-colors cursor-default">Audio Player</span>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented View Control */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Action Buttons */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleOpenFile}
            accept=".md,.txt,.html"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            title="Open markdown file"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">Open .md</span>
          </button>

          <button
            onClick={() => setShowSamplesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Samples</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Upload Media</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* SAVE TO DB BUTTON */}
          <button
            onClick={handleSaveToDatabase}
            disabled={isSavingDb}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save Wiki note directly into AISearchHistory database table"
          >
            {isSavingDb ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to DB...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-emerald-200" />
                <span>Save to DB</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </div>

      {/* DATABASE SAVE FEEDBACK BANNER */}
      {saveDbSuccess && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{saveDbSuccess}</span>
          </div>
          <div className="flex items-center gap-2">
            {savedSlug && (
              <a
                href={`/X/${encodeURIComponent(savedSlug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
              >
                <span>View Saved Wiki</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => setSaveDbSuccess(null)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {saveDbError && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{saveDbError}</span>
          </div>
          <button
            onClick={() => setSaveDbError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOOLBAR ROW */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 flex flex-wrap items-center gap-1.5 text-sm overflow-x-auto">
        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
          <button
            onClick={() => insertText('# ')}
            className="px-2 py-1 text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => insertText('## ')}
            className="px-2 py-1 text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => insertText('### ')}
            className="px-2 py-1 text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Text formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
          <button
            onClick={() => insertText('**', '**')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('*', '*')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('~~', '~~')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('`', '`')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('> ')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Insertions */}
        <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
          <button
            onClick={() => insertText('- ')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('1. ')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('- [ ] ')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Task List"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('[', '](https://example.com)')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Insert Table"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertText('\n---\n')}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* EMBED SHORTCUTS MATCHING SCREENSHOT */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">EMBED:</span>
          <button
            onClick={() => handleEmbed('md')}
            className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/60 dark:text-purple-300 transition-colors"
          >
            .MD
          </button>
          <button
            onClick={() => handleEmbed('image')}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/60 dark:text-blue-300 transition-colors"
          >
            <ImageIcon className="w-3 h-3" /> Image
          </button>
          <button
            onClick={() => handleEmbed('pdf')}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-300 transition-colors"
          >
            <FileCode className="w-3 h-3" /> PDF
          </button>
          <button
            onClick={() => handleEmbed('video')}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-300 transition-colors"
          >
            <Video className="w-3 h-3" /> Video
          </button>
          <button
            onClick={() => handleEmbed('audio')}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300 transition-colors"
          >
            <Music className="w-3 h-3" /> Audio
          </button>
          <button
            onClick={() => handleEmbed('html')}
            className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-300 transition-colors"
          >
            <Globe className="w-3 h-3" /> HTML
          </button>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800 min-h-[520px]">
        {/* LEFT PANE: EDITOR */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className={`flex flex-col ${viewMode === 'editor' ? 'md:col-span-2' : ''}`}>
            {/* Editor Subheader */}
            <div className="px-4 py-2.5 bg-gray-50/90 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-purple-700 dark:text-purple-300 tracking-wide uppercase">
                  {docTitle.toUpperCase()}
                </span>
              </div>
              <span className="text-gray-400 dark:text-gray-500 font-medium hidden sm:inline">
                📌 Drag & drop PDF, Video, Audio, Images or HTML files
              </span>
            </div>

            {/* Code / Markdown Area with Line Numbers Gutter */}
            <div className="relative flex-1 flex overflow-hidden bg-white dark:bg-gray-950 min-h-[480px]">
              {/* Line Numbers Gutter */}
              <div
                ref={lineNumbersRef}
                className="select-none py-3 px-2 text-right font-mono text-xs text-gray-400 dark:text-gray-600 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden w-12 flex-shrink-0"
              >
                {lineNumbers.map((num) => (
                  <div key={num} className="leading-6">
                    {num}
                  </div>
                ))}
              </div>

              {/* Textarea with Drag & Drop */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onScroll={handleScroll}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const syntheticEvent = {
                      target: { files: [file] }
                    } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleMediaFileUpload(syntheticEvent);
                  }
                }}
                placeholder="Type Markdown or HTML content here..."
                spellCheck={false}
                className="flex-1 w-full h-full py-3 px-4 font-mono text-xs md:text-sm leading-6 bg-transparent resize-none focus:outline-none text-gray-800 dark:text-gray-200 overflow-y-auto"
                disabled={!canInteract}
              />
            </div>
          </div>
        )}

        {/* RIGHT PANE: LIVE PREVIEW */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`flex flex-col ${viewMode === 'preview' ? 'md:col-span-2' : ''}`}>
            {/* Live Preview Subheader */}
            <div className="px-4 py-2.5 bg-gray-50/90 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  LIVE_PREVIEW
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                Reactive HTML5 / Markdown Render Engine
              </span>
            </div>

            {/* Preview Render Box */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50/30 dark:bg-gray-950/40 min-h-[480px]">
              {renderLivePreview()}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER STATUS BAR */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/80 rounded-b-2xl flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3">
        {/* Left Stats */}
        <div className="flex items-center gap-4 font-mono">
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
            ≡ {stats.lines} Lines
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            T {stats.words.toLocaleString()} Words
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            # {stats.chars.toLocaleString()} Chars
          </span>
        </div>

        {/* Center Tag */}
        <div className="hidden lg:flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Reactive Engine • HTML5 / Media / Markdown v2.0</span>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ~{stats.readTime} min read
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-saved {lastAutoSave || '12:34 AM'}
          </span>
        </div>
      </div>

      {/* SAMPLES MODAL */}
      {showSamplesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Sample Templates
              </h3>
              <button
                onClick={() => setShowSamplesModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setContent(DEFAULT_SAMPLE_CONTENT);
                  setDocTitle('Technical Documentation & Guides.md');
                  setShowSamplesModal(false);
                }}
                className="w-full text-left p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 bg-gray-50/50 dark:bg-gray-800/50 transition-all"
              >
                <div className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📄 All Media Previews (PDF, Image, Video, Audio)</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Full showcase featuring live PDF document viewer, image lightbox, video player, audio stream, and alert callouts.
                </div>
              </button>

              <button
                onClick={() => {
                  setContent(` # 🚀 Project Wiki & Guide

## Quick Overview
Welcome to the project knowledge base.

- [x] Set up environment
- [x] Build core components
- [ ] Deploy to production

| Module | Status | Owner |
| --- | --- | --- |
| Wiki Editor | Active | Lead Dev |
| Search Engine | Complete | AI Bot |

> "Simplicity is the soul of efficiency." — Austin Freeman
`);
                  setDocTitle('Project Wiki Guide.md');
                  setShowSamplesModal(false);
                }}
                className="w-full text-left p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 bg-gray-50/50 dark:bg-gray-800/50 transition-all"
              >
                <div className="font-semibold text-sm text-gray-900 dark:text-white">
                  Project Wiki & Roadmap Table
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Clean wiki checklist, table structure, and blockquote styling.
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600" /> Export Document
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleExportMd}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition-colors"
              >
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">Download Markdown (.md)</div>
                  <div className="text-xs text-gray-500">Standard markdown document format</div>
                </div>
                <FileText className="w-5 h-5 text-purple-600" />
              </button>

              <button
                onClick={handleExportHtml}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition-colors"
              >
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">Download HTML (.html)</div>
                  <div className="text-xs text-gray-500">Standalone HTML file with basic styles</div>
                </div>
                <Globe className="w-5 h-5 text-purple-600" />
              </button>

              <button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition-colors"
              >
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {copied ? 'Copied to Clipboard!' : 'Copy Source Code'}
                  </div>
                  <div className="text-xs text-gray-500">Copy raw markdown to clipboard</div>
                </div>
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-purple-600" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MEDIA MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Upload or Embed Media
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Local File Upload Button */}
              <div className="p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                  Upload .md, PDF, Video, Audio, Image, or HTML files from your computer
                </p>
                <input
                  type="file"
                  ref={mediaFileInputRef}
                  onChange={handleMediaFileUpload}
                  accept=".md,.pdf,.html,.htm,image/*,video/*,audio/*,application/pdf,text/html,text/markdown"
                  className="hidden"
                />
                <button
                  onClick={() => mediaFileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Choose Local File
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase my-2">
                <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></span>
                <span>OR EMBED FROM URL</span>
                <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></span>
              </div>

              {/* Media Type Tabs */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Media Category
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <button
                    onClick={() => setMediaType('image')}
                    className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                      mediaType === 'image'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" /> Image
                  </button>
                  <button
                    onClick={() => setMediaType('pdf')}
                    className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                      mediaType === 'pdf'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <FileCode className="w-3 h-3" /> PDF
                  </button>
                  <button
                    onClick={() => setMediaType('video')}
                    className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                      mediaType === 'video'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Video className="w-3 h-3" /> Video
                  </button>
                  <button
                    onClick={() => setMediaType('audio')}
                    className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                      mediaType === 'audio'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Music className="w-3 h-3" /> Audio
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Media Title / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Annual Report PDF, Intro Video..."
                  value={mediaTitleInput}
                  onChange={(e) => setMediaTitleInput(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Media Direct URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleInsertMediaUrl}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                Insert Media
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}