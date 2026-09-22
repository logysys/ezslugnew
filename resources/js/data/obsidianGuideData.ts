export interface GuideStep {
  id: string;
  number: number;
  title: string;
  summary: string;
  icon: string;
  category: 'basics' | 'linking' | 'formatting' | 'visualization' | 'metadata' | 'automation' | 'publishing';
  readTime: string;
  sections: {
    heading: string;
    content: string;
    codeSnippet?: string;
    codeLanguage?: string;
    callout?: {
      type: 'note' | 'tip' | 'warning' | 'info' | 'important';
      title: string;
      text: string;
    };
    keyOptions?: string[];
  }[];
}

export interface ObsidianOption {
  id: string;
  category: 'Editor' | 'Files & Links' | 'Appearance' | 'Hotkeys' | 'Core Plugins' | 'Community Plugins';
  name: string;
  defaultValue: string;
  description: string;
  howToUse: string;
  recommendedValue: string;
  impactLevel: 'Low' | 'Medium' | 'High' | 'Essential';
  tags: string[];
}

export interface CheatsheetItem {
  feature: string;
  syntax: string;
  renderedResult: string;
  explanation: string;
  category: 'WikiLinks' | 'Callouts' | 'Properties' | 'Dataview' | 'Embeds' | 'Canvas';
}

