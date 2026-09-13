<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use DOMDocument;
use DOMXPath;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class GetmetadataController extends Controller
{
    /**
     * Get the link preview by fetching and rendering the URL.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkUrl(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'url' => 'required|url'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $url = $request->input('url');
        
        Log::info('Attempting to fetch URL: ' . $url);
        
        // Try multiple approaches with better error handling
        $html = $this->fetchWithEnhancedPuppeteer($url);
        
        if (!$html) {
            $html = $this->fetchWithPlaywright($url);
        }
        
        if (!$html) {
            $html = $this->fetchWithRotatingUserAgents($url);
        }
        
        if (!$html) {
            $html = $this->fetchWithScrapingBee($url);
        }
        
        if (!$html) {
            Log::warning('All methods failed for: ' . $url);
            return response()->json([
                'error' => 'Failed to fetch the URL content. The website may be blocking automated requests.',
                'url' => $url,
                'suggestion' => 'This site uses advanced protection that requires manual browsing'
            ], 500);
        }

        $data = $this->parseHtml($html, $url);
        
        Log::info('Successfully fetched metadata for: ' . $url);

        return response()->json($data);
    }

    /**
     * Enhanced Puppeteer with better stealth
     */
    private function fetchWithEnhancedPuppeteer($url)
    {
        try {
            $script = "
            const puppeteer = require('puppeteer-extra');
            const StealthPlugin = require('puppeteer-extra-plugin-stealth');
            
            // Add stealth plugin
            puppeteer.use(StealthPlugin());

            (async () => {
                const browser = await puppeteer.launch({
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins,site-per-process',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                        '--window-size=1920,1080',
                        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                    ]
                });
                
                const page = await browser.newPage();
                
                // Set viewport
                await page.setViewport({ width: 1920, height: 1080 });
                
                // Set extra headers
                await page.setExtraHTTPHeaders({
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                });
                
                // Random delays to mimic human behavior
                await page.evaluateOnNewDocument(() => {
                    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                });

                // Block unnecessary resources
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    const resourceType = req.resourceType();
                    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                try {
                    await page.goto('{$url}', {
                        waitUntil: 'domcontentloaded',
                        timeout: 45000
                    });

                    // Wait for potential redirects or dynamic content
                    await page.waitForTimeout(8000);
                    
                    // Check if we're blocked
                    const isBlocked = await page.evaluate(() => {
                        return document.body.innerText.includes('bot') || 
                               document.body.innerText.includes('Blocked') ||
                               document.body.innerText.includes('Access Denied');
                    });

                    if (isBlocked) {
                        throw new Error('Page is blocking automated requests');
                    }

                    const content = await page.content();
                    await browser.close();
                    
                    console.log(content);
                } catch (navigationError) {
                    await browser.close();
                    throw navigationError;
                }
            })().catch(error => {
                console.error('Error:', error);
                process.exit(1);
            });
            ";

            $process = new Process(['node', '-e', $script]);
            $process->setTimeout(90);
            $process->run();

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }

            $content = $process->getOutput();
            
            if ($this->isValidContent($content)) {
                return $content;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Enhanced Puppeteer fetch failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Try Playwright as an alternative to Puppeteer
     */
    private function fetchWithPlaywright($url)
    {
        try {
            $script = "
            const { chromium } = require('playwright');
            
            (async () => {
                const browser = await chromium.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',
                        '--disable-blink-features=AutomationControlled',
                        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                    ]
                });
                
                const context = await browser.newContext();
                const page = await context.newPage();
                
                // Set realistic viewport
                await page.setViewportSize({ width: 1280, height: 720 });
                
                try {
                    await page.goto('{$url}', {
                        waitUntil: 'networkidle',
                        timeout: 30000
                    });
                    
                    // Wait for content
                    await page.waitForTimeout(5000);
                    
                    const content = await page.content();
                    await browser.close();
                    
                    console.log(content);
                } catch (error) {
                    await browser.close();
                    throw error;
                }
            })().catch(error => {
                console.error('Playwright Error:', error);
                process.exit(1);
            });
            ";

            $process = new Process(['node', '-e', $script]);
            $process->setTimeout(60);
            $process->run();

            if ($process->isSuccessful()) {
                $content = $process->getOutput();
                if ($this->isValidContent($content)) {
                    return $content;
                }
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Playwright fetch failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Rotating user agents with Guzzle
     */
    private function fetchWithRotatingUserAgents($url)
    {
        try {
            $userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            ];

            $client = new GuzzleClient([
                'timeout' => 30,
                'connect_timeout' => 25,
                'verify' => false,
                'headers' => [
                    'User-Agent' => $userAgents[array_rand($userAgents)],
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language' => 'en-US,en;q=0.5',
                    'Accept-Encoding' => 'gzip, deflate, br',
                    'Connection' => 'keep-alive',
                    'Upgrade-Insecure-Requests' => '1',
                    'Sec-Fetch-Dest' => 'document',
                    'Sec-Fetch-Mode' => 'navigate',
                    'Sec-Fetch-Site' => 'none',
                    'Cache-Control' => 'max-age=0',
                ],
                'curl' => [
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_SSL_VERIFYHOST => false,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_MAXREDIRS => 10,
                ]
            ]);

            $response = $client->get($url);
            $content = (string) $response->getBody();

            if ($this->isValidContent($content)) {
                return $content;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Rotating user agent fetch failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Use ScrapingBee API as a professional fallback
     */
    private function fetchWithScrapingBee($url)
    {
        try {
            $apiKey = env('SCRAPINGBEE_API_KEY', '');
            if (empty($apiKey)) {
                return false;
            }

            $client = new GuzzleClient();
            $response = $client->get('https://app.scrapingbee.com/api/v1/', [
                'query' => [
                    'api_key' => $apiKey,
                    'url' => $url,
                    'render_js' => 'true',
                    'premium_proxy' => 'true',
                    'stealth_proxy' => 'true',
                    'timeout' => '30000'
                ],
                'timeout' => 45
            ]);

            $content = (string) $response->getBody();

            if ($this->isValidContent($content)) {
                return $content;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('ScrapingBee fetch failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if content is valid HTML
     */
    private function isValidContent($content)
    {
        if (strlen($content) < 500) {
            return false;
        }

        // Check for blocking patterns
        $blockingIndicators = [
            'access denied',
            'bot detected',
            'cloudflare',
            'please verify you are human',
            'captcha',
            'perplexity.ai/error',
        ];
        
        $contentLower = strtolower($content);
        
        foreach ($blockingIndicators as $indicator) {
            if (strpos($contentLower, $indicator) !== false) {
                return false;
            }
        }

        // Check for basic HTML structure
        $hasHtml = strpos($content, '<html') !== false || strpos($content, '<!DOCTYPE') !== false;
        $hasTitle = strpos($content, '<title') !== false;
        
        return $hasHtml || $hasTitle;
    }

    /**
     * Parse the HTML to extract all metadata.
     */
    private function parseHtml($html, $url)
    {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);

        $html = $this->cleanHtml($html);
        $doc->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);

        $title = $this->extractTitle($xpath);
        $allMetaData = $this->extractAllMetaTags($xpath);
        $description = $this->extractDescription($allMetaData, $xpath);
        $image = $this->extractImage($allMetaData, $url, $xpath);
        $favicon = $this->extractFavicon($xpath, $url);

        return [
            'title' => $title,
            'description' => $description,
            'image' => $image,
            'favicon' => $favicon,
            'all_meta' => $allMetaData,
            'url' => $url,
            'success' => true,
        ];
    }

    /**
     * Clean HTML content and handle encoding.
     */
    private function cleanHtml($html)
    {
        $html = str_replace("\0", '', $html);
        
        $encoding = mb_detect_encoding($html, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII'], true);
        if ($encoding && $encoding !== 'UTF-8') {
            $html = mb_convert_encoding($html, 'UTF-8', $encoding);
        }
        
        if (strpos($html, '<!DOCTYPE') === false && strpos($html, '<html') === false) {
            $html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $html . '</body></html>';
        }
        
        return $html;
    }

    /**
     * Extract title with multiple fallback methods.
     */
    private function extractTitle($xpath)
    {
        $queries = [
            '//title',
            '//meta[@property="og:title"]/@content',
            '//meta[@name="twitter:title"]/@content',
            '//h1[1]'
        ];

        foreach ($queries as $query) {
            $node = $xpath->query($query);
            if ($node->length > 0) {
                $title = trim($node->item(0)->nodeValue);
                if (!empty($title)) {
                    return $title;
                }
            }
        }

        return '';
    }

    /**
     * Extract all meta tags comprehensively.
     */
    private function extractAllMetaTags($xpath)
    {
        $allMetaData = [];
        $metaNodes = $xpath->query('//meta');
        
        foreach ($metaNodes as $meta) {
            $name = $meta->getAttribute('name');
            $property = $meta->getAttribute('property');
            $content = $meta->getAttribute('content');
            $httpEquiv = $meta->getAttribute('http-equiv');
            
            $key = $name ?: $property ?: $httpEquiv;
            
            if ($key && $content) {
                $allMetaData[strtolower($key)] = trim($content);
            }
        }

        return $allMetaData;
    }

    /**
     * Extract description with multiple fallbacks.
     */
    private function extractDescription($allMetaData, $xpath)
    {
        $descriptionSources = [
            'og:description', 
            'twitter:description',
            'description',
            'dc:description',
            'summary'
        ];

        foreach ($descriptionSources as $source) {
            if (isset($allMetaData[$source]) && !empty(trim($allMetaData[$source]))) {
                return $allMetaData[$source];
            }
        }
        
        $firstP = $xpath->query('//p[string-length(text()) > 80][1]');
        if ($firstP->length > 0) {
            $desc = trim($firstP->item(0)->nodeValue);
            return substr($desc, 0, 250);
        }

        return '';
    }

    /**
     * Extract image with multiple fallbacks.
     */
    private function extractImage($allMetaData, $url, $xpath)
    {
        $imageSources = [
            'og:image',
            'og:image:url',
            'twitter:image',
            'twitter:image:src',
            'image',
            'thumbnail',
            'msapplication-tileimage'
        ];

        foreach ($imageSources as $source) {
            if (isset($allMetaData[$source]) && !empty(trim($allMetaData[$source]))) {
                return $this->makeAbsoluteUrl($url, $allMetaData[$source]);
            }
        }

        $firstImg = $xpath->query('//img[1]/@src');
        if ($firstImg->length > 0) {
            $src = $firstImg->item(0)->nodeValue;
            if (!empty($src)) {
                return $this->makeAbsoluteUrl($url, $src);
            }
        }

        return '';
    }

    /**
     * Extract favicon from link tags.
     */
    private function extractFavicon($xpath, $url)
    {
        $queries = [
            '//link[@rel="apple-touch-icon"]/@href',
            '//link[@rel="icon"]/@href',
            '//link[@rel="shortcut icon"]/@href',
            '//link[@rel="icon" and @sizes="32x32"]/@href',
            '//link[@rel="icon" and @sizes="16x16"]/@href',
        ];
        
        foreach ($queries as $query) {
            $linkNodes = $xpath->query($query);
            if ($linkNodes->length > 0) {
                $href = $linkNodes->item(0)->nodeValue;
                if ($href) {
                    return $this->makeAbsoluteUrl($url, $href);
                }
            }
        }
        
        return $this->makeAbsoluteUrl($url, '/favicon.ico');
    }

    /**
     * Convert a relative URL to an absolute URL.
     */
    private function makeAbsoluteUrl($baseUrl, $relativeUrl)
    {
        if (empty(trim($relativeUrl))) {
            return '';
        }

        if (parse_url($relativeUrl, PHP_URL_SCHEME) !== null) {
            return $relativeUrl;
        }

        $base = parse_url($baseUrl);
        if (!isset($base['scheme']) || !isset($base['host'])) {
            return '';
        }

        if (strpos($relativeUrl, '//') === 0) {
            return $base['scheme'] . ':' . $relativeUrl;
        }

        $path = '';
        if (isset($base['path'])) {
            $path = $base['path'];
        }
        
        $hostPart = $base['scheme'] . '://' . $base['host'];

        if (strpos($relativeUrl, '/') === 0) {
            return $hostPart . $relativeUrl;
        }

        $basePath = (substr($path, -1) === '/') ? $path : dirname($path);
        if ($basePath === '.' || $basePath === '..') {
            $basePath = '/';
        }
        if (substr($basePath, -1) !== '/') {
            $basePath .= '/';
        }
        
        $absoluteUrl = $hostPart . $basePath . $relativeUrl;
        
        $parts = explode('/', parse_url($absoluteUrl, PHP_URL_PATH));
        $resolvedParts = [];
        foreach ($parts as $part) {
            if ($part === '' || $part === '.') continue;
            if ($part === '..') {
                array_pop($resolvedParts);
            } else {
                $resolvedParts[] = $part;
            }
        }
        
        $resolvedPath = '/' . implode('/', $resolvedParts);
        
        $finalUrl = $hostPart . $resolvedPath;
        
        $query = parse_url($absoluteUrl, PHP_URL_QUERY);
        if ($query) {
            $finalUrl .= '?' . $query;
        }
        
        return $finalUrl;
    }

    /**
     * Test endpoint for debugging
     */
    public function testFetch(Request $request)
    {
        $url = $request->input('url', 'https://www.perplexity.ai');
        
        $methods = [
            'enhanced_puppeteer' => $this->fetchWithEnhancedPuppeteer($url),
            'playwright' => $this->fetchWithPlaywright($url),
            'rotating_agents' => $this->fetchWithRotatingUserAgents($url),
            'scraping_bee' => $this->fetchWithScrapingBee($url),
        ];
        
        $results = [];
        foreach ($methods as $method => $content) {
            $results[$method] = [
                'success' => $content !== false,
                'content_length' => $content ? strlen($content) : 0,
                'valid_content' => $content ? $this->isValidContent($content) : false,
                'sample' => $content ? substr($content, 0, 200) : null,
            ];
        }
        
        return response()->json($results);
    }

    /**
     * Health check for scraping dependencies
     */
    public function healthCheck(Request $request)
    {
        $checks = [];

        // Check Node.js
        try {
            $process = new Process(['node', '--version']);
            $process->run();
            $checks['nodejs'] = $process->isSuccessful() ? $process->getOutput() : 'Not available';
        } catch (\Exception $e) {
            $checks['nodejs'] = 'Error: ' . $e->getMessage();
        }

        // Check Puppeteer
        try {
            $script = "try { require('puppeteer-extra'); console.log('Available'); } catch(e) { console.log('Not available'); }";
            $process = new Process(['node', '-e', $script]);
            $process->run();
            $checks['puppeteer'] = trim($process->getOutput());
        } catch (\Exception $e) {
            $checks['puppeteer'] = 'Error: ' . $e->getMessage();
        }

        // Check Playwright
        try {
            $script = "try { require('playwright'); console.log('Available'); } catch(e) { console.log('Not available'); }";
            $process = new Process(['node', '-e', $script]);
            $process->run();
            $checks['playwright'] = trim($process->getOutput());
        } catch (\Exception $e) {
            $checks['playwright'] = 'Error: ' . $e->getMessage();
        }

        // Check Guzzle
        $checks['guzzle'] = class_exists('GuzzleHttp\Client') ? 'Available' : 'Not available';

        return response()->json($checks);
    }
}