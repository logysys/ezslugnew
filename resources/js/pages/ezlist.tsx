import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload, faSignInAlt, faUserPlus, faLayerGroup,
    faCloudDownloadAlt, faHandPointer, faGlobe, faSignOutAlt,
    faHome, faTrashAlt, faPlusCircle, faGlobeAmericas,
    faPlay, faMapPin, faInfoCircle, faSave, faTimes, faEdit,
    faPalette, faSearch, faImage, faHashtag, faPlus, faMinus,
    faCheckCircle, faFilePdf, faClock, faCopy, faShare,
    // Added icons for enhanced editor
    faFont, faFillDrip, faEyedropper, faTable, faCode, faBolt,
    faVideo, faMusic
} from '@fortawesome/free-solid-svg-icons';
import AppLogoIcon from '@/components/app-logo-icon';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import '@google/model-viewer';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// Import MDEditor with custom command types
import MDEditor, { commands, ICommand, TextState, TextAreaTextApi } from '@uiw/react-md-editor';
import "@uiw/react-md-editor/markdown-editor.css";

// START: Code copied from eztheme.tsx for Enhanced MDEditor

// Enhanced color commands for MDEditor
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

// Advanced table command with more options
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

// Add macros command
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

// END: Code copied from eztheme.tsx for Enhanced MDEditor

