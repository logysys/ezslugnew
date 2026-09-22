import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import '@google/model-viewer';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
// FontAwesome imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faCode, faChevronRight, faQrcode, faPlus, faCheckCircle, faExclamationTriangle, faTimes, faCoins, faMinus, faSearch, faLayerGroup, faArrowUp, faArrowDown, faFilePdf, faFillDrip, faFont, faTable, faBolt, faEyedropper, faExternalLinkAlt, faLink, faEye } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faFacebook, faLinkedin, faTumblr, faPinterest, faReddit, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faClock, faThumbsUp, faComment, faHeart, faBookmark } from '@fortawesome/free-regular-svg-icons';

// Minimal SharedData types
type SharedData = {
    template: {
        image: string;
        user_id: number;
        option: string;
    } | null;
    auth: {
        user: {
            id: number;
            email?: string;
        } | null;
    };
};

type Domain = {
    id: number;
    domain: string;
};

// Placeholder components
const Checkbox = (props: any) => <input type="checkbox" {...props} data-state={props.checked ? 'checked' : 'unchecked'} />;
const Label = (props: any) => <label {...props}>{props.children}</label>;

// Import MDEditor and types
import MDEditor, { commands, ICommand, TextState, TextAreaTextApi } from '@uiw/react-md-editor';
import "@uiw/react-md-editor/markdown-editor.css";

