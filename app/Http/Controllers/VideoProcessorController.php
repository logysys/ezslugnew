<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use FFMpeg\FFMpeg;
use FFMpeg\Format\Video\X264;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class VideoProcessorController extends Controller
{
	public function processmp4()
    {
        return view('video-processor');
    }
    public function processVideo(Request $request)
{
    // Validate the request (keep existing validation)
    $request->validate([
        'video' => 'required|file|mimetypes:video/mp4,video/quicktime',
        'right_frequency' => 'required|numeric|min:0',
        'left_frequency' => 'required|numeric|min:0',
        'right_volume' => 'required|numeric|between:0,100',
        'left_volume' => 'required|numeric|between:0,100',
        'mode' => 'required|in:overlay,replace',
    ]);

    // Create directories (keep existing directory creation)
    $tempDir = public_path('temp');
    $outputDir = public_path('mp4converter');
    
    if (!file_exists($tempDir)) {
        mkdir($tempDir, 0755, true);
    }
    
    if (!file_exists($outputDir)) {
        mkdir($outputDir, 0755, true);
    }

    try {
        // Check FFmpeg availability (keep existing checks)
        $ffmpegPath = env('FFMPEG_PATH', '/usr/bin/ffmpeg');
        $ffprobePath = env('FFPROBE_PATH', '/usr/bin/ffprobe');
        
        if (!file_exists($ffmpegPath) || !is_executable($ffmpegPath)) {
            throw new \Exception("FFmpeg not found or not executable at: {$ffmpegPath}");
        }
        
        if (!file_exists($ffprobePath) || !is_executable($ffprobePath)) {
            throw new \Exception("FFprobe not found or not executable at: {$ffprobePath}");
        }

        // Store uploaded video (keep existing file handling)
        $videoFile = $request->file('video');
        $videoFilename = 'upload_' . time() . '_' . uniqid() . '.' . $videoFile->getClientOriginalExtension();
        $videoFile->move($tempDir, $videoFilename);
        $fullVideoPath = $tempDir . '/' . $videoFilename;
        
        // Initialize FFmpeg
        $ffmpeg = FFMpeg::create([
            'ffmpeg.binaries'  => $ffmpegPath,
            'ffprobe.binaries' => $ffprobePath,
            'timeout'         => 3600,
            'ffmpeg.threads'   => 12,
        ]);
        
        // Open video file
        $video = $ffmpeg->open($fullVideoPath);
        
        // Get video duration
        $duration = $video->getStreams()->first()->get('duration');
        if ($duration <= 0) {
            throw new \Exception("Invalid video duration");
        }

        // Generate binaural beats audio
        $audioPath = $this->generateBinauralBeats(
            $duration,
            $request->right_frequency,
            $request->left_frequency,
            $request->right_volume / 100,
            $request->left_volume / 100,
            $request->mode
        );
        
        if (!file_exists($audioPath)) {
            throw new \Exception("Failed to generate audio file");
        }

        // Process output
        $outputFilename = 'processed_' . time() . '_' . uniqid() . '.mp4';
        $outputPath = $outputDir . '/' . $outputFilename;
        
        $format = new X264('aac');
        $format->setAudioChannels(2);
        
        // Temporary audio file path
        $tempAudioPath = $tempDir . '/temp_audio_' . uniqid() . '.aac';
        
        // Build FFmpeg command based on mode
        if ($request->mode === 'overlay') {
            // Mix original audio with binaural beats
            $command = sprintf(
                '%s -y -i %s -i %s -filter_complex "[0:a]aformat=channel_layouts=stereo[orig];[1:a]aformat=channel_layouts=stereo[beat];[orig][beat]amix=inputs=2:duration=longest" -c:v copy -c:a aac -b:a 192k %s',
                escapeshellarg($ffmpegPath),
                escapeshellarg($fullVideoPath),
                escapeshellarg($audioPath),
                escapeshellarg($outputPath)
            );
        } else {
            // Replace audio with binaural beats
            $command = sprintf(
                '%s -y -i %s -i %s -c:v copy -map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k %s',
                escapeshellarg($ffmpegPath),
                escapeshellarg($fullVideoPath),
                escapeshellarg($audioPath),
                escapeshellarg($outputPath)
            );
        }
        
        // Execute the command
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0 || !file_exists($outputPath)) {
            Log::error('Video processing failed', [
                'command' => $command,
                'output' => $output,
                'return_code' => $returnCode
            ]);
            throw new \Exception("Video processing failed with code {$returnCode}");
        }

        // Clean up temporary files
        if (file_exists($fullVideoPath)) {
            File::delete($fullVideoPath);
        }
        if (file_exists($audioPath)) {
            File::delete($audioPath);
        }
        if (file_exists($tempAudioPath)) {
            File::delete($tempAudioPath);
        }
        
        // Return the processed video
        return response()->download($outputPath, $outputFilename, [
            'Content-Type' => 'video/mp4',
        ])->deleteFileAfterSend(true);
        
    } catch (\Exception $e) {
        // Clean up and log error (keep existing error handling)
        Log::error('Video processing failed', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'request' => $request->except(['video']),
        ]);
        
        if (isset($fullVideoPath) && file_exists($fullVideoPath)) {
            File::delete($fullVideoPath);
        }
        if (isset($audioPath) && file_exists($audioPath)) {
            File::delete($audioPath);
        }
        if (isset($outputPath) && file_exists($outputPath)) {
            File::delete($outputPath);
        }
        if (isset($tempAudioPath) && file_exists($tempAudioPath)) {
            File::delete($tempAudioPath);
        }
        
        return response()->json([
            'error' => 'Video processing failed: ' . $e->getMessage()
        ], 500);
    }
}
    
    private function generateBinauralBeats($duration, $rightFreq, $leftFreq, $rightVol, $leftVol, $mode)
    {
        $tempDir = public_path('temp');
        if (!file_exists($tempDir)) {
            if (!mkdir($tempDir, 0755, true)) {
                throw new \Exception("Failed to create temp directory for audio generation");
            }
        }
        
        $outputPath = $tempDir . '/binaural_' . time() . '_' . uniqid() . '.wav';
        
        $rightWave = "sine=frequency={$rightFreq}:sample_rate=44100:duration={$duration}";
        $leftWave = "sine=frequency={$leftFreq}:sample_rate=44100:duration={$duration}";
        
        $cmd = escapeshellcmd(env('FFMPEG_PATH', 'ffmpeg')) . " " .
            "-f lavfi -i " . escapeshellarg($rightWave) . " " .
            "-f lavfi -i " . escapeshellarg($leftWave) . " " .
            "-filter_complex " . escapeshellarg("[0:a]volume={$rightVol}[right];[1:a]volume={$leftVol}[left];" .
            "[right][left]amerge=inputs=2,pan=stereo|c0<c0+c1|c1<c0+c1") . " " .
            "-y " . escapeshellarg($outputPath) . " 2>&1";
        
        $output = [];
        $returnCode = 0;
        exec($cmd, $output, $returnCode);
        
        if ($returnCode !== 0 || !file_exists($outputPath)) {
            Log::error('Audio generation failed', [
                'command' => $cmd,
                'output' => $output,
                'return_code' => $returnCode
            ]);
            throw new \Exception("Audio generation failed with code {$returnCode}");
        }
        
        return $outputPath;
    }
}