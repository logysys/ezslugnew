import { useState } from 'react';
import MDEditor, { commands, ICommand, TextState, TextAreaTextApi } from '@uiw/react-md-editor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFillDrip, 
  faFont, 
  faTable, 
  faBolt,
  faCode 
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import "@uiw/react-md-editor/markdown-editor.css";

// Create color command
const createColorCommand = (isBackground = false): ICommand => {
  let colorPickerModal: HTMLDivElement | null = null;

  return {
    name: isBackground ? 'backgroundColor' : 'color',
    keyCommand: isBackground ? 'backgroundColor' : 'color',
    buttonProps: {
      'aria-label': isBackground ? 'Add background color' : 'Add text color',
      'data-tooltip-id': 'mdeditor-tooltip',
      'data-tooltip-content': isBackground ? 'Background Color' : 'Text Color'
    },
    icon: (
      <div className="flex items-center justify-center w-5 h-5">
        <FontAwesomeIcon
          icon={isBackground ? faFillDrip : faFont}
          className="text-current text-sm"
        />
      </div>
    ),
    execute: (state: TextState, api: TextAreaTextApi) => {
      // Remove existing modal if any
      const existingModal = document.getElementById('color-picker-modal');
      if (existingModal) {
        document.body.removeChild(existingModal);
      }

      // Create modal container
      colorPickerModal = document.createElement('div');
      colorPickerModal.id = 'color-picker-modal';
      colorPickerModal.style.position = 'fixed';
      colorPickerModal.style.top = '0';
      colorPickerModal.style.left = '0';
      colorPickerModal.style.width = '100%';
      colorPickerModal.style.height = '100%';
      colorPickerModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      colorPickerModal.style.display = 'flex';
      colorPickerModal.style.alignItems = 'center';
      colorPickerModal.style.justifyContent = 'center';
      colorPickerModal.style.zIndex = '10000';
      colorPickerModal.style.backdropFilter = 'blur(8px)';

      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#2d3748';
      modalContent.style.padding = '24px';
      modalContent.style.borderRadius = '16px';
      modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
      modalContent.style.width = '90%';
      modalContent.style.maxWidth = '420px';
      modalContent.style.border = '1px solid #4a5568';

      // Create header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '20px';

      const title = document.createElement('h3');
      title.textContent = isBackground ? 'Choose Background Color' : 'Choose Text Color';
      title.style.color = 'white';
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.margin = '0';

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.background = 'none';
      closeBtn.style.border = 'none';
      closeBtn.style.color = 'white';
      closeBtn.style.fontSize = '24px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.width = '32px';
      closeBtn.style.height = '32px';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.display = 'flex';
      closeBtn.style.alignItems = 'center';
      closeBtn.style.justifyContent = 'center';
      closeBtn.style.transition = 'background-color 0.2s';

      closeBtn.onmouseenter = () => closeBtn.style.backgroundColor = '#4a5568';
      closeBtn.onmouseleave = () => closeBtn.style.backgroundColor = 'transparent';
      closeBtn.onclick = () => {
        if (colorPickerModal && colorPickerModal.parentNode) {
          document.body.removeChild(colorPickerModal);
        }
      };

      header.appendChild(title);
      header.appendChild(closeBtn);

      // Create color grid
      const colorGrid = document.createElement('div');
      colorGrid.style.display = 'grid';
      colorGrid.style.gridTemplateColumns = 'repeat(6, 1fr)';
      colorGrid.style.gap = '8px';
      colorGrid.style.marginBottom = '20px';

      const colorPresets = [
        '#FF0000', '#FF6B6B', '#FFA500', '#FFD93D', '#6BCF7F', '#4ECDC4',
        '#45B7D1', '#4D96FF', '#5D6DFF', '#9B59B6', '#FF9FF3', '#F368E0',
        '#FFFFFF', '#F1F2F6', '#DFE4EA', '#CED6E0', '#A4B0BE', '#747D8C',
        '#57606F', '#2F3542', '#000000', '#2D3436', '#636E72', '#B2BEC3'
      ];

      colorPresets.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.style.width = '40px';
        colorBtn.style.height = '40px';
        colorBtn.style.borderRadius = '8px';
        colorBtn.style.border = '2px solid #4a5568';
        colorBtn.style.cursor = 'pointer';
        colorBtn.style.transition = 'all 0.2s';
        colorBtn.style.backgroundColor = color;

        colorBtn.onmouseenter = () => {
          colorBtn.style.transform = 'scale(1.1)';
          colorBtn.style.borderColor = '#fff';
        };
        colorBtn.onmouseleave = () => {
          colorBtn.style.transform = 'scale(1)';
          colorBtn.style.borderColor = '#4a5568';
        };

        colorBtn.onclick = () => {
          const selectedColor = color;
          const markdown = isBackground
            ? `<span style="background-color: ${selectedColor}">${state.selectedText}</span>`
            : `<span style="color: ${selectedColor}">${state.selectedText}</span>`;

          api.replaceSelection(markdown);
          if (colorPickerModal && colorPickerModal.parentNode) {
            document.body.removeChild(colorPickerModal);
          }
        };

        colorGrid.appendChild(colorBtn);
      });

      // Create custom color input
      const customColorContainer = document.createElement('div');
      customColorContainer.style.marginBottom = '20px';

      const customColorLabel = document.createElement('label');
      customColorLabel.textContent = 'Custom Color:';
      customColorLabel.style.color = 'white';
      customColorLabel.style.display = 'block';
      customColorLabel.style.marginBottom = '8px';
      customColorLabel.style.fontSize = '14px';

      const customColorInput = document.createElement('input');
      customColorInput.type = 'color';
      customColorInput.value = '#FF0000';
      customColorInput.style.width = '60px';
      customColorInput.style.height = '60px';
      customColorInput.style.borderRadius = '12px';
      customColorInput.style.border = '2px solid #4a5568';
      customColorInput.style.cursor = 'pointer';

      const applyCustomColor = document.createElement('button');
      applyCustomColor.textContent = 'Apply Custom Color';
      applyCustomColor.style.marginLeft = '12px';
      applyCustomColor.style.padding = '12px 16px';
      applyCustomColor.style.backgroundColor = '#4299e1';
      applyCustomColor.style.color = 'white';
      applyCustomColor.style.border = 'none';
      applyCustomColor.style.borderRadius = '8px';
      applyCustomColor.style.cursor = 'pointer';
      applyCustomColor.style.fontWeight = 'bold';
      applyCustomColor.style.transition = 'background-color 0.2s';

      applyCustomColor.onmouseenter = () => applyCustomColor.style.backgroundColor = '#3182ce';
      applyCustomColor.onmouseleave = () => applyCustomColor.style.backgroundColor = '#4299e1';

      applyCustomColor.onclick = () => {
        const selectedColor = customColorInput.value;
        const markdown = isBackground
          ? `<span style="background-color: ${selectedColor}">${state.selectedText}</span>`
          : `<span style="color: ${selectedColor}">${state.selectedText}</span>`;

        api.replaceSelection(markdown);
        if (colorPickerModal && colorPickerModal.parentNode) {
          document.body.removeChild(colorPickerModal);
        }
      };

      const customColorRow = document.createElement('div');
      customColorRow.style.display = 'flex';
      customColorRow.style.alignItems = 'center';
      customColorRow.appendChild(customColorInput);
      customColorRow.appendChild(applyCustomColor);

      customColorContainer.appendChild(customColorLabel);
      customColorContainer.appendChild(customColorRow);

      // Assemble modal
      modalContent.appendChild(header);
      modalContent.appendChild(colorGrid);
      modalContent.appendChild(customColorContainer);
      colorPickerModal.appendChild(modalContent);

      // Close on background click
      colorPickerModal.onclick = (e) => {
        if (e.target === colorPickerModal) {
          if (colorPickerModal.parentNode) {
            document.body.removeChild(colorPickerModal);
          }
        }
      };

      document.body.appendChild(colorPickerModal);
    },
  };
};

