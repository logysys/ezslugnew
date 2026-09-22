<?php

namespace App\Http\Controllers;

use App\Services\VideoRemixService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class VideoRemixController extends Controller
{
    protected $videoRemixService;

    public function __construct(VideoRemixService $videoRemixService)
    {
        $this->videoRemixService = $videoRemixService;
    }

    public function index()
    {
        return view('video-remix');
    }

    public function createFromImages(Request $request)
    {
        try {
            $request->validate([
                'images' => 'required|array|min:1',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:102400',
                'audio' => 'nullable|file|mimes:mp3,wav,aac,m4a|max:102400',
                'duration_per_image' => 'nullable|integer|min:1|max:60', // CHANGED: max:30 to max:60
            ]);

            Log::info('Creating video from images', [
                'image_count' => count($request->file('images')),
                'has_audio' => $request->hasFile('audio')
            ]);

            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('temp', 'public');
                $imagePaths[] = storage_path('app/public/' . $path);
            }

            $audioPath = null;
            if ($request->hasFile('audio')) {
                $audioPath = $request->file('audio')->store('temp', 'public');
                $audioPath = storage_path('app/public/' . $audioPath);
            }

            $videoPath = $this->videoRemixService->createVideoFromImages(
                $imagePaths,
                $audioPath,
                [
                    'duration_per_image' => $request->input('duration_per_image', 5),
                    'width' => 1920,
                    'height' => 1080
                ]
            );

            return response()->json([
                'success' => true,
                'video_url' => Storage::url(str_replace(storage_path('app/public/'), '', $videoPath)),
                'download_url' => route('video.download', ['filename' => basename($videoPath)])
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating video from images: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to create video: ' . $e->getMessage()
            ], 500);
        }
    }

    public function overlayImages(Request $request)
    {
        try {
            $request->validate([
                'video' => 'required|file|mimes:mp4,avi,mov,webm,mkv|max:102400',
                'images' => 'required|array|min:1',
                'images.*.image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:102400',
                'images.*.start_time' => 'required|numeric|min:0',
                'images.*.duration' => 'nullable|numeric|min:1|max:30',
                'images.*.position_x' => 'nullable|string',
                'images.*.position_y' => 'nullable|string',
                'images.*.opacity' => 'nullable|numeric|min:0|max:100',
            ]);

            // Store video
            $videoPath = $request->file('video')->store('temp', 'public');
            $videoPath = storage_path('app/public/' . $videoPath);
            
            // Process images with timestamps
            $imagesWithTimestamps = [];
            $index = 0;
            
            if ($request->has('images')) {
                foreach ($request->input('images') as $imageData) {
                    if ($request->hasFile("images.{$index}.image")) {
                        $imagePath = $request->file("images.{$index}.image")->store('temp', 'public');
                        
                        $imagesWithTimestamps[] = [
                            'image_path' => storage_path('app/public/' . $imagePath),
                            'start' => $imageData['start_time'] ?? $index * 3,
                            'duration' => $imageData['duration'] ?? 5,
                            'position_x' => $imageData['position_x'] ?? 'W-w-20',
                            'position_y' => $imageData['position_y'] ?? 'H-h-20',
                            'opacity' => isset($imageData['opacity']) ? $imageData['opacity'] : 100,
                        ];
                    }
                    $index++;
                }
            }

            $outputPath = $this->videoRemixService->overlayImagesOnVideo(
                $videoPath,
                $imagesWithTimestamps
            );

            return response()->json([
                'success' => true,
                'video_url' => Storage::url(str_replace(storage_path('app/public/'), '', $outputPath)),
                'download_url' => route('video.download', ['filename' => basename($outputPath)])
            ]);

        } catch (\Exception $e) {
            Log::error('Error overlaying images: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to overlay images: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createSlideshow(Request $request)
    {
        try {
            Log::info('Slideshow request received', [
                'has_images' => $request->hasFile('images'),
                'image_count' => $request->hasFile('images') ? count($request->file('images')) : 0,
                'has_audio' => $request->hasFile('audio'),
                'duration' => $request->input('duration', 5)
            ]);

            $request->validate([
                'images' => 'required|array|min:1',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:102400',
                'audio' => 'nullable|file|mimes:mp3,wav,aac,m4a|max:102400',
                'duration' => 'nullable|integer|min:1|max:60', // CHANGED: max:10 to max:60
            ]);

            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('temp', 'public');
                $imagePaths[] = storage_path('app/public/' . $path);
            }

            $audioPath = null;
            if ($request->hasFile('audio')) {
                $audioPath = $request->file('audio')->store('temp', 'public');
                $audioPath = storage_path('app/public/' . $audioPath);
            }

            Log::info('Calling video remix service', [
                'image_count' => count($imagePaths),
                'has_audio' => !is_null($audioPath),
                'duration' => $request->input('duration', 5)
            ]);

            $videoPath = $this->videoRemixService->createSlideshow(
                $imagePaths,
                $request->input('duration', 5),
                $audioPath
            );
            
            Log::info('Slideshow created successfully', [
                'video_path' => $videoPath
            ]);

            return response()->json([
                'success' => true,
                'video_url' => Storage::url(str_replace(storage_path('app/public/'), '', $videoPath)),
                'download_url' => route('video.download', ['filename' => basename($videoPath)])
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating slideshow: ' . $e->getMessage());
            Log::error('Error trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to create slideshow: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function addTextOverlay(Request $request)
    {
        try {
            $request->validate([
                'video' => 'required|file|mimes:mp4,avi,mov,webm,mkv|max:102400',
                'texts' => 'required|array|min:1',
                'texts.*.text' => 'required|string|max:100',
                'texts.*.start_time' => 'required|numeric|min:0',
                'texts.*.end_time' => 'required|numeric|min:0',
                'texts.*.font_size' => 'nullable|integer|min:12|max:72',
                'texts.*.color' => 'nullable|string',
                'texts.*.font_style' => 'nullable|string',
            ]);

            // Store video
            $videoPath = $request->file('video')->store('temp', 'public');
            $videoPath = storage_path('app/public/' . $videoPath);
            
            $textConfigs = [];
            if ($request->has('texts')) {
                foreach ($request->input('texts') as $text) {
                    $textConfigs[] = [
                        'text' => $text['text'],
                        'start' => $text['start_time'],
                        'end' => $text['end_time'],
                        'x' => '(w-text_w)/2', // Center by default
                        'y' => 'h*0.9', // Bottom by default
                        'fontsize' => $text['font_size'] ?? 24,
                        'color' => $text['color'] ?? 'white',
                        'font' => $text['font_style'] ?? 'Arial',
                        'box' => 1, // Add background box
                    ];
                }
            }

            $outputPath = $this->videoRemixService->addTextToVideo(
                $videoPath,
                $textConfigs
            );

            return response()->json([
                'success' => true,
                'video_url' => Storage::url(str_replace(storage_path('app/public/'), '', $outputPath)),
                'download_url' => route('video.download', ['filename' => basename($outputPath)])
            ]);

        } catch (\Exception $e) {
            Log::error('Error adding text overlay: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to add text overlay: ' . $e->getMessage()
            ], 500);
        }
    }

    public function extractFrames(Request $request)
    {
        try {
            $request->validate([
                'video' => 'required|file|mimes:mp4,avi,mov,webm,mkv|max:102400',
                'frame_rate' => 'nullable|integer|min:1|max:60',
                'quality' => 'nullable|string|in:low,medium,high',
            ]);

            // Store video
            $videoPath = $request->file('video')->store('temp', 'public');
            $videoPath = storage_path('app/public/' . $videoPath);
            
            $frames = $this->videoRemixService->extractFrames(
                $videoPath,
                $request->input('frame_rate', 1),
                $request->input('quality', 'medium')
            );

            $frameUrls = array_map(function($frame) {
                return Storage::url(str_replace(storage_path('app/public/'), '', $frame));
            }, $frames);

            return response()->json([
                'success' => true,
                'frames' => $frameUrls,
                'count' => count($frames)
            ]);

        } catch (\Exception $e) {
            Log::error('Error extracting frames: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to extract frames: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadVideo($filename)
    {
        $path = storage_path('app/public/videos/' . $filename);
        
        if (!file_exists($path)) {
            // Try temp directory
            $path = storage_path('app/public/temp/' . $filename);
            
            if (!file_exists($path)) {
                abort(404, 'File not found');
            }
        }

        return response()->download($path, $filename);
    }
}