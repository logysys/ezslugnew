import React, { useState } from 'react';
import { CHEATSHEET_ITEMS } from '../data/obsidianGuideData';
import { 
  Copy, 
  Check, 
  Search, 
  Sparkles, 
  Code, 
  HelpCircle, 
  Layers, 
  Database, 
  MessageSquare, 
  Command, 
  Globe 
} from 'lucide-react';

export const ObsidianCheatsheet: React.FC = () => {
  const [copiedSyntax, setCopiedSyntax] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'WikiLinks', 'Callouts', 'Properties', 'Dataview', 'Embeds'];

  const handleCopy = (syntax: string) => {
    navigator.clipboard.writeText(syntax);
    setCopiedSyntax(syntax);
    setTimeout(() => setCopiedSyntax(null), 2000);
  };

  const filteredItems = CHEATSHEET_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.syntax.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const hotkeysList = [
    { key: 'Ctrl/Cmd + N', action: 'Create New Note' },
    { key: 'Ctrl/Cmd + O', action: 'Quick Switcher (Open Note)' },
    { key: 'Ctrl/Cmd + P', action: 'Open Command Palette' },
    { key: 'Ctrl/Cmd + E', action: 'Toggle Edit / Reading Mode' },
    { key: 'Ctrl/Cmd + G', action: 'Open Graph View' },
    { key: 'Ctrl/Cmd + Shift + F', action: 'Search Across Entire Vault' },
    { key: 'Ctrl/Cmd + Click Link', action: 'Open Link in New Tab' },
    { key: 'Alt/Option + Click Link', action: 'Open Link in Split Pane' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Command className="w-4 h-4" /> Obsidian Cheat Sheet & Hotkeys
          </div>
          <h2 className="text-2xl font-black text-slate-100">
            Obsidian Syntax & Keyboard Reference
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Copy-pasteable Markdown snippets, WikiLinks, Callouts, Frontmatter fields, and keyboard shortcuts.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Filter syntax..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2 pl-9 text-xs focus:outline-none focus:border-purple-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cheat Sheet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-purple-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
                {item.category}
              </span>
              <h3 className="text-sm font-bold text-slate-200">{item.feature}</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {item.explanation}
            </p>

            {/* Code Block */}
            <div className="relative bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <pre className="text-xs font-mono text-purple-300 overflow-x-auto pr-8">
                <code>{item.syntax}</code>
              </pre>
              <button
                onClick={() => handleCopy(item.syntax)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy Syntax"
              >
                {copiedSyntax === item.syntax ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Hotkeys Table Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Command className="w-4 h-4 text-purple-400" /> Essential Obsidian Keyboard Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {hotkeysList.map((hk, i) => (
            <div
              key={i}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between"
            >
              <span className="font-mono text-purple-300 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800 inline-block w-fit mb-2">
                {hk.key}
              </span>
              <span className="text-slate-300 text-[11px] font-medium">{hk.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ObsidianCheatsheet;
