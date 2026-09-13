<?php

namespace App\Services;

use FFMpeg\FFMpeg;
use FFMpeg\Format\Video\X264;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class VideoRemixService
{
    protected $ffmpeg;
    
    public function __construct()
    {
        try {
            $this->ffmpeg = FFMpeg::create([
                'ffmpeg.binaries' => config('ffmpeg.ffmpeg.binaries', 'ffmpeg'),
                'ffprobe.binaries' => config('ffmpeg.ffprobe.binaries', 'ffprobe'),
                'timeout' => config('ffmpeg.timeout', 3600),
            ]);
        } catch (\Exception $e) {
            Log::warning('FFMpeg library initialization failed: ' . $e->getMessage());
        }
    }

    /**
     * Create video from images with audio
     */
    public function createVideoFromImages(array $imagePaths, ?string $audioPath = null, array $options = [])
    {
        $outputPath = storage_path('app/public/videos/' . uniqid() . '.mp4');
        
        // Create a temporary directory
        $tempDir = storage_path('app/temp/' . uniqid());
        mkdir($tempDir, 0755, true);
        
        // Prepare images
        $preparedImages = [];
        $width = $options['width'] ?? 1920;
        $height = $options['height'] ?? 1080;
        $duration = $options['duration_per_image'] ?? 5;
        
        foreach ($imagePaths as $index => $imagePath) {
            $preparedImage = $this->resizeImage($imagePath, $width, $height, $tempDir . '/img_' . $index . '.jpg');
            $preparedImages[] = $preparedImage;
        }
        
        // Create concat file
        $concatFile = $tempDir . '/concat.txt';
        $concatContent = '';
        
        foreach ($preparedImages as $index => $image) {
            $videoPart = $tempDir . '/video_' . $index . '.mp4';
            
            // Create video from single image
            $cmd = sprintf(
                '%s -loop 1 -i %s -c:v libx264 -t %d -pix_fmt yuv420p -vf "scale=%d:%d" %s 2>&1',
                config('ffmpeg.ffmpeg.binaries', 'ffmpeg'),
                escapeshellarg($image),
                $duration,
                $width,
                $height,
                escapeshellarg($videoPart)
            );
            
            exec($cmd, $output, $returnCode);
            
            if ($returnCode !== 0) {
                $this->deleteDirectory($tempDir);
                throw new \Exception("Failed to create video part: " . implode("\n", $output));
            }
            
            $concatContent .= "file '" . realpath($videoPart) . "'\n";
        }
        
        file_put_contents($concatFile, $concatContent);
        
        // Concatenate videos
        $concatOutput = $tempDir . '/concat_output.mp4';
        $concatCmd = sprintf(
            '%s -f concat -safe 0 -i %s -c copy %s 2>&1',
            config('ffmpeg.ffmpeg.binaries', 'ffmpeg'),
            escapeshellarg($concatFile),
            escapeshellarg($concatOutput)
        );
        
        exec($concatCmd, $output, $returnCode);
        
        if ($returnCode !== 0) {
            $this->deleteDirectory($tempDir);
            throw new \Exception("Failed to concatenate videos: " . implode("\n", $output));
        }
        
        // Add audio if provided
        if ($audioPath && file_exists($audioPath)) {
            $finalOutput = $tempDir . '/final_output.mp4';
            $audioCmd = sprintf(
                '%s -i %s -i %s -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest %s 2>&1',
                config('ffmpeg.ffmpeg.binaries', 'ffmpeg'),
                escapeshellarg($concatOutput),
                escapeshellarg($audioPath),
                escapeshellarg($finalOutput)
            );
            
            exec($audioCmd, $output, $returnCode);
            
            if ($returnCode === 0) {
                copy($finalOutput, $outputPath);
            } else {
                copy($concatOutput, $outputPath);
            }
        } else {
            copy($concatOutput, $outputPath);
        }
        
        // Cleanup
        $this->deleteDirectory($tempDir);
        
        return $outputPath;
    }
    
    /**
     * Create slideshow from images with optional audio
     */
    public function createSlideshow(array $imagePaths, int $durationPerImage = 5, ?string $audioPath = null)
    {
        Log::info('Creating slideshow with audio', [
            'image_count' => count($imagePaths),
            'duration_per_image' => $durationPerImage,
            'has_audio' => !is_null($audioPath)
        ]);
        
        return $this->createVideoFromImages($imagePaths, $audioPath, [
            'duration_per_image' => $durationPerImage,
            'width' => 1920,
            'height' => 1080
        ]);
    }
    
    /**
     * Resize image using GD
     */
    private function resizeImage(string $sourcePath, int $width, int $height, string $outputPath): string
    {
        // Check if GD is installed
        if (!extension_loaded('gd')) {
            copy($sourcePath, $outputPath);
            return $outputPath;
        }
        
        $info = @getimagesize($sourcePath);
        if (!$info) {
            copy($sourcePath, $outputPath);
            return $outputPath;
        }
        
        $mime = $info['mime'];
        $origWidth = $info[0];
        $origHeight = $info[1];
        
        // Create image from source
        switch ($mime) {
            case 'image/jpeg':
                $sourceImage = @imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $sourceImage = @imagecreatefrompng($sourcePath);
                break;
            case 'image/gif':
                $sourceImage = @imagecreatefromgif($sourcePath);
                break;
            case 'image/webp':
                $sourceImage = @imagecreatefromwebp($sourcePath);
                break;
            default:
                copy($sourcePath, $outputPath);
                return $outputPath;
        }
        
        if (!$sourceImage) {
            copy($sourcePath, $outputPath);
            return $outputPath;
        }
        
        // Calculate aspect ratio
        $origRatio = $origWidth / $origHeight;
        $newRatio = $width / $height;
        
        if ($origRatio > $newRatio) {
            $newWidth = $width;
            $newHeight = (int)($width / $origRatio);
        } else {
            $newHeight = $height;
            $newWidth = (int)($height * $origRatio);
        }
        
        // Create new image
        $newImage = imagecreatetruecolor($width, $height);
        
        // Fill with black background
        $black = imagecolorallocate($newImage, 0, 0, 0);
        imagefill($newImage, 0, 0, $black);
        
        // Calculate position to center the image
        $x = (int)(($width - $newWidth) / 2);
        $y = (int)(($height - $newHeight) / 2);
        
        // Resize and copy image
        imagecopyresampled(
            $newImage, $sourceImage,
            $x, $y, 0, 0,
            $newWidth, $newHeight,
            $origWidth, $origHeight
        );
        
        // Save image
        imagejpeg($newImage, $outputPath, 90);
        
        // Free memory
        imagedestroy($sourceImage);
        imagedestroy($newImage);
        
        return $outputPath;
    }
    
    /**
	 * Overlay images on existing video
	 */
	public function overlayImagesOnVideo(string $videoPath, array $images)
	{
    $outputPath = storage_path('app/public/videos/overlay_' . uniqid() . '.mp4');
    $tempDir = storage_path('app/temp/overlay_' . uniqid());
    mkdir($tempDir, 0755, true);
    
    // Prepare FFmpeg command
    $inputs = "-i " . escapeshellarg($videoPath);
    $filterComplex = "";
    $overlayCount = 0;
    
    if (!empty($images)) {
        // Start with video stream
        $filterComplex = "[0:v]copy[base];";
        
        foreach ($images as $index => $image) {
            // Resize overlay image
            $overlayImage = $this->resizeImage(
                $image['image_path'], 
                300,
                200,
                $tempDir . '/overlay_' . $index . '.png'
            );
            
            $inputs .= " -i " . escapeshellarg($overlayImage);
            
            $start = $image['start'] ?? 0;
            $duration = $image['duration'] ?? 5;
            $end = $start + $duration;
            $positionX = $image['position_x'] ?? 'W-w-20';
            $positionY = $image['position_y'] ?? 'H-h-20';
            $opacity = isset($image['opacity']) ? ($image['opacity'] / 100) : 1.0;
            
            // Prepare overlay image with opacity
            $filterComplex .= sprintf(
                "[%d:v]scale=300:200,format=rgba,colorchannelmixer=aa=%.2f[overlay%d];",
                $index + 1,
                $opacity,
                $index
            );
            
            // Apply overlay at specific time
            if ($index === 0) {
                $filterComplex .= sprintf(
                    "[base][overlay%d]overlay=%s:%s:enable='between(t,%.2f,%.2f)'[tmp%d];",
                    $index,
                    $positionX,
                    $positionY,
                    $start,
                    $end,
                    $index + 1
                );
            } else {
                $filterComplex .= sprintf(
                    "[tmp%d][overlay%d]overlay=%s:%s:enable='between(t,%.2f,%.2f)'[tmp%d];",
                    $index,
                    $index,
                    $positionX,
                    $positionY,
                    $start,
                    $end,
                    $index + 1
                );
            }
            
            $overlayCount = $index + 1;
        }
        
        // Remove last semicolon
        $filterComplex = rtrim($filterComplex, ';');
        
        // For single overlay, we need to adjust the output label
        if (count($images) === 1) {
            $filterComplex = str_replace("[tmp1]", "[output]", $filterComplex);
            $outputLabel = "output";
        } else {
            $outputLabel = "tmp" . $overlayCount;
        }
    } else {
        // No overlays, just copy the video
        $filterComplex = "null";
        $outputLabel = "0:v";
    }
    
    // Build command
    if ($filterComplex !== "null") {
        $cmd = sprintf(
            '%s %s -filter_complex "%s" -map "[%s]" -map 0:a? -c:v libx264 -c:a aac -preset medium -crf 23 %s 2>&1',
            config('ffmpeg.ffmpeg.binaries', 'ffmpeg'),
            $inputs,
            $filterComplex,
            $outputLabel,
            escapeshellarg($outputPath)
        );
    } else {
        $cmd = sprintf(
            '%s -i %s -c:v copy -c:a copy %s 2>&1',
            config('ffmpeg.ffmpeg.binaries', 'ffmpeg'),
            escapeshellarg($videoPath),
            escapeshellarg($outputPath)
        );
    }
    
    exec($cmd, $output, $returnCode);
    
    if ($returnCode !== 0) {
        $this->deleteDirectory($tempDir);
        throw new \Exception("Failed to overlay images: " . implode("\n", $output));
    }
    
    $this->deleteDirectory($tempDir);
    
    return $outputPath;
	}
    
    /**
     * Add text overlay to video
     */
    public function addTextToVideo(string $videoPath, array $textConfigs)
    {
        $outputPath = storage_path('app/public/videos/text_' . uniqid() . '.mp4');
        
        try {
            $video = $this->ffmpeg->open($videoPath);
            
            $filterComplex = '';
            foreach ($textConfigs as $index => $textConfig) {
                $text = addslashes($textConfig['text'] ?? '');
                $x = $textConfig['x'] ?? '(w-text_w)/2';
                $y = $textConfig['y'] ?? 'h*0.9';
                $fontsize = $textConfig['fontsize'] ?? 24;
                $color = $textConfig['color'] ?? 'white';
                $font = $textConfig['font'] ?? 'Arial';
                $box = $textConfig['box'] ?? 1;
                $start = $textConfig['start'] ?? 0;
                $end = $textConfig['end'] ?? 10;
                
                $filterComplex .= sprintf(
                    "drawtext=text='%s':x=%s:y=%s:fontsize=%d:fontcolor=%s:font=%s:box=%d:boxcolor=black@0.5:enable='between(t,%d,%d)'",
                    $text,
                    $x,
                    $y,
                    $fontsize,
                    $color,
                    $font,
                    $box,
                    $start,
                    $end
                );
                
                if ($index < count($textConfigs) - 1) {
                    $filterComplex .= ',';
                }
            }
            
            $video->filters()->custom($filterComplex);
            
            $format = new X264();
            $format->setAudioCodec('aac');
            $video->save($format, $outputPath);
            
        } catch (\Exception $e) {
            Log::error('FFMpeg library failed, falling back to command line: ' . $e->getMessage());
            
            // Fallback to command line
            $filterComplex = '';
            foreach ($textConfigs as $index => $textConfig) {
                $text = addslashes($textConfig['text'] ?? '');
                $x = $textConfig['x'] ?? '(w-text_w)/2';
                $y = $textConfig['y'] ?? 'h*0.9';
                $fontsize = $textConfig['fontsize'] ?? 24;
                $color = $textConfig['color'] ?? 'white';
                $font = $textConfig['font'] ?? 'Arial';
                $box = $textConfig['box'] ?? 1;
                $start = $textConfig['start'] ?? 0;
                $end = $textConfig['end'] ?? 10;
                
                $filterComplex .= sprintf(
                    "drawtext=text='%s':x=%s:y=%s:fontsize=%d:fontcolor=%s:font=%s:box=%d:boxcolor=black@0.5:enable='between(t,%d,%d)'",
                    $text,
                    $x,
                    $y,
                    $fontsize,
                    $color,
                    $font,
                    $box,
                    $start,
                    $end
                );
                
                if ($index < count($textConfigs) - 1) {
                    $filterComplex .= ',';
                }
            }
            
            $cmd = sprintf(
                '%s -i %s -vf "%s" -c:v libx264 -c:a copy %s 2>&1',
                config('ffmpeg.ffmpeg.binaries', 'ffmpeg'),
                escapeshellarg($videoPath),
                $filterComplex,
                escapeshellarg($outputPath)
            );
            
            exec($cmd, $output, $returnCode);
            
            if ($returnCode !== 0) {
                throw new \Exception("Failed to add text overlay: " . implode("\n", $output));
            }
        }
        
        return $outputPath;
    }
    
    /**
     * Extract frames from video as images
     */
    public function extractFrames(string $videoPath, int $frameRate = 1, string $quality = 'medium')
    {
        $outputDir = storage_path('app/public/frames/' . uniqid());
        mkdir($outputDir, 0755, true);
        
        // Set quality based on parameter
        $qualityMap = [
            'low' => '5',
            'medium' => '3',
            'high' => '2'
        ];
        $qscale = $qualityMap[$quality] ?? '3';
        
        // Use FFmpeg command for better reliability
        $cmd = sprintf(
            '%s -i %s -vf "fps=%d" -q:v %s %s/frame_%%04d.jpg 2>&1',
            config('ffmpeg.ffmpeg.binaries', 'ffmpeg'),
            escapeshellarg($videoPath),
            $frameRate,
            $qscale,
            escapeshellarg($outputDir)
        );
        
        exec($cmd, $output, $returnCode);
        
        if ($returnCode !== 0) {
            $this->deleteDirectory($outputDir);
            throw new \Exception("Failed to extract frames: " . implode("\n", $output));
        }
        
        // Get generated frames
        $frames = glob($outputDir . '/frame_*.jpg');
        
        return $frames;
    }
    
    /**
     * Utility: Delete directory recursively
     */
    private function deleteDirectory(string $dir): void
    {
        if (!file_exists($dir)) {
            return;
        }
        
        $files = array_diff(scandir($dir), ['.', '..']);
        
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        
        @rmdir($dir);
    }
}