<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>视频双耳节拍混音器</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet">
    
    <style type="text/css">
        /* Video preview styling */
        .video-preview {
            width: 100%;
            max-height: 400px;
            background-color: #111;
            border-radius: 8px;
            overflow: hidden;
        }
        
        /* Audio wave animation */
        .audio-wave {
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
        }
        .audio-wave span {
            width: 4px;
            height: 100%;
            background: linear-gradient(to top, #4F46E5, #818CF8);
            border-radius: 5px;
            animation: sound 0ms -800ms linear infinite alternate;
        }
        @keyframes sound {
            0% { height: 10%; }
            100% { height: 100%; }
        }
        .audio-wave span:nth-child(1) { animation-duration: 474ms; }
        .audio-wave span:nth-child(2) { animation-duration: 433ms; }
        .audio-wave span:nth-child(3) { animation-duration: 407ms; }
        .audio-wave span:nth-child(4) { animation-duration: 458ms; }
        .audio-wave span:nth-child(5) { animation-duration: 400ms; }
        .audio-wave span:nth-child(6) { animation-duration: 427ms; }
        .audio-wave span:nth-child(7) { animation-duration: 441ms; }
        .audio-wave span:nth-child(8) { animation-duration: 419ms; }
        .audio-wave span:nth-child(9) { animation-duration: 487ms; }
        .audio-wave span:nth-child(10) { animation-duration: 442ms; }
        
        /* Text gradient */
        .text-gradient {
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-gray-100">
    <div class="container mx-auto px-4 py-8 mt-16 max-w-4xl">
        <!-- Header Section -->
        <header class="text-center mb-10">
            <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gradient bg-gradient-to-r from-indigo-500 to-emerald-500">
                视频双耳节拍混音器
            </h1>
            <p class="text-gray-300 text-lg">
                将双耳节拍音轨混入您的视频音频
            </p>
        </header>

        <!-- Main Content -->
        <main class="space-y-10">
            <!-- Video Upload Section -->
            <section class="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700">
                <h2 class="text-2xl font-bold mb-6 text-gradient bg-gradient-to-r from-indigo-500 to-emerald-500 inline-block">
                    视频上传
                </h2>
                <div class="space-y-6">
                    <div class="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer" id="drop-area">
                        <i class="fa fa-film text-4xl text-gray-500 mb-4"></i>
                        <p class="text-gray-400 mb-2">拖放MP4视频文件到此处，或</p>
                        <label class="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-6 rounded-full inline-flex items-center cursor-pointer transition-all duration-300 transform hover:scale-105">
                            <i class="fa fa-upload mr-2"></i> 选择文件
                            <input type="file" id="video-upload" accept="video/mp4" class="hidden">
                        </label>
                    </div>
                    
                    <div id="video-preview" class="hidden">
                        <div class="flex flex-col gap-6">
                            <div class="video-preview">
                                <video id="video-player" controls class="w-full h-full"></video>
                            </div>
                            <div class="flex flex-col md:flex-row gap-6 items-center">
                                <div class="audio-wave">
                                    <span></span><span></span><span></span><span></span><span></span>
                                    <span></span><span></span><span></span><span></span><span></span>
                                </div>
                                <div class="flex-1">
                                    <h3 id="video-filename" class="text-xl font-medium text-gray-200"></h3>
                                    <p id="video-info" class="text-gray-400"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Binaural Beats Settings Section -->
            <section class="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700">
                <h2 class="text-2xl font-bold mb-6 text-gradient bg-gradient-to-r from-indigo-500 to-emerald-500 inline-block">
                    双耳节拍设置
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Right Ear Settings -->
                    <div class="space-y-6">
                        <h3 class="text-xl font-semibold text-gray-200 flex items-center">
                            <i class="fa fa-headphones text-indigo-400 mr-2"></i> 右耳 (320Hz)
                        </h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <label for="right-volume" class="text-gray-300">音量</label>
                                <span id="right-volume-value" class="text-indigo-400 font-medium">50%</span>
                            </div>
                            <input type="range" id="right-volume" min="0" max="100" value="50" 
                                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                            
                            <div class="flex items-center justify-between">
                                <label for="right-frequency" class="text-gray-300">频率</label>
                                <span id="right-frequency-value" class="text-indigo-400 font-medium">320Hz</span>
                            </div>
                            <input type="range" id="right-frequency" min="0" max="20000" value="320" 
                                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>
                    </div>
                    
                    <!-- Left Ear Settings -->
                    <div class="space-y-6">
                        <h3 class="text-xl font-semibold text-gray-200 flex items-center">
                            <i class="fa fa-headphones text-emerald-400 mr-2"></i> 左耳 (360Hz)
                        </h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <label for="left-volume" class="text-gray-300">音量</label>
                                <span id="left-volume-value" class="text-emerald-400 font-medium">50%</span>
                            </div>
                            <input type="range" id="left-volume" min="0" max="100" value="50" 
                                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                            
                            <div class="flex items-center justify-between">
                                <label for="left-frequency" class="text-gray-300">频率</label>
                                <span id="left-frequency-value" class="text-emerald-400 font-medium">360Hz</span>
                            </div>
                            <input type="range" id="left-frequency" min="0" max="20000" value="360" 
                                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                        </div>
                    </div>
                </div>
                
                <!-- Presets Section -->
                <div class="mt-8 pt-6 border-t border-gray-700">
                    <h3 class="text-xl font-semibold text-gray-200 mb-4">双耳节拍效果</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button class="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg transition-all duration-300" data-frequency="320" data-left="360">
                            专注 (40Hz)
                        </button>
                        <button class="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg transition-all duration-300" data-frequency="290" data-left="310">
                            放松 (20Hz)
                        </button>
                        <button class="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg transition-all duration-300" data-frequency="275" data-left="315">
                            冥想 (40Hz)
                        </button>
                        <button class="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg transition-all duration-300" data-frequency="260" data-left="290">
                            睡眠 (30Hz)
                        </button>
                    </div>
                </div>
            </section>

            <!-- Processing Section -->
            <section class="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700">
                <h2 class="text-2xl font-bold mb-6 text-gradient bg-gradient-to-r from-indigo-500 to-emerald-500 inline-block">
                    处理与导出
                </h2>
                
                <div class="flex flex-col md:flex-row gap-6">
                    <div class="flex-1 space-y-4">
                        <div class="flex items-center">
                            <input type="checkbox" id="overlay-mode" checked
                                class="w-5 h-5 rounded bg-gray-700 text-indigo-500 focus:ring-indigo-500">
                            <label for="overlay-mode" class="ml-2 text-gray-300">叠加模式 (将双耳节拍与原始音频混合)</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="replace-mode"
                                class="w-5 h-5 rounded bg-gray-700 text-emerald-500 focus:ring-emerald-500">
                            <label for="replace-mode" class="ml-2 text-gray-300">替换模式 (仅保留双耳节拍)</label>
                        </div>
                        <div class="text-gray-400 text-sm mt-2">
                            注意: 同时只能选择一种模式
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-center">
                        <button id="process-btn" class="bg-amber-500 hover:bg-amber-400 text-white py-3 px-8 rounded-full text-lg font-medium flex items-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                            <i class="fa fa-magic mr-2"></i> 处理视频
                        </button>
                    </div>
                </div>
                
                <!-- Output Section -->
                <div id="output-section" class="mt-8 hidden">
                    <div class="bg-gray-800/70 rounded-xl p-6 border border-gray-700">
                        <h3 class="text-xl font-semibold text-gray-200 mb-4">处理完成!</h3>
                        
                        <div class="video-preview mb-4">
                            <video id="output-video" controls class="w-full h-full"></video>
                        </div>
                        
                        <div class="audio-wave">
                            <span></span><span></span><span></span><span></span><span></span>
                            <span></span><span></span><span></span><span></span><span></span>
                        </div>
                        
                        <div class="mt-6 flex justify-center">
                            <button id="download-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-8 rounded-full text-lg font-medium flex items-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                                <i class="fa fa-download mr-2"></i> 下载处理后的视频
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- Footer -->
        <footer class="mt-16 text-center text-gray-500">
            <p>视频双耳节拍混音器 | 使用现代Web技术构建</p>
            <p class="mt-2 text-sm">注意: 此工具仅用于演示目的，处理后的视频质量可能因浏览器而异</p>
        </footer>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const dropArea = document.getElementById('drop-area');
            const videoUpload = document.getElementById('video-upload');
            const videoPreview = document.getElementById('video-preview');
            const videoFilename = document.getElementById('video-filename');
            const videoInfo = document.getElementById('video-info');
            const videoPlayer = document.getElementById('video-player');
            const processBtn = document.getElementById('process-btn');
            const outputSection = document.getElementById('output-section');
            const outputVideo = document.getElementById('output-video');
            const downloadBtn = document.getElementById('download-btn');
            const overlayMode = document.getElementById('overlay-mode');
            const replaceMode = document.getElementById('replace-mode');
            
            // Control Elements
            const rightVolume = document.getElementById('right-volume');
            const rightVolumeValue = document.getElementById('right-volume-value');
            const rightFrequency = document.getElementById('right-frequency');
            const rightFrequencyValue = document.getElementById('right-frequency-value');
            const leftVolume = document.getElementById('left-volume');
            const leftVolumeValue = document.getElementById('left-volume-value');
            const leftFrequency = document.getElementById('left-frequency');
            const leftFrequencyValue = document.getElementById('left-frequency-value');
            
            // Preset Buttons
            const presetButtons = document.querySelectorAll('[data-frequency]');
            
            // Audio Context Variables
            let audioContext;
            let audioBuffer;
            let videoBlob;
            
            // Event Listeners for Controls
            rightVolume.addEventListener('input', () => {
                rightVolumeValue.textContent = `${rightVolume.value}%`;
            });
            
            rightFrequency.addEventListener('input', () => {
                rightFrequencyValue.textContent = `${rightFrequency.value}Hz`;
            });
            
            leftVolume.addEventListener('input', () => {
                leftVolumeValue.textContent = `${leftVolume.value}%`;
            });
            
            leftFrequency.addEventListener('input', () => {
                leftFrequencyValue.textContent = `${leftFrequency.value}Hz`;
            });
            
            // Preset Button Handlers
            presetButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const rightFreq = parseInt(button.dataset.frequency);
                    const leftFreq = parseInt(button.dataset.left);
                    
                    rightFrequency.value = rightFreq;
                    rightFrequencyValue.textContent = `${rightFreq}Hz`;
                    
                    leftFrequency.value = leftFreq;
                    leftFrequencyValue.textContent = `${leftFreq}Hz`;
                });
            });
            
            // Mode Toggle
            overlayMode.addEventListener('change', () => {
                if (overlayMode.checked) {
                    replaceMode.checked = false;
                }
            });
            
            replaceMode.addEventListener('change', () => {
                if (replaceMode.checked) {
                    overlayMode.checked = false;
                }
            });
            
            // Drag and Drop Functionality
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropArea.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropArea.classList.add('border-indigo-500');
                dropArea.classList.add('bg-gray-800/30');
            }
            
            function unhighlight() {
                dropArea.classList.remove('border-indigo-500');
                dropArea.classList.remove('bg-gray-800/30');
            }
            
            dropArea.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const file = dt.files[0];
                handleVideoFile(file);
            }
            
            // File Upload Handler
            videoUpload.addEventListener('change', function() {
                const file = this.files[0];
                handleVideoFile(file);
            });
            
            // Video File Processing
            function handleVideoFile(file) {
                if (!file || !file.type.startsWith('video/')) {
                    alert('请选择有效的视频文件!');
                    return;
                }
                
                // Display video preview
                videoFilename.textContent = file.name;
                videoInfo.textContent = `${formatFileSize(file.size)} - ${file.type}`;
                const videoUrl = URL.createObjectURL(file);
                videoPlayer.src = videoUrl;
                videoPreview.classList.remove('hidden');
                
                // Store the original blob for later processing
                videoBlob = file;
            }
            
            // File Size Formatter
            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
            
            // Process Button Handler
            processBtn.addEventListener('click', function() {
                if (!videoBlob) {
                    alert('请先上传视频文件!');
                    return;
                }
                
                // Disable button during processing
                processBtn.disabled = true;
                processBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> 处理中...';
                
                // Prepare form data
                const formData = new FormData();
                formData.append('video', videoBlob);
                formData.append('right_frequency', rightFrequency.value);
                formData.append('left_frequency', leftFrequency.value);
                formData.append('right_volume', rightVolume.value);
                formData.append('left_volume', leftVolume.value);
                formData.append('mode', overlayMode.checked ? 'overlay' : 'replace');
                
                // Send to Laravel endpoint
                fetch('/process-video', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json',
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => { throw new Error(err.error || '处理失败'); });
                    }
                    return response.blob();
                })
                .then(blob => {
                    // Create video URL from the response
                    const videoUrl = URL.createObjectURL(blob);
                    outputVideo.src = videoUrl;
                    outputSection.classList.remove('hidden');
                    
                    // Set up download button
                    downloadBtn.onclick = function() {
                        const a = document.createElement('a');
                        a.href = videoUrl;
                        a.download = 'processed_' + videoBlob.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    };
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('处理视频时出错: ' + error.message);
                })
                .finally(() => {
                    // Re-enable button
                    processBtn.disabled = false;
                    processBtn.innerHTML = '<i class="fa fa-magic mr-2"></i> 处理视频';
                });
            });
        });
    </script>
</body>
</html>