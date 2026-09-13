<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Remix Studio</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        :root {
            --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            --gradient-success: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
            z-index: -1;
        }
        
        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .text-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .upload-zone {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px dashed;
        }
        
        .upload-zone:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .upload-zone.dragover {
            background: rgba(102, 126, 234, 0.05);
            border-color: #667eea !important;
        }
        
        .preview-item {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .preview-item:hover {
            transform: scale(1.03);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .btn-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.3s ease;
        }
        
        .btn-gradient:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        
        .tab-active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(102, 126, 234, 0.3);
            border-radius: 50%;
            border-top-color: #667eea;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .progress-gradient {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .slide-up {
            animation: slideUp 0.5s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .float-animation {
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        .pulse-ring {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
        }
        
        .blob {
            border-radius: 40% 60% 60% 40% / 70% 30% 70% 30%;
            animation: blob 8s ease-in-out infinite;
        }
        
        @keyframes blob {
            0%, 100% { border-radius: 40% 60% 60% 40% / 70% 30% 70% 30%; }
            25% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            75% { border-radius: 40% 60% 30% 70% / 60% 50% 60% 50%; }
        }
        
        input[type="range"] {
            -webkit-appearance: none;
            height: 6px;
            border-radius: 5px;
            background: #e5e7eb;
            outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
        }
        
        .result-show {
            animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</head>
<body class="antialiased">
    <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <!-- Floating Elements -->
        <div class="fixed top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div class="fixed bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div class="fixed top-1/2 left-1/4 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
        
        <!-- Main Container -->
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="glass-effect rounded-3xl shadow-2xl mb-8 overflow-hidden">
                <!-- Hero Section -->
                <div class="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 sm:p-12 text-center overflow-hidden">
                    <!-- Animated Background -->
                    <div class="absolute inset-0">
                        <div class="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                        <div class="absolute bottom-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                    </div>
                    
                    <div class="relative z-10">
                        <!-- Logo -->
                        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mb-6 pulse-ring">
                            <i class="fas fa-video text-4xl text-white"></i>
                        </div>
                        
                        <!-- Title -->
                        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4">
                            Video Remix <span class="text-yellow-300">Studio</span>
                        </h1>
                        
                        <!-- Subtitle -->
                        <p class="text-lg sm:text-xl text-white/90 mb-2 max-w-3xl mx-auto">
                            Create stunning videos with AI-powered editing tools
                        </p>
                        
                        <!-- Badge -->
                        <div class="inline-flex items-center justify-center gap-2 mt-6 px-6 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                            <span class="text-white/90 text-sm font-medium">
                                <i class="fas fa-bolt mr-2 text-yellow-300"></i>
                                Powered by Laravel & FFmpeg
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Tabs Navigation -->
                <div class="p-6 bg-gradient-to-b from-white to-gray-50">
                    <div class="flex flex-wrap gap-3 justify-center mb-8">
                        <button class="tab-btn px-6 py-4 rounded-xl font-bold transition-all duration-300 glass-card hover:shadow-lg border border-gray-200 hover:border-indigo-200 text-gray-700 hover:text-indigo-600" data-tab="slideshow">
                            <i class="fas fa-images mr-3 text-indigo-500"></i>
                            Slideshow Maker
                        </button>
                        <button class="tab-btn px-6 py-4 rounded-xl font-bold transition-all duration-300 glass-card hover:shadow-lg border border-gray-200 hover:border-purple-200 text-gray-700 hover:text-purple-600" data-tab="overlay">
                            <i class="fas fa-layer-group mr-3 text-purple-500"></i>
                            Image Overlay
                        </button>
                        <button class="tab-btn px-6 py-4 rounded-xl font-bold transition-all duration-300 glass-card hover:shadow-lg border border-gray-200 hover:border-pink-200 text-gray-700 hover:text-pink-600" data-tab="text">
                            <i class="fas fa-font mr-3 text-pink-500"></i>
                            Text Overlay
                        </button>
                        <button class="tab-btn px-6 py-4 rounded-xl font-bold transition-all duration-300 glass-card hover:shadow-lg border border-gray-200 hover:border-blue-200 text-gray-700 hover:text-blue-600" data-tab="frames">
                            <i class="fas fa-camera mr-3 text-blue-500"></i>
                            Frame Extractor
                        </button>
                    </div>
                    
                    <!-- Tabs Content -->
                    <div class="tab-content">
                        <!-- Slideshow Tab -->
                        <div class="tab-pane active" id="slideshow-tab">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <!-- Left Column -->
                                <div class="space-y-6">
                                    <!-- Upload Section -->
                                    <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                        <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                            <div class="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mr-3">
                                                <i class="fas fa-sliders-h text-white"></i>
                                            </div>
                                            Create Slideshow
                                        </h3>
                                        
                                        <!-- Upload Zone -->
                                        <div class="upload-zone bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-200 rounded-2xl p-8 text-center cursor-pointer mb-6" id="slideshowUpload">
                                            <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner">
                                                <i class="fas fa-cloud-upload-alt text-4xl text-indigo-500"></i>
                                            </div>
                                            <h4 class="text-xl font-semibold text-gray-800 mb-3">Drop Images Here</h4>
                                            <p class="text-gray-500 mb-6">Select or drag & drop multiple images (JPEG, PNG, WebP)</p>
                                            <input type="file" id="slideshowImages" multiple accept="image/*" class="hidden">
                                            <button onclick="document.getElementById('slideshowImages').click()" class="btn-gradient text-white font-bold px-8 py-3 rounded-xl inline-flex items-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                                <i class="fas fa-folder-open mr-3"></i>Browse Images
                                            </button>
                                            <p class="text-sm text-gray-400 mt-4">Supports up to 50 images, 20MB each</p>
                                        </div>
                                        
                                        <!-- Image Preview -->
                                        <div class="mb-6">
                                            <div class="flex justify-between items-center mb-4">
                                                <h4 class="text-lg font-semibold text-gray-800">Selected Images</h4>
                                                <span class="text-sm text-gray-500" id="slideshowCount">0 images</span>
                                            </div>
                                            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-2 custom-scrollbar" id="slideshowPreview"></div>
                                        </div>
                                        
                                        <!-- Settings -->
                                        <div class="space-y-6">
                                            <!-- Duration Slider -->
                                            <div>
                                                <div class="flex justify-between items-center mb-3">
                                                    <label class="block text-gray-700 font-semibold">Duration per image</label>
                                                    <span class="text-xl font-bold text-indigo-600" id="durationValue">5 seconds</span>
                                                </div>
                                                <!-- CHANGED: max="10" to max="60" -->
                                                <input type="range" id="slideshowDuration" min="1" max="60" value="5" class="w-full">
                                                <div class="flex justify-between text-sm text-gray-500 mt-2">
                                                    <span>Fast (1s)</span>
                                                    <span>Slow (60s)</span> <!-- CHANGED: 10s to 60s -->
                                                </div>
                                            </div>
                                            
                                            <!-- Audio Upload -->
                                            <div>
                                                <label class="block text-gray-700 font-semibold mb-3">Background Audio (Optional)</label>
                                                <div class="relative">
                                                    <input type="file" id="slideshowAudio" accept="audio/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-indigo-500 file:to-purple-500 file:text-white hover:file:opacity-90 file:transition-all file:duration-300">
                                                </div>
                                                <p class="text-sm text-gray-400 mt-2">MP3, WAV, AAC formats supported</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Right Column -->
                                <div class="space-y-6">
                                    <!-- Loading State -->
                                    <div class="loading hidden" id="slideshowLoading">
                                        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                                            <div class="spinner mx-auto mb-6"></div>
                                            <h4 class="text-2xl font-bold text-gray-800 mb-3">Creating Your Slideshow...</h4>
                                            <p class="text-gray-500 mb-6">Processing images and adding transitions</p>
                                            
                                            <!-- Progress Bar -->
                                            <div class="space-y-4">
                                                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div class="progress-gradient h-full w-0 transition-all duration-300" id="slideshowProgress"></div>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-sm font-medium text-gray-600" id="slideshowStatus">Processing images...</span>
                                                    <span class="text-sm font-bold text-indigo-600" id="slideshowProgressPercent">0%</span>
                                                </div>
                                            </div>
                                            
                                            <!-- Tips -->
                                            <div class="mt-8 p-4 bg-indigo-50 rounded-xl">
                                                <p class="text-sm text-indigo-700">
                                                    <i class="fas fa-lightbulb mr-2"></i>
                                                    Tip: Adding audio can make your slideshow more engaging!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Results -->
                                    <div class="result-container hidden" id="slideshowResult"></div>
                                    
                                    <!-- Action Card -->
                                    <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-xl">
                                        <div class="text-center mb-6">
                                            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                                                <i class="fas fa-film text-2xl text-white"></i>
                                            </div>
                                            <h4 class="text-2xl font-bold text-white mb-2">Ready to Create?</h4>
                                            <p class="text-white/80">Generate your slideshow with one click</p>
                                        </div>
                                        
                                        <button id="createSlideshowBtn" class="w-full bg-white text-indigo-600 font-bold py-4 rounded-xl text-lg hover:bg-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center">
                                            <i class="fas fa-play-circle mr-3 text-lg"></i>Create Slideshow Now
                                        </button>
                                        
                                        <div class="mt-6 grid grid-cols-3 gap-4">
                                            <div class="text-center">
                                                <div class="text-white text-2xl font-bold" id="totalImages">0</div>
                                                <div class="text-white/70 text-sm">Images</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-white text-2xl font-bold" id="totalDuration">0s</div>
                                                <div class="text-white/70 text-sm">Duration</div>
                                            </div>
                                            <div class="text-center">
                                                <div class="text-white text-2xl font-bold" id="audioStatus">No</div>
                                                <div class="text-white/70 text-sm">Audio</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Overlay Tab -->
                        <div class="tab-pane hidden" id="overlay-tab">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <!-- Left Column -->
                                <div class="space-y-6">
                                    <!-- Video Upload -->
                                    <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                        <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                            <div class="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                                                <i class="fas fa-water text-white"></i>
                                            </div>
                                            Overlay Images on Video
                                        </h3>
                                        
                                        <div class="space-y-6">
                                            <!-- Video Upload Zone -->
                                            <div>
                                                <label class="block text-gray-700 font-semibold mb-3">Upload Video</label>
                                                <div class="upload-zone bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-200 rounded-2xl p-6 text-center cursor-pointer" id="overlayVideoUpload">
                                                    <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                                                        <i class="fas fa-video text-3xl text-purple-500"></i>
                                                    </div>
                                                    <h5 class="font-semibold text-gray-700 mb-2">Drop Video Here</h5>
                                                    <p class="text-gray-500 text-sm mb-4">MP4, AVI, MOV formats up to 500MB</p>
                                                    <input type="file" id="overlayVideo" accept="video/*" class="hidden">
                                                    <button onclick="document.getElementById('overlayVideo').click()" class="btn-gradient text-white font-semibold px-6 py-2 rounded-lg text-sm">
                                                        Browse Video
                                                    </button>
                                                </div>
                                                <div class="mt-4 grid grid-cols-1" id="overlayVideoPreview"></div>
                                            </div>
                                            
                                            <!-- Images Upload Zone -->
                                            <div>
                                                <label class="block text-gray-700 font-semibold mb-3">Overlay Images</label>
                                                <div class="upload-zone bg-gradient-to-br from-pink-50/50 to-red-50/50 border-pink-200 rounded-2xl p-6 text-center cursor-pointer" id="overlayImagesUpload">
                                                    <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-100 to-red-100 flex items-center justify-center">
                                                        <i class="fas fa-image text-3xl text-pink-500"></i>
                                                    </div>
                                                    <h5 class="font-semibold text-gray-700 mb-2">Drop Images Here</h5>
                                                    <p class="text-gray-500 text-sm mb-4">Images will be overlaid on the video</p>
                                                    <input type="file" id="overlayImages" multiple accept="image/*" class="hidden">
                                                    <button onclick="document.getElementById('overlayImages').click()" class="btn-gradient text-white font-semibold px-6 py-2 rounded-lg text-sm">
                                                        Browse Images
                                                    </button>
                                                </div>
                                                <div class="grid grid-cols-4 gap-3 mt-4 max-h-48 overflow-y-auto p-2 custom-scrollbar" id="overlayImagesPreview"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Right Column -->
                                <div class="space-y-6">
                                    <!-- Loading -->
                                    <div class="loading hidden" id="overlayLoading">
                                        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                                            <div class="spinner mx-auto mb-6"></div>
                                            <h4 class="text-2xl font-bold text-gray-800 mb-3">Adding Overlays...</h4>
                                            <p class="text-gray-500">Processing video and applying image overlays</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Overlay Controls -->
                                    <div id="overlayControls" class="hidden">
                                        <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                            <h4 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                                <i class="fas fa-cogs text-purple-500 mr-3"></i>
                                                Configure Overlays
                                            </h4>
                                            <div id="overlayConfigs" class="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar"></div>
                                            
                                            <button onclick="addOverlayConfig()" class="mt-6 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300">
                                                <i class="fas fa-plus-circle mr-2"></i>Add Another Overlay
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Results -->
                                    <div class="result-container hidden" id="overlayResult"></div>
                                    
                                    <!-- Action Button -->
                                    <button id="applyOverlayBtn" disabled class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl text-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 opacity-50 cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none">
                                        <i class="fas fa-magic mr-3"></i>Apply Overlays to Video
                                    </button>
                                    
                                    <!-- Tips -->
                                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                                        <h5 class="font-bold text-purple-700 mb-2 flex items-center">
                                            <i class="fas fa-lightbulb mr-2"></i>Pro Tips
                                        </h5>
                                        <ul class="text-sm text-purple-600 space-y-1">
                                            <li>• Use PNG images with transparent background for best results</li>
                                            <li>• Adjust overlay duration based on video length</li>
                                            <li>• Preview each overlay position before applying</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Text Tab -->
                        <div class="tab-pane hidden" id="text-tab">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <!-- Left Column -->
                                <div class="space-y-6">
                                    <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                        <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                            <div class="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center mr-3">
                                                <i class="fas fa-text-height text-white"></i>
                                            </div>
                                            Add Text to Video
                                        </h3>
                                        
                                        <!-- Video Upload -->
                                        <div class="mb-8">
                                            <label class="block text-gray-700 font-semibold mb-3">Upload Video</label>
                                            <div class="upload-zone bg-gradient-to-br from-pink-50/50 to-red-50/50 border-pink-200 rounded-2xl p-6 text-center cursor-pointer" id="textVideoUpload">
                                                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-100 to-red-100 flex items-center justify-center">
                                                    <i class="fas fa-video text-3xl text-pink-500"></i>
                                                </div>
                                                <h5 class="font-semibold text-gray-700 mb-2">Drop Video Here</h5>
                                                <input type="file" id="textVideo" accept="video/*" class="hidden">
                                                <button onclick="document.getElementById('textVideo').click()" class="btn-gradient text-white font-semibold px-6 py-2 rounded-lg text-sm">
                                                    Browse Video
                                                </button>
                                            </div>
                                            <div class="mt-4" id="textVideoPreview"></div>
                                        </div>
                                        
                                        <!-- Text Configurations -->
                                        <div id="textConfigs" class="space-y-6"></div>
                                        
                                        <!-- Add More Button -->
                                        <button onclick="addTextConfig()" class="w-full mt-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-all duration-300">
                                            <i class="fas fa-plus-circle mr-2"></i>Add Another Text Overlay
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Right Column -->
                                <div class="space-y-6">
                                    <!-- Loading -->
                                    <div class="loading hidden" id="textLoading">
                                        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                                            <div class="spinner mx-auto mb-6"></div>
                                            <h4 class="text-2xl font-bold text-gray-800 mb-3">Adding Text Overlay...</h4>
                                            <p class="text-gray-500">Processing video and rendering text overlays</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Results -->
                                    <div class="result-container hidden" id="textResult"></div>
                                    
                                    <!-- Action Button -->
                                    <button id="addTextBtn" disabled class="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-4 rounded-xl text-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 opacity-50 cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none">
                                        <i class="fas fa-font mr-3"></i>Add Text to Video
                                    </button>
                                    
                                    <!-- Preview Area -->
                                    <div class="bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl p-6 border border-pink-100">
                                        <h5 class="font-bold text-pink-700 mb-4 flex items-center">
                                            <i class="fas fa-eye mr-2"></i>Preview Settings
                                        </h5>
                                        <div class="space-y-3">
                                            <div class="flex items-center justify-between">
                                                <span class="text-pink-600">Total Overlays:</span>
                                                <span class="font-bold" id="totalTextOverlays">0</span>
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <span class="text-pink-600">Video Duration:</span>
                                                <span class="font-bold" id="videoDuration">0s</span>
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <span class="text-pink-600">Font Sizes:</span>
                                                <span class="font-bold" id="fontSizes">24px</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Frames Tab -->
                        <div class="tab-pane hidden" id="frames-tab">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <!-- Left Column -->
                                <div class="space-y-6">
                                    <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                        <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                            <div class="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mr-3">
                                                <i class="fas fa-th text-white"></i>
                                            </div>
                                            Extract Frames from Video
                                        </h3>
                                        
                                        <!-- Video Upload -->
                                        <div class="mb-8">
                                            <label class="block text-gray-700 font-semibold mb-3">Upload Video</label>
                                            <div class="upload-zone bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-blue-200 rounded-2xl p-6 text-center cursor-pointer" id="framesVideoUpload">
                                                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                                                    <i class="fas fa-video text-3xl text-blue-500"></i>
                                                </div>
                                                <h5 class="font-semibold text-gray-700 mb-2">Drop Video Here</h5>
                                                <input type="file" id="framesVideo" accept="video/*" class="hidden">
                                                <button onclick="document.getElementById('framesVideo').click()" class="btn-gradient text-white font-semibold px-6 py-2 rounded-lg text-sm">
                                                    Browse Video
                                                </button>
                                            </div>
                                            <div class="mt-4" id="framesVideoPreview"></div>
                                        </div>
                                        
                                        <!-- Settings -->
                                        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6">
                                            <h5 class="font-bold text-blue-700 mb-4">Extraction Settings</h5>
                                            <div class="space-y-6">
                                                <!-- Frame Rate -->
                                                <div>
                                                    <div class="flex justify-between items-center mb-3">
                                                        <label class="block text-gray-700 font-semibold">Frame Rate</label>
                                                        <span class="text-xl font-bold text-blue-600" id="frameRateValue">1 fps</span>
                                                    </div>
                                                    <input type="range" id="frameRate" min="1" max="10" value="1" class="w-full">
                                                    <div class="flex justify-between text-sm text-gray-500 mt-2">
                                                        <span>Low (1 fps)</span>
                                                        <span>Medium (5 fps)</span>
                                                        <span>High (10 fps)</span>
                                                    </div>
                                                    <p class="text-sm text-blue-500 mt-3">
                                                        <i class="fas fa-info-circle mr-1"></i>
                                                        Higher frame rate = more frames extracted
                                                    </p>
                                                </div>
                                                
                                                <!-- Quality -->
                                                <div>
                                                    <label class="block text-gray-700 font-semibold mb-3">Output Quality</label>
                                                    <div class="grid grid-cols-3 gap-3">
                                                        <button class="quality-btn py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:border-blue-400 hover:bg-blue-50 transition-all" data-quality="low">
                                                            Low
                                                        </button>
                                                        <button class="quality-btn py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:border-blue-400 hover:bg-blue-50 transition-all active" data-quality="medium">
                                                            Medium
                                                        </button>
                                                        <button class="quality-btn py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:border-blue-400 hover:bg-blue-50 transition-all" data-quality="high">
                                                            High
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Right Column -->
                                <div class="space-y-6">
                                    <!-- Loading -->
                                    <div class="loading hidden" id="framesLoading">
                                        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                                            <div class="spinner mx-auto mb-6"></div>
                                            <h4 class="text-2xl font-bold text-gray-800 mb-3">Extracting Frames...</h4>
                                            <p class="text-gray-500 mb-6">Processing video and extracting frames</p>
                                            
                                            <!-- Progress -->
                                            <div class="space-y-4">
                                                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div class="progress-gradient h-full w-0 transition-all duration-300" id="framesProgress"></div>
                                                </div>
                                                <div class="flex justify-between">
                                                    <span class="text-sm font-medium text-gray-600" id="framesStatus">Processing video...</span>
                                                    <span class="text-sm font-bold text-blue-600" id="framesProgressPercent">0%</span>
                                                </div>
                                            </div>
                                            
                                            <!-- Stats -->
                                            <div class="mt-8 grid grid-cols-3 gap-4">
                                                <div class="text-center">
                                                    <div class="text-blue-600 text-2xl font-bold" id="estimatedFrames">0</div>
                                                    <div class="text-gray-600 text-sm">Estimated</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-blue-600 text-2xl font-bold" id="processedFrames">0</div>
                                                    <div class="text-gray-600 text-sm">Processed</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-blue-600 text-2xl font-bold" id="remainingTime">0s</div>
                                                    <div class="text-gray-600 text-sm">Remaining</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Results -->
                                    <div class="result-container hidden" id="framesResult"></div>
                                    
                                    <!-- Action Button -->
                                    <button id="extractFramesBtn" disabled class="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-xl text-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 opacity-50 cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none">
                                        <i class="fas fa-camera-retro mr-3"></i>Extract Frames Now
                                    </button>
                                    
                                    <!-- Info Card -->
                                    <div class="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
                                        <h5 class="font-bold text-xl mb-3 flex items-center">
                                            <i class="fas fa-chart-line mr-2"></i>Extraction Preview
                                        </h5>
                                        <div class="space-y-3">
                                            <div class="flex items-center justify-between">
                                                <span>Frame Rate:</span>
                                                <span class="font-bold" id="previewFrameRate">1 fps</span>
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <span>Estimated Frames:</span>
                                                <span class="font-bold" id="previewEstFrames">~0</span>
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <span>Output Format:</span>
                                                <span class="font-bold">JPG</span>
                                            </div>
                                        </div>
                                        <div class="mt-4 p-3 bg-white/20 rounded-lg">
                                            <p class="text-sm">
                                                <i class="fas fa-lightbulb mr-1"></i>
                                                Higher frame rates work best for fast-paced videos
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 p-6">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <div class="mb-4 md:mb-0">
                            <p class="text-gray-600 flex items-center">
                                <i class="fas fa-code mr-2 text-indigo-500"></i>
                                Video Remix Studio v2.0 
                                <span class="mx-3 text-gray-400">•</span>
                                <span class="text-sm bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 px-3 py-1 rounded-full">
                                    <i class="fas fa-star mr-1"></i>Premium Edition
                                </span>
                            </p>
                        </div>
                        <div class="flex items-center space-x-4">
                            <a href="#" class="text-gray-500 hover:text-indigo-600 transition-colors">
                                <i class="fab fa-github text-lg"></i>
                            </a>
                            <a href="#" class="text-gray-500 hover:text-indigo-600 transition-colors">
                                <i class="fas fa-question-circle text-lg"></i>
                            </a>
                            <a href="#" class="text-gray-500 hover:text-indigo-600 transition-colors">
                                <i class="fas fa-cog text-lg"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Image Preview Modal -->
    <div id="imageModal" class="fixed inset-0 bg-black bg-opacity-70 hidden items-center justify-center p-4 z-50">
        <div class="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 class="text-2xl font-bold text-gray-800">Image Preview</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 text-3xl leading-none">
                    &times;
                </button>
            </div>
            <div class="p-6 flex items-center justify-center">
                <img id="modalImage" src="" class="max-w-full max-h-[70vh] rounded-lg shadow-lg" alt="Preview">
            </div>
            <div class="p-4 border-t border-gray-200 text-center">
                <button onclick="closeModal()" class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                    Close Preview
                </button>
            </div>
        </div>
    </div>

    <!-- JavaScript with AJAX Implementation -->
    <script>
        // CSRF Token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        let overlayConfigCount = 0;
        let textConfigCount = 0;
        let currentQuality = 'medium';
        
        // Initialize
        $(document).ready(function() {
            setupFileUploads();
            updateSlideshowDuration();
            updateFrameRate();
            setupTabs();
            setupQualityButtons();
            addTextConfig(); // Add first text config
            
            // Event Listeners
            $('#slideshowDuration').on('input', updateSlideshowDuration);
            $('#frameRate').on('input', updateFrameRate);
            $('#createSlideshowBtn').on('click', createSlideshow);
            $('#applyOverlayBtn').on('click', applyOverlays);
            $('#addTextBtn').on('click', addTextOverlay);
            $('#extractFramesBtn').on('click', extractFrames);
            
            // Update preview stats
            updateSlideshowStats();
            updateFrameRatePreview();
        });
        
        function setupTabs() {
            $('.tab-btn').on('click', function() {
                const tabId = $(this).data('tab');
                
                // Update buttons
                $('.tab-btn').removeClass('tab-active shadow-lg');
                $(this).addClass('tab-active shadow-lg');
                
                // Update panes
                $('.tab-pane').removeClass('active').addClass('hidden');
                const activePane = $(`#${tabId}-tab`);
                activePane.removeClass('hidden').addClass('active slide-up');
                
                setTimeout(() => {
                    activePane.removeClass('slide-up');
                }, 500);
            });
        }
        
        function setupQualityButtons() {
            $('.quality-btn').on('click', function() {
                $('.quality-btn').removeClass('active');
                $(this).addClass('active');
                currentQuality = $(this).data('quality');
            });
        }
        
        function updateSlideshowDuration() {
            const value = $('#slideshowDuration').val();
            $('#durationValue').text(value + ' seconds');
            updateSlideshowStats();
        }
        
        function updateFrameRate() {
            const value = $('#frameRate').val();
            $('#frameRateValue').text(value + ' fps');
            $('#previewFrameRate').text(value + ' fps');
            updateFrameRatePreview();
        }
        
        function updateSlideshowStats() {
            const imageCount = $('#slideshowImages')[0]?.files.length || 0;
            const duration = $('#slideshowDuration').val();
            const audioStatus = $('#slideshowAudio')[0]?.files.length > 0 ? 'Yes' : 'No';
            const totalDuration = imageCount * duration;
            
            $('#totalImages').text(imageCount);
            $('#totalDuration').text(totalDuration + 's');
            $('#audioStatus').text(audioStatus);
            $('#slideshowCount').text(`${imageCount} images`);
        }
        
        function updateFrameRatePreview() {
            const frameRate = $('#frameRate').val();
            const estimatedFrames = Math.round(60 * frameRate);
            $('#previewEstFrames').text(`~${estimatedFrames}`);
            $('#estimatedFrames').text(estimatedFrames);
        }
        
        function setupFileUploads() {
            // Setup all upload zones
            ['slideshow', 'overlayVideo', 'overlayImages', 'textVideo', 'framesVideo'].forEach(type => {
                const uploadZone = $(`#${type}Upload`);
                const input = $(type === 'slideshow' ? '#slideshowImages' : 
                                type === 'overlayImages' ? '#overlayImages' : 
                                `#${type}`);
                
                if (uploadZone.length && input.length) {
                    setupDragAndDrop(uploadZone[0], input[0], () => handleFileUpload(type));
                }
            });
        }
        
        function setupDragAndDrop(uploadZone, input, callback) {
            $(uploadZone).on('click', () => $(input).click());
            
            ['dragover', 'dragenter'].forEach(event => {
                $(uploadZone).on(event, (e) => {
                    e.preventDefault();
                    $(uploadZone).addClass('dragover');
                });
            });
            
            ['dragleave', 'drop'].forEach(event => {
                $(uploadZone).on(event, (e) => {
                    e.preventDefault();
                    $(uploadZone).removeClass('dragover');
                });
            });
            
            $(uploadZone).on('drop', (e) => {
                const files = e.originalEvent.dataTransfer.files;
                if (files.length > 0) {
                    $(input)[0].files = files;
                    callback();
                }
            });
            
            $(input).on('change', callback);
        }
        
        function handleFileUpload(type) {
            switch(type) {
                case 'slideshow':
                    handleSlideshowImages();
                    break;
                case 'overlayVideo':
                    handleOverlayVideo();
                    break;
                case 'overlayImages':
                    handleOverlayImages();
                    break;
                case 'textVideo':
                    handleTextVideo();
                    break;
                case 'framesVideo':
                    handleFramesVideo();
                    break;
            }
        }
        
        function handleSlideshowImages() {
            const files = $('#slideshowImages')[0].files;
            const preview = $('#slideshowPreview');
            preview.html('');
            
            if (files.length > 0) {
                Array.from(files).forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const div = $(`
                                <div class="preview-item relative group cursor-pointer rounded-lg overflow-hidden">
                                    <img src="${e.target.result}" alt="${file.name}" class="w-full h-24 object-cover">
                                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button class="remove-btn bg-red-500 text-white p-1 rounded-full" onclick="removeSlideshowImage(${index})">
                                            <i class="fas fa-times text-sm"></i>
                                        </button>
                                    </div>
                                    <div class="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        ${index + 1}
                                    </div>
                                </div>
                            `);
                            preview.append(div);
                        };
                        reader.readAsDataURL(file);
                    }
                });
                updateSlideshowStats();
            }
        }
        
        function handleOverlayVideo() {
            const file = $('#overlayVideo')[0].files[0];
            const preview = $('#overlayVideoPreview');
            preview.html('');
            
            if (file && file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file);
                const div = $(`
                    <div class="preview-item rounded-xl overflow-hidden relative">
                        <video controls class="w-full h-48 object-cover rounded-lg">
                            <source src="${url}" type="${file.type}">
                        </video>
                        <div class="absolute top-2 right-2">
                            <button class="remove-btn bg-red-500 text-white p-2 rounded-full shadow-lg" onclick="removeOverlayVideo()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="p-3 bg-white">
                            <p class="font-medium text-gray-800 truncate">${file.name}</p>
                            <p class="text-sm text-gray-500">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                    </div>
                `);
                preview.append(div);
                checkOverlayReady();
            }
        }
        
        function handleOverlayImages() {
            const files = $('#overlayImages')[0].files;
            const preview = $('#overlayImagesPreview');
            preview.html('');
            
            if (files.length > 0) {
                Array.from(files).forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const div = $(`
                                <div class="preview-item relative group cursor-pointer rounded-lg overflow-hidden">
                                    <img src="${e.target.result}" alt="${file.name}" class="w-full h-20 object-cover">
                                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span class="text-white text-xs font-medium">Overlay ${index + 1}</span>
                                    </div>
                                </div>
                            `);
                            preview.append(div);
                        };
                        reader.readAsDataURL(file);
                    }
                });
                checkOverlayReady();
                generateOverlayConfigs();
            }
        }
        
        function handleTextVideo() {
            const file = $('#textVideo')[0].files[0];
            const preview = $('#textVideoPreview');
            preview.html('');
            
            if (file && file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file);
                const div = $(`
                    <div class="preview-item rounded-xl overflow-hidden">
                        <video controls class="w-full h-48 object-cover rounded-lg">
                            <source src="${url}" type="${file.type}">
                        </video>
                        <div class="p-3 bg-white">
                            <p class="font-medium text-gray-800">${file.name}</p>
                        </div>
                    </div>
                `);
                preview.append(div);
                $('#addTextBtn').prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
            }
        }
        
        function handleFramesVideo() {
            const file = $('#framesVideo')[0].files[0];
            const preview = $('#framesVideoPreview');
            preview.html('');
            
            if (file && file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file);
                const div = $(`
                    <div class="preview-item rounded-xl overflow-hidden">
                        <video controls class="w-full h-48 object-cover rounded-lg">
                            <source src="${url}" type="${file.type}">
                        </video>
                        <div class="p-3 bg-white">
                            <p class="font-medium text-gray-800">${file.name}</p>
                        </div>
                    </div>
                `);
                preview.append(div);
                $('#extractFramesBtn').prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
                updateFrameRatePreview();
            }
        }
        
        function checkOverlayReady() {
            const hasVideo = $('#overlayVideo')[0].files.length > 0;
            const hasImages = $('#overlayImages')[0].files.length > 0;
            
            if (hasVideo && hasImages) {
                $('#applyOverlayBtn').prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
                $('#overlayControls').removeClass('hidden');
            }
        }
        
        function generateOverlayConfigs() {
            const files = $('#overlayImages')[0].files;
            const container = $('#overlayConfigs');
            container.html('');
            overlayConfigCount = 0;
            
            for (let i = 0; i < files.length; i++) {
                addOverlayConfig();
            }
        }
        
        function addOverlayConfig() {
            const container = $('#overlayConfigs');
            overlayConfigCount++;
            
            const div = $(`
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                    <div class="flex justify-between items-center mb-3">
                        <h6 class="font-bold text-purple-700 flex items-center">
                            <i class="fas fa-image mr-2"></i>Overlay ${overlayConfigCount}
                        </h6>
                        <button class="text-red-500 hover:text-red-700" onclick="removeOverlayConfig(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Start Time (s)</label>
                            <input type="number" class="overlay-start w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" min="0" value="${(overlayConfigCount - 1) * 3}" step="0.5">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Duration (s)</label>
                            <input type="number" class="overlay-duration w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" min="1" max="30" value="5" step="0.5">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mt-3">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Position X</label>
                            <select class="overlay-x w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="10">Left (10px)</option>
                                <option value="W-w-10" selected>Right</option>
                                <option value="(w-text_w)/2">Center</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Position Y</label>
                            <select class="overlay-y w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="10">Top (10px)</option>
                                <option value="H-h-10" selected>Bottom</option>
                                <option value="(h-text_h)/2">Middle</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-3">
                        <label class="block text-sm text-gray-600 mb-1">Opacity</label>
                        <input type="range" class="overlay-opacity w-full" min="10" max="100" value="100">
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>10%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>
            `);
            container.append(div);
        }
        
        function removeOverlayConfig(button) {
            if (overlayConfigCount > 1) {
                $(button).closest('.bg-gradient-to-r').remove();
                overlayConfigCount--;
            }
        }
        
        function addTextConfig() {
            const container = $('#textConfigs');
            textConfigCount++;
            
            const div = $(`
                <div class="text-config bg-gradient-to-r from-pink-50 to-red-50 p-5 rounded-xl border border-pink-100">
                    <div class="flex justify-between items-center mb-4">
                        <h6 class="font-bold text-pink-700 flex items-center">
                            <i class="fas fa-font mr-2"></i>Text Overlay ${textConfigCount}
                        </h6>
                        ${textConfigCount > 1 ? `<button class="text-red-500 hover:text-red-700" onclick="removeTextConfig(this)">
                            <i class="fas fa-times"></i>
                        </button>` : ''}
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2 font-medium">Text Content</label>
                        <input type="text" class="form-control w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Enter text to display" value="Sample Text ${textConfigCount}">
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-gray-700 mb-2 font-medium">Start Time (s)</label>
                            <input type="number" class="form-control w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" min="0" value="${(textConfigCount - 1) * 3}" step="0.5">
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2 font-medium">End Time (s)</label>
                            <input type="number" class="form-control w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" min="0" value="${(textConfigCount - 1) * 3 + 5}" step="0.5">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 mb-2 font-medium">Font Size</label>
                            <input type="number" class="form-control w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" min="12" max="72" value="24">
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2 font-medium">Color</label>
                            <input type="color" class="form-control-color w-full h-10 px-1 border border-gray-300 rounded-lg cursor-pointer" value="#ffffff">
                        </div>
                    </div>
                    <div class="mt-4">
                        <label class="block text-gray-700 mb-2 font-medium">Font Style</label>
                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                            <option value="Arial">Arial</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Impact">Impact</option>
                        </select>
                    </div>
                </div>
            `);
            container.append(div);
            updateTextStats();
        }
        
        function removeTextConfig(button) {
            if (textConfigCount > 1) {
                $(button).closest('.text-config').remove();
                textConfigCount--;
                updateTextStats();
            }
        }
        
        function updateTextStats() {
            $('#totalTextOverlays').text(textConfigCount);
        }
        
        function removeSlideshowImage(index) {
            alert('Image removal would be implemented here. For now, please re-upload images.');
        }
        
        function removeOverlayVideo() {
            $('#overlayVideo').val('');
            $('#overlayVideoPreview').html('');
            checkOverlayReady();
        }
        
        // AJAX Functions
        function createSlideshow() {
            const imagesInput = $('#slideshowImages')[0];
            const audioInput = $('#slideshowAudio')[0];
            
            if (!imagesInput.files || imagesInput.files.length === 0) {
                alert('Please select at least one image.');
                return;
            }
            
            const formData = new FormData();
            
            // Add images
            for (let file of imagesInput.files) {
                formData.append('images[]', file);
            }
            
            // Add audio if exists
            if (audioInput.files.length > 0) {
                formData.append('audio', audioInput.files[0]);
            }
            
            // Add duration
            const duration = $('#slideshowDuration').val();
            formData.append('duration', duration);
            
            // Show loading
            const loading = $('#slideshowLoading');
            const result = $('#slideshowResult');
            const progress = $('#slideshowProgress');
            const status = $('#slideshowStatus');
            const progressPercent = $('#slideshowProgressPercent');
            
            loading.removeClass('hidden');
            result.addClass('hidden').html('');
            
            $.ajax({
                url: '/api/video-remix/create-slideshow',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                xhr: function() {
                    const xhr = new window.XMLHttpRequest();
                    
                    // Upload progress
                    xhr.upload.addEventListener('progress', function(e) {
                        if (e.lengthComputable) {
                            const percentComplete = Math.round((e.loaded / e.total) * 85);
                            progress.css('width', percentComplete + '%');
                            progressPercent.text(percentComplete + '%');
                            status.text(`Uploading ${percentComplete}%`);
                        }
                    });
                    
                    // Download progress
                    xhr.addEventListener('progress', function(e) {
                        if (e.lengthComputable) {
                            const percentComplete = 85 + Math.round((e.loaded / e.total) * 15);
                            progress.css('width', percentComplete + '%');
                            progressPercent.text(percentComplete + '%');
                            status.text(`Processing ${percentComplete}%`);
                        }
                    });
                    
                    return xhr;
                },
                success: function(data) {
                    progress.css('width', '100%');
                    progressPercent.text('100%');
                    status.text('Complete!');
                    
                    setTimeout(() => {
                        loading.addClass('hidden');
                        if (data.video_url) {
                            result.html(`
                                <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 result-show">
                                    <div class="text-center mb-6">
                                        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                            <i class="fas fa-check text-2xl text-white"></i>
                                        </div>
                                        <h4 class="text-2xl font-bold text-gray-800 mb-2">Slideshow Created Successfully!</h4>
                                        <p class="text-gray-600">Your slideshow is ready to download</p>
                                    </div>
                                    
                                    <div class="mb-6">
                                        <video controls class="w-full rounded-xl shadow-lg" style="max-height: 400px;">
                                            <source src="${data.video_url}" type="video/mp4">
                                        </video>
                                    </div>
                                    
                                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                                        <a href="${data.video_url}" class="btn-gradient text-white font-bold px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center" download>
                                            <i class="fas fa-download mr-3"></i>Download Video
                                        </a>
                                        <button class="bg-white border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-300 flex items-center justify-center" onclick="copyToClipboard('${data.video_url}')">
                                            <i class="fas fa-copy mr-3"></i>Copy URL
                                        </button>
                                    </div>
                                    
                                    <div class="mt-6 grid grid-cols-3 gap-4">
                                        <div class="text-center p-3 bg-white rounded-lg border">
                                            <div class="text-green-600 text-xl font-bold">${imagesInput.files.length}</div>
                                            <div class="text-gray-600 text-sm">Images</div>
                                        </div>
                                        <div class="text-center p-3 bg-white rounded-lg border">
                                            <div class="text-green-600 text-xl font-bold">${duration}s</div>
                                            <div class="text-gray-600 text-sm">Per Image</div>
                                        </div>
                                        <div class="text-center p-3 bg-white rounded-lg border">
                                            <div class="text-green-600 text-xl font-bold">${audioInput.files.length > 0 ? 'Yes' : 'No'}</div>
                                            <div class="text-gray-600 text-sm">Audio</div>
                                        </div>
                                    </div>
                                </div>
                            `).removeClass('hidden');
                        } else {
                            showError(result[0], data.error || 'Failed to create slideshow');
                        }
                    }, 500);
                },
                error: function(xhr, status, error) {
                    loading.addClass('hidden');
                    showError(result[0], xhr.responseJSON?.error || error);
                }
            });
        }
        
        function applyOverlays() {
            const videoFile = $('#overlayVideo')[0].files[0];
            const imageFiles = $('#overlayImages')[0].files;
            
            if (!videoFile || !imageFiles || imageFiles.length === 0) {
                alert('Please select a video and at least one image.');
                return;
            }
            
            const formData = new FormData();
            formData.append('video', videoFile);
            
            // Get overlay configurations
            const startInputs = $('.overlay-start');
            const durationInputs = $('.overlay-duration');
            const xInputs = $('.overlay-x');
            const yInputs = $('.overlay-y');
            
            for (let i = 0; i < imageFiles.length; i++) {
                formData.append(`images[${i}][image]`, imageFiles[i]);
                formData.append(`images[${i}][start_time]`, startInputs.eq(i).val() || i * 3);
                formData.append(`images[${i}][duration]`, durationInputs.eq(i).val() || 5);
                formData.append(`images[${i}][position_x]`, xInputs.eq(i).val() || 'W-w-10');
                formData.append(`images[${i}][position_y]`, yInputs.eq(i).val() || 'H-h-10');
            }
            
            // Show loading
            const loading = $('#overlayLoading');
            const result = $('#overlayResult');
            loading.removeClass('hidden');
            result.addClass('hidden');
            
            $.ajax({
                url: '/api/video-remix/overlay-images',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                success: function(data) {
                    loading.addClass('hidden');
                    
                    if (data.video_url) {
                        result.html(`
                            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 result-show">
                                <div class="text-center mb-6">
                                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                        <i class="fas fa-check text-2xl text-white"></i>
                                    </div>
                                    <h4 class="text-2xl font-bold text-gray-800 mb-2">Overlays Applied Successfully!</h4>
                                    <p class="text-gray-600">${imageFiles.length} overlays added to your video</p>
                                </div>
                                
                                <div class="mb-6">
                                    <video controls class="w-full rounded-xl shadow-lg" style="max-height: 400px;">
                                        <source src="${data.video_url}" type="video/mp4">
                                    </video>
                                </div>
                                
                                <div class="flex justify-center">
                                    <a href="${data.video_url}" class="btn-gradient text-white font-bold px-8 py-3 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center" download>
                                        <i class="fas fa-download mr-3"></i>Download Video
                                    </a>
                                </div>
                            </div>
                        `).removeClass('hidden');
                    } else {
                        showError(result[0], data.error || 'Failed to apply overlays');
                    }
                },
                error: function(xhr, status, error) {
                    loading.addClass('hidden');
                    showError(result[0], xhr.responseJSON?.error || error);
                }
            });
        }
        
        function addTextOverlay() {
            const videoFile = $('#textVideo')[0].files[0];
            const textConfigs = $('.text-config');
            
            if (!videoFile) {
                alert('Please select a video.');
                return;
            }
            
            const formData = new FormData();
            formData.append('video', videoFile);
            
            // Add text configurations
            textConfigs.each(function(index) {
                const config = $(this);
                const text = config.find('input[type="text"]').val();
                const startTime = config.find('input[type="number"]').eq(0).val();
                const endTime = config.find('input[type="number"]').eq(1).val();
                const fontSize = config.find('input[type="number"]').eq(2).val();
                const color = config.find('input[type="color"]').val();
                const fontStyle = config.find('select').val();
                
                formData.append(`texts[${index}][text]`, text);
                formData.append(`texts[${index}][start_time]`, startTime);
                formData.append(`texts[${index}][end_time]`, endTime);
                formData.append(`texts[${index}][font_size]`, fontSize);
                formData.append(`texts[${index}][color]`, color);
                formData.append(`texts[${index}][font_style]`, fontStyle);
            });
            
            // Show loading
            const loading = $('#textLoading');
            const result = $('#textResult');
            loading.removeClass('hidden');
            result.addClass('hidden');
            
            $.ajax({
                url: '/api/video-remix/add-text',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                success: function(data) {
                    loading.addClass('hidden');
                    
                    if (data.video_url) {
                        result.html(`
                            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 result-show">
                                <div class="text-center mb-6">
                                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                        <i class="fas fa-check text-2xl text-white"></i>
                                    </div>
                                    <h4 class="text-2xl font-bold text-gray-800 mb-2">Text Added Successfully!</h4>
                                    <p class="text-gray-600">${textConfigs.length} text overlays added to your video</p>
                                </div>
                                
                                <div class="mb-6">
                                    <video controls class="w-full rounded-xl shadow-lg" style="max-height: 400px;">
                                        <source src="${data.video_url}" type="video/mp4">
                                    </video>
                                </div>
                                
                                <div class="flex justify-center">
                                    <a href="${data.video_url}" class="btn-gradient text-white font-bold px-8 py-3 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center" download>
                                        <i class="fas fa-download mr-3"></i>Download Video
                                    </a>
                                </div>
                            </div>
                        `).removeClass('hidden');
                    } else {
                        showError(result[0], data.error || 'Failed to add text');
                    }
                },
                error: function(xhr, status, error) {
                    loading.addClass('hidden');
                    showError(result[0], xhr.responseJSON?.error || error);
                }
            });
        }
        
        function extractFrames() {
            const videoFile = $('#framesVideo')[0].files[0];
            
            if (!videoFile) {
                alert('Please select a video.');
                return;
            }
            
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('frame_rate', $('#frameRate').val());
            formData.append('quality', currentQuality);
            
            // Show loading
            const loading = $('#framesLoading');
            const result = $('#framesResult');
            const progress = $('#framesProgress');
            const status = $('#framesStatus');
            const progressPercent = $('#framesProgressPercent');
            const processedFrames = $('#processedFrames');
            const remainingTime = $('#remainingTime');
            
            loading.removeClass('hidden');
            result.addClass('hidden').html('');
            
            $.ajax({
                url: '/api/video-remix/extract-frames',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                xhr: function() {
                    const xhr = new window.XMLHttpRequest();
                    
                    // Upload progress
                    xhr.upload.addEventListener('progress', function(e) {
                        if (e.lengthComputable) {
                            const percentComplete = Math.round((e.loaded / e.total) * 30);
                            progress.css('width', percentComplete + '%');
                            progressPercent.text(percentComplete + '%');
                            status.text(`Uploading ${percentComplete}%`);
                        }
                    });
                    
                    return xhr;
                },
                success: function(data) {
                    progress.css('width', '100%');
                    progressPercent.text('100%');
                    status.text('Complete!');
                    
                    setTimeout(() => {
                        loading.addClass('hidden');
                        
                        if (data.frames && data.frames.length > 0) {
                            let framesHTML = `
                                <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 result-show">
                                    <div class="text-center mb-6">
                                        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                            <i class="fas fa-check text-2xl text-white"></i>
                                        </div>
                                        <h4 class="text-2xl font-bold text-gray-800 mb-2">${data.count} Frames Extracted!</h4>
                                        <p class="text-gray-600">Click on any frame to view larger version</p>
                                    </div>
                                    
                                    <div class="frame-grid grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-3 custom-scrollbar bg-white/50 rounded-xl">
                            `;
                            
                            data.frames.forEach((frame, index) => {
                                framesHTML += `
                                    <div class="frame-item group relative cursor-pointer">
                                        <img src="${frame}" alt="Frame ${index + 1}" 
                                             class="w-full h-20 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                                             onclick="showImageModal('${frame}')">
                                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                            <span class="text-white text-xs font-bold opacity-0 group-hover:opacity-100">${index + 1}</span>
                                        </div>
                                    </div>
                                `;
                            });
                            
                            framesHTML += `
                                    </div>
                                    
                                    <div class="mt-6 grid grid-cols-3 gap-4">
                                        <div class="text-center p-3 bg-white rounded-lg border">
                                            <div class="text-green-600 text-xl font-bold">${data.frames.length}</div>
                                            <div class="text-gray-600 text-sm">Frames</div>
                                        </div>
                                        <div class="text-center p-3 bg-white rounded-lg border">
                                            <div class="text-green-600 text-xl font-bold">${$('#frameRate').val()}fps</div>
                                            <div class="text-gray-600 text-sm">Frame Rate</div>
                                        </div>
                                        <div class="text-center p-3 bg-white rounded-lg border">
                                            <div class="text-green-600 text-xl font-bold">${currentQuality}</div>
                                            <div class="text-gray-600 text-sm">Quality</div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                                        <button class="btn-gradient text-white font-bold px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center" onclick="downloadAllFrames(${JSON.stringify(data.frames).replace(/'/g, "\\'")})">
                                            <i class="fas fa-file-archive mr-3"></i>Download All Frames (ZIP)
                                        </button>
                                        <button class="bg-white border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-300 flex items-center justify-center" onclick="selectAllFrames()">
                                            <i class="fas fa-check-circle mr-3"></i>Select All
                                        </button>
                                    </div>
                                </div>
                            `;
                            
                            result.html(framesHTML).removeClass('hidden');
                        } else {
                            showError(result[0], 'No frames extracted from video');
                        }
                    }, 500);
                },
                error: function(xhr, status, error) {
                    loading.addClass('hidden');
                    showError(result[0], xhr.responseJSON?.error || error);
                }
            });
        }
        
        function showError(container, message) {
            const errorDiv = $(`
                <div class="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                    <div class="text-center">
                        <i class="fas fa-times-circle text-4xl text-red-500 mb-4"></i>
                        <h4 class="text-xl font-bold text-gray-800 mb-2">Error</h4>
                        <p class="text-gray-600">${message}</p>
                    </div>
                </div>
            `);
            $(container).html(errorDiv).removeClass('hidden');
        }
        
        function showImageModal(src) {
            $('#modalImage').attr('src', src);
            $('#imageModal').removeClass('hidden');
        }
        
        function closeModal() {
            $('#imageModal').addClass('hidden');
        }
        
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('URL copied to clipboard!');
            });
        }
        
        function downloadAllFrames(frames) {
            alert(`Downloading ${frames.length} frames as ZIP file...\n\nThis would trigger a server-side ZIP creation and download in a real application.`);
        }
        
        function selectAllFrames() {
            alert('All frames selected for download.');
        }
        
        // Close modal on escape key
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    </script>
</body>
</html>