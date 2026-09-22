import React, { useState, useMemo } from 'react';
import {
    Network,
    FileText,
    Search,
    Download,
    BookOpen,
    Layout,
    Sparkles,
    Calendar,
    Link2,
    Info,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Folder,
    FolderOpen,
    Edit3,
    Copy,
    Check,
    Settings,
    ChevronDown,
    ChevronRight,
    Image as ImageIcon,
    Film,
    Music,
    Volume2,
    ExternalLink,
    X,
    Code,
    Eye,
    Globe,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Filter
} from 'lucide-react';

interface ObsidianCodeBlockProps {
    code: string;
    lang?: string;
    isDark?: boolean;
}

const ObsidianCodeBlock: React.FC<ObsidianCodeBlockProps> = ({ code, lang = 'text', isDark = true }) => {
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
        <div className="my-3.5 rounded-xl border border-[#282d3c] bg-[#11141c] overflow-hidden shadow-md font-sans">
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

interface ObsidianTranscludedNoteProps {
    note: {
        id: string;
        title: string;
        category?: string;
        tags?: string[];
        content: string;
    };
    section?: string | null;
    onOpenNote: () => void;
    isDark?: boolean;
}

const ObsidianTranscludedNote: React.FC<ObsidianTranscludedNoteProps> = ({ note, section, onOpenNote, isDark = true }) => {
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
        <div className="my-3.5 rounded-xl border-l-4 border-purple-500 bg-[#151821] border-y border-r border-[#262b38] overflow-hidden shadow-sm transition-all">
            <div className="px-3.5 py-2 border-b bg-[#1c202d] border-[#262b38] text-slate-300 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold">
                    <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Embedded Note: <span className="font-bold text-white">{note.title}</span></span>
                    {section && <span className="text-[11px] font-mono text-purple-400">#{section}</span>}
                    {note.category && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wide border border-purple-800/50">
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
                    <p key={idx} className="text-slate-300 leading-relaxed">
                        {line}
                    </p>
                ))}
                {isTruncated && (
                    <div className="pt-2 text-center">
                        <button
                            type="button"
                            onClick={onOpenNote}
                            className="text-xs text-purple-400 font-semibold hover:underline"
                        >
                            ... View full note in vault ({linesArr.length} lines)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export interface NoteItem {
    id: string;
    title: string;
    category?: string;
    tags?: string[];
    content: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ObsidianWikiPreviewProps {
    query: string;
    fileData?: any[];
    socialMediaMetadata?: any;
    created_at?: string;
}

export default function ObsidianWikiPreview({
    query,
    fileData = [],
    socialMediaMetadata = {},
    created_at
}: ObsidianWikiPreviewProps) {
    // Default initial date string
    const dateStr = useMemo(() => {
        if (created_at) return new Date(created_at).toLocaleDateString();
        return new Date().toLocaleDateString();
    }, [created_at]);

    // Parse initial notes from fileData, query, or fallback sample notes matching user design
    const initialNotes = useMemo<NoteItem[]>(() => {
        // 1. If fileData provided from backend database
        if (Array.isArray(fileData) && fileData.length > 0) {
            return fileData.map((f: any, idx: number) => {
                let noteCategory = (f.category || '').toUpperCase();
                if (!noteCategory) {
                    const titleLower = (f.title || f.name || '').toLowerCase();
                    if (titleLower.includes('prompt') || titleLower.includes('coding')) {
                        noteCategory = 'PROMPTS';
                    } else if (titleLower.includes('agent') || titleLower.includes('rag') || titleLower.includes('mcp') || titleLower.includes('project') || titleLower.includes('media')) {
                        noteCategory = 'PROJECTS';
                    } else {
                        noteCategory = 'LLMS';
                    }
                }

                let noteTags: string[] = [];
                if (Array.isArray(f.tags)) {
                    noteTags = f.tags.map((t: string) => String(t).trim().replace(/^#/, ''));
                } else if (typeof f.tags === 'string' && f.tags.trim()) {
                    noteTags = f.tags.split(',').map((t: string) => String(t).trim().replace(/^#/, ''));
                }
                if (noteTags.length === 0) {
                    noteTags = ['gemini', 'api', 'ai-models'];
                }

                return {
                    id: f.id || `file-note-${idx + 1}`,
                    title: f.title || f.name?.replace(/\.md$/, '') || `Note ${idx + 1}`,
                    category: noteCategory,
                    tags: noteTags,
                    content: f.content || `# ${f.title || 'Untitled Note'}\n\nNote stored in vault folder.`,
                    createdAt: dateStr,
                    updatedAt: dateStr,
                };
            });
        }

        // 2. Parse query string sections if formatted as Markdown Vault
        if (query && query.includes('## ')) {
            const rawSections = query.split(/\n(?=##\s+)/g);
            const parsed: NoteItem[] = [];
            let idCounter = 1;

            rawSections.forEach((section) => {
                const lines = section.trim().split('\n');
                const titleLine = lines.find(l => l.startsWith('## ')) || lines.find(l => l.startsWith('# '));
                
                if (titleLine) {
                    const title = titleLine.replace(/^#+\s*/, '').trim();
                    const contentLines = lines.filter(l => !l.startsWith('## ') && !l.startsWith('# Obsidian Wiki Vault'));
                    const content = contentLines.join('\n').trim();

                    if (title && title.length > 0) {
                        parsed.push({
                            id: `parsed-note-${idCounter++}`,
                            title: title,
                            category: title.toLowerCase().includes('prompt') ? 'PROMPTS' : title.toLowerCase().includes('project') ? 'PROJECTS' : 'LLMS',
                            tags: ['obsidian', 'knowledge', 'ai'],
                            content: content || `# ${title}\n\nWelcome to ${title} obsidian note.`,
                            createdAt: dateStr,
                            updatedAt: dateStr,
                        });
                    }
                }
            });

            if (parsed.length > 0) return parsed;
        }

        // 3. Fallback default vault notes structured as shown in user screenshot image
        return [
            {
                id: 'note-sample-html',
                title: 'Sample HTML Page',
                category: 'PROJECTS',
                tags: ['html', 'sampleco', 'landing-page'],
                content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample HTML Page</title>
  <!-- Google Font for a clean, modern look -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,600;14..32,700&display=swap" rel="stylesheet">
  <!-- Font Awesome for icons (free version) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #f9fafc;
      color: #1e293b;
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* ----- layout containers ----- */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ----- header / navigation ----- */
    header {
      background: #ffffff;
      border-bottom: 1px solid #e9edf4;
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(4px);
      background: rgba(255, 255, 255, 0.85);
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }

    .logo {
      font-weight: 700;
      font-size: 1.5rem;
      letter-spacing: -0.02em;
      color: #0f172a;
    }

    .logo i {
      color: #3b82f6;
      margin-right: 6px;
    }

    .nav-links {
      display: flex;
      gap: 28px;
      list-style: none;
      font-weight: 500;
    }

    .nav-links a {
      text-decoration: none;
      color: #334155;
      transition: color 0.2s;
      font-size: 0.95rem;
    }

    .nav-links a:hover {
      color: #2563eb;
    }

    .nav-cta {
      background: #2563eb;
      color: #fff !important;
      padding: 8px 20px;
      border-radius: 30px;
      font-weight: 600;
      transition: background 0.2s;
    }

    .nav-cta:hover {
      background: #1d4ed8 !important;
      color: #fff !important;
    }

    /* ----- hero section ----- */
    .hero {
      padding: 60px 0 48px;
      text-align: center;
    }

    .hero h1 {
      font-size: 2.8rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.2;
      max-width: 800px;
      margin: 0 auto 16px;
    }

    .hero h1 span {
      background: linear-gradient(145deg, #2563eb, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero p {
      font-size: 1.2rem;
      color: #475569;
      max-width: 600px;
      margin: 0 auto 32px;
    }

    .hero-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-block;
      padding: 12px 32px;
      border-radius: 40px;
      font-weight: 600;
      text-decoration: none;
      transition: 0.2s ease;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-primary {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }

    .btn-primary:hover {
      background: #1d4ed8;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
    }

    .btn-outline {
      background: transparent;
      color: #1e293b;
      border: 1.5px solid #cbd5e1;
    }

    .btn-outline:hover {
      border-color: #2563eb;
      background: #f1f5f9;
    }

    /* ----- features / cards section ----- */
    .section-title {
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
      margin: 40px 0 12px;
    }

    .section-sub {
      text-align: center;
      color: #64748b;
      margin-bottom: 40px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 30px;
      margin: 20px 0 40px;
    }

    .card {
      background: #ffffff;
      padding: 32px 24px;
      border-radius: 24px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
      border: 1px solid #edf2f7;
      transition: 0.25s ease;
      text-align: center;
    }

    .card:hover {
      transform: translateY(-6px);
      border-color: #bdd3ff;
      box-shadow: 0 16px 40px rgba(0, 20, 80, 0.06);
    }

    .card-icon {
      font-size: 2.6rem;
      color: #2563eb;
      margin-bottom: 16px;
    }

    .card h3 {
      font-size: 1.3rem;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .card p {
      color: #475569;
      font-size: 0.95rem;
    }

    /* ----- quote / testimonial ----- */
    .testimonial {
      background: #ffffff;
      border-radius: 28px;
      padding: 40px 36px;
      margin: 48px 0 32px;
      border: 1px solid #edf2f7;
      box-shadow: 0 6px 18px rgba(0,0,0,0.02);
      text-align: center;
    }

    .testimonial i {
      color: #94a3b8;
      font-size: 2rem;
      margin-bottom: 8px;
    }

    .testimonial blockquote {
      font-size: 1.2rem;
      font-weight: 400;
      color: #1e293b;
      max-width: 700px;
      margin: 0 auto 16px;
      font-style: italic;
    }

    .testimonial cite {
      font-style: normal;
      font-weight: 600;
      color: #2563eb;
    }

    /* ----- footer ----- */
    footer {
      margin-top: auto;
      background: #ffffff;
      border-top: 1px solid #e9edf4;
      padding: 32px 0;
      margin-top: 48px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .footer-content p {
      color: #64748b;
      font-size: 0.9rem;
    }

    .social-links a {
      color: #64748b;
      margin-left: 20px;
      font-size: 1.2rem;
      transition: color 0.2s;
    }

    .social-links a:hover {
      color: #2563eb;
    }

    /* ----- responsive tweaks ----- */
    @media (max-width: 700px) {
      .navbar {
        flex-direction: column;
        gap: 12px;
      }
      .nav-links {
        gap: 16px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .hero h1 {
        font-size: 2.2rem;
      }
      .hero p {
        font-size: 1rem;
      }
      .testimonial blockquote {
        font-size: 1rem;
      }
      .footer-content {
        flex-direction: column;
        text-align: center;
      }
      .social-links a {
        margin: 0 10px;
      }
    }

    @media (max-width: 480px) {
      .hero h1 {
        font-size: 1.8rem;
      }
      .btn {
        padding: 10px 24px;
        font-size: 0.9rem;
      }
    }
  </style>
</head>
<body>

  <!-- header -->
  <header>
    <div class="container navbar">
      <div class="logo">
        <i class="fas fa-cube"></i> SampleCo
      </div>
      <ul class="nav-links">
        <li><a href="#">Home</a></li>
        <li><a href="#">Features</a></li>
        <li><a href="#">Pricing</a></li>
        <li><a href="#" class="nav-cta">Get Started</a></li>
      </ul>
    </div>
  </header>

  <!-- main content -->
  <main class="container">

    <!-- hero -->
    <section class="hero">
      <h1>Build amazing things <br><span>with our platform</span></h1>
      <p>Modern, responsive, and fully customizable — this sample page shows how clean HTML & CSS come together.</p>
      <div class="hero-buttons">
        <a href="#" class="btn btn-primary"><i class="fas fa-rocket" style="margin-right: 8px;"></i> Launch</a>
        <a href="#" class="btn btn-outline"><i class="fas fa-book-open" style="margin-right: 8px;"></i> Learn more</a>
      </div>
    </section>

    <!-- features grid -->
    <h2 class="section-title">Designed for developers</h2>
    <p class="section-sub">Everything you need to kickstart your next project</p>

    <div class="features-grid">
      <div class="card">
        <div class="card-icon"><i class="fas fa-palette"></i></div>
        <h3>Beautiful UI</h3>
        <p>Clean, modern components with subtle animations and a polished look.</p>
      </div>
      <div class="card">
        <div class="card-icon"><i class="fas fa-code"></i></div>
        <h3>Clean Code</h3>
        <p>Semantic HTML, well-structured CSS, and easy to customize for any project.</p>
      </div>
      <div class="card">
        <div class="card-icon"><i class="fas fa-mobile-alt"></i></div>
        <h3>Responsive</h3>
        <p>Looks great on desktops, tablets, and phones — fluid grid and flexible layout.</p>
      </div>
      <div class="card">
        <div class="card-icon"><i class="fas fa-bolt"></i></div>
        <h3>Lightning fast</h3>
        <p>Minimal dependencies, optimized assets, and pure vanilla performance.</p>
      </div>
    </div>

    <!-- testimonial / quote block -->
    <div class="testimonial">
      <i class="fas fa-quote-left"></i>
      <blockquote>
        “This sample page is the perfect starting point. It's clean, intuitive, and saved me hours of design work.”
      </blockquote>
      <cite>— Alex Rivera, Product Designer</cite>
    </div>

  </main>

  <!-- footer -->
  <footer>
    <div class="container footer-content">
      <p>&copy; 2026 SampleCo. All rights reserved.</p>
      <div class="social-links">
        <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
        <a href="#" aria-label="GitHub"><i class="fab fa-github"></i></a>
        <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
        <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
      </div>
    </div>
  </footer>

</body>
</html>`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-gemini',
                title: 'Gemini',
                category: 'LLMS',
                tags: ['gemini', 'api', 'ai-models'],
                content: `# Gemini Model Portfolio

Google's Gemini models are highly intelligent, native multi-modal systems capable of processing and executing complex tasks across text, code, audio, images, and video.

## Key Features
- **Large Context Window**: Millions of tokens.
- **Server-Side Integration**: Kept safe using the ez.wiki proxy at \`/api/proxy/gemini\`.
- **Function Calling**: Let the model invoke real-time tools.

> [!NOTE] NEURAL ARCHITECTURE
> Gemini models utilize advanced mixture-of-experts (MoE) transformer architectures. Compare with [[Claude]] or [[DeepSeek]] for comparative benchmarking.`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-claude',
                title: 'Claude',
                category: 'LLMS',
                tags: ['claude', 'anthropic', 'reasoning'],
                content: `# Claude AI Ecosystem

Claude is Anthropic's flagship family of AI models specializing in complex reasoning, writing, coding, and mathematical analysis.

## Key Capabilities
- **Artifacts**: Interactive code blocks and SVG preview rendering.
- **Constitutional AI**: Built-in safety and alignment principles.
- **System Prompting**: Highly responsive to precise structural guidance. Check [[Gemini]] for multi-modal comparisons.`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-deepseek',
                title: 'DeepSeek',
                category: 'LLMS',
                tags: ['deepseek', 'open-source', 'math'],
                content: `# DeepSeek Reasoning Models

DeepSeek provides state-of-the-art open-weights reasoning and coding models trained on large-scale reinforced learning loops.

## Highlights
- **Chain of Thought**: Explicit step-by-step reasoning tokens.
- **Cost Efficiency**: High benchmark throughput at optimized latency. See [[Coding]] for prompt templates.`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-coding',
                title: 'Coding',
                category: 'PROMPTS',
                tags: ['prompts', 'coding', 'typescript'],
                content: `# System Prompting for Developers

Optimal prompt structures for code generation, refactoring, and test writing in modern web applications.

> [!INFO] BEST PRACTICE
> Provide clear interface declarations, target output format, and concrete edge cases. Refer to [[AI Agent]] for programmatic execution.`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-agent',
                title: 'AI Agent',
                category: 'PROJECTS',
                tags: ['agent', 'autonomy', 'tools'],
                content: `# Autonomous Agent Engine

Architecting agentic loops equipped with tool calling, scratchpad memory, and self-correction workflows.

- [x] Tool Registry Schema
- [x] Context Truncation Guard
- [ ] Multi-agent Orchestration`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-tiktok',
                title: 'TikTok Video Embed',
                category: 'MEDIA EMBEDS',
                tags: ['tiktok', 'embed', 'video', 'music'],
                content: `# TikTok Media Embed

You can paste any interactive TikTok, Twitter/X, Instagram, or HTML embed code into your Obsidian Wiki notes!

### Live TikTok Video Player
<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@emiliopiano/video/7644298321166667041" data-video-id="7644298321166667041" style="max-width: 605px;min-width: 325px;" > <section> <a target="_blank" title="@emiliopiano" href="https://www.tiktok.com/@emiliopiano?refer=embed">@emiliopiano</a> <p>This 2 year old SINGER shocked EVERYONE 🥹❤️ I was playing piano in Los Angeles when Leona asked me if I could play “Let It Go” from Frozen ❄️🎹 As soon as I started playing, she noticed the microphone above her head and tried to reach it, such a cute moment🥹  After I helped her with the mic, everyone was waiting to hear her voice… and she did NOT disappoint 😳✨ Despite her young age, her voice was incredibly powerful, and she handled this difficult song very well 🎤❤️</p> <a target="_blank" title="♬ original sound - Emilio Piano" href="https://www.tiktok.com/music/original-sound-7644298355681643296?refer=embed">♬ original sound - Emilio Piano</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-rag',
                title: 'RAG',
                category: 'PROJECTS',
                tags: ['rag', 'vector-db', 'embeddings'],
                content: `# Retrieval-Augmented Generation

Connecting large language models with dynamic vector databases and neural search indexes.

Check [[Gemini]] and [[MCP]] for external context ingestion.`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-mcp',
                title: 'MCP',
                category: 'PROJECTS',
                tags: ['mcp', 'protocol', 'integrations'],
                content: `# Model Context Protocol

Open standard for securely connecting models to local databases, filesystem context, and web services.`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
            {
                id: 'note-media',
                title: 'Media & Embeds',
                category: 'PROJECTS',
                tags: ['media', 'canvas', 'obsidian'],
                content: `# Media & Canvas Mindmap Integration

Embedding images, interactive graph diagrams, and live Canvas mind-maps directly inside Obsidian Vault notes.`,
                createdAt: dateStr,
                updatedAt: dateStr,
            },
        ];
    }, [query, fileData, dateStr]);

    const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
    const [activeNoteId, setActiveNoteId] = useState<string>(initialNotes[0]?.id || 'note-gemini');
    const [activeTab, setActiveTab] = useState<'reader' | 'graph' | 'canvas'>('reader');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [copiedMD, setCopiedMD] = useState<boolean>(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
    const [editTitle, setEditTitle] = useState<string>('');
    const [editContent, setEditContent] = useState<string>('');

    // Interactive Graph States
    const [graphFilter, setGraphFilter] = useState<string>('');
    const [graphCategoryFilter, setGraphCategoryFilter] = useState<string>('ALL');
    const [hoveredGraphNodeId, setHoveredGraphNodeId] = useState<string | null>(null);
    const [graphZoom, setGraphZoom] = useState<number>(1.0);

    const vaultTitle = useMemo(() => {
        if (socialMediaMetadata?.vault_title) return socialMediaMetadata.vault_title;
        return 'My AI Knowledge Base';
    }, [socialMediaMetadata]);

    const activeNote = useMemo(() => {
        return notes.find(n => n.id === activeNoteId) || notes[0] || null;
    }, [notes, activeNoteId]);

    // Color mapper for graph categories
    const getCategoryColor = (cat?: string) => {
        const upper = (cat || '').toUpperCase();
        if (upper.includes('PROMPT')) return { bg: '#f59e0b', border: '#fbbf24', text: 'text-amber-300', fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' };
        if (upper.includes('PROJECT') || upper.includes('MEDIA')) return { bg: '#10b981', border: '#34d399', text: 'text-emerald-300', fill: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
        if (upper.includes('LLM')) return { bg: '#a855f7', border: '#c084fc', text: 'text-purple-300', fill: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' };
        return { bg: '#06b6d4', border: '#38bdf8', text: 'text-cyan-300', fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' };
    };

    // Calculate dynamic graph nodes, degrees, wikilinks & edges
    const graphData = useMemo(() => {
        const totalNotes = notes.length;
        const nodes = notes.map((n, idx) => {
            const angle = (idx / totalNotes) * 2 * Math.PI - Math.PI / 2;
            const radiusX = totalNotes <= 4 ? 180 : 250;
            const radiusY = totalNotes <= 4 ? 110 : 150;

            const cx = 380 + Math.cos(angle) * radiusX;
            const cy = 210 + Math.sin(angle) * radiusY;

            let wikilinkCount = 0;
            let categoryLinkCount = 0;

            notes.forEach(other => {
                if (other.id === n.id) return;
                const nTitleLower = n.title.toLowerCase();
                const otherTitleLower = other.title.toLowerCase();
                if (
                    n.content.toLowerCase().includes(`[[${otherTitleLower}`) ||
                    other.content.toLowerCase().includes(`[[${nTitleLower}`)
                ) {
                    wikilinkCount++;
                }
                if (n.category && other.category && n.category === other.category) {
                    categoryLinkCount++;
                }
            });

            const colorScheme = getCategoryColor(n.category);

            return {
                ...n,
                cx,
                cy,
                degree: wikilinkCount * 2 + categoryLinkCount,
                wikilinkCount,
                colorScheme
            };
        });

        const edges: Array<{ source: string; target: string; isWikilink: boolean; x1: number; y1: number; x2: number; y2: number }> = [];

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const n1 = nodes[i];
                const n2 = nodes[j];

                const n1TitleLower = n1.title.toLowerCase();
                const n2TitleLower = n2.title.toLowerCase();

                const isWikilink =
                    n1.content.toLowerCase().includes(`[[${n2TitleLower}`) ||
                    n2.content.toLowerCase().includes(`[[${n1TitleLower}`);

                const isSameCategory = n1.category && n2.category && n1.category === n2.category;

                if (isWikilink || isSameCategory) {
                    edges.push({
                        source: n1.id,
                        target: n2.id,
                        isWikilink,
                        x1: n1.cx,
                        y1: n1.cy,
                        x2: n2.cx,
                        y2: n2.cy
                    });
                }
            }
        }

        return { nodes, edges };
    }, [notes]);

    // Group notes by Category
    const groupedNotes = useMemo(() => {
        const groups: Record<string, NoteItem[]> = {};

        notes.forEach(n => {
            const cat = n.category?.toUpperCase() || 'UNCATEGORIZED';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(n);
        });

        // Filter by search query if present
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const filteredGroups: Record<string, NoteItem[]> = {};
            Object.keys(groups).forEach(cat => {
                const matches = groups[cat].filter(n =>
                    n.title.toLowerCase().includes(q) ||
                    n.content.toLowerCase().includes(q) ||
                    n.tags?.some(t => t.toLowerCase().includes(q))
                );
                if (matches.length > 0) {
                    filteredGroups[cat] = matches;
                }
            });
            return filteredGroups;
        }

        return groups;
    }, [notes, searchQuery]);

    // Toggle category collapse
    const toggleCategory = (cat: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    // Download complete Vault .md
    const handleDownloadVault = () => {
        let combined = `# ${vaultTitle}\n\nA personal knowledge base generated via ez.wiki Obsidian Wiki\n\n`;
        notes.forEach(n => {
            combined += `--- NOTE: ${n.title} [Category: ${n.category || 'General'}] ---\n${n.content}\n\n`;
        });

        const blob = new Blob([combined], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${vaultTitle.replace(/\s+/g, '_')}_Vault.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Copy active note MD content
    const handleCopyMD = () => {
        if (!activeNote) return;
        navigator.clipboard.writeText(activeNote.content);
        setCopiedMD(true);
        setTimeout(() => setCopiedMD(false), 2000);
    };

    // Create New Note
    const handleCreateNote = () => {
        const newId = `note-${Date.now()}`;
        const newNote: NoteItem = {
            id: newId,
            title: 'New Obsidian Note',
            category: 'PROJECTS',
            tags: ['new', 'obsidian'],
            content: `# New Obsidian Note\n\nStart writing your knowledge base note here...\n\n- [[Gemini]]\n- [[Claude]]`,
            createdAt: dateStr,
            updatedAt: dateStr,
        };

        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newId);
        setIsEditingNote(true);
        setEditTitle(newNote.title);
        setEditContent(newNote.content);
    };

    // Save edited note
    const handleSaveEdit = () => {
        if (!activeNote) return;
        setNotes(prev =>
            prev.map(n =>
                n.id === activeNote.id
                    ? { ...n, title: editTitle || n.title, content: editContent, updatedAt: dateStr }
                    : n
            )
        );
        setIsEditingNote(false);
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

    // Parse Wikilinks, Media, Links, and Inline Formatting
    const parseWikilinksAndFormatting = (text: string) => {
        if (!text) return null;

        // If line is an iframe or HTML embed tag
        if (/<(?:iframe|embed|object)\b/i.test(text)) {
            const srcMatch = text.match(/src=["']([^"']+)["']/i);
            const iframeSrc = srcMatch ? srcMatch[1] : null;

            return (
                <div key="inline-html-embed" className="my-3.5 w-full rounded-xl overflow-hidden border border-[#282d3c] bg-[#11141c] shadow-md">
                    <div className="px-3 py-1.5 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                        <span className="flex items-center gap-1.5 font-bold text-purple-400">
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

        // Strip structural HTML tags if wrapped around text
        const cleanedText = text
            .replace(/<\/?(div|footer|header|section|article|p|span)[^>]*>/gi, '')
            .trim();

        if (!cleanedText && text.trim()) return null;

        const regex = /(!\[[^\]]*\]\([^)]+\)|!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
        const parts = cleanedText.split(regex);

        return parts.map((part, i) => {
            if (!part) return null;

            // 1. Markdown Image / Media Syntax: ![alt](url)
            if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (match) {
                    const alt = match[1] || 'Media asset';
                    const url = match[2];
                    const mediaType = getMediaType(url);

                    if (mediaType === 'audio') {
                        return (
                            <div key={i} className="my-3.5 p-3.5 rounded-xl bg-[#141820] border border-[#282e3c] shadow-xs">
                                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-purple-300">
                                    <Music className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    <span>{alt}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 text-[10px] font-mono font-bold uppercase">AUDIO</span>
                                </div>
                                <audio controls src={url} className="w-full h-9 rounded" />
                            </div>
                        );
                    }

                    if (mediaType === 'video' || mediaType === 'video_embed') {
                        const embedUrl = getEmbedUrl(url);
                        if (mediaType === 'video_embed') {
                            return (
                                <div key={i} className="my-3.5 rounded-xl overflow-hidden border border-[#282e3c] aspect-video bg-black shadow-md">
                                    <iframe src={embedUrl} title={alt} className="w-full h-full" allowFullScreen />
                                </div>
                            );
                        }
                        return (
                            <div key={i} className="my-3.5 rounded-xl overflow-hidden border border-[#282e3c] bg-black shadow-md">
                                <video controls src={url} className="w-full max-h-[480px] object-contain" />
                            </div>
                        );
                    }

                    if (mediaType === 'pdf') {
                        return (
                            <div key={i} className="my-3.5 rounded-xl border border-[#282d3c] bg-[#11141c] overflow-hidden shadow-md">
                                <div className="px-3.5 py-2 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-xs text-slate-300">
                                    <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                        <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                        <span className="truncate max-w-[220px] sm:max-w-[320px]">{alt}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 text-[10px] font-bold">PDF</span>
                                    </div>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded bg-[#252b38] hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1 transition-colors text-slate-200"
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
                            <div key={i} className="my-3.5 rounded-xl border border-[#282d3c] bg-[#11141c] overflow-hidden shadow-md">
                                <div className="px-3.5 py-2 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-xs text-slate-300">
                                    <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                        <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                        <span className="truncate max-w-[200px] sm:max-w-[320px]">{displayTitle}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 text-[10px] font-bold uppercase">HTML PAGE</span>
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
                                            className="px-2.5 py-1 rounded bg-[#252b38] hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1 transition-colors text-slate-200 cursor-pointer"
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

                    // Standard Image
                    return (
                        <div key={i} className="my-3 max-w-full inline-block">
                            <img
                                src={url}
                                alt={alt}
                                className="max-w-full h-auto rounded-xl border border-[#282e3c] shadow-md object-cover transition-transform duration-200 hover:scale-[1.01]"
                                loading="lazy"
                            />
                            {alt && alt !== 'Media asset' && !alt.startsWith('http') && (
                                <span className="block text-[11px] text-slate-400 mt-1 italic text-center">
                                    {alt}
                                </span>
                            )}
                        </div>
                    );
                }
            }

            // 2. Obsidian Embed Syntax: ![[media.jpg]] or ![[media.jpg|width]]
            if (part.startsWith('![') && part.endsWith(']]')) {
                const inner = part.slice(3, -2);
                const [rawUrl, sizeOrAlt] = inner.split('|');
                const url = rawUrl.trim();
                const mediaType = getMediaType(url);

                if (mediaType === 'audio') {
                    return (
                        <div key={i} className="my-3.5 p-3.5 rounded-xl bg-[#141820] border border-[#282e3c]">
                            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-purple-300">
                                <Volume2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <span>{sizeOrAlt || url}</span>
                                <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 text-[10px] font-mono font-bold uppercase">AUDIO</span>
                            </div>
                            <audio controls src={url} className="w-full h-9 rounded" />
                        </div>
                    );
                }

                if (mediaType === 'video' || mediaType === 'video_embed') {
                    const embedUrl = getEmbedUrl(url);
                    if (mediaType === 'video_embed') {
                        return (
                            <div key={i} className="my-3.5 rounded-xl overflow-hidden border border-[#282e3c] aspect-video bg-black shadow-md">
                                <iframe src={embedUrl} title={sizeOrAlt || 'Video'} className="w-full h-full" allowFullScreen />
                            </div>
                        );
                    }
                    return (
                        <div key={i} className="my-3.5 rounded-xl overflow-hidden border border-[#282e3c] bg-black shadow-md">
                            <video controls src={url} className="w-full max-h-[480px]" />
                        </div>
                    );
                }

                if (mediaType === 'pdf') {
                    return (
                        <div key={i} className="my-3.5 rounded-xl border border-[#282d3c] bg-[#11141c] overflow-hidden shadow-md">
                            <div className="px-3.5 py-2 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-xs text-slate-300">
                                <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                    <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                    <span className="truncate max-w-[220px] sm:max-w-[320px]">{sizeOrAlt || url}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 text-[10px] font-bold">PDF</span>
                                </div>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded bg-[#252b38] hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1 transition-colors text-slate-200"
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
                        <div key={i} className="my-3.5 rounded-xl border border-[#282d3c] bg-[#11141c] overflow-hidden shadow-md">
                            <div className="px-3.5 py-2 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-xs text-slate-300">
                                <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                    <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    <span className="truncate max-w-[200px] sm:max-w-[300px]">{displayTitle}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 text-[10px] font-bold uppercase">HTML PAGE</span>
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
                                        className="px-2.5 py-1 rounded bg-[#252b38] hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1 transition-colors text-slate-200 cursor-pointer"
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
                    <div key={i} className="my-3 max-w-full">
                        <img
                            src={url}
                            alt={sizeOrAlt || 'Embedded image'}
                            className="max-w-full h-auto rounded-xl border border-[#282e3c] shadow-md object-cover"
                            loading="lazy"
                        />
                    </div>
                );
            }

            // 3. Wikilink Syntax: [[NoteTitle|Label]]
            if (part.startsWith('[[') && part.endsWith(']]')) {
                const inner = part.slice(2, -2);
                const [targetTitle, displayName] = inner.split('|');
                const label = displayName || targetTitle;

                const found = notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase().trim());

                return (
                    <button
                        key={i}
                        onClick={() => {
                            if (found) setActiveNoteId(found.id);
                        }}
                        className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-md bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/60 font-medium text-xs transition-colors cursor-pointer"
                    >
                        <Link2 className="w-3 h-3 text-purple-400 inline" />
                        <span>{label}</span>
                    </button>
                );
            }

            // 4. Standard Link: [Label](URL)
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
                            className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 underline font-medium"
                        >
                            <span>{label}</span>
                            <ExternalLink className="w-3 h-3 text-purple-400 inline" />
                        </a>
                    );
                }
            }

            // 5. Bold: **text**
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }

            // 6. Code: `code`
            if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code key={i} className="px-1.5 py-0.5 rounded bg-[#1a1e27] text-purple-300 font-mono text-xs border border-[#2b313e]">
                        {part.slice(1, -1)}
                    </code>
                );
            }

            // 7. Italic: *text*
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-slate-200">{part.slice(1, -1)}</em>;
            }

            return <span key={`txt-${i}`}>{part}</span>;
        });
    };

    // Render Obsidian Markdown
    const renderMarkdown = (content: string) => {
        if (!content) return null;

        // Check and parse YAML Frontmatter
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

        // If whole note is a raw HTML document (starts with <!DOCTYPE html> or <html)
        const cleanNoteBody = noteBody.trim().toLowerCase();
        if (cleanNoteBody.startsWith('<!doctype html') || cleanNoteBody.startsWith('<html')) {
            return (
                <div className="my-2 rounded-2xl border border-[#282d3c] bg-[#11141c] overflow-hidden shadow-xl font-sans">
                    <div className="px-4 py-2.5 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-xs text-slate-300 select-none">
                        <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                            <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="truncate font-bold text-white max-w-[280px]">Interactive HTML Document</span>
                            <span className="px-2 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800/60 text-[10px] font-bold uppercase tracking-wider">
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
                                className="px-3 py-1 rounded-lg bg-[#252b38] hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1.5 transition-colors text-slate-200 cursor-pointer"
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

        // Render Cover Image / Banner if in Frontmatter
        if (frontmatterData.cover_image) {
            elements.push(
                <div key="frontmatter-banner" className="mb-4 rounded-2xl overflow-hidden border border-[#212631] shadow-lg">
                    <img
                        src={frontmatterData.cover_image}
                        alt={frontmatterData.title || 'Cover image'}
                        className="w-full h-48 sm:h-60 object-cover"
                        loading="lazy"
                    />
                </div>
            );
        }

        // Render Frontmatter metadata drawer if available
        if (Object.keys(frontmatterData).length > 0) {
            elements.push(
                <div key="frontmatter-card" className="mb-4 p-3 bg-[#13161c] rounded-xl border border-[#252a36] text-xs space-y-1">
                    {frontmatterData.title && (
                        <div className="font-bold text-slate-100 text-sm mb-1">{frontmatterData.title}</div>
                    )}
                    {frontmatterData.description && (
                        <p className="text-slate-400 italic mb-2">{frontmatterData.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        {frontmatterData.author && <span>👤 Author: <strong className="text-slate-200">{frontmatterData.author}</strong></span>}
                        {frontmatterData.date && <span>📅 Date: <strong className="text-slate-200">{frontmatterData.date}</strong></span>}
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
                <div key={`full-html-doc-${keyIndex}`} className="my-4 rounded-2xl border border-[#282d3c] bg-[#11141c] overflow-hidden shadow-xl font-sans">
                    <div className="px-4 py-2.5 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-xs text-slate-300 select-none">
                        <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                            <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="truncate font-bold text-white max-w-[280px]">Interactive HTML Document</span>
                            <span className="px-2 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800/60 text-[10px] font-bold uppercase tracking-wider">
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
                                className="px-3 py-1 rounded-lg bg-[#252b38] hover:bg-[#2d3444] text-xs font-medium flex items-center gap-1.5 transition-colors text-slate-200 cursor-pointer"
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

        const flushCodeBlock = (keyIndex: number) => {
            if (!inCodeBlock) return;
            const codeContent = codeBlockLines.join('\n');
            elements.push(
                <ObsidianCodeBlock
                    key={`code-block-${keyIndex}`}
                    code={codeContent}
                    lang={codeBlockLang}
                    isDark={true}
                />
            );
            inCodeBlock = false;
            codeBlockLang = '';
            codeBlockLines = [];
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
                    className="my-4 w-full rounded-2xl overflow-hidden border border-[#282d3c] bg-[#11141c] shadow-lg font-sans"
                >
                    <div className="px-3.5 py-2 bg-[#161a24] border-b border-[#282d3c] flex items-center justify-between text-xs text-slate-300 select-none">
                        <span className="flex items-center gap-2 font-mono text-xs font-semibold">
                            <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="font-bold text-white">
                                {isTikTok ? 'TikTok Video Embed' : isTwitter ? 'X / Twitter Post Embed' : isInstagram ? 'Instagram Reel Embed' : 'Interactive HTML Embed'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-800/60 text-[10px] font-bold uppercase tracking-wider">
                                {isTikTok ? 'TikTok' : 'Embed'}
                            </span>
                        </span>
                        {iframeSrc && (
                            <a
                                href={iframeSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
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

        const flushCallout = (keyIdx: number) => {
            if (!inCallout) return;
            let bgColor = 'bg-blue-950/40 border-blue-500 text-blue-200';
            let icon = <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;

            const typeUpper = calloutType.toUpperCase();
            if (typeUpper.includes('WARN')) {
                bgColor = 'bg-amber-950/40 border-amber-500 text-amber-200';
                icon = <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
            } else if (typeUpper.includes('SUCCESS') || typeUpper.includes('CHECK')) {
                bgColor = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
            } else if (typeUpper.includes('SUMMARY') || typeUpper.includes('INFO')) {
                bgColor = 'bg-sky-950/40 border-sky-500 text-sky-200';
                icon = <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0" />;
            }

            elements.push(
                <div key={`callout-${keyIdx}`} className={`my-3 p-3.5 border-l-4 rounded-r-xl ${bgColor} text-xs sm:text-sm shadow-xs`}>
                    <div className="flex items-center gap-2 font-bold mb-1 uppercase tracking-wider text-xs">
                        {icon}
                        <span>{calloutTitle || calloutType}</span>
                    </div>
                    <div className="space-y-1 opacity-90">
                        {calloutLines.map((cl, cidx) => (
                            <p key={cidx}>{parseWikilinksAndFormatting(cl)}</p>
                        ))}
                    </div>
                </div>
            );

            inCallout = false;
            calloutType = 'NOTE';
            calloutTitle = '';
            calloutLines = [];
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

            // Handle Fenced Code Block syntax: ```lang
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

            // Handle HTML Embed (multi-line or single-line <iframe, <embed, <object, <blockquote, <script, <video, <audio)
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
                    (lineLower.includes('blockquote') && lineLower.includes('</script>')) ||
                    lineLower.endsWith('/>');

                if (isSingleLineComplete) {
                    flushHtmlEmbed(index);
                }
                return;
            }

            // Skip raw HTML wrapper tags like <footer>, </footer>, <div>, </div>
            if (/^<\/?(div|footer|header|section|article|p)[^>]*>$/i.test(trimmedLine)) {
                return;
            }

            // Horizontal Rule
            if (trimmedLine === '---' || trimmedLine === '***') {
                elements.push(<hr key={index} className="my-4 border-[#212631]" />);
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
                    <h1 key={index} className="text-xl sm:text-2xl font-extrabold text-white my-3 tracking-tight">
                        {parseWikilinksAndFormatting(line.replace('# ', ''))}
                    </h1>
                );
            } else if (line.startsWith('## ')) {
                elements.push(
                    <h2 key={index} className="text-lg sm:text-xl font-bold text-slate-100 my-2.5">
                        {parseWikilinksAndFormatting(line.replace('## ', ''))}
                    </h2>
                );
            } else if (line.startsWith('### ')) {
                elements.push(
                    <h3 key={index} className="text-base sm:text-lg font-semibold text-slate-200 my-2">
                        {parseWikilinksAndFormatting(line.replace('### ', ''))}
                    </h3>
                );
            } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
                const isChecked = line.startsWith('- [x] ');
                elements.push(
                    <div key={index} className="flex items-center gap-2 my-1 text-xs sm:text-sm text-slate-300">
                        <input type="checkbox" checked={isChecked} readOnly className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500" />
                        <span className={isChecked ? 'line-through text-slate-500' : 'text-slate-300'}>
                            {parseWikilinksAndFormatting(line.substring(6))}
                        </span>
                    </div>
                );
            } else if (line.startsWith('- ')) {
                elements.push(
                    <li key={index} className="ml-4 list-disc text-xs sm:text-sm text-slate-300 my-1">
                        {parseWikilinksAndFormatting(line.replace('- ', ''))}
                    </li>
                );
            } else if (trimmedLine === '') {
                elements.push(<div key={index} className="h-2" />);
            } else {
                const parsed = parseWikilinksAndFormatting(line);
                if (parsed) {
                    elements.push(
                        <div key={index} className="text-xs sm:text-sm text-slate-300 leading-relaxed my-1">
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

    return (
        <div className="w-full bg-[#0d0f12] text-slate-100 rounded-2xl border border-[#212631] overflow-hidden shadow-2xl font-sans p-4 sm:p-6">
            {/* TOP HEADER SECTION */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#212631]">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-950/80 text-purple-300 border border-purple-800/60">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            PUBLISHED OBSIDIAN WIKI
                        </span>
                        <span className="text-xs text-slate-400">• By AI Developer</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                        <span>{vaultTitle}</span>
                        <Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white transition-colors" />
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        A personal knowledge base generated via ez.wiki Obsidian Wiki
                    </p>
                </div>

                <button
                    onClick={handleDownloadVault}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1e27] hover:bg-[#232834] text-slate-200 hover:text-white text-xs font-semibold border border-[#2b313e] shadow-sm transition-all cursor-pointer"
                >
                    <Download className="w-4 h-4 text-purple-400" />
                    <span>Download Vault snap (.zip)</span>
                </button>
            </div>

            {/* MAIN WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[500px]">
                {/* LEFT SIDEBAR - CATEGORY FOLDERS & SEARCH */}
                <div className="lg:col-span-4 xl:col-span-3 bg-[#13161c] border border-[#212631] rounded-2xl p-3.5 flex flex-col justify-between">
                    <div>
                        {/* SEARCH INPUT */}
                        <div className="relative mb-2.5">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search shared notes..."
                                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-[#1a1e27] border border-[#282e3c] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                            />
                        </div>

                        {/* CATEGORY FOLDER TREE */}
                        <div className="space-y-3">
                            {Object.keys(groupedNotes).length === 0 ? (
                                <div className="text-center py-6 text-xs text-slate-500">
                                    No matching notes found
                                </div>
                            ) : (
                                Object.keys(groupedNotes).map(cat => {
                                    const categoryNotes = groupedNotes[cat];
                                    const isCollapsed = collapsedCategories[cat];

                                    return (
                                        <div key={cat} className="space-y-1">
                                            {/* FOLDER HEADER */}
                                            <button
                                                onClick={() => toggleCategory(cat)}
                                                className="w-full flex items-center justify-between px-1 py-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {isCollapsed ? (
                                                        <Folder className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
                                                    ) : (
                                                        <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                                                    )}
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-slate-200">
                                                        {cat}
                                                    </span>
                                                </div>
                                                {isCollapsed ? (
                                                    <ChevronRight className="w-3 h-3 text-slate-500" />
                                                ) : (
                                                    <ChevronDown className="w-3 h-3 text-slate-500" />
                                                )}
                                            </button>

                                            {/* FOLDER NOTES LIST */}
                                            {!isCollapsed && (
                                                <div className="pl-2 space-y-1 border-l border-[#212631] ml-2">
                                                    {categoryNotes.map(n => {
                                                        const isActive = n.id === activeNoteId;
                                                        return (
                                                            <div
                                                                key={n.id}
                                                                className={`group w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs transition-all ${
                                                                    isActive
                                                                        ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-xs'
                                                                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1e27]'
                                                                }`}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveNoteId(n.id);
                                                                        setIsEditingNote(false);
                                                                    }}
                                                                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                                                                >
                                                                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                                                                    <span className="truncate">{n.title}</span>
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT MAIN PANEL - VAULT READER WORKSPACE */}
                <div className="lg:col-span-8 xl:col-span-9 bg-[#13161c] border border-[#212631] rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                        {/* VIEW MODE TABS HEADER BAR */}
                        <div className="flex flex-wrap items-center justify-between border-b border-[#212631] pb-3.5 mb-5 gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[#1a1e27] border border-[#282e3c] text-slate-400">
                                    <BookOpen className="w-3.5 h-3.5" />
                                </div>

                                <div className="flex items-center gap-1 bg-[#1a1e27] p-1 rounded-xl border border-[#282e3c] text-xs">
                                    <button
                                        onClick={() => setActiveTab('reader')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                                            activeTab === 'reader'
                                                ? 'bg-[#282e3c] text-white font-semibold shadow-xs'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Vault Reader</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('graph')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                                            activeTab === 'graph'
                                                ? 'bg-[#282e3c] text-white font-semibold shadow-xs'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Network className="w-3.5 h-3.5" />
                                        <span>Interactive Graph</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('canvas')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                                            activeTab === 'canvas'
                                                ? 'bg-[#282e3c] text-white font-semibold shadow-xs'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Layout className="w-3.5 h-3.5" />
                                        <span>Canvas mind-map</span>
                                    </button>
                                </div>
                            </div>

                            <span className="text-xs text-slate-400 font-medium">
                                Active Vault Notes: <strong className="text-white font-bold">{notes.length}</strong>
                            </span>
                        </div>

                        {/* CONTENT AREA BASED ON TAB */}
                        {activeTab === 'graph' ? (
                            <div className="w-full bg-[#0d0f12] rounded-2xl p-4 border border-[#212631] relative overflow-hidden flex flex-col gap-3">
                                {/* GRAPH CONTROL TOOLBAR */}
                                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#1f2430] text-xs">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                                            <input
                                                type="text"
                                                value={graphFilter}
                                                onChange={e => setGraphFilter(e.target.value)}
                                                placeholder="Filter graph nodes..."
                                                className="pl-8 pr-2.5 py-1 text-xs rounded-lg bg-[#161a22] border border-[#282e3c] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-1 bg-[#161a22] p-0.5 rounded-lg border border-[#282e3c] text-[11px]">
                                            {['ALL', 'LLMS', 'PROMPTS', 'PROJECTS'].map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setGraphCategoryFilter(cat)}
                                                    className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                                                        graphCategoryFilter === cat
                                                            ? 'bg-purple-600 text-white'
                                                            : 'text-slate-400 hover:text-slate-200'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-[#161a22] p-1 rounded-lg border border-[#282e3c]">
                                            <button
                                                onClick={() => setGraphZoom(prev => Math.min(1.8, prev + 0.15))}
                                                className="p-1 hover:bg-[#232936] text-slate-300 rounded cursor-pointer"
                                                title="Zoom In"
                                            >
                                                <ZoomIn className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setGraphZoom(prev => Math.max(0.6, prev - 0.15))}
                                                className="p-1 hover:bg-[#232936] text-slate-300 rounded cursor-pointer"
                                                title="Zoom Out"
                                            >
                                                <ZoomOut className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => { setGraphZoom(1.0); setGraphFilter(''); setGraphCategoryFilter('ALL'); }}
                                                className="p-1 hover:bg-[#232936] text-slate-300 rounded cursor-pointer"
                                                title="Reset View"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-300 font-mono text-[11px]">
                                            {graphData.nodes.length} Nodes • {graphData.edges.length} Links
                                        </span>
                                    </div>
                                </div>

                                {/* SVG INTERACTIVE NETWORK GRAPH CANVAS */}
                                <div className="w-full h-[400px] bg-[#090b0e] rounded-xl relative overflow-hidden flex items-center justify-center border border-[#1b1f29] select-none">
                                    <svg className="w-full h-full" viewBox="0 0 760 420">
                                        <g transform={`scale(${graphZoom})`} transform-origin="380 210" className="transition-transform duration-300">
                                            {/* EDGES / CONNECTIONS */}
                                            {graphData.edges.map((e, idx) => {
                                                const sourceNode = graphData.nodes.find(n => n.id === e.source);
                                                const targetNode = graphData.nodes.find(n => n.id === e.target);

                                                if (!sourceNode || !targetNode) return null;

                                                // Filter checks
                                                if (graphCategoryFilter !== 'ALL') {
                                                    if (sourceNode.category?.toUpperCase() !== graphCategoryFilter && targetNode.category?.toUpperCase() !== graphCategoryFilter) {
                                                        return null;
                                                    }
                                                }
                                                if (graphFilter) {
                                                    const q = graphFilter.toLowerCase();
                                                    if (!sourceNode.title.toLowerCase().includes(q) && !targetNode.title.toLowerCase().includes(q)) {
                                                        return null;
                                                    }
                                                }

                                                const isHighlighted =
                                                    activeNoteId === e.source ||
                                                    activeNoteId === e.target ||
                                                    hoveredGraphNodeId === e.source ||
                                                    hoveredGraphNodeId === e.target;

                                                return (
                                                    <line
                                                        key={`edge-${idx}-${e.source}-${e.target}`}
                                                        x1={e.x1}
                                                        y1={e.y1}
                                                        x2={e.x2}
                                                        y2={e.y2}
                                                        stroke={isHighlighted ? '#c084fc' : e.isWikilink ? '#818cf8' : '#2b3242'}
                                                        strokeWidth={isHighlighted ? '2.5' : e.isWikilink ? '1.8' : '1'}
                                                        strokeDasharray={e.isWikilink ? 'none' : '4 3'}
                                                        opacity={isHighlighted ? 0.95 : e.isWikilink ? 0.6 : 0.3}
                                                        className="transition-all duration-200"
                                                    />
                                                );
                                            })}

                                            {/* NODES */}
                                            {graphData.nodes.map(node => {
                                                if (graphCategoryFilter !== 'ALL' && node.category?.toUpperCase() !== graphCategoryFilter) {
                                                    return null;
                                                }
                                                if (graphFilter && !node.title.toLowerCase().includes(graphFilter.toLowerCase())) {
                                                    return null;
                                                }

                                                const isSelected = node.id === activeNoteId;
                                                const isHovered = node.id === hoveredGraphNodeId;
                                                const radius = Math.min(26, 15 + node.degree * 2);

                                                return (
                                                    <g
                                                        key={node.id}
                                                        onClick={() => setActiveNoteId(node.id)}
                                                        onMouseEnter={() => setHoveredGraphNodeId(node.id)}
                                                        onMouseLeave={() => setHoveredGraphNodeId(null)}
                                                        className="cursor-pointer group"
                                                    >
                                                        {/* PULSE GLOW RING FOR ACTIVE/HOVERED NODE */}
                                                        {(isSelected || isHovered) && (
                                                            <circle
                                                                cx={node.cx}
                                                                cy={node.cy}
                                                                r={radius + 8}
                                                                fill="none"
                                                                stroke={node.colorScheme.border}
                                                                strokeWidth="1.5"
                                                                opacity="0.8"
                                                                className="animate-ping"
                                                            />
                                                        )}

                                                        {/* NODE MAIN CIRCLE */}
                                                        <circle
                                                            cx={node.cx}
                                                            cy={node.cy}
                                                            r={radius}
                                                            fill={isSelected ? node.colorScheme.border : node.colorScheme.fill}
                                                            stroke={isSelected ? '#ffffff' : isHovered ? node.colorScheme.border : '#1e2433'}
                                                            strokeWidth={isSelected ? '3' : '2'}
                                                            className="transition-all duration-300 group-hover:scale-125"
                                                            style={{ filter: `drop-shadow(0 0 8px ${node.colorScheme.glow})` }}
                                                        />

                                                        {/* INNER WIKILINK ICON INDICATOR */}
                                                        {node.wikilinkCount > 0 && (
                                                            <circle
                                                                cx={node.cx + radius * 0.6}
                                                                cy={node.cy - radius * 0.6}
                                                                r="4.5"
                                                                fill="#c084fc"
                                                                stroke="#0d0f12"
                                                                strokeWidth="1"
                                                            />
                                                        )}

                                                        {/* NODE LABEL TEXT */}
                                                        <text
                                                            x={node.cx}
                                                            y={node.cy + radius + 14}
                                                            textAnchor="middle"
                                                            fill={isSelected ? '#ffffff' : isHovered ? node.colorScheme.border : '#cbd5e1'}
                                                            fontSize={isSelected ? '12' : '11'}
                                                            fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
                                                            className="pointer-events-none transition-colors"
                                                        >
                                                            {node.title}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    </svg>

                                    {/* BOTTOM GRAPH LEGEND */}
                                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-3 bg-[#11141c]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#212631] text-[10px] text-slate-300 font-mono">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                            <span>LLMs</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                            <span>Prompts</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span>Projects</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                                            <span>General</span>
                                        </div>
                                    </div>

                                    {/* FLOATING HOVER CARD FOR SELECTED / HOVERED NODE */}
                                    {(() => {
                                        const targetId = hoveredGraphNodeId || activeNoteId;
                                        const targetNode = graphData.nodes.find(n => n.id === targetId);
                                        if (!targetNode) return null;

                                        return (
                                            <div className="absolute top-2.5 right-2.5 w-64 bg-[#141822]/95 backdrop-blur-md p-3.5 rounded-xl border border-[#282e3c] shadow-xl text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                                                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                                                            <span>{targetNode.title}</span>
                                                        </h4>
                                                        <span className={`inline-block text-[10px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded ${targetNode.colorScheme.text} bg-slate-900/80 border border-slate-700/60`}>
                                                            {targetNode.category || 'GENERAL'}
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 font-mono text-[10px] border border-purple-800/60">
                                                        {targetNode.degree} links
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed italic">
                                                    "{targetNode.content.replace(/#+/g, '').trim().substring(0, 90)}..."
                                                </p>

                                                <div className="pt-1 flex items-center justify-between border-t border-[#232938]">
                                                    <span className="text-[10px] text-slate-400">
                                                        Wikilinks: <strong className="text-white">{targetNode.wikilinkCount}</strong>
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setActiveNoteId(targetNode.id);
                                                            setActiveTab('reader');
                                                        }}
                                                        className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                                    >
                                                        <span>Read Note</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : activeTab === 'canvas' ? (
                            <div className="w-full h-[380px] bg-[#0d0f12] rounded-2xl p-6 border border-[#212631] flex flex-wrap gap-4 items-center justify-center overflow-y-auto">
                                {notes.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            setActiveNoteId(n.id);
                                            setActiveTab('reader');
                                        }}
                                        className="w-52 p-4 rounded-2xl bg-[#161a22] border border-[#282e3c] hover:border-purple-500 cursor-pointer shadow-lg transition-all hover:scale-105"
                                    >
                                        <h4 className="font-bold text-xs text-purple-300 mb-1.5 flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                                            <span>{n.title}</span>
                                        </h4>
                                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                                            {n.content.replace(/#+/g, '')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* VAULT READER NOTE VIEW */
                            <div>
                                {activeNote && (
                                    <div>
                                        {/* NOTE HEADER ROW */}
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                                        {activeNote.title}
                                                    </h2>
                                                    {activeNote.category && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/60">
                                                            {activeNote.category}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* HASHTAG PILLS */}
                                                <div className="flex flex-wrap items-center gap-1.5 my-2">
                                                    {activeNote.tags?.map(t => (
                                                        <span
                                                            key={t}
                                                            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800/60"
                                                        >
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>Created {activeNote.createdAt} • Updated {activeNote.updatedAt}</span>
                                                </div>
                                            </div>

                                            {/* COPY MD BUTTON */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleCopyMD}
                                                    className="px-3 py-1.5 rounded-lg bg-[#1a1e27] border border-[#282e3c] hover:bg-[#232936] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                                >
                                                    {copiedMD ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                            <span className="text-emerald-400 font-semibold">Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>Copy MD</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* RENDERED MARKDOWN */}
                                        <div className="prose prose-invert max-w-none text-slate-300 border-t border-[#212631] pt-4 mt-2">
                                            {renderMarkdown(activeNote.content)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}