export const OBSIDIAN_STEPS: GuideStep[] = [
  {
    id: 'step-1',
    number: 1,
    title: 'Vault Setup & File Architecture',
    summary: 'Learn how to create, configure, and structure your local Obsidian Vault for building a scalable personal or team Wiki.',
    icon: 'FolderTree',
    category: 'basics',
    readTime: '5 min',
    sections: [
      {
        heading: '1. What is an Obsidian Vault?',
        content: `An Obsidian Vault is simply a standard folder on your computer containing plain Markdown (.md) text files, images, attachments, and a hidden \`.obsidian\` settings folder. Because your data is stored locally in open formats, you retain 100% data ownership with zero lock-in.`,
        callout: {
          type: 'tip',
          title: 'Local First Architecture',
          text: 'Because Vaults are standard folders, you can back them up with Git, sync them via iCloud / Dropbox / Obsidian Sync, or open them in any text editor like VS Code or Notepad.'
        }
      },
      {
        heading: '2. Recommended Folder Architectures for Wikis',
        content: `To prevent your Wiki from becoming chaotic as it grows to thousands of notes, adopt a structured folder framework:`,
        codeSnippet: `My-Obsidian-Wiki/
├── 00-Meta/              # Templates, CSS Snippets, Scripts
├── 10-Inbox/             # Quick captured notes & unsorted thoughts
├── 20-Atlas/             # Map of Content (MOCs), Hub Pages, Indexes
├── 30-Cards/             # Atomic Zettelkasten notes & Concept articles
├── 40-Projects/          # Active projects & actionable Wiki items
├── 50-Resources/         # Reference manuals, PDFs, media assets
└── 60-Archive/          # Deprecated articles & historical records`,
        codeLanguage: 'text',
        keyOptions: ['Default location for new notes', 'Default location for new attachments']
      },
      {
        heading: '3. Initial Config Checklist',
        content: `Go to Settings (Gear icon) -> Files & links, and set:
- Default location for new notes: "10-Inbox" or "Same folder as current file"
- Default location for attachments: "In subfolder under current folder" (Name it \`attachments\`)
- Automatically update internal links: Enabled (Crucial so links never break when files are moved or renamed)`
      }
    ]
  },
  {
    id: 'step-2',
    number: 2,
    title: 'Wiki-Style Linking & Bi-Directional Connections',
    summary: 'Master internal WikiLinks, alias redirects, heading links, block references, and backlink analysis.',
    icon: 'GitFork',
    category: 'linking',
    readTime: '7 min',
    sections: [
      {
        heading: '1. Basic WikiLink Syntax',
        content: `Internal links connect notes together to form a neural knowledge web. Type \`[[\` in the editor to open autocomplete for all files in your Vault.`,
        codeSnippet: `// 1. Standard Link
[[Obsidian Overview]]

// 2. Custom Display Text (Pipe Alias)
[[Obsidian Overview|Learn about Obsidian]]

// 3. Link to a Specific Heading
[[Obsidian Overview#Key Features]]

// 4. Link to an Exact Block (Paragraph or Bullet)
[[Obsidian Overview#^block-12345]]`,
        codeLanguage: 'markdown',
        callout: {
          type: 'note',
          title: 'Auto Link Refactoring',
          text: 'If you rename "Obsidian Overview" to "Obsidian Master Guide", Obsidian will automatically update every single link in every note across your entire vault!'
        },
        keyOptions: ['Use [[WikiLinks]]', 'Automatically update internal links', 'New link format']
      },
      {
        heading: '2. Aliases in Frontmatter',
        content: `Define aliases in a note\'s properties YAML so that any WikiLink pointing to those alternate names automatically resolves to this single note.`,
        codeSnippet: `---
title: Artificial Intelligence
aliases:
  - AI
  - Machine Intelligence
  - Smart Systems
---

# Artificial Intelligence
Now typing [[AI]] or [[Machine Intelligence]] connects directly to this note!`,
        codeLanguage: 'yaml'
      },
      {
        heading: '3. Unlinked Mentions & Backlinks Pane',
        content: `Open the Right Sidebar and click "Backlinks". 
- **Linked Mentions**: Displays all notes that explicitly link to the current note.
- **Unlinked Mentions**: Scans your entire vault for plain text occurrences of the current note\'s title or aliases and lets you turn them into WikiLinks with one click!`
      }
    ]
  },
  {
    id: 'step-3',
    number: 3,
    title: 'Transclusion & Page Embedding',
    summary: 'Dynamically embed content from other notes, sections, blocks, images, or media directly inside a note without duplicating text.',
    icon: 'Layers',
    category: 'formatting',
    readTime: '6 min',
    sections: [
      {
        heading: '1. What is Transclusion?',
        content: `Transclusion allows you to display live content from Note A inside Note B. If Note A changes, Note B automatically updates in real-time. Simply prefix a link with an exclamation point (\`!\`).`,
        codeSnippet: `// 1. Embed an Entire Note
![[Project Glossary]]

// 2. Embed Only a Specific Section / Heading
![[Project Glossary#Definitions]]

// 3. Embed a Specific Block
![[Project Glossary#^definition-ai]]

// 4. Embed & Resize Image
![[architecture-diagram.png|400]]`,
        codeLanguage: 'markdown',
        callout: {
          type: 'tip',
          title: 'Image Resizing Shortcut',
          text: 'Append `|300` or `|500x200` inside an image embed `![[image.png|300]]` to adjust display width in pixels.'
        }
      }
    ]
  },
  {
    id: 'step-4',
    number: 4,
    title: 'Markdown Formatting & Callout Boxes',
    summary: 'Style your Wiki articles with clean typography, code highlighting, tables, checkboxes, and expressive Obsidian Callouts.',
    icon: 'FileCode',
    category: 'formatting',
    readTime: '8 min',
    sections: [
      {
        heading: '1. Obsidian Callout Syntaxes',
        content: `Callout boxes highlight key information, warnings, tips, and code notes in your Wiki articles.`,
        codeSnippet: `> [!NOTE] Basic Note
> This is a default informative callout box.

> [!TIP] Pro Tip
> Use callouts for important warnings, tips, and documentation callouts!

> [!WARNING] Caution Required
> Deleting this root index page may break navigation links.

> [!DANGER] Critical Warning
> Permanent data deletion ahead!

> [!EXAMPLE] Usage Example
> Here is how you configure the Dataview plugin query.

> [!NOTE]- Collapsible Callout (Default Closed)
> Click to reveal hidden content!

> [!NOTE]+ Collapsible Callout (Default Open)
> Click to fold or expand.`,
        codeLanguage: 'markdown',
        callout: {
          type: 'info',
          title: 'All Supported Callout Types',
          text: 'note, abstract, info, todo, tip, success, question, warning, failure, danger, bug, example, quote.'
        }
      },
      {
        heading: '2. Footnotes, Highlights & Task Lists',
        content: `Rich Markdown elements native to Obsidian:`,
        codeSnippet: `==Highlighted text== for emphasizing terms.

Task Lists with interactive checkboxes:
- [ ] Uncompleted task
- [/] In progress task
- [x] Completed task

Footnotes:
Here is a claim requiring citation[^1].

[^1]: Smith, J. (2026). *Obsidian Wiki Principles*. Page 42.`,
        codeLanguage: 'markdown'
      }
    ]
  },
  {
    id: 'step-5',
    number: 5,
    title: 'Properties & Metadata (YAML Frontmatter)',
    summary: 'Structure your notes with typed key-value metadata properties for database queries, filtering, and automated organization.',
    icon: 'Database',
    category: 'metadata',
    readTime: '6 min',
    sections: [
      {
        heading: '1. Understanding Note Properties',
        content: `Every note in Obsidian can store structured metadata at the top of the file wrapped in triple dashes (\`---\`). Obsidian provides a visual Properties Editor in the GUI to manage these fields easily.`,
        codeSnippet: `---
title: System Design Guide
created: 2026-08-05
status: Draft
category: Architecture
tags:
  - wiki/tech
  - guide/system
author: Tech Lead
priority: 1
published: false
---`,
        codeLanguage: 'yaml',
        callout: {
          type: 'tip',
          title: 'Property Types in Obsidian',
          text: 'Supported field types: Text, List, Number, Checkbox, Date, and Date & Time.'
        },
        keyOptions: ['Show property in file', 'Default location for new properties']
      }
    ]
  },
  {
    id: 'step-6',
    number: 6,
    title: 'Graph View & Network Visualization',
    summary: 'Visualize relationships between Wiki notes, spot isolated topics, build cluster groups, and navigate your knowledge graph.',
    icon: 'Network',
    category: 'visualization',
    readTime: '7 min',
    sections: [
      {
        heading: '1. Global Graph vs Local Graph',
        content: `- **Global Graph**: Displays all notes and connections across your entire vault.
- **Local Graph**: Displays only the currently active note and its immediate neighbors up to a configurable link depth (1 to 5 steps away).`,
        callout: {
          type: 'note',
          title: 'Opening Local Graph',
          text: 'Press `Ctrl/Cmd + P` -> Search "Graph view: Open local graph". Dock it in the right sidebar for real-time navigation while writing!'
        }
      },
      {
        heading: '2. Graph Filters & Color Groups',
        content: `Use the Graph Controls panel (gear icon):
- **Search Filters**: Type \`path:30-Cards\` or \`tag:#wiki\` or \`-is:orphan\` to filter nodes.
- **Color Groups**: Assign colors to nodes matching search queries (e.g., Color green for \`tag:#active\`, Color red for \`tag:#todo\`).
- **Display Sliders**:
  - *Node Size*: Scale nodes based on total incoming/outgoing links.
  - *Center Force & Repulsion*: Adjust physics gravity and node spacing.
  - *Link Distance*: Adjust connection line length.`,
        keyOptions: ['Graph View', 'Show tags in graph', 'Show attachments in graph']
      }
    ]
  },
  {
    id: 'step-7',
    number: 7,
    title: 'Obsidian Canvas for Visual Wiki Mapping',
    summary: 'Create infinite visual workspaces to layout articles, mindmaps, diagrams, embedded notes, and web cards.',
    icon: 'LayoutGrid',
    category: 'visualization',
    readTime: '5 min',
    sections: [
      {
        heading: '1. What is Obsidian Canvas?',
        content: `Canvas is a core plugin that provides a high-performance infinite visual canvas. You can drag and drop Markdown notes, text cards, web URLs, images, and PDFs, then draw directional arrows to map out complex concepts.`,
        codeSnippet: `Canvas File Structure: filename.canvas (JSON-based format)
Card Types:
1. Text Card (Supports full Markdown & Callouts)
2. File Card (Embeds an existing note)
3. Media Card (Images, videos, audio)
4. Web Card (Renders live websites via iframe)`,
        codeLanguage: 'text',
        callout: {
          type: 'tip',
          title: 'Canvas Shortcuts',
          text: 'Double click canvas background to create a new Text Card. Drag from any edge handle to draw a connecting arrow line.'
        },
        keyOptions: ['Canvas Core Plugin']
      }
    ]
  },
  {
    id: 'step-8',
    number: 8,
    title: 'Templates, Daily Notes & Automation',
    summary: 'Automate article creation with standard headers, metadata properties, and dynamic time/date variables.',
    icon: 'Sparkles',
    category: 'automation',
    readTime: '6 min',
    sections: [
      {
        heading: '1. Setting Up Templates',
        content: `Create a dedicated template folder (e.g., \`00-Meta/Templates\`). In Settings -> Templates, set the folder location.`,
        codeSnippet: `---
title: "{{title}}"
created: {{date:YYYY-MM-DD}}
time: {{time:HH:mm}}
tags:
  - wiki/article
status: draft
---

# {{title}}

## Overview
Brief introduction to this topic.

## Key Concepts
- Concept 1
- Concept 2

## Related Notes
- [[Index]]

## References
- `,
        codeLanguage: 'markdown',
        keyOptions: ['Templates', 'Daily Notes', 'Command Palette']
      }
    ]
  },
  {
    id: 'step-9',
    number: 9,
    title: 'Power Plugins: Dataview & Templater',
    summary: 'Turn your Obsidian Wiki into a dynamic query engine using Dataview SQL queries and advanced Templater scripts.',
    icon: 'Cpu',
    category: 'automation',
    readTime: '8 min',
    sections: [
      {
        heading: '1. Dataview Plugin Overview',
        content: `Dataview treats your Markdown notes as a database. You can generate auto-updating tables, lists, task summaries, and calendar feeds based on YAML properties and tags.`,
        codeSnippet: `\`\`\`dataview
TABLE status, created, category
FROM #wiki
WHERE status = "Active"
SORT created DESC
\`\`\``,
        codeLanguage: 'markdown',
        callout: {
          type: 'tip',
          title: 'Dataview Query Types',
          text: 'Supports `TABLE`, `LIST`, `TASK`, and `CALENDAR` views.'
        }
      },
      {
        heading: '2. Dataview Task Query Example',
        content: `Collect all uncompleted tasks from your entire vault into one clean Wiki dashboard:`,
        codeSnippet: `\`\`\`dataview
TASK
FROM "30-Cards" OR "40-Projects"
WHERE !completed
GROUP BY file.link
\`\`\``,
        codeLanguage: 'markdown'
      }
    ]
  },
  {
    id: 'step-10',
    number: 10,
    title: 'Publishing & Exporting Your Obsidian Wiki',
    summary: 'Share your Wiki with the world using Obsidian Publish, Quartz 4.0, or export to standard HTML and PDF.',
    icon: 'Globe',
    category: 'publishing',
    readTime: '6 min',
    sections: [
      {
        heading: '1. Publishing Options Comparison',
        content: `1. **Obsidian Publish (Official)**: One-click hosted service with built-in graph view, search, password protection, and custom domain support.
2. **Quartz 4.0 (Free & Open Source)**: Static site generator built for Obsidian vaults. Renders interactive graph view, full-text search, dark mode, and hosts free on GitHub Pages.
3. **PDF / HTML Export**: Native export for individual articles or bundled documentation.`,
        callout: {
          type: 'tip',
          title: 'Quartz Integration',
          text: 'Quartz directly reads your local Obsidian Vault directory without requiring any format conversion!'
        }
      }
    ]
  }
];

