import React, { useState } from 'react';
import { ObsidianOption } from '../data/obsidianGuideData';
import { 
  Settings, 
  Search, 
  CheckCircle, 
  Info, 
  Sliders, 
  Sparkles, 
  ArrowRight, 
  Tag, 
  ToggleLeft, 
  ToggleRight,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';

interface Props {
  options: ObsidianOption[];
  initialSearchQuery?: string;
  onTestInSandbox?: (optionName: string) => void;
}

export const ObsidianOptionsViewer: React.FC<Props> = ({
  options,
  initialSearchQuery = '',
  onTestInSandbox
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [simulatedToggles, setSimulatedToggles] = useState<Record<string, boolean>>({
    'opt-live-preview': true,
    'opt-wikilinks': true,
    'opt-auto-update-links': true,
    'opt-readable-line-length': true,
    'opt-auto-pair-brackets': true,
    'opt-fold-heading': true,
    'opt-plugin-restricted-mode': false, // false means unrestricted mode
  });

  const categories = ['All', 'Editor', 'Files & Links', 'Appearance', 'Core Plugins', 'Community Plugins'];

  const filteredOptions = options.filter((opt) => {
    const matchesCategory = selectedCategory === 'All' || opt.category === selectedCategory;
    const matchesSearch =
      opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.howToUse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleSimulatedOption = (optionId: string) => {
    setSimulatedToggles((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const getImpactBadge = (level: ObsidianOption['impactLevel']) => {
    switch (level) {
      case 'Essential':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 text-rose-400" />
            Essential
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            High Impact
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Info className="w-3 h-3 text-blue-400" />
            Medium Impact
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Standard
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Settings className="w-4 h-4" /> Obsidian Core & Plugin Directory
            </div>
            <h2 className="text-2xl font-black text-slate-100">
              Obsidian Settings & Options Manual
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              A complete reference guide explaining every configuration switch, default value, recommended setup, and step-by-step path inside Obsidian.
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <input
              type="text"
              placeholder="Search settings (e.g. WikiLinks, Live Preview, Attachments)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredOptions.map((opt) => {
          const isToggledOn = simulatedToggles[opt.id] ?? true;

          return (
            <div
              key={opt.id}
              className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 text-purple-400 border border-slate-800">
                      {opt.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 mt-1 group-hover:text-purple-300 transition-colors">
                      {opt.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getImpactBadge(opt.impactLevel)}

                    {/* Interactive Toggle Switch Simulator */}
                    <button
                      onClick={() => toggleSimulatedOption(opt.id)}
                      className="text-slate-400 hover:text-purple-400 transition-colors p-1"
                      title="Simulate toggle in Obsidian"
                    >
                      {isToggledOn ? (
                        <ToggleRight className="w-7 h-7 text-purple-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {opt.description}
                </p>

                {/* Path & Instructions Block */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 mb-4 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>How to access this setting:</span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] leading-normal pl-2 border-l-2 border-purple-500/50">
                    {opt.howToUse}
                  </p>
                </div>

                {/* Default vs Recommended Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                      Default Value
                    </span>
                    <span className="font-semibold text-slate-300">{opt.defaultValue}</span>
                  </div>
                  <div className="bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/30">
                    <span className="text-[10px] uppercase font-bold text-purple-400 block mb-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-purple-400" /> Recommended
                    </span>
                    <span className="font-bold text-purple-200">{opt.recommendedValue}</span>
                  </div>
                </div>
              </div>

              {/* Tags & Sandbox Trigger */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {opt.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {onTestInSandbox && (
                  <button
                    onClick={() => onTestInSandbox(opt.name)}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Test Impact
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredOptions.length === 0 && (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold">No Obsidian option matches your search</p>
          <p className="text-xs text-slate-500 mt-1">
            Try searching for terms like "WikiLinks", "Live Preview", "Attachments", or "Dataview".
          </p>
        </div>
      )}
    </div>
  );
};
export default ObsidianOptionsViewer;
