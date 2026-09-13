import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import '@fontsource/inter';
import '@fontsource/instrument-sans';
import DraggableMenu from '@/components/DraggableMenu';
import { OBSIDIAN_STEPS, OBSIDIAN_OPTIONS } from '../data/obsidianGuideData';
import { ObsidianStepGuide } from '../components/ObsidianStepGuide';
import { ObsidianOptionsViewer } from '../components/ObsidianOptionsViewer';
import { ObsidianSandbox } from '../components/ObsidianSandbox';
import { ObsidianCheatsheet } from '../components/ObsidianCheatsheet';
import { 
  BookOpen, 
  Settings, 
  Sparkles, 
  Command, 
  Download, 
  CheckCircle, 
  Globe, 
  FolderTree, 
  Share2, 
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Clock,
  BarChart3,
  Library,
  Code2,
  Link2,
  Brain,
  Database,
  Network,
  FileText,
  Home,
  Info,
  MessageSquare
} from 'lucide-react';

interface Props {
  auth?: {
    user?: any;
  };
}

export default function ObsidianWikiGuide({ auth }: Props) {
  const [activeTab, setActiveTab] = useState<'guide' | 'options' | 'sandbox' | 'cheatsheet'>('guide');
  const [completedStepIds, setCompletedStepIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('obsidian_completed_steps');
        return saved ? JSON.parse(saved) : ['step-1'];
      } catch {
        return ['step-1'];
      }
    }
    return ['step-1'];
  });

  const [sandboxSnippet, setSandboxSnippet] = useState<string | undefined>(undefined);
  const [optionsSearchQuery, setOptionsSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('obsidian_completed_steps', JSON.stringify(completedStepIds));
    }
  }, [completedStepIds]);

  const toggleStepComplete = (id: string) => {
    setCompletedStepIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleOpenSandboxWithSnippet = (snippet: string) => {
    setSandboxSnippet(snippet);
    setActiveTab('sandbox');
  };

  const handleSelectOptionFromStep = (optionName: string) => {
    setOptionsSearchQuery(optionName);
    setActiveTab('options');
  };

  const handleDownloadVaultTemplate = () => {
    const markdownContent = `---
title: Welcome to Obsidian Wiki
tags: [wiki, guide, obsidian]
created: ${new Date().toISOString().split('T')[0]}
---

# Welcome to Your Obsidian Vault

This starter vault template is configured with standard WikiLinks, Callouts, and Dataview options.

## Core Concepts
- [[01 - Vault Basics]]
- [[02 - WikiLinks Syntax]]
- [[03 - Markdown Formatting]]
- [[04 - Dataview Queries]]

> [!TIP]
> Use \`Ctrl/Cmd + O\` to navigate between notes rapidly!

## Quick Start Checklist
- [ ] Configure your vault settings
- [ ] Set up folder structure
- [ ] Create your first note
- [ ] Link notes with [[WikiLinks]]
- [ ] Add metadata properties
- [ ] Install Dataview plugin
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Obsidian-Wiki-Starter-Note.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tab configuration
  const tabs = [
    { id: 'guide', label: 'Step-by-Step Guide', icon: BookOpen },
    { id: 'options', label: 'Options Manual', icon: Settings },
    { id: 'sandbox', label: 'Live Vault Sandbox', icon: Sparkles },
    { id: 'cheatsheet', label: 'Syntax Cheatsheet', icon: Command },
  ];

  const stats = [
    { label: 'Guide Steps', value: OBSIDIAN_STEPS.length, icon: BookOpen, color: 'emerald' },
    { label: 'Options Explained', value: OBSIDIAN_OPTIONS.length, icon: Settings, color: 'purple' },
    { label: 'Progress', value: `${completedStepIds.length}/${OBSIDIAN_STEPS.length}`, icon: CheckCircle, color: 'blue' },
    { label: 'Read Time', value: '~45 min', icon: Clock, color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80 text-slate-800 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-700">
      <Head>
        <title>Obsidian Wiki Guide - Complete Setup & Options Manual</title>
        <meta name="description" content="Step-by-step guide explaining how to use all Obsidian options, WikiLinks, Callouts, Dataview, and live vault simulation." />
      </Head>

      {/* Top Navbar Header - Glassmorphism */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-lg shadow-slate-200/20' 
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-105">
                O
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[8px] font-black text-white">★</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Obsidian Guide
                </span>
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ez.wiki
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5">
                The Complete Knowledge Management Masterclass
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="hidden lg:inline">{tab.label}</span>
                  <span className="lg:hidden">{tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVaultTemplate}
              className="hidden sm:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Download Starter</span>
            </button>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200/60 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span className="hidden lg:inline">Back to Home</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200/80 shadow-xl animate-slideDown">
            <div className="px-4 py-4 space-y-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as typeof activeTab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-3 ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                    )}
                  </button>
                );
              })}
              <div className="pt-3 border-t border-slate-200/60 space-y-2">
                <button
                  onClick={handleDownloadVaultTemplate}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-3 hover:bg-emerald-100 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Starter Template</span>
                </button>
                <Link
                  href="/"
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-3 hover:bg-slate-100 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>Back to Home</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
		{auth?.user && <DraggableMenu auth={auth} />}
        {/* Hero Header Section - Enhanced */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl p-6 sm:p-8">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-purple-400 to-blue-400" />
          
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-300 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Complete Masterclass & Documentation
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                <span className="text-emerald-400/70">v2.0</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Mastering{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                  Obsidian
                </span>
                <br />
                <span className="text-2xl sm:text-3xl font-bold text-slate-300">
                  The Ultimate Wiki & Knowledge Graph Guide
                </span>
              </h1>
              
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Step-by-step walkthrough of every core feature and option in Obsidian. Learn how to configure 
                <span className="text-emerald-300 font-medium"> WikiLinks</span>, 
                <span className="text-purple-300 font-medium"> Callouts</span>, 
                <span className="text-blue-300 font-medium"> Frontmatter</span>, 
                <span className="text-amber-300 font-medium"> Dataview</span>, 
                and <span className="text-rose-300 font-medium"> community plugins</span> 
                with interactive real-time previews.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                const colorMap = {
                  emerald: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-300',
                  purple: 'bg-purple-500/15 border-purple-500/20 text-purple-300',
                  blue: 'bg-blue-500/15 border-blue-500/20 text-blue-300',
                  amber: 'bg-amber-500/15 border-amber-500/20 text-amber-300',
                };
                const iconColorMap = {
                  emerald: 'text-emerald-400',
                  purple: 'text-purple-400',
                  blue: 'text-blue-400',
                  amber: 'text-amber-400',
                };
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border backdrop-blur-sm ${colorMap[stat.color as keyof typeof colorMap]}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${iconColorMap[stat.color as keyof typeof iconColorMap]}`} />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-xl font-black text-white">{stat.value}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="relative flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-700/50">
            <button
              onClick={() => setActiveTab('sandbox')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Try Live Sandbox</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold text-sm rounded-xl transition-all duration-200 backdrop-blur-sm border border-slate-600/30 hover:scale-105 active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Start Learning</span>
            </button>
            <button
              onClick={handleDownloadVaultTemplate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700/30 hover:bg-slate-600/30 text-slate-300 font-semibold text-sm rounded-xl transition-all duration-200 backdrop-blur-sm border border-slate-600/30 hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Starter</span>
            </button>
          </div>
        </section>

        {/* Dynamic Tab Render Area */}
        <div className="animate-fadeIn">
          {activeTab === 'guide' && (
            <ObsidianStepGuide
              steps={OBSIDIAN_STEPS}
              completedStepIds={completedStepIds}
              onToggleComplete={toggleStepComplete}
              onSelectOption={handleSelectOptionFromStep}
              onOpenSandboxWithSnippet={handleOpenSandboxWithSnippet}
            />
          )}

          {activeTab === 'options' && (
            <ObsidianOptionsViewer
              options={OBSIDIAN_OPTIONS}
              initialSearchQuery={optionsSearchQuery}
              onTestInSandbox={() => setActiveTab('sandbox')}
            />
          )}

          {activeTab === 'sandbox' && (
            <ObsidianSandbox initialSnippet={sandboxSnippet} />
          )}

          {activeTab === 'cheatsheet' && (
            <ObsidianCheatsheet />
          )}
        </div>
      </main>
      {/* Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}