export const OBSIDIAN_OPTIONS: ObsidianOption[] = [
  {
    id: 'opt-live-preview',
    category: 'Editor',
    name: 'Default Editing Mode',
    defaultValue: 'Live Preview',
    description: 'Determines how text and Markdown formatting render while typing.',
    howToUse: 'Go to Settings -> Editor -> Default editing mode. Choose Live Preview (WYSIWYG-style) or Source Mode (raw Markdown code visible).',
    recommendedValue: 'Live Preview',
    impactLevel: 'Essential',
    tags: ['editor', 'preview', 'wysiwyg', 'markdown']
  },
  {
    id: 'opt-wikilinks',
    category: 'Files & Links',
    name: 'Use [[WikiLinks]]',
    defaultValue: 'On (Enabled)',
    description: 'Controls whether internal note links are created as [[Note Name]] or standard Markdown [Note Name](Note%20Name.md).',
    howToUse: 'Go to Settings -> Files & links -> Toggle "Use [[WikiLinks]]". Always leave ON for Obsidian Wikis.',
    recommendedValue: 'On (Enabled)',
    impactLevel: 'Essential',
    tags: ['links', 'wikilinks', 'syntax']
  },
  {
    id: 'opt-auto-update-links',
    category: 'Files & Links',
    name: 'Automatically Update Internal Links',
    defaultValue: 'On (Enabled)',
    description: 'When you rename or move a note, Obsidian automatically updates every link across all files in your vault to match the new name or path.',
    howToUse: 'Go to Settings -> Files & links -> Toggle "Automatically update internal links". Prevents broken links throughout your wiki.',
    recommendedValue: 'On (Enabled)',
    impactLevel: 'Essential',
    tags: ['refactoring', 'links', 'automation', 'maintenance']
  },
  {
    id: 'opt-new-note-location',
    category: 'Files & Links',
    name: 'Default Location for New Notes',
    defaultValue: 'Vault root',
    description: 'Specifies where newly created notes are saved when created via Ctrl/Cmd+N or quick switcher.',
    howToUse: 'Go to Settings -> Files & links -> Default location for new notes -> Select "In the folder specified below" and choose `10-Inbox`.',
    recommendedValue: 'Folder specified below (e.g., 10-Inbox)',
    impactLevel: 'High',
    tags: ['organization', 'files', 'inbox']
  },
  {
    id: 'opt-attachment-location',
    category: 'Files & Links',
    name: 'Default Location for New Attachments',
    defaultValue: 'Vault root',
    description: 'Controls where pasted images, PDFs, and media assets are stored when added to a note.',
    howToUse: 'Go to Settings -> Files & links -> Default location for new attachments -> Choose "In subfolder under current folder" (Name it `attachments`).',
    recommendedValue: 'In subfolder under current folder',
    impactLevel: 'High',
    tags: ['media', 'images', 'attachments']
  },
  {
    id: 'opt-link-format',
    category: 'Files & Links',
    name: 'New Link Format',
    defaultValue: 'Shortest path when possible',
    description: 'Defines how path strings are stored in internal links: Shortest Path, Relative Path, or Absolute Path.',
    howToUse: 'Go to Settings -> Files & links -> New link format. "Shortest path when possible" keeps links clean like `[[My Note]]`.',
    recommendedValue: 'Shortest path when possible',
    impactLevel: 'Medium',
    tags: ['links', 'paths', 'formatting']
  },
  {
    id: 'opt-readable-line-length',
    category: 'Editor',
    name: 'Readable Line Length',
    defaultValue: 'On (Enabled)',
    description: 'Caps text container width to ~70-80 characters centered for comfortable reading.',
    howToUse: 'Go to Settings -> Editor -> Toggle "Readable line length". Turn off if you prefer full-width text spanning widescreen monitors.',
    recommendedValue: 'On (Enabled)',
    impactLevel: 'Medium',
    tags: ['reading', 'layout', 'editor', 'width']
  },
  {
    id: 'opt-auto-pair-brackets',
    category: 'Editor',
    name: 'Auto Pair Brackets & Quotes',
    defaultValue: 'On (Enabled)',
    description: 'Automatically inserts closing brackets `]]`, `))`, `""`, `**` when you type opening characters.',
    howToUse: 'Go to Settings -> Editor -> Toggle "Auto pair brackets" and "Auto pair Markdown syntax".',
    recommendedValue: 'On (Enabled)',
    impactLevel: 'High',
    tags: ['editor', 'typing', 'productivity']
  },
  {
    id: 'opt-fold-heading',
    category: 'Editor',
    name: 'Fold Heading & Fold Indent',
    defaultValue: 'On (Enabled)',
    description: 'Adds small collapse arrows next to headings and indented bullet lists so you can fold sections.',
    howToUse: 'Go to Settings -> Editor -> Toggle "Fold heading" and "Fold indent".',
    recommendedValue: 'On (Enabled)',
    impactLevel: 'Medium',
    tags: ['editor', 'outliner', 'folding']
  },
  {
    id: 'opt-properties-in-file',
    category: 'Editor',
    name: 'Properties in Document',
    defaultValue: 'Visible',
    description: 'Controls how YAML frontmatter metadata properties display at the top of notes: Visible (GUI table), Source (Raw YAML), or Hidden.',
    howToUse: 'Go to Settings -> Editor -> Properties in document -> Select "Visible".',
    recommendedValue: 'Visible',
    impactLevel: 'High',
    tags: ['properties', 'metadata', 'yaml']
  },
  {
    id: 'opt-theme-accent',
    category: 'Appearance',
    name: 'Accent Color & Themes',
    defaultValue: 'Purple / Default',
    description: 'Sets the visual theme and highlight color across Obsidian UI controls, graph nodes, and links.',
    howToUse: 'Go to Settings -> Appearance -> Choose Light/Dark mode, set Accent Color picker, or browse Community Themes (e.g. Minimal, Prism, AnppPU).',
    recommendedValue: 'Dark Mode with Custom Accent Color',
    impactLevel: 'Medium',
    tags: ['appearance', 'themes', 'colors']
  },
  {
    id: 'opt-css-snippets',
    category: 'Appearance',
    name: 'CSS Snippets',
    defaultValue: 'None',
    description: 'Loads custom CSS files located in `.obsidian/snippets/` to style custom fonts, callouts, cards, and graph elements.',
    howToUse: 'Go to Settings -> Appearance -> Scroll down to "CSS snippets" -> Click folder icon -> Paste `.css` file -> Toggle enable switch.',
    recommendedValue: 'Enabled for custom styling',
    impactLevel: 'Medium',
    tags: ['css', 'customization', 'styling']
  },
  {
    id: 'opt-plugin-restricted-mode',
    category: 'Community Plugins',
    name: 'Restricted Mode (Safe Mode)',
    defaultValue: 'On (Enabled)',
    description: 'Security setting that blocks third-party community plugins from running.',
    howToUse: 'Go to Settings -> Community plugins -> Click "Turn off restricted mode" to enable installing power plugins like Dataview, Templater, and Excalidraw.',
    recommendedValue: 'Off (Disabled to allow plugins)',
    impactLevel: 'Essential',
    tags: ['security', 'plugins', 'community']
  },
  {
    id: 'opt-plugin-dataview',
    category: 'Community Plugins',
    name: 'Dataview Plugin',
    defaultValue: 'Not installed',
    description: 'Treats your vault as a database for querying notes using SQL-like DQL syntax.',
    howToUse: 'Settings -> Community plugins -> Browse -> Search "Dataview" -> Install & Enable.',
    recommendedValue: 'Installed & Enabled',
    impactLevel: 'Essential',
    tags: ['dataview', 'database', 'queries', 'plugin']
  },
  {
    id: 'opt-plugin-templater',
    category: 'Community Plugins',
    name: 'Templater Plugin',
    defaultValue: 'Not installed',
    description: 'Replaces basic templates with powerful Javascript execution, dynamic dates, prompt dialogs, and folder triggers.',
    howToUse: 'Settings -> Community plugins -> Browse -> Search "Templater" -> Install & Enable.',
    recommendedValue: 'Installed for power users',
    impactLevel: 'High',
    tags: ['templates', 'automation', 'javascript']
  },
  {
    id: 'opt-plugin-omnisearch',
    category: 'Community Plugins',
    name: 'Omnisearch Plugin',
    defaultValue: 'Not installed',
    description: 'Adds AI fuzzy search that indexes PDF text, image OCR, and notes with ranked relevance scoring.',
    howToUse: 'Settings -> Community plugins -> Browse -> Search "Omnisearch" -> Install & Enable.',
    recommendedValue: 'Installed for large vaults',
    impactLevel: 'High',
    tags: ['search', 'ocr', 'fuzzy', 'pdf']
  }
];