// HTML Content command - inserts complete HTML structure
const htmlContentCommand: ICommand = {
    name: 'htmlContent',
    keyCommand: 'htmlContent',
    buttonProps: {
        'aria-label': 'Insert HTML content',
        'data-tooltip-id': 'mdeditor-tooltip',
        'data-tooltip-content': 'Insert HTML Content'
    },
    icon: (
        <div className="flex items-center justify-center w-5 h-5">
            <FontAwesomeIcon icon={faCode} className="text-current text-sm" />
        </div>
    ),
    execute: (state: TextState, api: TextAreaTextApi) => {
        // Show a modal to input HTML content
        const existingModal = document.getElementById('html-modal');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'html-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000';
        modal.style.backdropFilter = 'blur(8px)';

        // Modal content
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#1a202c';
        modalContent.style.padding = '28px';
        modalContent.style.borderRadius = '16px';
        modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7)';
        modalContent.style.width = '90%';
        modalContent.style.maxWidth = '800px';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflow = 'auto';
        modalContent.style.border = '1px solid #4a5568';

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '16px';

        const title = document.createElement('h3');
        title.textContent = 'Insert HTML Content';
        title.style.color = 'white';
        title.style.fontSize = '18px';
        title.style.fontWeight = 'bold';
        title.style.margin = '0';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '4px 10px';
        closeBtn.style.borderRadius = '6px';
        closeBtn.style.transition = 'background-color 0.2s';
        closeBtn.onmouseenter = () => closeBtn.style.backgroundColor = '#4a5568';
        closeBtn.onmouseleave = () => closeBtn.style.backgroundColor = 'transparent';
        closeBtn.onclick = () => {
            if (modal.parentNode) document.body.removeChild(modal);
        };

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Description
        const desc = document.createElement('p');
        desc.textContent = 'Paste your HTML code below. It will be rendered as a full page preview.';
        desc.style.color = '#a0aec0';
        desc.style.fontSize = '14px';
        desc.style.marginBottom = '16px';

        // HTML Textarea
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = '300px';
        textarea.style.backgroundColor = '#0d1117';
        textarea.style.color = '#e2e8f0';
        textarea.style.border = '1px solid #4a5568';
        textarea.style.borderRadius = '8px';
        textarea.style.padding = '12px';
        textarea.style.fontSize = '13px';
        textarea.style.fontFamily = 'monospace';
        textarea.style.resize = 'vertical';
        textarea.style.outline = 'none';
        textarea.style.transition = 'border-color 0.2s';
        textarea.placeholder = `<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <style>
    body { background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`;

        textarea.onfocus = () => textarea.style.borderColor = '#5a67d8';
        textarea.onblur = () => textarea.style.borderColor = '#4a5568';

        // Options
        const optionsRow = document.createElement('div');
        optionsRow.style.display = 'flex';
        optionsRow.style.alignItems = 'center';
        optionsRow.style.gap = '16px';
        optionsRow.style.marginTop = '16px';
        optionsRow.style.marginBottom = '16px';

        const wrapLabel = document.createElement('label');
        wrapLabel.style.color = '#e2e8f0';
        wrapLabel.style.fontSize = '13px';
        wrapLabel.style.display = 'flex';
        wrapLabel.style.alignItems = 'center';
        wrapLabel.style.gap = '8px';
        wrapLabel.style.cursor = 'pointer';

        const wrapCheckbox = document.createElement('input');
        wrapCheckbox.type = 'checkbox';
        wrapCheckbox.checked = true;
        wrapCheckbox.style.width = '16px';
        wrapCheckbox.style.height = '16px';
        wrapCheckbox.style.accentColor = '#5a67d8';
        wrapLabel.appendChild(wrapCheckbox);
        wrapLabel.appendChild(document.createTextNode('Wrap in HTML block (recommended)'));

        optionsRow.appendChild(wrapLabel);

        // Buttons row
        const buttonsRow = document.createElement('div');
        buttonsRow.style.display = 'flex';
        buttonsRow.style.gap = '12px';
        buttonsRow.style.justifyContent = 'flex-end';
        buttonsRow.style.marginTop = '16px';

        const previewBtn = document.createElement('button');
        previewBtn.textContent = '👁️ Preview';
        previewBtn.style.padding = '10px 20px';
        previewBtn.style.backgroundColor = '#2d3748';
        previewBtn.style.color = '#e2e8f0';
        previewBtn.style.border = '1px solid #4a5568';
        previewBtn.style.borderRadius = '8px';
        previewBtn.style.cursor = 'pointer';
        previewBtn.style.fontWeight = '500';
        previewBtn.style.transition = 'all 0.2s';
        previewBtn.onmouseenter = () => {
            previewBtn.style.backgroundColor = '#4a5568';
            previewBtn.style.transform = 'translateY(-1px)';
        };
        previewBtn.onmouseleave = () => {
            previewBtn.style.backgroundColor = '#2d3748';
            previewBtn.style.transform = 'translateY(0)';
        };

        previewBtn.onclick = () => {
            const content = textarea.value.trim();
            if (!content) {
                showToast('Please enter HTML content first.', 'warning');
                return;
            }
            // Open in new window
            const newWindow = window.open('', '_blank', 'width=1024,height=768');
            if (newWindow) {
                newWindow.document.write(content);
                newWindow.document.close();
            }
        };

        const insertBtn = document.createElement('button');
        insertBtn.textContent = '✅ Insert HTML';
        insertBtn.style.padding = '10px 24px';
        insertBtn.style.backgroundColor = '#5a67d8';
        insertBtn.style.color = 'white';
        insertBtn.style.border = 'none';
        insertBtn.style.borderRadius = '8px';
        insertBtn.style.cursor = 'pointer';
        insertBtn.style.fontWeight = 'bold';
        insertBtn.style.transition = 'all 0.2s';
        insertBtn.onmouseenter = () => {
            insertBtn.style.backgroundColor = '#4c51bf';
            insertBtn.style.transform = 'translateY(-1px)';
            insertBtn.style.boxShadow = '0 4px 12px rgba(90, 103, 216, 0.4)';
        };
        insertBtn.onmouseleave = () => {
            insertBtn.style.backgroundColor = '#5a67d8';
            insertBtn.style.transform = 'translateY(0)';
            insertBtn.style.boxShadow = 'none';
        };

        insertBtn.onclick = () => {
            const content = textarea.value.trim();
            if (!content) {
                showToast('Please enter HTML content first.', 'warning');
                return;
            }

            // Escape backticks and wrap in code block
            const escapedContent = content.replace(/```/g, '\\`\\`\\`');
            const markdown = wrapCheckbox.checked
                ? `\n\n\`\`\`html\n${escapedContent}\n\`\`\`\n\n`
                : `\n\n${escapedContent}\n\n`;

            api.replaceSelection(markdown);
            if (modal.parentNode) document.body.removeChild(modal);
            showToast('HTML content inserted successfully!', 'success');
        };

        buttonsRow.appendChild(previewBtn);
        buttonsRow.appendChild(insertBtn);

        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(desc);
        modalContent.appendChild(textarea);
        modalContent.appendChild(optionsRow);
        modalContent.appendChild(buttonsRow);
        modal.appendChild(modalContent);

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                if (modal.parentNode) document.body.removeChild(modal);
            }
        };

        document.body.appendChild(modal);
        // Focus textarea
        setTimeout(() => textarea.focus(), 100);
    },
};

