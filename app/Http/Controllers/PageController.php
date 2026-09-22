<?php

namespace App\Http\Controllers;

use App\Models\PageGenerate;
use App\Models\Defaultpage;
use App\Models\EzFunnel;
use App\Models\Template;
use App\Models\Themecollection;
use App\Models\EzFunnelField;
use App\Models\FunnelLogoSetting;
use App\Models\FunnelSeoSetting;
use App\Models\Emaildesign;
use App\Services\HtmlParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PageController extends Controller
{
    public function __construct(
        private HtmlParserService $htmlParser,
    ) {}

    public function store(Request $request): JsonResponse
    {
        set_time_limit(300);

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'htmlContent' => 'required|string|min:1|max:50000000',
                'customSlug' => 'nullable|string|max:255|regex:/^[a-z0-9-]+$/',
            ]);

            $htmlContent = $validated['htmlContent'];
            $slug = $validated['customSlug'] ?? $this->generateSlug();

            if (PageGenerate::where('slug', $slug)->exists()) {
                return response()->json(['error' => 'Slug already exists'], 409);
            }

            $parsed = $this->htmlParser->processHtml($htmlContent);
			
			$user_id=Auth::id();
            $page = PageGenerate::create([
				'user_id' => Auth::id(),
                'slug' => $slug,
                'title' => $validated['title'] ?: $parsed['title'],
                'html_content' => $htmlContent,
                'processed_html' => $parsed['processedHtml'],
                'secrets' => !empty($parsed['secrets']) ? json_encode($parsed['secrets']) : null,
            ]);
			$domainfull = idn_to_utf8('ez.wiki');
			$defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
				$query->where('domain', $domainfull);
			})->first();
			
			$originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
			$themeData = [
				'user_id' => $user_id,
				'title' => $validated['title'] ?: $parsed['title'],
				'description' => $validated['title'] ?: $parsed['title'],
				'price' => 0,
				'leftwidth' => 0,
				'rightwidth' => 0,
				'option' => 'autoplay',
				'bgcolour' => '#000000',
				'image' => 'https://ez.wiki/page/'.urldecode($slug),
				'status' => 'active'
			];
                
			$theme = Template::create($themeData);
			$themetemplate = null;
		
			if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				if ($theme->id !== null) {
					$templateIds = [$theme->id];
					$themeIds = array_merge($templateIds, $themeIds);
				}
				$themetemplate = implode(',', $themeIds);
			}
			$themetemplate = $theme->id;
                
			$clonedFunnel = $originalFunnel->replicate();
			$clonedFunnel->displaymode = 'page';
			$clonedFunnel->user_id = $user_id;
			$clonedFunnel->theme = $themetemplate;
			$clonedFunnel->pageid = $page->id;
			$clonedFunnel->save(); 
                
			if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				$existingThemes = Themecollection::where('user_id', $user_id)
					->whereIn('theme_id', $themeIds)
					->pluck('theme_id')
					->toArray();
				
				$newThemes = array_diff($themeIds, $existingThemes);
				$userID = $user_id;
				$themeData = array_map(function($themeId) use ($userID) {
					return [
						'user_id' => $userID,
						'theme_id' => $themeId
					];
				}, $newThemes);

				if (!empty($themeData)) {
					Themecollection::insert($themeData);
				}
			}
                
			$originalFields = EzFunnelField::where('ez_funnel_id', $defaultpage->handle_id)->get();
			foreach ($originalFields as $originalField) {
				$clonedField = $originalField->replicate();
				$clonedField->ez_funnel_id = $clonedFunnel->id;
				$clonedField->unique_id = null;
				$clonedField->save();
			}

			$originalLogo = FunnelLogoSetting::where('funnel_id', $defaultpage->handle_id)->first();
			if ($originalLogo) {
				$clonedLogo = $originalLogo->replicate();
				$clonedLogo->funnel_id = $clonedFunnel->id;
				$clonedLogo->save();
			}

			$originalSeo = FunnelSeoSetting::where('funnel_id', $defaultpage->handle_id)->first();
			if ($originalSeo) {
				$clonedSeo = $originalSeo->replicate();
				$clonedSeo->funnel_id = $clonedFunnel->id;
				$clonedSeo->save();
			}
			if(Auth::check())
			{
				$ezFunnel = EzFunnel::findOrFail($clonedFunnel->id);
				$emaildesign = Emaildesign::where('id', 34)->first();
				$fullfunnel="https://ez.wiki/".$ezFunnel->token;
				$str = ['{fullfunnel}', '{url}', '{createdate}'];
				$rplc = [$fullfunnel, $fullfunnel, now()];
				$div = str_replace($str, $rplc, $emaildesign['design']);
				$mailData = ['design' => $div];
				$email = Auth::user()->email;
				try {
					$subject = "Ez.wiki Congratulations on your new html page.";
					Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
					Mail::getSymfonyTransport()->stop();
				} catch (\Exception $e) {
					$subject = "Ez.wiki Congratulations on your new html page.";
					@mail($email, $subject, $div, null, 'funnel@ez.wiki');
				}
			}
			
            return response()->json([
                'success' => true,
                'pageId' => $page->id,
                'slug' => $page->slug,
                'secretsFound' => count($parsed['secrets']),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile() . ':' . $e->getLine()], 500);
        }
    }

    public function show(string $slug): JsonResponse
    {
        try {
            $page = PageGenerate::select('id', 'slug', 'title', 'secrets', 'created_at', 'updated_at')
                ->where('slug', $slug)
                ->firstOrFail();

            return response()->json([
                'id' => $page->id,
                'slug' => $page->slug,
                'title' => $page->title,
                'hasSecrets' => $page->has_secrets,
                'createdAt' => $page->created_at,
                'updatedAt' => $page->updated_at,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Page not found'], 404);
        }
    }

    public function list(): JsonResponse
    {
        $pages = PageGenerate::select('id', 'slug', 'title', 'created_at', 'updated_at')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($pages);
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $page = PageGenerate::findOrFail($id);
            $page->delete();
            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to delete'], 500);
        }
    }

    public function serve(string $slug)
    {
        try {
            $page = PageGenerate::where('slug', $slug)->firstOrFail();

            $html = null;
            if (!empty($page->processed_html)) {
                $secretsJson = $page->getAttributes()['secrets'] ?? null;
                $html = $this->htmlParser->renderPage($page->processed_html, $secretsJson);
            } elseif (!empty($page->html_content)) {
                $html = $page->html_content;
            }

            if (empty($html)) {
                return response('<h1>Empty Page</h1>', 200, ['Content-Type' => 'text/html']);
            }

            return response($html, 200, [
                'Content-Type' => 'text/html; charset=utf-8',
                'X-Frame-Options' => 'SAMEORIGIN',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response('<h1>Page Not Found</h1>', 404, ['Content-Type' => 'text/html']);
        } catch (\Throwable $e) {
            return response('<h1>Server Error</h1><p>' . htmlspecialchars($e->getMessage()) . '</p>', 500, ['Content-Type' => 'text/html']);
        }
    }

    public function view(string $slug)
    {
        try {
            $page = PageGenerate::where('slug', $slug)->firstOrFail();

            $restoredHtml = null;
            if (!empty($page->processed_html)) {
                $secretsJson = $page->getAttributes()['secrets'] ?? null;
                $restoredHtml = $this->htmlParser->renderPage($page->processed_html, $secretsJson);
            } elseif (!empty($page->html_content)) {
                $restoredHtml = $page->html_content;
            }

            return Inertia::render('PageView', [
                'page' => [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'hasSecrets' => $page->has_secrets,
                    'restoredHtml' => $restoredHtml,
                    'createdAt' => $page->created_at,
                    'updatedAt' => $page->updated_at,
                ],
            ]);
        } catch (\Throwable $e) {
            return redirect('/')->with('error', 'Page not found: ' . $slug);
        }
    }

    private function generateSlug(): string
    {
        return base_convert((string) time(), 10, 36) . '-' . substr(Str::random(6), 0, 6);
    }
}