export const CHEATSHEET_ITEMS: CheatsheetItem[] = [
  {
    feature: 'Basic WikiLink',
    syntax: '[[Note Title]]',
    renderedResult: 'Note Title',
    explanation: 'Creates a bi-directional link to another note in the vault.',
    category: 'WikiLinks'
  },
  {
    feature: 'Link with Display Text',
    syntax: '[[Note Title|Custom Label]]',
    renderedResult: 'Custom Label',
    explanation: 'Shows custom text while pointing to the target note.',
    category: 'WikiLinks'
  },
  {
    feature: 'Heading Link',
    syntax: '[[Note Title#Section Name]]',
    renderedResult: 'Note Title > Section Name',
    explanation: 'Links directly to a specific H1-H6 heading.',
    category: 'WikiLinks'
  },
  {
    feature: 'Block Link',
    syntax: '[[Note Title#^block-id]]',
    renderedResult: 'Note Title > ^block-id',
    explanation: 'Links directly to a specific block or paragraph.',
    category: 'WikiLinks'
  },
  {
    feature: 'Note Embed (Transclusion)',
    syntax: '![[Note Title]]',
    renderedResult: '[Embedded Live Note Content]',
    explanation: 'Displays live content from another note directly inside the article.',
    category: 'Embeds'
  },
  {
    feature: 'Image Embed & Resize',
    syntax: '![[diagram.png|300]]',
    renderedResult: '[Image rendered at 300px width]',
    explanation: 'Embeds an image attachment with custom pixel width.',
    category: 'Embeds'
  },
  {
    feature: 'Note Callout Box',
    syntax: '> [!NOTE] Title\n> Body text',
    renderedResult: '📘 Title: Body text',
    explanation: 'Creates an eye-catching callout box.',
    category: 'Callouts'
  },
  {
    feature: 'Collapsible Callout',
    syntax: '> [!TIP]- Collapsed Title\n> Hidden content',
    renderedResult: '💡 Collapsed Title [> Expand]',
    explanation: 'Callout box that starts folded shut.',
    category: 'Callouts'
  },
  {
    feature: 'Properties (Frontmatter)',
    syntax: '---\ntags: [wiki, guide]\nstatus: active\n---',
    renderedResult: 'Metadata Panel: tags, status',
    explanation: 'Structured key-value properties block at top of note.',
    category: 'Properties'
  },
  {
    feature: 'Dataview Table Query',
    syntax: '```dataview\nTABLE status, created\nFROM #wiki\n```',
    renderedResult: 'Interactive Data Table',
    explanation: 'Generates a live table of notes filtered by tag or folder.',
    category: 'Dataview'
  }
];

