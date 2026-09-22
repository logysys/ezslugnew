import React, { useState, useMemo } from 'react';
import { INITIAL_SANDBOX_NOTES } from '../data/obsidianGuideData';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  Edit3, 
  Network, 
  Database, 
  Sparkles, 
  Copy, 
  Check, 
  Code, 
  Tag, 
  Folder, 
  Zap, 
  Sliders, 
  FileCode,
  Info,
  Maximize2
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  tags: string[];
  status: string;
  category: string;
  content: string;
}

interface Props {
  initialSnippet?: string;
}

export const ObsidianSandbox: React.FC<Props> = ({ initialSnippet }) => {
  const [notes, setNotes] = useState<Note[]>(INITIAL_SANDBOX_NOTES);
  const [activeNoteId, setActiveNoteId] = useState<string>('note-1');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview' | 'graph'>('split');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulatedOptions, setSimulatedOptions] = useState({
    useWikiLinks: true,
    livePreview: true,
    showProperties: true,
  });

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || notes[0],
    [notes, activeNoteId]
  );

  // Parse WikiLinks from content: [[Note Title]] or [[Note Title|Alias]]
  const extractedLinks = useMemo(() => {
    if (!activeNote) return [];
    const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    const links: { target: string; alias?: string }[] = [];
    let match;
    while ((match = regex.exec(activeNote.content)) !== null) {
      links.push({ target: match[1].trim(), alias: match[2]?.trim() });
    }
    return links;
  }, [activeNote]);

  // Extract Backlinks (other notes linking to activeNote)
  const backlinks = useMemo(() => {
    if (!activeNote) return [];
    return notes.filter(
      (n) =>
        n.id !== activeNote.id &&
        (n.content.includes(`[[${activeNote.title}`) ||
          n.content.includes(`[[${activeNote.title}|`))
    );
  }, [notes, activeNote]);

  // Compute graph nodes and connections across all notes
  const graphData = useMemo(() => {
    const nodes = notes.map((n) => ({ id: n.id, label: n.title, count: 0 }));
    const edges: { source: string; target: string }[] = [];

    notes.forEach((sourceNote) => {
      notes.forEach((targetNote) => {
        if (sourceNote.id !== targetNote.id) {
          if (
            sourceNote.content.includes(`[[${targetNote.title}`) ||
            sourceNote.content.includes(`[[${targetNote.title}|`)
          ) {
            edges.push({ source: sourceNote.id, target: targetNote.id });
          }
        }
      });
    });

    return { nodes, edges };
  }, [notes]);

  const handleUpdateContent = (newContent: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNoteId ? { ...n, content: newContent } : n))
    );
  };

  const handleCreateNewNote = () => {
    const newId = `note-${Date.now()}`;
    const newTitle = `Untitled Wiki Note ${notes.length + 1}`;
    const newNote: Note = {
      id: newId,
      title: newTitle,
      tags: ['wiki', 'draft'],
      status: 'Draft',
      category: 'Uncategorized',
      content: `---
title: ${newTitle}
tags: [wiki, draft]
status: Draft
created: 2026-08-05
---

# ${newTitle}

Start typing your wiki article here... Use [[Obsidian Wiki Overview]] to link to other notes!`
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notes.length <= 1) return;
    const filtered = notes.filter((n) => n.id !== id);
    setNotes(filtered);
    if (activeNoteId === id) {
      setActiveNoteId(filtered[0].id);
    }
  };

  const insertSnippetAtCursor = (snippet: string) => {
    handleUpdateContent(activeNote.content + '\n\n' + snippet);
  };

  const copyNoteContent = () => {
    navigator.clipboard.writeText(activeNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic in-browser parser for Obsidian markdown, callouts, and [[WikiLinks]]
  const renderObsidianMarkdown = (text: string) => {
    let html = text;

    // Remove YAML Frontmatter block for clean preview
    html = html.replace(/^---[\s\S]*?---\n?/, '');

    // Convert Callouts: > [!NOTE] Title \n > Content
    html = html.replace(
      />\s*\[!([A-Z]+)\]\s*([^\n]*)\n((?:>[^\n]*\n?)*)/g,
      (_, type, title, body) => {
        const cleanBody = body.replace(/^>\s?/gm, '');
        const calloutType = type.toLowerCase();
        let borderClass = 'border-purple-500/50 bg-purple-950/20 text-purple-200';
        let badge = '📘';

        if (['warning', 'caution'].includes(calloutType)) {
          borderClass = 'border-amber-500/50 bg-amber-950/20 text-amber-200';
          badge = '⚠️';
        } else if (['tip', 'success'].includes(calloutType)) {
          borderClass = 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200';
          badge = '💡';
        } else if (['danger', 'bug'].includes(calloutType)) {
          borderClass = 'border-rose-500/50 bg-rose-950/20 text-rose-200';
          badge = '🚨';
        }

        return `<div class="p-4 my-4 rounded-xl border ${borderClass} shadow-lg"><div class="font-bold flex items-center gap-2 mb-1">${badge} ${
          title || type
        }</div><div class="text-xs text-slate-300 leading-relaxed">${cleanBody}</div></div>`;
      }
    );

    // Convert Dataview code blocks: ```dataview ... ```
    if (html.includes('```dataview')) {
      const dataviewTable = `
        <div class="my-4 border border-purple-500/40 bg-slate-950 rounded-xl overflow-hidden">
          <div class="bg-purple-900/30 px-4 py-2 text-xs font-mono font-bold text-purple-300 border-b border-purple-500/30 flex items-center gap-1.5">
            ⚡ Dataview Query Output (Simulated Database Table)
          </div>
          <table class="w-full text-xs text-left text-slate-300">
            <thead class="bg-slate-900 text-purple-300 border-b border-slate-800">
              <tr>
                <th class="p-2.5">File Link</th>
                <th class="p-2.5">Status</th>
                <th class="p-2.5">Category</th>
                <th class="p-2.5">Tags</th>
              </tr>
            </thead>
            <tbody>
              ${notes
                .map(
                  (n) => `
                <tr class="border-b border-slate-800/60 hover:bg-slate-900/50">
                  <td class="p-2.5 font-bold text-purple-400">[[${n.title}]]</td>
                  <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">${
                    n.status
                  }</span></td>
                  <td class="p-2.5">${n.category}</td>
                  <td class="p-2.5 font-mono text-[10px] text-slate-400">${n.tags.map((t) => `#${t}`).join(', ')}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>`;
      html = html.replace(/```dataview[\s\S]*?```/g, dataviewTable);
    }

    // Convert WikiLinks: [[Target Note]] or [[Target Note|Display Alias]]
    html = html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
      const targetNote = notes.find(
        (n) => n.title.toLowerCase() === target.trim().toLowerCase()
      );
      const displayText = alias ? alias.trim() : target.trim();
      const exists = !!targetNote;

      return `<span class="inline-flex items-center gap-1 font-semibold ${
        exists
          ? 'text-purple-400 underline decoration-purple-500/60 hover:text-purple-300 cursor-pointer bg-purple-500/10 px-1.5 py-0.5 rounded'
          : 'text-amber-400 opacity-80 border-b border-dashed border-amber-400 cursor-help'
      }" title="${exists ? 'Click to navigate to note' : 'Uncreated note in vault'}">${displayText}</span>`;
    });

    // Convert Headings
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-slate-100 my-4 border-b border-slate-800 pb-2">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-purple-300 my-3">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-slate-200 my-2">$1</h3>');

    // Convert Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>');

    // Convert Task Checkboxes
    html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 text-emerald-400 my-1"><span class="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px] font-bold">✓</span> <span class="line-through text-slate-400">$1</span></div>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 text-slate-300 my-1"><span class="w-4 h-4 rounded border border-slate-600 bg-slate-900"></span> <span>$1</span></div>');

    // Bullet lists
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 text-slate-300 list-disc my-1">$1</li>');

    return html;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[650px]">
      {/* Sandbox Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Interactive Obsidian Vault Sandbox
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Live Simulator
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Test WikiLinks <code className="text-purple-400">[[...]]</code>, Callouts, Frontmatter Properties & Graph View in real time.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'split' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" /> Split View
          </button>
          <button
            onClick={() => setViewMode('edit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'edit' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Editor Only
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'preview' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Live Preview
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'graph' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-purple-300" /> Graph View
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Sidebar: Notes Explorer in Vault */}
        <div className="lg:col-span-3 bg-slate-950/70 border-r border-slate-800/80 p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-purple-400" /> Obsidian Vault Notes
              </span>
              <button
                onClick={handleCreateNewNote}
                className="p-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors p-1 text-xs"
                title="Create New Wiki Note"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[380px] pr-1">
              {notes.map((note) => {
                const isActive = note.id === activeNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-md'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                      <span className="truncate">{note.title}</span>
                    </div>

                    {notes.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Snippet Injection Toolbar */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-purple-300 block">
              ⚡ Quick Snippet Inserter:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => insertSnippetAtCursor('> [!NOTE] Title\n> This is a live callout test.')}
                className="px-2 py-1 rounded bg-slate-950 hover:bg-purple-950 text-[10px] font-mono text-purple-300 border border-slate-800"
              >
                + Callout
              </button>
              <button
                onClick={() => insertSnippetAtCursor('[[WikiLinks Syntax|Learn Syntax]]')}
                className="px-2 py-1 rounded bg-slate-950 hover:bg-purple-950 text-[10px] font-mono text-purple-300 border border-slate-800"
              >
                + WikiLink
              </button>
              <button
                onClick={() => insertSnippetAtCursor('```dataview\nTABLE status, category\nFROM #wiki\n```')}
                className="px-2 py-1 rounded bg-slate-950 hover:bg-purple-950 text-[10px] font-mono text-purple-300 border border-slate-800"
              >
                + Dataview
              </button>
            </div>
          </div>
        </div>

        {/* Center/Right Panels: Editor, Preview, or Graph */}
        <div
          className={`lg:col-span-9 p-5 grid gap-5 ${
            viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {/* Editor Panel */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-purple-400" /> Source Editor
                </span>
                <button
                  onClick={copyNoteContent}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-100 transition-colors"
                >
                  {copied ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy Markdown
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={activeNote.content}
                onChange={(e) => handleUpdateContent(e.target.value)}
                className="w-full h-full min-h-[420px] p-4 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                placeholder="Type Markdown content here..."
              />
            </div>
          )}

          {/* Live Preview Panel */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-400" /> Live Obsidian Render
                </span>
                <span className="text-[10px] font-mono text-purple-400">WYSIWYG View</span>
              </div>

              <div
                className="p-5 overflow-y-auto max-h-[480px] prose prose-invert max-w-none text-xs leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderObsidianMarkdown(activeNote.content),
                }}
              />
            </div>
          )}

          {/* Interactive Graph View Panel */}
          {viewMode === 'graph' && (
            <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Network className="w-5 h-5 text-purple-400" /> Vault Interactive Knowledge Graph
                  </h4>
                  <p className="text-xs text-slate-400">
                    Visualizing bi-directional connections between your vault notes in real time.
                  </p>
                </div>
                <div className="text-xs font-mono text-purple-300 bg-purple-950/50 px-3 py-1 rounded-lg border border-purple-800">
                  {graphData.nodes.length} Nodes • {graphData.edges.length} Connections
                </div>
              </div>

              {/* Simulated Canvas Graph */}
              <div className="relative w-full h-[360px] bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                  {/* Draw connection lines */}
                  {graphData.edges.map((edge, idx) => {
                    const sourceIdx = graphData.nodes.findIndex((n) => n.id === edge.source);
                    const targetIdx = graphData.nodes.findIndex((n) => n.id === edge.target);

                    const x1 = 120 + (sourceIdx % 3) * 220;
                    const y1 = 80 + Math.floor(sourceIdx / 3) * 140;
                    const x2 = 120 + (targetIdx % 3) * 220;
                    const y2 = 80 + Math.floor(targetIdx / 3) * 140;

                    return (
                      <line
                        key={idx}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#8b5cf6"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        strokeDasharray="4 2"
                      />
                    );
                  })}

                  {/* Draw Nodes */}
                  {graphData.nodes.map((node, idx) => {
                    const cx = 120 + (idx % 3) * 220;
                    const cy = 80 + Math.floor(idx / 3) * 140;
                    const isSelected = node.id === activeNoteId;

                    return (
                      <g
                        key={node.id}
                        onClick={() => setActiveNoteId(node.id)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 18 : 14}
                          fill={isSelected ? '#8b5cf6' : '#334155'}
                          stroke={isSelected ? '#c084fc' : '#64748b'}
                          strokeWidth="2"
                        />
                        <text
                          x={cx}
                          y={cy + 30}
                          textAnchor="middle"
                          fill={isSelected ? '#c084fc' : '#94a3b8'}
                          fontSize="11"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Backlinks & Outgoing Links Detail Box */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-purple-300 block mb-1">
                    🔗 Outgoing WikiLinks ({extractedLinks.length})
                  </span>
                  {extractedLinks.length > 0 ? (
                    <div className="space-y-1">
                      {extractedLinks.map((l, i) => (
                        <span
                          key={i}
                          className="inline-block bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded text-[11px] text-purple-300 mr-1.5"
                        >
                          [[{l.target}]]
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No outgoing links in this note</span>
                  )}
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-purple-300 block mb-1">
                    ↩️ Backlinks Mentioning This Note ({backlinks.length})
                  </span>
                  {backlinks.length > 0 ? (
                    <div className="space-y-1">
                      {backlinks.map((b) => (
                        <span
                          key={b.id}
                          onClick={() => setActiveNoteId(b.id)}
                          className="inline-block bg-slate-800 hover:bg-purple-900 cursor-pointer border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-300 mr-1.5"
                        >
                          {b.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No other notes link to this file yet</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ObsidianSandbox;