// Helper toast function (internal)
function showToast(message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') {
    const existing = document.getElementById('html-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'html-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = type === 'warning' ? '#975a16' : 
                                type === 'error' ? '#991b1b' : 
                                type === 'success' ? '#065f46' : '#1e40af';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.5)';
    toast.style.zIndex = '99999';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.backdropFilter = 'blur(8px)';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Advanced table command
const advancedTableCommand: ICommand = {
    name: 'advancedTable',
    keyCommand: 'advancedTable',
    buttonProps: {
        'aria-label': 'Insert advanced table',
        'data-tooltip-id': 'mdeditor-tooltip',
        'data-tooltip-content': 'Advanced Table'
    },
    icon: (
        <div className="flex items-center justify-center w-5 h-5">
            <FontAwesomeIcon icon={faTable} className="text-current text-sm" />
        </div>
    ),
    execute: (state: TextState, api: TextAreaTextApi) => {
        const tableMarkdown = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
        api.replaceSelection(tableMarkdown);
    },
};

// Macros command
const macrosCommand: ICommand = {
    name: 'macros',
    keyCommand: 'macros',
    buttonProps: {
        'aria-label': 'Insert macros',
        'data-tooltip-id': 'mdeditor-tooltip',
        'data-tooltip-content': 'Insert Macros'
    },
    icon: (
        <div className="flex items-center justify-center w-5 h-5">
            <FontAwesomeIcon icon={faBolt} className="text-current text-sm" />
        </div>
    ),
    execute: (state: TextState, api: TextAreaTextApi) => {
        const macrosList = [
            '{{date:YYYY-MM-DD}}',
            '{{time:HH:mm}}',
            '{{user:name}}',
            '{{random:1-100}}'
        ];
        api.replaceSelection(macrosList[0]);
    },
};

interface EnhancedMDEditorProps {
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function EnhancedMDEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Write your content here...',
  minHeight = 150 
}: EnhancedMDEditorProps) {
  const customCommands = [
    commands.bold,
    commands.italic,
    commands.strikethrough,
    commands.hr,
    commands.group(
      [
        commands.title1,
        commands.title2,
        commands.title3,
        commands.title4,
        commands.title5,
        commands.title6,
      ],
      {
        name: 'title',
        groupName: 'title',
        buttonProps: {
          'aria-label': 'Insert title',
          'data-tooltip-id': 'mdeditor-tooltip',
          'data-tooltip-content': 'Headings'
        },
      }
    ),
    commands.divider,
    commands.link,
    commands.quote,
    commands.code,
    commands.codeBlock,
    commands.comment,
    commands.image,
    commands.divider,
    commands.unorderedListCommand,
    commands.orderedListCommand,
    commands.checkedListCommand,
    advancedTableCommand,
    macrosCommand,
    commands.divider,
    createColorCommand(false), // Text color
    createColorCommand(true),  // Background color
    commands.divider,
    htmlContentCommand, // New HTML content command
  ];

  return (
    <div className="enhanced-md-editor" data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={onChange}
        commands={customCommands}
        textareaProps={{
          placeholder: placeholder,
        }}
        height={minHeight}
      />
      <Tooltip id="mdeditor-tooltip" />
      <style>{`
        .enhanced-md-editor .w-md-editor {
          border: 1px solid #4a5568 !important;
          border-radius: 0.75rem !important;
          overflow: hidden;
        }
        .enhanced-md-editor .w-md-editor-toolbar {
          background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%) !important;
          border-bottom: 1px solid #4a5568 !important;
          padding: 12px !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
        }
        .enhanced-md-editor .w-md-editor-toolbar button {
          color: #cbd5e0 !important;
          border-radius: 0.5rem !important;
          margin: 0 2px !important;
          padding: 6px 8px !important;
          transition: all 0.2s ease !important;
        }
        .enhanced-md-editor .w-md-editor-toolbar button:hover {
          background: linear-gradient(135deg, #4a5568 0%, #5a67d8 100%) !important;
          color: white !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .enhanced-md-editor .w-md-editor-content {
          background-color: #1a202c !important;
        }
        .enhanced-md-editor .w-md-editor-text {
          background-color: #1a202c !important;
          color: white !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
        .enhanced-md-editor .w-md-editor-text-pre {
          color: white !important;
        }
        .enhanced-md-editor .w-md-editor-preview {
          background-color: #1a202c !important;
          color: white !important;
          border-left: 1px solid #4a5568 !important;
        }
        .enhanced-md-editor ::-webkit-scrollbar {
          width: 8px;
        }
        .enhanced-md-editor ::-webkit-scrollbar-track {
          background: #2d3748;
        }
        .enhanced-md-editor ::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 4px;
        }
        .enhanced-md-editor ::-webkit-scrollbar-thumb:hover {
          background: #5a67d8;
        }
        /* Style for code blocks in preview */
        .enhanced-md-editor .w-md-editor-preview pre {
          background-color: #0d1117 !important;
          border-radius: 8px !important;
          padding: 16px !important;
          border: 1px solid #4a5568 !important;
        }
        .enhanced-md-editor .w-md-editor-preview code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
      `}</style>
    </div>
  );
}