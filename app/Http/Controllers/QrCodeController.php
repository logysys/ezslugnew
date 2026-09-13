<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel\ErrorCorrectionLevelHigh;

class QrCodeController extends Controller
{
    /**
     * Generate QR code for a URL
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'url' => 'required|url',
            'size' => 'nullable|integer|min:100|max:1000',
            'margin' => 'nullable|integer|min:0|max:20',
            'color' => 'nullable|regex:/^#[a-f0-9]{6}$/i',
            'backgroundColor' => 'nullable|regex:/^#[a-f0-9]{6}$/i',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $url = $request->input('url');
            $size = $request->input('size', 300);
            $margin = $request->input('margin', 2);
            
            // Parse colors
            $color = $request->input('color', '#22c55e');
            $backgroundColor = $request->input('backgroundColor', '#ffffff');
            
            list($r, $g, $b) = sscanf($color, "#%02x%02x%02x");
            list($bgR, $bgG, $bgB) = sscanf($backgroundColor, "#%02x%02x%02x");

            // Create QR code
            $qrCode = QrCode::create($url)
                ->setEncoding(new Encoding('UTF-8'))
                ->setErrorCorrectionLevel(new ErrorCorrectionLevelHigh())
                ->setSize($size)
                ->setMargin($margin)
                ->setForegroundColor(new Color($r, $g, $b))
                ->setBackgroundColor(new Color($bgR, $bgG, $bgB));

            $writer = new PngWriter();
            $result = $writer->write($qrCode);

            // Log QR generation
            Log::info('QR code generated', [
                'url' => $url,
                'size' => $size,
            ]);

            return response($result->getString(), 200)
                ->header('Content-Type', 'image/png')
                ->header('Content-Disposition', 'inline; filename="ez-qr-code.png"');

        } catch (\Exception $e) {
            Log::error('QR code generation error: ' . $e->getMessage(), [
                'url' => $url ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate QR code from URL parameter (for direct links)
     */
    public function generateFromUrl($encodedUrl)
    {
        try {
            $url = urldecode($encodedUrl);
            
            // Validate URL
            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                // If it's not a full URL, prepend https://
                if (!preg_match('/^https?:\/\//', $url)) {
                    $url = 'https://' . $url;
                }
            }

            // Parse colors
            $color = '#22c55e';
            $backgroundColor = '#ffffff';
            
            list($r, $g, $b) = sscanf($color, "#%02x%02x%02x");
            list($bgR, $bgG, $bgB) = sscanf($backgroundColor, "#%02x%02x%02x");

            // Create QR code
            $qrCode = QrCode::create($url)
                ->setEncoding(new Encoding('UTF-8'))
                ->setErrorCorrectionLevel(new ErrorCorrectionLevelHigh())
                ->setSize(300)
                ->setMargin(2)
                ->setForegroundColor(new Color($r, $g, $b))
                ->setBackgroundColor(new Color($bgR, $bgG, $bgB));

            $writer = new PngWriter();
            $result = $writer->write($qrCode);

            Log::info('Direct QR code generated', [
                'url' => $url,
                'encoded_url' => $encodedUrl,
            ]);

            return response($result->getString(), 200)
                ->header('Content-Type', 'image/png')
                ->header('Content-Disposition', 'inline; filename="ez-qr.png"');

        } catch (\Exception $e) {
            Log::error('Direct QR code generation error: ' . $e->getMessage(), [
                'encoded_url' => $encodedUrl,
            ]);

            // Return a fallback error image
            return response($this->generateErrorQr('Invalid URL'), 400)
                ->header('Content-Type', 'image/png');
        }
    }

    /**
     * Get QR code as data URI (for inline display)
     */
    public function getDataUri(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'url' => 'required|url',
            'size' => 'nullable|integer|min:100|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $url = $request->input('url');
            $size = $request->input('size', 200);
            
            // Parse colors
            $color = '#22c55e';
            $backgroundColor = '#ffffff';
            
            list($r, $g, $b) = sscanf($color, "#%02x%02x%02x");
            list($bgR, $bgG, $bgB) = sscanf($backgroundColor, "#%02x%02x%02x");

            // Create QR code
            $qrCode = QrCode::create($url)
                ->setEncoding(new Encoding('UTF-8'))
                ->setErrorCorrectionLevel(new ErrorCorrectionLevelHigh())
                ->setSize($size)
                ->setMargin(2)
                ->setForegroundColor(new Color($r, $g, $b))
                ->setBackgroundColor(new Color($bgR, $bgG, $bgB));

            $writer = new PngWriter();
            $result = $writer->write($qrCode);

            $base64 = 'data:image/png;base64,' . base64_encode($result->getString());

            return response()->json([
                'success' => true,
                'data_uri' => $base64,
                'url' => $url,
                'size' => $size,
            ]);

        } catch (\Exception $e) {
            Log::error('QR data URI generation error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code',
            ], 500);
        }
    }

    /**
     * Generate error QR code
     */
    private function generateErrorQr(string $message): string
    {
        $color = '#dc2626';
        $backgroundColor = '#ffffff';
        
        list($r, $g, $b) = sscanf($color, "#%02x%02x%02x");
        list($bgR, $bgG, $bgB) = sscanf($backgroundColor, "#%02x%02x%02x");

        $qrCode = QrCode::create($message)
            ->setEncoding(new Encoding('UTF-8'))
            ->setErrorCorrectionLevel(new ErrorCorrectionLevelHigh())
            ->setSize(300)
            ->setMargin(2)
            ->setForegroundColor(new Color($r, $g, $b))
            ->setBackgroundColor(new Color($bgR, $bgG, $bgB));

        $writer = new PngWriter();
        $result = $writer->write($qrCode);

        return $result->getString();
    }
}