// Enhanced MDEditor with color commands
const EnhancedMDEditor = ({ value, onChange }: { value?: string; onChange: (value?: string) => void }) => {
  let colorPickerModal: HTMLDivElement | null = null;

  const createColorCommand = (isBackground = false): ICommand => {
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
      const tableModal = document.createElement('div');
      tableModal.id = 'table-modal';
      tableModal.style.position = 'fixed';
      tableModal.style.top = '0';
      tableModal.style.left = '0';
      tableModal.style.width = '100%';
      tableModal.style.height = '100%';
      tableModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      tableModal.style.display = 'flex';
      tableModal.style.alignItems = 'center';
      tableModal.style.justifyContent = 'center';
      tableModal.style.zIndex = '10000';
      tableModal.style.backdropFilter = 'blur(8px)';

      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#2d3748';
      modalContent.style.padding = '24px';
      modalContent.style.borderRadius = '16px';
      modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
      modalContent.style.width = '90%';
      modalContent.style.maxWidth = '500px';
      modalContent.style.border = '1px solid #4a5568';

      // Header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '20px';

      const title = document.createElement('h3');
      title.textContent = 'Create Table';
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
        if (tableModal.parentNode) {
          document.body.removeChild(tableModal);
        }
      };

      header.appendChild(title);
      header.appendChild(closeBtn);

      // Table Configuration
      const configContainer = document.createElement('div');
      configContainer.style.marginBottom = '20px';

      // Rows input
      const rowsContainer = document.createElement('div');
      rowsContainer.style.marginBottom = '12px';

      const rowsLabel = document.createElement('label');
      rowsLabel.textContent = 'Number of Rows:';
      rowsLabel.style.color = 'white';
      rowsLabel.style.display = 'block';
      rowsLabel.style.marginBottom = '4px';

      const rowsInput = document.createElement('input');
      rowsInput.type = 'number';
      rowsInput.min = '1';
      rowsInput.max = '20';
      rowsInput.value = '3';
      rowsInput.style.width = '100%';
      rowsInput.style.padding = '8px';
      rowsInput.style.backgroundColor = '#4a5568';
      rowsInput.style.border = '1px solid #718096';
      rowsInput.style.borderRadius = '4px';
      rowsInput.style.color = 'white';

      rowsContainer.appendChild(rowsLabel);
      rowsContainer.appendChild(rowsInput);

      // Columns input
      const colsContainer = document.createElement('div');
      colsContainer.style.marginBottom = '12px';

      const colsLabel = document.createElement('label');
      colsLabel.textContent = 'Number of Columns:';
      colsLabel.style.color = 'white';
      colsLabel.style.display = 'block';
      colsLabel.style.marginBottom = '4px';

      const colsInput = document.createElement('input');
      colsInput.type = 'number';
      colsInput.min = '1';
      colsInput.max = '10';
      colsInput.value = '3';
      colsInput.style.width = '100%';
      colsInput.style.padding = '8px';
      colsInput.style.backgroundColor = '#4a5568';
      colsInput.style.border = '1px solid #718096';
      colsInput.style.borderRadius = '4px';
      colsInput.style.color = 'white';

      colsContainer.appendChild(colsLabel);
      colsContainer.appendChild(colsInput);

      // Include header checkbox
      const headerContainer = document.createElement('div');
      headerContainer.style.marginBottom = '12px';

      const headerCheckbox = document.createElement('input');
      headerCheckbox.type = 'checkbox';
      headerCheckbox.id = 'includeHeader';
      headerCheckbox.checked = true;
      headerCheckbox.style.marginRight = '8px';

      const headerLabel = document.createElement('label');
      headerLabel.htmlFor = 'includeHeader';
      headerLabel.textContent = 'Include header row';
      headerLabel.style.color = 'white';

      headerContainer.appendChild(headerCheckbox);
      headerContainer.appendChild(headerLabel);

      configContainer.appendChild(rowsContainer);
      configContainer.appendChild(colsContainer);
      configContainer.appendChild(headerContainer);

      // Generate button
      const generateButton = document.createElement('button');
      generateButton.textContent = 'Generate Table';
      generateButton.style.width = '100%';
      generateButton.style.padding = '12px';
      generateButton.style.backgroundColor = '#4299e1';
      generateButton.style.color = 'white';
      generateButton.style.border = 'none';
      generateButton.style.borderRadius = '8px';
      generateButton.style.cursor = 'pointer';
      generateButton.style.fontWeight = 'bold';
      generateButton.style.transition = 'background-color 0.2s';

      generateButton.onmouseenter = () => generateButton.style.backgroundColor = '#3182ce';
      generateButton.onmouseleave = () => generateButton.style.backgroundColor = '#4299e1';

      generateButton.onclick = () => {
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);
        const includeHeader = headerCheckbox.checked;

        let tableMarkdown = '';

        if (includeHeader) {
          // Header row
          tableMarkdown += '|';
          for (let i = 0; i < cols; i++) {
            tableMarkdown += ` Header ${i + 1} |`;
          }
          tableMarkdown += '\n|';

          // Separator row
          for (let i = 0; i < cols; i++) {
            tableMarkdown += '----------|';
          }
          tableMarkdown += '\n';
        }

        // Data rows
        const startRow = includeHeader ? 0 : 1;
        const totalRows = includeHeader ? rows : rows + 1;

        for (let i = startRow; i < totalRows; i++) {
          tableMarkdown += '|';
          for (let j = 0; j < cols; j++) {
            tableMarkdown += ` Cell ${i + 1}-${j + 1} |`;
          }
          if (i < totalRows - 1) {
            tableMarkdown += '\n';
          }
        }

        api.replaceSelection(tableMarkdown);
        if (tableModal.parentNode) {
          document.body.removeChild(tableModal);
        }
      };

      // Assemble modal
      modalContent.appendChild(header);
      modalContent.appendChild(configContainer);
      modalContent.appendChild(generateButton);
      tableModal.appendChild(modalContent);

      // Close on background click
      tableModal.onclick = (e) => {
        if (e.target === tableModal) {
          if (tableModal.parentNode) {
            document.body.removeChild(tableModal);
          }
        }
      };

      document.body.appendChild(tableModal);
    },
  };

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
      // Create modal for macros selection
      const macrosModal = document.createElement('div');
      macrosModal.id = 'macros-modal';
      macrosModal.style.position = 'fixed';
      macrosModal.style.top = '0';
      macrosModal.style.left = '0';
      macrosModal.style.width = '100%';
      macrosModal.style.height = '100%';
      macrosModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      macrosModal.style.display = 'flex';
      macrosModal.style.alignItems = 'center';
      macrosModal.style.justifyContent = 'center';
      macrosModal.style.zIndex = '10000';
      macrosModal.style.backdropFilter = 'blur(8px)';

      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#2d3748';
      modalContent.style.padding = '24px';
      modalContent.style.borderRadius = '16px';
      modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
      modalContent.style.width = '90%';
      modalContent.style.maxWidth = '500px';
      modalContent.style.border = '1px solid #4a5568';

      // Header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '20px';

      const title = document.createElement('h3');
      title.textContent = 'Insert Macros';
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
        if (macrosModal.parentNode) {
          document.body.removeChild(macrosModal);
        }
      };

      header.appendChild(title);
      header.appendChild(closeBtn);

      // Macros Grid
      const macrosGrid = document.createElement('div');
      macrosGrid.style.display = 'grid';
      macrosGrid.style.gridTemplateColumns = '1fr';
      macrosGrid.style.gap = '12px';

      const macrosList = [
        {
          name: 'Current Date',
          description: 'Insert current date',
          code: `{{date:YYYY-MM-DD}}`
        },
        {
          name: 'Current Time',
          description: 'Insert current time',
          code: `{{time:HH:mm}}`
        },
        {
          name: 'User Name',
          description: 'Insert current user name',
          code: `{{user:name}}`
        },
        {
          name: 'Random Number',
          description: 'Generate random number',
          code: `{{random:1-100}}`
        },
        {
          name: 'Page Title',
          description: 'Insert page title',
          code: `{{page:title}}`
        },
        {
          name: 'Custom Variable',
          description: 'Insert custom variable',
          code: `{{var:variable_name}}`
        }
      ];

      macrosList.forEach(macro => {
        const macroButton = document.createElement('button');
        macroButton.style.padding = '16px';
        macroButton.style.backgroundColor = '#4a5568';
        macroButton.style.border = '1px solid #718096';
        macroButton.style.borderRadius = '8px';
        macroButton.style.cursor = 'pointer';
        macroButton.style.transition = 'all 0.2s';
        macroButton.style.textAlign = 'left';
        macroButton.style.color = 'white';

        macroButton.onmouseenter = () => {
          macroButton.style.backgroundColor = '#5a67d8';
          macroButton.style.borderColor = '#5a67d8';
          macroButton.style.transform = 'translateY(-2px)';
        };

        macroButton.onmouseleave = () => {
          macroButton.style.backgroundColor = '#4a5568';
          macroButton.style.borderColor = '#718096';
          macroButton.style.transform = 'translateY(0)';
        };

        macroButton.onclick = () => {
          api.replaceSelection(macro.code);
          if (macrosModal.parentNode) {
            document.body.removeChild(macrosModal);
          }
        };

        const macroName = document.createElement('div');
        macroName.textContent = macro.name;
        macroName.style.fontWeight = 'bold';
        macroName.style.marginBottom = '4px';

        const macroDesc = document.createElement('div');
        macroDesc.textContent = macro.description;
        macroDesc.style.fontSize = '12px';
        macroDesc.style.color = '#cbd5e0';

        const macroCode = document.createElement('div');
        macroCode.textContent = macro.code;
        macroCode.style.fontFamily = 'monospace';
        macroCode.style.fontSize = '11px';
        macroCode.style.color = '#90cdf4';
        macroCode.style.marginTop = '8px';
        macroCode.style.padding = '4px 8px';
        macroCode.style.backgroundColor = '#2d3748';
        macroCode.style.borderRadius = '4px';

        macroButton.appendChild(macroName);
        macroButton.appendChild(macroDesc);
        macroButton.appendChild(macroCode);

        macrosGrid.appendChild(macroButton);
      });

      // Custom Macro Input
      const customMacroContainer = document.createElement('div');
      customMacroContainer.style.marginTop = '20px';
      customMacroContainer.style.paddingTop = '20px';
      customMacroContainer.style.borderTop = '1px solid #4a5568';

      const customLabel = document.createElement('label');
      customLabel.textContent = 'Custom Macro:';
      customLabel.style.color = 'white';
      customLabel.style.display = 'block';
      customLabel.style.marginBottom = '8px';
      customLabel.style.fontSize = '14px';

      const customInput = document.createElement('input');
      customInput.type = 'text';
      customInput.placeholder = 'Enter custom macro code...';
      customInput.style.width = '100%';
      customInput.style.padding = '12px';
      customInput.style.backgroundColor = '#4a5568';
      customInput.style.border = '1px solid #718096';
      customInput.style.borderRadius = '8px';
      customInput.style.color = 'white';
      customInput.style.marginBottom = '12px';

      const insertCustomButton = document.createElement('button');
      insertCustomButton.textContent = 'Insert Custom Macro';
      insertCustomButton.style.width = '100%';
      insertCustomButton.style.padding = '12px';
      insertCustomButton.style.backgroundColor = '#4299e1';
      insertCustomButton.style.color = 'white';
      insertCustomButton.style.border = 'none';
      insertCustomButton.style.borderRadius = '8px';
      insertCustomButton.style.cursor = 'pointer';
      insertCustomButton.style.fontWeight = 'bold';
      insertCustomButton.style.transition = 'background-color 0.2s';

      insertCustomButton.onmouseenter = () => insertCustomButton.style.backgroundColor = '#3182ce';
      insertCustomButton.onmouseleave = () => insertCustomButton.style.backgroundColor = '#4299e1';

      insertCustomButton.onclick = () => {
        if (customInput.value.trim()) {
          api.replaceSelection(customInput.value.trim());
          if (macrosModal.parentNode) {
            document.body.removeChild(macrosModal);
          }
        }
      };

      customMacroContainer.appendChild(customLabel);
      customMacroContainer.appendChild(customInput);
      customMacroContainer.appendChild(insertCustomButton);

      // Assemble modal
      modalContent.appendChild(header);
      modalContent.appendChild(macrosGrid);
      modalContent.appendChild(customMacroContainer);
      macrosModal.appendChild(modalContent);

      // Close on background click
      macrosModal.onclick = (e) => {
        if (e.target === macrosModal) {
          if (macrosModal.parentNode) {
            document.body.removeChild(macrosModal);
          }
        }
      };

      document.body.appendChild(macrosModal);
    },
  };

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
  ];

  return (
    <div className="enhanced-md-editor">
      <MDEditor
        value={value}
        onChange={onChange}
        commands={customCommands}
        height={300} // Reduced height
      />
      <Tooltip id="mdeditor-tooltip" />
    </div>
  );
};

