<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\LoadframeController;
use App\Http\Controllers\VideoProcessorController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\EzFunnelController;
use App\Http\Controllers\GetmetadataController;
use App\Http\Controllers\MailExtractController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\FunnelcontentController;
use App\Http\Controllers\EzSellController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\HandleTransferController;
use App\Http\Controllers\SocialMediaSearchController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\IncentiveHistoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\TemplateMarketplaceController;
use App\Http\Controllers\GoogleController;
use App\Http\Controllers\SocialiteLoginController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\RedditAuthController;
use App\Http\Controllers\WikiPageController;
use App\Http\Controllers\VideoRemixController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\OmniboxController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\QrCodeController;
use App\Http\Controllers\EzController;
use App\Http\Controllers\AIHistoryController;
use App\Http\Controllers\AIDashboardController;
use App\Http\Controllers\PublicAIHistoryController;
use App\Http\Controllers\UnifiedContentController;
use App\Http\Controllers\AIUserSettingsController;
use App\Http\Controllers\EffectController;
use App\Http\Controllers\CouponUsageController;
use App\Http\Controllers\SocialContentController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PageListController;
use App\Http\Controllers\UnifiedDashboardController;
use App\Http\Controllers\DivinationController;
use App\Http\Controllers\DreamController;
use App\Http\Controllers\DivinationtwoController;
use App\Http\Controllers\PunController;
use App\Http\Controllers\DreamWeaverController;
use App\Http\Controllers\NumerologyController;
use App\Http\Controllers\NumerologyOracleController;
use App\Http\Controllers\NumerologyOracleAllController;
use App\Http\Controllers\NumerologyOracleTwoController;
use App\Http\Controllers\CharDivinationController;

Route::domain('oki.wiki')->middleware('web')->group(function () {
        Route::get('/', [HomeController::class, 'oki'])->name('oki');
    });

Route::domain('{subdomain}.ez3d.ai')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--hny691d.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--b9wm4lxz0afud.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--h0t795as2et56a.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.set.net')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.opensoothing.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.0932.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.0938.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--42c5bb7ah3d5byb6m.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--22c0cud.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--ll0b110a.love')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--rht090b.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.4u.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.b2c.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.no1.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.ez.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.ez3d.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.81.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.82.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.7.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.big.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--fiq228c.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--kpry57d.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.bbcc.ai')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.bbcc.ad')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--fiq228cj5lj9c.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.oki.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.xn--2rq38u.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.blaig.chat')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.blaig.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});
Route::domain('{subdomain}.whowhat.wiki')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
});

