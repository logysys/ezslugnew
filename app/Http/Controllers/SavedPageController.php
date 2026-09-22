<?php

namespace App\Http\Controllers;

use App\Models\SavedPage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class SavedPageController extends Controller
{
    /**
     * Maximum HTML payload size (bytes). ~1.5 MB.
     */
    private const MAX_HTML_BYTES = 1500000;

    /**
     * How many pages one IP may create per day.
     */
    private const DAILY_CREATE_LIMIT = 50;

    /**
     * Default retention in days for saved pages.
     */
    private const RETENTION_DAYS = 90;

    /**
     * Max slots allowed per page.
     */
    private const MAX_SLOTS = 50;

    /**
     * Max single-slot code size (bytes).
     */
    private const MAX_SLOT_BYTES = 200000;

    // ============================================================
    // POST /pages  →  store a new saved page
    // ============================================================
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'nullable|string|max:120',
            'html'        => 'required|string|max:' . self::MAX_HTML_BYTES,
            'layout_mode' => 'required|in:row,carousel,masonry',
            'slots'       => 'nullable|array|max:' . self::MAX_SLOTS,
            'slots.*.code'   => 'nullable|string|max:' . self::MAX_SLOT_BYTES,
            'slots.*.width'  => 'nullable|integer|min:0|max:5000',
            'slots.*.height' => 'nullable|integer|min:0|max:5000',
            'settings'    => 'nullable|array',
        ]);

        $ip = $request->ip();

        // Daily per-IP cap
        $existingCount = SavedPage::where('creator_ip', $ip)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        if ($existingCount >= self::DAILY_CREATE_LIMIT) {
            return response()->json([
                'message' => 'You have reached the daily limit for saved pages. Try again tomorrow.',
            ], 429);
        }

        $page = SavedPage::create([
            'title'       => $data['title'] ?? 'Untitled embed page',
            'slug'        => SavedPage::generateSlug(),
            'layout_mode' => $data['layout_mode'],
            'html'        => $data['html'],
            'slots'       => $data['slots'] ?? [],
            'settings'    => $data['settings'] ?? [],
            'edit_token'  => SavedPage::generateEditToken(),
            'creator_ip'  => $ip,
            'expires_at'  => now()->addDays(self::RETENTION_DAYS),
        ]);

        return response()->json([
            'slug'         => $page->slug,
            'view_url'     => route('pages.show', $page->slug),
            'download_url' => route('pages.download', $page->slug),
            'edit_token'   => $page->edit_token,
            'created_at'   => $page->created_at->toISOString(),
        ], 201);
    }

    // ============================================================
    // GET /pages  →  list the current visitor's saved pages
    // ============================================================
    public function index(Request $request)
    {
        $pages = SavedPage::where('creator_ip', $request->ip())
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(function (SavedPage $p) {
                return [
                    'slug'         => $p->slug,
                    'title'        => $p->title,
                    'layout_mode'  => $p->layout_mode,
                    'views'        => (int) $p->views,
                    'created_at'   => $p->created_at->toISOString(),
                    'expires_at'   => $p->expires_at ? $p->expires_at->toISOString() : null,
                    'view_url'     => route('pages.show', $p->slug),
                    'download_url' => route('pages.download', $p->slug),
                ];
            });

        return response()->json([
            'items' => $pages,
            'count' => $pages->count(),
        ]);
    }

    // ============================================================
    // GET /pages/{slug}  →  serve the stored HTML
    // ============================================================
    public function show(string $slug)
    {
        $page = SavedPage::where('slug', $slug)->firstOrFail();

        abort_if($page->isExpired(), 410, 'This page has expired.');

        $page->increment('views');

        return response($page->html)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('X-Frame-Options', 'SAMEORIGIN')
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('Referrer-Policy', 'no-referrer')
            ->header('Content-Security-Policy', "frame-ancestors 'self'");
    }

    // ============================================================
    // GET /pages/{slug}/download  →  force download as .html
    // ============================================================
    public function download(string $slug)
    {
        $page = SavedPage::where('slug', $slug)->firstOrFail();

        abort_if($page->isExpired(), 410, 'This page has expired.');

        $filename = $page->title ?: 'embed-page';
        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '-', $filename);
        $filename = trim($filename, '-_');
        if ($filename === '') {
            $filename = 'embed-page';
        }
        $filename .= '.html';

        return response($page->html)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('X-Content-Type-Options', 'nosniff');
    }

    // ============================================================
    // PUT /pages/{slug}  →  update an existing page (requires edit_token)
    // ============================================================
    public function update(Request $request, string $slug)
    {
        $page = SavedPage::where('slug', $slug)->firstOrFail();

        abort_if($page->isExpired(), 410, 'This page has expired.');

        $token = $request->input('edit_token') ?? $request->header('X-Edit-Token');

        abort_unless(
            $token && hash_equals((string) $page->edit_token, (string) $token),
            403,
            'Invalid edit token.'
        );

        $data = $request->validate([
            'title'       => 'nullable|string|max:120',
            'html'        => 'required|string|max:' . self::MAX_HTML_BYTES,
            'layout_mode' => 'required|in:row,carousel,masonry',
            'slots'       => 'nullable|array|max:' . self::MAX_SLOTS,
            'slots.*.code'   => 'nullable|string|max:' . self::MAX_SLOT_BYTES,
            'slots.*.width'  => 'nullable|integer|min:0|max:5000',
            'slots.*.height' => 'nullable|integer|min:0|max:5000',
            'settings'    => 'nullable|array',
        ]);

        $page->update([
            'title'       => $data['title'] ?? $page->title,
            'html'        => $data['html'],
            'layout_mode' => $data['layout_mode'],
            'slots'       => $data['slots'] ?? [],
            'settings'    => $data['settings'] ?? [],
        ]);

        return response()->json([
            'slug'     => $page->slug,
            'view_url' => route('pages.show', $page->slug),
            'updated'  => true,
        ]);
    }

    // ============================================================
    // DELETE /pages/{slug}  →  delete a page (requires edit_token)
    // ============================================================
    public function destroy(Request $request, string $slug)
    {
        $page = SavedPage::where('slug', $slug)->firstOrFail();

        $token = $request->input('edit_token') ?? $request->header('X-Edit-Token');

        abort_unless(
            $token && hash_equals((string) $page->edit_token, (string) $token),
            403,
            'Invalid edit token.'
        );

        $page->delete();

        return response()->json([
            'deleted' => true,
            'slug'    => $slug,
        ]);
    }
}