export const INITIAL_SANDBOX_NOTES = [
  {
    id: 'note-1',
    title: 'Obsidian Wiki Overview',
    tags: ['wiki', 'overview', 'master'],
    status: 'Active',
    category: 'Core Knowledge',
    content: `---
title: Obsidian Wiki Overview
tags: [wiki, overview, master]
status: Active
category: Core Knowledge
created: 2026-08-05
---

# Welcome to Your Obsidian Wiki

Obsidian is a powerful **Markdown-based knowledge base** that stores data locally in plain text.

> [!TIP] Key Advantage
> You own your data forever with zero vendor lock-in! All notes are standard \`.md\` files.

## Key Wiki Features
1. Bi-directional linking with [[WikiLinks Syntax]]
2. Live content embeds with ![[Markdown Formatting Guide#Callouts]]
3. Interactive network visualization with [[Graph View Masterclass]]
4. Structured metadata properties powered by [[Dataview Queries]]

## Related Notes
- [[WikiLinks Syntax]]
- [[Markdown Formatting Guide]]
- [[Graph View Masterclass]]
- [[Dataview Queries]]`
  },
  {
    id: 'note-2',
    title: 'WikiLinks Syntax',
    tags: ['linking', 'syntax'],
    status: 'Active',
    category: 'Core Syntax',
    content: `---
title: WikiLinks Syntax
tags: [linking, syntax]
status: Active
category: Core Syntax
created: 2026-08-05
---

# WikiLinks & References

Internal links create a bi-directional connection between notes.

## Syntax Variants
- Standard link: [[Obsidian Wiki Overview]]
- Link with display alias: [[Obsidian Wiki Overview|Read Overview Note]]
- Link to section: [[Markdown Formatting Guide#Callouts]]

> [!NOTE] Auto Refactoring
> Renaming a note automatically updates all links in your vault!

## Backlinks
Check the Backlinks pane on the right sidebar to see all incoming connections from [[Obsidian Wiki Overview]].`
  },
  {
    id: 'note-3',
    title: 'Markdown Formatting Guide',
    tags: ['formatting', 'callouts'],
    status: 'Active',
    category: 'Formatting',
    content: `---
title: Markdown Formatting Guide
tags: [formatting, callouts]
status: Active
category: Formatting
created: 2026-08-05
---

# Markdown & Callouts

Customize your wiki pages with expressive Markdown controls.

## Callouts
> [!NOTE] Information Box
> Standard informative callout box.

> [!WARNING] Warning Box
> Use callouts to draw attention to critical wiki instructions.

> [!SUCCESS] Success Box
> Operation completed successfully!

## Task Lists
- [x] Configure Obsidian settings
- [x] Create folder architecture
- [ ] Build first Map of Content (MOC)`
  },
  {
    id: 'note-4',
    title: 'Graph View Masterclass',
    tags: ['visualization', 'graph'],
    status: 'Draft',
    category: 'Visualization',
    content: `---
title: Graph View Masterclass
tags: [visualization, graph]
status: Draft
category: Visualization
created: 2026-08-05
---

# Graph View Network

The Graph View visualizes connections between notes like neural synapses.

## Graph Features
- Node size scales with total incoming/outgoing links
- Color groups organize nodes by tags like \`#wiki\` or \`#formatting\`
- Local graph shows relationships up to 5 hops away from [[Obsidian Wiki Overview]]`
  },
  {
    id: 'note-5',
    title: 'Dataview Queries',
    tags: ['dataview', 'automation'],
    status: 'Active',
    category: 'Automation',
    content: `---
title: Dataview Queries
tags: [dataview, automation]
status: Active
category: Automation
created: 2026-08-05
---

# Dataview Query Engine

Turn notes into dynamic databases with DQL syntax.

## Example Query
\`\`\`dataview
TABLE status, category, tags
FROM #wiki OR #linking
SORT created DESC
\`\`\`

Connects back to [[Obsidian Wiki Overview]] and [[WikiLinks Syntax]].`
  }
];