const FormItem = ({
    form,
    index,
    updateForm,
    removeForm,
    activePins,
    setActivePins,
    moveFormUp,
    moveFormDown,
    isFirst,
    isLast
}) => {
    const [isResizing, setIsResizing] = useState(false);
    const [customWidth, setCustomWidth] = useState(form.customWidth || 33);
    const [isExpanded, setIsExpanded] = useState(!form.unique_id);
    const [isCopied, setIsCopied] = useState(false);
    
    const getInitialTab = () => {
        if (form.imageUrl || form.imageFile) return 'images';
        return 'text';
    };
    const [activeTab, setActiveTab] = useState(getInitialTab);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(form.imageUrl || null);

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
        createColorCommand(false),
        createColorCommand(true),
      ];

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, formId: number) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);
            
            // Create preview URL for all file types
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            
            updateForm(formId, 'imageFile', file);
            updateForm(formId, 'imageUrl', previewUrl);
            updateForm(formId, 'url', '');
        }
    };

    const clearImage = (formId: number) => {
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setSelectedFile(null);
        setImagePreview(null);
        updateForm(formId, 'imageFile', null);
        updateForm(formId, 'imageUrl', '');
    };
    
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleCopyId = () => {
        if (form.unique_id) {
            navigator.clipboard.writeText(form.unique_id);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const getVisitorEmail = (form: any) => {
        return form.user_email || 
               form.user?.email || 
               (form.post_type === 'visitor' ? 'Visitor Submission' : '');
    };

    useEffect(() => {
        if (form.customWidth) {
            setCustomWidth(form.customWidth);
        }
    }, [form.customWidth]);

    useEffect(() => {
        if (form.imageUrl && !imagePreview && form.imageUrl.startsWith('blob:')) {
            setImagePreview(form.imageUrl);
        }
    }, [form.imageUrl, imagePreview]);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleCustomWidthChange = (value: number) => {
        setCustomWidth(value);
        updateForm(form.id, 'customWidth', value);
    };

    const handleTextareaMouseDown = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        const rect = target.getBoundingClientRect();
        const fromRight = rect.right - e.clientX;
        const fromBottom = rect.bottom - e.clientY;
        const isResizeHandle = fromRight < 16 && fromBottom < 16;

        if (isResizeHandle) {
            setIsResizing(true);
            document.addEventListener('mouseup', handleResizeEnd, { once: true });
        } else {
            e.stopPropagation();
        }
    };

    const handleResizeEnd = () => {
        setIsResizing(false);
    };

    useEffect(() => {
        return () => {
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, []);

    return (
        <div id={`frame-${form.id}`} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/80">
            <input
                type="hidden"
                value={form.approve || 'APPROVED'}
                onChange={(e) => updateForm(form.id, 'approve', e.target.value)}
            />
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {form.unique_id && (
                        <div className="flex items-center bg-purple-600 rounded text-xs font-mono">
                            <a 
                                href={`https://ez.wiki/${form.unique_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white pl-2 py-1 cursor-pointer hover:underline"
                                data-tooltip-id="form-tooltip"
                                data-tooltip-content={`Frame ID: ${form.unique_id}`}
                            >
                                ID: {form.unique_id}
                            </a>
                            <button
                                type="button"
                                onClick={handleCopyId}
                                className="text-purple-200 hover:text-white hover:bg-purple-700/50 transition-colors duration-200 focus:outline-none px-2 py-1 rounded-r"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content={isCopied ? "Copied!" : "Copy ID"}
                            >
                                <FontAwesomeIcon icon={isCopied ? faCheckCircle : faCopy} className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                    
                    {form.post_type === 'visitor' && (
                        <div className="flex items-center gap-2">
                            <span 
                                data-tooltip-id="form-tooltip" 
                                data-tooltip-content={
                                    getVisitorEmail(form) 
                                        ? `Crowd Submission by: ${getVisitorEmail(form)}` 
                                        : "Crowd Submission"
                                }
                            >
                             {getVisitorEmail(form) && getVisitorEmail(form) !== 'Visitor Submission' && (
                                <a 
                                    href={`mailto:${getVisitorEmail(form)}`}
                                    className="text-xs text-cyan-300 bg-cyan-900/30 px-2 py-1 rounded hover:bg-cyan-800/50 hover:text-cyan-200 transition-colors duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                    title={`Send email to ${getVisitorEmail(form)}`}
                                >
                                    <FontAwesomeIcon icon={faGlobeAmericas} className="text-cyan-400" />
                                </a>
                            )}   
                            </span>
                        </div>
                    )}
                    
                    <button
                        onClick={() => removeForm(form.id)}
                        onMouseDown={stopPropagation}
                        className="text-rose-500 hover:text-rose-400 transition-colors"
                        aria-label={`Remove form ${form.id}`}
                        data-tooltip-id="action-tooltip"
                        data-tooltip-content="Remove this frame"
                    >
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                    
                    <button
                        type="button"
                        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-400 rounded-full"
                        onClick={() => setIsExpanded(!isExpanded)}
                        data-tooltip-id="action-tooltip"
                        data-tooltip-content={isExpanded ? "Collapse Frame" : "Expand Frame"}
                    >
                        <FontAwesomeIcon icon={isExpanded ? faMinus : faPlus} className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className="flex gap-4 text-yellow-400 text-sm font-semibold">
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <span>Emoji Markers</span>
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    className="text-yellow-400 hover:text-yellow-300 cursor-help transition-colors"
                                    data-tooltip-id="form-tooltip"
                                    data-tooltip-content="Emoji markers determine frame width: 1️⃣=Custom, 2️⃣=42%, 3️⃣=50%, 4️⃣=66%, 5️⃣=100%"
                                />
                            </div>
                            <select
                                onMouseDown={stopPropagation}
                                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent h-10"
                                value={form.emojiMarker}
                                onChange={(e) => updateForm(form.id, 'emojiMarker', e.target.value)}
                                data-tooltip-id="form-tooltip"
                                data-tooltip-content="Select the frame's size or type"
                            >
                                <option value="1️⃣">1️⃣ = Frame width Custom</option>
                                <option value="2️⃣">2️⃣ = Frame width 42%</option>
                                <option value="3️⃣">3️⃣ = Frame width 50%</option>
                                <option value="4️⃣">4️⃣ = Frame width 66%</option>
                                <option value="5️⃣">5️⃣ = Frame width 100%</option>
                                <option value="0️⃣">0️⃣ = Frame kept but hidden from display</option>
                                <option value="🔐">🔐 For password protected frames</option>
                                <option value="🚀">🚀 For redirect link</option>
                                <option value="🧨">🧨 For multiredirect link</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            {form.emojiMarker === '1️⃣' && (
                                <div className="space-y-2">
                                <label 
                                    htmlFor="custom-width-input"
                                    className="flex items-center gap-2 text-sm font-medium text-white"
                                >
                                    <span>Width</span>
                                    <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    className="text-yellow-400 hover:text-yellow-300 cursor-help transition-colors"
                                    data-tooltip-id="form-tooltip"
                                    data-tooltip-content="Adjust the custom width percentage for this frame (10-100%)"
                                    aria-label="Width information"
                                    />
                                </label>
                                
                                <div className="flex items-center">
                                    <input
                                    id="custom-width-input"
                                    type="number"
                                    min="10"
                                    max="100"
                                    value={customWidth}
                                    onChange={(e) => {
                                        const newWidth = Number(e.target.value);
                                        setCustomWidth(newWidth);
                                        updateForm(form.id, 'customWidth', newWidth);
                                    }}
                                    className="flex-1 border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2.5 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none rounded-l-lg rounded-r-none border-r-0 transition-colors"
                                    placeholder="Enter width (10-100)"
                                    aria-describedby="width-percentage"
                                    data-tooltip-id="form-tooltip"
                                    data-tooltip-content="Adjust the custom width for this frame"
                                    />
                                    <span 
                                    id="width-percentage"
                                    className="inline-flex items-center bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-2.5 text-sm font-medium border border-l-0 border-green-600 rounded-r-lg rounded-l-none min-h-[44px]"
                                    >
                                    %
                                    </span>
                                </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full p-2 rounded-xl bg-slate-800/60 backdrop-blur-sm shadow-2xl space-y-4">
                        <div className="flex border-b border-slate-700">
                            <button
                                onClick={() => {
                                    setActiveTab('text');
                                    updateForm(form.id, 'imageUrl', '');
                                }}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 focus:outline-none ${
                                    activeTab === 'text'
                                    ? 'border-lime-400 text-white'
                                    : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content="Paste"
                            >
                                Markdown/EmbedCode/URL/SimpleText
                            </button>

                            <button
                                onClick={() => {
                                    setActiveTab('images');
                                    updateForm(form.id, 'url', '');
                                }}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 focus:outline-none ${
                                    activeTab === 'images'
                                    ? 'border-lime-400 text-white'
                                    : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content="PDF/Image/Video/Audio"
                            >
                                Upload
                            </button>
                        </div>

                        <div className="pt-4">
                            {activeTab === 'text' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex border-2 border-green-600 rounded-xl overflow-hidden bg-gray-800">
                                            <div className="bg-gradient-to-r from-green-700 to-green-600 flex items-center justify-center px-5 text-3xl w-20">
                                                <button
                                                    onClick={() => moveFormUp(index)}
                                                    disabled={isFirst}
                                                    className="text-gray-200 hover:text-white disabled:opacity-30"
                                                    data-tooltip-id="action-tooltip"
                                                    data-tooltip-content="Move this frame up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => moveFormDown(index)}
                                                    disabled={isLast}
                                                    className="text-gray-200 hover:text-white disabled:opacity-30"
                                                    data-tooltip-id="action-tooltip"
                                                    data-tooltip-content="Move this frame down"
                                                >
                                                    ↓
                                                </button>
                                            </div>

                                            <div 
                                                className="enhanced-md-editor flex-1 w-full relative" 
                                                data-color-mode="dark"
                                                data-tooltip-id="form-tooltip"
                                                data-tooltip-content="Enter the URL, embed code, or Markdown content"
                                                style={{ minHeight: '150px' }} 
                                                onMouseDown={stopPropagation}
                                            >
                                                <MDEditor
                                                    value={form.url}
                                                    onChange={(content) => {
                                                        updateForm(form.id, 'url', content || '');
                                                        updateForm(form.id, 'imageUrl', '');
                                                    }}
                                                    commands={customCommands}
                                                    textareaProps={{
                                                        placeholder: 'Enter URL, embedded code, or Markdown content...'
                                                    }}
                                                    preview="live"
                                                />
                                            </div>

                                        <button
                                                onMouseDown={stopPropagation}
                                                className={`flex flex-col items-center justify-center px-4 space-y-1 transition-all duration-200 w-20 focus:outline-none focus:ring-2 ${
                                                    activePins[form.id]
                                                        ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white focus:ring-blue-400"
                                                        : form.post_type === 'visitor' && form.approve === 'NOT APPROVED'
                                                            ? form.emojiMarker === '0️⃣'
                                                                ? "bg-gradient-to-r from-red-700 to-red-600 text-white focus:ring-red-400"
                                                                : form.emojiMarker === '1️⃣'
                                                                    ? "bg-gradient-to-r from-yellow-700 to-yellow-600 text-white focus:ring-yellow-400"
                                                                    : "bg-gradient-to-r from-green-700 to-green-600 text-white focus:ring-green-400"
                                                            : "bg-gradient-to-r from-green-700 to-green-600 text-white focus:ring-green-400"
                                                }`}
                                                type="button"
                                                onClick={() => setActivePins(prev => ({
                                                    ...prev,
                                                    [form.id]: !prev[form.id]
                                                }))}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Pin this frame to show it by default"
                                            >
                                                {activePins[form.id] ? (
                                                    <FontAwesomeIcon icon={faMapPin} className="text-xl text-yellow-300" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faMapPin} className={
                                                        form.post_type === 'visitor' && form.approve === 'NOT APPROVED'
                                                            ? form.emojiMarker === '0️⃣'
                                                                ? "text-xl text-red-400"
                                                                : form.emojiMarker === '1️⃣'
                                                                    ? "text-xl text-yellow-300"
                                                                    : "text-xl text-green-400"
                                                            : "text-xl text-green-400"
                                                    } />
                                                )}
                                                <span className="font-medium text-sm">
                                                    {activePins[form.id] ? "Pinned" : "Pin It"}
                                                </span>
                                                <span className="text-xs opacity-80">&lt;/&gt;</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'images' && (
                                <div className="space-y-3 animate-fadeIn">
                                    <label className="text-sm font-semibold text-lime-400">Upload Media (Image, PDF, Video, Audio)</label>
                                    {!imagePreview && !selectedFile ? (
                                        <label
                                            htmlFor={`dropzone-file-${form.id}`}
                                            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 group"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <svg className="w-12 h-12 mb-3 text-gray-500 group-hover:text-lime-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="mb-1 text-sm text-gray-400 group-hover:text-lime-300">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500">SVG, PNG, JPG, GIF, WEBP, PDF, MP4, WEBM, MOV, AVI, MP3, WAV, OGG, M4A (Max 100MB)</p>
                                            </div>
                                            <input 
                                                id={`dropzone-file-${form.id}`} 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*,.pdf,video/*,audio/*,.mp4,.webm,.mov,.avi,.mp3,.wav,.ogg,.m4a" 
                                                onChange={(e) => handleFileChange(e, form.id)} 
                                            />
                                        </label>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative group bg-gray-800/40 rounded-lg p-3 border border-gray-600">
                                                <div className="flex items-center space-x-3">
                                                    {selectedFile?.type === 'application/pdf' || 
                                                    form.imageUrl?.toLowerCase().endsWith('.pdf') || 
                                                    form.imageUrl?.includes('/pdf/') ? (
                                                        <div className="w-16 h-16 bg-red-600 rounded flex items-center justify-center overflow-hidden">
                                                            <div className="text-white text-center">
                                                                <FontAwesomeIcon icon={faFilePdf} className="text-2xl mb-1" />
                                                                <span className="text-xs block">PDF</span>
                                                            </div>
                                                        </div>
                                                    ) : selectedFile?.type.startsWith('video/') || 
                                                      form.imageUrl?.match(/\.(mp4|webm|mov|avi)$/i) ? (
                                                        <div className="w-16 h-16 bg-purple-600 rounded flex items-center justify-center overflow-hidden relative">
                                                            <div className="text-white text-center">
                                                                <FontAwesomeIcon icon={faVideo} className="text-2xl mb-1" />
                                                                <span className="text-xs block">Video</span>
                                                            </div>
                                                            {imagePreview && (
                                                                <video 
                                                                    src={imagePreview} 
                                                                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                                                                    muted
                                                                />
                                                            )}
                                                        </div>
                                                    ) : selectedFile?.type.startsWith('audio/') || 
                                                      form.imageUrl?.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
                                                        <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center overflow-hidden">
                                                            <div className="text-white text-center">
                                                                <FontAwesomeIcon icon={faMusic} className="text-2xl mb-1" />
                                                                <span className="text-xs block">Audio</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                                                            <img 
                                                                src={imagePreview} 
                                                                alt="Preview" 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">
                                                            {selectedFile ? selectedFile.name : 'Uploaded File'}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'File'}
                                                        </p>
                                                        <p className="text-xs text-blue-400">
                                                            {selectedFile?.type === 'application/pdf' ? 'PDF Document' : 
                                                             selectedFile?.type.startsWith('video/') ? 'Video File' :
                                                             selectedFile?.type.startsWith('audio/') ? 'Audio File' : 'Image'}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => clearImage(form.id)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                
                                                {/* Video/Audio Player Preview */}
                                                {selectedFile?.type.startsWith('video/') && imagePreview && (
                                                    <div className="mt-3">
                                                        <video 
                                                            src={imagePreview} 
                                                            controls
                                                            className="w-full rounded-lg"
                                                            preload="metadata"
                                                        >
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    </div>
                                                )}
                                                
                                                {selectedFile?.type.startsWith('audio/') && imagePreview && (
                                                    <div className="mt-3">
                                                        <audio 
                                                            src={imagePreview} 
                                                            controls
                                                            className="w-full"
                                                            preload="metadata"
                                                        >
                                                            Your browser does not support the audio element.
                                                        </audio>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const DEFAULT_FORM_DATA = {
    flySign: false,
    eyeTracking: false,
    visibility: false,
    seoTag: '',
    theme: [] as string[],
    color: '#4ade80',
    transparency: 80,
    mode: 'light',
    autoApproveTime: '02:00',
    approve: 'APPROVED',
    designView: 'A',
    displaymode: 'dressed' // Added displaymode with default value
};

export default function FunnelPage() {
    const pageProps = usePage<SharedData>().props;
    const dragRef = useRef<HTMLDivElement>(null);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [activePins, setActivePins] = useState<Record<number, boolean>>({});
    const { auth, template, initialFunnels } = usePage<SharedData>().props;
    const [dynamicForms, setDynamicForms] = useState<Array<{
        id: number;
        unique_id?: string;
        emojiMarker: string;
        url: string;
        imageUrl: string;
        imageFile: File | null;
        reference: string;
        customWidth?: number;
        post_type?: string;
        approve?: string;
        user_email?: string;
    }>>([{
        id: 0,
        unique_id: '',
        emojiMarker: '1️⃣',
        url: '',
        imageUrl: '',
        imageFile: null,
        reference: '',
        customWidth: 33,
        post_type: 'user',
        approve: 'APPROVED',
        user_email: ''
    }]);
    const [nextId, setNextId] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{
      id: number;
      type: 'funnel' | 'customDomain' | 'handleDomain';
      name: string;
    } | null>(null);
    const [showInstantCreateModal, setShowInstantCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingLinkedIn, setIsSubmittingLinkedIn] = useState(false);
    const [isSubmittingReddit, setIsSubmittingReddit] = useState(false);
    const [linkedinFrameLoading, setLinkedinFrameLoading] = useState<Record<string, boolean>>({});
    const [redditFrameLoading, setRedditFrameLoading] = useState<Record<string, boolean>>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [transparency, setTransparency] = useState(80);
    const [currentTheme, setCurrentTheme] = useState<{
        framecolor?: string;
    } | null>(null);
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
    const [editingFunnel, setEditingFunnel] = useState<{
        id: number;
        token: string;
        flySign: boolean;
        eyeTracking: boolean;
        visibility: boolean;
        seoTag: string;
        theme: string[];
        color: string;
        transparency: number;
        mode: string;
        designView: string;
        displaymode: string; // Added displaymode
        fields: Array<{
            id: number;
            unique_id?: string;
            emojiMarker: string;
            url: string;
            imageUrl?: string;
            reference: string;
            pinned: boolean;
            custom_width?: number;
            post_type?: string;
            user_email?: string;
        }>;
    } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [funnels, setFunnels] = useState<Array<{
        id: number;
        token: string;
        created_at: string;
        fly_sign: boolean;
        eye_tracking: boolean;
        visibility: boolean;
        design_view: string;
        displaymode?: string; // Added displaymode
        ai_search_history?: { // Add AI search history relationship
            id: number;
            slug: string;
            query: string;
            conversation_title: string;
            created_at: string;
        };
        custom_domains?: Array<{
            id: number;
            domain: string;
            domainselected: string;
        }>;
        handle_domains?: Array<{
            id: number;
            domain: string;
            domainselected: string;
        }>;
        fields: Array<{
            emoji_marker: string;
            url: string;
            reference: string;
            unique_id?: string;
            post_type?: string;
            user?: {
                email: string;
            };
            user_email?: string;
        }>;
    }>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'fuzzy' | 'exact'>('fuzzy');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [templates, setTemplates] = useState<{
        userTemplates: Array<{
            id: number;
            unique_id: string;
            title: string;
            price: number;
        }>;
        defaultTemplates: Array<{
            id: number;
            unique_id: string;
            title: string;
            price: number;
        }>;
        themecollections: Array<{
            id: number;
            unique_id: string;
            title: string;
            price: number;
        }>;
    }>({ userTemplates: [], defaultTemplates: [], themecollections: [] });
    const [showImportModal, setShowImportModal] = useState(false);
    const [importUrl, setImportUrl] = useState('https://linktr.ee/demo');
    const [importHandle, setImportHandle] = useState('X1234');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isMultiIframeLoading, setIsMultiIframeLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deletingType, setDeletingType] = useState<'funnel' | 'customDomain' | 'handleDomain' | null>(null);
    const [activeFrameId, setActiveFrameId] = useState<number | null>(null);

    // LinkedIn Frame Share Function - UPDATED VERSION
    const handleLinkedInFrameShare = async (uniqueId: string) => {
        try {
            // Set loading state for this specific frame
            setLinkedinFrameLoading(prev => ({ ...prev, [uniqueId]: true }));
            
            const frameUrl = `https://ez.wiki/${uniqueId}`;
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const formDataToSend = new FormData();
            formDataToSend.append('frame_url', frameUrl);
            formDataToSend.append('frame_unique_id', uniqueId);

            const response = await axios.post('/ezframepostinlinkedin', formDataToSend, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.data.success) {
                setSuccessMessage('Frame successfully posted to LinkedIn!');
            } else {
                setErrorMessage(response.data.message || 'Failed to post frame to LinkedIn');
            }
        } catch (error: any) {
            console.error('LinkedIn frame post error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to post frame to LinkedIn. Please try again.');
        } finally {
            // Clear loading state for this specific frame
            setLinkedinFrameLoading(prev => ({ ...prev, [uniqueId]: false }));
        }
    };

    // Reddit Frame Share Function
    const handleRedditFrameShare = async (uniqueId: string) => {
        try {
            // Set loading state for this specific frame
            setRedditFrameLoading(prev => ({ ...prev, [uniqueId]: true }));
            
            const frameUrl = `https://ez.wiki/${uniqueId}`;            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const formDataToSend = new FormData();
            formDataToSend.append('frame_url', frameUrl);
            formDataToSend.append('frame_unique_id', uniqueId);

            const response = await axios.post('/ezframepostinreddit', formDataToSend, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.data.success) {
                setSuccessMessage('Frame successfully posted to Reddit!');
            } else {
                setErrorMessage(response.data.message || 'Failed to post frame to Reddit');
            }
        } catch (error: any) {
            console.error('Reddit frame share error:', error);
            setErrorMessage('Failed to open Reddit share. Please try again.');
        } finally {
            // Clear loading state for this specific frame
            setRedditFrameLoading(prev => ({ ...prev, [uniqueId]: false }));
        }
    };

    // Reddit Share Function
    const handleRedditShare = async (funnel: any) => {
        try {
            setIsSubmittingReddit(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const funnelUrl = `https://ez.wiki/${funnel.token}`;
            const postTitle = `My EZ Funnel: ${funnel.token}`;
            
            const formDataToSend = new FormData();
            formDataToSend.append('funnel_url', funnelUrl);
            formDataToSend.append('post_title', postTitle);
            formDataToSend.append('funnel_token', funnel.token);
            formDataToSend.append('funnel_id', funnel.id.toString());

            const response = await axios.post('/ezfunnelpostinreddit', formDataToSend, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.data.success) {
                setSuccessMessage('Funnel successfully posted to Reddit!');
            } else {
                setErrorMessage(response.data.message || 'Failed to post to Reddit');
            }
        } catch (error: any) {
            console.error('Reddit share error:', error);
            setErrorMessage('Failed to open Reddit share. Please try again.');
        } finally {
            setIsSubmittingReddit(false);
        }
    };

    useEffect(() => {
        console.log('Funnels data:', funnels);
        if (funnels.length > 0) {
            console.log('First funnel fields:', funnels[0].fields);
            if (funnels[0].fields && funnels[0].fields.length > 0) {
                console.log('First field data:', funnels[0].fields[0]);
                console.log('First field user data:', funnels[0].fields[0].user);
            }
        }
    }, [funnels]);

    const handleFrameColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            color: e.target.value
        }));
    };

    const moveFormUp = (index: number) => {
        if (index <= 0) return;
        setDynamicForms(prev => {
            const newForms = [...prev];
            [newForms[index], newForms[index - 1]] = [newForms[index - 1], newForms[index]];
            return newForms;
        });
    };

    const moveFormDown = (index: number) => {
        setDynamicForms(prev => {
            if (index >= prev.length - 1) return prev;
            const newForms = [...prev];
            [newForms[index], newForms[index + 1]] = [newForms[index + 1], newForms[index]];
            return newForms;
        });
    };

    const handleMultiIframeExtract = async () => {
        try {
            setIsMultiIframeLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            const response = await axios.get('/generate-bio-excreate', {
                params: {
                    url: importUrl
                }
            });

            const extractedData = response.data;

            const newForms = extractedData.map((item: any, index: number) => ({
                id: index,
                unique_id: item.unique_id || '',
                emojiMarker: item.emoji_marker || '1️⃣',
                url: item.url || '',
                imageUrl: '',
                imageFile: null,
                reference: item.reference || '',
                customWidth: item.custom_width || 33,
                post_type: item.post_type || 'user',
                approve: item.approve || 'APPROVED',
                user_email: item.user_email || item.user?.email || ''
            }));

            const newActivePins = extractedData.reduce((acc: Record<number, boolean>, item: any, index: number) => {
                acc[index] = item.pinned || false;
                return acc;
            }, {});

            setDynamicForms(newForms);
            setActivePins(newActivePins);
            setNextId(newForms.length);
            setSuccessMessage('Data extracted successfully from URL!');
            setShowImportModal(false);
        } catch (error) {
            console.error('Multi Iframe extraction error:', error);
            setErrorMessage('Failed to extract data from URL. Please check the URL and try again.');
        } finally {
            setIsMultiIframeLoading(false);
        }
    };

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const handleDeleteFunnel = async (funnelId: number, token: string) => {
        setItemToDelete({
            id: funnelId,
            type: 'funnel',
            name: `Funnel: ez.wiki/${token}`
        });
        setShowDeleteModal(true);
    };

    const handleDeleteCustomDomain = async (domainId: number, domain: string, domainselected: string) => {
        setItemToDelete({
            id: domainId,
            type: 'customDomain',
            name: `Custom Domain: ${domainselected}/${domain}`
        });
        setShowDeleteModal(true);
    };

    const handleDeleteHandleDomain = async (domainId: number, domain: string, domainselected: string) => {
        setItemToDelete({
            id: domainId,
            type: 'handleDomain',
            name: `Handle Domain: ${domain}.${domainselected}`
        });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            setDeletingId(itemToDelete.id);
            setDeletingType(itemToDelete.type);
            
            let response;
            switch (itemToDelete.type) {
                case 'funnel':
                    response = await axios.delete(`/ez-funnels/${itemToDelete.id}`);
                    break;
                case 'customDomain':
                    response = await axios.delete(`/custom-domains/${itemToDelete.id}`);
                    break;
                case 'handleDomain':
                    response = await axios.delete(`/handle-domains/${itemToDelete.id}`);
                    break;
            }
            
            if (response?.data.success) {
                setSuccessMessage(`${itemToDelete.type === 'funnel' ? 'Funnel' : itemToDelete.type === 'customDomain' ? 'Custom domain' : 'Handle domain'} deleted successfully`);
                handleSearch();
            } else {
                setErrorMessage(response?.data.message || `Failed to delete ${itemToDelete.type}`);
            }
        } catch (error: any) {
            console.error('Delete error:', error);
            setErrorMessage(error.response?.data?.message || `Failed to delete ${itemToDelete.type}`);
        } finally {
            setDeletingId(null);
            setDeletingType(null);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleLinkedInPost = async (funnel: any) => {
        try {
            setIsSubmittingLinkedIn(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const funnelUrl = `https://ez.wiki/${funnel.token}`;
            const postTitle = `My EZ Funnel: ${funnel.token}`;
            
            const formDataToSend = new FormData();
            formDataToSend.append('funnel_url', funnelUrl);
            formDataToSend.append('post_title', postTitle);
            formDataToSend.append('funnel_token', funnel.token);
            formDataToSend.append('funnel_id', funnel.id.toString());

            const response = await axios.post('/ezfunnelpostinlinkedin', formDataToSend, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.data.success) {
                setSuccessMessage('Funnel successfully posted to LinkedIn!');
            } else {
                setErrorMessage(response.data.message || 'Failed to post to LinkedIn');
            }
        } catch (error: any) {
            console.error('LinkedIn post error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to post to LinkedIn. Please try again.');
        } finally {
            setIsSubmittingLinkedIn(false);
        }
    };

    const handleExtractDemo = async () => {
        try {
            setIsSubmitting(true);
            setErrorMessage('');
            setSuccessMessage('');
            
            const response = await axios.get(`https://4x4.ai/api/_ezimport?token=${importHandle}`);
            const extractedData = response.data;

            const newForms = extractedData.map((item: any, index: number) => ({
                id: index,
                unique_id: item.unique_id || '',
                emojiMarker: item.emoji_marker|| '1️⃣',
                url: item.url || '',
                imageUrl: '',
                imageFile: null,
                reference: item.reference || '',
                customWidth: item.custom_width || 33,
                post_type: item.post_type || 'user',
                approve: item.approve || 'APPROVED',
                user_email: item.user_email || item.user?.email || ''
            }));        

            const newActivePins = extractedData.reduce((acc: Record<number, boolean>, item: any, index: number) => {
                acc[index] = item.pinned || false;
                return acc;
            }, {});

            setDynamicForms(newForms);
            setActivePins(newActivePins);
            setNextId(newForms.length);
            setShowImportModal(false);
            setSuccessMessage('Data extracted successfully!');
        } catch (error) {
            console.error('Extraction error:', error);
            setErrorMessage('Failed to extract data. Please check the handle and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleThemeSelection = (themeId: string) => {
        setFormData(prev => {
            if (prev.theme.includes(themeId)) {
                return {
                    ...prev,
                    theme: prev.theme.filter(id => id !== themeId)
                };
            } else {
                return {
                    ...prev,
                    theme: [...prev.theme, themeId]
                };
            }
        });
    };

    const moveThemeUp = (index: number) => {
        if (index <= 0) return;
        setFormData(prev => {
            const newThemes = [...prev.theme];
            [newThemes[index], newThemes[index - 1]] = [newThemes[index - 1], newThemes[index]];
            return {
                ...prev,
                theme: newThemes
            };
        });
    };

    const moveThemeDown = (index: number) => {
        setFormData(prev => {
            if (index >= prev.theme.length - 1) return prev;
            const newThemes = [...prev.theme];
            [newThemes[index], newThemes[index + 1]] = [newThemes[index + 1], newThemes[index]];
            return {
                ...prev,
                theme: newThemes
            };
        });
    };

    const isValidUrl = useCallback((url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }, []);

    const getImageExtension = useCallback((url: string) => {
        const cleanUrl = url.split('?')[0];
        return cleanUrl.split('.').pop()?.toLowerCase();
    }, []);

    const isImageExtension = useCallback((extension?: string) => {
        if (!extension) return false;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        return imageExtensions.includes(extension);
    }, []);

    const blurStyle = useMemo(() => {
        if (!template?.image) return null;
        const extension = getImageExtension(template.image) || '';
        return isImageExtension(extension) ? (
            <style>{`
                .blur-bg {
                    background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                    background-size: cover;
                }
            `}</style>
        ) : null;
    }, [template, getImageExtension, isImageExtension]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch('/templates', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch templates');
                }

                const data = await response.json();
                setTemplates({
                    userTemplates: data.userTemplates || [],
                    defaultTemplates: data.defaultTemplates || [],
                    themecollections: data.themecollections || []
                });

                const firstTemplateId = data.userTemplates[0]?.id || data.defaultTemplates[0]?.id;
                if (firstTemplateId) {
                    setFormData(prev => ({
                        ...prev,
                        theme: firstTemplateId ? [firstTemplateId.toString()] : []
                    }));
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
            }
        };

        if (auth.user) {
            fetchTemplates();
        }
    }, [auth.user]);

    const addDynamicForm = (position: 'top' | 'bottom') => {
        const newForm = {
            id: nextId,
            unique_id: '',
            emojiMarker: '1️⃣',
            url: '',
            imageUrl: '',
            imageFile: null,
            reference: '',
            customWidth: 33,
            post_type: 'user',
            approve: 'APPROVED',
            user_email: ''
        };

        if (position === 'top') {
            setDynamicForms([newForm, ...dynamicForms]);
        } else {
            setDynamicForms([...dynamicForms, newForm]);
        }
        setNextId(nextId + 1);
    };

    const updateForm = useCallback((id: number, field: string, value: string | number | File | null) => {
        setDynamicForms(prevDynamicForms =>
            prevDynamicForms.map(form =>
                form.id === id ? { ...form, [field]: value } : form
            )
        );
    }, []);

    const removeForm = (id: number) => {
        setDynamicForms(dynamicForms.filter(form => form.id !== id));
    };

    const handleCreateNewFunnelClick = () => {
        setDynamicForms([{
            id: 0,
            unique_id: '',
            emojiMarker: '1️⃣',
            url: '',
            imageUrl: '',
            imageFile: null,
            reference: '',
            customWidth: 33,
            post_type: 'user',
            approve: 'APPROVED',
            user_email: ''
        }]);
        setNextId(1);

        const firstTemplateId = templates.userTemplates[0]?.id || templates.defaultTemplates[0]?.id;
        setFormData({
            ...DEFAULT_FORM_DATA,
            theme: firstTemplateId ? [firstTemplateId.toString()] : []
        });

        setActivePins({});
        setSuccessMessage('');
        setErrorMessage('');
    };

    const handleEzFunnelSubmit = async () => {
    try {
        setIsSubmitting(true);
        setSuccessMessage('');
        setErrorMessage('');

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        const formDataToSend = new FormData();
        
        formDataToSend.append('flySign', formData.flySign ? '1' : '0');
        formDataToSend.append('eyeTracking', formData.eyeTracking ? '1' : '0');
        formDataToSend.append('visibility', formData.visibility ? '1' : '0');
        formDataToSend.append('seoTag', formData.seoTag || '');
        formDataToSend.append('theme', formData.theme.join(','));
        formDataToSend.append('color', formData.color);
        formDataToSend.append('transparency', transparency.toString());
        formDataToSend.append('mode', formData.mode);
        formDataToSend.append('autoApproveTime', formData.autoApproveTime || '');
        formDataToSend.append('designView', formData.designView || 'A');
        formDataToSend.append('displaymode', formData.displaymode || 'dressed'); // Added displaymode

        for (let index = 0; index < dynamicForms.length; index++) {
            const form = dynamicForms[index];
            
            let urlContent = form.url || '';
            
            formDataToSend.append(`dynamicFields[${index}][emojiMarker]`, form.emojiMarker);
            formDataToSend.append(`dynamicFields[${index}][url]`, urlContent);
            formDataToSend.append(`dynamicFields[${index}][reference]`, form.reference || '');
            formDataToSend.append(`dynamicFields[${index}][pinned]`, activePins[form.id] ? '1' : '0');
            formDataToSend.append(`dynamicFields[${index}][customWidth]`, (form.customWidth || 33).toString());
            formDataToSend.append(`dynamicFields[${index}][post_type]`, form.post_type || 'user');
            formDataToSend.append(`dynamicFields[${index}][approve]`, form.approve || 'APPROVED');
            if (form.imageFile) {
                formDataToSend.append(`dynamicFields[${index}][image]`, form.imageFile);
            }
        }

        const response = await axios.post('/save-ez-funnel', formDataToSend, {
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const token = response.data.token;
        setSuccessMessage(
            <>
                EZ Funnel saved successfully!{' '}
                <a 
                    href={`https://ez.wiki/${token}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1 text-sm bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors ml-2"
                >
                    https://ez.wiki/{token}
                </a>
            </>
        );
        handleSearch();
        
        setDynamicForms([{
            id: 0,
            unique_id: '',
            emojiMarker: '1️⃣',
            url: '',
            imageUrl: '',
            imageFile: null,
            reference: '',
            customWidth: 33,
            post_type: 'user',
            approve: 'APPROVED',
            user_email: ''
        }]);
        setNextId(1);
        
        const firstTemplateId = templates.userTemplates[0]?.id || templates.defaultTemplates[0]?.id;
        setFormData({
            ...DEFAULT_FORM_DATA,
            theme: firstTemplateId ? [firstTemplateId.toString()] : []
        });
        setActivePins({});
        setShowInstantCreateModal(false);
    } catch (error: any) {
        console.error('Error:', error);
        setErrorMessage(error.response?.data?.message || 'Failed to save EZ Funnel. Please try again.');
        setTimeout(() => setErrorMessage(''), 10000);
    } finally {
        setIsSubmitting(false);
    }
};

    const handleEditClick = (funnel: any) => {
        const sortedFields = [...funnel.fields].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

        const funnelTransparency = funnel.transparency ?? 80;

        setEditingFunnel({
            id: funnel.id,
            token: funnel.token,
            flySign: funnel.fly_sign,
            eyeTracking: funnel.eye_tracking,
            visibility: funnel.visibility !== undefined ? funnel.visibility : true,
            seoTag: funnel.seo_tag,
            theme: funnel.theme ? funnel.theme.split(',').filter(Boolean) : [],
            color: funnel.color || '#4ade80',
            transparency: funnelTransparency,
            mode: funnel.mode || 'light',
            designView: funnel.design_view || 'A',
            displaymode: funnel.displaymode || 'dressed', // Added displaymode
            fields: funnel.fields.map((field: any) => ({
                id: field.id,
                unique_id: field.unique_id || '',
                emojiMarker: field.emoji_marker,
                url: field.url,
                imageUrl: field.image_url,
                reference: field.reference,
                pinned: field.pinned,
                custom_width: field.custom_width,
                post_type: field.post_type,
                approve: field.approve || 'APPROVED',
                user_email: field.user?.email || field.user_email || ''
            }))
        });

        setFormData({
            flySign: funnel.fly_sign,
            eyeTracking: funnel.eye_tracking,
            visibility: funnel.visibility !== undefined ? funnel.visibility : true,
            seoTag: funnel.seo_tag,
            theme: funnel.theme ? funnel.theme.split(',').filter(Boolean) : [],
            color: funnel.color || '#4ade80',
            transparency: funnelTransparency,
            mode: funnel.mode || 'light',
            autoApproveTime: funnel.auto_approve_time || '02:00',
            designView: funnel.design_view || 'A',
            displaymode: funnel.displaymode || 'dressed' // Added displaymode
        });

        setTransparency(funnelTransparency);

        setDynamicForms(sortedFields.map((field: any) => ({
            id: field.id,
            unique_id: field.unique_id || '',
            emojiMarker: field.emoji_marker,
            url: field.url || '',
            imageUrl: field.image_url || '',
            imageFile: null,
            reference: field.reference,
            customWidth: field.custom_width || 33,
            post_type: field.post_type,
            approve: field.approve || 'APPROVED',
            user_email: field.user?.email || field.user_email || ''
        })));

        const initialPins = funnel.fields.reduce((acc: Record<number, boolean>, field: any) => {
            acc[field.id] = !!field.pinned;
            return acc;
        }, {});
        setActivePins(initialPins);
        setIsEditing(true);
    };

    const handleUpdateFunnel = async () => {
    try {
        setIsSubmitting(true);
        setSuccessMessage('');
        setErrorMessage('');

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        const formDataToSend = new FormData();
        
        formDataToSend.append('id', editingFunnel?.id?.toString() || '');
        formDataToSend.append('flySign', formData.flySign ? '1' : '0');
        formDataToSend.append('eyeTracking', formData.eyeTracking ? '1' : '0');
        formDataToSend.append('visibility', formData.visibility ? '1' : '0');
        formDataToSend.append('seoTag', formData.seoTag || '');
        formDataToSend.append('theme', formData.theme.join(','));
        formDataToSend.append('color', formData.color);
        formDataToSend.append('transparency', transparency.toString());
        formDataToSend.append('mode', formData.mode);
        formDataToSend.append('autoApproveTime', formData.autoApproveTime || '');
        formDataToSend.append('designView', formData.designView || 'A');
        formDataToSend.append('displaymode', formData.displaymode || 'dressed'); // Added displaymode
        
        formDataToSend.append('_method', 'PUT');

        for (let index = 0; index < dynamicForms.length; index++) {
            const form = dynamicForms[index];
            
            let urlContent = form.url || '';
            
            formDataToSend.append(`dynamicFields[${index}][id]`, form.id?.toString() || '');
            formDataToSend.append(`dynamicFields[${index}][emojiMarker]`, form.emojiMarker);
            formDataToSend.append(`dynamicFields[${index}][url]`, urlContent);
            formDataToSend.append(`dynamicFields[${index}][reference]`, form.reference || '');
            formDataToSend.append(`dynamicFields[${index}][pinned]`, activePins[form.id] ? '1' : '0');
            formDataToSend.append(`dynamicFields[${index}][customWidth]`, (form.customWidth || 33).toString());
            formDataToSend.append(`dynamicFields[${index}][post_type]`, form.post_type || 'user');
            formDataToSend.append(`dynamicFields[${index}][approve]`, form.approve || 'APPROVED');
            formDataToSend.append(`dynamicFields[${index}][imageUrl]`, form.imageUrl || '');

            if (form.imageFile) {
                formDataToSend.append(`dynamicFields[${index}][image]`, form.imageFile);
            }
        }
            
        const response = await axios.post('/update-ez-funnel', formDataToSend, {
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        setSuccessMessage(
            <>
                EZ Funnel updated successfully!{' '}
                <a 
                    href={`https://ez.wiki/${editingFunnel?.token || ''}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1 text-sm bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors ml-2"
                >
                    https://ez.wiki/{editingFunnel?.token || ''}
                </a>
            </>
        );
        
        setTimeout(() => {
            handleSearch();
            setDynamicForms([{
                id: 0,
                unique_id: '',
                emojiMarker: '1️⃣',
                url: '',
                imageUrl: '',
                imageFile: null,
                reference: '',
                customWidth: 33,
                post_type: 'user',
                approve: 'APPROVED',
                user_email: ''
            }]);
            setNextId(1);

            const firstTemplateId = templates.userTemplates[0]?.id || templates.defaultTemplates[0]?.id;
            setFormData({
                ...DEFAULT_FORM_DATA,
                theme: firstTemplateId ? [firstTemplateId.toString()] : []
            });

            setActivePins({});
            setIsEditing(false);
            setEditingFunnel(null);
        }, 3000);
    } catch (error: any) {
        console.error('Error:', error);
        setErrorMessage(error.response?.data?.message || 'Failed to update EZ Funnel. Please try again.');
        setTimeout(() => setErrorMessage(''), 10000);
    } finally {
        setIsSubmitting(false);
    }
};

    const handlePreview = useCallback(async () => {
        setIsPreviewLoading(true);

        try {
            const previewData = {
                formData,
                dynamicForms: dynamicForms.map(form => ({
                    ...form,
                    pinned: !!activePins[form.id]
                })),
                themes: formData.theme.map(themeId => {
                    const theme = [...templates.userTemplates, ...templates.defaultTemplates, ...templates.themecollections]
                        .find(t => t.id.toString() === themeId);
                    return theme;
                }).filter(Boolean),
                isEditing,
                editingFunnelId: editingFunnel?.id,
                isSinglePreview: false
            };

            sessionStorage.setItem('ezFunnelPreview', JSON.stringify(previewData));
            await axios.post('/store-preview-data', { previewData });
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Preview error:', error);
            setErrorMessage(error.message || 'Failed to prepare preview. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsPreviewLoading(false);
        }
    }, [formData, dynamicForms, activePins, templates, isEditing, editingFunnel]);

    const renderPreviewButton = () => (
        <button
            className="bg-gradient-to-r flex from-blue-600 to-blue-500 text-white rounded-lg px-4 py-2 font-medium hover:shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="button"
            onClick={handlePreview}
            disabled={isPreviewLoading}
            data-tooltip-id="action-tooltip"
            data-tooltip-content="Preview your entire creation"
        >
            {isPreviewLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparing...
                </>
            ) : (
                'Preview'
            )}
        </button>
    );

    const loadDemoData = async () => {
        try {
            const response = await axios.get('/loadframe/demo');
            const demoData = response.data;
            
            setDynamicForms(demoData.fields.map((field: any, index: number) => ({
                id: index,
                unique_id: field.unique_id || '',
                emojiMarker: field.emoji_marker || '1️⃣',
                url: field.url || '',
                imageUrl: '',
                imageFile: null,
                reference: field.reference || '',
                customWidth: field.custom_width || 33,
                post_type: field.post_type || 'user',
                approve: field.approve || 'APPROVED',
                user_email: field.user_email || field.user?.email || ''
            })));        
        } catch (error) {
            console.error('Error loading demo data:', error);
        }
    };

    useEffect(() => {
        if (pageProps.initialFunnels) {
            setFunnels(pageProps.initialFunnels.data);
            setHasMore(pageProps.initialFunnels.next_page_url !== null);
        }
    }, [pageProps.initialFunnels]);

    useEffect(() => {
        if (initialFunnels) {
            setFunnels(initialFunnels.data);
            setHasMore(initialFunnels.next_page_url !== null);
        }
    }, [initialFunnels]);

    const handleSearch = async () => {
        try {
            const response = await axios.get('/search-ez-funnels', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: 1,
                    with: 'user'
                }
            });

            console.log('Search results:', response.data);
            
            setFunnels(response.data.data);
            setCurrentPage(1);
            setHasMore(response.data.next_page_url !== null);
        } catch (error) {
            console.error('Search error:', error);
            setErrorMessage('Failed to search funnels. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        }
    };

    const loadMore = async () => {
        try {
            setIsSubmitting(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await axios.get('/search-ez-funnels', {
                params: {
                    query: searchQuery,
                    type: searchType,
                    page: currentPage + 1,
                    with: 'customDomains'
                },
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                setFunnels(prevFunnels => {
                    const newFunnels = [...prevFunnels];
                    response.data.data.forEach(newFunnel => {
                        const existingIndex = newFunnels.findIndex(f => f.id === newFunnel.id);
                        if (existingIndex >= 0) {
                            newFunnels[existingIndex] = {
                                ...newFunnels[existingIndex],
                                ...newFunnel,
                                handle_domains: [
                                    ...(newFunnels[existingIndex].handle_domains || []),
                                    ...(newFunnel.handle_domains || [])
                                ],
                                custom_domains: [
                                    ...(newFunnels[existingIndex].custom_domains || []),
                                    ...(newFunnel.custom_domains || [])
                                ]
                            };
                        } else {
                            newFunnels.push(newFunnel);
                        }
                    });
                    return newFunnels;
                });

                setCurrentPage(currentPage + 1);
                setHasMore(response.data.next_page_url !== null);
            }
        } catch (error) {
            console.error('Load more error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to load more items. Please try again.');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const scrollToFrame = (frameId: number) => {
        setActiveFrameId(frameId);
        const frameElement = document.getElementById(`frame-${frameId}`);
        if (frameElement) {
            frameElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            frameElement.classList.add('ring-2', 'ring-yellow-400');
            setTimeout(() => {
                frameElement.classList.remove('ring-2', 'ring-yellow-400');
            }, 2000);
            
            const expandButton = frameElement.querySelector<HTMLButtonElement>('[data-tooltip-content="Expand Frame"]');
            
            if (expandButton) {
                expandButton.click();
            }
        }
    };

    const renderTemplateContent = useMemo(() => {
        if (!template) return null;

        const extension = getImageExtension(template.image) || '';
        const imgPath = template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        const fullImageUrl = `${imgPath}${template.image}`;

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
        const htmlBlob = new Blob([template.image], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);

        if (isImageExtension(extension)) {
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
                        key={`image-${fullImageUrl}`}
                    />
                </>
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
                            width = '100%';
                            height = '100%';
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
                        key={`iframe-${template.image.substring(0, 20)}`}
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
                            key={`youtube-${youtubeMatch[1]}`}
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
                        key={`youtube-main-${youtubeMatch[1]}`}
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
                        key={`linkedin-${linkedinUrl.substring(0, 20)}`}
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
                            width = '100%';
                            height = '100%';
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
                        key={`vimeo-${vimeoMatch[3]}`}
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
                        key={`facebook-${template.image.substring(0, 20)}`}
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
                        key={`video-bg-${fullImageUrl}`}
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
                        key={`video-main-${fullImageUrl}`}
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
                        key={`model-${fullImageUrl}`}
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
                        src={template.image}
                        className="fixed top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        key={`iframe-url-${template.image.substring(0, 20)}`}
                        scrolling="yes"
                    />
                </>
            );
        }

        return (
            <iframe
                src={htmlUrl}
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
                key={`html-${template.image.substring(0, 20)}`}
                scrolling="yes"
            />
        );
    }, [template, getImageExtension, isValidUrl, isImageExtension]);

    useEffect(() => {
        if (template?.image.includes('facebook.com') || template?.image.includes('fb.watch')) {
            const script = document.createElement('script');
            script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, [template]);

    return (
        <>
            <Head>
                <title>Ez Funnel</title>
                {blurStyle}
                <style>{`
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                    
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
                `}</style>
            </Head>

            <Tooltip id="nav-tooltip" />
            <Tooltip id="action-tooltip" />
            <Tooltip id="form-tooltip" />
            <Tooltip id="modal-tooltip" />
            <Tooltip id="ezui-tooltip" />
            <Tooltip id="mdeditor-tooltip" />
            
            <DraggableMenu auth={auth} />
            <main className={`relative flex justify-end p-4 min-h-screen overflow-hidden ${
                template?.image && isImageExtension(getImageExtension(template.image)) ? 'blur-bg' : ''}`}>
                <div className="absolute inset-0 z-0">
                    {renderTemplateContent}
                </div>

                {showDeleteModal && (
                    <div className="fixed inset-0 z-70 flex items-center justify-center">
                        <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden">
                            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
                                <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setItemToDelete(null);
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors duration-200 text-2xl font-light"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Cancel deletion"
                                >
                                    &times;
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <p className="text-white text-lg mb-2">Are you sure you want to delete?</p>
                                    <p className="text-yellow-400 font-semibold">{itemToDelete?.name}</p>
                                    <p className="text-red-400 text-sm mt-2">This action cannot be undone!</p>
                                </div>
                                
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setItemToDelete(null);
                                        }}
                                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                        data-tooltip-id="modal-tooltip"
                                        data-tooltip-content="Do not delete"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={deletingId !== null}
                                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        data-tooltip-id="modal-tooltip"
                                        data-tooltip-content="Permanently delete this item"
                                    >
                                        {deletingId !== null && (
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showImportModal && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center">
                        <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border max-h-full border-gray-700 overflow-y-auto animate-fade-in">
                            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
                                <h3 className="text-xl font-bold text-white">Extract to Demo</h3>
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors duration-200 text-2xl font-light"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Close import modal"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="p-5">
                                <div className="flex rounded-md overflow-hidden mb-4">
                                    <div className="flex items-center justify-center bg-green-700 p-3">
                                        <FontAwesomeIcon icon={faGlobe} className="text-white text-xl" />
                                    </div>
                                    <input
                                        type="text"
                                        value={importUrl}
                                        onChange={(e) => setImportUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-white text-gray-900 border-none focus:ring-2 focus:ring-yellow-400 focus:outline-none text-base"
                                        placeholder="Enter URL"
                                        data-tooltip-id="modal-tooltip"
                                        data-tooltip-content="Enter a URL to extract frames from"
                                    />
                                    <button
                                        className="bg-green-700 text-white px-5 py-2 whitespace-nowrap font-medium hover:bg-green-800 transition-colors flex items-center justify-center"
                                        onClick={handleMultiIframeExtract}
                                        disabled={isMultiIframeLoading || !importUrl.trim()}
                                        data-tooltip-id="modal-tooltip"
                                        data-tooltip-content="Extract frames from the URL"
                                    >
                                        {isMultiIframeLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Extracting...
                                            </>
                                        ) : (
                                            'Multi Iframe'
                                        )}
                                    </button>
                                </div>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-700"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-2 bg-gray-900 text-yellow-400 text-sm">
                                            or
                                        </span>
                                    </div>
                                </div>

                                <div className="flex rounded-md overflow-hidden">
                                    <div className="flex bg-white items-stretch flex-grow border-r border-transparent">
                                        <span className="flex items-center px-4 text-gray-600 bg-white">
                                            https://4x4.ai/
                                        </span>
                                        <input
                                            type="text"
                                            value={importHandle}
                                            onChange={(e) => setImportHandle(e.target.value)}
                                            className="w-full pl-1 pr-3 py-2 bg-white text-gray-900 border-none focus:ring-2 focus:ring-yellow-400 focus:outline-none text-base"
                                            placeholder="Enter handle"
                                            data-tooltip-id="modal-tooltip"
                                            data-tooltip-content="Enter a 4x4.ai handle to import"
                                        />
                                    </div>
                                    <button
                                        className="bg-green-700 text-white px-5 py-2 whitespace-nowrap font-medium hover:bg-green-800 transition-colors"
                                        onClick={handleExtractDemo}
                                        disabled={isSubmitting || !importHandle.trim()}
                                        data-tooltip-id="modal-tooltip"
                                        data-tooltip-content="Import data from the 4x4.ai handle"
                                    >
                                        {isSubmitting ? 'Extracting...' : 'Extract to Demo'}
                                    </button>
                                </div>

                                {errorMessage && (
                                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                        {errorMessage}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showPreviewModal && (
                    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black bg-opacity-75">
                        <div className="relative w-full h-full max-w-6xl max-h-[95vh] bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
                            <div className="absolute top-0 left-0 right-0 p-3 bg-gray-800 flex justify-between items-center z-10">
                                <h3 className="text-lg font-semibold text-white">
                                    Preview: {isEditing ? `Editing ${editingFunnel?.token}` : 'New Funnel'}
                                </h3>
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Close preview"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="absolute inset-0 top-12">
                                <iframe
                                    src={isEditing && editingFunnel?.id
                                        ? `/preview/${editingFunnel.id}?mode=edit`
                                        : '/preview?mode=create'}
                                    className="w-full h-full border-none"
                                    allow="fullscreen"
                                    title="Funnel Preview"
                                    scrolling="yes"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {showInstantCreateModal && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center">
                        <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border max-h-full border-gray-700 overflow-y-auto animate-fade-in">
                            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
                                <h3 className="text-xl font-bold text-white">Instant Create</h3>
                                <button
                                    onClick={() => setShowInstantCreateModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors duration-200"
                                    data-tooltip-id="modal-tooltip"
                                    data-tooltip-content="Close instant create"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <p className="text-gray-300 font-medium text-sm">
                                        Generate free generic handle and embed site on
                                    </p>
                                    <p className="text-white font-bold text-2xl mt-1 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                        ez.wiki
                                    </p>
                                    {successMessage && (
                                        <div className="mb-4 p-4 bg-green-900/80 border border-green-700/80 text-green-200 rounded-lg">
                                            {successMessage}
                                            <button
                                                onClick={() => setSuccessMessage('')}
                                                className="float-right font-bold text-green-400 hover:text-green-200"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    )}

                                    {errorMessage && (
                                        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 text-red-400 rounded-lg">
                                            {errorMessage}
                                            <button
                                                onClick={() => setErrorMessage('')}
                                                className="float-right font-bold text-red-300 hover:text-red-100"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <hr className="border-t border-gray-800 mb-6" />

                                <div className="space-y-5">
                                    <div className="flex justify-center items-center mb-4 gap-4">
                                        <label className="flex items-center space-x-3 cursor-pointer" data-tooltip-id="modal-tooltip" data-tooltip-content="Toggle Fly-Sign feature">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id="flySignToggle"
                                                    className="sr-only peer"
                                                    checked={formData.flySign}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev,
                                                        flySign: !prev.flySign
                                                    }))}
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                            </div>
                                            <span className="text-white font-medium">Fly-Sign</span>
                                        </label>

                                        <label className="flex items-center space-x-3 cursor-pointer" data-tooltip-id="modal-tooltip" data-tooltip-content="See More?">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id="eyeTrackingToggle"
                                                    className="sr-only peer"
                                                    checked={formData.eyeTracking}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev,
                                                        eyeTracking: !prev.eyeTracking
                                                    }))}
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                            </div>
                                            <span className="text-2xl">👀</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer" data-tooltip-id="modal-tooltip" data-tooltip-content="Toggle Content Moderation">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id="visibilityToggle"
                                                    className="sr-only peer"
                                                    checked={formData.visibility}
                                                    onChange={() => {
                                                        const newVisibility = !formData.visibility;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            visibility: newVisibility
                                                        }));
                                                        
                                                        if (!newVisibility) {
                                                            setDynamicForms(prevForms => 
                                                                prevForms.map(form => ({
                                                                    ...form,
                                                                    emojiMarker: form.emojiMarker === '0️⃣' ? '1️⃣' : form.emojiMarker
                                                                }))
                                                            );
                                                        }
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                            </div>
                                            <span className="text-white font-medium">Content Moderation</span>
                                        </label>
                                    </div>
                                    
                                    <div className="flex justify-center items-center mb-4 gap-4">
                                        {formData.visibility && (
                                            <div className="flex items-center space-x-3">
                                                <span className="text-white font-medium">Auto Approve Time</span>
                                                <div data-tooltip-id="modal-tooltip" data-tooltip-content="Set automatic approval time for submissions">
                                                    <input
                                                        type="time"
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            autoApproveTime: e.target.value
                                                        }))}
                                                        value={formData.autoApproveTime ? formData.autoApproveTime.substring(0, 5) : ''}
                                                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[130px] p-2"
                                                        style={{ colorScheme: 'dark' }}
                                                    />
                                                </div>
                                                <span className="text-gray-400 text-sm">(HH:MM)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-yellow-400/90">
                                                Frame Color
                                                <span className="ml-1 text-xs text-gray-400">(click to change)</span>
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="relative" data-tooltip-id="modal-tooltip" data-tooltip-content="Choose the color for the frames">
                                                    <div 
                                                        className="w-12 h-12 rounded-lg border-2 border-gray-600/50 shadow-lg cursor-pointer transition-all hover:border-yellow-400/50 hover:scale-105"
                                                        style={{ 
                                                            backgroundColor: formData.color,
                                                            boxShadow: `0 0 12px ${formData.color}40`
                                                        }}
                                                    >
                                                        <input
                                                            type="color"
                                                            name="framecolor"
                                                            value={formData.color}
                                                            onChange={handleFrameColorChange}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-mono text-white bg-gray-800/80 px-3 py-2 rounded-lg border border-gray-700 truncate">
                                                        {formData.color.toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-yellow-400/90">
                                                Frame Transparency
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 relative" data-tooltip-id="modal-tooltip" data-tooltip-content="Adjust the transparency of the frames">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={transparency}
                                                        onChange={(e) => {
                                                            const value = parseInt(e.target.value);
                                                            setTransparency(value);
                                                            setFormData(prev => ({ ...prev, transparency: value }));
                                                        }}
                                                        className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer 
                                                                [&::-webkit-slider-thumb]:appearance-none 
                                                                [&::-webkit-slider-thumb]:h-4 
                                                                [&::-webkit-slider-thumb]:w-4 
                                                                [&::-webkit-slider-thumb]:rounded-full 
                                                                [&::-webkit-slider-thumb]:bg-yellow-400
                                                                [&::-webkit-slider-thumb]:shadow-md
                                                                [&::-webkit-slider-thumb]:border
                                                                [&::-webkit-slider-thumb]:border-yellow-200/50
                                                                [&::-webkit-slider-thumb]:transition-all
                                                                [&::-webkit-slider-thumb]:hover:scale-125
                                                                [&::-webkit-slider-runnable-track]:bg-gradient-to-r 
                                                                [&::-webkit-slider-runnable-track]:from-gray-700 
                                                                [&::-webkit-slider-runnable-track]:to-gray-500"
                                                    />
                                                    <div className="absolute top-0 left-0 right-0 h-2 rounded-full pointer-events-none overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-yellow-400/30 to-yellow-400/70"
                                                            style={{ width: `${transparency}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-14 text-center text-sm font-medium text-white bg-gray-800/80 px-2 py-1.5 rounded-lg border border-gray-700 shadow-inner">
                                                    {transparency}%
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                                                <span>0%</span>
                                                <span>50%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 mb-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-yellow-400/90">Seo Tag:</label>
                                            <div className="group relative" data-tooltip-id="modal-tooltip" data-tooltip-content="Add an SEO tag for better discoverability">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <span className="text-gray-500 font-medium">#</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Enter SEO tag, e.g. Marketing"
                                                    className="w-full h-10 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                                                    value={formData.seoTag}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        seoTag: e.target.value
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-yellow-400/90">View:</label>
                                            <select 
                                                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                data-tooltip-id="ezui-tooltip"
                                                data-tooltip-content="Choose a pre-defined layout for your themes"
                                                value={formData.designView}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    designView: e.target.value
                                                }))}
                                            >
                                                <option value="A">A: Design View</option>
                                                <option value="B">B: Tile View</option>
                                                <option value="C">C: Theme Only</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-yellow-400/90">Display View:</label>
                                            <select 
                                                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                data-tooltip-id="ezui-tooltip"
                                                data-tooltip-content="Choose a pre-defined layout for your themes"
                                                value={formData.displaymode}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    displaymode: e.target.value
                                                }))}
                                            >
                                                <option value="dressed">EZ View</option>
                                                <option value="naked">HYBRID View</option>
                                                <option value="ai">AI View</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="flex items-center space-x-3 mb-1">
                                            <span className="text-yellow-400 font-medium text-sm whitespace-nowrap">Select Themes:</span>
                                        </div>

                                        {/* Selected Themes List */}
                                        <div className="mb-3 space-y-2 max-h-48 overflow-y-auto pr-2">
                                          {formData.theme.length > 0 ? (
                                            formData.theme.map((themeId, index) => {
                                              const allThemes = [
                                                ...templates.userTemplates,
                                                ...templates.defaultTemplates,
                                                ...templates.themecollections
                                              ];
                                              
                                              const theme = allThemes.find(t => 
                                                t.id?.toString() === themeId || 
                                                t.unique_id === themeId
                                              );
                                              
                                              if (!theme) return null;

                                              // Dynamic background color based on source
                                              const isCollection = templates.themecollections.some(t => t.id?.toString() === themeId || t.unique_id === themeId);
                                              const isUserTemplate = templates.userTemplates.some(t => t.id?.toString() === themeId || t.unique_id === themeId);
                                              
                                              let bgClass = "bg-gray-700 hover:bg-gray-700/80"; // Default
                                              if (isCollection) bgClass = "bg-purple-800/60 hover:bg-purple-800/80 border border-purple-500/30";
                                              if (isUserTemplate) bgClass = "bg-blue-800/60 hover:bg-blue-800/80 border border-blue-500/30";

                                              return (
                                                <div 
                                                  key={`${themeId}-${index}`} 
                                                  className={`flex items-center gap-2 p-2 rounded transition-colors ${bgClass}`}
                                                >
                                                  <button
                                                    onClick={() => moveThemeUp(index)}
                                                    disabled={index === 0}
                                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded bg-gray-600 hover:bg-gray-500"
                                                    title="Move up"
                                                  >
                                                    ↑
                                                  </button>
                                                  <button
                                                    onClick={() => moveThemeDown(index)}
                                                    disabled={index === formData.theme.length - 1}
                                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded bg-gray-600 hover:bg-gray-500"
                                                    title="Move down"
                                                  >
                                                    ↓
                                                  </button>
                                                  <span className="flex-1 text-white text-sm truncate">
                                                    <span className={`font-mono text-xs mr-2 ${isCollection ? 'text-purple-300' : isUserTemplate ? 'text-blue-300' : 'text-gray-400'}`}>
                                                      {theme.unique_id || theme.id}
                                                    </span>
                                                    {theme.title || 'Untitled Theme'}
                                                  </span>
                                                  <button
                                                    onClick={() => toggleThemeSelection(themeId)}
                                                    className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                                                    title="Remove theme"
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <div className="text-center py-4 border-2 border-dashed border-gray-700 rounded-lg">
                                              <FontAwesomeIcon icon={faLayerGroup} className="text-gray-500 text-2xl mb-2" />
                                              <p className="text-gray-400 text-sm">No themes selected</p>
                                            </div>
                                          )}
                                        </div>

                                        {/* Add Theme Dropdown */}
                                        <div className="relative" data-tooltip-id="modal-tooltip" data-tooltip-content="Select and order themes for your funnel">
                                          <select
                                              className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent h-10 appearance-none"
                                              onChange={(e) => {
                                                const themeId = e.target.value;
                                                if (themeId && !formData.theme.includes(themeId)) {
                                                  setFormData(prev => ({
                                                    ...prev,
                                                    theme: [...prev.theme, themeId]
                                                  }));
                                                }
                                                e.target.value = '';
                                              }}
                                              value=""
                                              style={{
                                                backgroundImage: 'none'
                                              }}
                                            >
                                              <option value="">Add a theme...</option>
                                              
                                              {/* Theme Collections - Purple Theme */}
                                              {templates.themecollections.length > 0 && (
                                                <optgroup 
                                                  label="My Collections"
                                                  className="bg-purple-800/60 text-purple-100 border-b border-purple-500/30"
                                                >
                                                  {templates.themecollections.map(template => (
                                                    <option
                                                      key={`collection-${template.id}`}
                                                      value={template.id?.toString() || template.unique_id}
                                                      disabled={formData.theme.includes(template.id?.toString() || template.unique_id)}
                                                      className="bg-purple-800/60 hover:bg-purple-800/80 text-white"
                                                    >
                                                      {template.unique_id} {template.title} (Collection)
                                                    </option>
                                                  ))}
                                                </optgroup>
                                              )}
                                              
                                              {/* User Templates - Blue Theme */}
                                              {templates.userTemplates.length > 0 && (
                                                <optgroup 
                                                  label="My Templates"
                                                  className="bg-blue-800/60 text-blue-100 border-b border-blue-500/30"
                                                >
                                                  {templates.userTemplates.map(template => (
                                                    <option
                                                      key={`user-${template.id}`}
                                                      value={template.id?.toString() || template.unique_id}
                                                      disabled={formData.theme.includes(template.id?.toString() || template.unique_id)}
                                                      className="bg-blue-800/60 hover:bg-blue-800/80 text-white"
                                                    >
                                                      {template.unique_id} {template.title}
                                                    </option>
                                                  ))}
                                                </optgroup>
                                              )}
                                              
                                              {/* Default Templates - Gray Theme */}
                                              {templates.defaultTemplates.length > 0 && (
                                                <optgroup 
                                                  label="Default Templates"
                                                  className="bg-gray-700 text-gray-100 border-b border-gray-500/30"
                                                >
                                                  {templates.defaultTemplates.map(template => (
                                                    <option
                                                      key={`default-${template.id}`}
                                                      value={template.id?.toString() || template.unique_id}
                                                      disabled={formData.theme.includes(template.id?.toString() || template.unique_id)}
                                                      className="bg-gray-700 hover:bg-gray-700/80 text-white"
                                                    >
                                                      {template.unique_id} {template.title}
                                                    </option>
                                                  ))}
                                                </optgroup>
                                              )}
                                              
                                              {/* Empty State */}
                                              {templates.userTemplates.length === 0 && 
                                               templates.defaultTemplates.length === 0 && 
                                               templates.themecollections.length === 0 && (
                                                <option disabled className="text-gray-400 bg-gray-700">
                                                  No themes available
                                                </option>
                                              )}
                                            </select>
                                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            className="w-full bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-black font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
                                            onClick={isEditing ? handleUpdateFunnel : handleEzFunnelSubmit}
                                            disabled={isSubmitting}
                                            data-tooltip-id="modal-tooltip"
                                            data-tooltip-content={isEditing ? 'Update your funnel' : 'Create a new funnel'}
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>{isEditing ? 'Updating...' : 'Saving...'}</span>
                                                </div>
                                            ) : (
                                                <span>{isEditing ? 'Update Funnel' : 'EZ Funnel'}</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isPanelVisible && (
                    <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl max-h-[calc(100vh-4rem)]">
                        <button
                            onClick={() => setIsPanelVisible(false)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center z-50 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                            data-tooltip-id="action-tooltip"
                            data-tooltip-content="Hide Control Panel"
                        >
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-white text-lg"
                                style={{ textShadow: '0.7px 0.7px 0 rgb(255,0,0), -0.7px -0.7px 0 rgb(0,255,255)' }}
                            />
                        </button>

                        {successMessage && (
                            <div className="mb-4 p-4 bg-green-900/80 border border-green-700/80 text-green-200 rounded-lg flex items-start gap-4 animate-fade-in shadow-lg max-w-lg mx-auto w-full">
                                <div className="flex-shrink-0 pt-0.5">
                                    <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="flex-grow text-sm">{successMessage}</div>
                                <div className="flex-shrink-0">
                                    <button
                                        onClick={() => setSuccessMessage('')}
                                        className="text-green-400/70 hover:text-green-200 transition-colors duration-200 focus:outline-none"
                                        aria-label="Close message"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="mb-4 p-4 bg-red-900/50 border border-red-700 text-red-400 rounded-lg flex justify-between items-center animate-fade-in max-w-lg mx-auto w-full shadow-md">
                                <div className="flex-grow text-sm">{errorMessage}</div>
                                <button
                                    onClick={() => setErrorMessage('')}
                                    className="ml-4 font-bold text-red-300 hover:text-red-100 text-xl leading-none focus:outline-none"
                                    aria-label="Close error"
                                >
                                    &times;
                                </button>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                                <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-4 sticky top-4 self-start h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <button
                                            className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg px-4 py-2 font-medium hover:shadow-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-red-400"
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                handleCreateNewFunnelClick();
                                            }}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Clear the form and start a new funnel"
                                        >
                                            CREATE NEW EZ FUNNEL
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Search by token"
                                            className="flex-grow bg-white text-gray-900 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-0"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="Search your saved funnels by token"
                                        />

                                        <div className="flex items-center">
                                            <button
                                                className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-l-md border-r transition-colors ${
                                                    searchType === 'fuzzy'
                                                        ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                                                        : 'bg-gray-600 text-gray-300 border-gray-700 hover:bg-gray-700'
                                                }`}
                                                onClick={() => {
                                                    setSearchType('fuzzy');
                                                    handleSearch();
                                                }}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Use fuzzy (approximate) search"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 0 11-16 0 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Fuzzy
                                            </button>
                                            <button
                                                className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-r-md transition-colors ${
                                                    searchType === 'exact'
                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                                                }`}
                                                onClick={() => {
                                                    setSearchType('exact');
                                                    handleSearch();
                                                }}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Use exact match search"
                                            >
                                                <span className="text-sm">🏀</span>
                                                Exact
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {funnels.map((funnel) => (
                                            <React.Fragment key={funnel.id}>
                                                <div className="flex flex-col md:flex-row items-start md:items-center p-4 gap-3 bg-[#5d0f6e] rounded-lg">
                                                    <div className="flex flex-col items-center justify-center flex-shrink-0">
                                                        <span className="text-4xl select-none">
                                                            🍀
                                                        </span>
                                                        <span className="text-xs text-white font-semibold mt-1 bg-black/20 px-2 py-0.5 rounded">
                                                            Frames: {funnel.fields.length}
                                                        </span>
                                                    </div>
                                                    <div className="flex-grow min-w-0 w-full md:w-auto">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <a 
                                                                    href={`https://ez.wiki/${encodeURIComponent(funnel.token)}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors break-all"
                                                                >
                                                                    https://ez.wiki/{funnel.token}
                                                                </a>
                                                                <span className="text-purple-300 text-sm whitespace-nowrap">
                                                                    {formatDate(funnel.created_at)}
                                                                </span>
                                                            </div>

                                                            {/* Display AI Search History Slug if aiid exists */}
                                                            {funnel.ai_search_history && (
                                                                <div className="flex flex-wrap items-center gap-2 bg-blue-900/30 p-2 rounded cursor-pointer hover:bg-blue-800/50 transition-colors" onClick={() => {
                                                                    window.open(`https://ez.wiki/X/${funnel.ai_search_history.slug}`, '_blank');
                                                                }}>
                                                                    <a 
                                                                        href={`https://ez.wiki/X/${encodeURIComponent(funnel.ai_search_history.slug)}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-300 font-semibold hover:text-blue-200 transition-colors break-all"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        https://ez.wiki/X/{funnel.ai_search_history.slug}
                                                                    </a>
                                                                </div>
                                                            )}

                                                            {funnel.handle_domains?.map((domain) => (
                                                                <div key={domain.id} className="flex flex-wrap items-center gap-2 bg-purple-900/30 p-2 rounded">
                                                                    <a
                                                                        href={`https://${domain.domain}.${domain.domainselected}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors break-all flex-grow"
                                                                    >
                                                                        https://{domain.domain}.{domain.domainselected}
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleDeleteHandleDomain(domain.id, domain.domain, domain.domainselected)}
                                                                        disabled={deletingId === domain.id && deletingType === 'handleDomain'}
                                                                        className="bg-red-600 text-white font-bold py-1 px-2 rounded-md text-sm hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-[2rem]"
                                                                        data-tooltip-id="action-tooltip" data-tooltip-content="Delete handle domain"
                                                                    >
                                                                        {deletingId === domain.id && deletingType === 'handleDomain' ? (
                                                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                        ) : (
                                                                            <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {funnel.custom_domains?.map((domain) => (
                                                                <div key={domain.id} className="flex flex-wrap items-center gap-2 bg-purple-900/30 p-2 rounded">
                                                                    <a
                                                                        href={`https://{domain.domainselected}/${domain.domain}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors break-all flex-grow"
                                                                    >
                                                                        https://{domain.domainselected}/{domain.domain}
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleDeleteCustomDomain(domain.id, domain.domain, domain.domainselected)}
                                                                        disabled={deletingId === domain.id && deletingType === 'customDomain'}
                                                                        className="bg-red-600 text-white font-bold py-1 px-2 rounded-md text-sm hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-[2rem]"
                                                                        data-tooltip-id="action-tooltip" data-tooltip-content="Delete custom domain"
                                                                    >
                                                                        {deletingId === domain.id && deletingType === 'customDomain' ? (
                                                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                        ) : (
                                                                            <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-2 ml-auto flex-shrink-0">
                                                        <button
                                                            className="bg-yellow-400 text-black font-bold py-1 px-3 md:px-5 rounded-md text-sm hover:bg-yellow-500 transition-colors whitespace-nowrap"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleEditClick(funnel);
                                                            }}
                                                            data-tooltip-id="action-tooltip" data-tooltip-content="Edit this funnel"
                                                        >
                                                            Edit
                                                        </button>
                                                        {auth?.linkedin_access_token && (
                                                            <>
                                                                <button
                                                                    className="bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleLinkedInPost(funnel);
                                                                    }}
                                                                    disabled={isSubmittingLinkedIn}
                                                                    data-tooltip-id="action-tooltip" 
                                                                    data-tooltip-content="Post this funnel on LinkedIn"
                                                                >
                                                                    {isSubmittingLinkedIn ? (
                                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <>
                                                                            <FontAwesomeIcon icon={faShare} className="h-3 w-3" />
                                                                            LinkedIn
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                        {auth?.reddit_token && (    
                                                            <>
                                                                <button
                                                                    className="bg-orange-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-orange-700 transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleRedditShare(funnel);
                                                                    }}
                                                                    disabled={isSubmittingReddit}
                                                                    data-tooltip-id="action-tooltip" 
                                                                    data-tooltip-content="Share this funnel on Reddit"
                                                                >
                                                                    {isSubmittingReddit ? (
                                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <>
                                                                            <FontAwesomeIcon icon={faShare} className="h-3 w-3" />
                                                                            Reddit
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                        {(funnel.handle_domains?.length === 0 && funnel.custom_domains?.length === 0) && (
                                                            <button
                                                                onClick={() => handleDeleteFunnel(funnel.id, funnel.token)}
                                                                disabled={deletingId === funnel.id && deletingType === 'funnel'}
                                                                className="bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center"
                                                                data-tooltip-id="action-tooltip" data-tooltip-content="Delete this funnel"
                                                            >
                                                                {deletingId === funnel.id && deletingType === 'funnel' ? (
                                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {isEditing && editingFunnel?.id === funnel.id && (
                                                    <div className="mt-2 p-3 bg-gray-700 rounded-md">
                                                        <div className="text-xs text-white font-semibold mb-2">Frame Order:</div>
                                                        <div className="space-y-1 max-h-24 overflow-y-auto">
                                                            {dynamicForms.map((form, index) => (
                                                                <div key={form.id} className="flex items-center gap-2 bg-gray-600/50 p-1.5 rounded text-xs">
                                                                    <button
                                                                        onClick={() => moveFormUp(index)}
                                                                        disabled={index === 0}
                                                                        className="text-gray-400 hover:text-white disabled:opacity-30 w-4 h-4 flex items-center justify-center transition-colors"
                                                                        title="Move frame up"
                                                                    >
                                                                        ↑
                                                                    </button>
                                                                    <button
                                                                        onClick={() => moveFormDown(index)}
                                                                        disabled={index === dynamicForms.length - 1}
                                                                        className="text-gray-400 hover:text-white disabled:opacity-30 w-4 h-4 flex items-center justify-center transition-colors"
                                                                        title="Move frame down"
                                                                    >
                                                                        ↓
                                                                    </button>
                                                                    <span 
                                                                        className="flex-1 text-white cursor-pointer hover:text-yellow-300 transition-colors truncate"
                                                                        onClick={() => scrollToFrame(form.id)}
                                                                        title={`Frame ${index + 1} - Click to scroll`}
                                                                    >
                                                                        Frame {index + 1} {form.unique_id ? `(ID: #${form.unique_id})` : `(Temp ID: ${form.id})`}
                                                                    </span>
                                                                    
                                                                    {/* LinkedIn and Reddit Share Buttons with Loading States */}
                                                                    {form.unique_id && (
                                                                        <div className="flex gap-1">
                                                                            {auth?.linkedin_access_token && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleLinkedInFrameShare(form.unique_id);
                                                                                    }}
                                                                                    disabled={linkedinFrameLoading[form.unique_id]}
                                                                                    className="flex items-center gap-1 px-2 py-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-md transition-all duration-200 border border-blue-700/50 hover:border-blue-500/70 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                    title="Post this frame on LinkedIn"
                                                                                    data-tooltip-id="action-tooltip"
                                                                                    data-tooltip-content="Post this frame on LinkedIn"
                                                                                >
                                                                                    {linkedinFrameLoading[form.unique_id] ? (
                                                                                        <svg className="animate-spin h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                        </svg>
                                                                                    ) : (
                                                                                        <FontAwesomeIcon icon={faShare} className="h-3 w-3" />
                                                                                    )}
                                                                                    <span className="text-xs font-medium">
                                                                                        {linkedinFrameLoading[form.unique_id] ? 'Posting...' : 'LinkedIn'}
                                                                                    </span>
                                                                                </button>
                                                                            )}
                                                                            
                                                                            {auth?.reddit_token && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleRedditFrameShare(form.unique_id);
                                                                                    }}
                                                                                    disabled={redditFrameLoading[form.unique_id]}
                                                                                    className="flex items-center gap-1 px-2 py-1 text-orange-400 hover:text-orange-300 hover:bg-orange-900/30 rounded-md transition-all duration-200 border border-orange-700/50 hover:border-orange-500/70 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                    title="Share this frame on Reddit"
                                                                                    data-tooltip-id="action-tooltip"
                                                                                    data-tooltip-content="Share this frame on Reddit"
                                                                                >
                                                                                    {redditFrameLoading[form.unique_id] ? (
                                                                                        <svg className="animate-spin h-3 w-3 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                        </svg>
                                                                                    ) : (
                                                                                        <FontAwesomeIcon icon={faShare} className="h-3 w-3" />
                                                                                    )}
                                                                                    <span className="text-xs font-medium">
                                                                                        {redditFrameLoading[form.unique_id] ? 'Sharing...' : 'Reddit'}
                                                                                    </span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {hasMore && (
                                        <div className="flex justify-center mt-4">
                                            <button
                                                className="bg-black text-white border border-white px-8 py-2 rounded-md font-semibold hover:bg-white hover:text-black transition-colors"
                                                onClick={loadMore}
                                                disabled={isSubmitting}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Load more of your saved funnels"
                                            >
                                                {isSubmitting ? 'Loading...' : 'Load More'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 col-span-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-white">
                                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                                            Editing Funnel: {editingFunnel?.token}
                                        </h2>

                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                handleCreateNewFunnelClick();
                                            }}
                                            className="text-gray-400 hover:text-white transition-colors flex items-center"
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Cancel editing and create new"
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="mr-1" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <button
                                            className="flex bg-gradient-to-r from-yellow-600 to-yellow-500 text-black rounded-lg px-4 py-2 font-medium hover:shadow-lg hover:from-yellow-700 hover:to-yellow-600 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            onClick={handleUpdateFunnel}
                                            disabled={isSubmitting}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Save changes to this funnel"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                                                    Update Funnel
                                                </>
                                            )}
                                        </button>

                                        {renderPreviewButton()}
                                    </div>
                                    {errorMessage && (
                                        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 text-red-400 rounded-lg">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="bg-gray-900 rounded-xl shadow-2xl w-full border border-gray-700">
                                        <div className="p-6">
                                            <div className="space-y-5">
                                                <div className="flex justify-center items-center mb-4 gap-4">
                                                    <label className="flex items-center space-x-3 cursor-pointer" data-tooltip-id="form-tooltip" data-tooltip-content="Toggle Fly-Sign feature">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                id="flySignToggle"
                                                                className="sr-only peer"
                                                                checked={formData.flySign}
                                                                onChange={() => setFormData(prev => ({
                                                                    ...prev,
                                                                    flySign: !prev.flySign
                                                                }))}
                                                            />
                                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                                        </div>
                                                        <span className="text-white font-medium">Fly-Sign</span>
                                                    </label>

                                                    <label className="flex items-center space-x-3 cursor-pointer" data-tooltip-id="form-tooltip" data-tooltip-content="See More?">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                id="eyeTrackingToggle"
                                                                className="sr-only peer"
                                                                checked={formData.eyeTracking}
                                                                onChange={() => setFormData(prev => ({
                                                                    ...prev,
                                                                    eyeTracking: !prev.eyeTracking
                                                                }))}
                                                            />
                                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                                        </div>
                                                        <span className="text-2xl">👀</span>
                                                    </label>

                                                    <label className="flex items-center space-x-3 cursor-pointer" data-tooltip-id="form-tooltip" data-tooltip-content="Toggle Content Moderation">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                id="visibilityToggle"
                                                                className="sr-only peer"
                                                                checked={formData.visibility}
                                                                onChange={() => {
                                                                    const newVisibility = !formData.visibility;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        visibility: newVisibility
                                                                    }));
                                                                    
                                                                    if (!newVisibility) {
                                                                        setDynamicForms(prevForms => 
                                                                            prevForms.map(form => ({
                                                                                ...form,
                                                                                emojiMarker: form.emojiMarker === '0️⃣' ? '1️⃣' : form.emojiMarker
                                                                            }))
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                                        </div>
                                                        <span className="text-white font-medium">Content Moderation</span>
                                                    </label>
                                                </div>
                                                
                                                {formData.visibility && (
                                                    <div className="flex justify-center items-center mb-4 gap-4">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-white font-medium">Auto Approve Time</span>
                                                            <div data-tooltip-id="form-tooltip" data-tooltip-content="Set automatic approval time for submissions">
                                                                <input
                                                                    type="time"
                                                                    onChange={(e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        autoApproveTime: e.target.value
                                                                    }))}
                                                                    value={formData.autoApproveTime ? formData.autoApproveTime.substring(0, 5) : ''}
                                                                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[130px] p-2"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                            <span className="text-gray-400 text-sm">(HH:MM)</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-6 mb-6">
                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-medium text-yellow-400/90">
                                                            Frame Color
                                                            <span className="ml-1 text-xs text-gray-400">(click to change)</span>
                                                        </label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative" data-tooltip-id="form-tooltip" data-tooltip-content="Choose the color for the frames">
                                                                <div 
                                                                    className="w-12 h-12 rounded-lg border-2 border-gray-600/50 shadow-lg cursor-pointer transition-all hover:border-yellow-400/50 hover:scale-105"
                                                                    style={{ 
                                                                        backgroundColor: formData.color,
                                                                        boxShadow: `0 0 12px ${formData.color}40`
                                                                    }}
                                                                >
                                                                    <input 
                                                                        type="color" 
                                                                        name="framecolor" 
                                                                        value={formData.color} 
                                                                        onChange={handleFrameColorChange}
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-mono text-white bg-gray-800/80 px-3 py-2 rounded-lg border border-gray-700 truncate">
                                                                    {formData.color.toUpperCase()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-medium text-yellow-400/90">
                                                            Frame Transparency
                                                        </label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 relative" data-tooltip-id="form-tooltip" data-tooltip-content="Adjust the transparency of the frames">
                                                                <input
                                                                    type="range"
                                                                    min="0"
                                                                    max="100"
                                                                    value={transparency}
                                                                    onChange={(e) => {
                                                                        const value = parseInt(e.target.value);
                                                                        setTransparency(value);
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            transparency: value
                                                                        }));
                                                                    }}
                                                                    className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer 
                                                                            [&::-webkit-slider-thumb]:appearance-none 
                                                                            [&::-webkit-slider-thumb]:h-4 
                                                                            [&::-webkit-slider-thumb]:w-4 
                                                                            [&::-webkit-slider-thumb]:rounded-full 
                                                                            [&::-webkit-slider-thumb]:bg-yellow-400
                                                                            [&::-webkit-slider-thumb]:shadow-md
                                                                            [&::-webkit-slider-thumb]:border
                                                                            [&::-webkit-slider-thumb]:border-yellow-200/50
                                                                            [&::-webkit-slider-thumb]:transition-all
                                                                            [&::-webkit-slider-thumb]:hover:scale-125
                                                                            [&::-webkit-slider-runnable-track]:bg-gradient-to-r 
                                                                            [&::-webkit-slider-runnable-track]:from-gray-700 
                                                                            [&::-webkit-slider-runnable-track]:to-gray-500"
                                                                />
                                                                <div className="absolute top-0 left-0 right-0 h-2 rounded-full pointer-events-none overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-gradient-to-r from-yellow-400/30 to-yellow-400/70"
                                                                        style={{ width: `${transparency}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="w-14 text-center text-sm font-medium text-white bg-gray-800/80 px-2 py-1.5 rounded-lg border border-gray-700 shadow-inner">
                                                                {transparency}%
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                                                            <span>0%</span>
                                                            <span>50%</span>
                                                            <span>100%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-center items-center mb-4 gap-4">
                                                    <div className="group relative">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-yellow-400 font-medium text-sm whitespace-nowrap">Seo Tag:</span>
                                                        </div>
                                                        <div className="relative" data-tooltip-id="form-tooltip" data-tooltip-content="Add an SEO tag for better discoverability">
                                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                                <span className="text-gray-500 font-medium h-full flex items-center">#</span>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter SEO tag, e.g. Marketing"
                                                                className="w-full h-10 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                                                                value={formData.seoTag}
                                                                onChange={(e) => setFormData(prev => ({
                                                                    ...prev,
                                                                    seoTag: e.target.value
                                                                }))}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-yellow-400/90">View:</label>
                                                        <select 
                                                            className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="Choose a pre-defined layout for your themes"
                                                            value={formData.designView}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                designView: e.target.value
                                                            }))}
                                                        >
                                                            <option value="A">A: Design View</option>
                                                            <option value="B">B: Tile View</option>
                                                            <option value="C">C: Theme Only</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-yellow-400/90">Display View:</label>
                                                        <select 
                                                            className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                            data-tooltip-id="ezui-tooltip"
                                                            data-tooltip-content="Choose a pre-defined layout for your themes"
                                                            value={formData.displaymode}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                displaymode: e.target.value
                                                            }))}
                                                        >
                                                            <option value="dressed">EZ View</option>
                                                            <option value="naked">HYBRID View</option>
                                                            <option value="ai">AI View</option>
                                                        </select>
                                                    </div>
                                                    <div className="relative max-w-sm">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-yellow-400 font-medium text-sm whitespace-nowrap">Select Themes:</span>
                                                        </div>

                                                        {/* Selected Themes List */}
                                                        <div className="mb-3 space-y-2 max-h-48 overflow-y-auto pr-2">
                                                          {formData.theme.length > 0 ? (
                                                            formData.theme.map((themeId, index) => {
                                                              const allThemes = [
                                                                ...templates.userTemplates,
                                                                ...templates.defaultTemplates,
                                                                ...templates.themecollections
                                                              ];
                                                              
                                                              const theme = allThemes.find(t => 
                                                                t.id?.toString() === themeId || 
                                                                t.unique_id === themeId
                                                              );
                                                              
                                                              if (!theme) return null;

                                                              // Dynamic background color based on source
                                                              const isCollection = templates.themecollections.some(t => t.id?.toString() === themeId || t.unique_id === themeId);
                                                              const isUserTemplate = templates.userTemplates.some(t => t.id?.toString() === themeId || t.unique_id === themeId);
                                                              
                                                              let bgClass = "bg-gray-700 hover:bg-gray-700/80"; // Default
                                                              if (isCollection) bgClass = "bg-purple-800/60 hover:bg-purple-800/80 border border-purple-500/30";
                                                              if (isUserTemplate) bgClass = "bg-blue-800/60 hover:bg-blue-800/80 border border-blue-500/30";

                                                              return (
                                                                <div 
                                                                  key={`${themeId}-${index}`} 
                                                                  className={`flex items-center gap-2 p-2 rounded transition-colors ${bgClass}`}
                                                                >
                                                                  <button
                                                                    onClick={() => moveThemeUp(index)}
                                                                    disabled={index === 0}
                                                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded bg-gray-600 hover:bg-gray-500"
                                                                    title="Move up"
                                                                  >
                                                                    ↑
                                                                  </button>
                                                                  <button
                                                                    onClick={() => moveThemeDown(index)}
                                                                    disabled={index === formData.theme.length - 1}
                                                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded bg-gray-600 hover:bg-gray-500"
                                                                    title="Move down"
                                                                  >
                                                                    ↓
                                                                  </button>
                                                                  <span className="flex-1 text-white text-sm truncate">
                                                                    <span className={`font-mono text-xs mr-2 ${isCollection ? 'text-purple-300' : isUserTemplate ? 'text-blue-300' : 'text-gray-400'}`}>
                                                                      {theme.unique_id || theme.id}
                                                                    </span>
                                                                    {theme.title || 'Untitled Theme'}
                                                                  </span>
                                                                  <button
                                                                    onClick={() => toggleThemeSelection(themeId)}
                                                                    className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                                                                    title="Remove theme"
                                                                  >
                                                                    ×
                                                                  </button>
                                                                </div>
                                                              );
                                                            })
                                                          ) : (
                                                            <div className="text-center py-4 border-2 border-dashed border-gray-700 rounded-lg">
                                                              <FontAwesomeIcon icon={faLayerGroup} className="text-gray-500 text-2xl mb-2" />
                                                              <p className="text-gray-400 text-sm">No themes selected</p>
                                                            </div>
                                                          )}
                                                        </div>

                                                        {/* Add Theme Dropdown */}
                                                        <div className="relative" data-tooltip-id="form-tooltip" data-tooltip-content="Select and order themes for your funnel">
                                                          <select
                                                              className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent h-10 appearance-none"
                                                              onChange={(e) => {
                                                                const themeId = e.target.value;
                                                                if (themeId && !formData.theme.includes(themeId)) {
                                                                  setFormData(prev => ({
                                                                    ...prev,
                                                                    theme: [...prev.theme, themeId]
                                                                  }));
                                                                }
                                                                e.target.value = '';
                                                              }}
                                                              value=""
                                                              style={{
                                                                backgroundImage: 'none'
                                                              }}
                                                            >
                                                              <option value="">Add a theme...</option>
                                                              
                                                              {/* Theme Collections - Purple Theme */}
                                                              {templates.themecollections.length > 0 && (
                                                                <optgroup 
                                                                  label="My Collections"
                                                                  className="bg-purple-800/60 text-purple-100 border-b border-purple-500/30"
                                                                >
                                                                  {templates.themecollections.map(template => (
                                                                    <option
                                                                      key={`collection-${template.id}`}
                                                                      value={template.id?.toString() || template.unique_id}
                                                                      disabled={formData.theme.includes(template.id?.toString() || template.unique_id)}
                                                                      className="bg-purple-800/60 hover:bg-purple-800/80 text-white"
                                                                    >
                                                                      {template.unique_id} {template.title} (Collection)
                                                                    </option>
                                                                  ))}
                                                                </optgroup>
                                                              )}
                                                              
                                                              {/* User Templates - Blue Theme */}
                                                              {templates.userTemplates.length > 0 && (
                                                                <optgroup 
                                                                  label="My Templates"
                                                                  className="bg-blue-800/60 text-blue-100 border-b border-blue-500/30"
                                                                >
                                                                  {templates.userTemplates.map(template => (
                                                                    <option
                                                                      key={`user-${template.id}`}
                                                                      value={template.id?.toString() || template.unique_id}
                                                                      disabled={formData.theme.includes(template.id?.toString() || template.unique_id)}
                                                                      className="bg-blue-800/60 hover:bg-blue-800/80 text-white"
                                                                    >
                                                                      {template.unique_id} {template.title}
                                                                    </option>
                                                                  ))}
                                                                </optgroup>
                                                              )}
                                                              
                                                              {/* Default Templates - Gray Theme */}
                                                              {templates.defaultTemplates.length > 0 && (
                                                                <optgroup 
                                                                  label="Default Templates"
                                                                  className="bg-gray-700 text-gray-100 border-b border-gray-500/30"
                                                                >
                                                                  {templates.defaultTemplates.map(template => (
                                                                    <option
                                                                      key={`default-${template.id}`}
                                                                      value={template.id?.toString() || template.unique_id}
                                                                      disabled={formData.theme.includes(template.id?.toString() || template.unique_id)}
                                                                      className="bg-gray-700 hover:bg-gray-700/80 text-white"
                                                                    >
                                                                      {template.unique_id} {template.title}
                                                                    </option>
                                                                  ))}
                                                                </optgroup>
                                                              )}
                                                              
                                                              {/* Empty State */}
                                                              {templates.userTemplates.length === 0 && 
                                                               templates.defaultTemplates.length === 0 && 
                                                               templates.themecollections.length === 0 && (
                                                                <option disabled className="text-gray-400 bg-gray-700">
                                                                  No themes available
                                                                </option>
                                                              )}
                                                            </select>
                                                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                          </div>
                                                        </div>
                                                    </div>
                                                </div>                                                
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 rounded-lg px-4 py-2 flex items-center gap-2 justify-center font-medium hover:shadow-lg hover:from-yellow-400 hover:to-yellow-300 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        type="button"
                                        onClick={() => addDynamicForm('top')}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Add a new frame at the beginning"
                                    >
                                        <FontAwesomeIcon icon={faPlusCircle} className="text-lg" />
                                        Add to the Top
                                    </button>
                                    <div className="space-y-4">
                                        {dynamicForms.map((form, index) => (
                                            <FormItem
                                                key={form.id}
                                                index={index}
                                                form={form}
                                                updateForm={updateForm}
                                                removeForm={removeForm}
                                                activePins={activePins}
                                                setActivePins={setActivePins}
                                                moveFormUp={moveFormUp}
                                                moveFormDown={moveFormDown}
                                                isFirst={index === 0}
                                                isLast={index === dynamicForms.length - 1}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 rounded-lg px-4 py-2 flex items-center gap-2 justify-center font-medium hover:shadow-lg hover:from-yellow-400 hover:to-yellow-300 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        type="button"
                                        onClick={() => addDynamicForm('bottom')}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Add a new frame at the end"
                                    >
                                        <FontAwesomeIcon icon={faPlusCircle} className="text-lg" />
                                        Add at the End
                                    </button>
                                    {successMessage && (
                                        <div className="mb-4 p-4 bg-green-900/80 border border-green-700/80 text-green-200 rounded-lg">
                                            {successMessage}
                                            <button
                                                onClick={() => setSuccessMessage('')}
                                                className="float-right font-bold text-green-400 hover:text-green-200"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    )}
                                    {errorMessage && (
                                        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 text-red-400 rounded-lg">
                                            {errorMessage}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <button
                                            className="flex bg-gradient-to-r from-yellow-600 to-yellow-500 text-black rounded-lg px-4 py-2 font-medium hover:shadow-lg hover:from-yellow-700 hover:to-yellow-600 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            onClick={handleUpdateFunnel}
                                            disabled={isSubmitting}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Save changes"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                                                    Update Funnel
                                                </>
                                            )}
                                        </button>

                                        {renderPreviewButton()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-4 sticky top-4 self-start h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <button
                                            className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg px-4 py-2 font-medium hover:shadow-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-red-400"
                                            type="button"
                                            onClick={handleCreateNewFunnelClick}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Start a new funnel from scratch"
                                        >
                                            CREATE NEW EZ FUNNEL
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Search by token"
                                            className="flex-grow bg-white text-gray-900 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-0"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            data-tooltip-id="form-tooltip"
                                            data-tooltip-content="Search by funnel token"
                                        />

                                        <div className="flex items-center">
                                            <button
                                                className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-l-md border-r transition-colors ${
                                                    searchType === 'fuzzy'
                                                        ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                                                        : 'bg-gray-600 text-gray-300 border-gray-700 hover:bg-gray-700'
                                                }`}
                                                onClick={() => {
                                                    setSearchType('fuzzy');
                                                    handleSearch();
                                                }}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Use fuzzy (approximate) search"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 0 11-16 0 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Fuzzy
                                            </button>
                                            <button
                                                className={`font-semibold px-3 py-2 flex items-center gap-1.5 whitespace-nowrap rounded-r-md transition-colors ${
                                                    searchType === 'exact'
                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                                                }`}
                                                onClick={() => {
                                                    setSearchType('exact');
                                                    handleSearch();
                                                }}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Use exact match search"
                                            >
                                                <span className="text-sm">🏀</span>
                                                Exact
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {funnels.map((funnel) => (
                                            <div key={funnel.id} className="flex flex-col md:flex-row items-start md:items-center p-4 gap-3 bg-[#5d0f6e] rounded-lg">
                                                <div className="flex flex-col items-center justify-center flex-shrink-0">
                                                    <span className="text-4xl select-none">
                                                        🍀
                                                    </span>
                                                    <span className="text-xs text-white font-semibold mt-1 bg-black/20 px-2 py-0.5 rounded">
                                                        Frames: {funnel.fields.length}
                                                    </span>
                                                </div>
                                                <div className="flex-grow min-w-0 w-full md:w-auto">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <a 
                                                                href={`https://ez.wiki/${encodeURIComponent(funnel.token)}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors break-all"
                                                            >
                                                                https://ez.wiki/{funnel.token}
                                                            </a>
                                                            <span className="text-purple-300 text-sm whitespace-nowrap">
                                                                {formatDate(funnel.created_at)}
                                                            </span>
                                                        </div>

                                                        {/* Display AI Search History Slug if aiid exists */}
                                                        {funnel.ai_search_history && (
                                                            <div className="flex flex-wrap items-center gap-2 bg-blue-900/30 p-2 rounded cursor-pointer hover:bg-blue-800/50 transition-colors" onClick={() => {
                                                                window.open(`https://ez.wiki/X/${funnel.ai_search_history.slug}`, '_blank');
                                                            }}>
                                                                <a 
                                                                    href={`https://ez.wiki/X/${encodeURIComponent(funnel.ai_search_history.slug)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-300 font-semibold hover:text-blue-200 transition-colors break-all"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    https://ez.wiki/X/{funnel.ai_search_history.slug}
                                                                </a>
                                                            </div>
                                                        )}

                                                        {funnel.handle_domains?.map((domain) => (
                                                            <div key={domain.id} className="flex flex-wrap items-center gap-2 bg-purple-900/30 p-2 rounded">
                                                                <a
                                                                    href={`https://${domain.domain}.${domain.domainselected}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors break-all flex-grow"
                                                                >
                                                                    https://{domain.domain}.{domain.domainselected}
                                                                </a>
                                                                <button
                                                                    onClick={() => handleDeleteHandleDomain(domain.id, domain.domain, domain.domainselected)}
                                                                    disabled={deletingId === domain.id && deletingType === 'handleDomain'}
                                                                    className="bg-red-600 text-white font-bold py-1 px-2 rounded-md text-sm hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-[2rem]"
                                                                    data-tooltip-id="action-tooltip" data-tooltip-content="Delete handle domain"
                                                                >
                                                                    {deletingId === domain.id && deletingType === 'handleDomain' ? (
                                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {funnel.custom_domains?.map((domain) => (
                                                            <div key={domain.id} className="flex flex-wrap items-center gap-2 bg-purple-900/30 p-2 rounded">
                                                                <a
                                                                    href={`https://{domain.domainselected}/${domain.domain}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors break-all flex-grow"
                                                                >
                                                                    https://{domain.domainselected}/{domain.domain}
                                                                </a>
                                                                <button
                                                                    onClick={() => handleDeleteCustomDomain(domain.id, domain.domain, domain.domainselected)}
                                                                    disabled={deletingId === domain.id && deletingType === 'customDomain'}
                                                                    className="bg-red-600 text-white font-bold py-1 px-2 rounded-md text-sm hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-[2rem]"
                                                                    data-tooltip-id="action-tooltip" data-tooltip-content="Delete custom domain"
                                                                >
                                                                    {deletingId === domain.id && deletingType === 'customDomain' ? (
                                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col gap-2 ml-auto flex-shrink-0">
                                                    <button
                                                        className="bg-yellow-400 text-black font-bold py-1 px-3 md:px-5 rounded-md text-sm hover:bg-yellow-500 transition-colors whitespace-nowrap"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleEditClick(funnel);
                                                        }}
                                                        data-tooltip-id="action-tooltip" data-tooltip-content="Edit this funnel"
                                                    >
                                                        Edit
                                                    </button>
                                                    
                                                    {auth?.linkedin_access_token && (
                                                        <>
                                                            <button
                                                                className="bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleLinkedInPost(funnel);
                                                                }}
                                                                disabled={isSubmittingLinkedIn}
                                                                data-tooltip-id="action-tooltip" 
                                                                data-tooltip-content="Post this funnel on LinkedIn"
                                                            >
                                                                {isSubmittingLinkedIn ? (
                                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <>
                                                                        <FontAwesomeIcon icon={faShare} className="h-3 w-3" />
                                                                        LinkedIn
                                                                    </>
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                    {auth?.reddit_token && (     
                                                        <>
                                                            <button
                                                                className="bg-orange-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-orange-700 transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleRedditShare(funnel);
                                                                }}
                                                                disabled={isSubmittingReddit}
                                                                data-tooltip-id="action-tooltip" 
                                                                data-tooltip-content="Share this funnel on Reddit"
                                                            >
                                                                {isSubmittingReddit ? (
                                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                ) : (
                                                                    <>
                                                                        <FontAwesomeIcon icon={faShare} className="h-3 w-3" />
                                                                        Reddit
                                                                    </>
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {(funnel.handle_domains?.length === 0 && funnel.custom_domains?.length === 0) && (
                                                        <button
                                                            onClick={() => handleDeleteFunnel(funnel.id, funnel.token)}
                                                            disabled={deletingId === funnel.id && deletingType === 'funnel'}
                                                            className="bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center"
                                                            data-tooltip-id="action-tooltip" data-tooltip-content="Delete this funnel"
                                                        >
                                                            {deletingId === funnel.id && deletingType === 'funnel' ? (
                                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {hasMore && (
                                        <div className="flex justify-center mt-4">
                                            <button
                                                className="bg-black text-white border border-white px-8 py-2 rounded-md font-semibold hover:bg-white hover:text-black transition-colors"
                                                onClick={loadMore}
                                                disabled={isSubmitting}
                                                data-tooltip-id="action-tooltip"
                                                data-tooltip-content="Load more funnels"
                                            >
                                                {isSubmitting ? 'Loading...' : 'Load More'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 col-span-2">
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <button
                                            className="bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:shadow-lg hover:from-pink-700 hover:to-rose-600 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                            type="button"
                                            onClick={async (e) => {
                                                const isImportClick = e.target === e.currentTarget.lastElementChild || 
                                                                e.target === e.currentTarget.lastElementChild?.firstElementChild;
                                                
                                                if (isImportClick) {
                                                    setShowImportModal(true);
                                                } else {
                                                    await loadDemoData();
                                                }
                                            }}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Load a demo or import from a URL"
                                        >
                                            <span className="font-medium">EZ Funnel</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-400"></div>
                                            </label>
                                            <span className="font-medium">EZ Import</span>
                                        </button>

                                        {renderPreviewButton()}

                                        <button
                                            className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg px-4 py-2 font-medium hover:shadow-lg hover:from-red-700 hover:to-red-600 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-red-400"
                                            type="button"
                                            onClick={() => setShowInstantCreateModal(true)}
                                            data-tooltip-id="action-tooltip"
                                            data-tooltip-content="Quickly create and save your funnel"
                                        >
                                            Instant Create
                                        </button>
                                    </div>

                                    <button
                                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 rounded-lg px-4 py-2 flex items-center gap-2 justify-center font-medium hover:shadow-lg hover:from-yellow-400 hover:to-yellow-300 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        type="button"
                                        onClick={() => addDynamicForm('top')}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Add a new frame at the beginning"
                                    >
                                        <FontAwesomeIcon icon={faPlusCircle} className="text-lg" />
                                        Add to the Top
                                    </button>
                                    <div className="space-y-4">
                                        {dynamicForms.map((form, index) => (
                                            <FormItem
                                                key={form.id}
                                                index={index}
                                                form={form}
                                                updateForm={updateForm}
                                                removeForm={removeForm}
                                                activePins={activePins}
                                                setActivePins={setActivePins}
                                                moveFormUp={moveFormUp}
                                                moveFormDown={moveFormDown}
                                                isFirst={index === 0}
                                                isLast={index === dynamicForms.length - 1}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 rounded-lg px-4 py-2 flex items-center gap-2 justify-center font-medium hover:shadow-lg hover:from-yellow-400 hover:to-yellow-300 transition-all duration-200 h-10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        type="button"
                                        onClick={() => addDynamicForm('bottom')}
                                        data-tooltip-id="action-tooltip"
                                        data-tooltip-content="Add a new frame at the end"
                                    >
                                        <FontAwesomeIcon icon={faPlusCircle} className="text-lg" />
                                        Add at the End
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}