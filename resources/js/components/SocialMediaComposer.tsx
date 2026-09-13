import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'cropperjs';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  BarController,
  LineController,
  PieController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import 'cropperjs/dist/cropper.css';

// Register Chart.js components
Chart.register(
  BarController,
  LineController,
  PieController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

interface SocialMediaComposerProps {
  onPost?: (content: string, mediaFiles: string[], cw: string | null, conversationId?: string | null) => void;
  onUpdate?: (content: string, mediaFiles: string[], cw: string | null, messageSlug: string) => void;
  initialContent?: string;
  initialMediaFiles?: string[];
  initialCW?: string | null;
  maxChars?: number; // Made optional - when not provided, no limit
  className?: string;
  conversationId?: string | null;
  messageSlug?: string | null;
  isEditMode?: boolean;
  contentFormat?: 'markdown' | 'html';
  initialFormat?: 'markdown' | 'html';
}

const SocialMediaComposer: React.FC<SocialMediaComposerProps> = ({
  onPost,
  onUpdate,
  initialContent = '',
  initialMediaFiles = [],
  initialCW = null,
  maxChars, // Now optional - no default value
  className = '',
  conversationId = null,
  messageSlug = null,
  isEditMode = false,
  contentFormat,
  initialFormat,
}) => {
  const effectiveFormat = contentFormat || initialFormat || 'markdown';

  // State
  const [content, setContent] = useState(initialContent);
  const [mediaFiles, setMediaFiles] = useState<string[]>(initialMediaFiles);
  const [showCW, setShowCW] = useState(!!initialCW);
  const [cwText, setCwText] = useState(initialCW || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [chartLabels, setChartLabels] = useState('A, B, C, D');
  const [chartData, setChartData] = useState('10, 40, 20, 30');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const cropperImageRef = useRef<HTMLImageElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
	
  // Emojis list
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟',
    '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰',
    '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤',
    '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻',
    '👽', '👾', '🤖', '🎉', '✨', '🌟', '💫', '⭐', '🔥', '💧', '🌈', '☀️',
    '🌙', '⭐', '🌍', '🌎', '🌏', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤',
    '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    '👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤟', '🤘', '👌', '👈', '👉',
    '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🦿',
    '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄'
  ];

  // Character count - undefined maxChars means no limit
  const charCount = content.length;
  const isOverLimit = maxChars ? charCount > maxChars : false;
  const isNearLimit = maxChars ? (maxChars - charCount <= 50 && maxChars - charCount > 0) : false;
  const mediaLimitReached = mediaFiles.length >= 4;
  
  const decodeHtmlEntities = (text: string): string => {
    if (!text) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Get counter display text
  const getCounterText = () => {
    if (!maxChars) return '∞';
    return `${maxChars - charCount}`;
  };

  // Effect to update state when props change (for edit mode)
  useEffect(() => {
    if (isEditMode) {
      setContent(initialContent);
      setMediaFiles(initialMediaFiles);
      setShowCW(!!initialCW);
      setCwText(initialCW || '');
    }
  }, [initialContent, initialMediaFiles, initialCW, isEditMode]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Handle file upload with validation
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 4 - mediaFiles.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    filesToUpload.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) {
        setError('Each image must be less than 100MB');
        return;
      }
      
      const reader = new FileReader();
      const fileKey = `${file.name}_${Date.now()}`;
      
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaFiles(prev => {
            if (prev.length < 4) {
              return [...prev, event.target!.result as string];
            }
            return prev;
          });
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
        }
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(prev => ({ ...prev, [fileKey]: progress }));
        }
      };
      
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setTimeout(() => setError(null), 3000);
  }, [mediaFiles.length]);

  // Remove media file
  const removeMedia = useCallback((index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Open cropper for editing
  const openCropper = useCallback((index: number) => {
    setCurrentEditIndex(index);
    setShowCropperModal(true);
  }, []);

  // Initialize cropper when modal opens
  useEffect(() => {
    if (showCropperModal && cropperImageRef.current && currentEditIndex !== null) {
      cropperImageRef.current.src = mediaFiles[currentEditIndex];

      setTimeout(() => {
        if (cropperRef.current) {
          cropperRef.current.destroy();
        }
        if (cropperImageRef.current) {
          cropperRef.current = new Cropper(cropperImageRef.current, {
            viewMode: 2,
            background: false,
            aspectRatio: NaN,
            autoCropArea: 0.8,
            movable: true,
            zoomable: true,
            rotatable: true,
            scalable: true,
          });
        }
      }, 100);
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [showCropperModal, currentEditIndex, mediaFiles]);

  // Save cropped image
  const saveCrop = useCallback(() => {
    if (cropperRef.current && currentEditIndex !== null) {
      const croppedCanvas = cropperRef.current.getCroppedCanvas();
      if (croppedCanvas) {
        const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);
        setMediaFiles(prev => prev.map((file, i) => i === currentEditIndex ? croppedImage : file));
      }
      setShowCropperModal(false);
    }
  }, [currentEditIndex]);

  // Render chart
  const renderChart = useCallback(() => {
    if (!chartCanvasRef.current) return;

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = chartLabels.split(',').map(s => s.trim());
    const data = chartData.split(',').map(Number);

    const config: ChartConfiguration = {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: 'Data',
          data,
          backgroundColor: ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
          borderColor: '#4f46e5',
          borderWidth: 1,
          borderRadius: 6,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: chartType === 'pie' ? undefined : {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    };

    chartInstanceRef.current = new Chart(ctx, config);
  }, [chartLabels, chartData, chartType]);

  // Render chart when modal opens
  useEffect(() => {
    if (showChartModal) {
      const timer = setTimeout(() => {
        renderChart();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showChartModal, renderChart]);

  // Attach chart to media files
  const attachChart = useCallback(() => {
    if (chartCanvasRef.current && mediaFiles.length < 4) {
      try {
        const chartImage = chartCanvasRef.current.toDataURL('image/png');
        setMediaFiles(prev => [...prev, chartImage]);
        setShowChartModal(false);
        setError(null);
      } catch (err) {
        setError('Failed to generate chart image');
        setTimeout(() => setError(null), 3000);
      }
    }
  }, [mediaFiles.length]);

  // Handle post submission
  const handlePost = useCallback(async () => {
    if (maxChars && isOverLimit) {
      setError(`Character limit exceeded by ${Math.abs(maxChars - charCount)} characters`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!content.trim() && mediaFiles.length === 0) {
      setError('Please add some content or media before posting');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode && onUpdate && messageSlug) {
        await onUpdate(content, mediaFiles, showCW ? cwText : null, messageSlug);
      } else if (onPost) {
        await onPost(content, mediaFiles, showCW ? cwText : null, conversationId);
      }
      
      if (!isEditMode) {
        setContent('');
        setMediaFiles([]);
        setShowCW(false);
        setCwText('');
      }
      setError(null);
      
    } catch (err) {
      setError('Failed to post. Please try again.');
      console.error('Post error:', err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setError(null), 3000);
    }
  }, [content, mediaFiles, showCW, cwText, isOverLimit, charCount, maxChars, onPost, onUpdate, conversationId, isEditMode, messageSlug]);

  // Add emoji to content
  const addEmoji = useCallback((emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Close modals on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCropperModal(false);
        setShowChartModal(false);
        setShowEmojiPicker(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && emojiBtnRef.current) {
        if (!emojiPickerRef.current.contains(e.target as Node) && 
            !emojiBtnRef.current.contains(e.target as Node)) {
          setShowEmojiPicker(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine grid class based on media count
  const getGridClass = () => {
    const count = mediaFiles.length;
    if (count === 0) return '';
    if (count === 1) return 'media-grid-1';
    if (count === 2) return 'media-grid-2';
    if (count === 3) return 'media-grid-3';
    return 'media-grid-4';
  };

  // Get character counter color
  const getCounterColor = () => {
    if (!maxChars) return 'text-slate-400';
    if (isOverLimit) return 'text-red-500';
    if (isNearLimit) return 'text-orange-500';
    return 'text-slate-400';
  };

  const buttonText = isEditMode ? 'Update' : 'Post';
  const submittingText = isEditMode ? 'Updating...' : 'Posting...';

  return (
    <>
      {/* Changed p-6 to p-4 sm:p-6 for more space on mobile */}
      <div className={`w-full bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xl transition-all ${className}`}>
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Content Warning (CW) */}
        {showCW && (
          <div className="flex items-stretch mb-4 overflow-hidden rounded-xl border border-slate-200 animate-slideDown">
            <div className="hazard-stripes" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #facc15, #facc15 10px, #27272a 10px, #27272a 20px)', width: '6px' }}></div>
            <input
              type="text"
              value={cwText}
              onChange={(e) => setCwText(e.target.value)}
              placeholder="Content warning (e.g., Spoilers, NSFW, Trigger Warning)"
              className="w-full py-3 px-4 bg-indigo-50/30 focus:outline-none font-medium text-slate-700 placeholder:text-slate-400"
              maxLength={100}
            />
            <button
              onClick={() => setShowCW(false)}
              className="px-3 text-slate-400 hover:text-slate-600 transition-colors"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
            <div className="hazard-stripes" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #facc15, #facc15 10px, #27272a 10px, #27272a 20px)', width: '6px' }}></div>
          </div>
        )}

        {/* Format Indicator Badge */}
        {effectiveFormat === 'html' && (
          <div className="mb-3 flex items-center justify-between bg-emerald-50/80 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              HTML Code Mode — Full HTML documents, styles, iframes & embeds supported
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-700">HTML</span>
          </div>
        )}

        {/* Input Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (effectiveFormat === 'html' && e.key === 'Tab') {
                e.preventDefault();
                const textarea = textareaRef.current;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newContent = content.substring(0, start) + '  ' + content.substring(end);
                setContent(newContent);
                setTimeout(() => {
                  textarea.selectionStart = textarea.selectionEnd = start + 2;
                }, 0);
              }
            }}
            placeholder={
              effectiveFormat === 'html'
                ? "Write or paste HTML code here (e.g. <!DOCTYPE html>, <div>...</div>, <style>...</style>, <iframe>...</iframe>)..."
                : (!maxChars ? "What's on your mind? (No character limit)" : "What's on your mind?")
            }
            className={
              effectiveFormat === 'html'
                ? "w-full font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-y bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner leading-relaxed"
                : "w-full text-xl text-slate-800 placeholder-slate-400 focus:outline-none resize-none bg-transparent"
            }
            rows={effectiveFormat === 'html' ? 6 : 3}
            style={{ minHeight: effectiveFormat === 'html' ? '180px' : '100px', tabSize: 2 }}
          />

          {/* Dynamic Multi-Image Gallery */}
          {mediaFiles.length > 0 && (
            <div className={`grid gap-1 mt-2 rounded-2xl overflow-hidden bg-slate-50 shadow-inner ${getGridClass()}`}>
              {mediaFiles.map((src, index) => (
                <div 
                  key={index} 
                  className={`relative group bg-slate-200 overflow-hidden ${index === 0 && mediaFiles.length === 3 ? 'row-span-2' : ''}`}
                  style={{ aspectRatio: '1/1' }}
                >
                  <img 
                    src={src} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    alt={`Media ${index + 1}`} 
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3">
                    <button 
                      onClick={() => openCropper(index)}
                      className="bg-white p-2.5 rounded-full text-indigo-600 shadow-xl hover:scale-110 transition-transform duration-200"
                      type="button"
                      title="Edit image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 2v6h6"/><path d="M18 22v-6h-6"/><path d="M2 18h6v6"/><path d="M22 6h-6V2"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => removeMedia(index)}
                      className="bg-white p-2.5 rounded-full text-red-600 shadow-xl hover:scale-110 transition-transform duration-200"
                      type="button"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  {uploadProgress[`media_${index}`] && uploadProgress[`media_${index}`] < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 transition-all" 
                         style={{ width: `${uploadProgress[`media_${index}`]}%` }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar - Added flex-wrap and gap-y-4 for responsive layout */}
        <div className="flex flex-wrap items-center justify-between gap-y-4 mt-6 pt-4 border-t border-slate-100">
          {/* Changed gap-6 to gap-3 sm:gap-6 for mobile compactness */}
          <div className="flex items-center gap-3 sm:gap-6 text-slate-400">
            {/* Image Upload */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
              multiple
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaLimitReached}
              className={`hover:text-indigo-600 transition-all duration-200 transform hover:scale-110 ${
                mediaLimitReached ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title={mediaLimitReached ? "Maximum 4 images reached" : "Upload Images (Max 4)"}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </button>

            {/* Chart/Stats */}
            <button
              onClick={() => setShowChartModal(true)}
              disabled={mediaLimitReached}
              className={`hover:text-indigo-600 transition-all duration-200 transform hover:scale-110 ${
                mediaLimitReached ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title={mediaLimitReached ? "Maximum 4 images reached" : "Generate Chart"}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
            </button>

            {/* Warning Icon */}
            <button
              onClick={() => setShowCW(!showCW)}
              className={`hover:text-amber-500 transition-all duration-200 transform hover:scale-110 ${
                showCW ? 'text-amber-500' : ''
              }`}
              title="Add Content Warning"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <path d="M12 9v4M12 17h.01"></path>
              </svg>
            </button>

            {/* Emojis */}
            <div className="relative">
              <button
                ref={emojiBtnRef}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:text-indigo-600 transition-all duration-200 transform hover:scale-110"
                type="button"
                title="Add Emoji"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </button>

              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  /* Updated width to be responsive */
                  className="absolute bottom-12 left-0 w-[280px] sm:w-[320px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scaleIn"
                >
                  <div className="p-2 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <span className="text-xs font-semibold text-indigo-600">Pick an emoji</span>
                  </div>
                  <div className="p-3 h-64 overflow-y-auto grid grid-cols-8 gap-1 custom-scrollbar">
                    {emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => addEmoji(emoji)}
                        className="text-2xl p-2 hover:bg-slate-100 rounded-lg transition-all duration-150 active:scale-90"
                        type="button"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Section - Changed gap-6 to gap-3 sm:gap-6 */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right">
              <span className={`font-bold text-sm tracking-tight ${getCounterColor()}`}>
                {getCounterText()}
              </span>
              {maxChars && isNearLimit && !isOverLimit && (
                <div className="text-[10px] text-orange-500">Near limit</div>
              )}
              {maxChars && isOverLimit && (
                <div className="text-[10px] text-red-500">Exceeded</div>
              )}
              {!maxChars && (
                <div className="text-[10px] text-slate-400">No limit</div>
              )}
            </div>
            <button
              onClick={handlePost}
              disabled={(maxChars && isOverLimit) || (!content.trim() && mediaFiles.length === 0) || isSubmitting}
              /* Changed px-10 to px-6 sm:px-10 for mobile fitting */
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-10 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-100 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              type="button"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{submittingText}</span>
                </>
              ) : (
                buttonText
              )}
            </button>
          </div>
        </div>
        
        {/* Media limit indicator */}
        {mediaLimitReached && (
          <div className="mt-3 text-xs text-amber-600 text-center">
            Maximum 4 images reached
          </div>
        )}
      </div>

      {/* Cropper Modal */}
      {showCropperModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.8)' }}>
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
              <h3 className="font-bold text-slate-800">Edit Media</h3>
              <button 
                onClick={() => setShowCropperModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="h-[50vh] bg-slate-900 flex items-center justify-center p-4">
              <img ref={cropperImageRef} src="" className="block max-w-full max-h-full" alt="Crop preview" />
            </div>
            <div className="p-4 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setShowCropperModal(false)} 
                className="px-6 py-2 font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveCrop} 
                className="px-8 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-md hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chart Designer Modal */}
      {showChartModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.8)' }}>
          <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scaleIn">
            <div className="w-full md:w-80 p-6 border-r bg-gradient-to-b from-slate-50 to-white">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Chart Designer</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Labels</label>
                  <input
                    type="text"
                    value={chartLabels}
                    onChange={(e) => setChartLabels(e.target.value)}
                    placeholder="Labels (comma-separated)"
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 ring-indigo-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data Values</label>
                  <input
                    type="text"
                    value={chartData}
                    onChange={(e) => setChartData(e.target.value)}
                    placeholder="Data (comma-separated)"
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 ring-indigo-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 ring-indigo-200 transition-all"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>
                <button
                  onClick={renderChart}
                  className="w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-100 transition-all duration-200"
                >
                  PREVIEW CHART
                </button>
              </div>
            </div>
            <div className="flex-grow p-6 bg-white flex flex-col">
              <div className="flex-grow flex items-center justify-center bg-slate-50 rounded-2xl p-4 min-h-[300px]">
                <canvas ref={chartCanvasRef} className="max-w-full max-h-full"></canvas>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setShowChartModal(false)} 
                  className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={attachChart} 
                  disabled={mediaFiles.length >= 4}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Attach Chart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .media-grid-1 { 
          display: grid;
          grid-template-columns: 1fr; 
        }
        .media-grid-2 { 
          display: grid;
          grid-template-columns: 1fr 1fr; 
        }
        .media-grid-3 { 
          display: grid;
          grid-template-columns: 1fr 1fr; 
          grid-template-rows: auto auto;
        }
        .media-grid-3 > div:first-child { 
          grid-row: span 2; 
        }
        .media-grid-4 { 
          display: grid;
          grid-template-columns: 1fr 1fr; 
          grid-template-rows: auto auto;
        }

        .modal-overlay {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
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
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default SocialMediaComposer;