Route::domain('genesis.nug8.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'genesis'])->name('genesis');
});
Route::domain('spec.nug8.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'spec'])->name('spec');
});
Route::domain('xn--6qq79v.nug8.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'spec'])->name('spec');
});
Route::domain('xn--158h.nug8.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'spec'])->name('spec');
});
Route::domain('a9.nug8.com')->group(function ($subdomain) {
    Route::get('/', [DivinationController::class, 'index']);
    Route::post('/a9/divinate', [DivinationController::class, 'divinate']);
});
Route::domain('a8.nug8.com')->group(function ($subdomain) {
    Route::get('/', [DreamController::class, 'index']);
    Route::post('/dream/weave', [DreamController::class, 'weave']);
    Route::get('/dream/test-perplexity', [DreamController::class, 'testPerplexity']);
});
Route::domain('a7.nug8.com')->group(function ($subdomain) {
    Route::get('/', [DivinationtwoController::class, 'index']);
    Route::post('/divinate', [DivinationtwoController::class, 'divinate']);
});
Route::domain('a6.nug8.com')->group(function ($subdomain) {
    Route::get('/', [PunController::class, 'index']);

    Route::post('/pun/generate', [PunController::class, 'generate']);

    Route::post('/pun/clear-cache', function () {
        // Clear all pun cache
        $keys = Cache::get('pun_cache_keys', []);
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        Cache::forget('pun_cache_keys');
        return response()->json(['success' => true]);
    });

    Route::get('/pun/cache-count', function () {
        $keys = Cache::get('pun_cache_keys', []);
        return response()->json(['count' => count($keys)]);
    });
});
Route::domain('a5.nug8.com')->group(function ($subdomain) {
    Route::get('/', [DreamWeaverController::class, 'index']);
    Route::post('/dream/weave', [DreamWeaverController::class, 'weave']);
    Route::get('/dream/test-perplexity', [DreamWeaverController::class, 'testPerplexity']);
    Route::post('/dream/clear-cache', [DreamWeaverController::class, 'clearCache']);
    Route::get('/dream/cache-stats', [DreamWeaverController::class, 'cacheStats']);
});
Route::domain('a4.nug8.com')->group(function ($subdomain) {
    Route::get('/', [NumerologyController::class, 'index']);
});
Route::domain('a3.nug8.com')->group(function ($subdomain) {
    Route::get('/', [NumerologyOracleController::class, 'index']);
});
Route::domain('a2.nug8.com')->group(function ($subdomain) {
    Route::get('/', [NumerologyOracleAllController::class, 'index']);
});
Route::domain('a1.nug8.com')->group(function ($subdomain) {
    Route::get('/', [NumerologyOracleTwoController::class, 'index']);
});
Route::domain('a15.nug8.com')->group(function ($subdomain) {
    Route::get('/', [CharDivinationController::class, 'index']);
});
Route::domain('a17.nug8.com')->group(function ($subdomain) {
    Route::view('/', 'mdcomposer')->name('home');
});
Route::domain('{subdomain}.nug8.com')->group(function ($subdomain) {
    Route::get('/',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel')->middleware('track.visitor');
    Route::get('/ez-uri-v0.0-provisional.html',[WelcomeController::class, 'provisional'])->name('provisional');
});

Route::get('/', [WelcomeController::class, 'index'])->name('home');
Route::get('/aihome', [WelcomeController::class, 'aihome'])->name('aihome');
Route::get('/remixedslug', [HomeController::class, 'remixedslug'])->name('remixedslug');
Route::get('/remixedpun', [HomeController::class, 'remixedpun'])->name('remixedpun');
Route::get('/chardivination', [HomeController::class, 'chardivination'])->name('chardivination');
Route::get('/ObsidianWikiGuide', function () {
    return Inertia::render('ObsidianWikiGuide', [
        'auth' => [
            'user' => auth()->user() ?? null,
        ],
    ]);
})->name('obsidian.guide');
// Add QR Code routes
Route::post('/theme/create', [EzController::class, 'store'])
    ->name('theme.store')
    ->middleware('throttle:60,1');

Route::post('/funnel/create', [EzController::class, 'ezfunnelstore'])
    ->name('theme.store')
    ->middleware('throttle:60,1');

Route::get('/qr/generate', [QrCodeController::class, 'generate'])
    ->name('qr.generate')
    ->middleware('throttle:60,1');

Route::get('/qr/url/{url}', [QrCodeController::class, 'generateFromUrl'])
    ->where('url', '.*')
    ->name('qr.url')
    ->middleware('throttle:60,1');

Route::get('/qr/data-uri', [QrCodeController::class, 'getDataUri'])
    ->name('qr.data-uri')
    ->middleware('throttle:60,1');

// Public AI Search View by Slug - Support Unicode slugs
Route::get('/X/{slug}', [SearchController::class, 'getAISearchBySlug'])
    ->where('slug', '.*') // This allows any characters including Chinese
    ->name('ai.view')->middleware('track.visitor');

Route::get('/ai/conversation/check-slug-availability-home', [SearchController::class, 'checkSlugAvailability'])
    ->name('conversation.check-slug-home')
    ->middleware('throttle:60,1');
// Get conversation by ID
Route::get('/ai/conversation/{conversationId}', [SearchController::class, 'getConversation'])
    ->name('ai.conversation');

// API route for AI search results
Route::get('/api/X/{slug}', [SearchController::class, 'getAISearchBySlug'])
    ->where('slug', '.*')
    ->name('ai.view.api');

Route::get('/ai/pinned-conversations', [SearchController::class, 'getPinnedConversations'])
    ->name('ai.pinned')
    ->middleware('throttle:60,1');
// Search routes group with rate limiting - CHANGED FROM 'search' TO 'searchai'
Route::prefix('searchai')->name('searchai.')->group(function () {
// Link/URL Search - searches in database with pagination
Route::get('/links', [SearchController::class, 'searchLinks'])
    ->name('links')
    ->middleware('throttle:60,1');

// Alternative POST route for search (optional)
Route::post('/links', [SearchController::class, 'searchLinks'])
    ->name('links.post')
    ->middleware('throttle:60,1');

// AI Search - uses Kimi API with conversation support
Route::post('/ai', [SearchController::class, 'aiSearch'])
    ->name('ai')
    ->middleware('throttle:30,1');

// AI Search with streaming (for real-time responses)
Route::post('/ai/stream', [SearchController::class, 'aiSearchStream'])
    ->name('ai.stream')
    ->middleware('throttle:20,1');

// Search suggestions/autocomplete
Route::get('/suggestions', [SearchController::class, 'suggestions'])
    ->name('suggestions')
    ->middleware('throttle:100,1');

// AI Search History (requires authentication or session)
Route::get('/ai/history', [SearchController::class, 'getAISearchHistory'])
    ->name('ai.history')
    ->middleware('throttle:60,1');

// Delete AI Search
Route::delete('/X/{slug}', [SearchController::class, 'deleteAISearch'])
    ->where('slug', '.*')
    ->name('ai.delete')
    ->middleware('throttle:30,1');

// Delete entire conversation
Route::delete('/ai/conversation/{conversationId}', [SearchController::class, 'deleteConversation'])
    ->name('ai.conversation.delete')
    ->middleware('throttle:20,1');

// Popular AI Searches
Route::get('/ai/popular', [SearchController::class, 'getPopularAISearches'])
    ->name('ai.popular')
    ->middleware('throttle:60,1');

Route::post('/private/request-access', [SearchController::class, 'requestPrivateAccess'])
    ->name('private.request-access')
    ->middleware('throttle:5,60'); // 5 requests per hour

Route::post('/private/verify-access', [SearchController::class, 'verifyPrivateAccess'])
    ->name('private.verify-access')
    ->middleware('throttle:10,60'); // 10 requests per hour

Route::get('/private/check-access', [SearchController::class, 'checkPrivateAccess'])
    ->name('private.check-access')
    ->middleware('throttle:30,1'); // 30 requests per minute

Route::post('/private/revoke-access', [SearchController::class, 'revokePrivateAccess'])
    ->name('private.revoke-access')
    ->middleware('throttle:30,1'); // 30 requests per minute

// Admin route to view access logs
Route::get('/private/logs/{conversationId}', [SearchController::class, 'getPrivateAccessLogs'])
    ->name('private.logs')
    ->middleware(['auth', 'throttle:30,1']);

Route::get('/ai-slugs', [SearchController::class, 'searchAISlugs'])
    ->name('ai-slugs')
    ->middleware('throttle:60,1');

});
Route::get('/ai/pinned-conversations-all', [SearchController::class, 'getPinnedConversations']);
// EZAI Routes - Updated with /ezai/ prefix
Route::post('/ezai/check-ezpressstandard-domain', [SearchController::class, 'checkStandardDomainAvailability']);
Route::post('/ezai/check-ezpressstandard-custom', [SearchController::class, 'checkStandardCustomAvailability']);
Route::post('/ezai/couponcodecustomdomain', [SearchController::class, 'couponcodecustomdomain'])->name('couponcodecustomdomain');
Route::post('/ezai/check-user-exists', [SearchController::class, 'checkUserExists']);
Route::post('/ezai/free-purchase', [SearchController::class, 'handleZeroDollarPurchase']);
Route::post('/searchai/check-email-ownership', [SearchController::class, 'checkEmailOwnership'])
    ->name('check-email-ownership')
    ->middleware('throttle:30,1');
Route::post('/ezai/free-purchase-after-login', [SearchController::class, 'handleZeroDollarPurchaseafterlogin']);
Route::post('/ezai/initiate-domain-homepayment', [SearchController::class, 'initiateDomainPayment']);
Route::post('/ezai/initiate-domain-homepayment-after-login', [SearchController::class, 'initiateDomainPaymentafterlogin']);
Route::post('/ezai/home-domain-handle-success', [SearchController::class, 'domainpaymentsuccess']);
Route::post('/ezai/home-domain-handle-success-after-login', [SearchController::class, 'domainpaymentsuccessafterlogin']);

Route::get('auth/google', [GoogleController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);
Route::get('/auth/linkedin/redirect', [SocialiteLoginController::class, 'redirectToLinkedIn'])->name('login.linkedin');
Route::get('/auth/linkedin/callback', [SocialiteLoginController::class, 'handleLinkedInCallback']);
Route::get('auth/reddit', [RedditAuthController::class, 'redirect'])->name('auth.reddit');
Route::get('auth/reddit/callback', [RedditAuthController::class, 'callback']);
Route::get('/_oki',[WelcomeController::class, 'domainfunnel'])->name('domainfunnel');
Route::prefix('public')->name('public.')->group(function () {
    Route::get('/ai/history', [PublicAIHistoryController::class, 'index'])->name('ai.history');
    Route::get('/ai/history/load-more', [PublicAIHistoryController::class, 'loadMore'])->name('ai.history.load-more');
});
Route::prefix('comments')->name('comments.')->group(function () {
    Route::get('/', [CommentController::class, 'getComments'])->name('index');
    Route::post('/', [CommentController::class, 'store'])->name('store')->middleware('throttle:30,1');
    Route::post('/ask-ai', [SearchController::class, 'aiSearch'])->name('ask-ai')->middleware('throttle:30,1');
    Route::delete('/{id}', [CommentController::class, 'destroy'])->name('destroy');
});

Route::prefix('content')->name('content.')->group(function () {
    Route::post('/comment', [UnifiedContentController::class, 'submitComment'])
        ->name('comment')
        ->middleware('throttle:30,1');

    Route::post('/upload', [UnifiedContentController::class, 'uploadFile'])
        ->name('upload')
        ->middleware('throttle:20,1');

    Route::get('/file/{slug}', [UnifiedContentController::class, 'getFile'])
        ->name('file')
        ->where('slug', '.*');

    Route::get('/conversation/{conversationId}', [UnifiedContentController::class, 'getConversation'])
        ->name('conversation')
        ->middleware('throttle:60,1');

    Route::post('/obsidian-wiki', [UnifiedContentController::class, 'storeObsidianWiki'])
        ->name('obsidian-wiki')
        ->middleware('throttle:30,1');

    Route::post('/obsidian-wiki/auto-pilot', [UnifiedContentController::class, 'autoPilotObsidianNote'])
        ->name('obsidian-wiki.auto-pilot')
        ->middleware('throttle:30,1');

    Route::post('/wiki', [UnifiedContentController::class, 'storeWiki'])
        ->name('wiki.store')
        ->middleware('throttle:30,1');

    Route::post('/wiki/upload-file', [UnifiedContentController::class, 'uploadWikiFile'])
        ->name('wiki.upload-file')
        ->middleware('throttle:30,1');

    // Social Media Content Routes
    Route::post('/social', [SocialContentController::class, 'store'])
        ->name('social.store')
        ->middleware('throttle:30,1');

    Route::get('/social/{slug}', [SocialContentController::class, 'show'])
        ->name('social.show')
        ->where('slug', '.*');

    Route::put('/social/{slug}', [SocialContentController::class, 'update'])
        ->name('social.update')
        ->where('slug', '.*')
        ->middleware(['auth', 'throttle:30,1']);

    Route::get('/social', [SocialContentController::class, 'index'])
        ->name('social.index')
        ->middleware('throttle:60,1');

    Route::delete('/social/{slug}', [SocialContentController::class, 'destroy'])
        ->name('social.destroy')
        ->where('slug', '.*')
        ->middleware('throttle:30,1');

    Route::post('/landing-page', [UnifiedContentController::class, 'createLandingPage'])
        ->name('landing-page')
        ->middleware('throttle:30,1');

    // ============================================================
    // GEO Slug Save Route - For the "Slug For GEO" feature
    // ============================================================
    Route::post('/geoslug', [UnifiedContentController::class, 'saveGeoslug'])
        ->name('geoslug.save')
        ->middleware('throttle:30,1');
});
// Route for the 3D effect page
Route::get('/3d-effect', [EffectController::class, 'show'])->name('effect.show');

// API route for getting effect data
Route::get('/api/effect-data', [EffectController::class, 'getEffectData'])->name('effect.api');
Route::prefix('api/extension')->group(function () {
    Route::get('/links', [App\Http\Controllers\ExtensionApiController::class, 'searchLinks']);
    Route::get('/ai-slugs', [App\Http\Controllers\ExtensionApiController::class, 'searchAISlugs']);
    Route::get('/suggestions', [App\Http\Controllers\ExtensionApiController::class, 'suggestions']);
    Route::get('/popular', [App\Http\Controllers\ExtensionApiController::class, 'popularSearches']);
    Route::post('/track', [App\Http\Controllers\ExtensionApiController::class, 'trackSearch']);
    Route::get('/health', [App\Http\Controllers\ExtensionApiController::class, 'health']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/pagegen/generate-page', function () {
        return Inertia::render('GeneratePage');
    })->name('generate.page');
    Route::get('/dashboard', [UnifiedDashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/refresh', [UnifiedDashboardController::class, 'refresh'])->name('dashboard.refresh');
    Route::get('/dashboard/export', [UnifiedDashboardController::class, 'exportData'])->name('dashboard.export');
    Route::get('/ai/dashboard', [AIDashboardController::class, 'index'])->name('ai.dashboard');
    Route::get('/ai/dashboard/export', [AIDashboardController::class, 'exportData'])->name('ai.dashboard.export');

    Route::prefix('ai')->name('ai.')->group(function () {
        Route::patch('/message/{slug}/update-content', [AIHistoryController::class, 'updateMessageContent'])
            ->name('message.update-content')
            ->middleware('throttle:30,1');
        Route::get('/history', [AIHistoryController::class, 'index'])->name('history');
        Route::get('/history/load-more', [AIHistoryController::class, 'loadMore'])->name('history.load-more');
        Route::get('/conversation/{slug}', [AIHistoryController::class, 'show'])->name('conversation.show');
        Route::delete('/conversation/{conversationId}', [AIHistoryController::class, 'destroy'])->name('conversation.delete');
        Route::patch('/conversation/{conversationId}/status', [AIHistoryController::class, 'updateStatus'])->name('conversation.status');
        
        // ============================================================
        // HASHTAG ROUTE - Add this line for updating hashtags
        // ============================================================
        Route::patch('/conversation/{conversationId}/hashtag', [AIHistoryController::class, 'updateHashtag'])
            ->name('conversation.hashtag')
            ->middleware('throttle:30,1');
        
        Route::get('/conversation/check-slug-availability', [AIHistoryController::class, 'checkSlugAvailability'])
            ->name('conversation.check-slug')
            ->middleware('throttle:60,1');
        Route::get('/conversation/{conversationId}/private-settings', [AIHistoryController::class, 'getPrivateSettings'])
            ->name('conversation.private-settings')
            ->middleware('throttle:30,1');
        Route::patch('/conversation/{conversationId}/private-settings', [AIHistoryController::class, 'updatePrivateSettings'])
            ->name('conversation.update-private-settings')
            ->middleware('throttle:30,1');

        // AI User Settings Routes - Updated to use the correct paths
        Route::get('/user-settings', [AIUserSettingsController::class, 'index'])
            ->name('user.settings');

        Route::post('/user-settings/update-profile', [AIUserSettingsController::class, 'updateProfile'])
            ->name('user.settings.update-profile')
            ->middleware('throttle:30,1');

        Route::delete('/user-settings/remove-avatar', [AIUserSettingsController::class, 'removeAvatar'])
            ->name('user.settings.remove-avatar')
            ->middleware('throttle:30,1');

        Route::post('/user-settings/update-password', [AIUserSettingsController::class, 'updatePassword'])
            ->name('user.settings.update-password')
            ->middleware('throttle:10,1');

        Route::post('/user-settings/update', [AIUserSettingsController::class, 'update'])
            ->name('user.settings.update')
            ->middleware('throttle:30,1');

        Route::get('/user-settings/settings', [AIUserSettingsController::class, 'getSettings'])
            ->name('user.settings.get')
            ->middleware('throttle:30,1');

        Route::get('/user-settings/profile', [AIUserSettingsController::class, 'getProfile'])
            ->name('user.settings.profile')
            ->middleware('throttle:30,1');

        // ============================================================
        // MESSAGE ORDER ROUTE - For reordering messages in a conversation
        // ============================================================
        Route::patch('/conversation/{conversationId}/message-order', [AIHistoryController::class, 'updateMessageOrder'])
            ->name('conversation.message-order')
            ->middleware('throttle:30,1');
    });

    Route::patch('/ai/conversation/{conversationId}/landing-page', [AIHistoryController::class, 'updateLandingPage'])
        ->name('ai.conversation.landing-page')
        ->middleware('throttle:30,1');
    Route::post('/ai/conversation/{conversationId}/toggle-pin', [AIHistoryController::class, 'togglePin'])->name('ai.history.toggle-pin');
    Route::get('/ai/pinned-conversations', [AIHistoryController::class, 'getPinnedConversations'])->name('ai.history.pinned');

    Route::middleware(['web'])->group(function () {
        // Message-level operations
        Route::patch('/ai/message/{slug}/status', [AIHistoryController::class, 'updateMessageStatus'])
            ->name('ai.message.status')
            ->middleware('throttle:30,1');
        Route::patch('/ai/message/{slug}/content', [UnifiedContentController::class, 'updateMessageContent'])
            ->name('ai.message.content')
            ->middleware('throttle:30,1');
        Route::delete('/ai/message/{slug}', [AIHistoryController::class, 'deleteMessage'])
            ->name('ai.message.delete')
            ->middleware('throttle:20,1');
    });
    Route::post('/content/update-upload', [UnifiedContentController::class, 'updateUpload'])
        ->name('content.update-upload')
        ->middleware(['web', 'throttle:30,1']);
    Route::get('/ai/conversation/{conversationId}/private-access-logs', [AIHistoryController::class, 'getPrivateAccessLogs'])
        ->name('ai.conversation.private-access-logs')
        ->middleware('throttle:30,1');
    Route::patch('/ai/conversation/{conversationId}/slug', [AIHistoryController::class, 'updateSlug'])
        ->name('ai.conversation.slug')
        ->middleware('throttle:30,1');
    Route::get('/ai/conversation/suggest-slug', [AIHistoryController::class, 'suggestSlug'])
        ->name('conversation.suggest-slug')
        ->middleware('throttle:60,1');
    Route::patch('/ai/conversation/{conversationId}/title', [AIHistoryController::class, 'updateTitle'])
        ->name('ai.conversation.title')
        ->middleware('throttle:30,1');
    //Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    //Route::post('/dashboard/refresh', [DashboardController::class, 'refresh'])->name('dashboard.refresh');
    Route::get('/eztheme', [WelcomeController::class, 'eztheme'])->name('eztheme');
    Route::get('/load-more', [WelcomeController::class, 'loadMore']);
    Route::post('/themes', [WelcomeController::class, 'store']);
    Route::post('/themecollections', [WelcomeController::class, 'themefunnel']);
    Route::put('/themesedit/{theme}', [WelcomeController::class, 'update']);
    Route::delete('/themes/{theme}', [WelcomeController::class, 'destroy'])->name('themes.destroy');
    Route::get('/search-themes', [WelcomeController::class, 'searchThemes']);

    Route::get('/ezlist', [EzFunnelController::class, 'ezlist'])->name('ezlist');
    Route::post('/ezfunnelpostinlinkedin', [SocialiteLoginController::class, 'ezfunnelpostinlinkedin']);
    Route::post('/ezframepostinlinkedin', [SocialiteLoginController::class, 'ezframepostinlinkedin']);
    Route::post('/ezfunnelpostinreddit', [RedditAuthController::class, 'ezfunnelpostinreddit']);
    Route::post('/ezframepostinreddit', [RedditAuthController::class, 'ezframepostinreddit']);
    Route::get('/loadframe/demo', [LoadframeController::class, 'demo']);
    Route::post('/save-ez-funnel', [EzFunnelController::class, 'store']);
    Route::get('/templates', [WelcomeController::class, 'getTemplates']);
    Route::get('/paidtemplates', [WelcomeController::class, 'getTemplatespaid']);
    Route::get('/search-ez-funnels', [EzFunnelController::class, 'search']);
    Route::put('/update-ez-funnel', [EzFunnelController::class, 'update']);
    Route::post('/store-preview-data', [EzFunnelController::class, 'storePreviewData']);
    Route::get('/preview/{id?}', [EzFunnelController::class, 'preview'])->name('ezfunnel.preview');
    Route::get('/generate-bio-excreate', [EzFunnelController::class, 'generatebioexcreate']);
    Route::delete('/ez-funnels/{id}', [EzFunnelController::class, 'destroy']);
    Route::delete('/custom-domains/{id}', [EzFunnelController::class, 'destroyCustomDomain']);
    Route::delete('/handle-domains/{id}', [EzFunnelController::class, 'destroyHandleDomain']);

    Route::get('/ezui', [EzFunnelController::class, 'ezui'])->name('ezui');
    Route::get('/edit-ez-funnel/{id}', [EzFunnelController::class, 'edit'])->name('edit-ez-funnel');
    Route::put('/update-eztheme-funnel', [EzFunnelController::class, 'updateezui'])->name('update-eztheme-funnel');
    Route::put('/update-ez-funnel-theme', [EzFunnelController::class, 'updateezuitheme'])->name('update-ez-funnel-theme');

    Route::get('/ezseo', [EzFunnelController::class, 'ezseo'])->name('ezseo');
    Route::get('/get-funnel-seo/{id}', [EzFunnelController::class, 'getSeo'])->name('get-funnel-seo');
    Route::put('/update-funnel-seo', [EzFunnelController::class, 'updateSeo'])->name('update-funnel-seo');

    Route::get('/ezlogo', [EzFunnelController::class, 'ezlogo'])->name('ezlogo');
    Route::get('/get-funnel-logo/{id}', [EzFunnelController::class, 'getFunnelLogo'])->name('get-funnel-logo');
    Route::post('/update-funnel-logo', [EzFunnelController::class, 'updateFunnelLogo'])->name('update-funnel-logo');

    Route::get('/ezhashtag', [EzFunnelController::class, 'ezhashtag'])->name('ezhashtag');
    Route::put('/handle-domains/{domain}/hashtag', [EzFunnelController::class, 'updateHandleDomainHashtag'])->name('update-handle-domain-hashtag');
    Route::put('/custom-domains/{domain}/hashtag', [EzFunnelController::class, 'updateCustomDomainHashtag'])->name('update-custom-domain-hashtag');
    Route::put('/funnels/{funnel}/seo-tag', [EzFunnelController::class, 'updateSeoTag'])->name('update-seo-tag');

    Route::get('/ezhandle', [WelcomeController::class, 'ezhandle'])->name('ezhandle');
    Route::post('/check-handle-availability', [WelcomeController::class, 'ezhandleavalablecheck'])->name('ezhandleavalablecheck');
    Route::post('/couponcodecustom', [WelcomeController::class, 'couponcodecustom'])->name('couponcodecustom');
    Route::post('/update-ez-funnel-handle/{id}', [WelcomeController::class, 'updateEzFunnelHandle'])->name('updateEzFunnelHandle');
    Route::post('/initiate-handle-payment', [WelcomeController::class, 'initiateHandlePayment']);
    Route::post('/handle-success', [WelcomeController::class, 'paymentsuccess']);

    Route::get('/ezdomain', [WelcomeController::class, 'ezdomain'])->name('ezdomain');
    Route::post('/check-domain-availability', [WelcomeController::class, 'ezdomainavalablecheck'])->name('ezdomainavalablecheck');
    Route::post('/update-ezdomain-funnel-handle/{id}', [WelcomeController::class, 'updateEzdomainFunnelHandle'])->name('updateEzdomainFunnelHandle');
    Route::post('/initiate-domain-payment', [WelcomeController::class, 'initiateDomainPayment']);
    Route::post('/domain-handle-success', [WelcomeController::class, 'domainpaymentsuccess']);

    Route::get('/handlepurchasehistory', [WelcomeController::class, 'handlepurchasehistory'])->name('handlepurchasehistory');
    Route::get('/handle-invoice/{invoice_number}', [WelcomeController::class, 'showHandleInvoice'])->name('handle.invoice.show');
    Route::get('/token-transactions', [WelcomeController::class, 'tokenTransactions'])->name('token.transactions');

    Route::get('/themepurchasehistory', [WelcomeController::class, 'themepurchasehistory'])->name('themepurchasehistory');
    Route::get('/seller/theme-history', [WelcomeController::class, 'sellerThemeHistory'])->name('seller.theme.history');
    Route::get('/seller/earnings-summary', [WelcomeController::class, 'sellerEarningsSummary'])->name('seller.earnings.summary');
    Route::get('/seller/sales-analytics', [WelcomeController::class, 'salesAnalytics'])->name('seller.sales.analytics');
    Route::get('/theme-invoice/{invoiceNumber}', [WelcomeController::class, 'showThemeInvoice'])->name('theme.invoice');
    Route::get('/theme-sell-invoice/{invoiceNumber}', [WelcomeController::class, 'showThemeSellInvoice'])->name('theme.sell.invoice');

    Route::get('/purchase', [PaymentController::class, 'showPurchaseForm'])->name('purchase');
    Route::get('/purchasehistory', [PaymentController::class, 'purchasehistory'])->name('purchasehistory');
    Route::get('/invoice/{invoice_number}', [PaymentController::class, 'showInvoice'])->name('invoice.show');
    Route::prefix('buy-bee')->group(function () {
        Route::post('/initiate', [PaymentController::class, 'initiatePurchase']);
        Route::post('/success', [PaymentController::class, 'handlePaymentSuccess']);
        Route::get('/balance', [PaymentController::class, 'getBalance']);
        Route::get('/point-price', [PaymentController::class, 'getPointPrice']);
    });

    Route::get('/ez-sell-price', [EzSellController::class, 'ezsellprice'])->name('ezsellprice');
    Route::post('/save-domain-price', [EzSellController::class, 'saveDomainPrice'])->name('save.domain.price');
    Route::get('/search-ez-funnelsell', [EzSellController::class, 'searchsell']);

    Route::get('/sendbee', [PaymentController::class, 'showsendForm'])->name('sendbee');
    Route::post('/send-bee', [PaymentController::class, 'sendBeePoints'])->name('send.bee');
    Route::get('/transfer-history', [PaymentController::class, 'transferHistory'])->name('transfer.history');
    Route::get('/invoicesendbee/{invoice_number}', [PaymentController::class, 'showSendBeeInvoice'])->name('invoice.sendbee.show');

    Route::post('/purchase-domain', [MarketplaceController::class, 'purchaseDomain'])->name('marketplace.purchase');
    Route::get('/pending-transfers', [MarketplaceController::class, 'pendingtransferlist'])->name('pendingtransferlist');
    Route::post('/seller/transfers/respond', [MarketplaceController::class, 'confirmTransfer']);
    Route::get('/refund-transfers', [MarketplaceController::class, 'refundtransferlist'])->name('refundtransferlist');
    Route::get('/refund-transfers/load-more', [MarketplaceController::class, 'loadMoreRefundTransfers']);
    Route::get('/handlesellhistory', [MarketplaceController::class, 'handlesellhistory'])->name('handlesellhistory');
    Route::get('/handle-sell-invoice/{invoice_number}', [MarketplaceController::class, 'showHandleSellInvoice'])->name('handle.sell.invoice.show');
    Route::get('/refundinvoiceseller/{invoice_number}', [MarketplaceController::class, 'showRefundInvoiceseller'])->name('seller.refund.invoice.show');
    Route::get('/refundinvoicebuyer/{invoice_number}', [MarketplaceController::class, 'showRefundInvoicebuyer'])->name('buyer.refund.invoice.show');

    Route::get('/ez-transfer', [HandleTransferController::class, 'index'])->name('eztransfer');
    Route::get('/transfer/history', [HandleTransferController::class, 'transferHistory'])->name('transfer.history');
    Route::post('/generate-transfer-token', [HandleTransferController::class, 'generateToken']);
    Route::post('/redeem-transfer-token', [HandleTransferController::class, 'redeemToken']);

    Route::get('/incentivehistory', [IncentiveHistoryController::class, 'index'])->name('incentivehistory');
    Route::get('/incentivehistory/load-more', [IncentiveHistoryController::class, 'loadMore']);
    Route::get('/invoiceincentive/{invoiceNumber}', [IncentiveHistoryController::class, 'showInvoice'])->name('incentive.invoice.show');

    Route::get('/analytics', [AnalyticsController::class, 'ezAnalytics'])->name('analytics');
    Route::get('/get-funnel-analytics/{funnelId}', [AnalyticsController::class, 'getFunnelAnalytics'])->name('analytics.get');
    Route::get('/search-ez-funnels-analytics', [AnalyticsController::class, 'searchEzFunnels'])->name('funnels.search');

    Route::prefix('my-coupons')->name('my-coupons.')->group(function () {
        Route::get('/', [CouponUsageController::class, 'index'])->name('index');
        Route::get('/list', [CouponUsageController::class, 'loadMore'])->name('list');
        Route::get('/statistics', [CouponUsageController::class, 'getStatistics'])->name('statistics');
    });

    Route::get('/pages-list/stats', [PageListController::class, 'getStats'])->name('pages.stats');
    Route::get('/pages-list/search', [PageListController::class, 'search'])->name('pages.search');
    Route::get('/pages-list/export', [PageListController::class, 'export'])->name('pages.export');
    Route::post('/pages-list/bulk-delete', [PageListController::class, 'bulkDelete'])->name('pages.bulk-delete');
    Route::get('/pages-list/analytics', [PageListController::class, 'getAnalytics'])->name('pages.analytics');
    Route::get('/pages-list/check-slug', [PageListController::class, 'checkSlugAvailability'])->name('pages.check-slug');
    Route::get('/pages-list/load-more', [PageListController::class, 'loadMore'])->name('pages.load-more');
    Route::get('/pages-list', [PageListController::class, 'index'])->name('pages.index');
    Route::get('/pages-list/{id}', [PageListController::class, 'show'])->name('pages.show');
    Route::put('/pages-list/{id}/content', [PageListController::class, 'updateContent'])->name('pages.update-content');
    Route::put('/pages-list/{id}', [PageListController::class, 'update'])->name('pages.update');
    Route::delete('/pages-list/{id}', [PageListController::class, 'destroy'])->name('pages.destroy');
    Route::post('/pages-generate', [PageController::class, 'store'])->name('pages.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
Route::get('/page-preview/{slug}', [PageListController::class, 'preview'])->name('pages.preview');
Route::get('/page/{slug}', [PageController::class, 'view'])->name('pages.view');
Route::get('/video-remix', [VideoRemixController::class, 'index']);
Route::post('/api/video-remix/create-from-images', [VideoRemixController::class, 'createFromImages']);
Route::post('/api/video-remix/overlay-images', [VideoRemixController::class, 'overlayImages']);
Route::post('/api/video-remix/create-slideshow', [VideoRemixController::class, 'createSlideshow']);
Route::post('/api/video-remix/add-text', [VideoRemixController::class, 'addTextOverlay']);
Route::post('/api/video-remix/extract-frames', [VideoRemixController::class, 'extractFrames']);
Route::get('/api/video-remix/download/{filename}', [VideoRemixController::class, 'downloadVideo'])->name('video.download');
Route::post('/techchatbot/chatbot', [ChatbotController::class, 'chat']);
Route::get('/wiki/{slug}', [WikiPageController::class, 'show'])->name('wiki.show');
Route::post('/check-custom-domain', [HomeController::class, 'checkCustomDomainAvailability']);
Route::post('/check-standard-domain', [HomeController::class, 'checkStandardDomainAvailability']);
Route::post('/check-ezpressstandard-domain', [ThemeController::class, 'checkStandardDomainAvailability']);
Route::get('/market-place-cronjob', [MarketplaceController::class, 'confirmTransfertwodaysafter'])->name('confirmTransfertwodaysafter');
Route::get('/cron-job-ezfunnel', [FunnelcontentController::class, 'cronjobezfunnel'])->name('cronjobezfunnel');
Route::get('/home', [HomeController::class, 'demodesign'])->name('demodesign');
Route::post('/funnel-content-oki', [FunnelcontentController::class, 'storeezfunneloki']);
Route::get('/previewlink', [FunnelcontentController::class, 'previewlink']);
Route::post('/initiate-domain-homepayment', [HomeController::class, 'initiateDomainPayment']);
Route::post('/initiate-handle-homepayment', [HomeController::class, 'initiateHandlePayment']);
Route::post('/couponcodecustomdomain', [HomeController::class, 'couponcodecustomdomain'])->name('couponcodecustomdomain');
Route::post('/home-handle-success', [HomeController::class, 'paymentsuccess']);
Route::post('/free-purchase', [HomeController::class, 'handleZeroDollarPurchase']);
Route::post('/home-domain-handle-success', [HomeController::class, 'domainpaymentsuccess']);
Route::get('/user-balance', [FunnelcontentController::class, 'getuserbalance'])->name('getuserbalance');
Route::get('/privacy-policy', [WelcomeController::class, 'privacypolicy'])->name('privacypolicy');
Route::get('/terms-and-conditions', [WelcomeController::class, 'termsandconditions'])->name('termsandconditions');
Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace');
Route::get('/marketplace/load-more', [MarketplaceController::class, 'loadmore'])->name('marketplace.loadmore');
Route::post('/marketplace/initiate-domain-payment', [MarketplaceController::class, 'initiateDomainPayment']);
Route::post('/marketplace/domain-payment-success', [MarketplaceController::class, 'domainPaymentSuccess']);
Route::post('/funnel-content', [FunnelcontentController::class, 'storeezfunnel']);
Route::post('/send-otp', [EmailVerificationController::class, 'sendOtp']);
Route::post('/verify-otp', [EmailVerificationController::class, 'verifyOtp']);
Route::post('/resend-otp', [EmailVerificationController::class, 'resendOtp']);
Route::get('/check-theme-collection/{themeId}', [WelcomeController::class, 'checkCollection']);
Route::post('/add-to-collection', [WelcomeController::class, 'addToCollection']);
Route::post('/theme/purchase', [WelcomeController::class, 'purchaseTheme'])->name('theme.purchase');
Route::get('/T{theme}', [ThemeController::class, 'preview']);
Route::get('/F{frame}', [FunnelcontentController::class, 'preview']);
Route::get('/offer/{offer}', [HomeController::class, 'offer']);
Route::post('/theme/initiate-domain-homepayment', [ThemeController::class, 'initiateDomainPayment']);
Route::post('/theme/check-collection-by-email', [ThemeController::class, 'checkCollectionByEmail']);
Route::post('/theme/initiate-handle-homepayment', [ThemeController::class, 'initiateHandlePayment']);
Route::post('/theme/couponcodecustomdomain', [ThemeController::class, 'couponcodecustomdomain'])->name('couponcodecustomdomain');
Route::post('/theme/home-handle-success', [ThemeController::class, 'paymentsuccess']);
Route::post('/theme/free-purchase', [ThemeController::class, 'handleZeroDollarPurchase']);
Route::post('/theme/home-domain-handle-success', [ThemeController::class, 'domainpaymentsuccess']);
Route::post('/reactions', [WelcomeController::class, 'storelikedislike']);
Route::get('/reactions/{funnelid}', [WelcomeController::class, 'getCounts']);
Route::get('/processmp4', [VideoProcessorController::class, 'processmp4']);
Route::post('/process-video', [VideoProcessorController::class, 'processVideo']);
Route::get('/process-url', [GetmetadataController::class, 'checkUrl']);
Route::post('/check-user-exists', [HomeController::class, 'checkUserExists']);
Route::get('/mail-extract', [MailExtractController::class, 'mailextract']);
Route::get('/search/hashtag', [SocialMediaSearchController::class, 'searchByHashtag']);
Route::get('/search/load-more', [SocialMediaSearchController::class, 'loadMore'])->name('search.loadmore');
Route::get('/template-marketplace', [TemplateMarketplaceController::class, 'index'])->name('templatemarketplace');
Route::get('/template-marketplace/load-more', [TemplateMarketplaceController::class, 'loadmore'])->name('templatemarketplace.loadmore');
Route::post('/theme/initiate-template-payment', [TemplateMarketplaceController::class, 'initiateTemplatePayment']);
Route::post('/theme/free-template-purchase', [TemplateMarketplaceController::class, 'handleZeroDollarTemplatePurchase']);
Route::post('/theme/template-payment-success', [TemplateMarketplaceController::class, 'templatePaymentSuccess']);
Route::get('/re-box', [OmniboxController::class, 'index'])->name('omnibox');
Route::get('/omnibox/search', [OmniboxController::class, 'search'])->name('omnibox.search');
Route::get('/omnibox/quick-actions', [OmniboxController::class, 'quickActions'])->name('omnibox.quick-actions');
Route::post('/omnibox/direct-action', [OmniboxController::class, 'directAction'])->name('omnibox.direct-action');
Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/{funnel}', [WelcomeController::class, 'funnel'])->middleware('track.visitor');