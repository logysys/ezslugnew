import AppLogoIcon from '@/components/app-logo-icon';
import DraggableMenu from '@/components/DraggableMenu';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import '@google/model-viewer';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHome, 
    faLayerGroup,
    faCloudDownloadAlt,
    faHandPointer,
    faGlobe,
    faSignOutAlt,
    faColumns, 
    faDownload, 
    faSignInAlt, 
    faUserPlus,
    faPalette,
    faSearch,
    faImage,
    faHashtag,
    faSave,
    faTrashAlt,
    faTimes,
    faInfoCircle,
    faEdit,
    faPlus,
    faUpload,
    faCheckCircle,
    faFont,
    faFillDrip,
    faEyedropper,
    faTable,
    faCode,
    faBolt,
    faShare,
    faFile // Added for file icon
} from '@fortawesome/free-solid-svg-icons';
import { debounce } from 'lodash';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
// Import MDEditor with custom commands
import MDEditor, { commands, ICommand, TextState, TextAreaTextApi } from '@uiw/react-md-editor';
import "@uiw/react-md-editor/markdown-editor.css";

// Constants
const YOUTUBE_REGEX = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|feed|showcase|embed\/feed\/update\/urn:li:[^/]+:[^"&?/ ]+)/i;
const VIMEO_REGEX = /^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im;
const FB_WATCH_REGEX = /^(https?:\/\/)?(www\.)?fb\.watch\/[a-zA-Z0-9(\.\?)?]/;
const FACEBOOK_REGEX = /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/;
const IFRAME_REGEX = /<iframe.*?src=["'](.*?)["'].*?>.*?<\/iframe>/is;
const BLOCKQUOTE_REGEX = /<blockquote/;

const VALID_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'apng', 'svg', 'ico'];
const VALID_DOCUMENT_EXTENSIONS = ['ppt', 'pptx', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'pages', 'ai', 'psd', 'eps', 'ttf', 'dxf', 'xps', 'rar', 'zip', 'ods', 'odt', 'odp'];

// Advanced Color Picker Component
const ColorPickerModal = ({ 
  isOpen, 
  onClose, 
  onColorSelect, 
  isBackground = false,
  currentColor = '#FF0000'
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [customColor, setCustomColor] = useState(currentColor);

  const presetColors = [
    '#FF0000', '#FF4500', '#FFA500', '#FFD700', '#FFFF00', '#ADFF2F', '#32CD32', '#00FF00',
    '#00FA9A', '#40E0D0', '#1E90FF', '#0000FF', '#8A2BE2', '#FF00FF', '#FF1493', '#FF69B4',
    '#FFFFFF', '#F5F5F5', '#D3D3D3', '#A9A9A9', '#696969', '#000000', '#2F4F4F', '#800000'
  ];

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setCustomColor(color);
  };

  const handleApply = () => {
    onColorSelect(selectedColor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={isBackground ? faFillDrip : faFont} />
            {isBackground ? 'Background Color' : 'Text Color'}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-white text-sm" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div 
            className="p-4 rounded-lg text-center font-semibold text-lg transition-all duration-300"
            style={{
              backgroundColor: isBackground ? selectedColor : 'transparent',
              color: isBackground ? '#000000' : selectedColor,
              border: isBackground ? 'none' : `2px solid ${selectedColor}`
            }}
          >
            Preview Text
          </div>
        </div>

        {/* Preset Colors */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-3">Preset Colors</label>
          <div className="grid grid-cols-8 gap-2">
            {presetColors.map((color, index) => (
              <button
                key={index}
                className={`w-8 h-8 rounded-lg border-2 transition-all transform hover:scale-110 ${
                  selectedColor === color ? 'border-white ring-2 ring-blue-400' : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Custom Color Picker */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-3">Custom Color</label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setSelectedColor(e.target.value);
                }}
                className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer"
              />
              <FontAwesomeIcon 
                icon={faEyedropper} 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs pointer-events-none"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    setSelectedColor(e.target.value);
                  }
                }}
                placeholder="#FFFFFF"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Selected Color Display */}
        <div className="mb-6 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Selected Color:</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded border border-gray-500"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-white font-mono text-sm">{selectedColor}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Apply Color
          </button>
        </div>
      </div>
    </div>
  );
};

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

// Enhanced MDEditor with color commands
const EnhancedMDEditor = ({ value, onChange }: { value: string; onChange: (value?: string) => void }) => {
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
    advancedTableCommand, // Use advanced table instead of simple table
    macrosCommand,        // Add macros command
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
      />
      <Tooltip id="mdeditor-tooltip" />
    </div>
  );
};

export default function Welcome() {
  const { auth, template, themecollection, alltheme, hasMoreThemes, hasMoreCollection, editingTheme } = usePage<SharedData>().props;
  const [isYoutubeUrl, setIsYoutubeUrl] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(!editingTheme);
  const [youtubeOptions, setYoutubeOptions] = useState(editingTheme?.option || 'autoplay');
  const [collectionSearchTerm, setCollectionSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [collectionThemes, setCollectionThemes] = useState(themecollection || []);
  const [userThemes, setUserThemes] = useState(alltheme || []);
  const [collectionPage, setCollectionPage] = useState(1);
  const [themesPage, setThemesPage] = useState(1);
  const [hasMoreCollectionThemes, setHasMoreCollectionThemes] = useState(hasMoreCollection || false);
  const [hasMoreUserThemes, setHasMoreUserThemes] = useState(hasMoreThemes || false);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);
  const [deletingThemeId, setDeletingThemeId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({
    title: '',
    fileOrUrl: ''
  });
  const [urlValue, setUrlValue] = useState(editingTheme?.image || '');
  const [isEditing, setIsEditing] = useState(!!editingTheme);
  const [currentTheme, setCurrentTheme] = useState(editingTheme ? {
    ...editingTheme,
    price: editingTheme.price || "0",
    customWidth: editingTheme.leftwidth || 0,
    rightWidth: editingTheme.rightwidth || 0,
    bgcolour: editingTheme.bgcolour || '#000000',
    uploadedFile: undefined,
    previewUrl: undefined
  } : {
    price: "0",
    customWidth: 0,
    rightWidth: 0,
    bgcolour: '#000000',
    uploadedFile: undefined,
    previewUrl: undefined
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [linkedinPost, setLinkedinPost] = useState(0);
  const [redditPost, setRedditPost] = useState(0);
  
  // Add funnel creation state
  const [isCreatingFunnel, setIsCreatingFunnel] = useState(false);
  const [formData, setFormData] = useState({
    theme: [] as string[],
    name: ''
  });
  
  // Add templates state
  const [templates, setTemplates] = useState({
    userTemplates: [] as any[],
    defaultTemplates: [] as any[],
    themecollections: [] as any[]
  });
  
  const htmlUrlRef = useRef<string | null>(null);

  // Create reusable fetchTemplates function
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await axios.get('/templates');
      setTemplates({
        userTemplates: response.data.userTemplates || [],
        defaultTemplates: response.data.defaultTemplates || [],
        themecollections: response.data.themecollections || []
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  // Add useEffect to fetch templates
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Add funnel functions
  const toggleThemeSelection = useCallback((themeId: string) => {
    setFormData(prev => ({
      ...prev,
      theme: prev.theme.includes(themeId) 
        ? prev.theme.filter(id => id !== themeId)
        : [...prev.theme, themeId]
    }));
  }, []);

  const moveThemeUp = useCallback((index: number) => {
    if (index === 0) return;
    setFormData(prev => {
      const newThemes = [...prev.theme];
      [newThemes[index], newThemes[index - 1]] = [newThemes[index - 1], newThemes[index]];
      return { ...prev, theme: newThemes };
    });
  }, []);

  const moveThemeDown = useCallback((index: number) => {
    if (index === formData.theme.length - 1) return;
    setFormData(prev => {
      const newThemes = [...prev.theme];
      [newThemes[index], newThemes[index + 1]] = [newThemes[index + 1], newThemes[index]];
      return { ...prev, theme: newThemes };
    });
  }, [formData.theme.length]);

  const handleCreateFunnel = useCallback(async () => {
    if (formData.theme.length === 0) return;
    
    setIsCreatingFunnel(true);
    try {
      // Get the actual template IDs from the selected theme IDs
      const allTemplates = [
        ...templates.userTemplates,
        ...templates.defaultTemplates,
        ...templates.themecollections
      ];
      
      const templateIds = formData.theme.map(themeId => {
        const template = allTemplates.find(t => 
          t.id?.toString() === themeId || 
          t.unique_id === themeId
        );
        return template?.id;
      }).filter(Boolean); // Remove undefined values
      const response = await axios.post('/themecollections', {
        template_ids: templateIds,
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
      
      // Refresh templates after creating funnel
      await fetchTemplates();
      
      // Reset form
      setFormData({
        theme: [],
        name: ''
      });
      
    } catch (error) {
      console.error('Error creating funnel:', error);
      setFormErrors(prev => ({
        ...prev,
        fileOrUrl: error.response?.data?.message || 'Failed to create funnel'
      }));
    } finally {
      setIsCreatingFunnel(false);
    }
  }, [formData, templates, fetchTemplates]);

  // Debounced search function
  const debouncedSearchThemes = useCallback(
    debounce(async (term: string) => {
      if (term.trim() === '') {
        setSearchResults([]);
        return;
      }
      
      try {
        setIsSearching(true);
        const response = await axios.get('/search-themes', {
          params: { q: term }
        });
        setSearchResults(response.data.themes || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (htmlUrlRef.current) {
        URL.revokeObjectURL(htmlUrlRef.current);
      }
      // Clean up preview URL
      if (currentTheme?.previewUrl) {
        URL.revokeObjectURL(currentTheme.previewUrl);
      }
      debouncedSearchThemes.cancel();
    };
  }, [debouncedSearchThemes]);

  useEffect(() => {
    if (template?.image?.includes('facebook.com') || template?.image?.includes('fb.watch')) {
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

  useEffect(() => {
    if (currentTheme) {
      const url = currentTheme.image?.split('\n')[0]?.trim() || '';
      setIsYoutubeUrl(YOUTUBE_REGEX.test(url));
    }
  }, [currentTheme]);

  const isValidUrl = useCallback((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loadMoreCollection = useCallback(async () => {
    if (isLoadingCollection || !hasMoreCollectionThemes) return;
    
    setIsLoadingCollection(true);
    try {
      const nextPage = collectionPage + 1;
      const response = await axios.get('/load-more', {
        params: {
          type: 'collection',
          page: nextPage
        }
      });
      
      setCollectionThemes(prev => [...prev, ...(response.data.themes || [])]);
      setHasMoreCollectionThemes(response.data.hasMore || false);
      setCollectionPage(nextPage);
    } catch (error) {
      console.error('Error loading more collection themes:', error);
    } finally {
      setIsLoadingCollection(false);
    }
  }, [collectionPage, hasMoreCollectionThemes, isLoadingCollection]);

  const loadMoreUserThemes = useCallback(async () => {
    if (isLoadingThemes || !hasMoreUserThemes) return;
    
    setIsLoadingThemes(true);
    try {
      const nextPage = themesPage + 1;
      const response = await axios.get('/load-more', {
        params: {
          type: 'themes',
          page: nextPage
        }
      });
      
      setUserThemes(prev => [...prev, ...(response.data.themes || [])]);
      setHasMoreUserThemes(response.data.hasMore || false);
      setThemesPage(nextPage);
    } catch (error) {
      console.error('Error loading more user themes:', error);
    } finally {
      setIsLoadingThemes(false);
    }
  }, [themesPage, hasMoreUserThemes, isLoadingThemes]);

  const filteredCollectionThemes = useMemo(() => {
    if (!collectionSearchTerm) return collectionThemes;
    const term = collectionSearchTerm.toLowerCase();
    return collectionThemes.filter(theme => 
      (theme?.title?.toLowerCase().includes(term)) || 
      (theme?.unique_id?.toLowerCase().includes(term))
    );
  }, [collectionThemes, collectionSearchTerm]);

  const handleSaveTheme = useCallback(async (formElement: HTMLFormElement | React.FormEvent, shareToSocial: boolean = false, platform: 'linkedin' | 'reddit' = 'linkedin') => {
    // Handle both event and form element
    let form: HTMLFormElement;
    if (formElement instanceof HTMLFormElement) {
      form = formElement;
    } else {
      formElement.preventDefault();
      form = formElement.target as HTMLFormElement;
    }
    
    setIsSaving(true);
    
    // Set social platform value based on which button was clicked
    const socialPostValue = shareToSocial ? 1 : 0;
    const platformField = platform === 'linkedin' ? 'linkedinpost' : 'redditpost';
    
    if (platform === 'linkedin') {
      setLinkedinPost(socialPostValue);
    } else {
      setRedditPost(socialPostValue);
    }
    
    const fileInput = document.getElementById('theme-upload') as HTMLInputElement;
    const formData = new FormData(form);
    setFormErrors({
      title: '',
      fileOrUrl: ''
    });

    let isValid = true;
    if (!formData.get('title')) {
      setFormErrors(prev => ({...prev, title: 'Theme title is required'}));
      isValid = false;
    }

    if (!fileInput?.files?.[0] && !urlValue.trim() && !currentTheme) {
      setFormErrors(prev => ({...prev, fileOrUrl: 'Please provide either a file or URL'}));
      isValid = false;
    }

    if (!isValid) {
      setIsSaving(false);
      return;
    }

    formData.append('option', youtubeOptions);
    formData.append(platformField, socialPostValue.toString()); // Add platform post field to form data
    
    if (urlValue) {
      const isUrl = isValidUrl(urlValue.trim());
      if (isUrl) {
        formData.append('url', urlValue.trim());
      } else {
        formData.append('url', urlValue);
      }
    }
    if (currentTheme?.price) {
      formData.append('price', currentTheme.price);
    }
    if (currentTheme?.customWidth !== undefined) {
      formData.append('leftwidth', currentTheme.customWidth.toString());
    }
    if (currentTheme?.rightWidth !== undefined) {
      formData.append('rightwidth', currentTheme.rightWidth.toString());
    }
    if (currentTheme?.bgcolour) {
      formData.append('bgcolour', currentTheme.bgcolour);
    }
    
    try {
      let response;
      if (isEditing && currentTheme?.unique_id) {
        formData.append('_method', 'PUT');
        response = await axios.post(`/themesedit/${currentTheme.unique_id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          }
        });
        
        setUserThemes(prev => prev.map(theme => 
          theme.unique_id === currentTheme.unique_id ? response.data.theme : theme
        ));
        
        setCurrentTheme({
          ...response.data.theme,
          customWidth: response.data.theme.leftwidth || 0,
          rightWidth: response.data.theme.rightwidth || 0,
          bgcolour: response.data.theme.bgcolour || '#000000',
          uploadedFile: undefined,
          previewUrl: undefined
        });
        
        // Refresh templates after update
        await fetchTemplates();
      } else {
        response = await axios.post('/themes', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          }
        });
        
        // Update userThemes immediately
        setUserThemes(prev => [response.data.theme, ...prev]);
        
        // ALSO update templates.userTemplates for the dropdown immediately
        setTemplates(prev => ({
          ...prev,
          userTemplates: [response.data.theme, ...prev.userTemplates]
        }));
        
        form.reset();
        setUrlValue('');
        setIsYoutubeUrl(false);
        setIsEditing(false);
        setCurrentTheme({
          price: "0",
          customWidth: 0,
          rightWidth: 0,
          bgcolour: '#000000',
          uploadedFile: undefined,
          previewUrl: undefined
        });
      }
      
      // FIX: Add null checks for response.data.theme
      const savedTheme = response?.data?.theme;
      
      // Show appropriate success message based on platform
      if (socialPostValue === 1) {
        setSuccessMessage(
          <span className="flex items-center gap-4">
            Theme {isEditing ? 'updated' : 'saved'} and shared to {platform === 'linkedin' ? 'LinkedIn' : 'Reddit'} successfully!{' '}
            <span className="inline-flex items-center gap-2 bg-gray-900/70 border border-gray-700 rounded-xl px-3 py-2 hover:shadow-lg hover:border-yellow-400/50 transition-all">
              <span className="text-white text-md font-medium">{savedTheme?.title || 'Untitled Theme'}</span>
              <span className="text-md text-gray-400">ID: {savedTheme?.unique_id || 'N/A'}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-md font-medium bg-yellow-400/20 text-yellow-300">
                EZ$ {savedTheme?.price || '0'}
              </span>
              <a 
                href={`/${savedTheme?.unique_id || '#'}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-2 py-0.5 text-md bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
              >
                Preview
              </a>
            </span>
          </span>
        );
      } else {
        setSuccessMessage(
          <span className="flex items-center gap-4">
            Theme {isEditing ? 'updated' : 'saved'} successfully!{' '}
            <span className="inline-flex items-center gap-2 bg-gray-900/70 border border-gray-700 rounded-xl px-3 py-2 hover:shadow-lg hover:border-yellow-400/50 transition-all">
              <span className="text-white text-md font-medium">{savedTheme?.title || 'Untitled Theme'}</span>
              <span className="text-md text-gray-400">ID: {savedTheme?.unique_id || 'N/A'}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-md font-medium bg-yellow-400/20 text-yellow-300">
                EZ$ {savedTheme?.price || '0'}
              </span>
              <a 
                href={`/${savedTheme?.unique_id || '#'}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-2 py-0.5 text-md bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
              >
                Preview
              </a>
            </span>
          </span>
        );
      }

    } catch (error) {
      console.error('Error saving theme:', error);
      if (error.response?.data?.message) {
        setFormErrors(prev => ({...prev, fileOrUrl: error.response.data.message}));
      } else {
        setFormErrors(prev => ({...prev, fileOrUrl: 'Failed to save theme'}));
      }
    } finally {
      setIsSaving(false);
    }
  }, [isEditing, currentTheme, urlValue, youtubeOptions, isValidUrl, fetchTemplates]);

  const handleDeleteClick = useCallback((themeId: string) => {
    setThemeToDelete(themeId);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!themeToDelete) return;
    
    try {
      setDeletingThemeId(themeToDelete);
      await axios.delete(`/themes/${themeToDelete}`);
      
      // Refresh templates after deletion
      await fetchTemplates();
      
      setUserThemes(prev => prev.filter(theme => theme.unique_id !== themeToDelete));
      
      if (currentTheme && currentTheme.unique_id === themeToDelete) {
        // Clean up preview URL
        if (currentTheme?.previewUrl) {
          URL.revokeObjectURL(currentTheme.previewUrl);
        }
        
        setCurrentTheme({
          price: "0",
          customWidth: 0,
          rightWidth: 0,
          bgcolour: '#000000',
          uploadedFile: undefined,
          previewUrl: undefined
        });
        setIsEditing(false);
        setUrlValue('');
      }
      
      setSuccessMessage('Theme deleted successfully!');
    } catch (error) {
      console.error('Error deleting theme:', error);
      setFormErrors(prev => ({...prev, fileOrUrl: error.response?.data?.message || 'Failed to delete theme. Please try again.'}));
    } finally {
      setDeletingThemeId(null);
      setShowDeleteModal(false);
      setThemeToDelete(null);
    }
  }, [themeToDelete, currentTheme, fetchTemplates]);

  const handleEditTheme = useCallback((theme: any) => {
    if (!theme) return;
    
    // Clean up previous preview URL if exists
    if (currentTheme?.previewUrl) {
      URL.revokeObjectURL(currentTheme.previewUrl);
    }
    
    setCurrentTheme({
      ...theme,
      price: theme.price || "0",
      customWidth: theme.leftwidth || 0,
      rightWidth: theme.rightwidth || 0,
      bgcolour: theme.bgcolour || '#000000',
      uploadedFile: undefined,
      previewUrl: undefined
    });
    setIsEditing(true);
    setIsPanelVisible(true);
    setSuccessMessage('');
    setUrlValue(theme.image || '');
    setYoutubeOptions(theme.option || 'autoplay');
    
    const formSection = document.getElementById('theme-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentTheme?.previewUrl]);

  const handleCancelEdit = useCallback(() => {
    // Clean up preview URL
    if (currentTheme?.previewUrl) {
      URL.revokeObjectURL(currentTheme.previewUrl);
    }
    
    setCurrentTheme({
      price: "0",
      customWidth: 0,
      rightWidth: 0,
      bgcolour: '#000000',
      uploadedFile: undefined,
      previewUrl: undefined
    });
    setIsEditing(false);
    setUrlValue('');
    setFormErrors({ title: '', fileOrUrl: '' });
  }, [currentTheme?.previewUrl]);

  const handleCreateNewTheme = useCallback(() => {
    // Clean up preview URL
    if (currentTheme?.previewUrl) {
      URL.revokeObjectURL(currentTheme.previewUrl);
    }
    
    setCurrentTheme({
      price: "0",
      customWidth: 0,
      rightWidth: 0,
      bgcolour: '#000000',
      uploadedFile: undefined,
      previewUrl: undefined
    });
    setIsEditing(false);
    setIsPanelVisible(true);
    setUrlValue('');
    setSuccessMessage('');
    setYoutubeOptions('autoplay');
    setFormErrors({ title: '', fileOrUrl: '' });
    
    const formSection = document.getElementById('theme-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentTheme?.previewUrl]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTheme(prev => ({
      ...prev,
      price: e.target.value === "" ? "" : e.target.value
    }));
  }, []);

  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value);
    setCurrentTheme(prev => ({
      ...prev,
      customWidth: newWidth
    }));
  }, []);

  const handleRightWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value);
    setCurrentTheme(prev => ({
      ...prev,
      rightWidth: newWidth
    }));
  }, []);

  const handleBgColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTheme(prev => ({
      ...prev,
      bgcolour: e.target.value
    }));
  }, []);

  const getImageExtension = useCallback((url: string) => {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.split('.').pop()?.toLowerCase();
  }, []);

  const isImageExtension = useCallback((extension?: string) => {
    if (!extension) return false;
    return VALID_IMAGE_EXTENSIONS.includes(extension);
  }, []);

  const blurStyle = useMemo(() => {
    if (!template?.image) return null;
    const extension = getImageExtension(template.image);
    return isImageExtension(extension) ? (
      <style>{`
        .blur-bg {
          background: url('${template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/'}${template.image}') no-repeat center center;
          background-size: cover;
        }
      `}</style>
    ) : null;
  }, [template, getImageExtension, isImageExtension]);

  const renderTemplateContent = useMemo(() => {
    if (!template) return null;

    const extension = getImageExtension(template.image) || '';
    const imgPath = template.user_id === 0 ? 'https://admin.ez3d.ai/' : 'https://ez.wiki/';
    const fullImageUrl = `${imgPath}${template.image}`;

    const youtubeMatch = template.image.match(YOUTUBE_REGEX);
    const linkedinMatch = template.image.match(LINKEDIN_REGEX);
    const vimeoMatch = template.image.match(VIMEO_REGEX);
    const fbWatchMatch = template.image.match(FB_WATCH_REGEX);
    const facebookMatch = template.image.match(FACEBOOK_REGEX);
    const iframeMatch = template.image.match(IFRAME_REGEX) || BLOCKQUOTE_REGEX.test(template.image);

    if (VALID_IMAGE_EXTENSIONS.includes(extension)) {
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

    if (VALID_DOCUMENT_EXTENSIONS.includes(extension)) {
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
        />
      );
    }

    if (iframeMatch) {
      const processedHtml = template.image
        .replace(/<(iframe|blockquote)([^>]*)\s(height|width|style)=["'][^"']*["']([^>]*)>/gi, '<$1$2$4 class="fixed top-0 left-0 w-full h-full" scrolling="no">')
        .replace(/class="([^"]*)"/g, 'class="$1 absolute inset-0 m-auto"');

      const finalHtml = !/<(iframe|blockquote)[^>]*class="/i.test(processedHtml)
        ? processedHtml.replace(/<(iframe|blockquote)/g, '<$1 scrolling="no" class="absolute w-full h-full inset-0 m-auto"')
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
          />
        </>
      );
    }

    if (htmlUrlRef.current) {
      URL.revokeObjectURL(htmlUrlRef.current);
    }
    const htmlBlob = new Blob([template.image], { type: 'text/html' });
    htmlUrlRef.current = URL.createObjectURL(htmlBlob);

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
      />
    );
  }, [template, isValidUrl]);

  return (
    <>
      <Head>
        <title>{isEditing ? `Edit ${currentTheme?.title || 'Theme'}` : 'EZ Theme'}</title>
        {blurStyle}
        <style>{`
          .react-tooltip {
            z-index: 99999 !important;
            opacity: 1 !important;
            font-size: 12px;
            padding: 4px 8px;
          }
          
          /* MDEditor custom styles */
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
        `}</style>
      </Head>
      
      <Tooltip id="action-tooltip" />
      <Tooltip id="form-tooltip" />
      <Tooltip id="modal-tooltip" />

      <DraggableMenu auth={auth} />
      
      <main className={`relative flex justify-center p-4 min-h-screen overflow-hidden ${
        template?.image && VALID_IMAGE_EXTENSIONS.includes(getImageExtension(template.image) || '') ? 'blur-bg' : ''}`}>
        <div className="absolute inset-0 z-0">
          {renderTemplateContent}
        </div>
        {isPanelVisible && (
        <div className="relative mt-4 mx-auto bottom-4 z-50 backdrop-blur-sm p-4 rounded-xl border border-white-700 overflow-y-auto shadow-2xl w-full">
            <button 
              onClick={() => setIsPanelVisible(false)}
              className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center z-50 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close panel"
              data-tooltip-id="action-tooltip"
              data-tooltip-content="Close this panel"
            >
              <FontAwesomeIcon 
                icon={faTimes} 
                className="text-white text-lg" 
                style={{ textShadow: '0.7px 0.7px 0 rgb(255,0,0), -0.7px -0.7px 0 rgb(0,255,255)' }}
              />
            </button>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Create/Edit Theme Form */}
            <div id="theme-form-section" className={`w-full ${!isEditing ? 'md:w-1/2' : 'md:w-1/2'} space-y-6`}>
              <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold text-white" data-tooltip-id="form-tooltip" data-tooltip-content={isEditing ? 'Modify your existing theme' : 'Create a brand new theme'}>
                  <FontAwesomeIcon icon={faPalette} className="mr-2" />
                  {isEditing ? 'Edit Theme' : 'Create New Theme'}
                </h2>
                {successMessage && (
                  <div className="p-4 bg-green-900/50 border border-green-700 text-green-300 rounded-lg">
                    <button 
                      onClick={() => setSuccessMessage('')}
                      className="float-right font-bold text-green-400 hover:text-green-200"
                      data-tooltip-id="action-tooltip"
                      data-tooltip-content="Dismiss message"
                    >
                      ×
                    </button>
                    {successMessage}
                  </div>
                )}
                
                {/* COMPACT FORM UI */}
                <form id="theme-form" onSubmit={(e) => handleSaveTheme(e, false, 'linkedin')} className="space-y-6">
                  {isEditing && currentTheme && (
                    <input type="hidden" name="id" value={currentTheme.id} />
                  )}
                  
                  {/* Basic Information Section */}
                  <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
                    <h3 className="text-yellow-400 font-semibold mb-4 text-sm">
                      <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Theme Title */}
                      <div>
                        <div>
                          <label className="block text-white text-sm mb-2">
                            <FontAwesomeIcon icon={faHashtag} className="mr-2" />
                            Theme Title*
                          </label>
                          <input
                            type="text"
                            name="title"
                            placeholder="e.g. Summer Vibes, Corporate Blue..."
                            className={`w-full bg-gray-900/80 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-400 ${
                              formErrors.title ? 'border-red-500 focus:border-red-500' : ''
                            }`}
                            defaultValue={currentTheme?.title || ''}
                            required
                          />
                          {formErrors.title && (
                            <p className="mt-1 text-xs text-red-400">
                              <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                              {formErrors.title}
                            </p>
                          )}
                        </div>
                        {/* Pricing */}
                        <div>
                          <label className="block text-white text-sm mb-2 mt-2">
                            <FontAwesomeIcon icon={faCloudDownloadAlt} className="mr-2" />
                            Pricing
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="price"
                              placeholder="0"
                              value={currentTheme?.price ?? ""}
                              onChange={handlePriceChange}
                              min="0"
                              className="w-full bg-gray-900/80 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-400 pr-12"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-400 font-semibold text-sm">
                              EZ$
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">Leave as 0 for free</p>
                        </div>
                      </div>
                      {/* Description */}
                      <div>
                        <label className="block text-white text-sm mb-2">
                          <FontAwesomeIcon icon={faEdit} className="mr-2" />
                          Description
                        </label>
                        <textarea
                          name="description"
                          placeholder="Describe your theme's features, purpose, and any special instructions..."
                          rows={5}
                          className="w-full bg-gray-900/80 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-400 resize-vertical text-sm"
                          defaultValue={currentTheme?.description || ''}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left Margin */}
                      <div>
                        <label className="block text-white text-sm mb-2">Left Margin</label>
                        <div className="flex items-center bg-gray-900/80 rounded border border-gray-600">
                          <input
                            type="number"
                            name="leftwidth"
                            min="0"
                            max="100"
                            value={currentTheme?.customWidth || 0}
                            onChange={handleWidthChange}
                            className="flex-1 bg-transparent text-white text-sm px-3 py-2 focus:outline-none rounded-l"
                            placeholder="0-100"
                          />
                          <span className="bg-green-600 text-white px-3 py-2 text-sm font-semibold border-l border-gray-600">
                            %
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">0 = default width</p>
                      </div>

                      {/* Right Margin */}
                      <div>
                        <label className="block text-white text-sm mb-2">Right Margin</label>
                        <div className="flex items-center bg-gray-900/80 rounded border border-gray-600">
                          <input
                            type="number"
                            name="rightwidth"
                            min="0"
                            max="100"
                            value={currentTheme?.rightWidth || 0}
                            onChange={handleRightWidthChange}
                            className="flex-1 bg-transparent text-white text-sm px-3 py-2 focus:outline-none rounded-l"
                            placeholder="0-100"
                          />
                          <span className="bg-green-600 text-white px-3 py-2 text-sm font-semibold border-l border-gray-600">
                            %
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">0 = default width</p>
                      </div>

                      {/* Background Color */}
                      <div>
                        <label className="block text-white text-sm mb-2">Background Color</label>
                        <div className="flex items-center">
                          <input
                            type="color"
                            name="bgcolour"
                            value={currentTheme?.bgcolour || '#000000'}
                            onChange={handleBgColorChange}
                            className="w-8 h-8 rounded border border-gray-500 cursor-pointer"
                          />
                       
                        </div>
                        <input
                              type="text"
                              value={currentTheme?.bgcolour || '#000000'}
                              onChange={handleBgColorChange}
                              className="flex-1 bg-transparent text-white px-2 py-1 rounded border-0 focus:outline-none focus:ring-0 font-mono text-sm"
                            />
                      </div>
                    </div>
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-600 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          // Switch to URL tab logic
                          document.getElementById('url-tab-content')?.classList.remove('hidden');
                          document.getElementById('upload-tab-content')?.classList.add('hidden');
                          document.getElementById('url-tab')?.classList.add('border-yellow-400', 'text-yellow-400');
                          document.getElementById('url-tab')?.classList.remove('border-transparent', 'text-gray-400');
                          document.getElementById('upload-tab')?.classList.add('border-transparent', 'text-gray-400');
                          document.getElementById('upload-tab')?.classList.remove('border-yellow-400', 'text-yellow-400');
                        }}
                        id="url-tab"
                        className="flex items-center px-4 py-2 border-b-2 border-yellow-400 text-yellow-400 font-medium text-sm"
                      >
                        <FontAwesomeIcon icon={faGlobe} className="mr-2" />
                        Markdown/Embed Code/URL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Switch to upload tab logic
                          document.getElementById('upload-tab-content')?.classList.remove('hidden');
                          document.getElementById('url-tab-content')?.classList.add('hidden');
                          document.getElementById('upload-tab')?.classList.add('border-yellow-400', 'text-yellow-400');
                          document.getElementById('upload-tab')?.classList.remove('border-transparent', 'text-gray-400');
                          document.getElementById('url-tab')?.classList.add('border-transparent', 'text-gray-400');
                          document.getElementById('url-tab')?.classList.remove('border-yellow-400', 'text-yellow-400');
                        }}
                        id="upload-tab"
                        className="flex items-center px-4 py-2 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-medium text-sm"
                      >
                        <FontAwesomeIcon icon={faCloudDownloadAlt} className="mr-2" />
                        Upload
                      </button>
                    </div>
                    
                    {/* URL/Markdown Tab Content */}
                    <div id="url-tab-content" className="space-y-4">
                      <div className="border border-gray-600 rounded overflow-hidden focus-within:border-yellow-400" data-color-mode="dark">
                        <EnhancedMDEditor
                          value={urlValue}
                          onChange={(value) => {
                            setUrlValue(value || '');
                            const firstLine = value?.split('\n')[0]?.trim() || '';
                            setIsYoutubeUrl(YOUTUBE_REGEX.test(firstLine));
                          }}
                        />
                      </div>

                      {isYoutubeUrl && (
                        <select
                          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-400 text-sm"
                          value={youtubeOptions}
                          onChange={(e) => setYoutubeOptions(e.target.value)}
                          defaultValue={currentTheme?.option || 'autoplay'}
                        >
                          <option value="autoplay">🎵 Autoplay (with sound)</option>
                          <option value="mute">🔇 Autoplay (muted)</option>
                          <option value="pause">⏸️ Paused</option>
                        </select>
                      )}
                    </div>
                    
                    {/* Upload Tab Content */}
                    <div id="upload-tab-content" className="hidden space-y-4">
                      <div className={`border border-dashed border-gray-600 rounded p-6 text-center transition-all ${
                        formErrors.fileOrUrl ? 'border-red-500 bg-red-900/20' : 'hover:border-yellow-400'
                      }`}>
                        <input
                          type="file"
                          name="file"
                          id="theme-upload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Create preview URL for images
                              if (file.type.startsWith('image/')) {
                                const previewUrl = URL.createObjectURL(file);
                                setUrlValue(`![${file.name}](${previewUrl})`);
                                
                                // Clean up previous preview URL on component unmount or new file selection
                                if (currentTheme?.previewUrl) {
                                  URL.revokeObjectURL(currentTheme.previewUrl);
                                }
                                
                                setCurrentTheme(prev => ({
                                  ...prev,
                                  previewUrl,
                                  uploadedFile: file
                                }));
                              } else {
                                // For non-image files, just show the filename
                                setUrlValue(`📎 File: ${file.name}`);
                                setCurrentTheme(prev => ({
                                  ...prev,
                                  uploadedFile: file
                                }));
                              }
                            }
                          }}
                        />
                        <label htmlFor="theme-upload" className="cursor-pointer block">
                          <FontAwesomeIcon icon={faCloudDownloadAlt} className="text-2xl text-gray-400 mb-2" />
                          <p className="text-white text-sm mb-1">Click to upload or drag and drop</p>
                          <p className="text-gray-400 text-xs">Any file type • Max 100MB</p>
                        </label>
                        
                        {/* File Preview Section */}
                        {currentTheme?.uploadedFile && (
                          <div className="mt-4 space-y-3">
                            <div className="p-3 bg-gray-900/60 rounded border border-gray-700">
                              <p className="text-green-400 text-xs flex items-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                Selected file: <span className="font-mono ml-1">{currentTheme.uploadedFile.name}</span>
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                Size: {(currentTheme.uploadedFile.size / 1024 / 1024).toFixed(2)} MB • 
                                Type: {currentTheme.uploadedFile.type || 'Unknown'}
                              </p>
                            </div>
                            
                            {/* Image Preview */}
                            {currentTheme.uploadedFile.type.startsWith('image/') && currentTheme.previewUrl && (
                              <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg blur-sm group-hover:blur-md transition-all"></div>
                                <div className="relative bg-gray-900/80 rounded-lg border border-gray-600 p-3">
                                  <p className="text-white text-xs font-medium mb-2 flex items-center">
                                    <FontAwesomeIcon icon={faImage} className="mr-2" />
                                    Preview
                                  </p>
                                  <div className="relative h-48 rounded overflow-hidden border border-gray-700">
                                    <img 
                                      src={currentTheme.previewUrl} 
                                      alt="Preview" 
                                      className="w-full h-full object-contain bg-black"
                                      onLoad={() => {
                                        // Image loaded successfully
                                      }}
                                      onError={() => {
                                        // Handle image load error
                                        console.error('Failed to load preview image');
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  </div>
                                  <p className="text-gray-400 text-xs mt-2 text-center">
                                    Hover to see details • Click outside to dismiss
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Document/File Preview (for non-images) */}
                            {!currentTheme.uploadedFile.type.startsWith('image/') && (
                              <div className="p-3 bg-gray-900/60 rounded border border-gray-700">
                                <div className="flex items-center justify-center h-20">
                                  <div className="text-center">
                                    <FontAwesomeIcon icon={faFile} className="text-3xl text-blue-400 mb-2" />
                                    <p className="text-white text-xs">{currentTheme.uploadedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                    <p className="text-gray-400 text-xs mt-1">Document preview not available</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Remove File Button */}
                            <button
                              type="button"
                              onClick={() => {
                                // Clean up preview URL
                                if (currentTheme.previewUrl) {
                                  URL.revokeObjectURL(currentTheme.previewUrl);
                                }
                                
                                // Clear file input
                                const fileInput = document.getElementById('theme-upload') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                                
                                // Clear state
                                setCurrentTheme(prev => ({
                                  ...prev,
                                  uploadedFile: undefined,
                                  previewUrl: undefined
                                }));
                                setUrlValue('');
                              }}
                              className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-xs font-medium rounded-lg border border-red-600/30 transition-all flex items-center justify-center gap-2"
                            >
                              <FontAwesomeIcon icon={faTrashAlt} />
                              Remove File
                            </button>
                          </div>
                        )}
                        
                        {/* Current theme file info (for editing) */}
                        {currentTheme?.image && !currentTheme.image.startsWith('http') && !currentTheme.uploadedFile && (
                          <div className="mt-3 p-2 bg-gray-900/60 rounded border border-gray-700">
                            <p className="text-green-400 text-xs">
                              <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                              Current file: <span className="font-mono">{currentTheme.image.split('/').pop()}</span>
                            </p>
                            <p className="text-gray-400 text-xs mt-1">(Upload new file to replace)</p>
                          </div>
                        )}
                      </div>
                      {formErrors.fileOrUrl && (
                        <p className="text-xs text-red-400 text-center">
                          <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                          {formErrors.fileOrUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-6 rounded-lg border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center shadow-lg hover:shadow-green-500/25"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          {isEditing ? 'Updating...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={isEditing ? faSave : faPlus} className="mr-2" />
                          {isEditing ? 'Update Theme' : 'Save Theme'}
                        </>
                      )}
                    </button>
                    
                    {!isEditing && auth?.linkedin_access_token && (
                      <button
                        type="button"
                        onClick={() => {
                          const form = document.getElementById('theme-form') as HTMLFormElement;
                          handleSaveTheme(form, true, 'linkedin');
                        }}
                        disabled={isSaving}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center shadow-lg hover:shadow-blue-500/25"
                      >
                        <FontAwesomeIcon icon={faShare} className="mr-2" />
                        Save Theme & Share LinkedIn
                      </button>
                    )}
                    
                    {!isEditing && auth?.reddit_token && (
                      <button
                        type="button"
                        onClick={() => {
                          const form = document.getElementById('theme-form') as HTMLFormElement;
                          handleSaveTheme(form, true, 'reddit');
                        }}
                        disabled={isSaving}
                        className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center shadow-lg hover:shadow-orange-500/25"
                      >
                        <FontAwesomeIcon icon={faShare} className="mr-2" />
                        Save Theme & Share Reddit
                      </button>
                    )}
                    
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg border-0 transition-all flex items-center justify-center text-sm shadow-lg hover:shadow-gray-500/25"
                      >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                {/* END IMPROVED FORM UI */}
              </div>
            </div>
            <div className="w-full md:w-1/3 space-y-6">
              {/* Themes List */}
              <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
                <div className="justify-between items-center gap-4">
                  <h2 className="text-xl font-bold text-white">Your Themes</h2>
                  <div className="relative mt-4">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search your themes..."
                      className="pl-10 pr-4 py-2 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm w-full"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        debouncedSearchThemes(e.target.value);
                      }}
                      data-tooltip-id="form-tooltip"
                      data-tooltip-content="Search your themes by title or ID"
                    />
                  </div>
                </div>

                {/* My Themes */}
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">My Uploaded Themes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userSearchTerm && searchResults.length > 0 ? (
                      searchResults.map((theme) => (
                        <div key={theme.unique_id} className="bg-gray-900/70 border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-yellow-400/50 transition-all p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate">{theme?.title || 'Untitled Theme'}</h4>
                              <p className="text-sm text-gray-400 truncate">ID: {theme?.unique_id || 'N/A'}</p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-300 whitespace-nowrap">
                              EZ$ {theme?.price || '0'}
                            </span>
                          </div>
                          <div className="mt-4 flex justify-between items-center gap-2">
                            <a href={`/${theme?.unique_id || '#'}`} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors" data-tooltip-id="action-tooltip" data-tooltip-content="Open your theme preview in a new tab"><FontAwesomeIcon icon={faGlobe} /></a>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditTheme(theme)}
                                className="flex items-center px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-500 transition-colors"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content="Edit this theme"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(theme.unique_id)} 
                                disabled={deletingThemeId === theme.unique_id} 
                                className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content="Delete this theme"
                              >
                                {deletingThemeId === theme.unique_id ? '...' : <FontAwesomeIcon icon={faTrashAlt} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : userThemes.length > 0 ? (
                      userThemes.map((theme) => (
                        <div key={theme.unique_id} className="bg-gray-900/70 border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-yellow-400/50 transition-all p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate">{theme?.title || 'Untitled Theme'}</h4>
                              <p className="text-sm text-gray-400 truncate">ID: {theme?.unique_id || 'N/A'}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(theme.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-300 whitespace-nowrap">
                              EZ$ {theme?.price || '0'}
                            </span>
                          </div>
                          <div className="mt-4 flex justify-between items-center gap-2">
                            <a href={`/${theme?.unique_id || '#'}`} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors" data-tooltip-id="action-tooltip" data-tooltip-content="Open your theme preview in a new tab"><FontAwesomeIcon icon={faGlobe} /></a>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditTheme(theme)}
                                className="flex items-center px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-500 transition-colors"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content="Edit this theme"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(theme.unique_id)} 
                                disabled={deletingThemeId === theme.unique_id} 
                                className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50"
                                data-tooltip-id="action-tooltip"
                                data-tooltip-content="Delete this theme"
                              >
                                {deletingThemeId === theme.unique_id ? '...' : <FontAwesomeIcon icon={faTrashAlt} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 col-span-full text-center py-4">
                        {isSearching ? 'Searching...' : 'No themes found.'}
                      </p>
                    )}
                  </div>
                  {!userSearchTerm && hasMoreUserThemes && (
                    <div className="mt-6 text-center">
                      <button onClick={loadMoreUserThemes} disabled={isLoadingThemes} className="bg-black text-white border border-white px-6 py-2 rounded-md font-semibold hover:bg-white hover:text-black transition-colors" data-tooltip-id="action-tooltip" data-tooltip-content="Load more of your themes">
                        {isLoadingThemes ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Right Column - Theme Collections & EzFunnel */}
            <div className="w-full md:w-1/5 space-y-6">
              {isEditing && (
                <button
                  onClick={handleCreateNewTheme}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center text-lg"
                  aria-label="Create New Theme"
                  data-tooltip-id="action-tooltip"
                  data-tooltip-content="Start creating a new theme from scratch"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Create New Theme
                </button>
              )}
              
              {/* Create EzFunnel Section */}
              <div className="bg-purple-900/50 border border-purple-700 rounded-lg p-6 space-y-6">
                <div>
                  <div className="justify-between items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-yellow-400">Create EzFunnel</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-yellow-400 font-medium text-sm whitespace-nowrap">Select Themes:</span>
                      {formData.theme.length > 0 && (
                        <span className="text-gray-400 text-xs">
                          {formData.theme.length} theme{formData.theme.length !== 1 ? 's' : ''} selected
                        </span>
                      )}
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
                    
                    {/* Create Funnel Button */}
                    <button
                      onClick={handleCreateFunnel}
                      disabled={formData.theme.length === 0 || isCreatingFunnel}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center shadow-lg hover:shadow-purple-500/25"
                      data-tooltip-id="action-tooltip"
                      data-tooltip-content="Create a funnel with the selected themes in order"
                    >
                      {isCreatingFunnel ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Creating Funnel...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faBolt} className="mr-2" />
                          Create EzFunnel
                        </>
                      )}
                    </button>
                    <a
                      href="/ezlist"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg border-0 transition-all text-sm flex items-center justify-center shadow-lg hover:shadow-gray-500/25"
                      data-tooltip-id="action-tooltip"
                      data-tooltip-content="View and manage all your existing funnels"
                    >
                      <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                      EzFunnel Management
                    </a>
                    {/* Helper Text */}
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Create a sequence of themes that visitors will navigate through in order
                    </p>
                  </div>
                </div>
              </div>

              {/* Collection Themes */}
              <div className="bg-purple-900/50 border border-purple-700 rounded-lg p-6 space-y-6">
                <div>
                  <div className="justify-between items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-yellow-400">Theme Collection</h3>
                    <div className="relative mt-4">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search collection..."
                        className="pl-10 pr-4 py-2 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm w-full"
                        value={collectionSearchTerm}
                        onChange={(e) => setCollectionSearchTerm(e.target.value)}
                        data-tooltip-id="form-tooltip"
                        data-tooltip-content="Search by title or ID in the collection"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {filteredCollectionThemes.length > 0 ? (
                      filteredCollectionThemes.map((theme) => (
                        <div key={theme.unique_id} className="bg-gray-900/70 border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-yellow-400/50 transition-all p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate">{theme?.title || 'Untitled Theme'}</h4>
                              <p className="text-sm text-gray-400 truncate">ID: {theme?.unique_id || 'N/A'}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(theme.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-300 whitespace-nowrap">
                              EZ$ {theme?.price || '0'}
                            </span>
                          </div>
                          <div className="mt-4 flex justify-start items-center">
                            <a href={theme.unique_id || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors" data-tooltip-id="action-tooltip" data-tooltip-content="Open theme preview in a new tab"><FontAwesomeIcon icon={faGlobe} /></a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 col-span-full text-center py-4">No themes found in collection.</p>
                    )}
                  </div>
                  {hasMoreCollectionThemes && (
                    <div className="mt-6 text-center">
                      <button onClick={loadMoreCollection} disabled={isLoadingCollection} className="bg-black text-white border border-white px-6 py-2 rounded-md font-semibold hover:bg-white hover:text-black transition-colors" data-tooltip-id="action-tooltip" data-tooltip-content="Load more themes from the collection">
                        {isLoadingCollection ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-white mb-4" data-tooltip-id="modal-tooltip" data-tooltip-content="Confirm theme deletion">Confirm Deletion</h3>
              <p className="text-gray-300 mb-6">Are you sure you want to delete this theme? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" data-tooltip-id="modal-tooltip" data-tooltip-content="Cancel and close this dialog">Cancel</button>
                <button onClick={handleConfirmDelete} disabled={!!deletingThemeId} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-70 flex items-center" data-tooltip-id="modal-tooltip" data-tooltip-content="Permanently delete this theme">
                  {deletingThemeId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}