// Helper function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

// Helper function for URL validation
const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Helper function for image extension
const getImageExtension = (url: string) => {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.split('.').pop()?.toLowerCase();
};

// Helper function for image check
const isImageExtension = (extension?: string) => {
    if (!extension) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
    return imageExtensions.includes(extension);
};

// Main React Component
export default function Home() {
    const { template, auth } = usePage<SharedData>().props; 
    
    const htmlBlobRef = useRef<Blob | null>(null);
    const htmlUrlRef = useRef<string | null>(null);

    // State definitions
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [showAddContentModal, setShowAddContentModal] = useState(true);
    const [userEmail, setUserEmail] = useState(auth.user?.email || '');
    const [saveContentAlert, setSaveContentAlert] = useState<{ show: boolean, type: string, message: string } | null>(null);
    const [activeTab, setActiveTab] = useState('text'); // Default to Text tab
    const [urlContent, setUrlContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File | null>(null);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [visibility, setVisibility] = useState(1); // 1 for On, 0 for Off
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memoizedContents, setMemoizedContents] = useState<any[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<{url: string, message: string}>({url: '', message: ''});
    
    // UPDATED: Single link state instead of array
    const [link, setLink] = useState('');

    // Set link tab as active on component mount
    useEffect(() => {
        setActiveTab('link');
    }, []);

    // Blur style variable generation
    const blurStyle = template?.image && isImageExtension(getImageExtension(template.image)) ? (
        <style>{`
            .blur-bg {
                background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                background-size: cover;
            }
        `}</style>
    ) : null;

    // Database integration functions
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (file) {
            setSelectedFiles(file);
            console.log('File selected:', file.name);
        }
    }, []);

    const handleAddContent = async () => {
        setIsSubmitting(true);
        const referenceContent = '';

        // Validate that at least one type of content is provided
        const hasUrlContent = urlContent.trim() !== '';
        const hasFile = selectedFiles !== null;
        const hasLink = link.trim() !== ''; // UPDATED: Check for single link

        if (!hasUrlContent && !hasFile && !hasLink) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'Please provide at least one form of content (text/embed, link, or image).'
            });
            setIsSubmitting(false);
            return;
        }

        // Email validation
        if (!auth.user && !userEmail) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'Email is required'
            });
            setIsSubmitting(false);
            return;
        }

        if (!auth.user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'Please enter a valid email address'
            });
            setIsSubmitting(false);
            return;
        }

        if (!agreeToTerms) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'You must agree to the Terms and Conditions and Privacy Policy'
            });
            setIsSubmitting(false);
            return;
        }

        setSaveContentAlert({
            show: true,
            type: 'success',
            message: 'Saving content...'
        });

        const formData = new FormData();
        formData.append('reference', referenceContent);
        formData.append('email', auth.user?.email || userEmail);

        if (activeTab === 'link' && hasLink) {
            // When link tab is active, send the link as 'url' to satisfy backend validation
            formData.append('url', link);
            formData.append('link', link);
        } else if (hasUrlContent) {
            const isUrl = isValidUrl(urlContent.trim());
            if (isUrl) {
                // It's a URL, append as-is
                formData.append('url', urlContent);
            } else {
                // It's not a URL (Markdown/Embed/Text), append raw content for markdown preview to handle
                formData.append('url', urlContent);
            }
        }

        if (hasFile) {
            formData.append('image', selectedFiles);
        }
        try {
            const response = await axios.post('/funnel-content-oki', formData, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                setSuccessData({
                    url: response.data.url,
                    message: response.data.message || 'Content saved successfully!'
                });
                setShowSuccessModal(true);
                
                // Reset all form fields after successful submission
                setUrlContent('');
                setSelectedFiles(null);
                setUserEmail('');
                setAgreeToTerms(false);
                setLink(''); // UPDATED: Reset single link
                setSaveContentAlert(null);
            } else {
                throw new Error(response.data.message || 'Failed to save content');
            }
        } catch (error) {
            let errorMessage = 'Failed to save content. Please try again.';

            if (axios.isAxiosError(error)) {
                // Check for Laravel validation errors
                if (error.response?.status === 422 && error.response.data.errors) {
                    const errors = error.response.data.errors;
                    const firstErrorKey = Object.keys(errors)[0];
                    errorMessage = errors[firstErrorKey][0];
                } else {
                    errorMessage = error.response?.data?.message || errorMessage;
                }

                if (error.response?.status === 401) {
                    setShowLoginModal(true);
                    errorMessage = 'Please login to save content';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setSaveContentAlert({
                show: true,
                type: 'error',
                message: errorMessage
            });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSaveContentAlert(null), 5000);
        }
    };
    
    const getTooltipContent = useCallback((id: string, index: number): string => {
        // Placeholder implementation for getTooltipContent
        const tooltips: { [key: number]: string } = {
            0: 'Close the Add Content panel',
            1: 'Your email address',
            2: 'I agree to the Terms and Conditions and Privacy Policy',
            3: 'View Terms and Conditions',
            4: 'View Privacy Policy',
            5: 'Save the content'
        };
        return tooltips[index] || `Tooltip for ${id}-${index}`;
    }, []);

    // templateContent logic is the core of the template rendering
    const templateContent = useMemo(() => {
        if (!template) return null;

        // Clean up previous blob URLs
        if (htmlUrlRef.current) {
            URL.revokeObjectURL(htmlUrlRef.current);
            htmlUrlRef.current = null;
        }

        const extension = template.image.split('.').pop()?.toLowerCase() || '';
        const imgPath = template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        const fullImageUrl = `${imgPath}${template.image}`;

        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        const validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];

        const youtubeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
        const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^/]+:[^"&?/ ]+)/i;
        const vimeoRegex = /^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im;
        const fbWatchRegex = /^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/;
        const facebookRegex = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/;
        const iframeRegex = /<iframe.*?src=["'](.*?)["'].*?>.*?<\/iframe>/is;
        const blockquoteRegex = /<blockquote/;

        const youtubeMatch = template.image.match(youtubeRegex);
        const linkedinMatch = template.image.match(linkedinRegex);
        const vimeoMatch = template.image.match(vimeoRegex);
        const fbWatchMatch = template.image.match(fbWatchRegex);
        const facebookMatch = template.image.match(facebookRegex);
        const iframeMatch = template.image.match(iframeRegex) || blockquoteRegex.test(template.image);

        if (validImageExtensions.includes(extension)) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <img 
                        src={fullImageUrl} 
                        alt="Background" 
                        className="absolute inset-0 max-w-full max-h-full m-auto z-0 rounded-lg"
                        onError={(e) => console.error('Image failed to load', e)}
                    />
                </>
            );
        }

        if (validDocumentExtensions.includes(extension)) {
            return (
                <iframe
                    src={`https://docs.google.com/viewer?url=${fullImageUrl}&embedded=true`}
                    className="fixed top-0 left-0 w-full h-full"
                    frameBorder="0"
                    loading="lazy"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin"
                    title="Document Viewer"
                    scrolling="yes"
                />
            );
        }

        if (iframeMatch) {
            const processedHtml = template.image
                .replace(/<(iframe|blockquote)([^>]*)\s(height|width|style)=["'][^"']*["']([^>]*)>/gi, '<$1$2$4 class="fixed top-0 left-0 w-full h-full" scrolling="yes">')
                .replace(/class="([^"]*)"/g, 'class="$1 absolute inset-0 m-auto"');

            const finalHtml = !/<(iframe|blockquote)[^>]*class="/i.test(processedHtml)
                ? processedHtml.replace(/<(iframe|blockquote)/g, '<$1 scrolling="yes" class="absolute w-full h-full inset-0 m-auto"')
                : processedHtml;

            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                        .twitter-tweet {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            object-fit: cover;
                            z-index: 0;
                            border: none;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <div 
                        className="fixed top-0 left-0 w-full h-full object-cover"
                        dangerouslySetInnerHTML={{ __html: finalHtml }}
                    />
                </>
            );
        }

        if (youtubeMatch) {
            const autoplayParam = template.option === 'autoplay' ? 'autoplay=1' : 
                                template.option === 'mute' ? 'autoplay=1&mute=1' : 'mute=1';
            
            return (
                <>
                    <div className="fixed top-0 left-0 w-full h-full z-[-2]">
                        <iframe 
                            loading="lazy"
                            src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${autoplayParam}&loop=1&playlist=${youtubeMatch[1]}&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3`}
                            className="w-full h-full object-cover"
                            frameBorder="0"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                        />
                    </div>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe 
                        id="bgVideo" 
                        loading="lazy" 
                        className="fixed top-0 left-0 w-full h-full object-cover" 
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${template.option}=1&mute=1&loop=1&playlist=${youtubeMatch[1]}`}
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                    />
                </>
            );
        }

        if (linkedinMatch) {
            let linkedinUrl = template.image;
            if (!linkedinUrl.includes('?compact=1')) {
                linkedinUrl += (linkedinUrl.includes('?') ? '&' : '?') + 'compact=1';
            }

            return (
                <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black">
                    <iframe 
                        id="bgVideo"
                        src={linkedinUrl}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title="Embedded LinkedIn Post"
                        scrolling="yes"
                    />
                </div>
            );
        }

        if (vimeoMatch) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe 
                        loading="lazy" 
                        id="bgVideo" 
                        allow="camera; microphone; fullscreen; display-capture; autoplay" 
                        src={`https://player.vimeo.com/video/${vimeoMatch[3]}?h=33160d1512&color=de0101`} 
                        className="fixed top-0 left-0 w-full h-full object-cover" 
                        frameBorder="0" 
                        allowFullScreen
                    />
                </>
            );
        }

        if (fbWatchMatch || (facebookMatch && !template.image.includes('groups'))) {
            return (
                <div className="fixed top-0 left-0 w-full h-full">
                    <div 
                        className="fb-post" 
                        data-href={template.image} 
                        data-width="1400" 
                        data-show-text="true"
                    />
                </div>
            );
        }

        if (extension === 'mp4') {
            return (
                <>
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="fixed top-0 left-0 w-full h-full object-cover z-[-3]"
                    >
                        <source src={fullImageUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <video 
                        id="bgVideo" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="absolute inset-0 max-w-full max-h-full m-auto" 
                        controls
                    >
                        <source src={fullImageUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </>
            );
        }

        if (extension === 'glb') {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <model-viewer 
                        src={fullImageUrl}
                        alt="3D model"
                        className="fixed top-0 left-0 w-full h-full"
                        ar
                        auto-rotate
                        camera-controls
                        shadow-intensity="1"
                    />
                </>
            );
        }

        if (isValidUrl(template.image)) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: '100%';
                            backdrop-filter: blur(20px);
                            z-index: -1;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <iframe 
                        loading="lazy" 
                        id="bgVideo" 
                        allow="camera; microphone; fullscreen; display-capture; autoplay" 
                        src={template.image} 
                        className="fixed top-0 left-0 w-full h-full" 
                        frameBorder="0" 
                        allowFullScreen
                        scrolling="yes"
                    />
                </>
            );
        }

        // Create HTML blob for fallback content
        htmlBlobRef.current = new Blob([template.image], { type: 'text/html' });
        htmlUrlRef.current = URL.createObjectURL(htmlBlobRef.current);

        return (
            <iframe
                src={htmlUrlRef.current}
                className="fixed top-0 left-0 w-full h-full border-none"
                allow="microphone *; camera *; autoplay *; fullscreen *; display-capture *;"
                sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock 
                        allow-popups allow-popups-to-escape-sandbox allow-presentation 
                        allow-same-origin allow-scripts allow-top-navigation 
                        allow-top-navigation-by-user-activation allow-downloads allow-storage-access-by-user-activation"
                allowFullScreen
                loading="lazy"
                name="binauralMixerFrame"
                allowTransparency="true"
                scrolling="yes"
            />
        );
    }, [template]);

    // Clean up blob URLs on unmount
    useEffect(() => {
        return () => {
            if (htmlUrlRef.current) {
                URL.revokeObjectURL(htmlUrlRef.current);
            }
        };
    }, []);
    
    return (
        <>
            <Head>
                <title>EZ.wiki - Template</title>
                {blurStyle}
                <meta name="description" content="Template background only" />
                <style>{`
                    /* Minimal styles to keep the template rendering clean */
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                    .input-no-spinner::-webkit-outer-spin-button,
                    .input-no-spinner::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    .input-no-spinner {
                        -moz-appearance: textfield;
                    }

                    /* Template background styles are sufficient */

                    /* ADDED: MDEditor custom styles */
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

                    /* Custom scrollbar for MDEditor */
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

                    /* Shine animation for buttons */
                    @keyframes shine {
                      0% {
                        transform: translateX(-100%) skewX(-12deg);
                      }
                      100% {
                        transform: translateX(200%) skewX(-12deg);
                      }
                    }
                    .animate-shine {
                      animation: shine 2s infinite;
                    }

                    /* Pulse glow animation for active tabs */
                    @keyframes pulse-glow {
                      0%, 100% {
                        box-shadow: 0 0 5px rgba(34, 197, 94, 0.4);
                      }
                      50% {
                        box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.6);
                      }
                    }

                    .animate-pulse {
                      animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                `}</style>
            </Head>
            
            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image.split('.').pop()?.toLowerCase() && 
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
                    .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>

                {/* This div is the only part that renders the template/background content */}
                <div className="absolute inset-0 z-0">
                    {templateContent}
                </div>
                
                {/* The condition 'isPanelVisible' is now defined */}
                {isPanelVisible && (
                <div className={`relative mt-16 mx-auto bg-gradient-to-br from-gray-900/95 to-gray-800/95 bottom-4 z-50 backdrop-blur-xl p-4 rounded-2xl border border-gray-600/50 shadow-2xl w-full max-w-2xl m-2`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-lime-500/20 to-emerald-500/20 shadow-lg">
                                <FontAwesomeIcon icon={faPlus} className="h-5 w-5 text-lime-400" />
                            </div>
                            <div>
                                <h3 id="add-content-modal-title" className="text-xl font-bold bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
                                    Agree to community rules and start Oki-WiKi
                                </h3>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsPanelVisible(false)}
                            className="w-8 h-8 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-opacity-50"
                            aria-label="Close panel"
                            data-tooltip-id="action-tooltip"
                            data-tooltip-content={getTooltipContent('action-tooltip', 0)}
                        >
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-gray-300 hover:text-white text-base transition-colors" 
                            />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-4">
                        {/* Email Input */}
                        <div className="group">
                            <label htmlFor="user-email" className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-lime-300 transition-colors">
                                Your Email Address *
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    id="user-email"
                                    className="w-full px-3 py-2 bg-gray-800/60 border-2 border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lime-500 focus:bg-gray-800/80 transition-all duration-300 focus:ring-2 focus:ring-lime-500/20 text-sm"
                                    placeholder="your.email@example.com"
                                    value={auth.user?.email || userEmail}
                                    readOnly={!!auth.user}
                                    onChange={(e) => {
                                        if (!auth.user) {
                                            setUserEmail(e.target.value);
                                        }
                                    }}
                                    disabled={saveContentAlert?.show && saveContentAlert.type === 'success'}
                                    required
                                    data-tooltip-id="add-content-tooltip"
                                    data-tooltip-content={getTooltipContent('add-content-tooltip', 1)}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    {!auth.user && userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) ? (
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-lime-500 text-base" />
                                    ) : !auth.user && userEmail ? (
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 text-base" />
                                    ) : null}
                                </div>
                            </div>
                            {!auth.user && !userEmail && (
                                <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                                    Email is required to submit content
                                </p>
                            )}
                            {!auth.user && userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) && (
                                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    Please enter a valid email address
                                </p>
                            )}
                        </div>

                        {/* Content Input Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-semibold text-gray-300">
                                    Content Type
                                </label>
                                <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                                    {activeTab === 'link' ? 'Single Link' : 
                                     activeTab === 'text' ? 'Text & Media' : 
                                     'File Upload'}
                                </span>
                            </div>

                            {/* Tab Buttons - REARRANGED ORDER: 1) Text/Embed, 2) Link-in-Bio Embed, 3) File Upload */}
                            <div className="flex space-x-1 p-1 bg-gray-800/50 rounded-lg border border-gray-600/30">
                                {/* 1) Text/Embed Tab */}
                                <button
                                    onClick={() => setActiveTab('text')}
                                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-all duration-300 focus:outline-none flex items-center justify-center gap-1 relative overflow-hidden ${
                                        activeTab === 'text'
                                            ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-gray-900 shadow-lg shadow-lime-500/25'
                                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white animate-pulse'
                                    }`}
                                    data-tooltip-id="content-tab-tooltip"
                                    data-tooltip-content="Markdown, URLs, Embed Codes, or Plain Text"
                                >
                                    <FontAwesomeIcon icon={faCode} className="text-xs" />
                                    Embed Code or Markdown
                                    {activeTab !== 'text' && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shine"></span>
                                    )}
                                </button>

                                {/* 2) Link-in-Bio Embed Tab - Set as default active */}
                                <button
                                    onClick={() => setActiveTab('link')}
                                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-all duration-300 focus:outline-none flex items-center justify-center gap-1 relative overflow-hidden ${
                                        activeTab === 'link'
                                            ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-gray-900 shadow-lg shadow-lime-500/25'
                                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white animate-pulse'
                                    }`}
                                    data-tooltip-id="content-tab-tooltip"
                                    data-tooltip-content="Add a single URL or web link"
                                >
                                    <FontAwesomeIcon icon={faLink} className="text-xs" />
                                    Link-in-Bio Embed
                                    {activeTab !== 'link' && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shine"></span>
                                    )}
                                </button>

                                {/* 3) File Upload Tab */}
                                <button
                                    onClick={() => setActiveTab('image')}
                                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-all duration-300 focus:outline-none flex items-center justify-center gap-1 relative overflow-hidden ${
                                        activeTab === 'image'
                                            ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-gray-900 shadow-lg shadow-lime-500/25'
                                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white animate-pulse'
                                    }`}
                                    data-tooltip-id="content-tab-tooltip"
                                    data-tooltip-content="Upload Images, PDFs, or Documents"
                                >
                                    <FontAwesomeIcon icon={faLayerGroup} className="text-xs" />
                                    File Upload
                                    {activeTab !== 'image' && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shine"></span>
                                    )}
                                </button>
                            </div>

                            {/* Tab Content - REARRANGED ORDER to match tabs above */}
                            <div className="pt-1 min-h-[150px] transition-all duration-300">
                                {/* 1) Text/Embed Panel - Now first */}
                                {activeTab === 'text' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>Supports Markdown, HTML, URLs, and embed codes</span>
                                            <span className="flex items-center gap-1">
                                                <FontAwesomeIcon icon={faBolt} className="text-amber-400" />
                                                Rich Editor
                                            </span>
                                        </div>
                                        <div data-color-mode="dark" className="rounded-lg overflow-hidden border border-gray-600/50 shadow-lg">
                                            <EnhancedMDEditor
												value={urlContent || "https://beacons.ai/neal"}
												onChange={(value) => setUrlContent(value || '')}
											/>
                                        </div>
                                        {urlContent && (
                                            <div className="text-xs text-gray-400 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-lime-400" />
                                                {urlContent.length} characters • {urlContent.split(/\s+/).filter(word => word.length > 0).length} words
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 2) Link-in-Bio Embed Panel - Now second but active by default */}
                                {activeTab === 'link' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>Add a Link-in-Bio URL or create one from popular services</span>
                                            <span className="flex items-center gap-1">
                                                <FontAwesomeIcon icon={faLink} className="text-blue-400" />
                                                {link.trim() ? 'Link added' : 'No link added'}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {/* Service Selection Dropdown and Handle Input */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    value={link.split('/').slice(0, -1).join('/') + '/'}
                                                    onChange={(e) => {
                                                        const baseUrl = e.target.value;
                                                        if (baseUrl) {
                                                            const currentHandle = link.split('/').pop() || '';
                                                            setLink(baseUrl + currentHandle);
                                                        } else {
                                                            setLink('');
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 bg-gray-800/60 border-2 border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:bg-gray-800/80 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 text-sm"
                                                >
                                                    <option value="">Select a Link-in-Bio Service</option>
                                                    <option value="https://lnk.bio/">lnk.bio</option>
                                                    <option value="https://campsite.bio/">campsite.bio</option>
                                                    <option value="https://bio.site/">bio.site</option>
                                                    <option value="https://hoo.be/">hoo.be</option>
                                                    <option value="https://linktr.ee/">linktr.ee</option>
                                                    <option value="https://portaly.cc/">portaly.cc</option>
                                                    <option value="https://link3.cc/">link3.cc</option>
                                                </select>
                                                
                                                {/* Handle Input */}
                                                <input
                                                    type="text"
                                                    value={link.split('/').pop() || ''}
                                                    onChange={(e) => {
                                                        const handle = e.target.value;
                                                        const baseUrl = link.split('/').slice(0, -1).join('/') + '/';
                                                        if (baseUrl === '/') {
                                                            // If no base URL selected yet, use linktr.ee as default
                                                            setLink('https://linktr.ee/' + handle);
                                                        } else {
                                                            setLink(baseUrl + handle);
                                                        }
                                                    }}
                                                    placeholder="yourhandle"
                                                    className="w-full px-3 py-2 bg-gray-800/60 border-2 border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-800/80 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 text-sm"
                                                />
                                            </div>
                                            
                                            {link.trim() && (
                                                <button
                                                    onClick={() => {
                                                        // Open preview modal with reduced width (35%)
                                                        const previewModal = document.createElement('div');
                                                        previewModal.id = 'link-preview-modal';
                                                        previewModal.style.position = 'fixed';
                                                        previewModal.style.top = '0';
                                                        previewModal.style.left = '0';
                                                        previewModal.style.width = '100%';
                                                        previewModal.style.height = '100%';
                                                        previewModal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                                                        previewModal.style.display = 'flex';
                                                        previewModal.style.alignItems = 'center';
                                                        previewModal.style.justifyContent = 'center';
                                                        previewModal.style.zIndex = '10000';
                                                        previewModal.style.backdropFilter = 'blur(8px)';

                                                        const modalContent = document.createElement('div');
                                                        modalContent.style.backgroundColor = '#1a202c';
                                                        modalContent.style.borderRadius = '16px';
                                                        modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
                                                        modalContent.style.width = '35%'; // REDUCED WIDTH TO 35%
                                                        modalContent.style.height = '80%';
                                                        modalContent.style.maxWidth = '500px';
                                                        modalContent.style.minWidth = '400px';
                                                        modalContent.style.border = '1px solid #4a5568';
                                                        modalContent.style.overflow = 'hidden';
                                                        modalContent.style.display = 'flex';
                                                        modalContent.style.flexDirection = 'column';

                                                        // Header
                                                        const header = document.createElement('div');
                                                        header.style.display = 'flex';
                                                        header.style.justifyContent = 'space-between';
                                                        header.style.alignItems = 'center';
                                                        header.style.padding = '16px 20px';
                                                        header.style.backgroundColor = '#2d3748';
                                                        header.style.borderBottom = '1px solid #4a5568';

                                                        const title = document.createElement('h3');
                                                        title.textContent = 'Link Preview';
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
                                                            if (previewModal.parentNode) {
                                                                document.body.removeChild(previewModal);
                                                            }
                                                        };

                                                        header.appendChild(title);
                                                        header.appendChild(closeBtn);

                                                        // Preview Info
                                                        const previewInfo = document.createElement('div');
                                                        previewInfo.style.padding = '12px 20px';
                                                        previewInfo.style.backgroundColor = '#2d3748';
                                                        previewInfo.style.borderBottom = '1px solid #4a5568';
                                                        previewInfo.style.fontSize = '14px';
                                                        previewInfo.style.color = '#cbd5e0';

                                                        const previewUrl = document.createElement('div');
                                                        previewUrl.textContent = `Previewing: ${link.trim()}`;
                                                        previewUrl.style.fontFamily = 'monospace';
                                                        previewUrl.style.fontSize = '12px';
                                                        previewUrl.style.color = '#90cdf4';
                                                        previewUrl.style.wordBreak = 'break-all';

                                                        previewInfo.appendChild(previewUrl);

                                                        // Iframe Container
                                                        const iframeContainer = document.createElement('div');
                                                        iframeContainer.style.flex = '1';
                                                        iframeContainer.style.padding = '0';
                                                        iframeContainer.style.position = 'relative';
                                                        iframeContainer.style.overflow = 'hidden';

                                                        const iframe = document.createElement('iframe');
                                                        iframe.src = `/previewlink?url=${encodeURIComponent(link.trim())}`;
                                                        iframe.style.width = '100%';
                                                        iframe.style.height = '100%';
                                                        iframe.style.border = 'none';
                                                        iframe.style.borderRadius = '0 0 16px 16px';
                                                        iframe.style.background = 'white';
                                                        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                                                        iframe.allowFullscreen = true;

                                                        iframeContainer.appendChild(iframe);

                                                        // Assemble modal
                                                        modalContent.appendChild(header);
                                                        modalContent.appendChild(previewInfo);
                                                        modalContent.appendChild(iframeContainer);
                                                        previewModal.appendChild(modalContent);

                                                        // Close on background click
                                                        previewModal.onclick = (e) => {
                                                            if (e.target === previewModal) {
                                                                if (previewModal.parentNode) {
                                                                    document.body.removeChild(previewModal);
                                                                }
                                                            }
                                                        };

                                                        // Close on Escape key
                                                        const handleEscape = (e: KeyboardEvent) => {
                                                            if (e.key === 'Escape' && previewModal.parentNode) {
                                                                document.body.removeChild(previewModal);
                                                                document.removeEventListener('keydown', handleEscape);
                                                            }
                                                        };

                                                        document.addEventListener('keydown', handleEscape);
                                                        document.body.appendChild(previewModal);
                                                    }}
                                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="text-sm" />
                                                    Preview Link
                                                </button>
                                            )}
                                        </div>

                                        {link.trim() && (
                                            <div className="text-xs text-gray-400 flex items-center gap-2 p-2 bg-gray-800/30 rounded-md">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-lime-400" />
                                                Valid link ready for submission
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 3) Image/PDF Panel - Now third */}
                                {activeTab === 'image' && (
                                    <div className="space-y-3">
                                        {!selectedFiles ? (
                                            <label
                                                htmlFor="dropzone-file"
                                                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-500/50 rounded-xl cursor-pointer bg-gradient-to-br from-gray-800/30 to-gray-700/30 hover:from-gray-800/50 hover:to-gray-700/50 transition-all duration-300 group hover:border-lime-400/50"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-3 pb-4">
                                                    <div className="p-2 rounded-xl bg-gradient-to-br from-gray-700 to-gray-600 group-hover:from-lime-500/20 group-hover:to-emerald-500/20 transition-all duration-300 mb-2">
                                                        <FontAwesomeIcon 
                                                            icon={faLayerGroup} 
                                                            className="h-6 w-6 text-gray-400 group-hover:text-lime-400 transition-colors" 
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-400 group-hover:text-lime-300 transition-colors mb-1">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                                                        SVG, PNG, JPG, GIF, PDF (Max 100MB)
                                                    </p>
                                                </div>
                                                <input 
                                                    id="dropzone-file" 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*,.pdf" 
                                                    onChange={handleFileChange} 
                                                />
                                            </label>
                                        ) : (
                                            <div className="relative group bg-gradient-to-br from-gray-800/40 to-gray-700/40 rounded-xl p-3 border-2 border-gray-600/50 hover:border-lime-500/30 transition-all duration-300">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${
                                                        selectedFiles.type === 'application/pdf'
                                                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                                                            : 'bg-gradient-to-br from-lime-500 to-emerald-500'
                                                    }`}>
                                                        {selectedFiles.type === 'application/pdf' ? (
                                                            <FontAwesomeIcon icon={faFilePdf} className="text-white text-base" />
                                                        ) : (
                                                            <FontAwesomeIcon icon={faLayerGroup} className="text-white text-base" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{selectedFiles.name}</p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                            <span>{(selectedFiles.size / 1024 / 1024).toFixed(2)} MB</span>
                                                            <span>•</span>
                                                            <span className="capitalize">
                                                                {selectedFiles.type === 'application/pdf' ? 'PDF Document' : selectedFiles.type.split('/')[1] + ' Image'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedFiles(null)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-110"
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-600/30">
                            <div className="flex items-start space-x-2">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Checkbox
                                        id="agree_to_terms"
                                        name="agree_to_terms"
                                        checked={agreeToTerms}
                                        onClick={() => setAgreeToTerms(!agreeToTerms)}
                                        className="w-4 h-4 border-2 border-gray-500 data-[state=checked]:border-lime-500 data-[state=checked]:bg-lime-500 rounded-md transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:ring-opacity-50"
                                        data-tooltip-id="add-content-tooltip"
                                        data-tooltip-content={getTooltipContent('add-content-tooltip', 2)}
                                    />
                                </div>
                                <Label htmlFor="agree_to_terms" className="text-xs leading-relaxed text-gray-300">
                                    I agree to the{' '}
                                    <button
                                        type="button"
                                        onClick={() => setShowTermsModal(true)}
                                        className="text-lime-400 hover:text-lime-300 underline transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-opacity-50 rounded px-1"
                                        tabIndex={2}
                                        data-tooltip-id="add-content-tooltip"
                                        data-tooltip-content={getTooltipContent('add-content-tooltip', 3)}
                                    >
                                        Terms and Conditions
                                    </button>{' '}
                                    and{' '}
                                    <button
                                        type="button"
                                        onClick={() => setShowPrivacyModal(true)}
                                        className="text-lime-400 hover:text-lime-300 underline transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-opacity-50 rounded px-1"
                                        tabIndex={3}
                                        data-tooltip-id="add-content-tooltip"
                                        data-tooltip-content={getTooltipContent('add-content-tooltip', 4)}
                                    >
                                        Privacy Policy
                                    </button>
                                    <p className="text-xs text-gray-400 mt-1">
                                        By submitting content, you acknowledge that your contribution will be publicly accessible and subject to community moderation.
                                    </p>
                                </Label>
                            </div>
                            {!agreeToTerms && (
                                <p className="mt-2 text-xs text-amber-400 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                                    You must agree to the Terms and Conditions and Privacy Policy to continue
                                </p>
                            )}
                        </div>
						{/* Moderation Status */}
                        <div className="flex items-center justify-between bg-gray-800/30 rounded-xl p-3 border border-gray-600/30">
                            <div className="flex items-center space-x-2">
                                <div className="p-1.5 rounded-lg bg-gray-700/50">
                                    <FontAwesomeIcon 
                                        icon={visibility === 0 ? faEye : faClock} 
                                        className={`text-base ${visibility === 0 ? 'text-green-400' : 'text-amber-400'}`} 
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold text-gray-300">
                                        Content Moderation
                                    </Label>
                                    <p className="text-xs text-gray-400">
                                        {visibility === 0 
                                            ? "Content reviewed before publishing" 
                                            : "Immediate publishing with post-review"
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    visibility === 1 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                    {visibility === 0 ? "ON" : "OFF"}
                                </span>
                                <div
                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-500 cursor-help transition-colors text-xs text-white"
                                    data-tooltip-id="moderation-tooltip"
                                    data-tooltip-content={
                                        visibility === 0
                                            ? "Your content will be reviewed by moderators before appearing publicly"
                                            : "Your content will appear immediately and be reviewed afterwards"
                                    }
                                >
                                    ?
                                </div>
                            </div>
                        </div>	
                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                className="relative overflow-hidden group w-full bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-gray-900 font-bold py-3 px-6 rounded-xl border-2 border-lime-400 hover:border-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-lime-500 disabled:hover:to-emerald-500 shadow-lg hover:shadow-xl hover:shadow-lime-500/25 text-sm"
                                onClick={handleAddContent}
                                disabled={isSubmitting || (saveContentAlert?.show && saveContentAlert.type === 'success') || !agreeToTerms}
                                data-tooltip-id="add-content-tooltip"
                                data-tooltip-content={getTooltipContent('add-content-tooltip', 5)}
                            >
                                <span className="relative z-10 flex items-center gap-2 text-base">
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            SAVING...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-base" />
                                            SAVE CONTENT
                                        </>
                                    )}
                                </span>
                                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform group-hover:animate-shine"></span>
                            </button>
                            
                            {/* Status Message */}
                            {saveContentAlert?.show && (
                                <div className={`mt-3 p-3 rounded-xl border-2 transition-all duration-300 ${
                                    saveContentAlert.type === 'success' 
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon 
                                            icon={saveContentAlert.type === 'success' ? faCheckCircle : faExclamationTriangle} 
                                            className="text-base" 
                                        />
                                        <span className="font-semibold text-sm">{saveContentAlert.message}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-500/30 shadow-2xl relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:20px_20px]"></div>
        
        <div className="relative text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-green-500/20">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl" />
            </div>
            
            {/* Success Title */}
            <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
            
            {/* Green Bar with Three Lines */}
            <div className="bg-gradient-to-r from-lime-500/20 to-emerald-500/20 border border-lime-400/30 rounded-md p-3 mb-4">
                <p className="text-gray-100 mb-1 text-xs font-medium">
                    Login to our main site at{" "}
                    <a 
                        href="https://ez.wiki" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-lime-300 hover:text-lime-200 font-semibold underline transition-colors duration-200"
                    >
                        ez.wiki
                    </a>{" "}
                    with password
                </p>
                <p className="text-lime-300 font-semibold text-xs my-1">- OR -</p>
                <p className="text-gray-100 text-xs font-medium">
                    check email for your magic link
                </p>
            </div>
            
            {/* Funnel URL Card */}
            <div className="bg-gray-800/60 rounded-lg p-3 mb-4 border border-gray-600/40 backdrop-blur-sm">
                <p className="text-xs text-gray-400 mb-2 font-medium">Your funnel is live at:</p>
                <a 
                    href={`https://${successData.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lime-400 hover:text-lime-300 font-semibold break-all text-sm flex items-center justify-center gap-1 transition-colors duration-200 group"
                >
                    {successData.url}
                    <FontAwesomeIcon 
                        icon={faExternalLinkAlt} 
                        className="text-xs transform group-hover:translate-x-0.5 transition-transform duration-200" 
                    />
                </a>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-2">
                <button
                    onClick={() => {
                        setShowSuccessModal(false);
                        setUrlContent('');
                        setSelectedFiles(null);
                        setUserEmail(auth.user?.email || '');
                        setAgreeToTerms(false);
                        setLink(''); // UPDATED: Reset single link
                        setActiveTab('link');
                    }}
                    className="w-full bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-gray-900 font-bold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-lime-500/20 text-sm"
                >
                    Add More Content
                </button>
                
                <button
                    onClick={() => {
                        setShowSuccessModal(false);
                        setIsPanelVisible(false);
                    }}
                    className="w-full bg-gray-700/80 hover:bg-gray-600/80 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50 text-sm"
                >
                    Close Panel
                </button>
            </div>
            
            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-3">
                Need help? Contact support@ez.wiki
            </p>
        </div>
    </div>
</div>
                )}

                {/* Tooltip components */}
                <Tooltip id="action-tooltip" />
                <Tooltip id="add-content-tooltip" />
                <Tooltip id="content-tab-tooltip" />
                <Tooltip id="moderation-tooltip" />
                {/* ADDED: Tooltip for MDEditor */}
                <Tooltip id="mdeditor-tooltip" />
            </main>
        </>
    );
}