import React, { useState } from 'react';
import { GuideStep } from '../data/obsidianGuideData';
import { 
  CheckCircle, 
  Circle, 
  Copy, 
  Check, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Sparkles, 
  AlertCircle, 
  Info, 
  Lightbulb, 
  ShieldAlert,
  ArrowRight,
  FolderTree,
  GitFork,
  Layers,
  FileCode,
  Database,
  Network,
  LayoutGrid,
  Cpu,
  Globe,
  Settings,
  ChevronRight,
  Play,
  Target,
  Award,
  Zap
} from 'lucide-react';

interface Props {
  steps: GuideStep[];
  completedStepIds: string[];
  onToggleComplete: (id: string) => void;
  onSelectOption?: (optionName: string) => void;
  onOpenSandboxWithSnippet?: (snippet: string) => void;
}

export const ObsidianStepGuide: React.FC<Props> = ({
  steps,
  completedStepIds,
  onToggleComplete,
  onSelectOption,
  onOpenSandboxWithSnippet,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedStepId, setExpandedStepId] = useState<string>('step-1');
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<string | null>(null);

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'FolderTree': return <FolderTree className="w-5 h-5" />;
      case 'GitFork': return <GitFork className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'FileCode': return <FileCode className="w-5 h-5" />;
      case 'Database': return <Database className="w-5 h-5" />;
      case 'Network': return <Network className="w-5 h-5" />;
      case 'LayoutGrid': return <LayoutGrid className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Globe': return <Globe className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const handleCopy = (text: string, indexKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetIndex(indexKey);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  const filteredSteps = steps.filter((step) => {
    const matchesCategory = selectedCategory === 'all' || step.category === selectedCategory;
    const matchesSearch =
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.sections.some(
        (s) =>
          s.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Steps', icon: BookOpen },
    { id: 'basics', label: 'Vault Basics', icon: FolderTree },
    { id: 'linking', label: 'WikiLinks', icon: GitFork },
    { id: 'formatting', label: 'Formatting', icon: FileCode },
    { id: 'visualization', label: 'Graph & Visual', icon: Network },
    { id: 'metadata', label: 'Metadata', icon: Database },
    { id: 'automation', label: 'Automation', icon: Cpu },
    { id: 'publishing', label: 'Publishing', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search guide steps, syntaxes, callouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
            />
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-600">
                {completedStepIds.length} / {steps.length}
              </span>
              <span>Steps Completed</span>
            </div>
            <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${(completedStepIds.length / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200/60">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {filteredSteps.map((step, index) => {
          const isCompleted = completedStepIds.includes(step.id);
          const isExpanded = expandedStepId === step.id;
          const stepNumber = index + 1;

          return (
            <div
              key={step.id}
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded
                  ? 'border-emerald-200 shadow-lg shadow-emerald-500/5'
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Step Header - Always visible */}
              <div
                onClick={() => setExpandedStepId(isExpanded ? '' : step.id)}
                className="p-5 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4">
                  {/* Step Number & Status */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(step.id);
                      }}
                      className="flex-shrink-0 transition-colors hover:scale-110"
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <Circle className="w-7 h-7 text-slate-300 hover:text-emerald-400 transition-colors" />
                      )}
                    </button>
                    
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-sm">
                      {stepNumber}
                    </div>
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-800 truncate">
                        {step.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {step.category}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.readTime}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                      {step.summary}
                    </p>
                  </div>

                  {/* Expand Button */}
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-xl transition-all duration-300 ${
                      isExpanded ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-200/60 space-y-6">
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    {step.summary}
                  </p>

                  {step.sections.map((section, idx) => (
                    <div key={idx} className="space-y-3">
                      <h4 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {section.heading}
                      </h4>

                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>

                      {/* Callout */}
                      {section.callout && (
                        <div
                          className={`p-4 rounded-xl border text-sm flex gap-3 ${
                            section.callout.type === 'tip'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                              : section.callout.type === 'warning'
                              ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                              : section.callout.type === 'important'
                              ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                              : 'bg-blue-50/80 border-blue-200 text-blue-800'
                          }`}
                        >
                          {section.callout.type === 'tip' ? (
                            <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : section.callout.type === 'warning' ? (
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          ) : section.callout.type === 'important' ? (
                            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-bold mb-0.5">{section.callout.title}</div>
                            <div className="text-sm opacity-90">{section.callout.text}</div>
                          </div>
                        </div>
                      )}

                      {/* Code Snippet */}
                      {section.codeSnippet && (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 text-xs text-slate-400">
                            <span className="font-mono uppercase text-emerald-400 font-semibold text-[10px] tracking-wider">
                              {section.codeLanguage || 'markdown'}
                            </span>
                            <div className="flex items-center gap-2">
                              {onOpenSandboxWithSnippet && (
                                <button
                                  onClick={() =>
                                    onOpenSandboxWithSnippet(section.codeSnippet!)
                                  }
                                  className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-300 transition-colors bg-slate-700/50 px-3 py-1.5 rounded-lg text-[10px] font-medium"
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  Test in Sandbox
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleCopy(section.codeSnippet!, `${step.id}-${idx}`)
                                }
                                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors bg-slate-700/50 px-3 py-1.5 rounded-lg text-[10px] font-medium"
                              >
                                {copiedSnippetIndex === `${step.id}-${idx}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                            <code>{section.codeSnippet}</code>
                          </pre>
                        </div>
                      )}

                      {/* Key Options */}
                      {section.keyOptions && section.keyOptions.length > 0 && (
                        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="text-slate-400 font-medium flex items-center gap-1">
                            <Settings className="w-3.5 h-3.5" /> Related Settings:
                          </span>
                          {section.keyOptions.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => onSelectOption && onSelectOption(opt)}
                              className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium text-[11px]"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Step Footer Controls */}
                  <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-3">
                    <button
                      onClick={() => onToggleComplete(step.id)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Completed
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" /> Mark Complete
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {steps.findIndex((s) => s.id === step.id) > 0 && (
                        <button
                          onClick={() => {
                            const prevIdx = steps.findIndex((s) => s.id === step.id) - 1;
                            setExpandedStepId(steps[prevIdx].id);
                          }}
                          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                          Previous
                        </button>
                      )}
                      {steps.findIndex((s) => s.id === step.id) < steps.length - 1 && (
                        <button
                          onClick={() => {
                            const nextIdx = steps.findIndex((s) => s.id === step.id) + 1;
                            setExpandedStepId(steps[nextIdx].id);
                          }}
                          className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors"
                        >
                          Next Step
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {filteredSteps.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-600">No step guide sections found</p>
            <p className="text-sm text-slate-400 mt-1">Try clearing your search query or switching categories.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObsidianStepGuide;