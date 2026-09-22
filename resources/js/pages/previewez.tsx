import { useState, useEffect, useRef, useCallback, useMemo, memo, PropsWithChildren } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import '@google/model-viewer';
import EffectsDisplay from '@/components/EffectsDisplay';
import FlyingSaucer from '@/components/FlyingSaucer';
import UserBalanceDisplay from '@/components/UserBalanceDisplay';
import Chatbot from "@/components/Chatbot";
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faQrcode, 
  faPlus, 
  faCheckCircle, 
  faExclamationTriangle, 
  faTimes, 
  faCoins, 
  faMinus, 
  faSearch, 
  faLayerGroup, 
  faArrowUp, 
  faArrowDown, 
  faFilePdf, 
  faFillDrip, 
  faFont, 
  faTable, 
  faBolt, 
  faEyedropper,
  faMusic
} from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faFacebook, faLinkedin, faTumblr, faPinterest, faReddit, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faClock, faEye, faThumbsUp, faComment, faHeart, faBookmark } from '@fortawesome/free-regular-svg-icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import EmailVerification from '@/components/EmailVerification';
import MarketplaceListings from '@/components/MarketplaceListings';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Masonry from 'react-masonry-css';
import TermsAndConditionsContent from '@/components/TermsAndConditionsContent';
import PrivacyPolicyContent from '@/components/PrivacyPolicyContent';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import MDEditor, { commands, ICommand, TextState, TextAreaTextApi } from '@uiw/react-md-editor';
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-md-editor/markdown-editor.css";
import MarkdownPreview from '@uiw/react-markdown-preview';

declare global {
  interface Window {
    RedditEmbed?: {
      init: () => void;
    };
  }
}

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
      const existingModal = document.getElementById('color-picker-modal');
      if (existingModal) {
        document.body.removeChild(existingModal);
      }

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

      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#2d3748';
      modalContent.style.padding = '24px';
      modalContent.style.borderRadius = '16px';
      modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
      modalContent.style.width = '90%';
      modalContent.style.maxWidth = '420px';
      modalContent.style.border = '1px solid #4a5568';

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

      modalContent.appendChild(header);
      modalContent.appendChild(colorGrid);
      modalContent.appendChild(customColorContainer);
      colorPickerModal.appendChild(modalContent);

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

        const configContainer = document.createElement('div');
        configContainer.style.marginBottom = '20px';

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
                tableMarkdown += '|';
                for (let i = 0; i < cols; i++) {
                    tableMarkdown += ` Header ${i + 1} |`;
                }
                tableMarkdown += '\n|';

                for (let i = 0; i < cols; i++) {
                    tableMarkdown += '----------|';
                }
                tableMarkdown += '\n';
            }

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

        modalContent.appendChild(header);
        modalContent.appendChild(configContainer);
        modalContent.appendChild(generateButton);
        tableModal.appendChild(modalContent);

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

        modalContent.appendChild(header);
        modalContent.appendChild(macrosGrid);
        modalContent.appendChild(customMacroContainer);
        macrosModal.appendChild(modalContent);

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

// Enhanced MDEditor with color commands
const EnhancedMDEditor = ({ value, onChange }: { value?: string; onChange: (value?: string) => void }) => {
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

  return (
    <div className="enhanced-md-editor">
      <MDEditor
        value={value}
        onChange={onChange}
        commands={customCommands}
      />
      <Tooltip id="mdeditor-tooltip" />
    </div>
  );
};

interface ModalProps {
  show: boolean;
  onClose: () => void;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

type DomainItem = {
    id: number;
    domain: string;
    domainselected: string;
    type: 'CUSTOM' | 'DOMAIN';
    hashtag?: string;
    email?: string;
    sells?: {
        price: number | string;
        created_at?: string;
    }[];
    user?: {
        id: number;
        email: string;
    };
};

type Filters = {
    min_price?: number;
    max_price?: number;
    search?: string;
};

type Pagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type AuthData = {
    user?: {
        id: number;
        name: string;
        email: string;
        bee_points_balance?: string;
    };
};

const FixedModal = ({ show, onClose, children, ariaLabelledby, ariaDescribedby }: PropsWithChildren<ModalProps>) => {
  if (!show) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('target' in e && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-opacity-60 z-50 flex justify-center items-center overflow-y-auto"
      onClick={handleBackdropClick}
      onTouchEnd={handleBackdropClick}
      data-tooltip-id="main-tooltip"
      data-tooltip-content="Click outside the modal to close"
    >
      {children}
    </div>
  );
};

interface EmailVerificationProps {
  onVerificationComplete: () => void;
  onOpenBox?: () => void;
  funnel?: any;
}

const LockedContentWrapper = ({ onVerificationComplete, onOpenBox, funnel }: EmailVerificationProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center touch-manipulation">
      <EmailVerification
        onVerificationComplete={onVerificationComplete}
        onOpenBox={onOpenBox}
        funnel={funnel}
      />
    </div>
  );
};

const ResizableContent = memo(({
  content,
  onEyeClick,
  index,
  mode,
  color = '#ffffff',
  transparency = '80',
  funnel,
  onResizeStart,
  onResize,
  onResizeStop
}: {
  content: any,
  onEyeClick: (content: string | null) => void,
  index: number,
  mode: string,
  color?: string,
  transparency?: string,
  funnel?: any,
  onResizeStart?: () => void,
  onResize?: (event: MouseEvent | TouchEvent, direction: any, ref: HTMLDivElement, delta: { width: number, height: number }) => void,
  onResizeStop?: () => void
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (content.emoji_marker === '🔐') {
      setShowEmailVerification(true);
    }
  }, [content.emoji_marker]);

  if (content.emoji_marker === '0️⃣') {
    return null;
  }

  const getPositionClass = () => {
    if (!mode) return '';
    const modePattern = mode.split(',');
    const positionIndex = index % modePattern.length;
    const position = modePattern[positionIndex];
    switch(position) {
      case 'L': return 'self-start ml-5 mr-auto';
      case 'C': return 'self-center mx-auto';
      case 'R': return 'self-end ml-auto mr-5';
      default: return '';
    }
  };

  const hexToRgba = (hex: string, alpha: string) => {
    const fullHex = hex.length === 4 ?
      `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;

    const r = parseInt(fullHex.slice(1, 3), 16);
    const g = parseInt(fullHex.slice(3, 5), 16);
    const b = parseInt(fullHex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${parseInt(alpha) / 100})`;
  };

  const backgroundColor = hexToRgba(color, transparency);

  const handleVerificationComplete = () => {
    setIsVerified(true);
    setShowEmailVerification(false);
  };

  const handleOpenBox = () => {
    setShowContent(true);
  };

  const formatRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;

    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;

    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;

    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;

    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;

    return `${Math.floor(seconds)}s`;
  };

  const isPDF = content.image_url && content.image_url.toLowerCase().endsWith('.pdf');
  const isImage = content.image_url && !isPDF;
  const isAudio = content.image_url && /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(content.image_url);
  const isVideo = content.image_url && /\.(mp4|webm|mov|avi|mkv|flv|wmv)$/i.test(content.image_url);
  const isHTML = content.image_url && /\.(html|htm)$/i.test(content.image_url);

  return (
    <Resizable
      defaultSize={{
        width: content.width,
        height: 'auto',
      }}
      minWidth={100}
      minHeight={50}
      maxHeight={888}
      bounds="parent"
      enable={{
        top: false,
        right: false,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false
      }}
      handleComponent={{
        bottomRight: <div className="w-full h-full flex items-end justify-end pr-3.5 pb-3.5 touch-manipulation" data-tooltip-id="content-tooltip" data-tooltip-content="Drag to resize">
                        <span className="text-4xl font-bold text-white z-10 cursor-se-resize touch-manipulation"><img src="resize.png" alt="resize icon" /></span>
                     </div>,
      }}
      handleStyles={{
        bottomRight: {
          width: '48px',
          height: '48px',
        }
      }}
      onResizeStart={onResizeStart}
      onResize={onResize}
      onResizeStop={onResizeStop}
      className={`relative m-5 overflow-hidden touch-manipulation resizable-content ${getPositionClass()}`}
    >
      <div
        className="p-4 justify-center rounded-lg shadow relative w-full h-full flex flex-col items-center justify-center overflow-hidden touch-manipulation"
        style={{ backgroundColor, maxHeight: '888px' }}
      >
        <div 
          className="w-full h-full overflow-y-auto"
          style={{ maxHeight: '888px' }}
        >
          {content.pinned === 1 && (
            <div className="absolute top-2 left-2 z-50" data-tooltip-id="content-tooltip" data-tooltip-content="Pinned Content">
              📌
            </div>
          )}
          <div
            className="absolute top-2 right-2 z-50 cursor-pointer hidden touch-manipulation"
            onClick={() => onEyeClick(content.url || null)}
            onTouchEnd={(e) => {
              e.preventDefault();
              onEyeClick(content.url || null);
            }}
            data-tooltip-id="content-tooltip"
            data-tooltip-content="View content details"
          >
            👁️
          </div>

          {showEmailVerification && !isVerified ? (
            <LockedContentWrapper
              onVerificationComplete={handleVerificationComplete}
              onOpenBox={handleOpenBox}
              funnel={funnel}
            />
          ) : (
            <>
              {(showContent || !showEmailVerification) && content.user && content.created_at && content.post_type === 'visitor' && (
                <div className="flex items-start space-x-3 mb-4 w-full max-w-full touch-manipulation">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full blur-sm opacity-60"></div>
                    <img
                      className="relative w-8 h-8 rounded-full object-cover border border-gray-600 shadow-sm"
                      src={content.user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(content.user.name || content.user.email)}&color=FFFFFF&background=0D9488&bold=true`}
                      alt={content.user.email || 'User Avatar'}
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white text-sm truncate">
                        {content.user.email ? (
                          <>
                            {content.user.email.substring(0, 2)}
                            {'*'.repeat(3)}
                            {'@'}
                            {'*'.repeat(3)}
                            {content.user.email.split('@')[1]?.substring(content.user.email.split('@')[1].length - 3)}
                          </>
                        ) : (
                          'Anonymous User'
                        )}
                      </span>
                      {content.user.is_verified && (
                        <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-blue-500/20 rounded-full border border-blue-500/30">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="w-2.5 h-2.5 text-blue-400"
                            aria-label="Verified account"
                          />
                          <span className="text-xs text-blue-300 font-medium">Verified</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      <div className="flex items-center space-x-1 text-gray-400 bg-gray-800/30 px-2 py-1 rounded-full">
                        <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5 text-teal-400" />
                        <span className="text-gray-300 font-medium">{formatRelativeTime(content.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(showContent || !showEmailVerification) && content.title && (
                <MarkdownPreview source={content.title} data-color-mode="dark" className="w-full touch-manipulation overflow-hidden text-white" />
              )}
              {(showContent || !showEmailVerification) && content.reference && (
                <MarkdownPreview source={content.reference} data-color-mode="dark" className="w-full touch-manipulation overflow-hidden text-white" />
              )}
              {(showContent || !showEmailVerification) && content.url && (
                <div className="w-full touch-manipulation overflow-hidden dark-markdown-container">
                  {(() => {
                    const cleanContent = content.url.trim();
                    
                    const hasFullHtmlTags = /<[^>]+>.*<\/[^>]+>/.test(cleanContent);
                    const hasSelfClosingTags = /<[^>/]+\/>/.test(cleanContent);
                    const hasHtmlTags = hasFullHtmlTags || hasSelfClosingTags;
                    
                    const hasMarkdownHeaders = /^#+\s/.test(cleanContent);
                    const hasMarkdownBold = /\*\*.+\*\*/.test(cleanContent);
                    const hasMarkdownLinks = /\[.+\]\(.+\)/.test(cleanContent);
                    const hasMarkdownLists = /^[-*]\s/.test(cleanContent) || /^\d+\.\s/.test(cleanContent);
                    const isMarkdown = hasMarkdownHeaders || hasMarkdownBold || hasMarkdownLinks || hasMarkdownLists;
                    
                    const isUrl = /^https?:\/\/[^\s]+$/.test(cleanContent);
                    
                    if (hasHtmlTags) {
                      return (
                        <div 
                          className="w-full"
                          dangerouslySetInnerHTML={{ __html: cleanContent }}
                        />
                      );
                    } else if (isMarkdown) {
                      return (
                        <div className="w-full dark-markdown-preview-wrapper">
                          <MarkdownPreview
                            source={cleanContent}
                            data-color-mode="dark"
                            className="w-full dark-markdown-preview"
                            style={{ 
                              background: 'transparent', 
                              color: 'white',
                              fontFamily: 'inherit'
                            }}
                          />
                          <style>{`
                            .dark-markdown-preview-wrapper .wmde-markdown {
                              background-color: transparent !important;
                              color: white !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown table {
                              border: 1px solid #4a5568 !important;
                              background-color: #2d3748 !important;
                              color: white !important;
                              border-collapse: collapse !important;
                              width: 100% !important;
                              margin: 1rem 0 !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown th {
                              background-color: #4a5568 !important;
                              color: white !important;
                              border: 1px solid #718096 !important;
                              padding: 8px 12px !important;
                              font-weight: bold !important;
                              text-align: left !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown td {
                              background-color: #2d3748 !important;
                              color: white !important;
                              border: 1px solid #4a5568 !important;
                              padding: 8px 12px !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown tr:nth-child(even) {
                              background-color: #374151 !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown tr:hover {
                              background-color: #4b5563 !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown code {
                              background-color: #1f2937 !important;
                              color: #e5e7eb !important;
                              border: 1px solid #4b5563 !important;
                              border-radius: 4px !important;
                              padding: 2px 6px !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown pre {
                              background-color: #1f2937 !important;
                              color: #e5e7eb !important;
                              border: 1px solid #4b5563 !important;
                              border-radius: 6px !important;
                              padding: 1rem !important;
                              overflow: auto !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown pre code {
                              background-color: transparent !important;
                              border: none !important;
                              padding: 0 !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown blockquote {
                              border-left: 4px solid #4a5568 !important;
                              background-color: #2d3748 !important;
                              color: #cbd5e0 !important;
                              padding: 0.5rem 1rem !important;
                              margin: 1rem 0 !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown h1,
                            .dark-markdown-preview-wrapper .wmde-markdown h2,
                            .dark-markdown-preview-wrapper .wmde-markdown h3,
                            .dark-markdown-preview-wrapper .wmde-markdown h4,
                            .dark-markdown-preview-wrapper .wmde-markdown h5,
                            .dark-markdown-preview-wrapper .wmde-markdown h6 {
                              color: white !important;
                              border-bottom: 1px solid #4a5568 !important;
                              padding-bottom: 0.3rem !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown a {
                              color: #60a5fa !important;
                              text-decoration: none !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown a:hover {
                              text-decoration: underline !important;
                              color: #93c5fd !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown ul,
                            .dark-markdown-preview-wrapper .wmde-markdown ol {
                              color: white !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown li {
                              color: #e5e7eb !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown hr {
                              border-color: #4a5568 !important;
                              margin: 1.5rem 0 !important;
                            }
                          `}</style>
                        </div>
                      );
                    } else if (isUrl) {
                      return (
                        <a 
                          href={cleanContent} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline break-all"
                        >
                          {cleanContent}
                        </a>
                      );
                    } else {
                      return (
                        <div className="w-full dark-markdown-preview-wrapper">
                          <MarkdownPreview
                            source={cleanContent}
                            data-color-mode="dark"
                            className="w-full dark-markdown-preview"
                            style={{ 
                              background: 'transparent', 
                              color: 'white',
                              fontFamily: 'inherit'
                            }}
                          />
                          <style>{`
                            .dark-markdown-preview-wrapper .wmde-markdown {
                              background-color: transparent !important;
                              color: white !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown table {
                              border: 1px solid #4a5568 !important;
                              background-color: #2d3748 !important;
                              color: white !important;
                              border-collapse: collapse !important;
                              width: 100% !important;
                              margin: 1rem 0 !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown th {
                              background-color: #4a5568 !important;
                              color: white !important;
                              border: 1px solid #718096 !important;
                              padding: 8px 12px !important;
                              font-weight: bold !important;
                            }
                            .dark-markdown-preview-wrapper .wmde-markdown td {
                              background-color: #2d3748 !important;
                              color: white !important;
                              border: 1px solid #4a5568 !important;
                              padding: 8px 12px !important;
                            }
                          `}</style>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
              
              {(showContent || !showEmailVerification) && isVideo && (
                <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden mb-4">
                  <video
                    src={content.image_url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay={false}
                    loop={false}
                    muted={false}
                    playsInline
                  >
                    <p>Your browser does not support the video tag.
                      <a href={content.image_url} target="_blank" rel="noopener noreferrer">Download the video</a>.
                    </p>
                  </video>
                </div>
              )}
              
              {(showContent || !showEmailVerification) && isAudio && (
                <div className="w-full p-4 bg-gray-800/50 rounded-lg mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-purple-600 rounded-lg">
                      <FontAwesomeIcon icon={faMusic} className="text-white text-xl" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Audio Player</p>
                      <audio
                        src={content.image_url}
                        className="w-full mt-2"
                        controls
                        preload="metadata"
                      >
                        <source src={content.image_url} type={`audio/${content.image_url.split('.').pop()}`} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                </div>
              )}
              
              {/* FIXED PDF VIEWER FOR IPHONE - Using Google Docs Viewer */}
              {(showContent || !showEmailVerification) && isPDF && (
                <div className="w-full h-full min-h-[400px]">
                  <iframe
                    src={`https://docs.google.com/viewer?url=https://ez.wiki/${encodeURIComponent(content.image_url)}&embedded=true`}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    title="PDF Viewer"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation"
                  >
                    <p>Your browser does not support PDFs.
                      <a href={content.image_url} target="_blank" rel="noopener noreferrer">Download the PDF</a>.
                    </p>
                  </iframe>
                </div>
              )}
              
              {/* ADDED: HTML file viewer */}
              {(showContent || !showEmailVerification) && isHTML && (
                <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={content.image_url}
                    className="w-full h-full"
                    style={{ minHeight: '400px' }}
                    frameBorder="0"
                    title="HTML Content"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation"
                    loading="lazy"
                  >
                    <p>Your browser does not support iframes.
                      <a href={content.image_url} target="_blank" rel="noopener noreferrer">Open HTML file directly</a>.
                    </p>
                  </iframe>
                </div>
              )}
              
              {(showContent || !showEmailVerification) && isImage && (
                <MarkdownPreview source={`<img src="${content.image_url}" style="width: 100%; border-radius: 0.5rem;" alt="Content Image" />`} data-color-mode="dark" className="w-full touch-manipulation overflow-hidden" />
              )}
              {(showContent || !showEmailVerification) && content.link_url && (
                <MarkdownPreview
                  source={`[${content.link_url}](${content.link_url})`}
                  data-color-mode="dark"
                  className="w-full touch-manipulation overflow-hidden text-lime-300"
                />
              )}
            </>
          )}
        </div>
      </div>
    </Resizable>
  );
});

ResizableContent.displayName = 'ResizableContent';

export default function Welcome() {
    const { auth, template, allTemplates, contents, funnel, eye_tracking, fly_sign, count, sidebarwidth, effect, mode, color, transparency, qrcodelogo, hashtagseo, ziggy, tooltips, visibility, designview, displaymode } = usePage<SharedData>().props;
    const [viewMode, setViewMode] = useState<'design' | 'tile' | 'theme'>(
        designview === 'A' ? 'design' :
        designview === 'B' ? 'tile' :
        'theme'
    );
    const [isEffectsDisplayVisible, setIsEffectsDisplayVisible] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isInCollection, setIsInCollection] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [copySuccessAlert, setCopySuccessAlert] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [hashtag, setHashtag] = useState(hashtagseo || '');
    const [searchResults, setSearchResults] = useState<{
      tumblr: any[];
      youtube: any[];
      pinterest: any[];
      reddit: any[];
      success: boolean;
      message: string;
      tumblr_next?: string;
      youtube_next?: string;
      reddit_after?: string;
      allPosts: any[];
    }>({
      tumblr: [],
      youtube: [],
      pinterest: [],
      reddit: [],
      success: false,
      message: '',
      allPosts: []
    });
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [activePlatform, setActivePlatform] = useState('all');
    const [widgetPostsEnabled, setWidgetPostsEnabled] = useState(true);
    const [socialPostsEnabled, setSocialPostsEnabled] = useState(false);
    const [showEyeTracking, setShowEyeTracking] = useState(eye_tracking === 1);
    const [sidebarPosition, setSidebarPosition] = useState({ right: sidebarwidth });
    const [contentModal, setContentModal] = useState<{ show: boolean, content: string | null }>({
        show: false,
        content: null
    });
    const [showQrCodeModal, setShowQrCodeModal] = useState(false);
    const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [showAddContentModal, setShowAddContentModal] = useState(false);
    const [urlContent, setUrlContent] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [saveContentAlert, setSaveContentAlert] = useState<{show: boolean, type: 'success' | 'error', message: string} | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [memoizedContents, setMemoizedContents] = useState(
      [...contents]
        .filter(content => content.emoji_marker !== '0️⃣')
        .sort((a, b) => {
          if (a.pinned === 1 && b.pinned !== 1) return -1;
          if (a.pinned !== 1 && b.pinned === 1) return 1;
          return 0;
        })
    );
    const [selectedFiles, setSelectedFiles] = useState<File | null>(null);

    const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFiles(event.target.files[0]);
        }
    };
    const [domains, setDomains] = useState<DomainItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0
    });
    const [filters, setFilters] = useState<Filters>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [balance, setBalance] = useState(0);

    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);

    const sidebarRef = useRef<HTMLDivElement>(null);
    const viewModeRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const [sidebarLeft, setSidebarLeft] = useState<number | null>(null);
    const [isResizing, setIsResizing] = useState(false);

    const [isScrollingUp, setIsScrollingUp] = useState(false);
    const [isScrollingDown, setIsScrollingDown] = useState(false);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
    const isProgrammaticScrolling = useRef<boolean>(false);
    const touchStartY = useRef<number | null>(null);
    const tiktokScriptRef = useRef<HTMLScriptElement | null>(null);
    const facebookScriptRef = useRef<HTMLScriptElement | null>(null);
    const twitterScriptRef = useRef<HTMLScriptElement | null>(null);
    const redditScriptRef = useRef<HTMLScriptElement | null>(null);

    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowSize.width <= 768;

    const getTooltipContent = useCallback((reference: string, index: number = 0): string => {
        if (!tooltips || !tooltips[reference]) {
            const fallbackTooltips: Record<string, string[]> = {
                'content-tab-tooltip': [
                    'Paste Markdown, Embed Code, URL, or Simple Text',
                    'Upload PDF or Image files',
                    'Paste a website URL'
                ]
            };

            if (fallbackTooltips[reference] && fallbackTooltips[reference][index]) {
                return fallbackTooltips[reference][index];
            }

            console.warn(`Tooltip reference '${reference}' not found`);
            return '';
        }

        try {
            const tooltipArray = tooltips[reference];
            const tips = Array.isArray(tooltipArray) ? tooltipArray : JSON.parse(tooltipArray as any);

            const content = tips[index] || tips[0] || '';

            return content.replace('{funnel_id}', funnel || '');
        } catch (error) {
            console.error('Error parsing tooltip:', error);
            return '';
        }
    }, [tooltips, funnel]);

    const addScript = (url: string, ref: React.MutableRefObject<HTMLScriptElement | null>) => {
    if (ref.current) return;

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    document.body.appendChild(script);
    ref.current = script;
};

const removeScript = (ref: React.MutableRefObject<HTMLScriptElement | null>) => {
    if (ref.current && document.body.contains(ref.current)) {
        document.body.removeChild(ref.current);
    }
    ref.current = null;
};

useEffect(() => {
    if (template?.image.includes('twitter.com') || template?.image.includes('x.com')) {
        addScript("https://platform.twitter.com/widgets.js", twitterScriptRef);
    }

    return () => {
        removeScript(twitterScriptRef);
    };
}, [template?.image]);

useEffect(() => {
    if (template?.image.includes('facebook.com') || template?.image.includes('fb.watch')) {
        addScript("https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0", facebookScriptRef);
    }

    return () => {
        removeScript(facebookScriptRef);
    };
}, [template]);

useEffect(() => {
    if (template?.image.includes('tiktok.com')) {
        addScript("https://www.tiktok.com/embed.js", tiktokScriptRef);
    }

    return () => {
        removeScript(tiktokScriptRef);
    };
}, [template?.image]);

useEffect(() => {
    const isRedditEmbed = template?.image?.includes('reddit.com') ||
                         template?.image?.includes('redd.it') ||
                         (template?.image?.includes('blockquote') && template?.image?.includes('reddit-embed'));

    if (isRedditEmbed) {
        addScript("https://embed.reddit.com/widgets.js", redditScriptRef);

        if (redditScriptRef.current) {
            redditScriptRef.current.onload = () => {
                if (window.RedditEmbed && typeof window.RedditEmbed.init === 'function') {
                    window.RedditEmbed.init();
                }
            };
        }
    }

    return () => {
        removeScript(redditScriptRef);
    };
}, [template?.image]);

    const updateSidebarPosition = useCallback(() => {
        if (isProgrammaticScrolling.current) return;
        if (!mainRef.current || !sidebarRef.current) return;

        const mainRect = mainRef.current.getBoundingClientRect();
        const resizableElements = mainRef.current.querySelectorAll('.resizable-content');

        let activeElement: HTMLElement | null = null;
        let maxVisibleArea = -1;

        resizableElements.forEach((element: Element) => {
            const htmlElement = element as HTMLElement;
            const rect = htmlElement.getBoundingClientRect();

            if (rect.top < mainRect.bottom && rect.bottom > mainRect.top) {
                const visibleHeight = Math.min(rect.bottom, mainRect.bottom) - Math.max(rect.top, mainRect.top);
                const visibleWidth = Math.min(rect.right, mainRect.right) - Math.max(rect.left, mainRect.left);
                const visibleArea = visibleHeight * visibleWidth;

                if (visibleArea > maxVisibleArea) {
                    maxVisibleArea = visibleArea;
                    activeElement = htmlElement;
                }
            }
        });

        if (activeElement) {
            const activeRect = activeElement.getBoundingClientRect();
            let newLeft = activeRect.right + 16;

            const sidebarWidth = sidebarRef.current.offsetWidth;
            const windowWidth = window.innerWidth;
            if (newLeft + sidebarWidth > windowWidth) {
                newLeft = windowWidth - sidebarWidth - 16;
            }

            setSidebarLeft(newLeft);
        }
    }, []);

    const handleResizeStart = useCallback(() => {
        setIsResizing(true);
    }, []);

    const handleContentResize = useCallback((
        event: MouseEvent | TouchEvent,
        direction: any,
        ref: HTMLDivElement
    ) => {
        if (!sidebarRef.current) return;

        const activeRect = ref.getBoundingClientRect();
        let newLeft = activeRect.right + 16;

        const sidebarWidth = sidebarRef.current.offsetWidth;
        const windowWidth = window.innerWidth;
        if (newLeft + sidebarWidth > windowWidth) {
            newLeft = windowWidth - sidebarWidth - 16;
        }

        sidebarRef.current.style.left = `${newLeft}px`;
        sidebarRef.current.style.right = 'auto';
    }, []);

    const handleResizeStop = useCallback(() => {
        setIsResizing(false);
        updateSidebarPosition();
    }, [updateSidebarPosition]);

    useEffect(() => {
        if (!showEyeTracking) {
            const timer = setTimeout(updateSidebarPosition, 100);
            return () => clearTimeout(timer);
        } else {
            setSidebarLeft(null);
        }
    }, [showEyeTracking, updateSidebarPosition]);

    useEffect(() => {
        const handleResize = () => {
            if (!showEyeTracking) {
                updateSidebarPosition();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [showEyeTracking, updateSidebarPosition]);

    useEffect(() => {
      setMemoizedContents([...contents]
        .filter(content => content.emoji_marker !== '0️⃣')
        .sort((a, b) => {
          if (a.pinned === 1 && b.pinned !== 1) return -1;
          if (a.pinned !== 1 && b.pinned === 1) return 1;
          return 0;
        })
      );
    }, [contents]);

    const getParentDomain = () => {
      if (typeof window === 'undefined') return '/';
      const parts = window.location.hostname.split('.');
      return parts.length > 2 ? `https://${parts.slice(-2).join('.')}` : '/';
    };

    const getLoginUrl = () => {
      return ziggy?.routes?.login ? route('login') : '/login';
    };

    const handleSignInClick = () => {
      window.open(getLoginUrl(), '_blank', 'noopener,noreferrer');
      setShowLoginModal(false);
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleFilterChange = (newFilters: Filters) => {
        fetchFilteredDomains(newFilters);
    };
    const handleHashtagSearch = async () => {
      if (!hashtag.trim()) return;
      setSocialPostsEnabled(true);
      setIsSearching(true);
      try {
        const response = await axios.get('/search/hashtag', {
          params: {
            searchhashtag: hashtag,
            count: 20
          }
        });

        setSearchResults({
          ...response.data,
          allPosts: [
            ...(Array.isArray(response.data.tumblr) ? response.data.tumblr : []),
            ...(Array.isArray(response.data.youtube) ? response.data.youtube : []),
            ...(Array.isArray(response.data.pinterest) ? response.data.pinterest : []),
            ...(Array.isArray(response.data.reddit) ? response.data.reddit : [])
          ],
          tumblr_next: response.data.tumblr_next,
          youtube_next: response.data.youtube_next,
          reddit_after: response.data.reddit_after
        });
      } catch (error) {
        console.error('Error searching by hashtag:', error);
        setSearchResults({
          tumblr: [],
          youtube: [],
          pinterest: [],
          reddit: [],
          success: false,
          message: 'Failed to search. Please try again.',
          allPosts: []
        });
      } finally {
        setIsSearching(false);
      }
    };

const filterResultsByPlatform = () => {
  if (activePlatform === 'all') {
    return searchResults.allPosts.filter(post =>
      socialPostsEnabled || !['tumblr', 'youtube', 'pinterest', 'reddit'].includes(post.platform)
    );
  }

  if (!socialPostsEnabled && ['tumblr', 'youtube', 'pinterest', 'reddit'].includes(activePlatform)) {
    return [];
  }

  return searchResults.allPosts.filter(post => post.platform === activePlatform);
};

const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || searchResults.allPosts.length === 0) return;

    setIsLoadingMore(true);
    try {
        const response = await axios.get('/search/load-more', {
            params: {
                hashtag: hashtag,
                count: 20,
                tumblr_timestamp: searchResults.tumblr_next,
                youtubenext: searchResults.youtube_next,
                reddit_after: searchResults.reddit_after,
                total: searchResults.pinterest.length
            }
        });

        if (response.data.success) {
            setSearchResults(prev => {
                const newTumblr = (response.data.tumblr || []).map(post => ({ ...post, platform: 'tumblr' }));
                const newYoutube = (response.data.youtube || []).map(post => ({ ...post, platform: 'youtube' }));
                const newPinterest = (response.data.pinterest || []).map(post => ({ ...post, platform: 'pinterest' }));
                const newReddit = (response.data.reddit || []).map(post => ({ ...post, platform: 'reddit' }));
                const newPosts = [...newTumblr, ...newYoutube, ...newPinterest, ...newReddit];

                return {
                    ...prev,
                    tumblr: [...prev.tumblr, ...newTumblr],
                    youtube: [...prev.youtube, ...newYoutube],
                    pinterest: [...prev.pinterest, ...newPinterest],
                    reddit: [...prev.reddit, ...newReddit],
                    tumblr_next: response.data.tumblr_next,
                    youtube_next: response.data.youtube_next,
                    reddit_after: response.data.reddit_after,
                    success: true,
                    allPosts: [...prev.allPosts, ...newPosts]
                };
            });
        }
    } catch (error) {
        console.error('Error loading more results:', error);
    } finally {
        setIsLoadingMore(false);
    }
}, [isLoadingMore, searchResults, hashtag]);

useEffect(() => {
    const handleScroll = () => {
        const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200;
        if (isAtBottom && !isLoadingMore && !isSearching) {
            handleLoadMore();
        }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}, [isLoadingMore, isSearching, handleLoadMore]);

const renderSearchResults = () => {
  const filteredResults = filterResultsByPlatform();

  if (!searchResults.success && hashtag) {
    return null;
  }

  if (filteredResults.length === 0 && hashtag) {
    return (
      <div className="col-span-full text-center py-12 text-slate-300">
        No posts found for #{hashtag}
      </div>
    );
  }

  return filteredResults.map((result, index) => {
    const platform = result?.platform || 'unknown';
    const date = result?.created_at || result?.timestamp || result?.snippet?.publishedAt ||
                result?.data?.created_utc || new Date().toISOString();

    if (platform === 'youtube' && result.snippet) {
      const videoId = result.id?.videoId || '';
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const channelUrl = `https://www.youtube.com/channel/${result.snippet.channelId}`;

      return (
        <section key={index} className="card group flex flex-col overflow-hidden rounded-2xl card-gradient border border-slate-700/50 transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-1">
          <div className="aspect-video bg-black relative">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={result.snippet.title || 'YouTube video'}
              allowFullScreen
            />
            <div className="absolute top-3 right-3 bg-black/70 text-xs text-white px-2 py-1 rounded">
              {result.contentDetails?.duration || '22:15'}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-1 rounded">
                <FontAwesomeIcon icon={faYoutube} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-300">YouTube</span>
              <span className="text-xs text-slate-500 ml-auto">
                <FontAwesomeIcon icon={faClock} className="mr-1" />
                {new Date(date).toLocaleDateString()}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold text-white">
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-400 transition-colors"
                data-tooltip-id="social-card-tooltip"
                data-tooltip-content={getTooltipContent('social-card-tooltip', 0)}
              >
                {result.snippet.title || 'No title'}
              </a>
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {result.snippet.description || 'No description available'}
            </p>
            <div className="mt-4 flex items-center text-slate-500 text-sm">
              <span className="flex items-center mr-4">
                <FontAwesomeIcon icon={faEye} className="mr-1" />
                {result.statistics?.viewCount || '5.7K'}
              </span>
              <span className="flex items-center mr-4">
                <FontAwesomeIcon icon={faThumbsUp} className="mr-1" />
                {result.statistics?.likeCount || '812'}
              </span>
              <span className="flex items-center">
                <FontAwesomeIcon icon={faComment} className="mr-1" />
                {result.statistics?.commentCount || '134'}
              </span>
            </div>
            <div className="mt-3">
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                data-tooltip-id="social-card-tooltip"
                data-tooltip-content={getTooltipContent('social-card-tooltip', 1)}
              >
                View Channel
              </a>
            </div>
          </div>
        </section>
      );
    }

    if (platform === 'tumblr') {
      const postUrl = result.post_url || `https://${result.blog_name}.tumblr.com/post/${result.id}`;

      return (
        <article key={index} className="card group flex flex-col rounded-2xl card-gradient border border-slate-700/50 p-5 transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900 font-bold text-white">
              <FontAwesomeIcon icon={faTumblr} />
            </div>
            <div>
              <a
                href={`https://${result.blog_name}.tumblr.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-200 hover:text-blue-400 transition-colors"
                data-tooltip-id="social-card-tooltip"
                data-tooltip-content={getTooltipContent('social-card-tooltip', 2)}
              >
                {result.blog_name || 'tumblr'}
              </a>
              <p className="text-xs text-slate-500">
                Posted {new Date(date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="scrollbar-thin mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
            <h3 className="text-xl font-bold text-white">
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
                data-tooltip-id="social-card-tooltip"
                data-tooltip-content={getTooltipContent('social-card-tooltip', 3)}
              >
                {result.summary || result.body?.substring(0, 100) || 'Tumblr Post'}
              </a>
            </h3>
            {result.body && (
              <div
                className="text-sm leading-relaxed text-slate-400"
                dangerouslySetInnerHTML={{ __html: result.body }}
              />
            )}
            {result.photos?.[0]?.original_size?.url && (
              <img
                src={result.photos[0].original_size.url}
                alt={result.summary || 'Tumblr post'}
                className="mt-3 w-full rounded-lg object-cover max-h-48"
              />
            )}
            {result.tags && result.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {result.tags.map((tag, tagIndex) => (
                  <a
                    key={tagIndex}
                    href={`https://tumblr.com/tagged/${tag}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded hover:bg-purple-600/40 transition-colors"
                    data-tooltip-id="social-card-tooltip"
                    data-tooltip-content={getTooltipContent('social-card-tooltip', 4)}
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center text-slate-500 text-sm">
            <span className="flex items-center mr-4">
              <FontAwesomeIcon icon={faHeart} className="mr-1" />
              {result.note_count || result.like_count || '0'}
            </span>
            <span className="flex items-center mr-4">
              <FontAwesomeIcon icon={faComment} className="mr-1" />
              {result.note_count || '0'}
            </span>
            <span className="flex items-center">
              <FontAwesomeIcon icon={faBookmark} className="mr-1" />
              {result.reblog_count || '0'}
            </span>
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 ml-auto"
              data-tooltip-id="social-card-tooltip"
              data-tooltip-content={getTooltipContent('social-card-tooltip', 5)}
            >
              View Post
            </a>
          </div>
        </article>
      );
    }

    if (platform === 'reddit' && result.data) {
      const redditData = result.data;
      const postUrl = `https://reddit.com${redditData.permalink}`;
      const subredditUrl = `https://reddit.com/r/${redditData.subreddit}`;
      const authorUrl = `https://reddit.com/u/${redditData.author}`;

      return (
        <article key={index} className="card group flex flex-col rounded-2xl card-gradient border border-slate-700/50 transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-1">
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                <FontAwesomeIcon icon={faReddit} />
              </div>
              <div className="text-sm">
                <a
                  href={subredditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-200 hover:text-orange-400 transition-colors"
                  data-tooltip-id="social-card-tooltip"
                  data-tooltip-content={getTooltipContent('social-card-tooltip', 6)}
                >
                  r/{redditData.subreddit || 'unknown'}
                </a>
                <p className="text-xs text-slate-500">
                  Posted by <a
                    href={authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-orange-400 transition-colors"
                    data-tooltip-id="social-card-tooltip"
                    data-tooltip-content={getTooltipContent('social-card-tooltip', 7)}
                  >u/{redditData.author || 'anonymous'}</a> • {new Date(redditData.created_utc * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="scrollbar-thin mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
              <h3 className="text-lg font-bold text-white">
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-400 transition-colors"
                  data-tooltip-id="social-card-tooltip"
                  data-tooltip-content={getTooltipContent('social-card-tooltip', 8)}
                >
                  {redditData.title || 'Reddit Post'}
                </a>
              </h3>
              {redditData.selftext && (
                <p className="text-sm leading-relaxed text-slate-400">
                  {redditData.selftext}
                </p>
              )}
              {redditData.thumbnail && redditData.thumbnail !== 'self' && redditData.thumbnail !== 'default' && (
                <img
                  src={redditData.thumbnail}
                  alt={redditData.title}
                  className="mt-3 w-full rounded-lg object-cover max-h-48"
                />
              )}
            </div>
          </div>
          <div className="mt-auto flex items-center gap-4 border-t border-slate-700/50 bg-slate-800/30 px-5 py-3">
            <span className="flex items-center gap-1 text-slate-400">
              <FontAwesomeIcon icon={faArrowUp} />
              <span className="text-sm font-semibold">
                {redditData.ups || '0'}
              </span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <FontAwesomeIcon icon={faArrowDown} />
            </span>
            <span className="flex items-center gap-1 text-slate-400 ml-auto">
              <FontAwesomeIcon icon={faComment} />
              <span className="text-sm font-semibold">
                {redditData.num_comments || '0'}
              </span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <FontAwesomeIcon icon={faBookmark} />
            </span>
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              data-tooltip-id="social-card-tooltip"
              data-tooltip-content={getTooltipContent('social-card-tooltip', 9)}
            >
              View Post
            </a>
          </div>
        </article>
      );
    }

    if (platform === 'pinterest') {
      const pinUrl = result.link || `https://pinterest.com/pin/${result.id}`;
      const pinterestUserUrl = result.pinner ? `https://pinterest.com/${result.pinner.username}` : '#';

      return (
        <article key={index} className="card group relative flex flex-col overflow-hidden rounded-2xl card-gradient border border-slate-700/50 transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-1">
          <div className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold text-white shadow-md">
            <FontAwesomeIcon icon={faPinterest} />
          </div>
          <div className="h-48 overflow-hidden">
            <img
              src={
                result.images?.orig?.url ||
                result.images?.["236x"]?.url ||
                result.image?.original?.url ||
                'https://via.placeholder.com/300'
              }
              alt={result.description || 'Pinterest pin'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-bold text-white">
              <a
                href={pinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-400 transition-colors"
                data-tooltip-id="social-card-tooltip"
                data-tooltip-content={getTooltipContent('social-card-tooltip', 10)}
              >
                {result.description || result.note || 'Pinterest Pin'}
              </a>
            </h3>
            <p className="mt-1 flex-1 text-sm text-slate-400">
              {result.description || result.note || 'No description available'}
            </p>
            {result.domain && (
              <p className="text-xs text-slate-500 mt-2">
                From: {result.domain}
              </p>
            )}
            {result.pinner && (
              <div className="flex items-center mt-2 text-xs text-slate-400">
                <span>By: <a
                  href={pinterestUserUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-400 transition-colors"
                  data-tooltip-id="social-card-tooltip"
                  data-tooltip-content={getTooltipContent('social-card-tooltip', 11)}
                >{result.pinner.full_name || result.pinner.id}</a></span>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-bold text-purple-400">
                {result.price ? `$${result.price}` : ''}
              </span>
              {result.link && (
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  data-tooltip-id="social-card-tooltip"
                  data-tooltip-content={getTooltipContent('social-card-tooltip', 12)}
                >
                  View Pin
                </a>
              )}
            </div>
          </div>
        </article>
      );
    }

    return (
      <div key={index} className="card card-gradient rounded-2xl p-4 shadow-lg animate-card">
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-2">
              {platform.toUpperCase()} Result
            </h3>
            <div className="text-slate-300 text-xs overflow-auto max-h-32">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3">
            <span>{platform}</span>
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  });
};

const fetchFilteredDomains = async (newFilters: Filters) => {
    setIsLoading(true);
    try {
        const response = await axios.get(route('marketplace.loadmore'), {
            params: {
                ...newFilters,
                page: 1
            }
        });

        setDomains(response.data.domains);
        setPagination(response.data.pagination);
        setFilters(newFilters);
    } catch (error) {
        console.error('Error fetching filtered domains:', error);
        setErrorMessage('Failed to apply filters. Please try again.');
    } finally {
        setIsLoading(false);
    }
};

    const loadMoreDomains = async () => {
        if (isLoading || pagination.current_page >= pagination.last_page) return;

        setIsLoading(true);
        try {
            const response = await axios.get(route('marketplace.loadmore'), {
                params: {
                    ...filters,
                    page: pagination.current_page + 1
                }
            });

            setDomains([...domains, ...response.data.domains]);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error loading more domains:', error);
            setErrorMessage('Failed to load more domains. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = async (domainId: number, type: 'CUSTOM' | 'DOMAIN', price: number | string) => {
        setIsPurchasing(true);
        setErrorMessage('');
        setSuccessMessage('');
        setShowBalanceModal(false);
        setShowLoginModal(false);

        try {
            const response = await axios.post(route('marketplace.purchase'), {
                domain_id: domainId,
                type: type,
                price: Number(price)
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                validateStatus: (status) => status >= 200 && status < 500
            });

            if (response.data.success) {
                setBalance(response.data.balance);
                setSuccessMessage(
                    `Purchase successful! ${response.data.invoice_number ?
                    `Invoice #${response.data.invoice_number}` : ''}`
                );

                setDomains(prev => prev.filter(d =>
                    (d.type === 'CUSTOM' ? d.id !== domainId : true) &&
                    (d.type === 'DOMAIN' ? d.id !== domainId : true)
                ));
            } else {
                throw new Error(response.data.message || 'Purchase failed');
            }
        } catch (error) {
            let errorMessage = 'An error occurred during purchase';
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message ||
                              error.response?.data?.error ||
                              error.message;

                if (errorMessage.toLowerCase().includes('insufficient EZ$ balance')) {
                    setShowBalanceModal(true);
                    errorMessage = '';
                } else if (errorMessage.toLowerCase().includes('user not authenticated')) {
                    setShowLoginModal(true);
                    errorMessage = '';
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
                if (errorMessage.toLowerCase().includes('insufficient EZ$ balance')) {
                    setShowBalanceModal(true);
                    errorMessage = '';
                } else if (errorMessage.toLowerCase().includes('user not authenticated')) {
                    setShowLoginModal(true);
                    errorMessage = '';
                }
            }
            if (errorMessage) {
                if (errorMessage.toLowerCase().includes('unauthenticated.')) {
                    setShowLoginModal(true);
                    errorMessage = '';
                } else {
                    setErrorMessage(errorMessage);
                    setTimeout(() => setErrorMessage(''), 5000);
                }
            }
        } finally {
            setIsPurchasing(false);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    };

    const renderTemplateContent = useCallback((currentTemplate) => {
        const diffForHumans = (dateString?: string): string => {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            const now = new Date();
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (seconds < 5) return 'just now';
            if (seconds < 60) return `${seconds} seconds ago`;

            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;

            const hours = Math.floor(minutes / 60);
            if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;

            const days = Math.floor(hours / 24);
            if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;

            const weeks = Math.floor(days / 7);
            if (weeks < 4) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;

            const months = Math.floor(days / 30.44);
            if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;

            const years = Math.floor(days / 365.25);
            return years === 1 ? '1 year ago' : `${years} years ago`;
        };

        const leftMargin = currentTemplate?.leftwidth || 0;
        const rightMargin = currentTemplate?.rightwidth || 0;

        const containerStyle = isMobile ? {
            marginLeft: '0%',
            marginRight: '0%',
            width: '100%',
        } : {
            marginLeft: `${leftMargin}%`,
            marginRight: `${rightMargin}%`,
            width: `calc(100% - ${leftMargin}% - ${rightMargin}%)`,
        };

        const processedImage = currentTemplate?.image
            ? currentTemplate.image.replace(/{timeago}/g, currentTemplate.created_at ? diffForHumans(currentTemplate.created_at) : '')
            : '';

        if (!processedImage) return null;

        const isMarkdown = () => {
          const isHtmlDocument = /^<(!DOCTYPE|html|head|body|<div\s|<section|<article|<header)/i.test(processedImage.trim());
          
          if (isHtmlDocument) {
              return false;
          }

          const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(processedImage);
          const hasMarkdownSyntax = /^#+\s|\*\*.+\*\*|\[.+\]\(.+\)|```|`[^`]+`|>\s/.test(processedImage);
          
          if (hasHtmlTags && !hasMarkdownSyntax) {
              return false;
          }

          const markdownPatterns = [
              /#+\s/,
              /\*\*.+\*\*/,
              /_{2}.+_{2}/,
              /\*.+\*/,
              /\[.+\]\(.+\)/,
              /^- /,
              /^\d+\. /,
              /```/,
              /`[^`]+`/,
              />\s/,
              /!\[.*\]\(.*\)/,
          ];

          if (markdownPatterns.some(pattern => pattern.test(processedImage))) return true;

          return true;
        };

        const extension = processedImage.split('.').pop()?.toLowerCase() || '';
        const imgPath = currentTemplate.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
        const fullImageUrl = `${imgPath}${processedImage}`;

        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
        const validDocumentExtensions = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];
        // ADDED: HTML extensions
        const validHtmlExtensions = ['html', 'htm'];

        const youtubeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?\/)|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
        const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^/]+:[^"&?/ ]+)/i;
        const vimeoRegex = /^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im;
        const fbWatchRegex = /^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/;
        const facebookRegex = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z00-9(\.\?)?]/;
        const iframeRegex = /<iframe.*?src=["'](.*?)["'].*?>.*?<\/iframe>/is;
        const blockquoteRegex = /<blockquote/;
        const redditRegex = /reddit\.com\/r\/\w+\/comments\/\w+\/\w+\//;
        const redditEmbedRegex = /reddit-embed-bq/;

        const youtubeMatch = processedImage.match(youtubeRegex);
        const linkedinMatch = processedImage.match(linkedinRegex);
        const vimeoMatch = processedImage.match(vimeoRegex);
        const fbWatchMatch = processedImage.match(fbWatchRegex);
        const facebookMatch = processedImage.match(facebookRegex);
        const iframeMatch = processedImage.match(iframeRegex) || blockquoteRegex.test(processedImage);
        const redditMatch = processedImage.match(redditRegex);
        const redditEmbedMatch = processedImage.match(redditEmbedRegex);
        const htmlBlob = new Blob([processedImage], { type: 'text/html; charset=UTF-8' });
        const htmlUrl = URL.createObjectURL(htmlBlob);

        // ADDED: HTML file handler
        if (validHtmlExtensions.includes(extension)) {
            return (
                <>
                    <style>{`
                        .html-viewer-container {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: #1f1f1f;
                            z-index: -1;
                        }
                        .blur-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                        .html-iframe {
                            width: 100%;
                            height: 100%;
                            border: none;
                            background: white;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <div className="html-viewer-container">
                        <iframe
                            src={fullImageUrl}
                            className="html-iframe"
                            style={containerStyle}
                            title="HTML Document"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation"
                            loading="lazy"
                        />
                    </div>
                </>
            );
        }

        if (redditMatch || redditEmbedMatch) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <div
                        className="inset-0 flex items-center justify-center p-4 object-cover overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: processedImage }}
                        style={containerStyle}
                    />
                    <script async src="https://embed.reddit.com/widgets.js" charSet="UTF-8"></script>
                </>
            );
        }

        if (validImageExtensions.includes(extension)) {
            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: absolute;
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
                        className="absolute inset-0 max-w-full max-h-full m-auto z-0 rounded-lg touch-manipulation"
                        onError={(e) => console.error('Image failed to load', e)}
                        key={`img-${currentTemplate.id}`}
                        style={containerStyle}
                    />
                </>
            );
        }

        if (validDocumentExtensions.includes(extension)) {
    return (
        <>
            <style>{`
                .document-viewer-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #1f1f1f;
                    z-index: -1;
                }
            `}</style>
            <div className="document-viewer-container"></div>
            <iframe
                src={`https://docs.google.com/viewer?url=${fullImageUrl}&embedded=true`}
                className="fixed top-0 left-0 w-full h-full"
                style={containerStyle}
                frameBorder="0"
                loading="lazy"
                allow="autoplay; fullscreen"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin"
                title="Document Viewer"
                scrolling="yes"
            />
        </>
    );
}

        if (iframeMatch) {
            const isSocialMediaEmbed = /<(iframe|blockquote)[^>]*(facebook|linkedin|tiktok|twitter|reddit)\.com/i.test(processedImage);

            if (isSocialMediaEmbed) {
                return (
                    <>
                        <style>{`
                            .blur-overlay {
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                backdrop-filter: blur(20px);
                                z-index: -3;
                            }
                        `}</style>
                        <div className="blur-overlay"></div>
                        <div className="max-h-screen overflow-y-auto" style={containerStyle}>
                        <div
                        className="inset-0 flex items-center justify-center p-4 object-cover overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: processedImage }}
                    />
                    </div>
                    </>
                );
            }
			
            const processedHtml = processedImage
                .replace(/<(iframe|blockquote)([^>]*)\s(height|width|style)=["'][^"']*["']([^>]*)>/gi, '<$1$2$4 class="absolute top-0 left-0 w-full h-full" scrolling="yes">')
                .replace(/class="([^"]*)"/g, 'class="$1 absolute inset-0 m-auto"');

            const finalHtml = !/<(iframe|blockquote)[^>]*class="/i.test(processedHtml)
                ? processedHtml.replace(/<(iframe|blockquote)/g, '<$1 scrolling="yes" class="absolute w-full h-full inset-0 m-auto"')
                : processedHtml;

            return (
                <>
                    <style>{`
                        .blur-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            backdrop-filter: blur(20px);
                            z-index: -2;
                        }
                    `}</style>
                    <div className="blur-overlay"></div>
                    <div className="max-h-screen overflow-y-auto" style={containerStyle}>
                    <div
                        className="inset-0 flex items-center justify-center p-4 object-cover overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: finalHtml }}
                    />
                    </div>
                </>
            );
            }

        if (youtubeMatch) {
            const autoplayParam = currentTemplate.option === 'autoplay' ? 'autoplay=1' :
                                currentTemplate.option === 'mute' ? 'autoplay=1&mute=1' : 'mute=1';

            return (
                <>
                    <div className="absolute top-0 left-0 w-full h-full z-[-2]" style={containerStyle}>
                        <iframe
                            loading="lazy"
                            src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${autoplayParam}&loop=1&playlist=${youtubeMatch[1]}&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3`}
                            className="w-full h-full object-cover touch-manipulation"
                            frameBorder="0"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            key={`yt-embed-${currentTemplate.id}`}
                        />
                    </div>
                    <style>{`
                        .blur-overlay {
                            position: absolute;
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
                        className="absolute top-0 left-0 w-full h-full object-cover touch-manipulation"
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}?${currentTemplate.option}=1&mute=1&loop=1&playlist=${youtubeMatch[1]}`}
                        title="YouTube video player"
                        style={containerStyle}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        key={`yt-main-${currentTemplate.id}`}
                    />
                </>
            );
        }

        if (linkedinMatch) {
            let linkedinUrl = processedImage;
            if (!linkedinUrl.includes('?compact=1')) {
                linkedinUrl += (linkedinUrl.includes('?') ? '&' : '?') + 'compact=1';
            }

            return (
                <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center" style={containerStyle}>
                    <iframe
                        id="bgVideo"
                        src={linkedinUrl}
                        className="w-full h-full touch-manipulation"
                        frameBorder="0"
                        allowFullScreen
                        title="Embedded LinkedIn Post"
                        key={`linkedin-${currentTemplate.id}`}
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
                            position: absolute;
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
                        className="absolute top-0 left-0 w-full h-full object-cover touch-manipulation"
                        style={containerStyle}
                        frameBorder="0"
                        allowFullScreen
                        key={`vimeo-${currentTemplate.id}`}
                    />
                </>
            );
        }

        if (fbWatchMatch || (facebookMatch && !processedImage.includes('groups'))) {
            return (
                <div className="absolute top-0 left-0 w-full h-screen flex justify-center items-center overflow-auto touch-manipulation" style={containerStyle}>
                    <div
                        className="fb-post"
                        data-href={processedImage}
                        data-show-text="true"
                        key={`fb-${currentTemplate.id}`}
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
                        className="absolute top-0 left-0 w-full h-full object-cover z-[-3] touch-manipulation"
                        style={containerStyle}
                        key={`mp4-bg-${currentTemplate.id}`}
                    >
                        <source src={fullImageUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <style>{`
                        .blur-overlay {
                            position: absolute;
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
                        className="absolute inset-0 w-full h-full m-auto touch-manipulation"
                        style={containerStyle}
                        controls
                        key={`mp4-main-${currentTemplate.id}`}
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
                            position: absolute;
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
                        className="absolute top-0 left-0 w-full h-full touch-manipulation"
                        style={containerStyle}
                        ar
                        auto-rotate
                        camera-controls
                        shadow-intensity="1"
                        key={`glb-${currentTemplate.id}`}
                    />
                </>
            );
        }

        if (isValidUrl(processedImage)) {
            return (
                <>
                    <iframe
                        loading="lazy"
                        id="bgVideo"
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        src={processedImage}
                        className="absolute top-0 left-0 w-full h-full touch-manipulation"
                        style={containerStyle}
                        frameBorder="0"
                        allowFullScreen
                        key={`generic-${currentTemplate.id}`}
                        scrolling="yes"
                    />
                </>
            );
        }
        if (/<\/?[a-z][\s\S]*>/i.test(processedImage)) {
            const hasHtmlContent = processedImage.includes('<div') || 
                                   processedImage.includes('<span') || 
                                   processedImage.includes('<p>') || 
                                   processedImage.includes('<h') ||
                                   processedImage.includes('<ul>') ||
                                   processedImage.includes('<ol>') ||
                                   processedImage.includes('<li>') ||
                                   processedImage.includes('<table>');
            
            if (hasHtmlContent) {
                return (
                    <>
                        <style>{`
                            .blur-overlay {
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                backdrop-filter: blur(20px);
                                z-index: -1;
                            }
                            .html-container {
                                position: relative;
                                width: 100%;
                                height: 100%;
                                overflow-y: auto;
                                background: ${currentTemplate?.bgcolour || template?.bgcolour || 'transparent'};
                                color: white;
                                font-family: system-ui, -apple-system, sans-serif;
                            }
                        `}</style>
                        <div className="blur-overlay"></div>
                        <div className="html-container" style={containerStyle}>
                            <div dangerouslySetInnerHTML={{ __html: processedImage }} />
                        </div>
                    </>
                );
            }
        }
        
        if (isMarkdown()) {
            return (
				<>
                    <style>{`
                        .markdown-container {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: ${template?.bgcolour || '#000000'};
                            overflow-y: auto;
                            z-index: 0;
                        }
                        .markdown-content {
                            margin: 0 auto;
                            color: white;
                            font-family: system-ui, -apple-system, sans-serif;
                            padding: 20px;
                        }
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
                    <div className="markdown-container" style={containerStyle}>
                        <div className="markdown-content">
                            <MarkdownPreview
                                source={processedImage}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    fontFamily: 'system-ui, -apple-system, sans-serif'
                                }}
                                wrapperElement={{
                                    'data-color-mode': 'dark'
                                }}
                            />
                        </div>
                    </div>
                </>

            );
        }
        return (
            <iframe
                src={htmlUrl}
                className="absolute top-0 left-0 w-full h-full border-none touch-manipulation"
                style={containerStyle}
                allow="fullscreen; microphone; camera; autoplay; display-capture"
                sandbox="allow-forms allow-modals allow-pointer-lock allow-popups
                        allow-presentation allow-scripts allow-downloads
                        allow-storage-access-by-user-activation"
                allowFullScreen
                loading="lazy"
                name="binauralMixerFrame"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Binaural Audio Mixer"
            />
        );
    }, [isMobile]);

    const memoizedBackgroundContent = useMemo(() => {
        if (allTemplates && allTemplates.length > 1) {
            return (
                <>
    <style>{`
        .swiper-button-next::after,
        .swiper-button-prev::after {
            content: none;
        }
        .swiper-slide {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            touch-action: pan-y !important;
            -webkit-overflow-scrolling: touch !important;
        }
        .swiper-slide::-webkit-scrollbar {
            width: 8px;
        }
        .swiper-slide::-webkit-scrollbar-track {
            background: rgba(45, 55, 72, 0.9);
            border-radius: 4px;
        }
        .swiper-slide::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            border-radius: 4px;
        }
        .swiper-wrapper {
            overscroll-behavior: contain;
        }
    `}</style>
    <Swiper
      modules={[EffectFade, Navigation]}
      effect="fade"
      speed={1000}
      loop={true}
      navigation={{
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      }}
      className="h-full w-full touch-manipulation"
      onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
      allowTouchMove={true}
      touchRatio={1}
      touchAngle={45}
      simulateTouch={true}
      touchMoveStopPropagation={false}
      touchStartPreventDefault={false}
    >
      {allTemplates.map((tpl) => (
        <SwiperSlide
          key={tpl.id}
          className="touch-manipulation !overflow-y-auto !overflow-x-hidden"
          style={{
            backgroundColor: tpl.bgcolour || 'transparent',
            height: '100%',
            minHeight: '100vh',
          }}
        >
          <div 
            className="w-full h-full overflow-y-auto overflow-x-hidden"
            style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {renderTemplateContent(tpl)}
          </div>
        </SwiperSlide>
      ))}
      <div className="swiper-button-prev !left-4 md:!left-20 !text-white !w-10 !h-10 p-[5px] !flex !items-center !justify-center !bg-gray-800/70 !rounded-full touch-manipulation" data-tooltip-id="theme-tooltip" data-tooltip-content={getTooltipContent('theme-tooltip', 0)}>
        <FontAwesomeIcon icon={faChevronLeft} className="!text-2xl touch-manipulation" />
      </div>
      <div className="swiper-button-next !right-4 md:!right-20 !text-white !w-10 p-[5px] !h-10 !flex !items-center !justify-center !bg-gray-800/70 !rounded-full touch-manipulation" data-tooltip-id="theme-tooltip" data-tooltip-content={getTooltipContent('theme-tooltip', 1)}>
        <FontAwesomeIcon icon={faChevronRight} className="!text-2xl touch-manipulation" />
      </div>
    </Swiper>
</>
            );
        }
        return (
			<div
				className="absolute inset-0 z-0 touch-manipulation"
				style={{
					backgroundColor: template?.bgcolour || 'transparent'
				}}
			>
				{renderTemplateContent(template)}
			</div>
		);
    }, [allTemplates, template, renderTemplateContent, getTooltipContent]);

    const blurStyle = useMemo(() => {
        if (!template?.image) return null;

        const extension = template.image.split('.').pop()?.toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'].includes(extension || '');

        return isImage ? (
            <style>{`
                .blur-bg {
                    background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
                    background-size: cover;
                }
            `}</style>
        ) : null;
    }, [template]);

    useEffect(() => {
        const loadReactionData = async () => {
            try {
                const countsResponse = await axios.get(`/reactions/${funnel}/counts`);
                setLikes(countsResponse.data.likes);
                setDislikes(countsResponse.data.dislikes);
            } catch (error) {
                console.error('Error loading reaction data:', error);
            }
        };

        if (funnel?.id) {
            loadReactionData();
        }
    }, [funnel?.id]);

    const handleReaction = async (reactionType: 'like' | 'dislike') => {
        try {
            const response = await axios.post('/reactions', {
                funnelid: funnel,
                reaction: reactionType
            });

            setLikes(response.data.likes);
            setDislikes(response.data.dislikes);

            if (response.data.action === 'removed' && userReaction === reactionType) {
                setUserReaction(null);
            } else {
                setUserReaction(reactionType);
            }
        } catch (error) {
            console.error('Error submitting reaction:', error);
        }
    };

    const handleAddContent = async () => {
        const referenceContent = '';

        const hasUrlContent = urlContent.trim() !== '';
        const hasFile = selectedFiles !== null;

        if (!hasUrlContent && !hasFile) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'Please provide at least one form of content (text/embed or image).'
            });
            return;
        }

        if (!auth.user && !userEmail) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'Email is required'
            });
            return;
        }

        if (!auth.user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'Please enter a valid email address'
            });
            return;
        }

        if (!agreeToTerms) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'You must agree to the Terms and Conditions and Privacy Policy'
            });
            return;
        }

        setSaveContentAlert({
            show: true,
            type: 'success',
            message: 'Saving content...'
        });

        const formData = new FormData();
        formData.append('funnel_id', String(funnel));
        formData.append('reference', referenceContent);
        formData.append('email', auth.user?.email || userEmail);

        if (hasUrlContent) {
            const isUrl = isValidUrl(urlContent.trim());
			if (isUrl) {
				formData.append('url', urlContent);
			} else {
				formData.append('url', urlContent);
			}
        }
        if (hasFile) {
            formData.append('image', selectedFiles);
        }

        try {
            const response = await axios.post('/funnel-content', formData, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                setSaveContentAlert({
                    show: true,
                    type: 'success',
                    message: response.data.message || 'Content saved successfully!'
                });

                if (response.data.newContent.emoji_marker !== '0️⃣') {
					setMemoizedContents(prevContents => {
						const newContents = [...prevContents];
						let insertIndex = 0;
						
						while (insertIndex < newContents.length && newContents[insertIndex].pinned === 1) {
							insertIndex++;
						}
						
						newContents.splice(insertIndex, 0, {
							...response.data.newContent,
						});
						
						return newContents;
					});
                }

                setShowAddContentModal(false);
                setUrlContent('');
                setSelectedFiles(null);
                setUserEmail('');
                setAgreeToTerms(false);
            } else {
                throw new Error(response.data.message || 'Failed to save content');
            }
        } catch (error) {
            let errorMessage = 'Failed to save content. Please try again.';

            if (axios.isAxiosError(error)) {
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
            setTimeout(() => setSaveContentAlert(null), 3000);
        }
    };

    const startScrolling = useCallback((direction: 'up' | 'down') => {
        if (scrollInterval.current) clearInterval(scrollInterval.current);

        const scrollStep = 25;
        const scrollDelay = 50;

        scrollInterval.current = setInterval(() => {
            if (mainRef.current) {
                mainRef.current.scrollBy({
                    top: direction === 'up' ? -scrollStep : scrollStep,
                    behavior: 'auto'
                });
            }
        }, scrollDelay);
    }, []);

    useEffect(() => {
        return () => {
            if (scrollInterval.current) {
                clearInterval(scrollInterval.current);
            }
        };
    }, []);

    const handleMouseDown = (direction: 'up' | 'down') => {
        isProgrammaticScrolling.current = true;
        if (direction === 'up') {
            setIsScrollingUp(true);
        } else {
            setIsScrollingDown(true);
        }
        startScrolling(direction);
    };

    const handleMouseUp = () => {
        isProgrammaticScrolling.current = false;
        setIsScrollingUp(false);
        setIsScrollingDown(false);
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
        updateSidebarPosition();
    };

    const handleMouseLeave = () => {
        handleMouseUp();
    };

    const handleTouchStart = (direction: 'up' | 'down') => {
        isProgrammaticScrolling.current = true;
        if (direction === 'up') {
            setIsScrollingUp(true);
        } else {
            setIsScrollingDown(true);
        }
        startScrolling(direction);
    };

    const handleTouchEnd = () => {
        handleMouseUp();
    };

    const handleScrollTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleScrollTouchMove = (e: React.TouchEvent) => {
        if (!touchStartY.current) return;

        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY.current - touchY;

        if (mainRef.current) {
            mainRef.current.scrollBy({
                top: deltaY,
                behavior: 'auto'
            });
        }

        touchStartY.current = touchY;
    };

    const handleScrollTouchEnd = () => {
        touchStartY.current = null;
    };

    const toggleEyeTracking = () => {
        setShowEyeTracking(!showEyeTracking);
        if (showEyeTracking) {
            setSidebarPosition({ right: sidebarwidth });
        } else {
            setSidebarPosition({ right: '4%' });
        }
    };

    useEffect(() => {
        if (eye_tracking === 1) {
            setShowEyeTracking(false);
            setSidebarPosition({ right: sidebarwidth });
        } else {
            setShowEyeTracking(true);
            setSidebarPosition({ right: '4%' });
        }
    }, [eye_tracking]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as HTMLElement;
            if (showShareOptions && !target.closest('.relative')) {
                setShowShareOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showShareOptions]);

    const checkThemeInCollection = async () => {
        if (!auth.user) return;

        const activeTemplate = allTemplates[activeSlideIndex] || template;

        try {
            const response = await axios.get(`/check-theme-collection/${activeTemplate.id}`);
            setIsInCollection(response.data.isInCollection);
        } catch (error) {
            console.error('Error checking theme collection:', error);
        }
    };

    const addToCollection = async () => {
        if (!auth.user) {
            setShowLoginModal(true);
            return;
        }

        const activeTemplate = allTemplates[activeSlideIndex] || template;

        try {
            await axios.post('/add-to-collection', {
                theme_id: activeTemplate.id
            });
            setIsInCollection(true);
            setShowSuccessAlert(true);
            setTimeout(() => setShowSuccessAlert(false), 3000);
        } catch (error) {
            console.error('Error adding to collection:', error);
        }
    };

    useEffect(() => {
        if (auth.user) {
            checkThemeInCollection();
        }
    }, [auth.user, activeSlideIndex]);

    const toggleEffectsDisplay = () => {
        setIsEffectsDisplayVisible(!isEffectsDisplayVisible);
    };

    useEffect(() => {
        if (fly_sign === 0) {
            setIsEffectsDisplayVisible(false);
        } else {
            setIsEffectsDisplayVisible(true);
        }
    }, [fly_sign]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}&color=0b6623&bgcolor=ffffff&qzone=1`);
        }
    }, []);

    useEffect(() => {
        if (template?.image.includes('facebook.com') || template?.image.includes('fb.watch')) {
            const script = document.createElement('script');
            script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, [template]);

    const handleEyeClick = useCallback((content: string | null) => {
        setContentModal({
            show: true,
            content
        });
    }, []);

    const handleSendMagicLink = async () => {
        if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            setSaveContentAlert({
                show: true,
                type: 'error',
                message: 'Please enter a valid email address'
            });
            return;
        }

        try {
            setSaveContentAlert({
                show: true,
                type: 'success',
                message: 'Sending magic link...'
            });

            const response = await axios.post(route('magic-link.send'), {
                email: userEmail,
                redirect_url: window.location.href
            });

            if (response.status === 200) {
                setSuccessMessage('Magic link sent! Check your email.');
                setSaveContentAlert(null);
            }
        } catch (error) {
            let errorMessage = 'Failed to send magic link. Please try again.';

            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }

            setSaveContentAlert({
                show: true,
                type: 'error',
                message: errorMessage
            });
        }
    };

    const sidebarStyle: React.CSSProperties = {
        position: 'absolute',
        top: '1rem',
        zIndex: 10,
        transition: isResizing ? 'none' : 'left 0.3s ease, right 0.3s ease'
    };

    if (!showEyeTracking && sidebarLeft !== null) {
        if (!showEyeTracking && sidebarLeft !== null && viewMode === 'design') {
            sidebarStyle.left = `${sidebarLeft}px`;
         } else {
             sidebarStyle.right = '4%';
         }
    } else {
        sidebarStyle.right = sidebarPosition.right;
    }

    const breakpointColumnsObj = {
        default: 4,
        1280: 4,
        1024: 3,
        768: 2,
        640: 1
    };

    return (
        <>
            <Head>
                <title>Welcome</title>
                <style>{`
                    /* ====================================
                       BEAUTIFUL CUSTOM SCROLLBARS
                       ==================================== */
                    
                    html::-webkit-scrollbar,
                    body::-webkit-scrollbar {
                      width: 16px;
                      height: 16px;
                    }
                    
                    div::-webkit-scrollbar {
                      width: 12px;
                      height: 12px;
                    }
                    
                    iframe::-webkit-scrollbar,
                    model-viewer::-webkit-scrollbar,
                    .w-md-editor::-webkit-scrollbar,
                    .resizable-content::-webkit-scrollbar {
                      width: 10px;
                      height: 10px;
                    }
                    
                    ::-webkit-scrollbar-track {
                      background: linear-gradient(135deg, rgba(45, 55, 72, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
                      border-radius: 10px;
                      border: 1px solid rgba(74, 85, 104, 0.5);
                      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
                      backdrop-filter: blur(4px);
                    }
                    
                    ::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                      border-radius: 10px;
                      border: 2px solid rgba(255, 255, 255, 0.1);
                      box-shadow: 
                        0 2px 4px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                      transition: all 0.3s ease;
                    }
                    
                    ::-webkit-scrollbar-thumb:hover {
                      background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
                      box-shadow: 
                        0 3px 6px rgba(0, 0, 0, 0.4),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                      transform: scale(1.05);
                    }
                    
                    ::-webkit-scrollbar-thumb:active {
                      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                      box-shadow: 
                        0 1px 3px rgba(0, 0, 0, 0.3),
                        inset 0 0 2px rgba(255, 255, 255, 0.1);
                    }
                    
                    ::-webkit-scrollbar-corner {
                      background: rgba(30, 41, 59, 0.8);
                      border-radius: 0 0 4px 0;
                    }
                    
                    * {
                      scrollbar-width: thin;
                      scrollbar-color: #8b5cf6 rgba(30, 41, 59, 0.9);
                    }
                    
                    main::-webkit-scrollbar {
                      width: 14px;
                    }
                    
                    main::-webkit-scrollbar-track {
                      background: linear-gradient(180deg, 
                        rgba(15, 23, 42, 0.9) 0%, 
                        rgba(30, 41, 59, 0.9) 50%,
                        rgba(15, 23, 42, 0.9) 100%
                      );
                      border-left: 1px solid rgba(74, 85, 104, 0.3);
                    }
                    
                    main::-webkit-scrollbar-thumb {
                      background: linear-gradient(180deg, 
                        #8b5cf6 0%, 
                        #7c3aed 30%, 
                        #6d28d9 70%, 
                        #5b21b6 100%
                      );
                      border: 2px solid rgba(255, 255, 255, 0.15);
                    }
                    
                    [class*="sidebar"]::-webkit-scrollbar,
                    [class*="Sidebar"]::-webkit-scrollbar {
                      width: 8px;
                    }
                    
                    [class*="sidebar"]::-webkit-scrollbar-track,
                    [class*="Sidebar"]::-webkit-scrollbar-track {
                      background: rgba(45, 55, 72, 0.7);
                      border-radius: 4px;
                    }
                    
                    [class*="sidebar"]::-webkit-scrollbar-thumb,
                    [class*="Sidebar"]::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                      border-radius: 4px;
                    }
                    
                    [class*="modal"]::-webkit-scrollbar,
                    [class*="Modal"]::-webkit-scrollbar {
                      width: 10px;
                    }
                    
                    [class*="modal"]::-webkit-scrollbar-track,
                    [class*="Modal"]::-webkit-scrollbar-track {
                      background: rgba(31, 41, 55, 0.8);
                      border-radius: 6px;
                    }
                    
                    [class*="modal"]::-webkit-scrollbar-thumb,
                    [class*="Modal"]::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                      border: 1px solid rgba(251, 191, 36, 0.3);
                    }
                    
                    .card::-webkit-scrollbar,
                    .resizable-content::-webkit-scrollbar,
                    .dark-markdown-preview-wrapper::-webkit-scrollbar {
                      width: 6px;
                    }
                    
                    .card::-webkit-scrollbar-track,
                    .resizable-content::-webkit-scrollbar-track,
                    .dark-markdown-preview-wrapper::-webkit-scrollbar-track {
                      background: rgba(55, 65, 81, 0.6);
                      border-radius: 3px;
                    }
                    
                    .card::-webkit-scrollbar-thumb,
                    .resizable-content::-webkit-scrollbar-thumb,
                    .dark-markdown-preview-wrapper::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
                      border-radius: 3px;
                    }
                    
                    .markdown-container::-webkit-scrollbar,
                    .wmde-markdown::-webkit-scrollbar,
                    .w-md-editor-preview::-webkit-scrollbar,
                    .enhanced-md-editor::-webkit-scrollbar {
                      width: 8px;
                    }
                    
                    .markdown-container::-webkit-scrollbar-track,
                    .wmde-markdown::-webkit-scrollbar-track,
                    .w-md-editor-preview::-webkit-scrollbar-track,
                    .enhanced-md-editor::-webkit-scrollbar-track {
                      background: rgba(26, 32, 44, 0.8);
                    }
                    
                    .markdown-container::-webkit-scrollbar-thumb,
                    .wmde-markdown::-webkit-scrollbar-thumb,
                    .w-md-editor-preview::-webkit-scrollbar-thumb,
                    .enhanced-md-editor::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    }
                    
                    html {
                      scroll-behavior: smooth;
                    }
                    
                    @keyframes scrollbarPulse {
                      0%, 100% {
                        opacity: 1;
                      }
                      50% {
                        opacity: 0.7;
                      }
                    }
                    
                    ::-webkit-scrollbar-thumb {
                      animation: scrollbarPulse 2s ease-in-out;
                    }
                    
                    ::-webkit-scrollbar {
                      opacity: 0.5;
                      transition: opacity 0.3s ease;
                    }
                    
                    :hover::-webkit-scrollbar,
                    :focus::-webkit-scrollbar,
                    :active::-webkit-scrollbar {
                      opacity: 1;
                    }
                    
                    .overflow-auto::-webkit-scrollbar,
                    .overflow-y-auto::-webkit-scrollbar,
                    .overflow-x-auto::-webkit-scrollbar {
                      width: 8px;
                      height: 8px;
                    }
                    
                    .overflow-auto::-webkit-scrollbar-track,
                    .overflow-y-auto::-webkit-scrollbar-track,
                    .overflow-x-auto::-webkit-scrollbar-track {
                      background: rgba(75, 85, 99, 0.3);
                      border-radius: 4px;
                    }
                    
                    .overflow-auto::-webkit-scrollbar-thumb,
                    .overflow-y-auto::-webkit-scrollbar-thumb,
                    .overflow-x-auto::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                      border-radius: 4px;
                    }
                    
                    .dark-markdown-preview-wrapper .wmde-markdown::-webkit-scrollbar {
                      width: 8px;
                    }
                    
                    .dark-markdown-preview-wrapper .wmde-markdown::-webkit-scrollbar-track {
                      background: rgba(31, 41, 55, 0.9);
                    }
                    
                    .dark-markdown-preview-wrapper .wmde-markdown::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
                      border: 1px solid rgba(96, 165, 250, 0.3);
                    }
                    
                    .blur-overlay + *::-webkit-scrollbar-track {
                      background: rgba(255, 255, 255, 0.05);
                      backdrop-filter: blur(10px);
                    }
                    
                    .blur-overlay + *::-webkit-scrollbar-thumb {
                      background: linear-gradient(135deg, 
                        rgba(139, 92, 246, 0.8) 0%, 
                        rgba(124, 58, 237, 0.8) 100%
                      );
                      backdrop-filter: blur(5px);
                    }
                    
                    @media (max-width: 768px) {
                      ::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                      }
                      
                      div::-webkit-scrollbar,
                      iframe::-webkit-scrollbar {
                        width: 4px;
                        height: 4px;
                      }
                      
                      main::-webkit-scrollbar {
                        width: 8px;
                      }
                    }
                    
                    @media print {
                      ::-webkit-scrollbar {
                        display: none;
                      }
                      
                      * {
                        scrollbar-width: none;
                      }
                    }
                    
                    .react-tooltip {
                        z-index: 99999 !important;
                        opacity: 1 !important;
                        font-size: 12px;
                        padding: 4px 8px;
                    }
                    @media (max-width: 768px) {
                        .template-content-container {
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            width: 100% !important;
                        }
                        .template-content-container iframe,
                        .template-content-container model-viewer,
                        .template-content-container video,
                        .template-content-container img {
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            width: 100% !important;
                        }
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

            <Tooltip id="main-tooltip" />
            <Tooltip id="view-mode-tooltip" />
            <Tooltip id="scroll-tooltip" />
            <Tooltip id="action-tooltip" />
            <Tooltip id="reaction-tooltip" />
            <Tooltip id="flysign-tooltip" />
            <Tooltip id="theme-tooltip" />
            <Tooltip id="content-tooltip" />
            <Tooltip id="login-tooltip" />
            <Tooltip id="add-content-tooltip" />
            <Tooltip id="search-tooltip" />
            <Tooltip id="social-card-tooltip" />
            <Tooltip id="moderation-tooltip" />
            <Tooltip id="content-tab-tooltip" />
            <Tooltip id="mdeditor-tooltip" />
            
            {showTermsModal && (
              <div className="fixed inset-0 z-5000 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="relative max-w-4xl max-h-[90vh] overflow-y-auto">
                  <TermsAndConditionsContent onClose={() => setShowTermsModal(false)} />
                </div>
              </div>
            )}

            {showPrivacyModal && (
              <div className="fixed inset-0 z-5000 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="relative max-w-4xl max-h-[90vh] overflow-y-auto">
                  <PrivacyPolicyContent onClose={() => setShowPrivacyModal(false)} />
                </div>
              </div>
            )}
            {showSuccessAlert && (
                <div className="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg touch-manipulation">
                    Theme added to your collection!
                </div>
            )}
            {copySuccessAlert && (
                <div className="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg touch-manipulation">
                    Great! The theme URL has been copied to your clipboard.
                </div>
            )}
            {saveContentAlert && (
                <div className={`fixed top-4 right-4 z-[10000] ${saveContentAlert.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2 rounded-md shadow-lg touch-manipulation`}>
                    {saveContentAlert.message}
                </div>
            )}

            {errorMessage && (
                <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-100 flex items-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-100 flex items-center">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    {successMessage}
                </div>
            )}

            {showBalanceModal && (
                <div className="fixed inset-0 flex items-center justify-center z-100 p-4">
                    <div className="backdrop-blur-sm rounded-xl p-6 max-w-md w-full border border-yellow-500">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-yellow-400 flex items-center">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                                Insufficient Balance
                            </h3>
                            <button
                                onClick={() => setShowBalanceModal(false)}
                                className="text-gray-400 hover:text-white"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content={getTooltipContent('action-tooltip', 0)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <p className="text-gray-300 mb-6">
                            You don't have enough EZ$ to complete this purchase. Please purchase more EZ$ to continue.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowBalanceModal(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content={getTooltipContent('action-tooltip', 1)}
                            >
                                Cancel
                            </button>
                            <a
                                href={route('purchase')}
                                target="_blank"
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white font-semibold flex items-center"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content={getTooltipContent('action-tooltip', 2)}
                            >
                                <FontAwesomeIcon icon={faCoins} className="mr-2" />
                                Purchase EZ$
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <FixedModal
              show={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              aria-labelledby="login-modal-title"
              aria-describedby="login-modal-description"
            >
              <div
                className="inline-block mt-25 rounded-lg text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-w-[95vw] touch-manipulation"
                role="dialog"
                aria-modal="true"
              >
                <div className="relative p-6 rounded-2xl bg-gray-800/80 backdrop-blur-sm border-1 border-gray-600 shadow-2xl text-white touch-manipulation">
                  <button
                    className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-400 rounded-full"
                    onClick={() => setShowLoginModal(false)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setShowLoginModal(false);
                    }}
                    aria-label="Close login modal"
                    data-tooltip-id="login-tooltip"
                    data-tooltip-content={getTooltipContent('login-tooltip', 0)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-lime-500/20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-lime-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3
                        id="login-modal-title"
                        className="text-2xl font-bold text-lime-400"
                      >
                        Login Required
                      </h3>
                    </div>

                    <p
                      id="login-modal-description"
                      className="text-gray-300 text-sm leading-relaxed"
                    >
                      You need to log in to add this theme to your collection. Please sign in or cancel to go back.
                    </p>

                                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
                      <button
                        className="relative overflow-hidden group bg-gradient-to-r from-lime-500 to-lime-600 text-gray-900 font-bold py-2 px-6 rounded-lg border-2 border-lime-400 hover:border-white transition-all duration-300 flex items-center justify-center gap-2"
                        onClick={handleSignInClick}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          handleSignInClick();
                        }}
                        data-tooltip-id="login-tooltip"
                        data-tooltip-content={getTooltipContent('login-tooltip', 1)}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3H6a3 3 0 013 3v1" />
                          </svg>
                          SIGN IN
                        </span>
                        <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </FixedModal>

            <FixedModal
  show={showAddContentModal}
  onClose={() => setShowAddContentModal(false)}
  aria-labelledby="add-content-modal-title"
  aria-describedby="add-content-modal-description"
>
  <div className="inline-block w-full max-w-lg rounded-lg text-left transform transition-all sm:my-8 max-h-full sm:align-middle max-w-[95vw] touch-manipulation">
    <div className="relative p-6 rounded-2xl bg-gray-800/80 backdrop-blur-sm border border-gray-600 shadow-2xl text-white touch-manipulation">
      <button
        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-400 rounded-full"
        onClick={() => setShowAddContentModal(false)}
        onTouchEnd={(e) => { e.preventDefault(); setShowAddContentModal(false); }}
        aria-label="Close add content modal"
        data-tooltip-id="add-content-tooltip"
        data-tooltip-content={getTooltipContent('add-content-tooltip', 0)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-lime-500/20">
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5 text-lime-400" />
          </div>
          <h3 id="add-content-modal-title" className="text-2xl font-bold text-lime-400">
            Agree to community rules and Co-WiKi
          </h3>
        </div>

        <div id="add-content-modal-description" className="space-y-4">
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium text-gray-300 mb-1">
              Your Email *
            </label>
            <input
              type="email"
              id="user-email"
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              placeholder="Enter your email"
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
            {!auth.user && !userEmail && (
              <p className="mt-1 text-sm text-red-400">Email is required</p>
            )}
            {!auth.user && userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) && (
              <p className="mt-1 text-sm text-red-400">Please enter a valid email address</p>
            )}
          </div>

          <div className="space-y-4">
                <div className="flex space-x-2 p-1 bg-gray-700/50 rounded-lg">
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                            activeTab === 'text'
                                ? 'bg-lime-500 text-gray-900'
                                : 'text-gray-300 hover:bg-gray-600'
                        }`}
                        data-tooltip-id="content-tab-tooltip"
                        data-tooltip-content="Paste"
                    >
                        Markdown/EmbedCode/URL/SimpleText
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
                            activeTab === 'image'
                                ? 'bg-lime-500 text-gray-900'
                                : 'text-gray-300 hover:bg-gray-600'
                        }`}
                        data-tooltip-id="content-tab-tooltip"
                        data-tooltip-content="PDF/Image"
                    >
                        Upload
                    </button>
                </div>

                <div className="pt-2 min-h-[150px]">
                    {activeTab === 'text' && (
                        <div data-color-mode="dark">
                            <EnhancedMDEditor
                                value={urlContent}
                                onChange={(value) => setUrlContent(value || '')}
                            />
                        </div>
                    )}

                    {activeTab === 'image' && (
                         <div className="space-y-2">
                            {!selectedFiles ? (
                            <label
                              htmlFor="dropzone-file"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 group"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-10 h-10 mb-2 text-gray-500 group-hover:text-lime-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.5861.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm text-gray-400 group-hover:text-lime-300">
                                  <span className="font-semibold">Click to upload</span> or drag & drop
                                </p>
                                <p className="text-xs text-gray-500">SVG, PNG, JPG, GIF, PDF, HTML (Max 100MB)</p>
                              </div>
                              <input id="dropzone-file" type="file" className="hidden" accept="image/*,.pdf,.html,.htm" onChange={handleFileChange} />
                            </label>
                          ) : (
                            <div className="relative group bg-gray-800/40 rounded-lg p-3 border border-gray-600">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded flex items-center justify-center ${
                                  selectedFiles.type === 'application/pdf'
                                    ? 'bg-red-500'
                                    : selectedFiles.name.match(/\.(html|htm)$/i)
                                    ? 'bg-blue-500'
                                    : 'bg-gradient-to-br from-lime-500 to-emerald-500'
                                }`}>
                                  {selectedFiles.type === 'application/pdf' ? (
                                    <FontAwesomeIcon icon={faFilePdf} className="text-white text-sm" />
                                  ) : selectedFiles.name.match(/\.(html|htm)$/i) ? (
                                    <span className="text-white text-sm font-bold">&lt;/&gt;</span>
                                  ) : (
                                    <FontAwesomeIcon icon={faLayerGroup} className="text-white text-sm" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{selectedFiles.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {(selectedFiles.size / 1024 / 1024).toFixed(2)} MB •
                                    {selectedFiles.type === 'application/pdf' ? ' PDF Document' : 
                                     selectedFiles.name.match(/\.(html|htm)$/i) ? ' HTML File' : ' Image'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setSelectedFiles(null)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )}
                         </div>
                    )}
                </div>
            </div>

          <div className="flex items-start space-x-3 py-2">
            <Checkbox
              id="agree_to_terms"
              name="agree_to_terms"
              checked={agreeToTerms}
              onClick={() => setAgreeToTerms(!agreeToTerms)}
              tabIndex={1}
              className="border-2 border-gray-400 data-[state=checked]:border-lime-400"
              data-tooltip-id="add-content-tooltip"
              data-tooltip-content={getTooltipContent('add-content-tooltip', 2)}
            />
            <Label htmlFor="agree_to_terms" className="text-sm leading-normal">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-lime-400 hover:underline focus:outline-none focus:underline"
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
                className="text-lime-400 hover:underline focus:outline-none focus:underline"
                tabIndex={3}
                data-tooltip-id="add-content-tooltip"
                data-tooltip-content={getTooltipContent('add-content-tooltip', 4)}
              >
                Privacy Policy
              </button>
            </Label>
          </div>

          <div className="flex items-start space-x-3 py-2">
            <div className="flex items-center space-x-2">
              <Label className="text-sm leading-normal text-gray-300 font-medium">
                Moderation :{" "}
                <span
                  className={`font-semibold ${
                    visibility === 1 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {visibility === 1 ? "On" : "Off"}
                </span>
              </Label>
              <div
                className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-500 cursor-help transition-colors"
                data-tooltip-id="moderation-tooltip"
                data-tooltip-content={
                  visibility === 1
                    ? "Content is moderated before appearing publicly"
                    : "Content appears immediately without moderation"
                }
              >
                <span className="text-xs text-white">?</span>
              </div>
            </div>
          </div>

          {!agreeToTerms && (
            <p className="mt-1 text-sm text-red-400">You must agree to the Terms and Conditions and Privacy Policy</p>
          )}
          <div className="flex justify-end pt-2">
            <button
              className="relative overflow-hidden group bg-gradient-to-r from-lime-500 to-lime-600 text-gray-900 font-bold py-2 px-6 rounded-lg border-2 border-lime-400 hover:border-white transition-all duration-300 flex items-center justify-center gap-2"
              onClick={() => {
                handleAddContent();
              }}
              disabled={saveContentAlert?.show && saveContentAlert.type === 'success'}
              data-tooltip-id="add-content-tooltip"
              data-tooltip-content={getTooltipContent('add-content-tooltip', 5)}
            >
              <span className="relative z-10 flex items-center gap-2">
                {saveContentAlert?.show && saveContentAlert.type === 'success' && saveContentAlert.message === 'Saving content...' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    SAVING...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    SAVE CONTENT
                  </>
                )}
              </span>
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</FixedModal>

            <FixedModal
              show={showMarketplaceModal}
              onClose={() => {
                setShowMarketplaceModal(false);
                setSuccessMessage('');
              }}
              aria-labelledby="marketplace-modal-title"
              aria-describedby="marketplace-modal-description"
            >
              <div className="inline-block w-full h-full max-w-6xl max-h-[90vh] p-1.5 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800/80 backdrop-blur-sm border-1 border-white border-opacity-30 rounded-lg shadow-xl touch-manipulation">
                <div className="relative w-full h-full touch-manipulation overflow-y-auto">
                  <button
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-400 rounded-full z-10"
                    onClick={() => {
                      setShowMarketplaceModal(false);
                      setSuccessMessage('');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setShowMarketplaceModal(false);
                      setSuccessMessage('');
                    }}
                    aria-label="Close marketplace modal"
                    data-tooltip-id="action-tooltip"
                    data-tooltip-content={getTooltipContent('action-tooltip', 3)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {auth.user ? (
                    <MarketplaceListings
                      auth={auth}
                      initialDomains={domains}
                      initialPagination={pagination}
                      initialFilters={filters}
                      onFilterChange={handleFilterChange}
                      onLoadMore={loadMoreDomains}
                      isLoading={isLoading}
                      onPurchase={handlePurchase}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center rounded-lg p-6">
                      <div className="max-w-md w-full bg-gray-700/80 p-8 rounded-xl shadow-lg border border-gray-600">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 rounded-full bg-lime-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                          <h3 id="marketplace-modal-title" className="text-2xl font-bold text-lime-400">Marketplace Access</h3>
                        </div>

                        <div id="marketplace-modal-description" className="space-y-4">
                          {successMessage && (
                            <div className="p-3 bg-green-900/50 border border-green-600 text-green-100 rounded-lg flex justify-between items-center">
                              <span>{successMessage}</span>
                              <button
                                onClick={() => setSuccessMessage('')}
                                className="text-green-300 hover:text-white"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}

                          <p className="text-gray-300">
                            Please enter your email to receive a magic link for accessing the marketplace.
                          </p>

                          <div>
                            <label htmlFor="magic-link-email" className="block text-sm font-medium text-gray-300 mb-1">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              id="magic-link-email"
                              className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                              placeholder="your@email.com"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              disabled={saveContentAlert?.show && saveContentAlert.type === 'success'}
                              required
                              data-tooltip-id="main-tooltip"
                              data-tooltip-content={getTooltipContent('main-tooltip', 3)}
                            />
                            {!userEmail && (
                              <p className="mt-1 text-sm text-red-400">Email is required</p>
                            )}
                            {userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) && (
                              <p className="mt-1 text-sm text-red-400">Please enter a valid email address</p>
                            )}
                          </div>

                          <div className="pt-2">
                            <button
                              className="w-full bg-gradient-to-r from-lime-500 to-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg border-2 border-lime-400 hover:border-white transition-all duration-300 flex items-center justify-center gap-2"
                              onClick={() => {
                                if (!userEmail) {
                                  setSaveContentAlert({
                                    show: true,
                                    type: 'error',
                                    message: 'Email is required'
                                  });
                                  return;
                                }

                                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
                                  setSaveContentAlert({
                                    show: true,
                                    type: 'error',
                                    message: 'Please enter a valid email address'
                                  });
                                  return;
                                }

                                handleSendMagicLink();
                              }}
                              disabled={saveContentAlert?.show && saveContentAlert.type === 'success'}
                              data-tooltip-id="action-tooltip"
                              data-tooltip-content={getTooltipContent('action-tooltip', 4)}
                            >
                              <span className="flex items-center justify-center gap-2">
                                {saveContentAlert?.show && saveContentAlert.type === 'success' && saveContentAlert.message === 'Sending magic link...' ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    SENDING...
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    SEND MAGIC LINK
                                  </>
                                )}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FixedModal>

            <FixedModal
              show={contentModal.show}
              onClose={() => setContentModal({show: false, content: null})}
              aria-labelledby="content-details-title"
              aria-describedby="content-details-description"
            >
              <div className="inline-block w-full max-w-4xl rounded-lg text-left overflow-hidden transform transition-all max-w-[95vw] touch-manipulation">
                <div className="relative p-6 rounded-2xl bg-gray-800/90 backdrop-blur-sm border border-gray-600 shadow-2xl text-white touch-manipulation">
                  <button
                    className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-400 rounded-full"
                    onClick={() => setContentModal({show: false, content: null})}
                    onTouchEnd={(e) => { e.preventDefault(); setContentModal({show: false, content: null}); }}
                    aria-label="Close content details modal"
                    data-tooltip-id="content-tooltip"
                    data-tooltip-content={getTooltipContent('content-tooltip', 4)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="space-y-4">
                    <h3 id="content-details-title" className="text-xl font-bold text-lime-400">
                      Content Details
                    </h3>

                    <div id="content-details-description" className="bg-gray-700/50 p-4 rounded-lg max-h-[70vh] overflow-auto">
                      {contentModal.content ? (
                        <div dangerouslySetInnerHTML={{ __html: contentModal.content }} />
                      ) : (
                        <p className="text-gray-400">No content available</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg border border-gray-600 transition-colors duration-200"
                        onClick={() => setContentModal({show: false, content: null})}
                        data-tooltip-id="content-tooltip"
                        data-tooltip-content={getTooltipContent('content-tooltip', 5)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </FixedModal>

            <FixedModal
              show={showQrCodeModal}
              onClose={() => setShowQrCodeModal(false)}
              aria-labelledby="qr-code-modal-title"
            >
            <div className="inline-block w-full max-w-2xl p-1.5 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800/80 backdrop-blur-md border-1 border-white border-opacity-30 rounded-lg shadow-xl touch-manipulation">
                        <div className="relative touch-manipulation">
                            <button
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-400 rounded-full"
                                onClick={() => setShowQrCodeModal(false)}
                                onTouchEnd={(e) => { e.preventDefault(); setShowQrCodeModal(false); }}
                                aria-label="Close QR code modal"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content={getTooltipContent('action-tooltip', 13)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            <div className="flex flex-col md:flex-row gap-2 touch-manipulation">
                                <div className="flex items-center justify-center flex-1 p-4 rounded-md min-h-[250px] md:min-h-[300px] touch-manipulation">
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="QR Code" className="w-full rounded-lg max-w-[220px] touch-manipulation" />
                                    ) : (
                                        <p className="text-gray-500 touch-manipulation">Generating QR Code...</p>
                                    )}
                                </div>
                                <div className="flex items-center justify-center flex-1 p-4 rounded-md min-h-[250px] md:min-h-[300px] touch-manipulation">
                                    {qrcodelogo ? (
                                        <img src={qrcodelogo} alt="QR Code" className="w-full rounded-lg max-w-[220px] touch-manipulation" />
                                    ) : (
                                        <p className="text-gray-500 touch-manipulation">Generating QR Code...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
            </FixedModal>

            <main className={`relative flex min-h-screen overflow-y-auto touch-manipulation ${
    template?.image.split('.').pop()?.toLowerCase() &&
    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico']
        .includes(template.image.split('.').pop()?.toLowerCase() || '') ? 'blur-bg' : ''}`}>

                {blurStyle}

                <div className="absolute inset-0 z-0 touch-manipulation overflow-y-auto template-content-container">
                  {memoizedBackgroundContent}
                </div>
				<Chatbot />
                {isEffectsDisplayVisible && (
                  effect ? <EffectsDisplay effects={effect} /> : <FlyingSaucer />
                )}
                <div
                    className={`fixed top-[-6px] left-[-71px] w-[176px] ${
                        isEffectsDisplayVisible ? 'bg-red-600' : 'bg-green-600'
                    } text-white text-[12px] font-bold text-center py-[10px] pb-[5px] shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation`}
                    onClick={toggleEffectsDisplay}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        toggleEffectsDisplay();
                    }}
                    data-tooltip-id="flysign-tooltip"
                    data-tooltip-content={isEffectsDisplayVisible ? getTooltipContent('flysign-tooltip', 0) : getTooltipContent('flysign-tooltip', 1)}
                    data-tooltip-place="right"
                >
                    {isEffectsDisplayVisible ? 'OFF' : 'ON'} <br /> Fly-Sign
                </div>
				{displaymode === 'dressed' && (
                <Draggable nodeRef={viewModeRef} cancel=".non-draggable">
                    <div
                        ref={viewModeRef}
                        style={{ display: showEyeTracking ? 'block' : 'none' }}
                        className="absolute top-[50px] p-5 left-[100px] z-[1001] touch-manipulation"
                        data-tooltip-id="action-tooltip"
                        data-tooltip-content={getTooltipContent('action-tooltip', 5)}
                    >
                        <div className="flex flex-col items-center touch-manipulation"
                            onClick={toggleEyeTracking}
                            onTouchStart={(e) => {
                                e.currentTarget.dataset.touchX = String(e.touches[0].clientX);
                                e.currentTarget.dataset.touchY = String(e.touches[0].clientY);
                            }}
                            onTouchEnd={(e) => {
                                const touchX = e.changedTouches[0].clientX;
                                const touchY = e.changedTouches[0].clientY;
                                const startX = parseFloat(e.currentTarget.dataset.touchX || '0');
                                const startY = parseFloat(e.currentTarget.dataset.touchY || '0');

                                if (Math.abs(touchX - startX) < 10 && Math.abs(touchY - startY) < 10) {
                                    e.preventDefault();
                                    toggleEyeTracking();
                                }
                            }}
                        >
                            <div className="cursor-pointer touch-manipulation" data-tooltip-id="action-tooltip" data-tooltip-content={getTooltipContent('action-tooltip', 6)}>
                                <picture>
                                        <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.webp" type="image/webp" />
                                        <img
                                            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif"
                                            alt="👀"
                                            width="100"
                                            height="100"
                                            className="emoji-eye cursor-pointer touch-manipulation"
                                        />
                                    </picture>
                            </div>

                            <div
                                className="cursor-pointer mt-2 px-6 py-2 bg-[#3A6A7E] text-[#9EE493] font-bold rounded-full text-lg shadow-lg non-draggable touch-manipulation"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content={getTooltipContent('action-tooltip', 6)}
                            >
                                See More
                            </div>
                        </div>
                    </div>
                </Draggable>
				)}
                <div
                    className="fixed top-[29px] left-[-38px] w-[163px] bg-black text-white text-[12px] font-bold text-center py-1 shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation"
                    onClick={() => {
                        setViewMode(prev => {
                            const nextViewMode = prev === 'design' ? 'tile' :
                                                 prev === 'tile' ? 'theme' :
                                                 'design';
                            if ((nextViewMode === 'design' || nextViewMode === 'tile') && showEyeTracking) {
                                toggleEyeTracking();
                            }
                            return nextViewMode;
                        });
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        setViewMode(prev => {
                            const nextViewMode = prev === 'design' ? 'tile' :
                                                 prev === 'tile' ? 'theme' :
                                                 'design';
                            if ((nextViewMode === 'design' || nextViewMode === 'tile') && showEyeTracking) {
                                toggleEyeTracking();
                            }
                            return nextViewMode;
                        });
                    }}
                    data-tooltip-id="view-mode-tooltip"
                    data-tooltip-content={
                        viewMode === 'design' ? getTooltipContent('view-mode-tooltip', 0) :
                        viewMode === 'tile' ? getTooltipContent('view-mode-tooltip', 1) :
                        getTooltipContent('view-mode-tooltip', 2)
                    }
                    data-tooltip-place="right"
                >
                    {viewMode === 'design' ? 'Design View' :
                     viewMode === 'tile' ? 'Tile View' :
                     'Theme Only'}
                </div>
				{displaymode === 'dressed' && viewMode !== 'theme' && (
					<div className="fixed flex items-center justify-center top-[48px] left-[-39px] w-[230px] h-[22px] bg-gray-500/50 text-white text-[12px] font-bold shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation"
						data-tooltip-id="main-tooltip"
						data-tooltip-content={getTooltipContent('main-tooltip', 4)}
						data-tooltip-place="right"
					>
						<a href={`https://ez.wiki/${funnel}`} target="_blank" className="mr-1">{funnel}</a>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							fill="currentColor"
							className="w-3 h-3 text-white hover:text-blue-300 cursor-pointer transition-colors inline-block"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								const url = `https://ez.wiki/${funnel}`;
								navigator.clipboard.writeText(url)
									.then(() => {
										console.log('URL copied to clipboard');
									})
									.catch(err => {
										console.error('Failed to copy URL: ', err);
									});
							}}
							onTouchEnd={(e) => {
								e.preventDefault();
								e.stopPropagation();
								const url = `https://ez.wiki/${funnel}`;
								navigator.clipboard.writeText(url)
									.then(() => {
										console.log('URL copied to clipboard');
									})
									.catch(err => {
										console.error('Failed to copy URL: ', err);
									});
							}}
							data-tooltip-id="main-tooltip"
							data-tooltip-content="Copy URL to clipboard"
							data-tooltip-place="right"
						>
							<path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
						</svg>
					</div>
				)}

				{displaymode === 'naked' && viewMode !== 'theme' && (
					<div
                        className="fixed top-[48px] left-[-39px] w-[200px] h-[22px] bg-gray-500/50 text-white text-[12px] font-bold shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation"
                        data-tooltip-id="theme-tooltip"
                        data-tooltip-content={isInCollection ? getTooltipContent('theme-tooltip', 2) : getTooltipContent('theme-tooltip', 3)}
                        data-tooltip-place="right"
                    >
                        <span className="flex items-center justify-center w-full gap-1 touch-manipulation">
                            <a href={`https://ez.wiki/${allTemplates[activeSlideIndex]?.unique_id || template.unique_id}`} target="_blank">{allTemplates[activeSlideIndex]?.unique_id || template.unique_id}</a> EZ$ {allTemplates[activeSlideIndex]?.price || template.price}
                            <span
                                onClick={addToCollection}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    addToCollection();
                                }}
                                className="cursor-pointer touch-manipulation"
                                data-tooltip-id="theme-tooltip"
                                data-tooltip-content={isInCollection ? getTooltipContent('theme-tooltip', 4) : getTooltipContent('theme-tooltip', 5)}
                            >
                                {isInCollection ? '❤️' : '🤍'}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="w-4 h-4 text-white hover:text-blue-500 cursor-pointer transition-colors touch-manipulation"
                                onClick={() => {
                                    const activeTemplate = allTemplates[activeSlideIndex] || template;
                                    const url = `https://ez.wiki/${activeTemplate.unique_id}`;
                                    navigator.clipboard.writeText(url)
                                        .then(() => {
                                            setCopySuccessAlert(true);
                                            setTimeout(() => setCopySuccessAlert(false), 3000);
                                        })
                                        .catch(err => {
                                            console.error('Failed to copy URL: ', err);
                                            setCopySuccessAlert(false);
                                        });
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    const activeTemplate = allTemplates[activeSlideIndex] || template;
                                    const url = `https://ez.wiki/${activeTemplate.unique_id}`;
                                    navigator.clipboard.writeText(url)
                                        .then(() => {
                                            setCopySuccessAlert(true);
                                            setTimeout(() => setCopySuccessAlert(false), 3000);
                                        })
                                        .catch(err => {
                                            console.error('Failed to copy URL: ', err);
                                            setCopySuccessAlert(false);
                                        });
                                }}
                                data-tooltip-id="theme-tooltip"
                                data-tooltip-content={getTooltipContent('theme-tooltip', 6)}
                                data-tooltip-place="right"
                            >
                                                                <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                            </svg>
                        </span>
                    </div>
				)}
				{displaymode === 'dressed' && viewMode === 'theme' && (
                    <div
                        className="fixed top-[48px] left-[-39px] w-[200px] h-[22px] bg-gray-500/50 text-white text-[12px] font-bold shadow-md z-[9999] transform -rotate-45 cursor-pointer touch-manipulation"
                        data-tooltip-id="theme-tooltip"
                        data-tooltip-content={isInCollection ? getTooltipContent('theme-tooltip', 2) : getTooltipContent('theme-tooltip', 3)}
                        data-tooltip-place="right"
                    >
                        <span className="flex items-center justify-center w-full gap-1 touch-manipulation">
                            <a href={`https://ez.wiki/${allTemplates[activeSlideIndex]?.unique_id || template.unique_id}`} target="_blank">{allTemplates[activeSlideIndex]?.unique_id || template.unique_id}</a> EZ$ {allTemplates[activeSlideIndex]?.price || template.price}
                            <span
                                onClick={addToCollection}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    addToCollection();
                                }}
                                className="cursor-pointer touch-manipulation"
                                data-tooltip-id="theme-tooltip"
                                data-tooltip-content={isInCollection ? getTooltipContent('theme-tooltip', 4) : getTooltipContent('theme-tooltip', 5)}
                            >
                                {isInCollection ? '❤️' : '🤍'}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="w-4 h-4 text-white hover:text-blue-500 cursor-pointer transition-colors touch-manipulation"
                                onClick={() => {
                                    const activeTemplate = allTemplates[activeSlideIndex] || template;
                                    const url = `https://ez.wiki/${activeTemplate.unique_id}`;
                                    navigator.clipboard.writeText(url)
                                        .then(() => {
                                            setCopySuccessAlert(true);
                                            setTimeout(() => setCopySuccessAlert(false), 3000);
                                        })
                                        .catch(err => {
                                            console.error('Failed to copy URL: ', err);
                                            setCopySuccessAlert(false);
                                        });
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    const activeTemplate = allTemplates[activeSlideIndex] || template;
                                    const url = `https://ez.wiki/${activeTemplate.unique_id}`;
                                    navigator.clipboard.writeText(url)
                                        .then(() => {
                                            setCopySuccessAlert(true);
                                            setTimeout(() => setCopySuccessAlert(false), 3000);
                                        })
                                        .catch(err => {
                                            console.error('Failed to copy URL: ', err);
                                            setCopySuccessAlert(false);
                                        });
                                }}
                                data-tooltip-id="theme-tooltip"
                                data-tooltip-content={getTooltipContent('theme-tooltip', 6)}
                                data-tooltip-place="right"
                            >
                                                                <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                            </svg>
                        </span>
                    </div>
                )}
                {!showEyeTracking && (
                    <>
                        {viewMode !== 'theme' && (
                            <div
                                ref={mainRef}
                                className={`w-full h-screen overflow-y-auto touch-manipulation ${
                                    viewMode === 'design' ? 'flex flex-col space-y-8' : 'flex flex-wrap'
                                }`}
                                onScroll={updateSidebarPosition}
                                onTouchStart={handleScrollTouchStart}
                                onTouchMove={handleScrollTouchMove}
                                onTouchEnd={handleScrollTouchEnd}
                            >
                                {memoizedContents.map((content, index) => (
                                    <ResizableContent
                                        key={content.id}
                                        content={content}
                                        onEyeClick={handleEyeClick}
                                        index={index}
                                        mode={mode}
                                        color={color}
                                        transparency={transparency}
                                        funnel={funnel}
                                        onResizeStart={handleResizeStart}
                                        onResize={handleContentResize}
                                        onResizeStop={handleResizeStop}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
	{displaymode === 'dressed' && (
                <Draggable nodeRef={sidebarRef}>
  <div
    ref={sidebarRef}
    className="space-x-4 z-1000 touch-manipulation"
    style={sidebarStyle}
    data-tooltip-id="main-tooltip"
    data-tooltip-content={getTooltipContent('main-tooltip', 5)}
  >
    <div className="flex w-16 flex-col items-center space-y-3 from-sky-300 via-teal-500 to-green-700 py-4 touch-manipulation">

      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 transition-all duration-300 cursor-pointer touch-manipulation group shadow-xl border border-slate-600/60 backdrop-blur-lg"
        data-tooltip-id="view-mode-tooltip"
        data-tooltip-content={
          viewMode === 'design' ? getTooltipContent('view-mode-tooltip', 0) :
          viewMode === 'tile' ? getTooltipContent('view-mode-tooltip', 1) :
          getTooltipContent('view-mode-tooltip', 2)
        }
        data-tooltip-place="left"
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white font-bold shadow-lg touch-manipulation transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:from-blue-400 group-hover:to-blue-600"
          onClick={() => {
            setViewMode(prev => {
              const nextViewMode = prev === 'design' ? 'tile' :
                                   prev === 'tile' ? 'theme' :
                                   'design';
              if ((nextViewMode === 'design' || nextViewMode === 'tile') && showEyeTracking) {
                toggleEyeTracking();
              }
              return nextViewMode;
            });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setViewMode(prev => {
              const nextViewMode = prev === 'design' ? 'tile' :
                                   prev === 'tile' ? 'theme' :
                                   'design';
              if ((nextViewMode === 'design' || nextViewMode === 'tile') && showEyeTracking) {
                toggleEyeTracking();
              }
              return nextViewMode;
            });
          }}
        >
          <span className="text-sm font-bold touch-manipulation drop-shadow-md transition-transform duration-300 group-hover:scale-125">
            {viewMode === 'design' ? 'A' :
             viewMode === 'tile' ? 'B' :
             'C'}
          </span>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500 pointer-events-none"></div>
      </div>

<div
  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100/80 hover:bg-pink-200/90 transition-all duration-300 cursor-pointer touch-manipulation group shadow-xl border border-pink-300/60 backdrop-blur-lg"
  onClick={() => {
    setShowAddContentModal(true);
    toggleEyeTracking();
  }}
  onTouchEnd={(e) => {
    e.preventDefault();
    setShowAddContentModal(true);
    toggleEyeTracking();
  }}
  data-tooltip-id="content-tooltip"
  data-tooltip-content={getTooltipContent('content-tooltip', 3)}
  data-tooltip-place="left"
>
  <div className="relative touch-manipulation transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-12 active:scale-95">
    <div className="w-7 h-7 touch-manipulation flex items-center justify-center">
      <span className="text-xs font-bold bg-gradient-to-r from-pink-500 to-red-600 bg-clip-text text-transparent drop-shadow-lg transition-all duration-300 ease-out group-hover:brightness-125 group-hover:drop-shadow-xl select-none pointer-events-none">
        Co-WiKi
      </span>
    </div>
  </div>
  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-pink-200 shadow-lg animate-ping"></div>
  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-pink-200"></div>
  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-pink-400/50 to-red-500/50 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500 pointer-events-none"></div>
</div>

      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 transition-all duration-300 cursor-pointer touch-manipulation group shadow-xl border border-slate-600/60 backdrop-blur-lg"
        onClick={() => window.open(getParentDomain(), "_blank", "noopener,noreferrer")}
        data-tooltip-id="main-tooltip"
        data-tooltip-content={getTooltipContent('main-tooltip', 1)}
        data-tooltip-place="left"
      >
        <div className="relative touch-manipulation transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-0.5">
          <span className="text-2xl touch-manipulation drop-shadow-lg transition-transform duration-300 group-hover:scale-125">🏠</span>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500 pointer-events-none"></div>
      </div>

      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 transition-all duration-300 cursor-pointer touch-manipulation group shadow-xl border border-slate-600/60 backdrop-blur-lg"
        onClick={() => setShowMarketplaceModal(true)}
        onTouchEnd={(e) => {
          e.preventDefault();
          setShowMarketplaceModal(true);
        }}
        data-tooltip-id="main-tooltip"
        data-tooltip-content={getTooltipContent('main-tooltip', 2)}
        data-tooltip-place="left"
      >
        <div className="relative touch-manipulation transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
          <span className="text-2xl touch-manipulation drop-shadow-lg transition-transform duration-300 group-hover:scale-125">🏆</span>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-slate-800 shadow-lg animate-pulse"></div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500 pointer-events-none"></div>
      </div>

      <div className="relative touch-manipulation">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 transition-all duration-300 cursor-pointer touch-manipulation group shadow-xl border border-slate-600/60 backdrop-blur-lg"
          onClick={() => setShowShareOptions(!showShareOptions)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setShowShareOptions(!showShareOptions);
          }}
          data-tooltip-id="action-tooltip"
          data-tooltip-content={getTooltipContent('action-tooltip', 7)}
          data-tooltip-place="left"
        >
          <div className="relative touch-manipulation transition-all duration-500 group-hover:scale-110 group-hover:-rotate-45">
            <span className="text-xl text-white touch-manipulation drop-shadow-lg transition-all duration-300 group-hover:text-blue-300">🔗</span>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500 pointer-events-none"></div>
        </div>

        {showShareOptions && (
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 flex flex-col gap-3 rounded-2xl bg-slate-800/95 backdrop-blur-xl p-3 z-50 touch-manipulation shadow-2xl border border-slate-600/50 animate-in slide-in-from-right-8 duration-300">
            {[
              { icon: faTwitter, color: 'bg-blue-500 hover:bg-blue-400', tooltip: 8 },
              { icon: faFacebook, color: 'bg-blue-600 hover:bg-blue-500', tooltip: 9 },
              { icon: faLinkedin, color: 'bg-blue-700 hover:bg-blue-600', tooltip: 10 },
              { icon: faPinterest, color: 'bg-red-600 hover:bg-red-500', tooltip: 11 },
              { icon: faQrcode, color: 'bg-purple-600 hover:bg-purple-500', tooltip: 12 }
            ].map((item, index) => (
              <button
                key={index}
                className={`flex items-center justify-center w-11 h-11 rounded-xl ${item.color} text-white hover:scale-110 transition-all duration-300 shadow-lg touch-manipulation transform hover:rotate-6 hover:shadow-xl`}
                onClick={() => {
                  if (item.icon === faQrcode) {
                    setShowQrCodeModal(true);
                  } else {
                    const urls = {
                      [faTwitter]: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`,
                      [faFacebook]: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                      [faLinkedin]: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                      [faPinterest]: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}`
                    };
                    window.open(urls[item.icon], '_blank');
                  }
                  setShowShareOptions(false);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                }}
                data-tooltip-id="action-tooltip"
                data-tooltip-content={getTooltipContent('action-tooltip', item.tooltip)}
                data-tooltip-place="left"
              >
                <FontAwesomeIcon icon={item.icon} className="text-lg touch-manipulation transition-transform duration-300 hover:scale-125" />
              </button>
            ))}
          </div>
        )}
      </div>

      {!showEyeTracking && viewMode !== 'theme' && !isMobile && (
        <div
          className="flex h-20 w-12 flex-col items-center justify-between rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 transition-all duration-300 cursor-pointer touch-manipulation group shadow-xl border border-slate-600/60 backdrop-blur-lg py-2"
          onMouseLeave={handleMouseLeave}
          onTouchEnd={handleTouchEnd}
          data-tooltip-id="scroll-tooltip"
          data-tooltip-content={getTooltipContent('scroll-tooltip', 0)}
          data-tooltip-place="left"
        >
          <span
            className={`text-xl ${isScrollingUp ? 'text-blue-400 scale-125' : 'text-slate-300'} hover:text-blue-300 touch-manipulation transition-all duration-200 drop-shadow-lg transform hover:scale-125`}
            onMouseDown={() => handleMouseDown('up')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
              e.preventDefault();
              mainRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
            }}
            onTouchStart={() => handleTouchStart('up')}
            onTouchEnd={handleTouchEnd}
            data-tooltip-id="scroll-tooltip"
            data-tooltip-content={getTooltipContent('scroll-tooltip', 1)}
            data-tooltip-place="left"
          >
            ▲
          </span>
          <div className="w-4 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full"></div>
          <span
            className={`text-xl ${isScrollingDown ? 'text-blue-400 scale-125' : 'text-slate-300'} hover:text-blue-300 touch-manipulation transition-all duration-200 drop-shadow-lg transform hover:scale-125`}
            onMouseDown={() => handleMouseDown('down')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => {
              e.preventDefault();
              mainRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
            }}
            onTouchStart={() => handleTouchStart('down')}
            onTouchEnd={handleTouchEnd}
            data-tooltip-id="scroll-tooltip"
            data-tooltip-content={getTooltipContent('scroll-tooltip', 2)}
            data-tooltip-place="left"
          >
            ▼
          </span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500 pointer-events-none"></div>
        </div>
      )}

      <div
        className="flex h-24 w-12 flex-col items-center justify-center gap-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 transition-all duration-300 cursor-pointer touch-manipulation group shadow-2xl border border-slate-600/60 backdrop-blur-lg"
        onClick={toggleEyeTracking}
        onTouchEnd={(e) => {
          e.preventDefault();
          toggleEyeTracking();
        }}
        data-tooltip-id="action-tooltip"
        data-tooltip-content={showEyeTracking ? getTooltipContent('action-tooltip', 14) : getTooltipContent('action-tooltip', 15)}
        data-tooltip-place="left"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full shadow-lg touch-manipulation transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse">
          <span className="text-xs font-bold text-white drop-shadow-md">{count}</span>
        </div>

        <div className="relative touch-manipulation transition-all duration-500 group-hover:scale-110 my-1">
          <picture>
            <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.webp" type="image/webp" />
            <img
              src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif"
              alt="👀"
              width="32"
              height="32"
              className="emoji-eye cursor-pointer touch-manipulation drop-shadow-lg filter brightness-110 transition-all duration-300 group-hover:brightness-125"
              draggable="false"
            />
          </picture>

            <div className="absolute inset-0 -m-1 rounded-full border-2 border-green-400/80 animate-ping"></div>

          <div className="absolute inset-0 -m-1 rounded-full transition-all duration-500 bg-gradient-to-br from-green-400/30 to-emerald-400/20 animate-pulse"></div>
        </div>

        <div className="flex flex-col items-center justify-center mt-0.5 z-10">
          {showEyeTracking ? (
            <div className="flex flex-col items-center space-y-1">
              <span className="text-[11px] font-black leading-none tracking-tight transition-all duration-300 text-center text-white drop-shadow-md">
				  See More
				</span>
              <div className="flex items-center space-x-1.5 text-green-400/90 animate-bounce duration-1000">
                <span className="text-[10px] transition-transform duration-300 group-hover:translate-x-0.5">➡️</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <span className="text-[11px] font-black leading-none tracking-tight transition-all duration-300 text-center text-white drop-shadow-md">
				  See Less
				</span>
              <div className="flex items-center space-x-1.5 text-slate-400/80 group-hover:text-slate-300/90 transition-colors duration-300">
                <span className="text-[10px] transition-transform duration-300 group-hover:-translate-x-0.5">⬅️</span>
              </div>
            </div>
          )}
        </div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        <div className={`absolute -inset-1 rounded-2xl pointer-events-none transition-all duration-500 ${
          showEyeTracking
            ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20 blur-sm opacity-100'
            : 'bg-gradient-to-br from-slate-500/10 to-slate-600/5 opacity-0 group-hover:opacity-100 blur-sm'
        }`}></div>
      </div>
		
      <div
        className="relative h-20 w-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 transition-all duration-300 cursor-pointer touch-manipulation group shadow-xl border border-slate-600/60 backdrop-blur-lg"
        onClick={() => { }}
        onTouchEnd={(e) => { e.preventDefault(); }}
        data-tooltip-id="main-tooltip"
        data-tooltip-content={getTooltipContent('main-tooltip', 6)}
        data-tooltip-place="left"
      >
        <div className="absolute left-1/2 top-2 -translate-x-1/2 flex h-12 w-14 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-xl touch-manipulation transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:from-orange-300 group-hover:to-orange-500">
          <span className="text-xs font-bold leading-tight text-white text-shadow touch-manipulation drop-shadow-md transition-all duration-300 group-hover:scale-105">
            {auth.user ? (
              parseFloat(auth.user.bee_points_balance || '0').toFixed(2)
            ) : userEmail ? (
              <UserBalanceDisplay email={userEmail} />
            ) : (
              '0.00'
            )}
          </span>
          <span className="text-[10px] font-semibold leading-tight text-white text-shadow touch-manipulation drop-shadow-md mt-0.5 transition-all duration-300 group-hover:scale-105">EZ$</span>
        </div>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-2xl touch-manipulation drop-shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:brightness-125">💡</span>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500 pointer-events-none"></div>
      </div>
    </div>
  </div>
</Draggable>
)}
            </main>
        </>
    );
}